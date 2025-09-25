import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Message } from './entities/message.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { format } from 'date-fns';
import { UserStatus } from 'src/user/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { isPremium } from 'src/common/utils/checkIsActive'
import { sanitizeContactsClient } from './sanitizeClient'

interface MessageNotificationParams {
  recipient: any;
  sender: any;
  messageText: string;
  chatLink: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private messageModel: Model<Message>,
    @InjectModel('Chat') private chatModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    private readonly mailerService: MailerService,
  ) {}

  sendNewMessageNotification({
    recipient,
    sender,
    messageText,
    chatLink,
  }: MessageNotificationParams) {
    const formattedDate = format(new Date(Date.now()), "dd MM yyyy 'в' HH:mm");

    return this.mailerService.sendMail({
      to: recipient?.email,
      from: 'support@blow.ru',
      subject: `Новое сообщение от ${sender.firstName} — BLOW`,
      text: `Новое сообщение от ${sender.firstName}: ${messageText}`,
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
                <p style="margin: 0 0 16px 0;">Здравствуйте, ${recipient?.firstName}!</p>
                <p style="margin: 0 0 16px 0;">
                  Вы получили новое сообщение от <strong>${sender?.firstName}</strong> на платформе <strong>BLOW</strong>
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">Дата и время: ${formattedDate}</p>

                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#e31e24" style="border-radius: 100px;">
                      <a href="${chatLink}"
                         style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Перейти на сайт
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

  async createMessage(data: {
    sender: string;
    recipient: string;
    text?: string;
    fileUrl?: string;
    replyTo?: string | null;
  }): Promise<Message> {
    // 1) создаём или находим чат
    const chat = await this.findOrCreateChat({
      sender: data?.sender || '',
      recipient: data?.recipient || '',
    });

    // 2) проверка блокировок
    const [candidate, me] = await Promise.all([
      this.userModel.findOne({ _id: data?.recipient }).exec(),
      this.userModel.findOne({ _id: data?.sender }).exec(),
    ]);

    const isBlocked =
      candidate?.blockList?.some((id) => String(id) === String(data.sender)) ||
      me?.blockList?.some((id) => String(id) === String(data.recipient));

    if (isBlocked) {
      // Можно вернуть null или кинуть ошибку — на ваше усмотрение
      return null as any;
    }

    // 3) создаём и сохраняем сообщение (timestamps заполнит createdAt/updatedAt)
    const message = new this.messageModel({
      chat: chat._id,
      sender: data.sender,
      recipient: data.recipient,
      text: data?.text ?? '',
      fileUrl: data?.fileUrl ?? '',
      replyTo: data?.replyTo ?? null,
      unreadBy: [data.recipient],
    });

    const savedMessage = await message.save(); // ВАЖНО: await

    // 4) добавляем id сообщения в начало массива сообщений чата
    //    (не перезаписываем весь массив и не пихаем «сырой» документ)
    await this.chatModel
      .findByIdAndUpdate(
        chat._id,
        {
          $push: {
            messages: { $each: [savedMessage._id], $position: 0 },
          },
          // опционально: поддержка «последнего сообщения»/времени
          // $set: { lastMessageAt: savedMessage.createdAt, lastMessage: savedMessage._id },
        },
        { new: true },
      )
      .exec();

    // 5) подтянем отправителя/получателя для уведомления
    const [sender, recipient] = await Promise.all([
      this.userModel.findOne({ _id: data.sender }).select('-password').exec(),
      this.userModel
        .findOne({ _id: data.recipient, status: UserStatus.ACTIVE })
        .select('-password')
        .exec(),
    ]);

    if (!sender || !recipient) {
      // при желании можно удалить сообщение/откатить изменения в чате
      throw new Error('User not found');
    }

    // 6) уведомление
    this.sendNewMessageNotification({
      recipient: {
        email: recipient?.email || '',
        firstName: recipient?.firstName || 'пользователь Blow',
      },
      sender: {
        firstName: sender?.firstName || 'пользователя Blow',
      },
      messageText: isPremium(recipient) || recipient?.sex === 'female' ? savedMessage?.text : sanitizeContactsClient(savedMessage?.text).text,
      chatLink: `https://blow.ru`,
    });

    // 7) вернуть сохранённое сообщение (с корректными датами)
    return savedMessage;
  }

  async createSystemMessage(data: any) {
    const message = new this.messageModel({
      chat: data?.chat,
      type: 'system',
      recipient: data?.recipient,
      text: data?.text,
      unreadBy: data?.unreadBy || [data?.recipient],
    });

    const savedMessage = await message.save();

    await this.chatModel
      .findByIdAndUpdate(
        data?.chat,
        {
          $push: {
            messages: { $each: [savedMessage._id], $position: 0 },
          },
          // опционально: поддержка «последнего сообщения»/времени
          // $set: { lastMessageAt: savedMessage.createdAt, lastMessage: savedMessage._id },
        },
        { new: true },
      )
      .exec();

    const recipient = await this.userModel
      .findOne({ _id: data.recipient, status: UserStatus.ACTIVE })
      .select('-password')
      .exec();

    if (!recipient) {
      throw new Error('User not found');
    }

    this.sendNewMessageNotification({
      recipient: {
        email: recipient?.email || '',
        firstName: recipient?.firstName || 'пользователь Blow',
      },
      sender: {
        firstName: 'BLOW - системное сообщение',
      },
      messageText: savedMessage?.text || '',
      chatLink: `https://blow.ru`,
    });
    return savedMessage;
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

  getAllMessages(query: Record<string, string>) {
    const { search, limit, userId } = query;

    const filter: Record<string, any> = {};
    if (search) {
      filter.text = { $regex: search, $options: 'i' };
    }
    if (userId) filter.$or = [{ sender: userId }, { recipient: userId }];

    const limitValue = Number.parseInt(limit ?? '', 10);

    return this.messageModel
      .find(filter)
      .sort({ createdAt: -1, text: 1 })
      .populate([
        { path: 'sender', model: 'User' },
        { path: 'recipient', model: 'User' },
        {
          path: 'replyTo',
          model: 'Message',
          populate: {
            path: 'sender',
            model: 'User',
          },
        },
      ])
      .limit(Number.isNaN(limitValue) ? 10 : limitValue)
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

    const services = user?.services?.map((s: any) => {
      if (s._id === '6831857219e3572edace86ba') {
        return { ...s, quantity: +s.quantity - 1 };
      }
      return s;
    });

    return await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        {
          services: [...services],
        },
        { new: true },
      )
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
      .populate([
        { path: 'sender', model: 'User' },
        {
          path: 'replyTo',
          model: 'Message',
          populate: {
            path: 'sender',
            model: 'User',
          },
        },
      ])
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

  // Fake services

  private toObjectId(val?: unknown): Types.ObjectId | undefined {
    if (typeof val === 'string' && isValidObjectId(val)) {
      return new Types.ObjectId(val);
    }
    return undefined;
  }

  getFakeMessages(rawQuery: Record<string, string>) {
    const { search, chat, limit } = rawQuery;

    const limitValue = Number.parseInt(limit ?? '', 10);
    const matchStage: Record<string, any> = {};

    // Текстовый поиск
    if (search) {
      matchStage.text = { $regex: search, $options: 'i' };
    }

    // chat — строго валидируем
    if (chat) {
      const chatId = this.toObjectId(chat);
      if (chatId) {
        matchStage.chat = chatId;
      } else {
        // ЛИБО игнорировать
        // console.warn('Invalid chat ID:', chat);
        // ЛИБО вернуть 400 — так проще отлавливать ошибки клиента
        throw new BadRequestException('Invalid chat id');
      }
    }

    // Прочие фильтры
    Object.keys(rawQuery).forEach((key) => {
      if (['chat', 'limit', 'search'].includes(key)) return;
      const val = rawQuery[key];

      // Поля-идшники
      if (['sender', 'recipient', 'replyTo'].includes(key)) {
        const id = this.toObjectId(val);
        if (id) {
          matchStage[key] = id;
        } else if (val) {
          // либо игнор, либо 400 — выбери единую стратегию
          throw new BadRequestException(`Invalid ${key} id`);
        }
        return;
      }

      // Остальное — как есть
      if (val !== undefined) {
        matchStage[key] = val;
      }
    });

    return this.messageModel
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'recipient',
            foreignField: '_id',
            as: 'recipientData',
          },
        },
        {
          $unwind: {
            path: '$recipientData',
            preserveNullAndEmptyArrays: false,
          },
        },
        { $match: { 'recipientData.isFake': true } },
        { $sort: { createdAt: -1 } },
        { $limit: Number.isNaN(limitValue) ? 10 : limitValue },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'senderData',
          },
        },
        { $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'messages',
            localField: 'replyTo',
            foreignField: '_id',
            as: 'replyToData',
          },
        },
        { $unwind: { path: '$replyToData', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'replyToData.sender',
            foreignField: '_id',
            as: 'replyToSenderData',
          },
        },
        {
          $unwind: {
            path: '$replyToSenderData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            text: 1,
            createdAt: 1,
            fileUrl: 1,
            isReaded: 1,
            unreadBy: 1,
            chat: 1,
            sender: '$senderData',
            recipient: '$recipientData',
            replyTo: {
              $cond: {
                if: { $eq: ['$replyToData', null] },
                then: null,
                else: {
                  _id: '$replyToData._id',
                  text: '$replyToData.text',
                  createdAt: '$replyToData.createdAt',
                  sender: '$replyToSenderData',
                },
              },
            },
          },
        },
      ])
      .exec();
  }

  getFakeChats(rawQuery: Record<string, string>) {
    const { search, chat, limit } = rawQuery;

    const chatsLimit = Number.parseInt(limit ?? '', 10);
    const matchChat: Record<string, any> = {};

    // Фильтр по _id чата
    if (chat) {
      const chatId = this.toObjectId(chat);
      if (chatId) matchChat._id = chatId;
      else throw new BadRequestException('Invalid chat id');
    }

    // Опциональные фильтры по sender/recipient
    (['sender', 'recipient'] as const).forEach((key) => {
      const val = rawQuery[key];
      if (val === undefined) return;
      const id = this.toObjectId(val);
      if (id) matchChat[key] = id;
      else throw new BadRequestException(`Invalid ${key} id`);
    });

    const pipeline: any[] = [
      { $match: matchChat },

      // populate recipient
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipientData',
        },
      },
      {
        $unwind: { path: '$recipientData', preserveNullAndEmptyArrays: false },
      },

      // populate sender
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderData',
        },
      },
      { $unwind: { path: '$senderData', preserveNullAndEmptyArrays: false } },

      // Хватаем чаты, где один фейк, второй реал
      {
        $match: {
          $and: [
            {
              $or: [
                { 'recipientData.isFake': true },
                { 'senderData.isFake': true },
              ],
            },
            {
              $or: [
                { 'recipientData.isFake': false },
                { 'senderData.isFake': false },
              ],
            },
          ],
        },
      },

      // Вычисляем fakeUserId и realUserId
      {
        $addFields: {
          fakeUserId: {
            $cond: [
              { $eq: ['$recipientData.isFake', true] },
              '$recipient',
              '$sender',
            ],
          },
          realUserId: {
            $cond: [
              { $eq: ['$recipientData.isFake', true] },
              '$sender',
              '$recipient',
            ],
          },
        },
      },

      // Если есть search — чаты, где есть сообщения с маской
      ...(search
        ? [
            {
              $lookup: {
                from: 'messages',
                let: { chatId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$chat', '$$chatId'] },
                      text: { $regex: search, $options: 'i' },
                    },
                  },
                  { $limit: 1 },
                ],
                as: 'searchMessages',
              },
            },
            { $match: { 'searchMessages.0': { $exists: true } } },
          ]
        : []),

      // Последнее сообщение от реального
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id', realId: '$realUserId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chat', '$$chatId'] },
                    { $eq: ['$sender', '$$realId'] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            // populate sender
            {
              $lookup: {
                from: 'users',
                localField: 'sender',
                foreignField: '_id',
                as: 'senderData',
              },
            },
            {
              $unwind: {
                path: '$senderData',
                preserveNullAndEmptyArrays: true,
              },
            },
            // populate replyTo (+ его sender)
            {
              $lookup: {
                from: 'messages',
                localField: 'replyTo',
                foreignField: '_id',
                as: 'replyToData',
              },
            },
            {
              $unwind: {
                path: '$replyToData',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'replyToData.sender',
                foreignField: '_id',
                as: 'replyToSenderData',
              },
            },
            {
              $unwind: {
                path: '$replyToSenderData',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                text: 1,
                createdAt: 1,
                fileUrl: 1,
                isReaded: 1,
                unreadBy: 1,
                chat: 1,
                sender: '$senderData',
                replyTo: {
                  $cond: {
                    if: { $eq: ['$replyToData', null] },
                    then: null,
                    else: {
                      _id: '$replyToData._id',
                      text: '$replyToData.text',
                      createdAt: '$replyToData.createdAt',
                      sender: '$replyToSenderData',
                    },
                  },
                },
              },
            },
          ],
          as: 'lastRealMessageArr',
        },
      },
      {
        $addFields: {
          lastRealMessage: { $arrayElemAt: ['$lastRealMessageArr', 0] },
        },
      },

      // Обязательно должно быть хотя бы одно сообщение от реального
      { $match: { lastRealMessage: { $ne: null } } },

      // Последнее сообщение от фейка
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id', fakeId: '$fakeUserId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chat', '$$chatId'] },
                    { $eq: ['$sender', '$$fakeId'] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            // populate sender
            {
              $lookup: {
                from: 'users',
                localField: 'sender',
                foreignField: '_id',
                as: 'senderData',
              },
            },
            {
              $unwind: {
                path: '$senderData',
                preserveNullAndEmptyArrays: true,
              },
            },
            // populate replyTo (+ его sender)
            {
              $lookup: {
                from: 'messages',
                localField: 'replyTo',
                foreignField: '_id',
                as: 'replyToData',
              },
            },
            {
              $unwind: {
                path: '$replyToData',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'replyToData.sender',
                foreignField: '_id',
                as: 'replyToSenderData',
              },
            },
            {
              $unwind: {
                path: '$replyToSenderData',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                text: 1,
                createdAt: 1,
                fileUrl: 1,
                isReaded: 1,
                unreadBy: 1,
                chat: 1,
                sender: '$senderData',
                replyTo: {
                  $cond: {
                    if: { $eq: ['$replyToData', null] },
                    then: null,
                    else: {
                      _id: '$replyToData._id',
                      text: '$replyToData.text',
                      createdAt: '$replyToData.createdAt',
                      sender: '$replyToSenderData',
                    },
                  },
                },
              },
            },
          ],
          as: 'lastFakeMessageArr',
        },
      },
      {
        $addFields: {
          lastFakeMessage: { $arrayElemAt: ['$lastFakeMessageArr', 0] },
        },
      },

      // Собираем messages: всегда real + (fake, если свежее real)
      {
        $addFields: {
          messages: {
            $let: {
              vars: { real: '$lastRealMessage', fake: '$lastFakeMessage' },
              in: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$$fake', null] },
                      { $gt: ['$$fake.createdAt', '$$real.createdAt'] },
                    ],
                  },
                  ['$$real', '$$fake'],
                  ['$$real'],
                ],
              },
            },
          },
        },
      },

      // Последняя активность
      {
        $addFields: {
          lastActivityAt: {
            $max: [
              '$lastRealMessage.createdAt',
              { $ifNull: ['$lastFakeMessage.createdAt', new Date(0)] },
            ],
          },
        },
      },

      { $sort: { lastActivityAt: -1, _id: -1 } },
      { $limit: Number.isNaN(chatsLimit) ? 10 : chatsLimit },

      // Финальная форма
      {
        $project: {
          _id: 1,
          sender: '$senderData',
          recipient: '$recipientData',
          messages: 1,
          lastActivityAt: 1,
        },
      },
    ];

    return this.chatModel.aggregate(pipeline).exec();
  }
}
