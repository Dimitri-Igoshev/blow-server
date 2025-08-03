import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from './entities/session.entity';
import type { Model } from 'mongoose';
// import { CreateSessionDto } from './dto/create-session.dto';
// import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  // async create(data: any) {
  //   const newSession = new this.sessionModel(data);
  //   return await newSession.save();
  // }

  // findAll(query: Record<string, string>) {
  //   const { limit, userId } = query;

  //   const limitValue = Number.parseInt(limit ?? '', 10);

  //   return this.sessionModel
  //     .find({ owner: userId })
  //     .sort({ createdAt: -1 })
  //     .limit(Number.isNaN(limitValue) ? 10 : limitValue)
  //     .exec();
  // }

  async create(userId: string, ip: string, userAgent: string) {
    const session = new this.sessionModel({ userId, ip, userAgent });
    return await session.save();
  }

  async updateActivity(sessionId: string) {
    await this.sessionModel
      .findOneAndUpdate(
        { _id: sessionId },
        { lastActivityAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async get(sessionId: string) {
    return this.sessionModel.findOne({ _id: sessionId }).exec();
  }

  async getAll(query: Record<string, string>) {
    const { limit, userId } = query;

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.sessionModel
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} session`;
  // }

  // update(id: number, updateSessionDto: UpdateSessionDto) {
  //   return `This action updates a #${id} session`;
  // }

  remove(id: string) {
    return this.sessionModel.findOneAndDelete({ _id: id }).exec();
  }
}
