
import { Injectable } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import { User } from '../users/user.entity';
// import { WalletTransaction } from './wallet-transaction.entity';

@Injectable()
export class WalletService {
  // constructor(private readonly ds: DataSource) {}

  async createPendingDeposit(userId: string, amountMinor: number, providerPaymentId?: any) {
    // const txRepo = this.ds.getRepository(WalletTransaction);
    // const userRepo = this.ds.getRepository(User);
    // const user = await userRepo.findOneByOrFail({ id: userId });

    // const tx = txRepo.create({
    //   user,
    //   amount: String(amountMinor),
    //   type: 'deposit',
    //   status: 'pending',
    //   providerPaymentId: providerPaymentId ?? null,
    // });
    // return txRepo.save(tx);
  }

  async markDepositSucceededByPaymentId(paymentId: string) {
    // const txRepo = this.ds.getRepository(WalletTransaction);
    // const userRepo = this.ds.getRepository(User);

    // const tx = await txRepo.findOneByOrFail({ providerPaymentId: paymentId });
    // if (tx.status === 'succeeded') return tx;

    // await this.ds.transaction(async (m) => {
    //   tx.status = 'succeeded';
    //   await m.getRepository(WalletTransaction).save(tx);

    //   const user = await m.getRepository(User).findOneByOrFail({ id: tx.user.id });
    //   user.balance = String(BigInt(user.balance) + BigInt(tx.amount));
    //   await m.getRepository(User).save(user);
    // });

    // return tx;
  }

  async attachPaymentId(txId: string, paymentId: string) {
    // const txRepo = this.ds.getRepository(WalletTransaction);
    // const tx = await txRepo.findOneByOrFail({ id: txId });
    // tx.providerPaymentId = paymentId;
    // return txRepo.save(tx);
  }

  async markDepositFailedByTxId(txId?: string) {
    // const txRepo = this.ds.getRepository(WalletTransaction);
    // const tx = await txRepo.findOneByOrFail({ id: txId });
    // tx.status = 'failed';
    // return txRepo.save(tx);
  }
}
