import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TopUpDocument = HydratedDocument<TopUp>;

@Schema({ timestamps: true })
export class TopUp {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  amount: number;
}

export const TopUpSchema = SchemaFactory.createForClass(TopUp);
