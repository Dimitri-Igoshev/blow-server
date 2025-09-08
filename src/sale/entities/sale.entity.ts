import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type SaleDocument = HydratedDocument<Sale>;

export enum SaleType {
  CONTACT = 'contact',
}

export enum SaleStatus {
  NEW = 'new',
  PAID = 'paid',
  REJECTED = 'rejected',
  FAILED = 'failed',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Sale {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  seller: User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  buyer: User;

  @Prop({ type: String, enum: SaleType, default: SaleType.CONTACT })
  type: SaleType;

  @Prop({
    type: String,
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status: SaleStatus;

  @Prop({ type: String })
  value: string;

  @Prop({ type: Number })
  amount: number;

  @Prop({ type: String })
  description: string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
