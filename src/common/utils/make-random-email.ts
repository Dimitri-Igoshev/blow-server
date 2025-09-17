import crypto from 'node:crypto';

export function makeRandomEmail(domain = 'blow.ru', base = 'fake') {
  // безопасный хвост: timestamp в base36 + 6 байт hex (12 символов)
  const ts = Date.now().toString(36);
  const rnd = crypto.randomBytes(6).toString('hex'); // [a-f0-9]{12}
  const local = `${base}+${ts}${rnd}`; // следим, чтобы <=64 символов
  return `${local}@${domain}`;
}
