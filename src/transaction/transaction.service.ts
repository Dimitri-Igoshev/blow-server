import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import type { Model } from 'mongoose';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  getTransactions(query: Record<string, string>) {
    const { status, type, method, limit } = query;

    const filter: Record<string, any> = {};
    if (status && status === TransactionStatus.PAID) {
      filter.$or = [
        { status: TransactionStatus.PAID },
        { type: TransactionType.DEBIT },
      ];
    } else if (status && status !== TransactionStatus.PAID) {
      filter.$and = [
        { status: { $ne: TransactionStatus.PAID } },
        { type: { $ne: TransactionType.DEBIT } },
      ];
    }

    if (type) filter.type = type;
    if (method) filter.method = method;

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.transactionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate([
        { path: 'userId', model: 'User' },
        { path: 'sale', model: 'Sale' },
      ])
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  getTransaction(id: string) {
    return this.transactionModel.findOne({ _id: id }).exec();
  }

  getTransactionById(id: string) {
    return this.transactionModel.findOne({ trackingId: id }).exec();
  }

  updateTransaction(id: string, data: any) {
    return this.transactionModel
      .findOneAndUpdate({ _id: id }, { status: data.status }, { new: true })
      .exec();
  }
}
