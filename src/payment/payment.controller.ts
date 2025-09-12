import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  createChekout(@Body() data: any) {
    return this.paymentService.createChekout(data);
  }

  @Post('notification')
  paymentNotification(@Body() data: any) {
    return this.paymentService.handleNotification(data);
  }

  @Post('top-up')
  topUpAccount(
    @Body() data: { token?: string; amount: number; userId: string },
  ) {
    return this.paymentService.topUpAccount(data);
  }

  // @Get()
  // findAll() {
  //   return this.paymentService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.paymentService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
  //   return this.paymentService.update(+id, updatePaymentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.paymentService.remove(+id);
  // }
}
