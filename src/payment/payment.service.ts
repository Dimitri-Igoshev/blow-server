import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import {
  Transaction,
  TransactionMethod,
  TransactionType,
} from 'src/transaction/entities/transaction.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {}

  async createChekout(data: any): Promise<any> {
    const url = process.env.OVERPAY_CHECKOUT_URL || '';
    const headers = {
      Authorization: process.env.OVERPAY_BASIC_AUTH,
    };

    this.createTransaction(data);

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

    if (data?.transaction?.status === 'successful') {
      this.userService.addBalance({
        id: data?.transaction?.user_id,
        sum: data?.transaction?.amount,
      });
    }
  }

  async createTransaction(data: any) {
    const user = await this.userService.findOne(data.payerId);

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const transaction = new this.transactionModel({
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: data?.payerId,
      type: TransactionType.CREDIT,
      method: TransactionMethod.CARD,
      sum: +data?.checkout?.order?.amount / 100,
      description: `Пополнение баланса на ${+data?.checkout?.order?.amount / 100}`,
      trackingId: data?.checkout?.order?.tracking_id,
    });

    const newTransaction = await transaction.save();

    return await this.userModel
      .findOneAndUpdate(
        { _id: data.payerId },
        { transactions: [newTransaction, ...user.transactions]},
        { new: true },
      )
      .exec();
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
