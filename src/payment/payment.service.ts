import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TopUp } from 'src/top-up/entities/top-up.entity';
import { SECRET } from 'src/top-up/top-up.service';
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
    @InjectModel(TopUp.name) private topUpModel: Model<TopUp>,
    private readonly userService: UserService,
    private jwtService: JwtService,
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
      .findOne({ trackingId: data?.orderId })
      .exec();

    if (!transaction)
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);

    if (transaction?.status === TransactionStatus.PAID)
      throw new HttpException(
        'Transaction already paid',
        HttpStatus.BAD_REQUEST,
      );

    const user = await this.userService.findOne(
      transaction?.userId.toString() || '',
    );

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (data?.status === 'CONFIRMED') {
      await this.transactionModel
        .findOneAndUpdate(
          { trackingId: data?.orderId },
          {
            status: TransactionStatus.PAID,
          },
          { new: true },
        )
        .exec();

      return await this.userService.update(user?._id?.toString() || '', {
        balance: user.balance
          ? +user.balance + +transaction?.sum
          : +transaction?.sum,
      });
    } else if (data?.status !== 'CONFIRMED') {
      await this.transactionModel
        .findOneAndUpdate(
          { trackingId: data?.orderId },
          {
            status: TransactionStatus.FAILED,
          },
          { new: true },
        )
        .exec();
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

  async topUpAccount(data: { token?: string; amount: number; userId: string }) {
    let decoded: unknown;

    if (data?.token) {
      decoded = await this.jwtService.verifyAsync(data.token, {
        secret: SECRET,
      });
    }

    if (data?.token && !decoded)
      throw new HttpException('Token not valid', HttpStatus.BAD_REQUEST);

    const user = await this.userService.findOne(data?.userId || '');

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const transaction = new this.transactionModel({
      createdAt: new Date(Date.now()),
      updatedAt: new Date(Date.now()),
      userId: data?.userId,
      type: TransactionType.CREDIT,
      method: TransactionMethod.TOPUP,
      sum: +data?.amount,
      status: TransactionStatus.PAID,
      description: `Пополнение баланса на ${+data?.amount}`,
    });

    const newTransaction = await transaction.save();

    const newUser = await this.userModel
      .findOneAndUpdate(
        { _id: data.userId },
        {
          transactions: [newTransaction, ...user.transactions],
          balance: user.balance
            ? Number(user.balance) + Number(data.amount)
            : Number(data.amount),
        },
        { new: true },
      )
      .exec();

    if (!newUser)
      throw new HttpException('User was not updated', HttpStatus.NOT_FOUND);

    return await this.topUpModel.deleteOne({ token: data.token }).exec();
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
