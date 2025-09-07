import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';

@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  create(@Body() createWithdrawalDto: CreateWithdrawalDto) {
    return this.withdrawalService.create(createWithdrawalDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.withdrawalService.findAll(query);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.withdrawalService.findOne(id);
  // }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateWithdrawalDto) {
    return this.withdrawalService.update(id, data);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.withdrawalService.remove(+id);
  // }
}
