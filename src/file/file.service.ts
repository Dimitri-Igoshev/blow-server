import { Injectable } from '@nestjs/common';
import { FileResponseEl } from './dto/file-response-el';
import { format } from 'date-fns';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';
import * as sharp from 'sharp';
import { MFile } from './mfile.class';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegPath from 'ffmpeg-static';
import * as stream from 'stream';

@Injectable()
export class FileService {
  constructor() {
    ffmpeg.setFfmpegPath(ffmpegPath); // Устанавливаем путь к ffmpeg
  }

  // Метод для конвертации буфера в MP3
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

  async saveFile(files: MFile[]): Promise<FileResponseEl[]> {
    const dateFolder = format(new Date(), 'yyyy-MM-dd');
    const uploadFolder = `${path}/uploads/${dateFolder}`;
    await ensureDir(uploadFolder);

    const res: FileResponseEl[] = [];

    for (const file of files) {
      file.originalname = this.getFileName(file);

      let convertedFiles = [];

      if (file?.buffer && file?.mimetype?.includes('image')) {
        const buffer = await this.convertToWebP(file.buffer);

        // @ts-ignore
        convertedFiles = [{ originalname: `${file.originalname.split('.')[0]}.webp`, buffer }];
      }

      if (file?.buffer && file?.mimetype?.includes('audio')) {
        const buffer = await this.convertBufferToMp3(file.buffer);

        // @ts-ignore
        convertedFiles = [{originalname: `${file.originalname.split('.')[0]}.mp3`, buffer}];
      }

      // let resizedFiles = [];

      //
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
