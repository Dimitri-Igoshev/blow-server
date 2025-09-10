import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class YooMoneyService {
  private clientId = process.env.YOOMONEY_CLIENT_ID!;
  private clientSecret = process.env.YOOMONEY_CLIENT_SECRET!;
  private redirectUri = process.env.YOOMONEY_REDIRECT_URI!;

  async exchangeCodeForToken(code: string) {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    try {
      const { data } = await axios.post('https://yoomoney.ru/oauth/token', body.toString(), {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });

      // data: { access_token, token_type, expires_in, ... }
      // Сохрани в БД, привязав к userId
      return data;
    } catch (e: any) {
      throw new HttpException(e.response?.data || 'OAuth exchange failed', e.response?.status || 400);
    }
  }
}
