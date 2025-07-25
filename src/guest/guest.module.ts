import { Module } from '@nestjs/common';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';
import { Guest, GuestSchema } from './entities/guest.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guest.name, schema: GuestSchema }]),
  ],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestModule, GuestService],
})
export class GuestModule {}
