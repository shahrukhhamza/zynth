/**
 * journalDb.js — PostgreSQL persistence for journal, checklist, macro snapshots,
 * DNA reports, and saved levels.
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

let initPromise;

function serializeRow(row) {
  if (!row) return row;
  const serialized = { ...row };
  for (const [key, value] of Object.entries(serialized)) {
    if (value instanceof Date) serialized[key] = value.toISOString();
  }
  return serialized;
}

function serializeRows(rows) {
  return rows.map(serializeRow);
}

export function getDb() {
  return pool;
}

export async function initJournalDb() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id              SERIAL PRIMARY KEY,
        user_id         TEXT NOT NULL DEFAULT 'default',
        pair            TEXT NOT NULL,
        direction       TEXT NOT NULL,
        position_size   DOUBLE PRECISION,
        entry_price     DOUBLE PRECISION,
        exit_price      DOUBLE PRECISION,
        tp              DOUBLE PRECISION,
        sl              DOUBLE PRECISION,
        outcome         TEXT,
        profit_loss     DOUBLE PRECISION,
        session         TEXT,
        screenshot_path TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trade_journals (
        id               SERIAL PRIMARY KEY,
        trade_id         INTEGER NOT NULL UNIQUE REFERENCES trades(id) ON DELETE CASCADE,
        strategy         TEXT,
        reasoning        TEXT,
        emotional_state  TEXT,
        lessons_learned  TEXT,
        notes            TEXT,
        ai_analysis      TEXT,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS performance_reports (
        id           SERIAL PRIMARY KEY,
        user_id      TEXT NOT NULL DEFAULT 'default',
        report_type  TEXT,
        report_data  TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checklist (
        id              SERIAL PRIMARY KEY,
        user_id         TEXT NOT NULL DEFAULT 'default',
        score           INTEGER,
        answers         TEXT,
        recommendation  TEXT,
        proceeded       INTEGER DEFAULT 0,
        trade_result    TEXT DEFAULT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS macro_snapshots (
        id          SERIAL PRIMARY KEY,
        score       DOUBLE PRECISION,
        label       TEXT,
        date        TEXT UNIQUE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dna_reports (
        id                SERIAL PRIMARY KEY,
        user_id           TEXT NOT NULL DEFAULT 'default',
        archetype         TEXT,
        trait_scores      TEXT,
        strengths         TEXT,
        weaknesses        TEXT,
        coach_message     TEXT,
        improvement_plan  TEXT,
        report_data       TEXT,
        generated_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS levels (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT NOT NULL,
        symbol      TEXT NOT NULL,
        type        TEXT NOT NULL,
        price       DOUBLE PRECISION NOT NULL,
        note        TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_user ON performance_reports(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist(user_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_macro_snapshot_date ON macro_snapshots(date);
      CREATE INDEX IF NOT EXISTS idx_dna_user ON dna_reports(user_id, generated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_levels_user_sym ON levels(user_id, symbol);
    `);

    // Idempotent column additions for Trade Context Report
    const alterCols = [
      `ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS macro_alignment     TEXT`,
      `ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS macro_events_json   TEXT`,
      `ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS macro_narrative     TEXT`,
      `ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS macro_analysed_at   TIMESTAMPTZ`,
    ];
    for (const sql of alterCols) {
      try { await pool.query(sql); } catch (_) { /* already exists */ }
    }

    console.log('✅ Trade Journal PostgreSQL schema ready');
  })();

  return initPromise;
}

export async function syncSequence(tableName) {
  await pool.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${tableName}), 1), (SELECT COUNT(*) > 0 FROM ${tableName}))`,
    [tableName]
  );
}

export async function insertTrade(data) {
  const { rows } = await pool.query(
    `INSERT INTO trades
      (user_id, pair, direction, position_size, entry_price, exit_price, tp, sl, outcome, profit_loss, session, screenshot_path)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      data.user_id,
      data.pair,
      data.direction,
      data.position_size,
      data.entry_price,
      data.exit_price,
      data.tp,
      data.sl,
      data.outcome,
      data.profit_loss,
      data.session,
      data.screenshot_path,
    ]
  );
  return rows[0].id;
}

