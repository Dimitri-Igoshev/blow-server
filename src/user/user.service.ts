import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, type IGuest } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MFile } from 'src/file/mfile.class';
import { FileService } from 'src/file/file.service';

const PASSWORD = 'bejse1-betkEv-vifcoh';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
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

  async findAll({ online, sex, city, minage, maxage, limit = 12 }) {
    const filter: any = {};

    if (online) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      filter.activity = { $gte: oneMinuteAgo };
    }

    if (sex) filter.sex = sex;
    if (city) filter.city = city;
    if (minage || maxage)
      filter.age = {
        $gte: parseInt(minage || 0),
        $lte: parseInt(maxage || 150),
      };

    return await this.userModel
      .find(filter)
      // .or([
      //   { firstName: { $regex: search, $options: 'i' } },
      //   { lastName: { $regex: search, $options: 'i' } },
      //   { email: { $regex: search, $options: 'i' } },
      // ])
      .select('-password')
      .sort({ activity: -1 })
      .limit(limit)
      // .populate([{ path: 'projects', model: 'Project' }])
      .exec();
  }

  async findOne(id: string) {
    return await this.userModel
      .findOne({ _id: id })
      .select('-password')
      // .populate([{ path: 'projects', model: 'Project' }])
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

  async addBalance({ id, sum }: { id: string, sum: number }) {
    const user = await this.findOne(id)

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

    //Создать транзакцию { _id, date, type, method, sum, description }

    return await this.userModel
      .findOneAndUpdate({ _id: id }, { balance: Number(user.balance) + Number(sum) }, { new: true })
      .exec();
  }
}
