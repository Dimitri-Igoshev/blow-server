import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Sale } from './entities/sale.entity';
import type { Model } from 'mongoose';

@Injectable()
export class SaleService {
  constructor(@InjectModel(Sale.name) private saleModel: Model<Sale>) {}

  async create(data: CreateSaleDto) {
    const newSale = new this.saleModel(data);
    return await newSale.save();
  }

  findAll(query: Record<string, string>) {
    const { limit } = query;

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.saleModel
      .find()
      .sort({ createdAt: -1 })
      .populate([
        { path: 'seller', model: 'User' },
        { path: 'buyer', model: 'User' },
      ])
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  findOne(id: string) {
    return this.saleModel.findOne({ _id: id }).exec();
  }

  update(id: string, data: UpdateSaleDto) {
    return this.saleModel
      .findOneAndUpdate({ _id: id }, { data }, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.saleModel.findByIdAndDelete({ _id: id }).exec();
  }
}
