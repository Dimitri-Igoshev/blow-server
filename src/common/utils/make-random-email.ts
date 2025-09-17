import { randomBytes } from 'node:crypto';

export function makeRandomEmail(domain = 'blow.ru', base = 'fake') {
  const ts = Date.now().toString(36);
  const rnd = randomBytes(6).toString('hex'); // 12 hex символов
  return `${base}+${ts}${rnd}@${domain}`;
}