import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
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
      filter.status = status;
    } else if (status && status !== TransactionStatus.PAID) {
      filter.$or = [
        { status: { $ne: TransactionStatus.PAID } },
        { status: { $exists: false } },
      ];
    }

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.transactionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  getTransactionById(id: string) {
    return this.transactionModel.findOne({ trackingId: id }).exec();
  }
}
