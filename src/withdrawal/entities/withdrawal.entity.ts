import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import type { User } from 'src/user/entities/user.entity';

export type WithdrawalDocument = HydratedDocument<Withdrawal>;

export enum WithdrawalStatus {
  NEW = 'new',
  PAID_OUT = 'paid_out',
  DECCLINED = 'declined',
}

export enum WithdrawalType {
  PHONE_NUMBER = 'phone',
  USDT = 'usdt',
}

@Schema({ timestamps: true })
export class Withdrawal {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  user: User;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: WithdrawalStatus, default: WithdrawalStatus.NEW })
  status: WithdrawalStatus;

  @Prop({
    type: String,
    enum: WithdrawalType,
    default: WithdrawalType.PHONE_NUMBER,
  })
  type: WithdrawalType;

  @Prop()
  data: string;

  @Prop()
  transactionId: string;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
