import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DB_DIR, 'users.db');

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT    NOT NULL,
    email                TEXT    UNIQUE NOT NULL,
    password_hash        TEXT,
    google_id            TEXT    UNIQUE,
    avatar               TEXT,
    created_at           TEXT    DEFAULT (datetime('now')),
    plan                 TEXT    DEFAULT 'free',
    plan_expires_at      TEXT    DEFAULT NULL,
    ai_analysis_tries    INTEGER DEFAULT 0,
    screenshot_tries     INTEGER DEFAULT 0,
    is_admin             INTEGER DEFAULT 0,
    reset_token          TEXT    DEFAULT NULL,
    reset_token_expires  TEXT    DEFAULT NULL
  )
`);

// Migrate existing databases that lack the new columns
const migrations = [
  "ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'",
  'ALTER TABLE users ADD COLUMN plan_expires_at TEXT DEFAULT NULL',
  'ALTER TABLE users ADD COLUMN ai_analysis_tries INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN screenshot_tries INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN reset_token TEXT DEFAULT NULL',
  'ALTER TABLE users ADD COLUMN reset_token_expires TEXT DEFAULT NULL',
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists — safe to ignore */ }
}

export const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

export const findById = (id) =>
  db.prepare(
    'SELECT id, name, email, avatar, created_at, plan, plan_expires_at, ai_analysis_tries, screenshot_tries, is_admin FROM users WHERE id = ?'
  ).get(id);

export const findByGoogleId = (googleId) =>
  db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

export const createUser = ({ name, email, password_hash = null, google_id = null, avatar = null }) =>
  db.prepare(`
    INSERT INTO users (name, email, password_hash, google_id, avatar)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase().trim(), password_hash, google_id, avatar);

export const linkGoogleId = (id, google_id, avatar) =>
  db.prepare('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?').run(google_id, avatar, id);

export const updateUserPlan = (id, plan, expiresAt = null) =>
  db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?').run(plan, expiresAt, id);

export const incrementAiTries = (id) =>
  db.prepare('UPDATE users SET ai_analysis_tries = ai_analysis_tries + 1 WHERE id = ?').run(id);

export const incrementScreenshotTries = (id) =>
  db.prepare('UPDATE users SET screenshot_tries = screenshot_tries + 1 WHERE id = ?').run(id);

export const setAdmin = (id, isAdmin) =>
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, id);

export const findAll = () =>
  db.prepare(
    'SELECT id, name, email, plan, plan_expires_at, is_admin, created_at, ai_analysis_tries, screenshot_tries FROM users ORDER BY created_at DESC'
  ).all();

export const deleteUser = (id) =>
  db.prepare('DELETE FROM users WHERE id = ?').run(id);

export const resetTries = (id) =>
  db.prepare('UPDATE users SET ai_analysis_tries = 0, screenshot_tries = 0 WHERE id = ?').run(id);

export const setResetToken = (email, token, expires) =>
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?')
    .run(token, expires, email.toLowerCase().trim());

export const findByResetToken = (token) =>
  db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);

export const clearResetToken = (id) =>
  db.prepare('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(id);

export const setPassword = (id, password_hash) =>
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, id);

export default db;
