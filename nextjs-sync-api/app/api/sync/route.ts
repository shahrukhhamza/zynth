import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TradeInput {
  // Python script sends: ticket, symbol, profit, volume, time, type
  // Legacy fields also accepted: ticket_id, entry_time, exit_time
  ticket?:    number | string;
  ticket_id?: number | string;
  symbol:     string;
  profit:     number | string;
  volume:     number | string;
  time?:      string;   // exit time from Python script
  exit_time?: string;
  entry_time?: string;
  type?:      number;
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidISODate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime());
}

/** Returns a human-readable error message or null if the trade is valid. */
function validateTrade(t: unknown, index: number): string | null {
  if (!t || typeof t !== 'object') return `trades[${index}] must be an object.`;
  const trade = t as Record<string, unknown>;

  const ticketVal = trade.ticket ?? trade.ticket_id;
  if (!ticketVal || isNaN(Number(ticketVal))) {
    return `trades[${index}].ticket must be a positive integer.`;
  }
  if (typeof trade.symbol !== 'string' || !trade.symbol.trim()) {
    return `trades[${index}].symbol must be a non-empty string.`;
  }
  if (isNaN(Number(trade.profit))) {
    return `trades[${index}].profit must be numeric.`;
  }
  if (isNaN(Number(trade.volume)) || Number(trade.volume) <= 0) {
    return `trades[${index}].volume must be a positive number.`;
  }

  // time / exit_time must be a valid date; entry_time is optional
  const exitTimeVal = trade.time ?? trade.exit_time;
  if (!exitTimeVal || !isValidISODate(exitTimeVal)) {
    return `trades[${index}].time must be a valid ISO 8601 timestamp.`;
  }

  return null;
}

// ── POST /api/sync ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Authorise ──────────────────────────────────────────────────────────
  const secret = process.env.SYNC_API_SECRET ?? 'Zynth_Alpha_770';

  const authHeader = req.headers.get('authorization') ?? '';

  // Accept both bare secret and "Bearer <secret>"
  const authorised =
    authHeader === secret || authHeader === `Bearer ${secret}`;

  if (!authorised) {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    console.warn('[sync] 401 Unauthorized — IP: %s  header: %s', ip, authHeader.slice(0, 20));
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { trades?: unknown; user_id?: unknown };

  try {
    body = (await req.json()) as { trades?: unknown; user_id?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'Request body is not valid JSON.' },
      { status: 400 },
    );
  }

  // ── 3. Validate top-level structure ───────────────────────────────────────
  if (!Array.isArray(body?.trades)) {
    return NextResponse.json(
      { error: 'Request body must include a "trades" array.' },
      { status: 400 },
    );
  }

  if (body.trades.length === 0) {
    return NextResponse.json(
      { synced: 0, total_received: 0, message: 'Empty trades array — nothing to sync.' },
    );
  }

  if (body.trades.length > 500) {
    return NextResponse.json(
      { error: 'Batch too large: maximum 500 trades per request.' },
      { status: 422 },
    );
  }

  // ── 4. Validate each trade object ────────────────────────────────────────
  for (let i = 0; i < body.trades.length; i++) {
    const err = validateTrade(body.trades[i], i);
    if (err) return NextResponse.json({ error: err }, { status: 422 });
  }

  const incoming = body.trades as TradeInput[];

  // ── 5. Upsert into PostgreSQL via Prisma ──────────────────────────────────
  let result: Prisma.BatchPayload;

  try {
    result = await prisma.trade.createMany({
      data: incoming.map((t) => {
        const exitTime  = new Date((t.time ?? t.exit_time) as string);
        const entryTime = t.entry_time ? new Date(t.entry_time) : exitTime;
        return {
          ticketId:  BigInt(String(t.ticket ?? t.ticket_id)),
          symbol:    String(t.symbol).trim().toUpperCase(),
          profit:    new Prisma.Decimal(t.profit),
          volume:    new Prisma.Decimal(t.volume),
          entryTime,
          exitTime,
        };
      }),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error('[sync] Database write error:', err);
    return NextResponse.json(
      { error: 'Database write failed. Check server logs.' },
      { status: 500 },
    );
  }

  const duplicates = incoming.length - result.count;
  console.log(
    '[sync] %d received — %d new, %d duplicate(s) skipped.',
    incoming.length, result.count, duplicates,
  );

  // ── 6. Respond ────────────────────────────────────────────────────────────
  return NextResponse.json({
    synced:             result.count,
    total_received:     incoming.length,
    duplicates_skipped: duplicates,
  });
}


// ── Validation helpers ────────────────────────────────────────────────────────

function isValidISODate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime());
}

