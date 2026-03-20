/**
 * POST /api/sync
 * ──────────────
 * Receives MT5 deals from the local Python trade_sync.py script and inserts
 * them into the existing 'trades' table used by the Trade Journal.
 *
 * Authentication: expects the header  Authorization: Zynth_Alpha_770
 * (set via SYNC_API_SECRET env var on Railway).
 *
 * Payload shape:
 *   {
 *     "user_id": 1,          // optional — Railway user id (integer)
 *     "trades": [
 *       {
 *         "ticket": 123456,
 *         "symbol": "EURUSD",
 *         "volume": 0.1,
 *         "profit": 12.50,
 *         "time":   "2026-03-20T14:00:00+00:00",
 *         "type":   1
 *       }, …
 *     ]
 *   }
 */

import { Router }  from 'express';
import { getDb }   from '../services/journalDb.js';

const router = Router();

// ── Secret ────────────────────────────────────────────────────────────────────
const SYNC_API_SECRET = process.env.SYNC_API_SECRET || 'Zynth_Alpha_770';

// ── POST /api/sync ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  // 1. Auth check — header must equal SYNC_API_SECRET exactly
  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== SYNC_API_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized — invalid or missing Authorization header.',
    });
  }

  const { trades, user_id } = req.body ?? {};

  if (!Array.isArray(trades) || trades.length === 0) {
    return res.status(400).json({ success: false, error: 'trades array is required and must not be empty.' });
  }

  // Resolve user_id — fallback to 'default' used by the journal for accounts
  // without a real login (demo / single-user installs)
  const resolvedUserId = user_id ?? 'default';

  // 2. Ensure the mt5_ticket column exists (safe to run repeatedly)
  const db = getDb();
  try {
    await db.query(`
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS mt5_ticket BIGINT UNIQUE;
    `);
  } catch (_) { /* column already there — ignore */ }

  let inserted = 0;
  let skipped  = 0;
  const errors = [];

  // 3. Insert each deal
  for (const t of trades) {
    const ticket = Number(t.ticket ?? t.ticket_id);
    const symbol = String(t.symbol ?? '').trim();
    const profit = parseFloat(t.profit ?? 0);
    const volume = parseFloat(t.volume ?? 0);
    const exitTime = t.time ?? t.exit_time ?? null;

    // Basic validation
    if (!ticket || !symbol) {
      errors.push({ ticket, reason: 'ticket and symbol are required' });
      continue;
    }

    try {
      const { rowCount } = await db.query(
        `INSERT INTO trades
           (user_id, pair, direction, position_size, profit_loss, mt5_ticket, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (mt5_ticket) DO NOTHING`,
        [
          resolvedUserId,
          symbol,
          profit >= 0 ? 'LONG' : 'SHORT',   // infer direction from profit sign
          volume,
          profit,
          ticket,
          exitTime ? new Date(exitTime) : new Date(),
        ]
      );

      if (rowCount > 0) inserted++;
      else              skipped++;
    } catch (err) {
      errors.push({ ticket, reason: err.message });
    }
  }

  return res.json({
    success: true,
    inserted,
    skipped_duplicates: skipped,
    errors: errors.length ? errors : undefined,
    total_received: trades.length,
  });
});

export default router;
