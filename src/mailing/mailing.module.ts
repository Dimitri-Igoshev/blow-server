import { Module } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { MailingController } from './mailing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Mailing, MailingSchema } from './entities/mailing.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mailing.name, schema: MailingSchema }]),
  ],
  controllers: [MailingController],
  providers: [MailingService],
})
export class MailingModule {}
