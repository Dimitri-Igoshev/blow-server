import { Types } from 'mongoose';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function base62FromObjectId(id: string): string {
  const buf = Types.ObjectId.createFromHexString(id).id; // Buffer(12)
  let num = 0n;
  for (const b of buf) num = (num << 8n) + BigInt(b);
  if (num === 0n) return '0';
  let out = '';
  while (num > 0n) {
    const rem = Number(num % 62n);
    out = BASE62[rem] + out;
    num = num / 62n;
  }
  return out.slice(0, 8); // укоротим, достаточно 6-10 символов
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // диакритика
    .replace(/[^a-z0-9]+/g, '-') // всё в тире
    .replace(/^-+|-+$/g, '') // края
    .replace(/-{2,}/g, '-'); // двойные тире
}

export function buildBaseSlug(
  firstName?: string,
  age?: number,
  city?: string,
): string {
  const parts = [firstName ?? '', age ? String(age) : '', city ?? '']
    .map((x) => slugify(x))
    .filter(Boolean);
  return slugify(parts.join('-'));
}
