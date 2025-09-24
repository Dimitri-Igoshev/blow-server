// sanitizeStrict.ts
export type ContactType = 'email' | 'phone' | 'telegram' | 'whatsapp' | 'generic-link';

export interface SanitizeOptions {
  maskChar?: string;         // символ маски, по умолчанию '█'
  minPhoneDigits?: number;   // минимум цифр для телефона, по умолчанию 10
}

export interface SanitizeReport {
  text: string;              // итоговый текст
  found: boolean;            // были ли найдены контакты
  types: ContactType[];      // какие типы встретились
}

/**
 * Жёсткая санация: выявляет и маскирует email/телеграм/телефоны/мессенджер-ссылки
 * с учётом обфускаций, гомоглифов и zero-width символов.
 */
export function sanitizeContactsStrict(input: string, opts: SanitizeOptions = {}): SanitizeReport {
  const maskChar = opts.maskChar ?? '█';
  const minPhoneDigits = opts.minPhoneDigits ?? 10;
  if (!input) return { text: input ?? '', found: false, types: [] };

  // --- 1) Нормализация + индексная карта ---
  const zeroWidth = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g; // ZWSP, RLM и пр.
  const homoglyphMap: Record<string, string> = {
    // fullwidth
    '＠': '@', '．': '.', '。': '.', '｡': '.', '･': '.', '•': '.', '∙': '.', '․': '.', '·': '.',
    '＋': '+',
    // Cyrillic lookalikes
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X',
  };

  const normalizeChar = (ch: string): string => {
    const nk = ch.normalize('NFKC');
    return homoglyphMap[nk] ?? nk;
  };

  // строим нормализованную строку + карту индексов (normIdx -> origIdx)
  const normChars: string[] = [];
  const normToOrig: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (zeroWidth.test(ch)) continue;
    const n = normalizeChar(ch);
    normChars.push(n);
    normToOrig.push(i);
  }
  const norm = normChars.join('').toLowerCase();

  // утилита сопоставления диапазона из norm к исходнику
  const mapSpanToOriginal = (start: number, end: number) => {
    if (start < 0 || end <= start) return { a: 0, b: 0 };
    const a = normToOrig[start];
    const b = normToOrig[end - 1] + 1;
    return { a, b };
  };

  // --- 2) Вспомогательные классы для «обфускаций» ---
  // Разделители между символами: пробелы/дефисы/скобки/точки/подчёрки/и т.п.
  const SEP = String.raw`[\s,;:|/\\\-_"'` + '()\\[\\]{}«»<>·∙•․·。｡\u00A0]' ;
  const SEPS = String.raw`(?:${SEP}*)`;
  const DOT_WORD = String.raw`(?:\.|dot|точка|\(dot\)|\[dot\])`;
  const AT_WORD  = String.raw`(?:@|at|собака|соб@ка|\(at\)|\[at\])`;
  const PLUS_WORD= String.raw`(?:\+|plus|плюс)`;

  // --- 3) Правила на нормализованной строке (со вставленными SEPS) ---
  // email: local (с допуском разделителей) AT (обфускация) domain(. sub)* 
  const EMAIL = new RegExp(
    String.raw`(?:[a-z0-9][a-z0-9._%+-]*${SEPS})${AT_WORD}${SEPS}` +
    String.raw`(?:[a-z0-9][a-z0-9-]*${SEPS}(?:${DOT_WORD}${SEPS}[a-z0-9][a-z0-9-]*){1,3})`,
    'gi'
  );

  // telegram: @handle с разделителями, или t.me/handle (в т.ч. t[.]me / telegram.me)
  const TG_HANDLE = new RegExp(
    String.raw`(?:^|${SEP})@${SEPS}[a-z0-9_]{3,32}(?=$|${SEP})`, 'gi'
  );
  const DOT = new RegExp(DOT_WORD, 'gi');
  const T_DOT_ME = new RegExp(
    String.raw`(?:https?${SEPS}:${SEPS}\/\/${SEPS})?t${SEPS}(?:\.|${DOT_WORD})${SEPS}me${SEPS}\/${SEPS}[a-z0-9_]{3,32}`,
    'gi'
  );
  const TELEGRAM_ME = new RegExp(
    String.raw`(?:https?${SEPS}:${SEPS}\/\/${SEPS})?telegram${SEPS}(?:\.|${DOT_WORD})${SEPS}me${SEPS}\/${SEPS}[a-z0-9_]{3,32}`,
    'gi'
  );
  const TG_RESOLVE = new RegExp(
    String.raw`tg${SEPS}:${SEPS}\/\/${SEPS}resolve${SEPS}\?${SEPS}domain=${SEPS}[a-z0-9_]{3,32}`,
    'gi'
  );

  // whatsapp/viber/vk/wa.me (и обфусцированные точки)
  const WA_ME = new RegExp(
    String.raw`(?:https?${SEPS}:${SEPS}\/\/${SEPS})?wa${SEPS}(?:\.|${DOT_WORD})${SEPS}me${SEPS}\/${SEPS}[a-z0-9]+`,
    'gi'
  );
  const WHATSAPP = new RegExp(
    String.raw`(?:https?${SEPS}:${SEPS}\/\/${SEPS})?(?:api${SEPS}(?:\.|${DOT_WORD})${SEPS})?whatsapp${SEPS}(?:\.|${DOT_WORD})${SEPS}com`,
    'gi'
  );
  const VIBER = new RegExp(
    String.raw`viber${SEPS}:${SEPS}\/\/`, 'gi'
  );
  const VK_ME = new RegExp(
    String.raw`(?:https?${SEPS}:${SEPS}\/\/${SEPS})?vk${SEPS}(?:\.|${DOT_WORD})${SEPS}me${SEPS}\/${SEPS}[a-z0-9_.]+`,
    'gi'
  );

  // phone: допустим обфусцированный номер с разделителями и словами "plus/плюс"
  const PHONE_CORE = new RegExp(
    String.raw`(?:${PLUS_WORD}${SEPS})?(?:\d${SEPS}){${minPhoneDigits},20}`,
    'gi'
  );
  // ключевые слова рядом
  const PHONE_KEYWORD_WINDOW = 30; // символов в обе стороны
  const PHONE_KEYWORDS = /(тел|телефон|phone|whats?app|viber|call|звон|вайбер)/i;

  type Hit = { s: number; e: number; t: ContactType };

  const hits: Hit[] = [];

  const collect = (re: RegExp, t: ContactType) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm)) !== null) {
      hits.push({ s: m.index, e: m.index + m[0].length, t });
    }
  };

  // email
  collect(EMAIL, 'email');

  // telegram
  collect(TG_HANDLE, 'telegram');
  collect(T_DOT_ME, 'telegram');
  collect(TELEGRAM_ME, 'telegram');
  collect(TG_RESOLVE, 'telegram');

  // wa/whatsapp/viber/vk
  collect(WA_ME, 'whatsapp');
  collect(WHATSAPP, 'whatsapp');
  collect(VIBER, 'generic-link');
  collect(VK_ME, 'generic-link');

  // phones по ядру + эвристика по ключевым словам поблизости
  {
    PHONE_CORE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PHONE_CORE.exec(norm)) !== null) {
      const s = m.index, e = s + m[0].length;
      // Проверяем, что в диапазоне реально >= minPhoneDigits цифр
      const digits = m[0].replace(/\D+/g, '');
      if (digits.length >= minPhoneDigits) {
        // усиливаем: если рядом есть ключевые слова — точно телефон
        const wS = Math.max(0, s - PHONE_KEYWORD_WINDOW);
        const wE = Math.min(norm.length, e + PHONE_KEYWORD_WINDOW);
        const near = norm.slice(wS, wE);
        const type: ContactType = PHONE_KEYWORDS.test(near) ? 'phone' : 'phone';
        hits.push({ s, e, t: type });
      }
    }
  }

  if (hits.length === 0) {
    return { text: input, found: false, types: [] };
  }

  // --- 4) Слияние пересечений и маппинг в исходные индексы ---
  hits.sort((a, b) => a.s - b.s || a.e - b.e);
  const merged: { s: number; e: number; ts: Set<ContactType> }[] = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (!last || h.s > last.e) merged.push({ s: h.s, e: h.e, ts: new Set([h.t]) });
    else {
      last.e = Math.max(last.e, h.e);
      last.ts.add(h.t);
    }
  }

  // --- 5) Маскирование на исходной строке, не трогая пробелы ---
  const maskSlice = (s: string) => s.replace(/[^\s]/g, maskChar);
  let out = '';
  let cur = 0;
  const types = new Set<ContactType>();

  for (const seg of merged) {
    const { a, b } = mapSpanToOriginal(seg.s, seg.e);
    out += input.slice(cur, a);
    out += maskSlice(input.slice(a, b));
    cur = b;
    seg.ts.forEach((t) => types.add(t));
  }
  out += input.slice(cur);

  return { text: out, found: true, types: Array.from(types) };
}
