import { createHash, createHmac, randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { AVATARS_DIR, JOURNAL_UPLOADS_DIR, UPLOADS_DIR, ensureUploadDirs } from '../config/storagePaths.js';

const PAYMENTS_UPLOADS_DIR = join(UPLOADS_DIR, 'payments');

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

// ── Supabase Storage (persistent, free tier: 1 GB) ───────────────────────────
// Public bucket  → avatars + journal screenshots (loaded via plain <img>)
// Private bucket → payment proofs (served only to admins through this server)
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const SUPABASE_PUBLIC_BUCKET = process.env.SUPABASE_BUCKET?.trim() || 'zynth-media';
const SUPABASE_PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET?.trim() || 'zynth-private';

export function hasSupabaseStorage() {
  return !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

function supabaseHeaders(extra = {}) {
  // Legacy `service_role` keys are JWTs (eyJ…) and go in both headers. The newer `sb_secret_…` keys
  // are opaque tokens that must only be sent in `apikey`; the gateway rejects them as a Bearer JWT.
  const isLegacyJwt = SUPABASE_SERVICE_KEY.startsWith('eyJ');
  return {
    apikey: SUPABASE_SERVICE_KEY,
    ...(isLegacyJwt ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } : {}),
    ...extra,
  };
}

/** Creates the two buckets if they do not exist yet (idempotent, never fatal). */
export async function ensureSupabaseBuckets() {
  if (!hasSupabaseStorage()) return;
  for (const [id, isPublic] of [[SUPABASE_PUBLIC_BUCKET, true], [SUPABASE_PRIVATE_BUCKET, false]]) {
    try {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: supabaseHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, name: id, public: isPublic }),
      });
      if (res.ok) console.log(`✅ Supabase Storage bucket created: ${id} (${isPublic ? 'public' : 'private'})`);
      else if (res.status !== 409 && res.status !== 400) console.warn(`[Supabase] bucket ${id}: HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[Supabase] could not verify bucket ${id}:`, err.message);
    }
  }
}

