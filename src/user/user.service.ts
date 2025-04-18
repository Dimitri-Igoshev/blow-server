import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
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

  async findAll() {
    const filter: any = {};

    return await this.userModel
      .find(filter)
      // .or([
      //   { firstName: { $regex: search, $options: 'i' } },
      //   { lastName: { $regex: search, $options: 'i' } },
      //   { email: { $regex: search, $options: 'i' } },
      // ])
      .select('-password')
      // .limit(limit)
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

  async update(id: string, data: UpdateUserDto) {
    // if (file) {
    //   const uploaded = await this.fileService.saveFile([file]);
    //   if (uploaded && uploaded[0]?.url) data.photoUrl = uploaded[0].url;
    // }

    return await this.userModel
      .findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .select('-password')
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
}
