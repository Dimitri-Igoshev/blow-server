import { Injectable } from '@nestjs/common';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Withdrawal } from './entities/withdrawal.entity';
import { Model } from 'mongoose';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<Withdrawal>,
  ) {}

  async create(data: CreateWithdrawalDto) {
    const newWithdrawal = new this.withdrawalModel(data);
    return await newWithdrawal.save();
  }

  async findAll(query: Record<string, string>) {
    const { limit, userId } = query;

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.withdrawalModel
      .find()
      .populate([{ path: 'user', model: 'User' }])
      .sort({ createdAt: -1 })
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  async findOne(id: string) {
    return await this.withdrawalModel
      .findOne({ _id: id })
      .populate([{ path: 'user', model: 'User' }])
      .sort({ order: -1 })
      .exec();
  }

  async update(id: string, data: UpdateWithdrawalDto) {
    return await this.withdrawalModel
      .findOneAndUpdate({ _id: id }, { status: data.status }, { new: true })
      .exec();
  }
}
