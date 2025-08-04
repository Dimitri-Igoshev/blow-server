import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Request } from 'express';
// import { CreateSessionDto } from './dto/create-session.dto';
// import { UpdateSessionDto } from './dto/update-session.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async createSession(@Req() req: Request, @Body() body: { userId: string }) {
    const ip = req.ip || ''; // уже будет нормальный IP
    const userAgent = req.headers['user-agent'] || '';
    return this.sessionService.create(body.userId, ip, userAgent);
  }

  @Patch(':id/activity')
  async updateActivity(
    @Req() req: Request,
    @Body() body: { sessionId: string },
  ) {
    return this.sessionService.updateActivity(body.sessionId);
  }

  @Get(':id')
  async getSession(@Body() body: { sessionId: string }) {
    return this.sessionService.get(body.sessionId);
  }

  @Get()
  async getSessions(@Query() query: Record<string, string>) {
    return this.sessionService.getAll(query);
  }

  // @Post()
  // create(@Body() data: any) {
  //   return this.sessionService.create(data);
  // }

  // @Get()
  // findAll(@Query() query: Record<string, string>) {
  //   return this.sessionService.findAll(query);
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.sessionService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
  //   return this.sessionService.update(+id, updateSessionDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionService.remove(id);
  }
}
