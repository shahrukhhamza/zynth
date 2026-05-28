import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Auth and all database-backed features will fail.');
}

// Railway injects DATABASE_URL automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Test connection on startup (non-fatal — initDb() will surface real errors)
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });

// ── Create tables + migrate ───────────────────────────────────────────────────
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                   SERIAL PRIMARY KEY,
      name                 TEXT    NOT NULL,
      email                TEXT    UNIQUE NOT NULL,
      password_hash        TEXT,
      google_id            TEXT    UNIQUE,
      avatar               TEXT,
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      plan                 TEXT    DEFAULT 'free',
      plan_expires_at      TIMESTAMPTZ DEFAULT NULL,
      ai_analysis_tries    INTEGER DEFAULT 0,
      screenshot_tries     INTEGER DEFAULT 0,
      is_admin             INTEGER DEFAULT 0,
      reset_token          TEXT    DEFAULT NULL,
      reset_token_expires  TIMESTAMPTZ DEFAULT NULL,
      trading_experience   TEXT    DEFAULT NULL,
      markets_traded       TEXT    DEFAULT NULL,
      goals                TEXT    DEFAULT NULL,
      avatar_color         TEXT    DEFAULT 'emerald',
      onboarding_done      INTEGER DEFAULT 0,
      avatar_url           TEXT    DEFAULT NULL,
      terms_accepted       INTEGER DEFAULT 0,
      terms_accepted_at    TIMESTAMPTZ DEFAULT NULL
    )
  `);

  // Safe column migrations — ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+)
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_analysis_tries INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS screenshot_tries INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_experience TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS markets_traded TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS goals TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT 'emerald'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL`,
    // Monthly AI tracking for Pro plan
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_monthly_count INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_month_reset TIMESTAMPTZ DEFAULT NOW()`,
    // Subscription audit fields — set when a payment is verified
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start  TIMESTAMPTZ DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_active INTEGER     DEFAULT 0`,
  ];

  for (const sql of migrations) {
    try { await pool.query(sql); } catch { /* column already exists */ }
  }

  console.log('✅ Database schema ready');
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, email, avatar, created_at, plan, plan_expires_at,
            ai_analysis_tries, screenshot_tries, is_admin, trading_experience,
            markets_traded, goals, avatar_color, onboarding_done, avatar_url,
            terms_accepted, terms_accepted_at, ai_monthly_count, ai_month_reset
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findByGoogleId(googleId) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return rows[0] ?? null;
}

export async function createUser({
  name,
  email,
  password_hash = null,
  google_id = null,
  avatar = null,
  terms_accepted = 0,
  terms_accepted_at = null,
}) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, google_id, avatar, terms_accepted, terms_accepted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [name, email.toLowerCase().trim(), password_hash, google_id, avatar, terms_accepted, terms_accepted_at]
  );
  return rows[0]; // { id }
}

export async function linkGoogleId(id, google_id, avatar) {
  await pool.query(
    'UPDATE users SET google_id = $1, avatar = $2 WHERE id = $3',
    [google_id, avatar, id]
  );
}

export async function updateUserPlan(id, plan, expiresAt = null) {
  const normalizedPlan = String(plan || 'free').trim().toLowerCase();
  await pool.query(
    'UPDATE users SET plan = $1, plan_expires_at = $2 WHERE id = $3',
    [normalizedPlan, expiresAt, id]
  );
}

/**
 * Atomically activate a user's subscription after payment is verified.
 * Sets plan, expiry, subscription start date, and marks the account active.
 * Only called when payment status transitions to 'verified'.
 */
export async function activateUserSubscription(id, plan, expiresAt) {
  const normalizedPlan = String(plan || 'pro').trim().toLowerCase();
  await pool.query(
    `UPDATE users
     SET plan                = $1,
         plan_expires_at     = $2,
         subscription_start  = NOW(),
         subscription_active = 1
     WHERE id = $3`,
    [normalizedPlan, expiresAt, id],
  );
}

