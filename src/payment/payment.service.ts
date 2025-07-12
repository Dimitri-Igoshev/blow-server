import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionMethod,
  TransactionStatus,
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
    // const url = process.env.OVERPAY_CHECKOUT_URL || '';
    // const headers = {
    //   Authorization: process.env.OVERPAY_BASIC_AUTH,
    // };

    await this.createTransaction(data);

    // const response = await axios.post(
    //   url,
    //   { checkout: data?.checkout },
    //   { headers },
    // );

    // return response.data;
  }

  async handleNotification(data: any): Promise<any> {
    const transaction = await this.transactionModel
      .findOne({ trackingId: data?.paymentId })
      .exec();

    if (!transaction)
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);

    const user = await this.userService.findOne(
      transaction?.userId.toString() || '',
    );

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (data?.status === 'EXECUTED') {
      return await this.userService.addBalance({
        id: user?._id?.toString() || '',
        sum: +transaction?.sum,
      });
    } else if (data?.status !== 'EXECUTED') {
      await this.transactionModel
        .findOneAndUpdate(
          { trackingId: data?.order_id },
          {
            status: TransactionStatus.FAILED,
          },
          { new: true },
        )
        .exec();
      this.userService.addBalance({
        id: user?._id?.toString() || '',
        sum: 0,
      });
    }
  }

  async createTransaction(data: any) {
    const user = await this.userService.findOne(data?.payerId || '');

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const transaction = new this.transactionModel({
      createdAt: new Date(Date.now()),
      updatedAt: new Date(Date.now()),
      userId: data?.payerId,
      type: TransactionType.CREDIT,
      method: TransactionMethod.CARD,
      sum: +data?.amount,
      description: `Пополнение баланса на ${+data?.amount}`,
      trackingId: data?.order_id,
    });

    const newTransaction = await transaction.save();

    return await this.userModel
      .findOneAndUpdate(
        { _id: data.payerId },
        { transactions: [newTransaction, ...user.transactions] },
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
