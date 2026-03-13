/**
 * journalDb.js — SQLite database for the AI Trading Journal
 * Manages: trades, trade_journals, performance_reports
 */
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, '..', '..', 'journal.db');
const UPLOADS_DIR = join(__dirname, '..', 'uploads', 'journal');

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

let _db;
export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _initSchema(_db);
    console.log('✅ Trade Journal DB initialized at', DB_PATH);
  }
  return _db;
}

function _initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        TEXT    NOT NULL DEFAULT 'default',
      pair           TEXT    NOT NULL,
      direction      TEXT    NOT NULL,       -- 'buy' | 'sell'
      position_size  REAL,
      entry_price    REAL,
      exit_price     REAL,
      tp             REAL,
      sl             REAL,
      outcome        TEXT,                   -- 'win' | 'loss' | 'breakeven'
      profit_loss    REAL,
      session        TEXT,                   -- 'london' | 'new_york' | 'asian' | 'overlap'
      screenshot_path TEXT,
      created_at     TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS trade_journals (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id        INTEGER NOT NULL UNIQUE,
      strategy        TEXT,
      reasoning       TEXT,
      emotional_state TEXT,
      lessons_learned TEXT,
      notes           TEXT,
      ai_analysis     TEXT,                  -- JSON blob from Gemini
      created_at      TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS performance_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL DEFAULT 'default',
      report_type TEXT,                      -- 'weekly' | 'monthly' | 'custom'
      report_data TEXT,                      -- JSON
      created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trades_user   ON trades(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_user  ON performance_reports(user_id, created_at DESC);
  `);
}

// ── Trades ────────────────────────────────────────────────────────────────────
export function insertTrade(data) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO trades
      (user_id, pair, direction, position_size, entry_price, exit_price, tp, sl, outcome, profit_loss, session, screenshot_path)
    VALUES
      (@user_id, @pair, @direction, @position_size, @entry_price, @exit_price, @tp, @sl, @outcome, @profit_loss, @session, @screenshot_path)
  `).run(data);
  return r.lastInsertRowid;
}

export function getTrades(userId = 'default', limit = 100, offset = 0) {
  return getDb().prepare(`
    SELECT t.*,
           j.strategy, j.reasoning, j.emotional_state,
           j.lessons_learned, j.notes, j.ai_analysis,
           j.id AS journal_id
    FROM   trades t
    LEFT JOIN trade_journals j ON j.trade_id = t.id
    WHERE  t.user_id = ?
    ORDER  BY t.created_at DESC
    LIMIT  ? OFFSET ?
  `).all(userId, limit, offset);
}

export function getTradeById(id) {
  return getDb().prepare(`
    SELECT t.*,
           j.strategy, j.reasoning, j.emotional_state,
           j.lessons_learned, j.notes, j.ai_analysis,
           j.id AS journal_id
    FROM   trades t
    LEFT JOIN trade_journals j ON j.trade_id = t.id
    WHERE  t.id = ?
  `).get(id);
}

export function updateTrade(id, data) {
  const allowed = ['pair','direction','position_size','entry_price','exit_price','tp','sl','outcome','profit_loss','session','screenshot_path'];
  const fields  = Object.keys(data).filter(k => allowed.includes(k));
  if (!fields.length) return;
  const db = getDb();
  db.prepare(
    `UPDATE trades SET ${fields.map(k => `${k} = @${k}`).join(', ')} WHERE id = @id`
  ).run({ ...data, id });
}

export function deleteTrade(id) {
  getDb().prepare('DELETE FROM trades WHERE id = ?').run(id);
}

export function countTrades(userId = 'default') {
  return getDb().prepare('SELECT COUNT(*) AS n FROM trades WHERE user_id = ?').get(userId).n;
}

export function countTradesThisMonth(userId = 'default') {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return getDb()
    .prepare("SELECT COUNT(*) AS n FROM trades WHERE user_id = ? AND created_at >= ?")
    .get(userId, start.toISOString()).n;
}

// ── Trade Journals ────────────────────────────────────────────────────────────
export function upsertJournal(tradeId, data) {
  const db  = getDb();
  const ex  = db.prepare('SELECT id FROM trade_journals WHERE trade_id = ?').get(tradeId);
  const allowed = ['strategy','reasoning','emotional_state','lessons_learned','notes'];
  const clean   = {};
  allowed.forEach(k => { if (data[k] !== undefined) clean[k] = data[k]; });

  if (ex) {
    if (Object.keys(clean).length) {
      db.prepare(
        `UPDATE trade_journals SET ${Object.keys(clean).map(k => `${k} = @${k}`).join(', ')} WHERE trade_id = @trade_id`
      ).run({ ...clean, trade_id: tradeId });
    }
    return ex.id;
  } else {
    const r = db.prepare(`
      INSERT INTO trade_journals (trade_id, strategy, reasoning, emotional_state, lessons_learned, notes)
      VALUES (@trade_id, @strategy, @reasoning, @emotional_state, @lessons_learned, @notes)
    `).run({ trade_id: tradeId, strategy:'', reasoning:'', emotional_state:'', lessons_learned:'', notes:'', ...clean });
    return r.lastInsertRowid;
  }
}

export function setJournalAiAnalysis(tradeId, aiAnalysis) {
  getDb().prepare('UPDATE trade_journals SET ai_analysis = ? WHERE trade_id = ?')
         .run(JSON.stringify(aiAnalysis), tradeId);
}

// ── Analytics raw data ────────────────────────────────────────────────────────
export function getAllTradesForUser(userId = 'default') {
  return getDb().prepare(`
    SELECT t.*, j.strategy, j.reasoning, j.emotional_state, j.lessons_learned, j.notes
    FROM   trades t
    LEFT JOIN trade_journals j ON j.trade_id = t.id
    WHERE  t.user_id = ?
    ORDER  BY t.created_at ASC
  `).all(userId);
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function insertReport(data) {
  const r = getDb().prepare(`
    INSERT INTO performance_reports (user_id, report_type, report_data)
    VALUES (@user_id, @report_type, @report_data)
  `).run(data);
  return r.lastInsertRowid;
}

export function getReports(userId = 'default', limit = 20) {
  return getDb().prepare(`
    SELECT * FROM performance_reports
    WHERE  user_id = ?
    ORDER  BY created_at DESC
    LIMIT  ?
  `).all(userId, limit);
}