export async function incrementAiTries(id) {
  await pool.query(
    'UPDATE users SET ai_analysis_tries = ai_analysis_tries + 1 WHERE id = $1',
    [id]
  );
}

/**
 * Increment the monthly AI counter for Pro users.
 * Automatically resets the count when a new calendar month begins.
 */
export async function incrementMonthlyAiCount(id) {
  const now = new Date();
  const { rows } = await pool.query(
    'SELECT ai_monthly_count, ai_month_reset FROM users WHERE id = $1',
    [id]
  );
  if (!rows[0]) return;
  const lastReset = rows[0].ai_month_reset ? new Date(rows[0].ai_month_reset) : null;
  const sameMonth = lastReset &&
    lastReset.getFullYear() === now.getFullYear() &&
    lastReset.getMonth()    === now.getMonth();
  if (!sameMonth) {
    // New month — reset counter and mark reset time
    await pool.query(
      'UPDATE users SET ai_monthly_count = 1, ai_month_reset = $1 WHERE id = $2',
      [now.toISOString(), id]
    );
  } else {
    await pool.query(
      'UPDATE users SET ai_monthly_count = ai_monthly_count + 1 WHERE id = $1',
      [id]
    );
  }
}

/**
 * Returns the current monthly AI count for a user, resetting if the month rolled over.
 */
export async function getMonthlyAiCount(id) {
  const now = new Date();
  const { rows } = await pool.query(
    'SELECT ai_monthly_count, ai_month_reset FROM users WHERE id = $1',
    [id]
  );
  if (!rows[0]) return 0;
  const lastReset = rows[0].ai_month_reset ? new Date(rows[0].ai_month_reset) : null;
  const sameMonth = lastReset &&
    lastReset.getFullYear() === now.getFullYear() &&
    lastReset.getMonth()    === now.getMonth();
  if (!sameMonth) {
    // Stale — reset silently and report 0
    await pool.query(
      'UPDATE users SET ai_monthly_count = 0, ai_month_reset = $1 WHERE id = $2',
      [now.toISOString(), id]
    );
    return 0;
  }
  return rows[0].ai_monthly_count ?? 0;
}

export async function setAdmin(id, isAdmin) {
  await pool.query(
    'UPDATE users SET is_admin = $1 WHERE id = $2',
    [isAdmin ? 1 : 0, id]
  );
}

export async function findAll() {
  const { rows } = await pool.query(
    `SELECT id, name, email, plan, plan_expires_at, is_admin, created_at,
            ai_analysis_tries, screenshot_tries
     FROM users ORDER BY created_at DESC`
  );
  return rows;
}

export async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

export async function resetTries(id) {
  await pool.query(
    'UPDATE users SET ai_analysis_tries = 0, screenshot_tries = 0 WHERE id = $1',
    [id]
  );
}

export async function setResetToken(email, token, expires) {
  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
    [token, expires, email.toLowerCase().trim()]
  );
}

export async function findByResetToken(token) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE reset_token = $1',
    [token]
  );
  return rows[0] ?? null;
}

export async function clearResetToken(id) {
  await pool.query(
    'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
    [id]
  );
}

export async function setPassword(id, password_hash) {
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [password_hash, id]
  );
}

export async function updateProfile(id, { trading_experience, markets_traded, goals, avatar_color }) {
  await pool.query(
    `UPDATE users
     SET trading_experience = $1, markets_traded = $2, goals = $3, avatar_color = $4
     WHERE id = $5`,
    [trading_experience, markets_traded, goals, avatar_color, id]
  );
}

export async function updateName(id, name) {
  await pool.query(
    'UPDATE users SET name = $1 WHERE id = $2',
    [name, id]
  );
}

export async function updateAvatarUrl(id, avatar_url) {
  await pool.query(
    'UPDATE users SET avatar_url = $1 WHERE id = $2',
    [avatar_url, id]
  );
}

export async function setOnboardingDone(id) {
  await pool.query(
    'UPDATE users SET onboarding_done = 1 WHERE id = $1',
    [id]
  );
}

export default pool;
