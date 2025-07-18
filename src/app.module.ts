import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UserModule } from './user/user.module';
import { FileModule } from './file/file.module';
import { CommonModule } from './common/common.module';
import { GatewayModule } from './gateway/gateway.module';
import { TransactionModule } from './transaction/transaction.module';
import { ServicesModule } from './services/services.module';
import { ChatModule } from './chat/chat.module';
import { MailingModule } from './mailing/mailing.module';
import { PaymentModule } from './payment/payment.module';
import { HttpModule } from '@nestjs/axios';
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { ClaimModule } from './claim/claim.module';
import { TopUpModule } from './top-up/top-up.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.timeweb.ru',
        port: 25,
        ignoreTLS: true,
        secure: false,
        auth: {
          user: 'support@blow.ru',
          pass: 'g0ak9wyq47',
        },
      },
      defaults: {
        from: '"No Reply" <no-reply@blow.ru>',
      },
      preview: false,
      template: {
        dir: process.cwd() + '/template/',
        adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
        options: {
          strict: true,
        },
      },
    }),
    AuthModule,
    MailModule,
    UserModule,
    FileModule,
    CommonModule,
    GatewayModule,
    TransactionModule,
    ServicesModule,
    ChatModule,
    MailingModule,
    PaymentModule,
    HttpModule,
    ClaimModule,
    TopUpModule,
  ],
})
export class AppModule {}