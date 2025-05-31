import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from 'src/user/entities/user.entity';

@Schema()
export class Mailing {
  @Prop()
  text: string;

  @Prop({ default: Date.now() })
  updatedAt: Date;

  @Prop({ default: true })
  active: boolean;

  @Prop(
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  )
  owner: User;
}

export const MailingSchema = SchemaFactory.createForClass(Mailing);

