import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Service } from './entities/service.entity';
import { Model } from 'mongoose';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<Service>,
  ) {}

  async create(data: CreateServiceDto) {
    const isExist = await this.serviceModel.findOne({ name: data.name });

    if (isExist)
      throw new HttpException(
        'Service with this name is already exists',
        HttpStatus.CONFLICT,
      );

    const newService = new this.serviceModel(data);
    return await newService.save();
  }

  async findAll() {
    return await this.serviceModel
      .find()
      .sort({ order: -1 })
      .populate([{ path: 'services', model: 'Service' }])
      .exec();
  }

  findOne(id: string) {
    return this.serviceModel
      .findOne({ _id: id })
      .populate([{ path: 'services', model: 'Service' }])
      .exec();
  }

  update(id: string, data: UpdateServiceDto) {
    return this.serviceModel
      .findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.serviceModel.deleteOne({ _id: id }).exec();
  }
}
