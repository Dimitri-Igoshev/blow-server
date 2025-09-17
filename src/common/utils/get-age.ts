/**
 * Вычисляет возраст (полных лет) по дате рождения.
 * @param birthInput - ms-таймстамп, ISO-строка или Date
 * @param refDate - дата, на которую считаем возраст (по умолчанию сейчас)
 */
export function calcAge(
  birthInput: number | string | Date,
  refDate: Date = new Date(),
): number {
  // поддержим таймстамп в секундах: 1_000_000_000..1_000_000_000_000
  const birth =
    typeof birthInput === 'number' && birthInput < 1e12
      ? new Date(birthInput * 1000)
      : new Date(birthInput);

  if (Number.isNaN(birth.getTime())) {
    throw new Error('Invalid birth date');
  }

  const now = new Date(refDate);

  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return Math.max(age, 0);
}
