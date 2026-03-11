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
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password_hash TEXT,
    google_id   TEXT    UNIQUE,
    avatar      TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  )
`);

export const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

export const findById = (id) =>
  db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(id);

export const findByGoogleId = (googleId) =>
  db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

export const createUser = ({ name, email, password_hash = null, google_id = null, avatar = null }) =>
  db.prepare(`
    INSERT INTO users (name, email, password_hash, google_id, avatar)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase().trim(), password_hash, google_id, avatar);

export const linkGoogleId = (id, google_id, avatar) =>
  db.prepare('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?').run(google_id, avatar, id);

export default db;
