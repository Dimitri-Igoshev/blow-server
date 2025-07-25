import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { FileService } from 'src/file/file.service';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/entities/transaction.entity';
import { Session, SessionSchema } from 'src/session/entities/session.entity';
import { GuestService } from 'src/guest/guest.service';
import { Guest, GuestSchema } from 'src/guest/entities/guest.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Guest.name, schema: GuestSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, FileService, GuestService],
})
export class UserModule {}
