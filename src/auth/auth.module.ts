import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { FileService } from 'src/file/file.service';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/entities/transaction.entity';
import { Session, SessionSchema } from 'src/session/entities/session.entity';
import { Guest, GuestSchema } from 'src/guest/entities/guest.entity';
import {
  Withdrawal,
  WithdrawalSchema,
} from 'src/withdrawal/entities/withdrawal.entity';
import { Sale, SaleSchema } from 'src/sale/entities/sale.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Guest.name, schema: GuestSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Sale.name, schema: SaleSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, FileService],
})
export class AuthModule {}
