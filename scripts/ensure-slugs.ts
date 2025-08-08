/* eslint-disable no-console */
import mongoose, { Types } from 'mongoose';
// ⚠️ Путь проверь: из /scripts к файлу сущности
import { UserSchema } from '../src/user/entities/user.entity';

// Флаги управления
const REBUILD_AUTO_SLUGS = process.env.REBUILD_AUTO_SLUGS === '1'; // пересчитывать только авто-слаги
const DRY_RUN = process.env.DRY_RUN === '1'; // сухой прогон — без записи

// --- helpers ---
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function base62FromObjectId(id: string): string {
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
  return out.slice(0, 8);
}

// Простейшая транслитерация RU → EN (ГОСТ-подобно, без внешних зависимостей)
const RU_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  // заглавные
  А: 'a',
  Б: 'b',
  В: 'v',
  Г: 'g',
  Д: 'd',
  Е: 'e',
  Ё: 'yo',
  Ж: 'zh',
  З: 'z',
  И: 'i',
  Й: 'y',
  К: 'k',
  Л: 'l',
  М: 'm',
  Н: 'n',
  О: 'o',
  П: 'p',
  Р: 'r',
  С: 's',
  Т: 't',
  У: 'u',
  Ф: 'f',
  Х: 'kh',
  Ц: 'ts',
  Ч: 'ch',
  Ш: 'sh',
  Щ: 'shch',
  Ъ: '',
  Ы: 'y',
  Ь: '',
  Э: 'e',
  Ю: 'yu',
  Я: 'ya',
};

function translitRuToEn(input: string): string {
  return (input || '')
    .split('')
    .map((ch) => RU_MAP[ch] ?? ch)
    .join('');
}

function slugify(input: string): string {
  // 1) транслит кириллицы
  const t = translitRuToEn(input || '');
  // 2) нормализация и чистка
  return t
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // удалить диакритику
    .replace(/[^a-z0-9]+/g, '-') // только латиница+цифры
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildBaseSlug(
  firstName?: string,
  age?: number,
  city?: string,
): string {
  const parts = [firstName ?? '', age ? String(age) : '', city ?? '']
    .map(slugify)
    .filter(Boolean);
  return slugify(parts.join('-')) || 'user';
}

// --- main ---
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);

  // ⬇️ РЕГИСТРИРУЕМ схему перед использованием
  const UserModel = mongoose.model('User', UserSchema);

  const cursor = UserModel.find(
    {},
    {
      slug: 1,
      slugStatus: 1,
      aliases: 1,
      shortId: 1,
      firstName: 1,
      age: 1,
      city: 1,
    },
  ).cursor();

  let processed = 0;
  let patched = 0;

  for await (const u of cursor as any) {
    processed++;
    const id = String(u._id);
    const patch: any = {};
    const setOnInsert: any = {};

    // 1) shortId — генерим только если нет (не трогаем существующий!)
    if (!u.shortId) {
      setOnInsert.shortId = base62FromObjectId(id);
    }

    // 2) slug
    const base = buildBaseSlug(u.firstName, u.age, u.city);

    if (!u.slug) {
      // нет slug — создаём
      let candidate = base || 'user';
      let n = 2;
      // избегаем коллизий
      // eslint-disable-next-line no-await-in-loop
      while (
        await UserModel.countDocuments({ slug: candidate, _id: { $ne: id } })
      ) {
        candidate = `${base}-${n++}`;
      }
      patch.slug = candidate;
      patch.slugStatus = 'auto';
    } else if (REBUILD_AUTO_SLUGS && u.slugStatus === 'auto') {
      // разрешён пересчёт только авто-слагов
      let candidate = base || 'user';
      if (candidate !== u.slug) {
        let n = 2;
        // eslint-disable-next-line no-await-in-loop
        while (
          await UserModel.countDocuments({ slug: candidate, _id: { $ne: id } })
        ) {
          candidate = `${base}-${n++}`;
        }
        const aliases = Array.isArray(u.aliases) ? u.aliases : [];
        if (!aliases.includes(u.slug)) aliases.push(u.slug);

        patch.slug = candidate;
        patch.slugStatus = 'auto';
        patch.aliases = aliases;
      }
    }

    if (Object.keys(patch).length || Object.keys(setOnInsert).length) {
      patched++;
      console.log(
        `→ ${id} ${u.slug || '(no slug)'} ->`,
        { setOnInsert, patch },
        DRY_RUN ? '[DRY_RUN]' : '',
      );
      if (!DRY_RUN) {
        // если есть только setOnInsert — используем $set, чтобы точно записать
        await UserModel.updateOne(
          { _id: id },
          {
            ...(Object.keys(patch).length ? { $set: patch } : {}),
            ...(Object.keys(setOnInsert).length
              ? { $setOnInsert: setOnInsert }
              : {}),
          },
        );
      }
    }

    if (processed % 1000 === 0) {
      console.log(`[progress] processed=${processed} patched=${patched}`);
    }
  }

  console.log(`Done. processed=${processed}, patched=${patched}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

// DRY_RUN=1

// REBUILD_AUTO_SLUGS=1 MONGODB_URI="mongodb://gen_user:%7C1q%3Aam%26%25T7JZiD@109.73.205.45:27017/blow?authSource=admin&directConnection=true" \
// npx ts-node ./scripts/ensure-slugs.ts
