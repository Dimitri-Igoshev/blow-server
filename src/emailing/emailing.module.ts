import { Module } from '@nestjs/common';
import { EmailingService } from './emailing.service';
import { EmailingController } from './emailing.controller';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [EmailingController],
  providers: [EmailingService],
})
export class EmailingModule {}
