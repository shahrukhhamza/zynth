import { mkdirSync, existsSync } from 'fs';
import { dirname, isAbsolute, join, resolve, normalize } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_ROOT = join(__dirname, '..');

function resolveUploadsRoot() {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (!configured) return join(SERVER_ROOT, 'uploads');
  // Block path traversal sequences
  if (configured.includes('..')) {
    console.warn('[security] UPLOADS_DIR contains path traversal — using default');
    return join(SERVER_ROOT, 'uploads');
  }
  const resolved = isAbsolute(configured) ? resolve(configured) : resolve(SERVER_ROOT, configured);
  return normalize(resolved);
}

export const UPLOADS_DIR = resolveUploadsRoot();
export const AVATARS_DIR = join(UPLOADS_DIR, 'avatars');
export const JOURNAL_UPLOADS_DIR = join(UPLOADS_DIR, 'journal');

export function ensureUploadDirs() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!existsSync(AVATARS_DIR)) mkdirSync(AVATARS_DIR, { recursive: true });
  if (!existsSync(JOURNAL_UPLOADS_DIR)) mkdirSync(JOURNAL_UPLOADS_DIR, { recursive: true });
}
