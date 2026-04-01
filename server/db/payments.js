/**
 * payments.js — PostgreSQL layer for manual payment requests.
 *
 * Table: payment_requests
 *   id, user_id, plan, billing_cycle, method, amount, note, proof_url, status, reviewed_by, reviewed_at, created_at
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// ── Init / migrate ────────────────────────────────────────────────────────────

export async function initPaymentsDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan         TEXT    NOT NULL DEFAULT 'pro',
      billing_cycle TEXT   NOT NULL DEFAULT 'monthly',
      method       TEXT    NOT NULL,
      amount       TEXT,
      note         TEXT,
      proof_url    TEXT,
      status       TEXT    NOT NULL DEFAULT 'pending',
      reviewed_by  INTEGER DEFAULT NULL,
      reviewed_at  TIMESTAMPTZ DEFAULT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrations = [
    `ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS note TEXT`,
    `ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS reviewed_by INTEGER DEFAULT NULL`,
    `ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL`,
    `ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS amount TEXT`,
    `ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'`,
  ];
  for (const sql of migrations) {
    try { await pool.query(sql); } catch { /* column already exists */ }
  }

  console.log('✅ Payments schema ready');
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export async function createPaymentRequest({ userId, plan, billingCycle = 'monthly', method, amount, note, proofUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO payment_requests (user_id, plan, billing_cycle, method, amount, note, proof_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [userId, plan, billingCycle, method, amount ?? null, note ?? null, proofUrl ?? null],
  );
  return rows[0];
}

export async function updatePaymentStatus(id, status, reviewedBy) {
  const { rows } = await pool.query(
    `UPDATE payment_requests
     SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, reviewedBy, id],
  );
  return rows[0] ?? null;
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export async function getAllPaymentRequests() {
  const { rows } = await pool.query(`
    SELECT pr.*,
           u.name  AS user_name,
           u.email AS user_email
    FROM payment_requests pr
    JOIN users u ON u.id = pr.user_id
    ORDER BY pr.created_at DESC
  `);
  return rows;
}

export async function getPaymentRequestById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM payment_requests WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

export async function getPaymentRequestsByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM payment_requests WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );
  return rows;
}

// ── Latest status for a user (most recent request) ────────────────────────────
export async function getLatestPaymentStatusByUser(userId) {
  const { rows } = await pool.query(
    `SELECT id, plan, billing_cycle, method, amount, status, created_at, reviewed_at
     FROM payment_requests
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

// ── All requests for a user (summary list) ────────────────────────────────────
export async function getPaymentHistoryByUser(userId) {
  const { rows } = await pool.query(
    `SELECT id, plan, billing_cycle, method, amount, status, created_at, reviewed_at
     FROM payment_requests
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}
