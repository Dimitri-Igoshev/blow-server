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
  Ip,
  Headers,
  Req,
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

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.userService.findBySlug(slug);
  }

  // ПЕРЕД @Get(':id')
  @Get('public/count')
  publicCount() {
    return this.userService.publicCount();
  }

  // ПЕРЕД @Get(':id')
  @Get('public')
  publicList(@Query('skip') skip?: string, @Query('limit') limit?: string) {
    const s = Number.parseInt(skip ?? '0', 10);
    const l = Number.parseInt(limit ?? '45000', 10);
    return this.userService.listPublicForSitemap(s, l);
  }

  // для middleware редиректа
  @Get('slug-by-id/:id')
  slugById(@Param('id') id: string) {
    return this.userService.slugById(id);
  }

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
  findAll(@Query() query: Record<string, string>) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // @UseGuards(JwtGuard)
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
  activity(
    @Param('id') id: string,
    @Body() data: { timestamp: any },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
  ) {
    return this.userService.activity(id, data?.timestamp, req, ip, userAgent);
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
  addBalance(@Body() data: { id: string; sum: number }) {
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

  @Get('visits/to/gasts')
  getVisitsToGasts() {
    return this.userService.visitsToGasts();
  }
}
