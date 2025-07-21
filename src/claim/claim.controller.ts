import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { ClaimService } from './claim.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import type { UpdateClaimDto } from './dto/update-claim.dto'

@Controller('claim')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  create(@Body() createClaimDto: CreateClaimDto) {
    return this.claimService.create(createClaimDto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.claimService.findAll(query);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.claimService.findOne(+id);
  // }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.claimService.update(id, data);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.claimService.remove(+id);
  // }
}
