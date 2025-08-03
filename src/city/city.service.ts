import { Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { City } from './entities/city.entity';

@Injectable()
export class CityService {
  constructor(@InjectModel(City.name) private cityModel: Model<City>) {}

  async create(data: CreateCityDto) {
    const newCity = new this.cityModel(data);
    return await newCity.save();
  }

  findAll(query: Record<string, string>) {
    const { search, limit } = query;

    const filter: Record<string, any> = {};
    if (search) filter.label = { $regex: search, $options: 'i' };

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.cityModel
      .find(filter)
      .sort({ order: 1, label: 1 })
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  update(id: string, data: any) {
    return this.cityModel.findOneAndUpdate(
      { _id: id },
      { ...data },
      { new: true },
    );
  }

  remove(id: string) {
    return this.cityModel.findOneAndDelete({ _id: id }).exec();
  }
}
