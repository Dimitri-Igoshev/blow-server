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
      const newMailing = new this.mailingModel(data);
      return await newMailing.save();
    }
  
    async findAll() {
      return await this.mailingModel.find()
        .sort({ order: -1 })
        .exec();
    }
  
    findOne(id: string) {
      return this.mailingModel.findOne({ _id: id }).exec();
    }
  
    update(id: string, data: UpdateMailingDto) {
      return this.mailingModel.findOneAndUpdate(
        { _id: id }, 
        { ...data }, 
        { new: true }
      )
        .exec();
    }
  
    remove(id: string) {
      return this.mailingModel.deleteOne({ _id: id }).exec();
    }
}