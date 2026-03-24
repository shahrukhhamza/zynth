import { createHash, randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import { extname, join } from 'path';
import { AVATARS_DIR, JOURNAL_UPLOADS_DIR, ensureUploadDirs } from '../config/storagePaths.js';

// ── DigitalOcean Spaces config (S3-compatible, persistent object storage) ────
// Variable names deliberately avoid _KEY/_SECRET suffixes to prevent
// Railpack from treating them as Docker build secrets (causes build failures).
const DO_SPACES_ACCESS   = process.env.DO_SPACES_ACCESS?.trim();   // replaces DO_SPACES_KEY
const DO_SPACES_PASS     = process.env.DO_SPACES_PASS?.trim();     // replaces DO_SPACES_SECRET
const DO_SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT?.trim();
const DO_SPACES_BUCKET   = process.env.DO_SPACES_BUCKET?.trim();
const DO_SPACES_CDN      = process.env.DO_SPACES_CDN?.trim();
const DO_SPACES_REGION   = process.env.DO_SPACES_REGION?.trim() || 'us-east-1';

// ── Cloudinary config (fallback if Spaces not configured) ────────────────────
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

const CLOUDINARY_AVATARS_FOLDER = process.env.CLOUDINARY_AVATARS_FOLDER?.trim() || 'zynth/avatars';
const CLOUDINARY_JOURNAL_FOLDER = process.env.CLOUDINARY_JOURNAL_FOLDER?.trim() || 'zynth/journal';

function hasSpacesConfig() {
  // Require real-looking credentials (not placeholder values)
  return !!(DO_SPACES_ACCESS && DO_SPACES_PASS && DO_SPACES_ENDPOINT && DO_SPACES_BUCKET
    && DO_SPACES_ACCESS.length > 8 && DO_SPACES_PASS.length > 8
    && DO_SPACES_ACCESS !== 'pending' && DO_SPACES_PASS !== 'pending');
}

function hasCloudinaryConfig() {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

// ── DO Spaces upload (lazy S3 client) ────────────────────────────────────────
let _s3Client = null;
async function getS3Client() {
  if (_s3Client) return _s3Client;
  const { S3Client } = await import('@aws-sdk/client-s3');
  _s3Client = new S3Client({
    endpoint: DO_SPACES_ENDPOINT,
    region: DO_SPACES_REGION,
    credentials: { accessKeyId: DO_SPACES_ACCESS, secretAccessKey: DO_SPACES_PASS },
    forcePathStyle: false,
  });
  return _s3Client;
}

async function uploadToSpaces({ key, buffer, contentType }) {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const s3 = await getS3Client();
  await s3.send(new PutObjectCommand({
    Bucket: DO_SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  // Prefer CDN URL for fast delivery; fall back to direct Spaces URL
  const base = DO_SPACES_CDN || `${DO_SPACES_ENDPOINT}/${DO_SPACES_BUCKET}`;
  return `${base}/${key}`;
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

/** Returns true when any durable cloud storage backend is configured. */
export function isCloudinaryEnabled() {
  return hasSpacesConfig() || hasCloudinaryConfig();
}

/** Which backend is active (useful for health-check endpoints). */
export function storageBackend() {
  if (hasSpacesConfig()) return 'do-spaces';
  if (hasCloudinaryConfig()) return 'cloudinary';
  return 'local'; // ephemeral — not suitable for production
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

  const ext = matches[1] === 'png' ? 'png' : 'jpg';

  // 1️⃣ DigitalOcean Spaces (persistent, S3-compatible)
  if (hasSpacesConfig()) {
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    try {
      return await uploadToSpaces({
        key: `avatars/user_${userId}_avatar.${ext}`,
        buffer,
        contentType: mime,
      });
    } catch (e) {
      console.error('[Spaces] avatar upload failed, falling back to local:', e.message);
    }
  }

  // 2️⃣ Cloudinary (fallback)
  if (hasCloudinaryConfig()) {
    return uploadToCloudinary({
      fileValue: avatarBase64,
      folder: CLOUDINARY_AVATARS_FOLDER,
      publicId: `user_${userId}_avatar.${ext}`,
      overwrite: true,
    });
  }

  // 3️⃣ Local disk (dev only — ephemeral on Railway)
  ensureUploadDirs();
  const filename = `${userId}.${ext}`;
  const filePath = join(AVATARS_DIR, filename);
  writeFileSync(filePath, buffer);
  return `/uploads/avatars/${filename}`;
}

export async function saveJournalScreenshot(userId, file) {
  if (!file?.buffer) return null;

  const ext = extensionFromMime(file.mimetype);
  const uniqueId = `${Date.now()}_${randomUUID()}`;

  // 1️⃣ DigitalOcean Spaces (persistent, S3-compatible)
  if (hasSpacesConfig()) {
    try {
      return await uploadToSpaces({
        key: `journal/user_${userId}_${uniqueId}${ext}`,
        buffer: file.buffer,
        contentType: file.mimetype || 'image/jpeg',
      });
    } catch (e) {
      console.error('[Spaces] screenshot upload failed, falling back to local:', e.message);
    }
  }

  // 2️⃣ Cloudinary (fallback)
  if (hasCloudinaryConfig()) {
    const blob = new Blob([file.buffer], { type: file.mimetype || 'image/jpeg' });
    return uploadToCloudinary({
      fileValue: blob,
      folder: CLOUDINARY_JOURNAL_FOLDER,
      publicId: `user_${userId}_${uniqueId}${ext}`,
      overwrite: false,
    });
  }

  // 3️⃣ Local disk (dev only — ephemeral on Railway)
  ensureUploadDirs();
  const guessedExt = extname(file.originalname || '').toLowerCase() || extensionFromMime(file.mimetype);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${guessedExt}`;
  const filePath = join(JOURNAL_UPLOADS_DIR, filename);
  writeFileSync(filePath, file.buffer);
  return `/uploads/journal/${filename}`;
}
