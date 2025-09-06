import { Controller, Get, Patch, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  getTransactions(@Query() query: Record<string, string>) {
    return this.transactionService.getTransactions(query);
  }

  @Get('tracking/:id')
  getTrackingInfo(id: string) {
    return this.transactionService.getTransactionById(id);
  }

  @Patch(':id')
  updateTransaction(id: string) {
    return this.transactionService.updateTransaction(id);
  }
}
