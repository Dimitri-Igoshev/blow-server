import { Injectable } from '@nestjs/common';
import { CreateMailingDto } from './dto/create-mailing.dto';
import { UpdateMailingDto } from './dto/update-mailing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mailing } from './entities/mailing.entity';

@Injectable()
export class MailingService {
  constructor(
    @InjectModel(Mailing.name) private mailingModel: Model<Mailing>,
  ) {}

  async create(data: CreateMailingDto) {
    const newMailing = new this.mailingModel({
      ...data,
      updatedAt: new Date(),
    });
    return await newMailing.save();
  }

  async findAll() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 часа назад

    return await this.mailingModel
      .find({ createdAt: { $gte: oneDayAgo } }) // фильтр по createdAt
      .populate([
        { path: 'owner', model: 'User' },
        { path: 'interested', model: 'User' },
      ])
      .sort({ updatedAt: -1 })
      .exec();
  }

  findOne(id: string) {
    return this.mailingModel
      .findOne({ _id: id })
      .populate([
        { path: 'owner', model: 'User' },
        { path: 'interested', model: 'User' },
      ])
      .exec();
  }

  update(id: string, data: UpdateMailingDto) {
    return this.mailingModel
      .findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.mailingModel.deleteOne({ _id: id }).exec();
  }
}
