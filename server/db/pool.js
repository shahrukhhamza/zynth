/**
 * Single shared PostgreSQL pool for the whole backend.
 *
 * Works with any Postgres, tuned for Supabase:
 *  - SSL is switched on automatically for every non-local host (Supabase requires it, also from a
 *    developer laptop), and left off for localhost.
 *  - A small pool (DB_POOL_MAX, default 8). The app used to open four pools of 10 connections each,
 *    which exhausts the limits of Supabase's pooler on the free tier.
 *  - Use Supabase's *pooler* connection string (Project Settings → Database → Connection string →
 *    "Session pooler"): the direct db.<ref>.supabase.co host is IPv6-only and fails on most hosts.
 */
import pg from 'pg';

const { Pool } = pg;

const url = process.env.DATABASE_URL || '';
const isLocalHost = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);
const sslDisabledInUrl = /sslmode=disable/i.test(url);

if (!url) {
  console.error('❌ DATABASE_URL is not set. Auth and all database-backed features will fail.');
}

const pool = new Pool({
  connectionString: url || undefined,
  ssl: !url || isLocalHost || sslDisabledInUrl ? false : { rejectUnauthorized: false },
  max: Math.max(2, parseInt(process.env.DB_POOL_MAX, 10) || 8),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// The pooler closes idle connections from its side. Without a handler, pg re-emits that as an
// unhandled 'error' event and the whole process crashes.
pool.on('error', (err) => {
  console.error('[db] idle client error (connection will be replaced):', err.message);
});

export default pool;

/**
 * Tables the app creates itself. Supabase exposes everything in the `public` schema through its
 * REST API; turning on Row Level Security with no policies makes those tables unreachable through
 * that API (anon / authenticated roles), while this backend — which connects as the table owner —
 * is unaffected.
 */
const APP_TABLES = [
  'users', 'user_events', 'payment_requests',
  'trades', 'trade_journals', 'performance_reports', 'checklist',
  'macro_snapshots', 'dna_reports', 'levels', 'email_codes',
];

export async function secureSchema() {
  for (const table of APP_TABLES) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY`);
    } catch (err) {
      console.warn(`[db] could not enable RLS on ${table}:`, err.message);
    }
  }
}

/** Cheap liveness probe used by the health endpoint (also keeps a free Supabase project awake). */
export async function pingDb() {
  const started = Date.now();
  await pool.query('SELECT 1');
  return Date.now() - started;
}
