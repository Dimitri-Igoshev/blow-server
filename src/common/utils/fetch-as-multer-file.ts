import axios from 'axios';
import * as path from 'node:path';
import type { Express } from 'express';

type MulterLikeFile = Express.Multer.File;

const EXT_BY_CT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function guessExtFromContentType(ct?: string) {
  if (!ct) return undefined;
  const key = ct.toLowerCase().split(';')[0].trim();
  return EXT_BY_CT[key];
}

function guessNameAndExtFromUrl(url: string) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    // срежем query суффиксы вроде ?x=y
    const clean = base.split('?')[0];
    const ext = path.extname(clean).replace('.', '').toLowerCase() || undefined;
    const name = ext ? clean : (clean || 'file');
    return { name, ext };
  } catch {
    return { name: 'file', ext: undefined };
  }
}

export async function fetchAsMulterFile(url: string, fieldname = 'file'): Promise<MulterLikeFile> {
  const resp = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    // На некоторых CDN без UA режут
    headers: { 'User-Agent': 'NestDownloader/1.0' },
    maxContentLength: 20 * 1024 * 1024, // 20MB safety
    validateStatus: (s) => s >= 200 && s < 400,
  });

  const contentType = String(resp?.headers['content-type'] || 'application/octet-stream');
  const { name: urlName, ext: urlExt } = guessNameAndExtFromUrl(url);
  const ext = urlExt || guessExtFromContentType(contentType) || 'jpg';
  const originalname = urlName.endsWith(`.${ext}`) ? urlName : `${urlName}.${ext}`;

  const buffer = Buffer.from(resp.data);
  const size = buffer.length;

  // Соберём "псевдо-файл", как если бы он пришёл через memoryStorage
  const file: MulterLikeFile = {
    fieldname,
    originalname,
    encoding: '7bit',
    mimetype: contentType,
    size,
    buffer,
    // Ниже поля присутствуют в типе, но при memoryStorage могут быть пустыми
    destination: '',
    filename: originalname,
    path: '',
    stream: undefined as any, // не обязателен для memoryStorage
  };

  return file;
}
