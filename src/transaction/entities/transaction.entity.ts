import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import type { Sale } from 'src/sale/entities/sale.entity'
import { User } from 'src/user/entities/user.entity';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  NEW = 'new',
  PAID = 'paid',
  REJECTED = 'rejected',
  FAILED = 'failed',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum TransactionMethod {
  TEST = 'test',

  TOPUP = 'topup',
  PAYPAL = 'paypal',
  CARD = 'card',
  BANK_TRANSFER = 'bank-transfer',
  GOOGLE_PAY = 'google-pay',
  APPLE_PAY = 'apple-pay',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  userId: User;

  @Prop({ type: String, enum: TransactionType, default: TransactionType.DEBIT })
  type: TransactionType;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.NEW,
  })
  status: TransactionStatus;

  @Prop({ type: String })
  method: string;

  @Prop({ type: Number })
  sum: number;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  trackingId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null,
  })
  sale: Sale;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
