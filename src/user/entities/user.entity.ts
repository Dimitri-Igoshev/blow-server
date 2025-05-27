import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IPhoto } from 'src/common/interface/photo.interface';
import { Transaction } from 'src/transaction/entities/transaction.entity';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  NEW = 'new',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserSex {
  MALE = 'male',
  FEMALE = 'female',
}

export interface IGuest {
  _id: string;
  date: Date;
}

export interface INote {
  _id: string;
  text: string;
}

export interface IService {
  _id: string;
  quantity: number;
  expiredAt: Date;
}

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  sex: UserSex;

  @Prop()
  city: string;

  @Prop()
  age: number;

  @Prop()
  height: number;

  @Prop()
  weight: number;

  @Prop()
  photos: IPhoto[];

  @Prop()
  sponsor: boolean;

  @Prop()
  traveling: boolean;

  @Prop()
  relationships: boolean;

  @Prop()
  evening: boolean;

  @Prop()
  about: string;

  @Prop()
  voice: string;

  @Prop({ default: Date.now() })
  premiumEnd: Date;

  @Prop()
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop()
  company: string;

  @Prop()
  refreshToken: string;

  @Prop()
  resetToken: string;

  @Prop()
  confirmToken: string;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;

  @Prop({ default: Date.now() })
  activity: Date;

  @Prop()
  visits: IGuest[];

  @Prop()
  notes: INote[];

  @Prop()
  balance: number;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  ])
  transactions: Transaction[];

  @Prop()
  services: IService[];
}

export const UserSchema = SchemaFactory.createForClass(User);
