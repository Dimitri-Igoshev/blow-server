import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/entities/user.entity';
import { Chat } from './chat.entity';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null,
  })
  chat: Chat;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  sender: User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  recipient: User;

  @Prop({
    type: String,
    default: '',
  })
  text: string;

  @Prop({
    type: String,
    default: '',
  })
  fileUrl: string;

  @Prop({
    type: Date,
    default: Date.now(),
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now(),
  })
  updatedAt: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  isReaded: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
