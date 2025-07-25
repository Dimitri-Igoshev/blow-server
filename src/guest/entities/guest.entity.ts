import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from 'src/user/entities/user.entity';

@Schema({ timestamps: true })
export class Guest {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  user: User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  guest: User;
}

export const GuestSchema = SchemaFactory.createForClass(Guest);