function isPositiveIntegerString(value: unknown): boolean {
  return typeof value === 'string'
    ? /^\d+$/.test(value.trim())
    : typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Returns a human-readable error message or null if the trade is valid. */
function validateTrade(t: unknown, index: number): string | null {
  if (!t || typeof t !== 'object') {
    return `trades[${index}] must be an object.`;
  }

  const trade = t as Record<string, unknown>;

  if (!isPositiveIntegerString(trade.ticket_id)) {
    return `trades[${index}].ticket_id must be a positive integer.`;
  }
  if (typeof trade.symbol !== 'string' || !trade.symbol.trim()) {
    return `trades[${index}].symbol must be a non-empty string.`;
  }
  if (isNaN(Number(trade.profit))) {
    return `trades[${index}].profit must be numeric.`;
  }
  if (isNaN(Number(trade.volume)) || Number(trade.volume) <= 0) {
    return `trades[${index}].volume must be a positive number.`;
  }
  if (!isValidISODate(trade.entry_time)) {
    return `trades[${index}].entry_time must be a valid ISO 8601 timestamp.`;
  }
  if (!isValidISODate(trade.exit_time)) {
    return `trades[${index}].exit_time must be a valid ISO 8601 timestamp.`;
  }

  return null;
}

// ── POST /api/sync ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Authorise ──────────────────────────────────────────────────────────
  const apiSecret = process.env.SYNC_API_SECRET;

  if (!apiSecret) {
    // Fail loudly rather than silently accepting every request
    console.error('[sync] SYNC_API_SECRET is not configured — refusing all requests.');
    return NextResponse.json(
      { error: 'Server misconfiguration: missing SYNC_API_SECRET.' },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get('authorization') ?? '';

  if (authHeader !== `Bearer ${apiSecret}`) {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    console.warn('[sync] 401 Unauthorized — IP: %s', ip);
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { trades?: unknown };

  try {
    body = (await req.json()) as { trades?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'Request body is not valid JSON.' },
      { status: 400 },
    );
  }

  // ── 3. Validate top-level structure ───────────────────────────────────────
  if (!Array.isArray(body?.trades)) {
    return NextResponse.json(
      { error: 'Request body must include a "trades" array.' },
      { status: 400 },
    );
  }

  if (body.trades.length === 0) {
    return NextResponse.json(
      { synced: 0, total_received: 0, message: 'Empty trades array — nothing to sync.' },
      { status: 200 },
    );
  }

  if (body.trades.length > 500) {
    return NextResponse.json(
      { error: 'Batch too large: maximum 500 trades per request.' },
      { status: 422 },
    );
  }

  // ── 4. Validate each trade object ────────────────────────────────────────
  for (let i = 0; i < body.trades.length; i++) {
    const validationError = validateTrade(body.trades[i], i);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }
  }

  const incoming = body.trades as TradeInput[];

  // ── 5. Upsert into PostgreSQL ──────────────────────────────────────────────
  // createMany + skipDuplicates: existing ticketIds are silently ignored and
  // result.count reflects only the rows actually inserted (new trades).
  let result: Prisma.BatchPayload;

  try {
    result = await prisma.trade.createMany({
      data: incoming.map((t) => ({
        ticketId:  BigInt(t.ticket_id),
        symbol:    String(t.symbol).trim().toUpperCase(),
        profit:    new Prisma.Decimal(t.profit),
        volume:    new Prisma.Decimal(t.volume),
        entryTime: new Date(t.entry_time),
        exitTime:  new Date(t.exit_time),
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error('[sync] Database write error:', err);
    return NextResponse.json(
      { error: 'Database write failed. Check server logs.' },
      { status: 500 },
    );
  }

  const duplicates = incoming.length - result.count;
  console.log(
    '[sync] %d received — %d new, %d duplicate(s) skipped.',
    incoming.length,
    result.count,
    duplicates,
  );

  // ── 6. Respond ────────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      synced:         result.count,
      total_received: incoming.length,
      duplicates_skipped: duplicates,
    },
    { status: 200 },
  );
}
