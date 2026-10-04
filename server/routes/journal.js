/**
 * journal.js — REST API routes for the AI Trading Journal
 *
 * POST   /api/journal/trades          create trade (+ optional screenshot)
 * GET    /api/journal/trades          list trades (paginated)
 * GET    /api/journal/trades/:id      single trade
 * PUT    /api/journal/trades/:id      update trade + journal fields
 * DELETE /api/journal/trades/:id      delete trade
 * POST   /api/journal/trades/:id/analyze   trigger AI journal analysis
 * GET    /api/journal/analytics       performance metrics
 * GET    /api/journal/reports         list saved reports
 * POST   /api/journal/reports         generate + save a new report
 */

import { Router } from 'express';
import multer from 'multer';
import { requireAuth, checkAiTries, requirePro } from '../middleware/authMiddleware.js';
import * as Users from '../db/users.js';
import { trackEvent } from '../db/events.js';
import {
  insertTrade, getTrades, getTradeById, updateTrade, deleteTrade, countTrades,
  getTradesBySymbol, countTradesBySymbol,
  upsertJournal, setJournalAiAnalysis, setMacroContext,
  getAllTradesForUser, insertReport, getReports,
} from '../services/journalDb.js';
import { calcMetrics } from '../services/analyticsService.js';
import { analyzeJournalEntry, generatePerformanceReport } from '../services/journalAiService.js';
import { saveJournalScreenshot } from '../services/fileStorageService.js';
import { getMacroContextForTrade, getMacroAlignmentStats } from '../services/macroAlignmentService.js';

// ── Multer config ─────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Helper: extract user_id from JWT or default
function getUserId(req) {
  return req.user?.userId || req.user?.id || 'default';
}

// Must match PLANS_CONFIG.free.maxJournalEntries on the client (shown in the UI, pricing and Help).
const FREE_JOURNAL_LIMIT = 5;

/** Free users: max 5 journal entries in total (deleting one frees a slot). Pro/Elite/Admin: unlimited. */
async function checkJournalLimit(req, res, next) {
  const { plan, is_admin } = req.user || {};
  if (is_admin === 1 || plan === 'pro' || plan === 'elite') return next();
  const count = await countTrades(getUserId(req));
  if (count >= FREE_JOURNAL_LIMIT) {
    trackEvent(req.user?.id, 'journal_limit_hit', { count, plan: plan ?? 'free' });
    return res.status(403).json({ error: 'journal_limit_reached', limit: FREE_JOURNAL_LIMIT, upgrade: true });
  }
  next();
}

// ── Input helpers ─────────────────────────────────────────────────────────────
const DIRECTIONS = new Set(['buy', 'sell']);
const OUTCOMES   = new Set(['win', 'loss', 'breakeven']);
const NUMERIC_TRADE_FIELDS = ['position_size', 'entry_price', 'exit_price', 'tp', 'sl', 'profit_loss'];

