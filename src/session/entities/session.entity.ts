import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import type { User } from 'src/user/entities/user.entity';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: String })
  ip: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  userId: User;

  @Prop()
  lastActivityAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
