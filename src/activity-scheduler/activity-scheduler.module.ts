import { Module } from '@nestjs/common';
import { ActivitySchedulerService } from './activity-scheduler.service';
import { UserService } from 'src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Message, MessageSchema } from 'src/chat/entities/message.entity';
import { Chat, ChatSchema } from 'src/chat/entities/chat.entity';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/entities/transaction.entity';
import { Guest, GuestSchema } from 'src/guest/entities/guest.entity';
import { Session } from 'inspector/promises';
import { SessionSchema } from 'src/session/entities/session.entity';
import { FileService } from 'src/file/file.service';
import {
  Withdrawal,
  WithdrawalSchema,
} from 'src/withdrawal/entities/withdrawal.entity';
import { Sale, SaleSchema } from 'src/sale/entities/sale.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Guest.name, schema: GuestSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Sale.name, schema: SaleSchema },
    ]),
  ],
  providers: [ActivitySchedulerService, FileService, UserService],
})
export class ActivitySchedulerModule {}
