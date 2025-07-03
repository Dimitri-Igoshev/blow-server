import { Module } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Claim, ClaimSchema } from './entities/claim.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Claim.name, schema: ClaimSchema }]),
  ],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
