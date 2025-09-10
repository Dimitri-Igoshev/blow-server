import { Module } from '@nestjs/common';
import { YooMoneyService } from './yoomoney.service';
import { YooMoneyController } from './yoomoney.controller';
import { YooMoneyOAuthService } from './yoomoney.oauth.service';
import { YooMoneyPaymentsService } from './yoomoney.payments.service';
import { WalletService } from 'src/wallet/wallet.service';

@Module({
  controllers: [YooMoneyController],
  providers: [
    YooMoneyService,
    YooMoneyOAuthService,
    YooMoneyPaymentsService,
    WalletService,
  ],
})
export class YoomoneyModule {}
