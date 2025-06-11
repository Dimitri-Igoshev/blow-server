import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './entities/message.entity';
import { Chat, ChatSchema } from './entities/chat.entity';
import { Gateway } from 'src/gateway/gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, Gateway],
})
export class ChatModule {}
