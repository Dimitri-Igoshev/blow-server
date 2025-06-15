import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  constructor(private readonly httpService: HttpService) {}

  async createChekout(data: any): Promise<any> {
    const url = process.env.OVERPAY_CHECKOUT_URL || '';
    const headers = {
      Authorization: process.env.OVERPAY_BASIC_AUTH,
    };

    //Создать транзакцию для пользователя и отслеживать ее (tracking_id, сумма, статус, способ оплаты)

    const response$ = this.httpService.post(
      url,
      { checkout: data?.checkout },
      { headers },
    );
    const response = await lastValueFrom(response$);
    return response.data;
  }

  async handleNotification(data: any): Promise<any> {
    //Получить ответ и исходя из этого либо поменять статус транзакции, либо зачислить средства.

    console.log(data);
  }

  // paymentResponse(response: any) {}

  // create(createPaymentDto: CreatePaymentDto) {
  //   return 'This action adds a new payment';
  // }

  // findAll() {
  //   return `This action returns all payment`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} payment`;
  // }

  // update(id: number, updatePaymentDto: UpdatePaymentDto) {
  //   return `This action updates a #${id} payment`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} payment`;
  // }
}
