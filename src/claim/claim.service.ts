import { Injectable } from '@nestjs/common';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Claim } from './entities/claim.entity';
import type { Model } from 'mongoose'

@Injectable()
export class ClaimService {
  constructor(@InjectModel(Claim.name) private claimModel: Model<Claim>) {}

  async create(data: CreateClaimDto) {
    const newClaim = new this.claimModel(data);
    return await newClaim.save();
  }

  // findAll() {
  //   return `This action returns all claim`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} claim`;
  // }

  // update(id: number, updateClaimDto: UpdateClaimDto) {
  //   return `This action updates a #${id} claim`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} claim`;
  // }
}
