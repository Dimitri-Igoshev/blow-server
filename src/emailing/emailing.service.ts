// mailing.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { format } from 'date-fns';

import { User, UserDocument, UserStatus } from '../user/entities/user.entity';
import { BonusMailDto, BulkMailDto } from './dto/mailing.dto';

@Injectable()
export class EmailingService {
  private readonly logger = new Logger(EmailingService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Универсальная рассылка по базе клиентов.
   * Фильтры: статус, пол. Текст/тема/CTA настраиваются.
   * Интервал между письмами: 5–10 секунд (рандом).
   */
  async sendBulkMail(dto: BulkMailDto) {
    const {
      subject,
      text,
      status = UserStatus.ALL,
      sex,
      dryRun = false,
      limit,
      from = 'support@blow.ru',
      ctaLink = 'https://blow.ru',
      ctaText = 'Перейти на сайт',
    } = dto;

    const filter: FilterQuery<UserDocument> = {
      email: { $exists: true, $ne: null },
    };
    if (status && status !== UserStatus.ALL) filter.status = status;
    if (sex) filter.sex = sex;

    const total = await this.userModel.countDocuments(filter);
    const toSend = typeof limit === 'number' ? Math.min(limit, total) : total;

    if (dryRun) {
      return {
        dryRun: true,
        totalMatched: total,
        willSend: toSend,
        filter,
      };
    }

    const cursor = this.userModel
      .find(filter, { email: 1, firstName: 1, lastName: 1 })
      .sort({ _id: 1 })
      .lean()
      .cursor();

    let sent = 0;
    let failed = 0;
    const nowStr = new Date().toISOString();

    for await (const user of cursor) {
      if (typeof limit === 'number' && sent + failed >= limit) break;

      try {
        await this.mailerService.sendMail({
          to: user.email,
          from,
          subject,
          text: this.buildPlainText(user, text, ctaText, ctaLink),
          html: this.buildHtml(user, text, ctaText, ctaLink),
        });

        await this.userModel
          .updateOne({ _id: user._id }, { $set: { lastMailing: nowStr } })
          .exec();

        sent++;
        this.logger.log(`✅ Mail sent to ${user.email}`);
      } catch (e: any) {
        failed++;
        this.logger.warn(`Mail to ${user.email} failed: ${e?.message ?? e}`);
      }

      // интервал 5–10 секунд перед следующим письмом
      await randomDelay(5, 10);
    }

    return {
      dryRun: false,
      totalMatched: total,
      attempted: toSend,
      sent,
      failed,
    };
  }

  /**
   * Массовое начисление бонуса (по умолчанию +500) + уведомление письмом.
   * Фильтры: статус/пол. Поддерживает dryRun и limit.
   * Отправка по одному, с интервалом 5–10 сек.
   */
  async sendBonusAndNotify(dto: BonusMailDto) {
    const {
      subject,
      text,
      status = UserStatus.ALL,
      sex,
      dryRun = false,
      limit,
      from = 'support@blow.ru',
      ctaLink = 'https://blow.ru',
      ctaText = 'Перейти на сайт',
      amount = 500,
    } = dto;

    const filter: FilterQuery<UserDocument> = {
      email: { $exists: true, $ne: null },
    };
    if (status && status !== UserStatus.ALL) filter.status = status;
    if (sex) filter.sex = sex;

    const total = await this.userModel.countDocuments(filter);
    const toProcess =
      typeof limit === 'number' ? Math.min(limit, total) : total;

    if (dryRun) {
      return {
        dryRun: true,
        totalMatched: total,
        willAffect: toProcess,
        bonusAmount: amount,
        filter,
      };
    }

    const cursor = this.userModel
      .find(filter, { email: 1, firstName: 1, lastName: 1 })
      .sort({ _id: 1 })
      .lean()
      .cursor();

    let credited = 0;
    let mailed = 0;
    let failedCredit = 0;
    let failedMail = 0;

    const nowStr = new Date().toISOString();

    for await (const user of cursor) {
      if (typeof limit === 'number' && credited + failedCredit >= limit) break;

      // начисление бонуса
      try {
        await this.userModel
          .updateOne({ _id: user._id }, { $inc: { balance: amount } })
          .exec();
        credited++;
        this.logger.log(`💰 Bonus +${amount} credited to ${user.email}`);
      } catch (e: any) {
        failedCredit++;
        this.logger.warn(
          `Bonus +${amount} to ${user.email} failed: ${e?.message ?? e}`,
        );
        // если бонус не начислился — письмо пропускаем
        continue;
      }

      // письмо-подтверждение
      try {
        await this.mailerService.sendMail({
          to: user.email,
          from,
          subject,
          text: this.buildPlainText(user, text, ctaText, ctaLink),
          html: this.buildHtml(user, text, ctaText, ctaLink),
        });

        await this.userModel
          .updateOne({ _id: user._id }, { $set: { lastMailing: nowStr } })
          .exec();

        mailed++;
        this.logger.log(`✅ Mail sent to ${user.email} after bonus`);
      } catch (e: any) {
        failedMail++;
        this.logger.warn(
          `Mail to ${user.email} failed after bonus: ${e?.message ?? e}`,
        );
      }

      await randomDelay(5, 10);
    }

    return {
      dryRun: false,
      totalMatched: total,
      attempted: toProcess,
      bonusAmount: amount,
      credited,
      failedCredit,
      mailed,
      failedMail,
    };
  }

  // ==========================
  // Шаблоны письма
  // ==========================

  /** Plain-text версия письма */
  private buildPlainText(
    recipient: Pick<User, 'firstName' | 'lastName'>,
    bodyText: string,
    ctaText: string,
    ctaLink: string,
  ) {
    const greeting = recipient?.firstName
      ? `Здравствуйте, ${recipient.firstName}!`
      : 'Здравствуйте!';

    const footer = `\n— Команда BLOW`;
    const ctaLine = ctaLink ? `\n${ctaText}: ${ctaLink}` : '';

    return `${greeting}\n\n${stripHtml(bodyText)}${ctaLine}${footer}`;
  }

  /** HTML версия письма (адаптирована под твой фирменный шаблон) */
  private buildHtml(
    recipient: Pick<User, 'firstName' | 'lastName'>,
    bodyText: string, // допускается с HTML
    ctaText: string,
    ctaLink: string,
  ) {
    const formattedDate = format(new Date(), "dd MM yyyy 'в' HH:mm");
    const greet = recipient?.firstName
      ? `Здравствуйте, ${recipient.firstName}!`
      : 'Здравствуйте!';

    const ctaBlock = ctaLink
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px 0;">
        <tr>
          <td align="center" bgcolor="#e31e24" style="border-radius: 100px;">
            <a href="${ctaLink}"
               style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>`
      : '';

    return `
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Команда BLOW</title>
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
              <td style="padding: 30px 40px; color: #333333; font-size: 16px; line-height: 1.6;">
                <p style="margin: 0 0 16px 0;">${greet}</p>

                <div style="margin: 0 0 16px 0;">
                  ${bodyText}
                </div>

                ${ctaBlock}

                <p style="margin: 24px 0 0 0; font-size: 14px; color: #666;">
                  С уважением,<br/>команда <strong>BLOW</strong>
                </p>

                <p style="margin: 30px 0 0 0; font-size: 12px; color: #999;">
                  Пожалуйста, не отвечайте на это письмо — оно отправлено автоматически.<br/>
                  Дата и время отправки: ${formattedDate}
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

          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
          </style>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
  }
}

// ==========================
// Вспомогательные функции
// ==========================

function stripHtml(html: string) {
  return html?.replace(/<[^>]*>/g, '') ?? '';
}

/** Пауза на указанное количество миллисекунд */
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/** Случайная задержка от minSec до maxSec секунд */
async function randomDelay(minSec: number, maxSec: number) {
  const min = Math.max(0, Math.floor(minSec));
  const max = Math.max(min, Math.floor(maxSec));
  const ms = (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
  await sleep(ms);
}
