import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/entities/user.entity';
import { Message } from './message.entity';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {
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

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: [],
    },
  ])
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
