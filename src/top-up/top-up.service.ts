import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TopUp } from './entities/top-up.entity';
import { JwtService } from '@nestjs/jwt';

export const SECRET = 'topup-blow-secret-key';

@Injectable()
export class TopUpService {
  constructor(
    @InjectModel(TopUp.name) private topUpModel: Model<TopUp>,
    private jwtService: JwtService,
  ) {}

  getTopups(query: Record<string, string>) {
    const { search, limit } = query;

    const filter: Record<string, any> = {};
    if (search) filter.token = { $regex: search, $options: 'i' };

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.topUpModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
      .exec();
  }

  async generateTopUpToken(payload: { amount: number }) {
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '10y',
      secret: SECRET,
    });

    const newTopUp = await this.topUpModel.create({
      token,
      amount: payload.amount,
    });
    await newTopUp.save();

    return `https://blow.ru/account/services?topup=${token}`;
  }

  async verifyTopUpToken(data: { token: string }) {
    const isExist = await this.topUpModel.exists({ token: data.token });

    if (!isExist) throw new UnauthorizedException('Invalid or expired token');

    try {
      const decoded = await this.jwtService.verifyAsync(data.token, {
        secret: SECRET,
      });
      return decoded; // { amount: ... }
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  remove(id: string) {
    return this.topUpModel.deleteOne({ _id: id }).exec();
  }
}
