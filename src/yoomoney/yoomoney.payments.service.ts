import { Injectable, HttpException } from '@nestjs/common';

type RequestPaymentRes =
  | { status: 'success'; request_id: string }
  | { status: 'refused'; error: string };

type ProcessPaymentRes =
  | { status: 'success'; payment_id: string }
  | { status: 'in_progress'; next_retry: number }
  | { status: 'refused'; error: string };

@Injectable()
export class YooMoneyPaymentsService {
  private receiver = process.env.YOOMONEY_RECEIVER!; // ваш кошелёк-получатель

  private async postForm<T>(url: string, params: Record<string, string>, accessToken: string): Promise<T> {
    const body = new URLSearchParams(params);
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${accessToken}`,
      },
      body,
    });
    if (!r.ok) {
      const err = await r.text().catch(() => '');
      throw new HttpException(err || 'YooMoney request failed', r.status);
    }
    return r.json() as Promise<T>;
  }

  // 1) запрос на перевод (p2p)
  async requestPayment(amountMinor: number, comment: string | undefined, accessToken: string) {
    // pattern_id=p2p, to=получатель. Можно указывать amount или amount_due
    const res = await this.postForm<RequestPaymentRes>(
      'https://yoomoney.ru/api/request-payment',
      {
        pattern_id: 'p2p',
        to: this.receiver,
        amount: (amountMinor / 100).toFixed(2),
        comment: comment ?? 'Deposit',
        message: comment ?? 'Deposit',
        label: 'internal_deposit',
      },
      accessToken,
    );
    return res;
  }

  // 2) подтверждение перевода
  async processPayment(requestId: string, accessToken: string) {
    const res = await this.postForm<ProcessPaymentRes>(
      'https://yoomoney.ru/api/process-payment',
      {
        request_id: requestId,
        money_source: 'wallet', // списываем с кошелька пользователя
      },
      accessToken,
    );
    return res;
  }

  // (опционально) получить детали операции по payment_id
  async operationDetails(paymentId: string, accessToken: string) {
    return this.postForm<any>(
      'https://yoomoney.ru/api/operation-details',
      { operation_id: paymentId },
      accessToken,
    );
  }
}
