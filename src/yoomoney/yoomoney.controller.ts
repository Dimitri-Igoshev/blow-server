import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ExchangeTokenDto } from './dto/oauth.dto';
import { YooMoneyOAuthService } from './yoomoney.oauth.service';
import { DepositDto } from './dto/deposit.dto';
import { YooMoneyPaymentsService } from './yoomoney.payments.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('yoomoney')
export class YooMoneyController {
  constructor(
    private readonly oauth: YooMoneyOAuthService,
    private readonly payments: YooMoneyPaymentsService,
    private readonly wallet: WalletService,
  ) {}

  // 1) Принимаем code из Next /oauth/callback
  @Post('oauth/token')
  async oauthToken(@Body() dto: ExchangeTokenDto, @Req() req: any) {
    // Здесь определите текущего пользователя (из JWT/сессии)
    const userId = req.user?.id ?? 'USER_ID_FROM_JWT';
    const token = await this.oauth.exchangeCode(dto.code);
    // Сохраните access_token в своей БД, привязав к userId
    // (опустим конкретную реализацию хранения)
    // await this.tokens.saveUserToken(userId, token.access_token, token.expires_in)
    return { ok: true };
  }

  // 2) Инициировать пополнение (перевод p2p с кошелька пользователя на ваш)
  @Post('deposit')
  async deposit(@Body() dto: DepositDto, @Req() req: any) {
    const userId = dto.userId; // или из req.user.id
    const amountMinor = dto.amountMinor;

    // 2.1 Достаём access_token пользователя из вашей БД
    const accessToken = 'USER_ACCESS_TOKEN_FROM_DB';

    // 2.2 Создаём pending-транзакцию
    const pending: any = await this.wallet.createPendingDeposit(userId, amountMinor, null);

    // 2.3 request-payment
    const reqRes = await this.payments.requestPayment(amountMinor, dto.comment, accessToken);
    if (reqRes.status !== 'success') {
      await this.wallet.markDepositFailedByTxId(pending?.id);
      return { status: 'refused', error: (reqRes as any).error };
    }

    // 2.4 process-payment
    const proc = await this.payments.processPayment(reqRes.request_id, accessToken);

    if (proc.status === 'success') {
      // привязываем payment_id к нашей транзакции и зачисляем
      await this.wallet.attachPaymentId(pending.id, proc.payment_id);
      await this.wallet.markDepositSucceededByPaymentId(proc.payment_id);
      return { status: 'success', paymentId: proc.payment_id };
    }

    if (proc.status === 'in_progress') {
      // можно повесить отложенную проверку / cron / poll operation-details
      return { status: 'in_progress' };
    }

    // refused
    await this.wallet.markDepositFailedByTxId(pending.id);
    return { status: 'refused', error: proc.error };
  }

  // (опционально) endpoint, который по payment_id дергает operation-details для доп.проверки
  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: { paymentId: string; userId: string }) {
    const accessToken = 'USER_ACCESS_TOKEN_FROM_DB';
    const od = await this.payments.operationDetails(body.paymentId, accessToken);
    // при необходимости проверить сумму/назначение и обновить баланс
    return { ok: true, od };
  }
}