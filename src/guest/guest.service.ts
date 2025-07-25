import { Injectable } from '@nestjs/common';
import { CreateGuestDto } from './dto/create-guest.dto';
import { Guest } from './entities/guest.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class GuestService {
  constructor(@InjectModel('Guest') private guestModel: Model<Guest>) {}

  create(data: CreateGuestDto) {
    const newGuest = new this.guestModel(data);
    return newGuest.save();
  }

  findAll(id: string) {
    return this.guestModel
      .find({ user: id })
      .populate([{ path: 'guest', model: 'User' }])
      .sort({ updatedAt: -1 })
      .exec();
  }
}