async function uploadToSupabase({ bucket, path, buffer, contentType }) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: supabaseHeaders({ 'Content-Type': contentType, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' }),
    body: buffer,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Supabase upload failed (${res.status}): ${txt.slice(0, 200)}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function hasSpacesConfig() {
  // Require real-looking credentials (not placeholder values)
  return !!(DO_SPACES_ACCESS && DO_SPACES_PASS && DO_SPACES_ENDPOINT && DO_SPACES_BUCKET
    && DO_SPACES_ACCESS.length > 8 && DO_SPACES_PASS.length > 8
    && DO_SPACES_ACCESS !== 'pending' && DO_SPACES_PASS !== 'pending');
}

function hasCloudinaryConfig() {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

// ── DO Spaces upload — zero-dependency AWS Signature V4 via native fetch ────
// No @aws-sdk/* packages needed; uses Node's built-in crypto + fetch.
async function uploadToSpaces({ key, buffer, contentType }) {
  // Virtual-hosted style: https://<bucket>.<region>.digitaloceanspaces.com/<key>
  const endpointUrl = new URL(DO_SPACES_ENDPOINT);
  const host = `${DO_SPACES_BUCKET}.${endpointUrl.host}`;
  const uploadUrl = `${endpointUrl.protocol}//${host}/${key}`;

  const now = new Date();
  const datestamp  = now.toISOString().slice(0, 10).replace(/-/g, '');        // YYYYMMDD
  const amzDatetime = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'; // YYYYMMDDTHHmmssZ

  const payloadHash = createHash('sha256').update(buffer).digest('hex');

  // Canonical headers (must be sorted)
  const canonHeaders = {
    'content-type':         contentType,
    'host':                 host,
    'x-amz-acl':           'public-read',
    'x-amz-content-sha256': payloadHash,
    'x-amz-date':          amzDatetime,
  };
  const sortedKeys    = Object.keys(canonHeaders).sort();
  const signedHeaders = sortedKeys.join(';');
  const canonHeaderStr = sortedKeys.map(k => `${k}:${canonHeaders[k]}`).join('\n') + '\n';

  const canonicalRequest = [
    'PUT',
    `/${key}`,
    '',               // no query string
    canonHeaderStr,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${datestamp}/${DO_SPACES_REGION}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDatetime,
    credentialScope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  // Derive signing key
  const signingKey = [DO_SPACES_REGION, 's3', 'aws4_request'].reduce(
    (key, data) => createHmac('sha256', key).update(data).digest(),
    createHmac('sha256', `AWS4${DO_SPACES_PASS}`).update(datestamp).digest()
  );
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${DO_SPACES_ACCESS}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...canonHeaders,
      'Authorization': authorization,
    },
    body: buffer,
    duplex: 'half',   // required by Node 18+ when body is a Buffer
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Spaces upload failed (${res.status}): ${txt}`);
  }

  const base = DO_SPACES_CDN || `${endpointUrl.protocol}//${host}`;
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
  return hasSupabaseStorage() || hasSpacesConfig() || hasCloudinaryConfig();
}

/** Which backend is active (useful for health-check endpoints). */
export function storageBackend() {
  if (hasSupabaseStorage()) return 'supabase';
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

  // 0️⃣ Supabase Storage (persistent, free tier)
  if (hasSupabaseStorage()) {
    try {
      // Cache-bust: the object path is stable per user, so the URL carries the upload time.
      const url = await uploadToSupabase({
        bucket: SUPABASE_PUBLIC_BUCKET,
        path: `avatars/user_${userId}_avatar.${ext}`,
        buffer,
        contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      });
      return `${url}?v=${Date.now()}`;
    } catch (e) {
      console.error('[Supabase] avatar upload failed, falling back:', e.message);
    }
  }

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

  // 0️⃣ Supabase Storage (persistent, free tier)
  if (hasSupabaseStorage()) {
    try {
      return await uploadToSupabase({
        bucket: SUPABASE_PUBLIC_BUCKET,
        path: `journal/user_${userId}_${uniqueId}${ext}`,
        buffer: file.buffer,
        contentType: file.mimetype || 'image/jpeg',
      });
    } catch (e) {
      console.error('[Supabase] screenshot upload failed, falling back:', e.message);
    }
  }

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

// ── Payment proofs (private) ──────────────────────────────────────────────────
const PROOF_NAME_RE = /^pay_[0-9a-f-]{36}\.[a-z0-9]{1,5}$/;

export function isValidProofName(name) {
  return PROOF_NAME_RE.test(String(name || ''));
}

/**
 * Stores a payment-proof image and returns the URL path that is saved in the database.
 * The path is always /uploads/payments/<file>; the server decides where the bytes really live.
 */
export async function savePaymentProof(file) {
  const ext = extensionFromMime(file.mimetype);
  const name = `pay_${randomUUID()}${ext}`;

  if (hasSupabaseStorage()) {
    await uploadToSupabase({
      bucket: SUPABASE_PRIVATE_BUCKET,
      path: `payments/${name}`,
      buffer: file.buffer,
      contentType: file.mimetype || 'image/jpeg',
    });
  } else {
    ensureUploadDirs();
    mkdirSync(PAYMENTS_UPLOADS_DIR, { recursive: true });
    writeFileSync(join(PAYMENTS_UPLOADS_DIR, name), file.buffer);
  }
  return `/uploads/payments/${name}`;
}

/** Fetches a stored proof from the private bucket (null when Supabase is not in use / not found). */
export async function fetchPaymentProofFromSupabase(name) {
  if (!hasSupabaseStorage() || !isValidProofName(name)) return null;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_PRIVATE_BUCKET}/payments/${name}`, {
    headers: supabaseHeaders(),
  });
  return res.ok ? res : null;
}
