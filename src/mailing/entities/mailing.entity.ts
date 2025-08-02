import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from 'src/user/entities/user.entity';

@Schema({ timestamps: true })
export class Mailing {
  @Prop()
  text: string;

  @Prop({ default: Date.now() })
  updatedAt: Date;

  @Prop({ default: true })
  active: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  owner: User;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  ])
  interested: User[];
}

export const MailingSchema = SchemaFactory.createForClass(Mailing);
