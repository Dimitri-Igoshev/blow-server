import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
// import { CreateMessageDto } from './dto/create-message.dto';
import type { EditMessageDto } from './dto/update-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() data: any) {
    return this.chatService.createMessage(data);
  }

  @Post('system')
  createSystemMessage(@Body() data: any) {
    return this.chatService.createSystemMessage(data);
  }

  @Post('chat')
  createChat(@Body() data: any) {
    return this.chatService.findOrCreateChat(data);
  }

  @Get(':id/messages')
  findByChatId(@Param('id') id: string) {
    return this.chatService.getMessagesByChatId(id);
  }

  @Get('get/all-messages')
  getAllMessages(@Query() query: Record<string, string>) {
    return this.chatService.getAllMessages(query);
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

  @Delete('chat/:id/full/:userId')
  removeChatWithMessages(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.deleteChatWithMessages(id, userId);
  }

  @Delete('user/:id')
  removeUserChats(@Param('id') id: string) {
    return this.chatService.deleteUserChats(id);
  }

  // Fake endpoints
  @Get('fake/all-messages')
  getFakeMessages(@Query() query: Record<string, string>) {
    return this.chatService.getFakeMessages(query);
  }

  @Get('fake/chats')
  getFakeChats(@Query() query: Record<string, string>) {
    return this.chatService.getFakeChats(query);
  }
}
