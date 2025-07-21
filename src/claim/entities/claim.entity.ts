import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import type { User } from 'src/user/entities/user.entity';

export type ClaimDocument = HydratedDocument<Claim>;

@Schema({ timestamps: true })
export class Claim {
  @Prop({ type: String })
  text: string;

  @Prop({ type: String })
  reply: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  from: User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  about: User;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