export async function getTrades(userId = 'default', limit = 100, offset = 0) {
  const { rows } = await pool.query(
    `SELECT t.*, j.strategy, j.reasoning, j.emotional_state,
            j.lessons_learned, j.notes, j.ai_analysis,
            j.macro_alignment, j.macro_events_json, j.macro_narrative, j.macro_analysed_at,
            j.id AS journal_id
     FROM trades t
     LEFT JOIN trade_journals j ON j.trade_id = t.id
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return serializeRows(rows);
}

export async function getTradeById(id) {
  const { rows } = await pool.query(
    `SELECT t.*, j.strategy, j.reasoning, j.emotional_state,
            j.lessons_learned, j.notes, j.ai_analysis,
            j.macro_alignment, j.macro_events_json, j.macro_narrative, j.macro_analysed_at,
            j.id AS journal_id
     FROM trades t
     LEFT JOIN trade_journals j ON j.trade_id = t.id
     WHERE t.id = $1`,
    [id]
  );
  return serializeRow(rows[0] ?? null);
}

export async function updateTrade(id, data) {
  const allowed = ['pair', 'direction', 'position_size', 'entry_price', 'exit_price', 'tp', 'sl', 'outcome', 'profit_loss', 'session', 'screenshot_path'];
  const fields = Object.keys(data).filter((key) => allowed.includes(key));
  if (!fields.length) return;

  const assignments = fields.map((key, index) => `${key} = $${index + 1}`);
  const values = fields.map((key) => data[key]);
  values.push(id);

  await pool.query(`UPDATE trades SET ${assignments.join(', ')} WHERE id = $${values.length}`, values);
}

export async function deleteTrade(id) {
  await pool.query('DELETE FROM trades WHERE id = $1', [id]);
}

export async function getTradesBySymbol(userId = 'default', symbol, limit = 100, offset = 0) {
  const { rows } = await pool.query(
    `SELECT t.*, j.strategy, j.reasoning, j.emotional_state,
            j.lessons_learned, j.notes, j.ai_analysis,
            j.macro_alignment, j.macro_events_json, j.macro_narrative, j.macro_analysed_at,
            j.id AS journal_id
     FROM trades t
     LEFT JOIN trade_journals j ON j.trade_id = t.id
     WHERE t.user_id = $1 AND UPPER(t.pair) = UPPER($2)
     ORDER BY t.created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, symbol, limit, offset]
  );
  return serializeRows(rows);
}

export async function countTradesBySymbol(userId = 'default', symbol) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS n FROM trades WHERE user_id = $1 AND UPPER(pair) = UPPER($2)',
    [userId, symbol]
  );
  return rows[0]?.n ?? 0;
}

export async function countTrades(userId = 'default') {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM trades WHERE user_id = $1', [userId]);
  return rows[0]?.n ?? 0;
}

export async function countTradesThisMonth(userId = 'default') {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS n FROM trades WHERE user_id = $1 AND created_at >= $2',
    [userId, start.toISOString()]
  );
  return rows[0]?.n ?? 0;
}

export async function upsertJournal(tradeId, data) {
  const { rows } = await pool.query('SELECT id FROM trade_journals WHERE trade_id = $1', [tradeId]);
  const existing = rows[0] ?? null;
  const allowed = ['strategy', 'reasoning', 'emotional_state', 'lessons_learned', 'notes'];
  const clean = {};
  for (const key of allowed) {
    if (data[key] !== undefined) clean[key] = data[key];
  }

  if (existing) {
    if (Object.keys(clean).length) {
      const fields = Object.keys(clean);
      const assignments = fields.map((key, index) => `${key} = $${index + 1}`);
      const values = fields.map((key) => clean[key]);
      values.push(tradeId);
      await pool.query(`UPDATE trade_journals SET ${assignments.join(', ')} WHERE trade_id = $${values.length}`, values);
    }
    return existing.id;
  }

  const { rows: inserted } = await pool.query(
    `INSERT INTO trade_journals (trade_id, strategy, reasoning, emotional_state, lessons_learned, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      tradeId,
      clean.strategy ?? '',
      clean.reasoning ?? '',
      clean.emotional_state ?? '',
      clean.lessons_learned ?? '',
      clean.notes ?? '',
    ]
  );
  return inserted[0].id;
}

export async function setJournalAiAnalysis(tradeId, aiAnalysis) {
  await pool.query('UPDATE trade_journals SET ai_analysis = $1 WHERE trade_id = $2', [JSON.stringify(aiAnalysis), tradeId]);
}

export async function setMacroContext(tradeId, { alignment, eventsJson, narrative }) {
  // Ensure journal row exists first
  const { rows } = await pool.query('SELECT id FROM trade_journals WHERE trade_id = $1', [tradeId]);
  if (!rows[0]) {
    await pool.query(
      `INSERT INTO trade_journals (trade_id) VALUES ($1) ON CONFLICT (trade_id) DO NOTHING`,
      [tradeId]
    );
  }
  await pool.query(
    `UPDATE trade_journals
     SET macro_alignment = $1, macro_events_json = $2, macro_narrative = $3, macro_analysed_at = NOW()
     WHERE trade_id = $4`,
    [alignment, JSON.stringify(eventsJson), narrative, tradeId]
  );
}

export async function getAllTradesForUser(userId = 'default') {
  const { rows } = await pool.query(
    `SELECT t.*, j.strategy, j.reasoning, j.emotional_state, j.lessons_learned, j.notes
     FROM trades t
     LEFT JOIN trade_journals j ON j.trade_id = t.id
     WHERE t.user_id = $1
     ORDER BY t.created_at ASC`,
    [userId]
  );
  return serializeRows(rows);
}

export async function insertReport(data) {
  const { rows } = await pool.query(
    `INSERT INTO performance_reports (user_id, report_type, report_data)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [data.user_id, data.report_type, data.report_data]
  );
  return rows[0].id;
}

