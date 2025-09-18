/**
 * Возраст (полных лет) по дате рождения.
 * Принимает ms-таймстамп, sec-таймстамп, ISO-строку YYYY-MM-DD/ISO8601 или Date.
 * Считает в UTC.
 */
export function calcAge(
  birthInput: number | string | Date,
  refDate: Date = new Date(),
): number {
  const birth = normalizeBirth(birthInput);
  if (!birth) throw new Error('Invalid birth date');

  const now = new Date(refDate.getTime());

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;

  return age < 0 ? 0 : age;
}

function normalizeBirth(input: number | string | Date): Date | null {
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : new Date(input.getTime());
  }

  if (typeof input === 'number') {
    return fromNumericTimestamp(input);
  }

  if (typeof input === 'string') {
    // только цифры -> таймстамп
    if (/^\d+$/.test(input)) {
      return fromNumericTimestamp(Number(input));
    }

    // строго YYYY-MM-DD -> соберём UTC дату без смещений
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      const t = Date.UTC(y, m - 1, d);
      const dt = new Date(t);
      return isValidYMD(dt, y, m - 1, d) ? dt : null;
    }

    // остальное — доверимся парсеру Date (ISO 8601 с временем и зоной)
    const dt = new Date(input);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

function fromNumericTimestamp(n: number): Date | null {
  // секунды обычно <= 1e10; миллисекунды >= 1e12
  let ms: number;
  if (n <= 1e10) {
    ms = n * 1000; // секунды -> мс
  } else {
    ms = n; // считаем, что это мс
  }
  const dt = new Date(ms);
  return isNaN(dt.getTime()) ? null : dt;
}

function isValidYMD(dt: Date, y: number, m0: number, d: number): boolean {
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m0 &&
    dt.getUTCDate() === d
  );
}
