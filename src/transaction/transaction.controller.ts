import { Controller, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('tracking/:id')
  getTrackingInfo(id: string) {
    return this.transactionService.getTransactionById(id);
  }
}
