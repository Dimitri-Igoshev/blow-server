/**
 * Возраст (полных лет) по дате рождения.
 * Принимает ms-таймстамп, sec-таймстамп, ISO-строку или Date.
 * Считает в UTC, чтобы избежать погрешностей по таймзонам.
 */
export function calcAge(
  birthInput: number | string | Date,
  refDate: Date = new Date(),
): number {
  let birth: Date;

  if (birthInput instanceof Date) {
    birth = new Date(birthInput.getTime());
  } else if (typeof birthInput === 'number') {
    const ms = birthInput < 1e12 ? birthInput * 1000 : birthInput; // sec -> ms
    birth = new Date(ms);
  } else if (typeof birthInput === 'string') {
    // если строка состоит только из цифр — считаем это таймстампом
    if (/^\d+$/.test(birthInput)) {
      const n = Number(birthInput);
      const ms = n < 1e12 ? n * 1000 : n; // sec -> ms
      birth = new Date(ms);
    } else {
      // ISO и т.п.
      birth = new Date(birthInput);
    }
  } else {
    throw new Error('Invalid birth date');
  }

  if (Number.isNaN(birth.getTime())) {
    throw new Error('Invalid birth date');
  }

  const now = new Date(refDate.getTime());

  // Считаем в UTC, чтобы день рождения не "прыгал" у границ суток
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age < 0 ? 0 : age;
}
