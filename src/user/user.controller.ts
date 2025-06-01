import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserId } from 'src/decorators/user-id.decorator';
import { JwtGuard } from 'src/auth/jwt.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { BuyServiceDto } from 'src/services/dto/buy-service.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@UserId() id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() data: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.create(data, file);
  }

  @Get()
  findAll(
    @Query('online') online: string,
    @Query('sex') sex: string,
    @Query('city') city: string,
    @Query('minage') minage: string,
    @Query('maxage') maxage: string,
    @Query('limit') limit: number,
  ) {
    return this.userService.findAll({
      online,
      sex,
      city,
      minage,
      maxage,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.userService.update(id, data, files);
  }

  // @UseGuards(JwtGuard)
  @Patch(':id/activity')
  activity(@Param('id') id: string, @Body() data: { timestamp: any }) {
    return this.userService.activity(id, data?.timestamp);
  }

  @Patch(':id/visit')
  visit(
    @Param('id') id: string,
    @Body() data: { timestamp: any; guest: string },
  ) {
    return this.userService.visit(id, data);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/note')
  createNote(
    @Param('id') id: string,
    @Body() data: { text: string; userId: string },
  ) {
    return this.userService.createNote(id, data);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/note-update')
  updateNote(
    @Param('id') id: string,
    @Body() data: { text: string; userId: string },
  ) {
    return this.userService.updateNote(id, data);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/note-delete')
  deleteNote(@Param('id') id: string, @Body() data: { userId: string }) {
    return this.userService.deleteNote(id, data.userId);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(JwtGuard)
  @Post('test/add-balance')
  addBalance(@Body() data: { id: string, sum: number }) {
    return this.userService.addBalance(data);
  }

  @UseGuards(JwtGuard)
  @Post('buy/service')
  buyService(@Body() data: BuyServiceDto) {
    return this.userService.buyService(data);
  }

  @UseGuards(JwtGuard)
  @Post('buy/services-kit')
  buyServicesKit(@Body() data: BuyServiceDto) {
    return this.userService.buyServicesKit(data);
  }

  @UseGuards(JwtGuard)
  @Patch('use/raise-profile')
  useRaiseProfile(@Body() data: { id: string }) {
    return this.userService.useRaiseProfile(data.id);
  }
}
