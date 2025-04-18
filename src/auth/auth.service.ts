import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { resetPasswordMail } from 'src/mail/template/reset-password.template';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { UserStatus } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  saltOrRounds = 12;

  getMe(token: string) {
    this.jwtService.decode(token);
    return token;
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userService.getUserByEmail(email);

    if (!user)
      throw new HttpException(
        'User with this email not exists',
        HttpStatus.NOT_FOUND,
      );

    if (user.status === UserStatus.NEW)
      throw new HttpException(
        'Confirm your email address',
        HttpStatus.BAD_REQUEST,
      );

    if (user.status === UserStatus.INACTIVE)
      throw new HttpException('Your account is inactive', HttpStatus.FORBIDDEN);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);

    const payload = { sub: user._id, role: user.role, status: user.status };

    return {
      accessToken: await this.createToken(payload, '7d'),
    };
  }

  async registration(data: LoginDto) {
    const isExist = await this.userService.getUserByEmail(data.email);

    if (isExist)
      throw new HttpException('User is already exists', HttpStatus.CONFLICT);

    const res = await this.userService.create(
      {
        ...data,
        status: UserStatus.ACTIVE,
      }
    );

    if (!res)
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);

    // После регистрации авторизация и сразу токен

    return await this.login({
      email: data.email,
      password: data.password,
    });
  }

  // async recoveryPassword(email: string, lang: string) {
  //   const user = await this.userService.getUserByEmail(email);
  //   if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

  //   const resetToken = await this.createToken({ sub: user._id, email }, '30d');
  //   await this.userService.update(user._id.toString(), { resetToken }, null);

  //   const recoveryLink = `${process.env.FE_URL}/auth/reset?token=${resetToken}`;

  //   return await !!this.mailService.send(
  //     resetPasswordMail(
  //       { email, firstName: user.firstName, lang },
  //       recoveryLink,
  //     ),
  //   );
  // }

  async resetPassword(password: string, token: string) {
    const user = await this.userService.getUserByResetToken(token);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // сделать проверку не просрочен ли токен

    const newPassword = await bcrypt.hash(password, this.saltOrRounds);

    return await !!this.userService.update(
      user._id.toString(),
      {
        password: newPassword,
      }
    );
  }

  private async createToken(payload, expiresIn: string): Promise<string> {
    return await this.jwtService.signAsync(payload, { expiresIn });
  }
}
