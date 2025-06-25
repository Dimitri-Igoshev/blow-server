import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

export enum ServiceType {
  KIT = 'kit',
  SINGLE = 'single',
}

export enum ServicePeriod {
  QUANTITY = 'quantity',
  DAY = 'day',
  DAYS = '3days',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export interface IServiceOption {
  name?: string;
  period?: ServicePeriod;
  quantity?: number;
  price?: number;
  servicesOptions?: IServiceOption[];
}

@Schema()
export class Service {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String, enum: ServiceType, default: ServiceType.SINGLE })
  type: ServiceType;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },
  ])
  services: string[];

  @Prop()
  options: IServiceOption[];

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number, default: 1 })
  order: number;

  @Prop({ type: String, default: 'Продлить' })
  btn: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
