import { mkdirSync, existsSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_ROOT = join(__dirname, '..');

function resolveUploadsRoot() {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (!configured) return join(SERVER_ROOT, 'uploads');
  return isAbsolute(configured) ? configured : join(SERVER_ROOT, configured);
}

export const UPLOADS_DIR = resolveUploadsRoot();
export const AVATARS_DIR = join(UPLOADS_DIR, 'avatars');
export const JOURNAL_UPLOADS_DIR = join(UPLOADS_DIR, 'journal');

export function ensureUploadDirs() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!existsSync(AVATARS_DIR)) mkdirSync(AVATARS_DIR, { recursive: true });
  if (!existsSync(JOURNAL_UPLOADS_DIR)) mkdirSync(JOURNAL_UPLOADS_DIR, { recursive: true });
}
