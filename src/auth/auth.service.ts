import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UserStatus } from 'src/user/entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  saltOrRounds = 12;

  getMe(token: string) {
    this.jwtService.decode(token);
    return token;
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userService.getUserByEmail(email);

    if (!user || user.status === UserStatus.ARHIVE)
      throw new HttpException(
        'User with this email not exists',
        HttpStatus.NOT_FOUND,
      );

    // if (user.status === UserStatus.NEW)
    //   throw new HttpException(
    //     'Confirm your email address',
    //     HttpStatus.BAD_REQUEST,
    //   );

    if (user.status === UserStatus.INACTIVE)
      throw new HttpException('Your account is inactive', HttpStatus.FORBIDDEN);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('login', isMatch, password, user.password);

    if (!isMatch)
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);

    const payload = { sub: user._id, role: user.role, status: user.status };

    return {
      accessToken: await this.createToken(payload, '7d'),
    };
  }

  async registration(data: LoginDto) {
    const isExist = await this.userService.getUserByEmail(data.email);

    if (isExist && isExist.status !== UserStatus.ARHIVE)
      throw new HttpException('User is already exists', HttpStatus.CONFLICT);

    let res;

    if (isExist && isExist.status === UserStatus.ARHIVE) {
      res = await this.userService.update(isExist._id.toString(), {
        ...data,
        status: data?.status ? data.status : UserStatus.NEW,
      });
    } else {
      res = await this.userService.create({
        ...data,
        status: data?.status ? data.status : UserStatus.NEW,
      });
    }

    if (!res)
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);

    // После регистрации авторизация и сразу токен
    const confirmToken = await this.createToken(
      { sub: res._id, email: data.email },
      '7d',
    );

    await this.userService.update(res._id.toString(), { confirmToken });

    const confirmLink = `${process.env.FE_URL}/auth/confirm?token=${confirmToken}`;

    this.mailerService
      .sendMail({
        to: data.email, // list of receivers
        from: 'support@blow.ru', // sender address
        subject: 'Подтверждение почты для blow.ru', // Subject line
        text: 'Подтверждение почты', // plaintext body
        html: `
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Подтверждение почты — BLOW</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f9f9f9;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9f9f9;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: 'Montserrat', Arial, sans-serif;">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#e31e24" style="padding: 20px;">
                <img src="https://blow.igoshev.de/blow-logo.png" alt="BLOW Logo" width="160" style="display: block;" />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px 40px; color: #333333; font-size: 16px; line-height: 1.5;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Подтверждение почты</h2>
                <p style="margin: 0 0 16px 0;">Здравствуйте,</p>
                <p style="margin: 0 0 16px 0;">
                  Благодарим за регистрацию в <strong>BLOW</strong>! Пожалуйста, подтвердите вашу почту, чтобы активировать аккаунт.
                </p>
                <p style="margin: 0 0 30px 0;">Нажмите на кнопку ниже, чтобы подтвердить адрес электронной почты:</p>
                
                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#e31e24" style="border-radius: 100px;">
                      <a href="${confirmLink}"
                         style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Подтвердить почту
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 30px 0 0 0; font-size: 14px; color: #666;">
                  Ссылка действует в течение 7 дней.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} BLOW. Все права защищены.
              </td>
            </tr>
          </table>

          <!-- Font fallback -->
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
          </style>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
      })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));

    return await this.login({
      email: data.email,
      password: data.password,
    });
  }

  async confirmation(token: string) {
    const user = await this.userService.getUserByConfirmToken(token);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // сделать проверку не просрочен ли токен

    await !!this.userService.update(user._id.toString(), {
      status: UserStatus.ACTIVE,
      confirmToken: '',
    });

    const payload = { sub: user._id, role: user.role, status: user.status };

    return {
      accessToken: await this.createToken(payload, '7d'),
    };
  }

  async recoveryPassword(email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user || user.status === UserStatus.ARHIVE)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const resetToken = await this.createToken({ sub: user._id, email }, '1h');
    await this.userService.update(user._id.toString(), { resetToken });

    const recoveryLink = `${process.env.FE_URL}/auth/reset?token=${resetToken}`;

    this.mailerService
      .sendMail({
        to: email, // list of receivers
        from: 'support@blow.ru', // sender address
        subject: 'Сброс пароля на blow.ru', // Subject line
        text: 'Сброс пароля', // plaintext body
        html: `
          <!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Сброс пароля — BLOW</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f9f9f9;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9f9f9;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: 'Montserrat', Arial, sans-serif;">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#e31e24" style="padding: 20px;">
                <img src="https://blow.igoshev.de/blow-logo.png" alt="BLOW Logo" width="160" style="display: block;" />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px 40px; color: #333333; font-size: 16px; line-height: 1.5;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Сброс пароля</h2>
                <p style="margin: 0 0 16px 0;">Здравствуйте,</p>
                <p style="margin: 0 0 16px 0;">
                  Мы получили запрос на сброс пароля для вашей учётной записи в <strong>BLOW</strong>.
                  Если вы не запрашивали это — просто проигнорируйте письмо.
                </p>
                <p style="margin: 0 0 30px 0;">Для создания нового пароля нажмите кнопку ниже:</p>
                
                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#e31e24" style="border-radius: 100px;">
                      <a href="${recoveryLink}"
                         style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Сбросить пароль
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 30px 0 0 0; font-size: 14px; color: #666;">
                  Ссылка действительна в течение 1 часа.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} BLOW. Все права защищены.
              </td>
            </tr>
          </table>

          <!-- Fallback font (email clients that don't support webfonts) -->
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
          </style>
        </td>
      </tr>
    </table>
  </body>
</html>
        `,
      })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }

  async resetPassword(password: string, token: string) {
    const user = await this.userService.getUserByResetToken(token);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return await !!this.userService.update(user._id.toString(), {
      password,
      resetToken: '',
    });
  }

  private async createToken(payload, expiresIn: string): Promise<string> {
    return await this.jwtService.signAsync(payload, { expiresIn });
  }
}
