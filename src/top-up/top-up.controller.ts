import { Controller, Post, Body, Param, Delete, Get, Query } from '@nestjs/common';
import { TopUpService } from './top-up.service';

@Controller('top-up')
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  @Post()
  create(@Body() amount: number) {
    return this.topUpService.generateTopUpToken(amount);
  }

  @Post('verify')
  verify(@Body() token: string) {
    return this.topUpService.verifyTopUpToken(token)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.topUpService.remove(id);
  }
}
