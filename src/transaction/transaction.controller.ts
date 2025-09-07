import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  getTransactions(@Query() query: Record<string, string>) {
    return this.transactionService.getTransactions(query);
  }

  @Get(':id')
  getTransaction(@Param('id') id: string) {
    return this.transactionService.getTransaction(id);
  }

  @Get('tracking/:id')
  getTrackingInfo(id: string) {
    return this.transactionService.getTransactionById(id);
  }

  @Patch(':id')
  updateTransaction(@Param('id') id: string, @Body() data: any) {
    return this.transactionService.updateTransaction(id, data);
  }
}
