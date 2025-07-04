import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './entities/message.entity';
import { Gateway } from 'src/gateway/gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private messageModel: Model<Message>,
    @InjectModel('Chat') private chatModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    private readonly chatGateway: Gateway,
  ) {}

  async createMessage(data): Promise<Message> {
    const chat = await this.findOrCreateChat({
      sender: data?.sender || '',
      recipient: data?.recipient || '',
    });

    const message = new this.messageModel({
      chat: chat._id,
      ...data,
      updatedAt: new Date(Date.now()),
    });

    await this.chatModel
      .findOneAndUpdate(
        { _id: chat._id },
        { messages: [message, ...chat.messages] },
        { new: true },
      )
      .exec();

    this.chatGateway.onNewMessage(null);
    return message.save();
  }

  async getChats(userId): Promise<any[]> {
    return await this.chatModel
      .find({ $or: [{ sender: userId }, { recipient: userId }] })
      .populate([
        { path: 'sender', model: 'User' },
        { path: 'recipient', model: 'User' },
        { path: 'messages', model: 'Message' },
      ])
      .exec();
  }

  async updateMessage(id, data): Promise<Message> {
    const message = await this.messageModel
      .findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .exec();

    if (!message) throw new Error('Message not found');

    return message;
  }

  async deleteMessage(id): Promise<any> {
    return await this.messageModel.deleteOne({ _id: id }).exec();
  }

  async deleteChat(id): Promise<any> {
    return await this.chatModel.findByIdAndDelete(id).exec();
  }

  async deleteChatWithMessages(id: string, userId: string): Promise<any> {
    const user = await this.userModel.findOne({ _id: userId }).exec();
    if (!user) throw new Error('User not found');

    const removeQnt = user.services.find(
      (s: any) => s._id === '6831857219e3572edace86ba',
    )?.quantity;

    if (removeQnt < 1) throw new Error('Not enough services');

    await this.messageModel.deleteMany({ chat: id }).exec();
    await this.chatModel.findByIdAndDelete(id).exec();

    const services = user.services.map((s: any) => {
      if (s._id === '6831857219e3572edace86ba') {
        return { ...s, quantity: s.quantity - 1 };
      } else {
        return s;
      }
    });

    return this.userModel
      .findOneAndUpdate({ _id: id }, { services }, { new: true })
      .exec();
  }

  async deleteUserChats(userId: string): Promise<any> {
    const chats = await this.chatModel
      .find({ $or: [{ sender: userId }, { recipient: userId }] })
      .exec();

    const chatIds = chats.map((c) => c._id);

    await this.messageModel.deleteMany({ chat: { $in: chatIds } }).exec();

    return await this.chatModel.deleteMany({ _id: { $in: chatIds } }).exec();
  }

  async getMessagesByChatId(chatId): Promise<Message[]> {
    console.log(chatId);
    return this.messageModel
      .find({ chat: chatId })
      .populate([{ path: 'sender', model: 'User' }])
      .exec();
  }

  async findOrCreateChat(data: any): Promise<any> {
    if (!data?.sender || !data?.recipient) throw new Error('Missing data');

    let chat = await this.chatModel
      .findOne({
        $or: [
          {
            $and: [{ sender: data.sender }, { recipient: data.recipient }],
          },
          {
            $and: [{ sender: data.recipient }, { recipient: data.sender }],
          },
        ],
      })
      .exec();

    if (!chat) {
      chat = new this.chatModel(data);
      await chat.save();
    }

    return chat;
  }
}
