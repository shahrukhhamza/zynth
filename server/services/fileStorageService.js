import { createHash, randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import { extname, join } from 'path';
import { AVATARS_DIR, JOURNAL_UPLOADS_DIR, ensureUploadDirs } from '../config/storagePaths.js';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

const CLOUDINARY_AVATARS_FOLDER = process.env.CLOUDINARY_AVATARS_FOLDER?.trim() || 'zynth/avatars';
const CLOUDINARY_JOURNAL_FOLDER = process.env.CLOUDINARY_JOURNAL_FOLDER?.trim() || 'zynth/journal';

function hasCloudinaryConfig() {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

function cloudinarySignature(params) {
  const signingString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(`${signingString}${CLOUDINARY_API_SECRET}`).digest('hex');
}

async function uploadToCloudinary({ fileValue, folder, publicId, overwrite = false, resourceType = 'image' }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder,
    public_id: publicId,
    overwrite: overwrite ? 'true' : 'false',
    timestamp,
  };

  const form = new FormData();
  form.append('file', fileValue);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('overwrite', overwrite ? 'true' : 'false');
  form.append('signature', cloudinarySignature(paramsToSign));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: form }
  );

  const payload = await response.json();
  if (!response.ok) {
    const detail = payload?.error?.message || 'Cloudinary upload failed';
    throw new Error(detail);
  }

  return payload.secure_url;
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  return '.jpg';
}

export function isCloudinaryEnabled() {
  return hasCloudinaryConfig();
}

export async function saveAvatarFromBase64(userId, avatarBase64) {
  const matches = avatarBase64?.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return null;

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > 2 * 1024 * 1024) {
    const err = new Error('Image too large. Max size is 2MB.');
    err.statusCode = 400;
    throw err;
  }

  if (hasCloudinaryConfig()) {
    const ext = matches[1] === 'png' ? 'png' : 'jpg';
    return uploadToCloudinary({
      fileValue: avatarBase64,
      folder: CLOUDINARY_AVATARS_FOLDER,
      publicId: `user_${userId}_avatar.${ext}`,
      overwrite: true,
    });
  }

  ensureUploadDirs();
  const ext = matches[1] === 'png' ? 'png' : 'jpg';
  const filename = `${userId}.${ext}`;
  const filePath = join(AVATARS_DIR, filename);
  writeFileSync(filePath, buffer);
  return `/uploads/avatars/${filename}`;
}

export async function saveJournalScreenshot(userId, file) {
  if (!file?.buffer) return null;

  if (hasCloudinaryConfig()) {
    const blob = new Blob([file.buffer], { type: file.mimetype || 'image/jpeg' });
    const ext = extensionFromMime(file.mimetype);
    return uploadToCloudinary({
      fileValue: blob,
      folder: CLOUDINARY_JOURNAL_FOLDER,
      publicId: `user_${userId}_${Date.now()}_${randomUUID()}${ext}`,
      overwrite: false,
    });
  }

  ensureUploadDirs();
  const guessedExt = extname(file.originalname || '').toLowerCase() || extensionFromMime(file.mimetype);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${guessedExt}`;
  const filePath = join(JOURNAL_UPLOADS_DIR, filename);
  writeFileSync(filePath, file.buffer);
  return `/uploads/journal/${filename}`;
}
