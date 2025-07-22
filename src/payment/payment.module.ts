import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/entities/transaction.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { FileService } from 'src/file/file.service';
import { TopUp, TopUpSchema } from 'src/top-up/entities/top-up.entity'
import { Session, SessionSchema } from 'src/session/entities/session.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: TopUp.name, schema: TopUpSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    HttpModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, UserService, FileService],
})
export class PaymentModule {}
