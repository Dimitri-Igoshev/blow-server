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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  })
  replyTo: Message | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  isReaded: boolean;

  @Prop()
  unreadBy: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
