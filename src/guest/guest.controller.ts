import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';

@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post()
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestService.create(createGuestDto);
  }

  @Get('/:id')
  findAll(@Param('id') id: string) {
    return this.guestService.findAll(id);
  }
}
