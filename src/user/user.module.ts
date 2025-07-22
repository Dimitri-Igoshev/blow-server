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
import { Session, SessionSchema } from 'src/session/entities/session.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, FileService],
})
export class UserModule {}