/** '' / null / undefined -> null; a finite number -> number; anything else -> NaN (caller rejects). */
function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseId(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Returns an error message if any provided trade field is malformed, otherwise null. */
function validateTradeInput(body, { partial }) {
  for (const key of NUMERIC_TRADE_FIELDS) {
    if (body[key] !== undefined && Number.isNaN(toNumberOrNull(body[key]))) return `${key} must be a number`;
  }
  if (body.pair !== undefined && (typeof body.pair !== 'string' || !body.pair.trim() || body.pair.length > 30)) {
    return 'pair must be a non-empty string (max 30 chars)';
  }
  if (body.direction !== undefined && !DIRECTIONS.has(String(body.direction).toLowerCase())) {
    return 'direction must be "buy" or "sell"';
  }
  if (body.outcome !== undefined && body.outcome !== '' && !OUTCOMES.has(String(body.outcome).toLowerCase())) {
    return 'outcome must be "win", "loss" or "breakeven"';
  }
  if (!partial && (!body.pair || !body.direction)) return 'pair and direction are required';
  return null;
}

const router = Router();

// All journal routes require authentication
router.use(requireAuth);

// ── POST /trades ──────────────────────────────────────────────────────────────
router.post('/trades', checkJournalLimit, upload.single('screenshot'), async (req, res) => {
  try {
    const body = req.body;
    const userId = getUserId(req);

    const invalid = validateTradeInput(body, { partial: false });
    if (invalid) return res.status(400).json({ success: false, error: invalid });

    const screenshotPath = req.file
      ? await saveJournalScreenshot(userId, req.file)
      : null;

    const outcome = body.outcome ? String(body.outcome).toLowerCase() : null;
    const tradeData = {
      user_id:       userId,
      pair:          body.pair.trim().toUpperCase(),
      direction:     String(body.direction).toLowerCase(),
      position_size: toNumberOrNull(body.position_size),
      entry_price:   toNumberOrNull(body.entry_price),
      exit_price:    toNumberOrNull(body.exit_price),
      tp:            toNumberOrNull(body.tp),
      sl:            toNumberOrNull(body.sl),
      outcome,
      profit_loss:   (() => {
        const raw = toNumberOrNull(body.profit_loss);
        if (raw == null) return null;
        if (outcome === 'loss') return -Math.abs(raw);
        if (outcome === 'win')  return  Math.abs(raw);
        return raw; // breakeven or unset: keep as-is
      })(),
      session:       body.session ? String(body.session).slice(0, 50) : null,
      screenshot_path: screenshotPath,
    };

    const tradeId = await insertTrade(tradeData);

    // Upsert journal fields if any are provided
    const journalFields = ['strategy', 'reasoning', 'emotional_state', 'lessons_learned', 'notes'];
    const hasJournal = journalFields.some(k => body[k]);
    if (hasJournal) {
      const jData = {};
      journalFields.forEach(k => { if (body[k]) jData[k] = body[k]; });
      await upsertJournal(tradeId, jData);
    }

    const trade = await getTradeById(tradeId);
    trackEvent(getUserId(req), 'trade_added', { pair: tradeData.pair, direction: tradeData.direction });
    res.status(201).json({ success: true, data: trade });
  } catch (err) {
    console.error('POST /journal/trades error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /trades ───────────────────────────────────────────────────────────────
router.get('/trades', async (req, res) => {
  try {
    const userId = getUserId(req);
    const page   = Math.max(0, parseInt(req.query.page)  || 0);
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const symbol = req.query.symbol ? String(req.query.symbol).trim() : null;
    const trades = symbol
      ? await getTradesBySymbol(userId, symbol, limit, page * limit)
      : await getTrades(userId, limit, page * limit);
    const total  = symbol
      ? await countTradesBySymbol(userId, symbol)
      : await countTrades(userId);
    res.json({ success: true, data: trades, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// -- GET /stats ---------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const userId = getUserId(req);
    const trades = await getAllTradesForUser(userId);
    const metrics = calcMetrics(trades);

    res.json({
      total: trades.length,
      total_trades: metrics.totalTrades,
      win_rate: metrics.winRate,
      total_pnl: metrics.netPnl,
      wins: metrics.wins,
      losses: metrics.losses,
      breakevens: metrics.breakevens,
    });
  } catch (err) {
    console.error('GET /journal/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch journal stats.' });
  }
});

// ── POST /trades/chart-analysis ────────────────────────────────────────────────
router.post('/trades/chart-analysis', requireAuth, checkAiTries, async (req, res) => {
  try {
    const { symbol, trades } = req.body;
    if (!symbol || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ success: false, error: 'symbol and trades[] required' });
    }

    const key = process.env.GEMINI_API_KEY;
    const aiEnabled = process.env.USE_GEMINI_AI !== 'false';
    if (!key || key === 'demo' || !aiEnabled) {
      return res.status(503).json({ success: false, error: 'AI analysis is currently unavailable. Check your GEMINI_API_KEY configuration.' });
    }

    const tradesSummary = trades.slice(0, 20).map((t, i) => {
      const outcome = t.outcome ? t.outcome.toUpperCase() : 'OPEN';
      const pnl = t.profit_loss != null ? ` | P&L: ${t.profit_loss}` : '';
      const ep = t.entry_price != null ? ` @ ${t.entry_price}` : '';
      const xp = t.exit_price  != null ? ` → ${t.exit_price}` : '';
      const dt = t.created_at  ? ` [${new Date(t.created_at).toLocaleDateString()}]` : '';
      return `${i+1}. ${(t.direction||'?').toUpperCase()}${ep}${xp} | ${outcome}${pnl}${dt}`;
    }).join('\n');

    const wins   = trades.filter(t => t.outcome === 'win').length;
    const losses = trades.filter(t => t.outcome === 'loss').length;
    const open   = trades.filter(t => !t.outcome || t.outcome === '').length;
    const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.profit_loss) || 0), 0);

    const prompt = `You are an expert trading coach analyzing a trader's trade history on ${symbol}.

SUMMARY: ${trades.length} trades — ${wins} wins, ${losses} losses, ${open} open. Net P&L: ${totalPnl.toFixed(2)}

TRADE LIST (most recent first):
${tradesSummary}

Provide a concise pattern analysis (4-6 bullet points max). Focus on:
- Entry/exit timing patterns
- Win/loss streaks and what precedes them
- Risk management observations
- One actionable improvement suggestion

Be direct, specific, and data-driven. No generic advice. Format as plain text with bullet points starting with •.`;

    const axios = (await import('axios')).default;
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const gemRes = await axios.post(
      geminiUrl,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { thinkingConfig: { thinkingBudget: 0 },  temperature: 0.7, maxOutputTokens: 1024 } },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, timeout: 30000 }
    );
    const analysis = gemRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analysis) return res.status(500).json({ success: false, error: 'Empty AI response' });

    // Record the AI usage against the correct counter
    const plan = String(req.user?.plan ?? 'free').toLowerCase();
    if (plan === 'pro') {
      await Users.incrementMonthlyAiCount(req.user.id);
    } else if (plan !== 'elite' && req.user?.is_admin !== 1) {
      await Users.incrementAiTries(req.user.id);
    }

    res.json({ success: true, analysis, symbol, tradeCount: trades.length });
  } catch (err) {
    console.error('chart-analysis error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /trades/:id ───────────────────────────────────────────────────────────
router.get('/trades/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid trade id' });
    const trade = await getTradeById(id);
    if (!trade) return res.status(404).json({ success: false, error: 'Trade not found' });
    if (String(trade.user_id) !== String(getUserId(req))) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    res.json({ success: true, data: trade });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── PUT /trades/:id ───────────────────────────────────────────────────────────
router.put('/trades/:id', upload.single('screenshot'), async (req, res) => {
  try {
    const id   = parseId(req.params.id);
    const userId = getUserId(req);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid trade id' });

    // Ownership check
    const existing = await getTradeById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Trade not found' });
    if (String(existing.user_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const body = req.body;

    const invalid = validateTradeInput(body, { partial: true });
    if (invalid) return res.status(400).json({ success: false, error: invalid });

    const tradeFields = ['pair','direction','position_size','entry_price','exit_price','tp','sl','outcome','profit_loss','session'];
    const tradeUpdate = {};
    tradeFields.forEach(k => { if (body[k] !== undefined) tradeUpdate[k] = body[k]; });
    NUMERIC_TRADE_FIELDS.forEach(k => { if (k in tradeUpdate) tradeUpdate[k] = toNumberOrNull(tradeUpdate[k]); });
    if (tradeUpdate.direction !== undefined) tradeUpdate.direction = String(tradeUpdate.direction).toLowerCase();
    if (tradeUpdate.outcome !== undefined) tradeUpdate.outcome = tradeUpdate.outcome ? String(tradeUpdate.outcome).toLowerCase() : null;
    // Enforce P&L sign based on outcome (the stored outcome applies when it is not being changed)
    if (tradeUpdate.profit_loss != null) {
      const outcome = String(tradeUpdate.outcome ?? existing.outcome ?? '').toLowerCase();
      if (outcome === 'loss') tradeUpdate.profit_loss = -Math.abs(tradeUpdate.profit_loss);
      else if (outcome === 'win') tradeUpdate.profit_loss = Math.abs(tradeUpdate.profit_loss);
    }
    if (req.file) {
      tradeUpdate.screenshot_path = await saveJournalScreenshot(userId, req.file);
    }
    if (tradeUpdate.pair !== undefined) tradeUpdate.pair = tradeUpdate.pair.trim().toUpperCase();

    if (Object.keys(tradeUpdate).length) await updateTrade(id, tradeUpdate);

    const journalFields = ['strategy', 'reasoning', 'emotional_state', 'lessons_learned', 'notes'];
    const jData = {};
    journalFields.forEach(k => { if (body[k] !== undefined) jData[k] = body[k]; });
    if (Object.keys(jData).length) await upsertJournal(id, jData);

    const trade = await getTradeById(id);
    res.json({ success: true, data: trade });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── DELETE /trades/:id ────────────────────────────────────────────────────────
router.delete('/trades/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const tradeId = parseId(req.params.id);
    if (!tradeId) return res.status(400).json({ success: false, error: 'Invalid trade id' });
    const deleted = await deleteTrade(tradeId, userId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Trade not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── POST /trades/:id/analyze — AI journal analysis ────────────────────────────
router.post('/trades/:id/analyze', requireAuth, checkAiTries, async (req, res) => {
  try {
    const id    = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid trade id' });
    const trade = await getTradeById(id);
    if (!trade) return res.status(404).json({ success: false, error: 'Trade not found' });
    if (String(trade.user_id) !== String(getUserId(req))) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const analysis = await analyzeJournalEntry(trade, {
      strategy:       trade.strategy,
      reasoning:      trade.reasoning,
      emotional_state: trade.emotional_state,
      lessons_learned: trade.lessons_learned,
      notes:          trade.notes,
    });

    // Persist the analysis
    await upsertJournal(id, {}); // ensure journal row exists
    await setJournalAiAnalysis(id, analysis);

    // Record AI usage
    const plan = String(req.user?.plan ?? 'free').toLowerCase();
    if (plan === 'pro') {
      await Users.incrementMonthlyAiCount(req.user.id);
    } else if (plan !== 'elite' && req.user?.is_admin !== 1) {
      await Users.incrementAiTries(req.user.id);
    }

    trackEvent(req.user.id, 'ai_used', { trade_id: id, plan });

    res.json({ success: true, data: analysis });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /analytics ────────────────────────────────────────────────────────────
router.get('/analytics', requirePro, async (req, res) => {
  try {
    const userId = getUserId(req);
    const trades = await getAllTradesForUser(userId);
    const metrics = calcMetrics(trades);
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /reports ──────────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const userId = getUserId(req);
    const reports = (await getReports(userId, 20)).map(r => ({
      ...r,
      report_data: r.report_data ? JSON.parse(r.report_data) : null,
    }));
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── POST /reports — generate report (Pro/Elite only, counts as an AI try) ──────
router.post('/reports', requirePro, checkAiTries, async (req, res) => {
  try {
    const userId     = getUserId(req);
    const reportType = req.body.type || 'custom'; // weekly | monthly | custom

    const trades  = await getAllTradesForUser(userId);
    const metrics = calcMetrics(trades);

    const reportData = await generatePerformanceReport(metrics, trades, reportType);
    reportData.metrics = metrics; // embed raw metrics in report

    const id = await insertReport({
      user_id:     userId,
      report_type: reportType,
      report_data: JSON.stringify(reportData),
    });

    // Reports consume an AI try like every other AI feature (Pro: monthly quota)
    const reportPlan = String(req.user?.plan ?? 'free').toLowerCase();
    if (reportPlan === 'pro') {
      await Users.incrementMonthlyAiCount(req.user.id);
    } else if (reportPlan !== 'elite' && req.user?.is_admin !== 1) {
      await Users.incrementAiTries(req.user.id);
    }

    res.json({ success: true, data: { id, user_id: userId, report_type: reportType, created_at: new Date().toISOString(), report_data: reportData } });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /trades/:id/macro-context — Trade Context Report ──────────────────────
// No AI-try gate: event fetching is free; Gemini narrative is optional + lightweight.
router.get('/trades/:id/macro-context', async (req, res) => {
  try {
    const id    = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid trade id' });
    const trade = await getTradeById(id);
    if (!trade) return res.status(404).json({ success: false, error: 'Trade not found' });
    if (String(trade.user_id) !== String(getUserId(req))) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Return cached context if already analysed (unless ?refresh=1)
    if (trade.macro_alignment && !req.query.refresh) {
      let cachedEvents = [];
      try { cachedEvents = JSON.parse(trade.macro_events_json || '[]'); } catch (_) {}
      return res.json({
        success:  true,
        cached:   true,
        tradeDate:        (trade.created_at || '').slice(0, 10),
        events:           cachedEvents,
        eventCount:       cachedEvents.length,
        alignment:        trade.macro_alignment,
        narrative:        trade.macro_narrative || null,
        analysedAt:       trade.macro_analysed_at,
      });
    }

    // Compute fresh context
    const context = await getMacroContextForTrade(trade, { withNarrative: true });

    // Persist to DB for caching
    await setMacroContext(id, {
      alignment:  context.alignment,
      eventsJson: context.events,
      narrative:  context.narrative,
    });

    res.json({ success: true, cached: false, ...context });
  } catch (err) {
    console.error('macro-context error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ── GET /macro-stats — Aggregate alignment win-rate stats for all user trades ──
router.get('/macro-stats', async (req, res) => {
  try {
    const userId = getUserId(req);
    const trades = await getAllTradesForUser(userId);
    const stats  = getMacroAlignmentStats(trades);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('macro-stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
