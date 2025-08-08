import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserRole,
  UserStatus,
  type ISession,
} from './entities/user.entity';
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
import { MailerService } from '@nestjs-modules/mailer';
import { Session } from 'src/session/entities/session.entity';
import { Guest } from 'src/guest/entities/guest.entity';
import { format } from 'date-fns';
import { base62FromObjectId, buildBaseSlug } from './slug.util';

const PASSWORD = 'bejse1-betkEv-vifcoh';
const TOP_ID = '6830b9a752bb4caefa0418a8';
const RAISE_ID = '6830b4d752bb4caefa041497';
const PREMIUM_ID = '6831be446c59cd4bad808bb5';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectModel(Guest.name) private guestModel: Model<Guest>,
    private readonly mailerService: MailerService,
    private readonly fileService: FileService,
  ) {}

  saltOrRounds = 12;

  /** Проверяет, существует ли slug у другого пользователя */
  private async slugExists(slug: string, excludeId?: string) {
    const q: any = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const cnt = await this.userModel.countDocuments(q).exec();
    return cnt > 0;
  }

  /** Возвращает уникальный slug, добавляя -2, -3, ... если нужно */
  private async ensureUniqueSlug(base: string, excludeId?: string) {
    let candidate = base || 'user';
    let n = 2;
    while (await this.slugExists(candidate, excludeId)) {
      candidate = `${base}-${n++}`;
    }
    return candidate;
  }

  /** Автогенерация slug и shortId (если нет) */
  private async ensureSlugAndShortId(user: any) {
    const id = String(user._id);
    const shortId = user.shortId || base62FromObjectId(id);

    let slug = user.slug;
    if (!slug) {
      const base = buildBaseSlug(user.firstName, user.age, user.city);
      slug = await this.ensureUniqueSlug(base, id);
    }

    const patch: any = {};
    if (user.shortId !== shortId) patch.shortId = shortId;
    if (user.slug !== slug) {
      patch.slug = slug;
      patch.slugStatus = user.slugStatus ?? 'auto'; // можно ввести поле статуса
    }

    if (Object.keys(patch).length) {
      await this.userModel.updateOne({ _id: id }, { $set: patch }).exec();
      return { ...user, ...patch };
    }
    return user;
  }

  /** Публичный и заполненный профиль? Используй свои реальные правила */
  private isCompletedProfile(u: any) {
    const hasPhoto = Array.isArray(u.photos) && u.photos.length > 0;
    return Boolean(u.firstName && u.age && u.city && hasPhoto);
  }

  async publicCount() {
    return this.userModel
      .countDocuments({
        isPublic: true,
        status: { $ne: 'inactive' }, // подправь под свои статусы
        // не банен и т.д.
      })
      .exec()
      .then((count) => ({ count }));
  }

  async listPublicForSitemap(skip = 0, limit = 45000) {
    const docs = await this.userModel
      .find(
        { isPublic: true, status: { $ne: 'inactive' } }, // + свои условия
        {
          slug: 1,
          shortId: 1,
          updatedAt: 1,
          firstName: 1,
          age: 1,
          city: 1,
          photos: 1,
        },
        { skip, limit, sort: { updatedAt: -1 } },
      )
      .lean()
      .exec();

    // гарантируем slug/shortId + фильтруем незаполненных
    const out: { slug?: string; shortId?: string; updatedAt?: string }[] = [];
    for (const u of docs) {
      const ensured = await this.ensureSlugAndShortId(u);
      if (!this.isCompletedProfile(ensured)) continue;
      out.push({
        slug: ensured.slug,
        shortId: ensured.shortId,
        updatedAt: ensured.updatedAt?.toISOString?.() ?? ensured.updatedAt,
      });
    }
    return out;
  }

  async slugById(id: string) {
    const user = await this.userModel
      .findById(id, { slug: 1, shortId: 1 })
      .lean()
      .exec();
    if (!user) throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const ensured = await this.ensureSlugAndShortId(user);
    return { slug: ensured.slug, shortId: ensured.shortId };
  }

  async create(data: CreateUserDto, file?: MFile) {
    const isExist = await this.getUserByEmail(data.email);

    if (isExist)
      throw new HttpException('User is already exists', HttpStatus.CONFLICT);

    const newPassword = data.password
      ? await bcrypt.hash(data.password, this.saltOrRounds)
      : await bcrypt.hash(PASSWORD, this.saltOrRounds);

    const newUser = new this.userModel({
      ...data,
      password: newPassword,
    });

    console.log('create', data.password, newPassword);

    const savedUser = await newUser.save();
    await this.ensureSlugAndShortId(savedUser);

    await this.buyService({
      userId: savedUser?._id.toString(),
      price: 0,
      serviceId: PREMIUM_ID,
      quantity: 0,
      period: ServicePeriod.DAY,
    });

    if (!file) return savedUser;

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

  async findAll(query: Record<string, string>) {
    const {
      status,
      limit,
      admin,
      online,
      search,
      active,
      sex,
      city,
      minage,
      maxage,
      withPhoto,
    } = query;

    const filter: any = admin
      ? { role: { $ne: UserRole.ADMIN } }
      : status !== UserStatus.ALL
        ? { status: UserStatus.ACTIVE }
        : {};

    if (online) {
      const fiveMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      filter.activity = { $gte: fiveMinutesAgo };
    }

    if (search) filter.firstName = { $regex: search, $options: 'i' };
    if (active) filter.status = UserStatus.ACTIVE;
    if (status && status !== UserStatus.ALL) filter.status = status;
    if (sex) filter.sex = sex;
    if (city) filter.city = city;
    if (minage || maxage) {
      filter.age = {
        $gte: parseInt(minage || '0', 10),
        $lte: parseInt(maxage || '150', 10),
      };
    }

    if (withPhoto) {
      filter.photos = { $exists: true, $not: { $size: 0 } };
    }

    const now = new Date();
    const topIdStr = String(TOP_ID);

    const limitValue = Number.parseInt(limit ?? '', 10);

    const users = await this.userModel
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            isTop: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: { $ifNull: ['$services', []] },
                      as: 's',
                      cond: {
                        $and: [
                          { $eq: [{ $toString: '$$s._id' }, topIdStr] },
                          { $gt: [{ $toDate: '$$s.expiredAt' }, now] },
                        ],
                      },
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $sort: {
            isTop: -1,
            raisedAt: -1,
            updatedAt: -1,
            createdAt: -1,
          },
        },
        { $limit: Number.isNaN(limitValue) ? 10 : limitValue },
        { $project: { password: 0 } },
      ])
      .exec();

    return users;
  }

  async findBySlug(slug: string) {
    return this.userModel
      .findOne({ slug })
      .select('-password')
      .populate([{ path: 'transactions', model: 'Transaction' }])
      .lean()
      .exec();
  }

  async findOne(id: string) {
    return await this.userModel
      .findOne({ _id: id })
      .select('-password')
      .populate([{ path: 'transactions', model: 'Transaction' }])
      .exec();
  }

  async update(id: string, data: UpdateUserDto, files?: Express.Multer.File[]) {
    const body = { ...data };

    const isBlocking = data.status === UserStatus.INACTIVE;

    if (data.password) {
      body.password = await bcrypt.hash(data.password, this.saltOrRounds);
    }

    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { ...body }, { new: true })
      .lean<User>() // чтобы TS видел твои поля
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    // проверяем необходимость генерации slug/shortId
    if (
      !result.slugStatus ||
      result.slugStatus === 'auto' ||
      result.slugStatus === 'pending'
    ) {
      await this.ensureSlugAndShortId(result);
    }

    if (isBlocking) {
      const formattedDate = format(
        new Date(Date.now()),
        "dd MM yyyy 'в' HH:mm",
      );

      this.mailerService.sendMail({
        to: result?.email,
        from: 'support@blow.ru',
        subject: `Новое сообщение от администрации — BLOW`,
        text: `Ваш аккаунт заблокирован`,
        html: `
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Новое сообщение — BLOW</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f9f9f9;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f9f9f9;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family: 'Montserrat', Arial, sans-serif;">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#e31e24" style="padding: 20px;">
                <img src="https://blow.igoshev.de/blow-logo.png" alt="BLOW Logo" width="160" style="display: block;" />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px 40px; color: #333333; font-size: 16px; line-height: 1.5;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Новое сообщение</h2>
                <p style="margin: 0 0 16px 0;">Здравствуйте, ${result?.firstName}!</p>
                <p style="margin: 0 0 16px 0;">
                  Ваша анкета на платформе <strong>BLOW</strong> была заблокирована. Для уточнения причин обратитесь в службу поддержки.
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">Дата и время: ${formattedDate}</p>

                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#e31e24" style="border-radius: 100px;">
                      <a href="https://t.me/blowadmin"
                         style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Чат поддержки
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 30px 0 0 0; font-size: 14px; color: #999;">
                  Пожалуйста, не отвечайте на это письмо — оно отправлено автоматически.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} BLOW. Все права защищены.
              </td>
            </tr>
          </table>

          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
          </style>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
      });
    }

    if (files?.length) {
      const media = await this.fileService.saveFile(files);

      if (media.length) {
        const urls = media.map((el) => el.url);
        const imageUrls = urls.filter((i) => i.includes('.webp'));
        const videoUrl = urls.filter((i) => i.includes('video'));
        const voice = urls.filter((i) => i.includes('.mp3'));

        const images = imageUrls.map((i: string, idx: number) => ({
          url: i,
          main: idx === 0,
          rank: idx === 0 ? 1 : 0,
        }));

        return this.userModel
          .findOneAndUpdate(
            //@ts-ignore
            { _id: result._id },
            {
              photos: [...result.photos, ...images],
              videoUrl: videoUrl[0],
              voice: voice[0],
            },
            { new: true },
          )
          .exec();
      }
    }

    return result;
  }

  async activity(
    id: string,
    timestamp: any,
    req: any,
    ip: any,
    userAgent: any,
  ) {
    if (!timestamp) return;

    // const user = await this.findOne(id);

    // const forwarded = req?.headers['x-forwarded-for'] as string;
    // const realIp = forwarded ? forwarded.split(',')[0] : ip;

    // const sessions = await this.sessionModel
    //   .find({ owner: user?._id })
    //   .sort({ createdAt: -1 })
    //   .limit(10)
    //   .exec();

    // if (user) {
    //   const lastSession = sessions[0];
    //   const THIRTY_MINUTES = 30 * 60 * 1000;

    //   //@ts-ignore
    //   const shouldCreateNew = !lastSession || Date.now() - lastSession.createdAt.getTime() > THIRTY_MINUTES;

    //   if (shouldCreateNew) {
    //     const newSession = new this.sessionModel({
    //       owner: user._id,
    //       ip: realIp,
    //       userAgent,
    //     });
    //     await newSession.save();
    //   }
    // }
    // let targetDate;
    // const now = new Date();
    // if (user?.activity) targetDate = new Date(user.activity);
    // const diffMs = now.getTime() - targetDate?.getTime(); // разница в миллисекундах
    // const diffMinutes = diffMs / (1000 * 60); // в минутах
    // let session;

    // if (diffMinutes > 30) {

    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { activity: timestamp }, { new: true })
      .exec();

    if (!result) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async visitsToGasts() {
    const users = await this.userModel.find().exec();
    if (!users) throw new HttpException('Not Found', HttpStatus.NOT_FOUND);

    users.forEach((user) => {
      user.visits.forEach((visit) => {
        const newGuest = new this.guestModel({ user: user._id, guest: visit });
        newGuest.save();
        console.log(visit);
      });
      this.userModel
        .findOneAndUpdate({ _id: user._id }, { visits: [] }, { new: true })
        .exec();
    });

    return 'ok';
  }

  async visit(id: string, data: { guest: string }) {
    await this.guestModel
      .findOneAndDelete({ user: id, guest: data.guest })
      .exec();

    const newGuest = new this.guestModel({ user: id, guest: data.guest });
    newGuest.save();

    //   const user = await this.userModel.findById(id);

    //   if (!user) return;

    //   let visits = [...user.visits];

    //   const record = visits.find((el: any) => el._id === data.guest);

    //   if (record) {
    //     visits = visits.filter((el: any) => el._id !== data.guest);
    //   }

    //   visits.unshift({ date: data.timestamp, _id: data.guest });

    //   const result = await this.userModel
    //     .findOneAndUpdate({ _id: id }, { visits: [...visits] }, { new: true })
    //     .exec();

    //   if (!result) {
    //     throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    //   }

    //   return result;
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

  getUserByConfirmToken(token: string) {
    return this.userModel.findOne({ confirmToken: token }).exec();
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
    serviceId = serviceId.toString();
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
    const canActivate =
      user?.services?.find((s: any) => s?._id == RAISE_ID)?.quantity > 0;

    if (!canActivate) return null;

    const services = user?.services?.map((s: any) => {
      if (s._id === RAISE_ID) {
        return { ...s, quantity: +s.quantity - 1 };
      }

      return s;
    });

    return await this.userModel
      .findOneAndUpdate(
        { _id: id },
        {
          raisedAt: new Date(Date.now()),
          services: [...services],
        },
        { new: true },
      )
      .exec();
  }
}
