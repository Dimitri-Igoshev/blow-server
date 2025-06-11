import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import type { EditMessageDto } from './dto/update-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() data: CreateMessageDto) {
    return this.chatService.createMessage(data);
  }

  @Post('chat')
  createChat(@Body() data: any) {
    return this.chatService.findOrCreateChat(data);
  }

  @Get(':id/messages')
  findByChatId(@Param('id') id: string) {
    return this.chatService.getMessagesByChatId(id);
  }

  @Get(':id')
  findByUserId(@Param('id') id: string) {
    return this.chatService.getChats(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: EditMessageDto) {
    return this.chatService.updateMessage(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatService.deleteMessage(id);
  }

  @Delete('chat/:id')
  removeChat(@Param('id') id: string) {
    return this.chatService.deleteChat(id);
  }
}
