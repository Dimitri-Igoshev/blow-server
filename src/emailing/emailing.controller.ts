// mailing.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { EmailingService } from './emailing.service';
import { BonusMailDto, BulkMailDto } from './dto/mailing.dto';

@Controller('emailing')
export class EmailingController {
  constructor(private readonly emailingService: EmailingService) {}

  /** Универсальная рассылка письма по базе */
  @Post('bulk')
  async bulk(@Body() dto: BulkMailDto) {
    return this.emailingService.sendBulkMail(dto);
  }

  /** Массовое начисление бонуса (+ письмо уведомление) */
  @Post('bonus')
  async bonus(@Body() dto: BonusMailDto) {
    return this.emailingService.sendBonusAndNotify(dto);
  }
}
