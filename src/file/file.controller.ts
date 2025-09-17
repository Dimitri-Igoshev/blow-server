import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  Body,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileResponseEl } from './dto/file-response-el';
import { Response } from 'express';
import { fetchAsMulterFile } from 'src/common/utils/fetch-as-multer-file'

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('files'))
  async uploadFile(
    @UploadedFile() files: Express.Multer.File,
  ): Promise<FileResponseEl[]> {
    return this.fileService.saveFile([files]);
  }

  @Post('heic-to-jpeg')
  @UseInterceptors(FileInterceptor('file'))
  async heicToJpeg(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.fileService.convertHeicToJpeg(file.buffer);
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename=${file.originalname?.split('.')[0] || 'image'}.jpg`,
    });
    res.send(buffer);
  }

  @Post('from-url')
  async uploadFromUrl(@Body() url: string) {
    const file = await fetchAsMulterFile(url, 'file');
    // Используем тот же путь, что и при обычной загрузке @UploadedFile()
    const stored = await this.fileService.fromUrl(file);
    return stored; // верните URL/ключ/метаданные
  }
}
