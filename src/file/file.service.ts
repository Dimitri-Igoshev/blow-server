import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FileResponseEl } from './dto/file-response-el';
import { format } from 'date-fns';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';
import * as sharp from 'sharp';
import { MFile } from './mfile.class';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegPath from 'ffmpeg-static';
import * as stream from 'stream';
import * as convert from 'heic-convert';
import { promises as fs } from 'node:fs';
import * as path2 from 'node:path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileService {
  constructor() {
    ffmpeg.setFfmpegPath(ffmpegPath); // Устанавливаем путь к ffmpeg
  }

  async fromUrl(file: Express.Multer.File) {
    if (!file || !file.buffer || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Expected image file buffer');
    }

    const ext =
      path2.extname(file.originalname) ||
      this.extFromMime(file.mimetype) ||
      '.jpg';
    const baseDir = path2.resolve(process.cwd(), 'uploads', 'images');
    await fs.mkdir(baseDir, { recursive: true });

    const key = `${uuid()}${ext}`;
    const fullPath = path2.join(baseDir, key);
    await fs.writeFile(fullPath, file.buffer);

    const publicPrefix = process.env.STATIC_PREFIX ?? '/static/images';
    return {
      key,
      url: `${publicPrefix}/${key}`,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname,
    };
  }

  private extFromMime(ct: string) {
    if (ct.includes('jpeg')) return '.jpg';
    if (ct.includes('png')) return '.png';
    if (ct.includes('webp')) return '.webp';
    if (ct.includes('gif')) return '.gif';
    if (ct.includes('svg')) return '.svg';
    return '';
  }

  // Метод для конвертации буфера в MP3
  async convertBufferToMp3(inputBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Для того чтобы TS не ругался, указываем тип потока явно
      const outputBuffer: Buffer[] = []; // Массив для накопления данных
      const passthroughStream = new stream.PassThrough(); // PassThrough stream

      // Создаем поток для входящего буфера
      const inputStream = new stream.PassThrough();
      inputStream.end(inputBuffer); // Загоняем буфер в поток

      // Используем ffmpeg для конвертации
      ffmpeg(inputStream)
        .audioCodec('libmp3lame') // Кодек для MP3
        .toFormat('mp3') // Формат MP3
        .on('end', () => {
          resolve(Buffer.concat(outputBuffer)); // Объединяем буферы в один
        })
        .on('error', (err: Error) => {
          reject(err); // Обработка ошибок
        })
        .pipe(passthroughStream); // Прокачиваем поток через PassThrough

      // Собираем данные в буфер
      passthroughStream.on('data', (chunk: Buffer) => {
        outputBuffer.push(chunk); // Добавляем чанки в итоговый буфер
      });
    });
  }

  getFileName(file: MFile): string {
    if (!file?.originalname) return '';

    const fileStrArr = file.originalname.split('.');
    const fileType = fileStrArr[fileStrArr.length - 1];
    return `${Date.now()}-${Math.floor(Math.random() * 100)}.${fileType}`;
  }

  convertToWebP(file: Buffer): Promise<Buffer> {
    return sharp(file).webp().toBuffer();
  }

  async convertHeicToJpeg(file: Buffer): Promise<Buffer> {
    const outputBuffer = await convert({
      buffer: file, // the HEIC file buffer
      format: 'JPEG', // output format
      quality: 0.7,
    });

    if (!outputBuffer)
      throw new HttpException(
        'Ошибка конвертации файла',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const resizedBuffer = await sharp(outputBuffer)
      .resize({ width: 2160 }) // автоматически подстроит высоту
      .rotate()
      .withMetadata() // сохраняем EXIF (например, ориентацию)
      .toBuffer();

    if (!resizedBuffer)
      throw new HttpException(
        'Ошибка изменения размера файла',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return resizedBuffer;
  }

  async forcePortraitImage(inputBuffer: Buffer): Promise<Buffer> {
    // Загружаем изображение и применяем rotate (на всякий случай)
    const image = sharp(inputBuffer).rotate();

    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Если лежит — поворачиваем вручную
    const needsRotation = width > height;

    const processed = image
      .rotate(needsRotation ? 90 : 0) // если альбомное — поворачиваем
      .resize({ width: 1080, fit: 'inside' }) // можно изменить размер
      .withMetadata({ orientation: undefined }) // удалить EXIF
      .jpeg({ quality: 80 });

    return await processed.toBuffer();
  }
  async saveFile(files: MFile[]): Promise<FileResponseEl[]> {
    const dateFolder = format(new Date(), 'yyyy-MM-dd');
    const uploadFolder = `${path}/uploads/${dateFolder}`;
    await ensureDir(uploadFolder);

    const res: FileResponseEl[] = [];

    for (const file of files) {
      file.originalname = this.getFileName(file);

      let convertedFiles = [];

      // if (file?.buffer && file?.mimetype?.includes('heic')) {
      //         const jpegBuffer = await convert({
      //           buffer: file.buffer, // the HEIC file buffer
      //           format: 'JPEG', // output format
      //           quality: 1,
      //         });

      //         const jpegImage = sharp(jpegBuffer);

      // const meta = await jpegImage.metadata();

      // const isLandscape = meta.width && meta.height && meta.width > meta.height;

      // const Rotatebuffer = await jpegImage
      //   .rotate(0) // безопасный noop
      //   .resize({ width: 1080, fit: 'inside' })
      //   .rotate(isLandscape ? 90 : 0) // поворачиваем если альбомная
      //   .jpeg({ quality: 80 })
      //   .withMetadata({ orientation: undefined }) // удалим остаточный EXIF
      //   .toBuffer();

      // const buffer = await this.forcePortraitImage(file.buffer);
      // // @ts-ignore
      // convertedFiles = [{ originalname: `${file.originalname.split('.')[0]}.webp`, buffer }];
      if (
        file?.buffer &&
        (file?.mimetype?.includes('image') || file?.mimetype?.includes('heic'))
      ) {
        const buffer = await sharp(file.buffer).rotate().webp().toBuffer();

        // @ts-ignore
        convertedFiles = [{ originalname: `${file.originalname.split('.')[0]}.webp`, buffer }];
      }

      if (file?.buffer && file?.mimetype?.includes('audio')) {
        const buffer = await this.convertBufferToMp3(file.buffer);

        // @ts-ignore
        convertedFiles = [{ originalname: `${file.originalname.split('.')[0]}.mp3`, buffer }];
      }

      // let resizedFiles = [];

      //   const buffer = await this.convertToWebP(file.buffer);
      //   resizedFiles = [
      //     {
      //       originalname: `${file.originalname.split('.')[0]}-xl.webp`,
      //       buffer: await sharp(buffer).resize(1000, 1000).toBuffer(),
      //     },
      //     {
      //       originalname: `${file.originalname.split('.')[0]}-l.webp`,
      //       buffer: await sharp(buffer).resize(600, 600).toBuffer(),
      //     },
      //     {
      //       originalname: `${file.originalname.split('.')[0]}-m.webp`,
      //       buffer: await sharp(buffer).resize(400, 400).toBuffer(),
      //     },
      //     {
      //       originalname: `${file.originalname.split('.')[0]}-s.webp`,
      //       buffer: await sharp(buffer).resize(200, 200).toBuffer(),
      //     },
      //     {
      //       originalname: `${file.originalname.split('.')[0]}-xs.webp`,
      //       buffer: await sharp(buffer).resize(50, 50).toBuffer(),
      //     },
      //   ];

      // file.originalname = `${file.originalname.split('.')[0]}.webp`;
      // file.buffer = buffer;
      // }

      // if (file.mimetype.includes('video')) {
      //   resizedFiles.push({
      //     originalname: `${file.originalname.split('.')[0]}-video.${
      //       file.originalname.split('.')[1]
      //     }`,
      //     buffer: file.buffer,
      //   });
      // }

      // if (
      //   !file.mimetype.includes('video') &&
      //   !file.mimetype.includes('image')
      // ) {
      //   resizedFiles.push({
      //     originalname: `${file.originalname.split('.')[0]}-video.${
      //       file.originalname.split('.')[1]
      //     }`,
      //     buffer: file.buffer,
      //   });
      // }

      convertedFiles.forEach((el: MFile) => {
        writeFile(`${uploadFolder}/${el.originalname}`, el.buffer);
        res.push({
          url: `${dateFolder}/${el.originalname}`,
          name: el.originalname || '',
        });
      });

      // await writeFile(`${uploadFolder}/${file.originalname}`, file.buffer);
      // res.push({
      //   url: `${dateFolder}/${file.originalname}`,
      //   name: file.originalname,
      // });
    }

    return res;
  }

  // async saveBannerFile(files: MFile[]): Promise<FileResponseEl[]> {
  //   const dateFolder = format(new Date(), 'yyyy-MM-dd');
  //   const uploadFolder = `${path}/uploads/${dateFolder}`;
  //   await ensureDir(uploadFolder);

  //   const res: FileResponseEl[] = [];

  //   for (const file of files) {
  //     file.originalname = this.getFileName(file);

  //     let resizedFiles = [];

  //     if (file.mimetype.includes('image')) {
  //       const buffer = await this.convertToWebP(file.buffer);
  //       resizedFiles = [
  //         {
  //           originalname: `${file.originalname.split('.')[0]}-banner.webp`,
  //           buffer: await sharp(buffer).resize(2400, 800).toBuffer(),
  //         },
  //         {
  //           originalname: `${file.originalname.split('.')[0]}-banner-sm.webp`,
  //           buffer: await sharp(buffer).resize(600, 400).toBuffer(),
  //         },
  //       ];
  //     }

  //     resizedFiles.forEach((el: MFile) => {
  //       writeFile(`${uploadFolder}/${el.originalname}`, el.buffer);
  //       res.push({
  //         url: `${dateFolder}/${el.originalname}`,
  //         name: el.originalname,
  //       });
  //     });
  //   }

  //   return res;
  // }
}

// await this.resizeFile(buffer);
