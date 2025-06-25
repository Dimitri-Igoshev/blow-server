import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
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
}

export enum TransactionMethod {
  TEST = 'test',

  PAYPAL = 'paypal',
  CARD = 'card',
  BANK_TRANSFER = 'bank-transfer',
  GOOGLE_PAY = 'google-pay',
  APPLE_PAY = 'apple-pay',
}

@Schema()
export class Transaction {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  userId: User;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;

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
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
