/**
 * POST /api/webhook/metaapi
 * ─────────────────────────
 * Receives real-time trade events from MetaApi and inserts completed
 * trades into the user's journal (trades table).
 *
 * MetaApi sends a JSON body with one of these event types:
 *   • type: "DEAL_ADDED"    — a new history deal (position closed)
 *   • type: "POSITION_UPDATED" with state "CLOSED" — position closed event
 *
 * Security: MetaApi signs requests with a shared secret in
 *   Authorization: Bearer <METAAPI_WEBHOOK_SECRET>
 *
 * Env:
 *   METAAPI_WEBHOOK_SECRET — set the same value in your MetaApi webhook config
 */
import { Router }              from 'express';
import { getMtAccountByMetaId } from '../db/users.js';
import { insertTrade }          from '../services/journalDb.js';

const router = Router();

// Raw body is needed before express.json() touches it; server.js mounts this
// router BEFORE the json middleware, so req.body is already parsed by the
// outer express.json() — MetaApi sends application/json.

// ── Signature / Auth guard ────────────────────────────────────────────────────
function verifyWebhookSecret(req, res, next) {
  const secret = process.env.METAAPI_WEBHOOK_SECRET;
  if (!secret) {
    // No secret configured → accept (dev mode only, log a warning)
    console.warn('[webhook/metaapi] METAAPI_WEBHOOK_SECRET not set — accepting unauthenticated requests.');
    return next();
  }
  const auth = req.headers['authorization'] ?? '';
  if (auth !== `Bearer ${secret}`) {
    console.warn('[webhook/metaapi] Rejected unauthorized webhook call from IP:', req.ip);
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map a MetaApi deal object to journalDb.insertTrade() shape.
 * MetaApi deal fields: https://metaapi.cloud/docs/client/websocket/api/trade/
 */
function dealToTradeRow(deal, userId) {
  const direction = (deal.type === 'DEAL_TYPE_BUY') ? 'BUY' : 'SELL';
  const profit    = typeof deal.profit === 'number' ? deal.profit : parseFloat(deal.profit ?? 0);
  const outcome   = profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven';

  return {
    user_id:       userId,
    pair:          deal.symbol ?? '',
    direction,
    position_size: deal.volume  ?? null,
    entry_price:   deal.openPrice ?? null,
    exit_price:    deal.price    ?? null,
    tp:            deal.takeProfit ?? null,
    sl:            deal.stopLoss  ?? null,
    outcome,
    profit_loss:   profit,
    session:       null,         // could derive from time if needed
    screenshot_path: null,
  };
}

// ── Event type detectors ──────────────────────────────────────────────────────

function isClosedDeal(body) {
  // History deal: position-closing deal with P&L
  return (
    body?.type === 'DEAL_ADDED' &&
    body?.deal?.entryType === 'DEAL_ENTRY_OUT' &&
    typeof body?.deal?.profit === 'number'
  );
}

function isClosedPosition(body) {
  // Real-time position event: state flipped to CLOSED
  return (
    body?.type === 'POSITION_UPDATED' &&
    (body?.position?.state === 'CLOSED' || body?.position?.currentPrice != null) &&
    body?.position?.profit != null
  );
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post('/', verifyWebhookSecret, async (req, res) => {
  const body = req.body;

  // MetaApi always includes the accountId of the source account
  const metaApiAccountId = body?.accountId ?? body?.account?.id;
  if (!metaApiAccountId) {
    // Ping / unrecognised format — acknowledge and ignore
    return res.json({ received: true });
  }

  try {
    // ── Resolve owning user ──────────────────────────────────────────────
    const accountRow = await getMtAccountByMetaId(metaApiAccountId);
    if (!accountRow) {
      console.warn('[webhook/metaapi] Received event for unknown accountId:', metaApiAccountId);
      return res.json({ received: true });
    }
    const userId = accountRow.user_id;

    // ── Handle DEAL_ADDED (history deal / closed trade) ──────────────────
    if (isClosedDeal(body)) {
      const tradeRow = dealToTradeRow(body.deal, userId);
      const tradeId  = await insertTrade(tradeRow);
      console.log(
        '[webhook/metaapi] Trade saved — userId:%d  symbol:%s  profit:%s  tradeId:%d',
        userId, tradeRow.pair, tradeRow.profit_loss, tradeId
      );
      return res.json({ received: true, tradeId });
    }

    // ── Handle POSITION_UPDATED with state=CLOSED ────────────────────────
    if (isClosedPosition(body)) {
      const pos = body.position;
      const deal = {
        symbol:     pos.symbol,
        type:       pos.type,           // 'POSITION_TYPE_BUY' → map to direction
        volume:     pos.volume,
        openPrice:  pos.openPrice,
        price:      pos.currentPrice,
        takeProfit: pos.takeProfit,
        stopLoss:   pos.stopLoss,
        profit:     pos.profit,
      };
      // Normalise position type → deal type for dealToTradeRow()
      deal.type = deal.type?.includes('BUY') ? 'DEAL_TYPE_BUY' : 'DEAL_TYPE_SELL';

      const tradeRow = dealToTradeRow(deal, userId);
      const tradeId  = await insertTrade(tradeRow);
      console.log(
        '[webhook/metaapi] Position closed → trade saved — userId:%d  symbol:%s  profit:%s  tradeId:%d',
        userId, tradeRow.pair, tradeRow.profit_loss, tradeId
      );
      return res.json({ received: true, tradeId });
    }

    // ── Unhandled event type — acknowledge without processing ────────────
    return res.json({ received: true });

  } catch (err) {
    console.error('[webhook/metaapi] Handler error:', err.message, err.stack);
    // Always return 200 to prevent MetaApi from retrying endlessly
    return res.json({ received: true, error: 'Internal processing error.' });
  }
});

export default router;
