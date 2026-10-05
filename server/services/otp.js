/**
 * 6-digit one-time codes: generation, keyed hashing and constant-time comparison.
 * A 6-digit code is only safe because attempts are capped per code and codes expire quickly.
 */
import crypto from 'crypto';

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;

function secret() {
  return process.env.JWT_SECRET || 'zynth-dev-only-secret';
}

export function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCode(email, purpose, code) {
  return crypto.createHmac('sha256', secret()).update(`${purpose}:${email}:${code}`).digest('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export const isValidCodeFormat = (code) => typeof code === 'string' && /^\d{6}$/.test(code);

/** "jane.smith@gmail.com" -> "j***h@gmail.com" (shown on the "we sent a code to" screen). */
export function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  const head = local.slice(0, 1);
  const tail = local.length > 2 ? local.slice(-1) : '';
  return `${head}${'*'.repeat(Math.max(2, Math.min(6, local.length - 1 - tail.length)))}${tail}@${domain}`;
}
