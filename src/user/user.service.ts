import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MFile } from 'src/file/mfile.class';
import { FileService } from 'src/file/file.service';
import {
  Transaction,
  TransactionMethod,
  TransactionStatus,
  TransactionType,
} from 'src/transaction/entities/transaction.entity';
import { ServicePeriod } from 'src/services/entities/service.entity';
import { BuyServiceDto } from 'src/services/dto/buy-service.dto';

const PASSWORD = 'bejse1-betkEv-vifcoh';
const TOP_ID = '6830b9a752bb4caefa0418a8';
const RAISE_ID = '6830b4d752bb4caefa041497';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly fileService: FileService,
  ) {}

  saltOrRounds = 12;

  async create(data: CreateUserDto, file?: MFile) {
    const isExist = await this.getUserByEmail(data.email);

    if (isExist)
      throw new HttpException('User is already exists', HttpStatus.CONFLICT);

    const newUser = new this.userModel({
      ...data,
      password: data.password
        ? await bcrypt.hash(data.password, this.saltOrRounds)
        : await bcrypt.hash(PASSWORD, this.saltOrRounds),
    });

    const savedUser = await newUser.save();

    if (!file) return data;

    const uploaded = await this.fileService.saveFile([file]);

    if (uploaded && uploaded[0]?.url) {
      return this.userModel.findOneAndUpdate(
        { _id: savedUser._id },
        { photoUrl: uploaded[0].url },
        { new: true },
      );
    } else {
      return savedUser;
    }
  }

  async findAll({
    online,
    sex,
    city,
    minage,
    maxage,
    withPhoto = false,
    limit = 12,
  }) {
    const filter: any = {};

    if (online) {
      const fiveMinuteAgo = new Date(Date.now() - 300 * 1000);
      filter.activity = { $gte: fiveMinuteAgo };
    }

    if (sex) filter.sex = sex;
    if (city) filter.city = city;
    if (minage || maxage)
      filter.age = {
        $gte: parseInt(minage || 0),
        $lte: parseInt(maxage || 150),
      };
    if (withPhoto) filter.photos = { $exists: true, $not: { $size: 0 } };

    const topUsers = await this.userModel
      .find({
        ...filter,
        services: {
          $elemMatch: {
            _id: TOP_ID,
            expiredAt: { $gt: new Date(Date.now()) },
          },
        },
      })
      // .or([
      //   { firstName: { $regex: search, $options: 'i' } },
      //   { lastName: { $regex: search, $options: 'i' } },
      //   { email: { $regex: search, $options: 'i' } },
      // ])
      .select('-password')
      .sort({ raisedAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(limit)
      // .populate([{ path: 'projects', model: 'Project' }])
      .exec();

    if (topUsers.length < limit) {
      const users = await this.userModel
        .find({
          ...filter,
          $nor: [
            {
              services: {
                $elemMatch: {
                  _id: TOP_ID,
                  expiredAt: { $gt: new Date() },
                },
              },
            },
          ],
        })
        .select('-password')
        .sort({ raisedAt: -1, updatedAt: -1, createdAt: -1 })
        .limit(limit - topUsers.length);

      return [...topUsers, ...users];
    }

    return [...topUsers];
  }

  async findOne(id: string) {
    return await this.userModel
      .findOne({ _id: id })
      .select('-password')
      .populate([{ path: 'transactions', model: 'Transaction' }])
      .exec();
  }

  async update(id: string, data: UpdateUserDto, files?: Express.Multer.File[]) {
    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    if (files?.length) {
      const media = await this.fileService.saveFile(files);

      if (media.length) {
        const urls = media.map((el) => el.url);
        const imageUrls = urls.filter((i) => i.includes('.webp'));
        const videoUrl = urls.filter((i) => i.includes('video'));

        const images = imageUrls.map((i: string, idx: number) => ({
          url: i,
          main: idx === 0,
          rank: idx === 0 ? 1 : 0,
        }));

        return this.userModel
          .findOneAndUpdate(
            { _id: result.id },
            {
              photos: [...result.photos, ...images],
              videoUrl: videoUrl[0],
            },
            { new: true },
          )
          .exec();
      }
    }

    return result;
  }

  async activity(id: string, timestamp: any) {
    if (!timestamp) return;

    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { activity: timestamp }, { new: true })
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async visit(id: string, data: { timestamp: any; guest: string }) {
    if (!data?.timestamp || !data?.guest) return;

    const user = await this.userModel.findById(id);

    if (!user) return;

    let visits = [...user.visits];

    const record = visits.find((el: any) => el._id === data.guest);

    if (record) {
      visits = visits.filter((el: any) => el._id !== data.guest);
    }

    visits.unshift({ date: data.timestamp, _id: data.guest });

    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { visits: [...visits] }, { new: true })
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async createNote(id: string, data: { text: string; userId: string }) {
    const user = await this.findOne(id);

    if (!user) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    const notes = [...user.notes];

    const result = await this.userModel
      .findOneAndUpdate(
        { _id: id },
        { notes: [{ _id: data.userId, text: data.text }, ...notes] },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async updateNote(id: string, data: { text: string; userId: string }) {
    const user = await this.findOne(id);

    if (!user) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    let notes = [...user.notes];

    notes = notes.filter((i: any) => i?._id !== data.userId);
    notes.unshift({ _id: data.userId, text: data.text });

    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { notes: [...notes] }, { new: true })
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
  }

  async deleteNote(id: string, userId: string) {
    const user = await this.findOne(id);

    if (!user) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    let notes = [...user.notes];

    if (notes.length) {
      notes = notes.filter((i: any) => i?._id !== userId);
    }

    return await this.userModel
      .findOneAndUpdate({ _id: id }, { notes: [...notes] }, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.userModel.deleteOne({ _id: id }).exec();
  }

  getUserByEmail(email: string) {
    return this.userModel.findOne({ email: email }).exec();
  }

  getUserByResetToken(token: string) {
    return this.userModel.findOne({ resetToken: token }).exec();
  }

  getUserByTransactionTracingNumber(trackingId: string) {
    return this.userModel
      .findOne({ 'transactions.trackingId': trackingId })
      .exec();
  }

  async addBalance({ id, sum }: { id: string; sum: number }) {
    const user = await this.findOne(id);

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const transaction = new this.transactionModel({
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: id,
      type: TransactionType.CREDIT,
      method: TransactionMethod.TEST,
      sum: +sum,
      status: TransactionStatus.PAID,
      description: `Пополнение баланса на ${sum}`,
    });

    const newTransaction = await transaction.save();

    return await this.userModel
      .findOneAndUpdate(
        { _id: id },
        {
          balance: user?.balance ? +user.balance + sum : sum,
          transactions: [newTransaction, ...user.transactions],
        },
        { new: true },
      )
      .exec();
  }

  getExpiredDate(period: string, currentDate = new Date(Date.now())) {
    switch (period) {
      case ServicePeriod.DAY:
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case ServicePeriod.DAYS:
        currentDate.setDate(currentDate.getDate() + 3);
        break;
      case ServicePeriod.WEEK:
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case ServicePeriod.MONTH:
        currentDate.setDate(currentDate.getDate() + 30);
        break;
      case ServicePeriod.QUARTER:
        currentDate.setDate(currentDate.getDate() + 90);
        break;
      default:
        break;
    }

    return currentDate;
  }

  async buyService({
    userId,
    price,
    name,
    serviceId,
    quantity = 0,
    period,
  }: BuyServiceDto) {
    const user = await this.userModel.findOne({ _id: userId });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (+user.balance < +price) {
      throw new HttpException('Not enough money', HttpStatus.BAD_REQUEST);
    }

    const transaction = new this.transactionModel({
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      type: TransactionType.DEBIT,
      method: TransactionMethod.TEST,
      sum: +price,
      description: `Покупка услуги ${name || ''}`,
    });

    let newTransaction;

    if (price) {
      newTransaction = await transaction.save();

      if (!newTransaction)
        throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let newService: any = null;

    const existingService = user?.services.find(
      (s: any) => s._id === serviceId,
    );

    let userServices = [...user?.services];

    let changedServices: any = {
      _id: serviceId,
    };

    if (!existingService) {
      newService = {
        _id: serviceId,
        quantity: quantity || 0,
        expiredAt: period ? this.getExpiredDate(period) : null,
      };

      userServices = [newService, ...userServices];
    } else {
      if (period) {
        const date =
          new Date(existingService.expiredAt) < new Date(Date.now())
            ? new Date(Date.now())
            : new Date(existingService.expiredAt);
        changedServices.expiredAt = period
          ? this.getExpiredDate(period, date)
          : null;

        userServices = userServices.filter((s: any) => s._id !== serviceId);

        userServices = [changedServices, ...userServices];
      }
      if (quantity) {
        changedServices.quantity = +existingService.quantity + +quantity;

        userServices = userServices.filter((s: any) => s._id !== serviceId);
        userServices = [changedServices, ...userServices];
      }
    }

    return await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        {
          services: [...userServices],
          balance: +user.balance - +price,
          transactions: [newTransaction, ...user.transactions],
        },
        { new: true },
      )
      .exec();
  }

  async buyServicesKit({
    userId,
    price,
    name,
    serviceId,
    quantity = 0,
    period,
    services,
    servicesOptions,
  }: BuyServiceDto) {
    await this.buyService({ userId, price, name, serviceId, quantity, period });

    if (!servicesOptions?.length || !services) return;

    // services?.forEach((service: any, idx: number) => {
    await this.buyService({
      userId,
      serviceId: services[0]?._id,
      price: 0,
      name: servicesOptions[0]?.name,
      quantity: servicesOptions[0]?.quantity || 0,
      period:
        !servicesOptions[0]?.quantity && servicesOptions[0]?.period
          ? servicesOptions[0]?.period
          : '',
    });
    // });

    await this.buyService({
      userId,
      serviceId: services[1]?._id,
      price: 0,
      name: servicesOptions[1]?.name,
      quantity: servicesOptions[1]?.quantity || 0,
      period:
        !servicesOptions[1]?.quantity && servicesOptions[1]?.period
          ? servicesOptions[1]?.period
          : '',
    });

    await this.buyService({
      userId,
      serviceId: services[2]?._id,
      price: 0,
      name: servicesOptions[2]?.name,
      quantity: servicesOptions[2]?.quantity || 0,
      period:
        !servicesOptions[2]?.quantity && servicesOptions[2]?.period
          ? servicesOptions[2]?.period
          : '',
    });

    await this.buyService({
      userId,
      serviceId: services[3]?._id,
      price: 0,
      name: servicesOptions[3]?.name,
      quantity: servicesOptions[3]?.quantity || 0,
      period:
        !servicesOptions[3]?.quantity && servicesOptions[3]?.period
          ? servicesOptions[3]?.period
          : '',
    });
  }

  async useRaiseProfile(id) {
    const user = await this.userModel.findOne({ _id: id });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // @ts-ignore
    const canActivate = user?.services?.find((s: any) => s?._id === RAISE_ID)?.quantity > 0;

    if (!canActivate) return null;

    const services = user?.services?.map((s: any) => {
      if (s._id === RAISE_ID) {
        return { ...s, quantity: +s.quantity - 1 };
      }

      return s;
    });

    return this.userModel
      .findOneAndUpdate(
        { _id: id },
        { ...user, raisedAt: new Date(Date.now()), services },
        { new: true },
      )
      .exec();
  }
}
