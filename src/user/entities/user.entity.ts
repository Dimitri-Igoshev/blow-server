import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IPhoto } from 'src/common/interface/photo.interface';
import { Transaction } from 'src/transaction/entities/transaction.entity';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  NEW = 'new',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARHIVE = 'archive',
  ALL = 'all',
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

export interface ISession {
  timestamp: Date;
  ip: string;
  userAgent: any;
}

export enum SlugStatus {
  Auto = 'auto',
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface Referer {
  type: string;
  user: User;
  percent: number;
}

export interface UserContacts {
  phone?: string;
  telegram?: string;
  whatsapp?: string;
}

export interface PurchasedContacts {
  user: string;
  phone?: string;
  telegram?: string;
  whatsapp?: string;
}

@Schema({ timestamps: true })
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
  raisedAt: Date;

  @Prop({ default: Date.now() })
  inTopAt: Date;

  @Prop({ default: Date.now() })
  activity: Date;

  @Prop()
  visits: IGuest[];

  @Prop()
  notes: INote[];

  @Prop({ default: 0 })
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

  @Prop()
  sessions: ISession[];

  @Prop()
  lastMailing: string;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  ])
  blockList: User[];

  @Prop({ sparse: true })
  slug?: string;

  @Prop({ sparse: true })
  shortId?: string;

  @Prop({ enum: SlugStatus, default: SlugStatus.Auto })
  slugStatus?: SlugStatus;

  @Prop({ default: false })
  isPublic?: boolean;

  @Prop({ default: false })
  isFake?: boolean;

  @Prop()
  referers?: Referer[];

  @Prop()
  contacts?: UserContacts[];

  @Prop()
  purchasedContacts?: PurchasedContacts[];

  @Prop()
  fromLanding?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ slug: 1 }, { unique: true, sparse: true });
UserSchema.index({ shortId: 1 }, { unique: true, sparse: true });
