// lib/sanitizeClient.ts
export type ContactType = 'email' | 'phone' | 'telegram' | 'whatsapp' | 'generic-link';

export interface SanitizeOptions {
  maskChar?: string;       // символ маски (по умолчанию '•' — комфортно в dark)
  minPhoneDigits?: number; // минимум цифр в телефоне (по умолчанию 10)
}

export interface ContactMatch {
  type: ContactType;
  start: number; // индекс в исходной строке (включительно)
  end: number;   // индекс в исходной строке (исключая end)
  value: string; // исходный фрагмент
}

export interface SanitizeReport {
  text: string;           // маскированный текст
  found: boolean;         // нашли ли контакты
  types: ContactType[];   // уникальные типы
  count: number;          // сколько участков замаскировано
  matches: ContactMatch[];// матч-лист в координатах исходной строки
}

export function sanitizeContactsClient(input: string, opts: SanitizeOptions = {}): SanitizeReport {
  const maskChar = opts.maskChar ?? '•';
  const minPhoneDigits = Math.max(6, opts.minPhoneDigits ?? 10);

  if (typeof input !== 'string' || input.length === 0) {
    return { text: input ?? '', found: false, types: [], count: 0, matches: [] };
  }

  // ---------- 1) Нормализация + карта индексов ----------
  // вместо RegExp.test используем «набор символов», чтобы не было сюрпризов с lastIndex
  const ZERO_WIDTH_SET = new Set([
    '\u200B','\u200C','\u200D','\u200E','\u200F',
    '\u202A','\u202B','\u202C','\u202D','\u202E',
    '\u2060','\uFEFF'
  ]);
  const homoglyph: Record<string, string> = {
    '＠':'@','．':'.','。':'.','＋':'+',
    'а':'a','е':'e','о':'o','р':'p','с':'c','у':'y','х':'x',
    'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','Х':'X',
  };

  const normChars: string[] = [];
  const normToOrig: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let ch = input[i];
    if (ZERO_WIDTH_SET.has(ch)) continue; // выкидываем невидимые
    ch = ch.normalize('NFKC');
    normChars.push(homoglyph[ch] ?? ch);
    normToOrig.push(i);
  }
  const norm = normChars.join('').toLowerCase();

  const toOrigSpan = (s: number, e: number) => {
    if (normToOrig.length === 0) return { a: 0, b: 0 };
    const sCl = Math.max(0, Math.min(s, normToOrig.length - 1));
    const eCl = Math.max(0, Math.min(e - 1, normToOrig.length - 1));
    const a = normToOrig[sCl];
    const b = (normToOrig[eCl] ?? a) + 1;
    return { a, b };
  };

  // ---------- 2) Шаблоны ----------
  const SEP_SMALL = String.raw`[ \t\-\(\)_]{0,2}`;
  const DOT_WORD  = String.raw`(?:\.|dot|точка|\(dot\)|\[dot\])`;
  const AT_WORD   = String.raw`(?:@|at|собака|\(at\)|\[at\])`;
  const LABEL     = String.raw`[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?`;

  // e-mail
  const EMAIL = new RegExp(
    String.raw`[a-z0-9][a-z0-9._%+-]*${SEP_SMALL}${AT_WORD}${SEP_SMALL}${LABEL}(?:${SEP_SMALL}${DOT_WORD}${SEP_SMALL}${LABEL}){1,3}`,
    'gi'
  );

  // telegram
  const TG_AT_SIMPLE = /@([a-z0-9_]{3,32})/gi;
  const SEP_TINY = String.raw`[ \t._\-\u00A0\u2010-\u2015\u2212]?`;
  const TG_AT_OBF = new RegExp(String.raw`@(?:${SEP_TINY}[a-z0-9_]){3,32}`, 'gi');
  const T_DOT_ME    = new RegExp(String.raw`(?:https?:\/\/)?t(?:\.|${DOT_WORD})me\/[a-z0-9_]{3,32}`, 'gi');
  const TELEGRAM_ME = new RegExp(String.raw`(?:https?:\/\/)?telegram(?:\.|${DOT_WORD})me\/[a-z0-9_]{3,32}`, 'gi');
  const TG_RESOLVE  = new RegExp(String.raw`tg:\/\/resolve\?domain=[a-z0-9_]{3,32}`, 'gi');

  // whatsapp/viber/vk
  const WA_ME    = new RegExp(String.raw`(?:https?:\/\/)?wa(?:\.|${DOT_WORD})me\/[a-z0-9]+`, 'gi');
  const WHATSAPP = new RegExp(String.raw`(?:https?:\/\/)?(?:api(?:\.|${DOT_WORD}))?whatsapp(?:\.|${DOT_WORD})com`, 'gi');
  const VIBER    = /viber:\/\/?/gi;
  const VK_ME    = new RegExp(String.raw`(?:https?:\/\/)?vk(?:\.|${DOT_WORD})me\/[a-z0-9_.]+`, 'gi');

  // телефоны: с разделителями/Юникод-дефисами/NBSP + «сплошные цифры»
  const PHONE_SEP = String.raw`[ \t().\-\u00A0\u2010-\u2015\u2212]?`;
  const PHONE_CORE = new RegExp(String.raw`(?:\+?\d${PHONE_SEP}){${minPhoneDigits},20}`, 'gi');
  const PHONE_PLAIN = new RegExp(String.raw`\d{${minPhoneDigits},20}`, 'g'); // без lookbehind

  type Hit = { s: number; e: number; t: ContactType };
  const hits: Hit[] = [];

  const collect = (re: RegExp, t: ContactType) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm)) !== null) {
      hits.push({ s: m.index, e: m.index + m[0].length, t });
    }
  };

  // e-mail
  collect(EMAIL, 'email');

  // telegram
  collect(TG_AT_SIMPLE, 'telegram');
  collect(TG_AT_OBF,    'telegram');
  collect(T_DOT_ME,     'telegram');
  collect(TELEGRAM_ME,  'telegram');
  collect(TG_RESOLVE,   'telegram');

  // whatsapp/viber/vk
  collect(WA_ME,    'whatsapp');
  collect(WHATSAPP, 'whatsapp');
  collect(VIBER,    'generic-link');
  collect(VK_ME,    'generic-link');

  // phone (1) с разделителями/плюсом
  {
    PHONE_CORE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PHONE_CORE.exec(norm)) !== null) {
      const digits = (m[0].match(/\d/g) ?? []).length;
      if (digits >= minPhoneDigits) {
        hits.push({ s: m.index, e: m.index + m[0].length, t: 'phone' });
      }
    }
  }
  // phone (2) «сплошные цифры» с ручной проверкой границ (чтобы не трогать части карт/индексов)
  {
    PHONE_PLAIN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PHONE_PLAIN.exec(norm)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      const prev = s > 0 ? norm[s - 1] : '';
      const next = e < norm.length ? norm[e] : '';
      const prevIsDigit = /\d/.test(prev);
      const nextIsDigit = /\d/.test(next);
      if (!prevIsDigit && !nextIsDigit) {
        hits.push({ s, e, t: 'phone' });
      }
    }
  }

  if (hits.length === 0) {
    return { text: input, found: false, types: [], count: 0, matches: [] };
  }

  // ---------- 3) Слияние пересечений ----------
  hits.sort((a, b) => a.s - b.s || a.e - b.e);
  const merged: { s: number; e: number; ts: Set<ContactType> }[] = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (!last || h.s > last.e) merged.push({ s: h.s, e: h.e, ts: new Set([h.t]) });
    else { last.e = Math.max(last.e, h.e); last.ts.add(h.t); }
  }

  // ---------- 4) Маскируем только «не-пробелы» ----------
  const maskSlice = (s: string) => s.replace(/[^\s]/g, maskChar);

  let out = '';
  let cur = 0;
  const types = new Set<ContactType>();
  const matches: ContactMatch[] = [];

  for (const seg of merged) {
    const { a, b } = toOrigSpan(seg.s, seg.e);
    if (b <= a) continue;
    out += input.slice(cur, a);

    const firstType = (seg.ts.values().next().value as ContactType) ?? 'generic-link';
    matches.push({ type: firstType, start: a, end: b, value: input.slice(a, b) });

    out += maskSlice(input.slice(a, b));
    cur = b;
    seg.ts.forEach(t => types.add(t));
  }
  out += input.slice(cur);

  return { text: out, found: true, types: Array.from(types), count: merged.length, matches };
}
