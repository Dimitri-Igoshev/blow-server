import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CityDocument = HydratedDocument<City>;

@Schema({ timestamps: true })
export class City {
  @Prop({ type: String })
  label: string;

  @Prop({ type: String })
  value: string;

  @Prop({ type: Number })
  order: number;
}

export const CitySchema = SchemaFactory.createForClass(City);
