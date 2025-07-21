import { Injectable } from '@nestjs/common';
import { CreateClaimDto } from './dto/create-claim.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Claim } from './entities/claim.entity';
import { Model } from 'mongoose';

@Injectable()
export class ClaimService {
  constructor(@InjectModel(Claim.name) private claimModel: Model<Claim>) {}

  async create(data: CreateClaimDto) {
    const newClaim = new this.claimModel(data);
    return await newClaim.save();
  }

  findAll(query: Record<string, string>) {
    const { search, limit } = query;

    const filter: Record<string, any> = {};
    if (search) filter.text = { $regex: search, $options: 'i' };

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.claimModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate([
        { path: 'from', model: 'User' },
        { path: 'about', model: 'User' },
      ])
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  update(id: string, data: any) {
    return this.claimModel.findOneAndUpdate({ _id: id }, { ...data }, { new: true });
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
