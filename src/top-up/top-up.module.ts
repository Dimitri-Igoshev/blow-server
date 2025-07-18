import { Module } from '@nestjs/common';
import { TopUpService } from './top-up.service';
import { TopUpController } from './top-up.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TopUp, TopUpSchema } from './entities/top-up.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TopUp.name, schema: TopUpSchema }]),
  ],
  controllers: [TopUpController],
  providers: [TopUpService],
})
export class TopUpModule { }
