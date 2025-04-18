import { Injectable } from '@nestjs/common';
import * as mailer from '@sendgrid/mail';
import { MailTemplateDto } from './dto/mail-template.dto';

@Injectable()
export class MailService {
  constructor() {
    mailer.setApiKey(process.env.SENGRID_API_KEY || '');
  }

  async send(template: MailTemplateDto) {
    try {
      await mailer.send(template);
    } catch (e) {
      console.error(e);
      if (e.response) console.error(e.response.body);
    }
  }
}
