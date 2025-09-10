import { Injectable, HttpException } from '@nestjs/common';

@Injectable()
export class YooMoneyOAuthService {
  private clientId = process.env.YOOMONEY_CLIENT_ID!;
  private clientSecret = process.env.YOOMONEY_CLIENT_SECRET!;
  private redirectUri = process.env.YOOMONEY_REDIRECT_URI!;

  async exchangeCode(code: string) {
    console.log(555, code)
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    const r = await fetch('https://yoomoney.ru/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!r.ok) {
      const err = await r.text().catch(() => '');
      throw new HttpException(err || 'YooMoney token exchange failed', r.status);
    }
    return r.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
  }
}
