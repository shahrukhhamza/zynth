/**
 * One-time email codes (6 digits) for signup verification and password reset.
 *
 * One row per (email, purpose). Only a keyed hash of the code is stored, never the code itself.
 * Signup rows also carry the pending account (`payload`: name + bcrypt hash), so no user row exists
 * until the email address has actually been proven.
 */
import pool from './pool.js';

export async function initEmailCodes() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_codes (
      id                  SERIAL PRIMARY KEY,
      email               TEXT        NOT NULL,
      purpose             TEXT        NOT NULL,
      code_hash           TEXT        NOT NULL,
      payload             JSONB       DEFAULT NULL,
      attempts            INTEGER     NOT NULL DEFAULT 0,
      sends               INTEGER     NOT NULL DEFAULT 1,
      expires_at          TIMESTAMPTZ NOT NULL,
      last_sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      first_sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_token_hash TEXT        DEFAULT NULL,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, purpose)
    )
  `);
}

export async function getCode(email, purpose) {
  const { rows } = await pool.query('SELECT * FROM email_codes WHERE email = $1 AND purpose = $2', [email, purpose]);
  return rows[0] ?? null;
}

/**
 * Create or replace the code for (email, purpose). Resets the attempt counter, and counts how many
 * codes were sent in the current hour so abuse can be capped.
 */
export async function upsertCode({ email, purpose, codeHash, payload = null, ttlMinutes = 10 }) {
  const { rows } = await pool.query(
    `INSERT INTO email_codes (email, purpose, code_hash, payload, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::interval)
     ON CONFLICT (email, purpose) DO UPDATE SET
       code_hash           = EXCLUDED.code_hash,
       payload             = COALESCE(EXCLUDED.payload, email_codes.payload),
       attempts            = 0,
       verified_token_hash = NULL,
       expires_at          = EXCLUDED.expires_at,
       sends               = CASE WHEN email_codes.first_sent_at > NOW() - INTERVAL '1 hour' THEN email_codes.sends + 1 ELSE 1 END,
       first_sent_at       = CASE WHEN email_codes.first_sent_at > NOW() - INTERVAL '1 hour' THEN email_codes.first_sent_at ELSE NOW() END,
       last_sent_at        = NOW()
     RETURNING *`,
    [email, purpose, codeHash, payload ? JSON.stringify(payload) : null, String(ttlMinutes)]
  );
  return rows[0];
}

export async function updatePayload(id, payload) {
  await pool.query('UPDATE email_codes SET payload = $2 WHERE id = $1', [id, JSON.stringify(payload)]);
}

export async function bumpAttempts(id) {
  const { rows } = await pool.query('UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts', [id]);
  return rows[0]?.attempts ?? 0;
}

/** Mark a reset code as proven and hand out a short-lived token for the final "set password" step. */
export async function markVerified(id, tokenHash, ttlMinutes = 15) {
  await pool.query(
    `UPDATE email_codes SET verified_token_hash = $2, expires_at = NOW() + ($3 || ' minutes')::interval WHERE id = $1`,
    [id, tokenHash, String(ttlMinutes)]
  );
}

export async function deleteCode(id) {
  await pool.query('DELETE FROM email_codes WHERE id = $1', [id]);
}

/** Housekeeping: drop rows that expired more than a day ago. */
export async function purgeExpired() {
  await pool.query(`DELETE FROM email_codes WHERE expires_at < NOW() - INTERVAL '1 day'`);
}
