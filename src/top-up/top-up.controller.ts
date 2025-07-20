import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { TopUpService } from './top-up.service';

@Controller('top-up')
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  @Get()
  get(@Query() query: Record<string, string>) {
    return this.topUpService.getTopups(query);
  }

  @Post()
  create(@Body() data: { amount: number }) {
    return this.topUpService.generateTopUpToken(data);
  }

  @Post('verify')
  verify(@Body() data: { token: string }) {
    return this.topUpService.verifyTopUpToken(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.topUpService.remove(id);
  }
}
