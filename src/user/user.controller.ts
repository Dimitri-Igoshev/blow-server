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
    @Query('sex') sex: string,
    @Query('city') city: string,
    @Query('minage') minage: string,
    @Query('maxage') maxage: string,
    @Query('limit') limit: number,
  ) {
    return this.userService.findAll({ sex, city, minage, maxage, limit });
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

  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