export async function getReports(userId = 'default', limit = 20) {
  const { rows } = await pool.query(
    `SELECT * FROM performance_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return serializeRows(rows);
}

export async function insertChecklist(data) {
  const { rows } = await pool.query(
    `INSERT INTO checklist (user_id, score, answers, recommendation, proceeded)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.user_id, data.score, data.answers, data.recommendation, data.proceeded]
  );
  return rows[0].id;
}

export async function getChecklistHistory(userId = 'default', limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM checklist WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return serializeRows(rows);
}

export async function getChecklistRawStats(userId = 'default') {
  const { rows } = await pool.query(
    'SELECT score, recommendation, proceeded, trade_result FROM checklist WHERE user_id = $1',
    [userId]
  );
  return serializeRows(rows);
}

export async function insertMacroSnapshot({ score, label = 'Unknown', date }) {
  await pool.query(
    `INSERT INTO macro_snapshots (score, label, date)
     VALUES ($1, $2, $3)
     ON CONFLICT(date) DO UPDATE SET score = EXCLUDED.score, label = EXCLUDED.label`,
    [score, label, date]
  );
}

export async function getMacroSnapshotForDate(date) {
  const { rows } = await pool.query('SELECT * FROM macro_snapshots WHERE date = $1', [date]);
  return serializeRow(rows[0] ?? null);
}

export async function getRecentMacroSnapshots(limit = 180) {
  const { rows } = await pool.query('SELECT date, score, label FROM macro_snapshots ORDER BY date ASC LIMIT $1', [limit]);
  return serializeRows(rows);
}

export async function insertDnaReport(data) {
  const { rows } = await pool.query(
    `INSERT INTO dna_reports
      (user_id, archetype, trait_scores, strengths, weaknesses, coach_message, improvement_plan, report_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      data.user_id,
      data.archetype,
      data.trait_scores,
      data.strengths,
      data.weaknesses,
      data.coach_message,
      data.improvement_plan,
      data.report_data,
    ]
  );
  return rows[0].id;
}

export async function getLatestDnaReport(userId = 'default') {
  const { rows } = await pool.query(
    'SELECT * FROM dna_reports WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1',
    [userId]
  );
  return serializeRow(rows[0] ?? null);
}

export async function countDnaReportsThisMonth(userId = 'default') {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS n FROM dna_reports WHERE user_id = $1 AND generated_at >= $2',
    [userId, start.toISOString()]
  );
  return rows[0]?.n ?? 0;
}

export async function getLevelsForUserSymbol(userId, symbol) {
  const { rows } = await pool.query(
    'SELECT * FROM levels WHERE user_id = $1 AND symbol = $2 ORDER BY price DESC',
    [String(userId), symbol.trim()]
  );
  return serializeRows(rows);
}

export async function createLevel({ user_id, symbol, type, price, note }) {
  const { rows } = await pool.query(
    `INSERT INTO levels (user_id, symbol, type, price, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [String(user_id), symbol.trim(), type, price, note]
  );
  return serializeRow(rows[0]);
}

export async function findLevelByIdForUser(id, userId) {
  const { rows } = await pool.query(
    'SELECT id FROM levels WHERE id = $1 AND user_id = $2',
    [id, String(userId)]
  );
  return rows[0] ?? null;
}

export async function deleteLevelById(id) {
  await pool.query('DELETE FROM levels WHERE id = $1', [id]);
}
