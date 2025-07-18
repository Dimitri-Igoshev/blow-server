import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TopUp } from './entities/top-up.entity';
import { JwtService } from '@nestjs/jwt';

const SECRET = 'topup-blow-secret-key';

@Injectable()
export class TopUpService {
  constructor(
    @InjectModel(TopUp.name) private topUpModel: Model<TopUp>,
    private jwtService: JwtService,
  ) { }

  async generateTopUpToken(amount: number) {
    const token = await this.jwtService.signAsync({ amount }, {
      expiresIn: '10y',
      secret: SECRET,
    });

    const newTopUp = await this.topUpModel.create({ token, amount})
    await newTopUp.save();

    return `https://blow.ru/account/services?topup=${token}`;
  }

  async verifyTopUpToken(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
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
