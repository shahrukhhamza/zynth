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
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { requireAuth, checkAiTries, requirePro } from '../middleware/authMiddleware.js';
import {
  insertTrade, getTrades, getTradeById, updateTrade, deleteTrade, countTrades,
  countTradesThisMonth, getTradesBySymbol, countTradesBySymbol,
  upsertJournal, setJournalAiAnalysis,
  getAllTradesForUser, insertReport, getReports,
} from '../services/journalDb.js';
import { calcMetrics } from '../services/analyticsService.js';
import { analyzeJournalEntry, generatePerformanceReport } from '../services/journalAiService.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, '..', 'uploads', 'journal');

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, safe + extname(file.originalname).toLowerCase());
  },
});
const upload = multer({
  storage,
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

/** Free users: max 10 journal entries per calendar month. Pro/Elite/Admin: unlimited. */
function checkJournalLimit(req, res, next) {
  const { plan, is_admin } = req.user || {};
  if (is_admin === 1 || plan === 'pro' || plan === 'elite') return next();
  const count = countTradesThisMonth(getUserId(req));
  if (count >= 10)
    return res.status(403).json({ error: 'journal_limit_reached', limit: 10, upgrade: true });
  next();
}

const router = Router();

// All journal routes require authentication
router.use(requireAuth);

// ── POST /trades ──────────────────────────────────────────────────────────────
router.post('/trades', checkJournalLimit, upload.single('screenshot'), async (req, res) => {
  try {
    const body = req.body;
    const userId = getUserId(req);

    if (!body.pair || !body.direction) {
      return res.status(400).json({ success: false, error: 'pair and direction are required' });
    }

    const tradeData = {
      user_id:       userId,
      pair:          body.pair.toUpperCase(),
      direction:     body.direction.toLowerCase(),
      position_size: body.position_size ? parseFloat(body.position_size) : null,
      entry_price:   body.entry_price   ? parseFloat(body.entry_price)   : null,
      exit_price:    body.exit_price    ? parseFloat(body.exit_price)    : null,
      tp:            body.tp            ? parseFloat(body.tp)            : null,
      sl:            body.sl            ? parseFloat(body.sl)            : null,
      outcome:       body.outcome       || null,
      profit_loss:   body.profit_loss   ? parseFloat(body.profit_loss)   : null,
      session:       body.session       || null,
      screenshot_path: req.file ? `/uploads/journal/${req.file.filename}` : null,
    };

    const tradeId = insertTrade(tradeData);

    // Upsert journal fields if any are provided
    const journalFields = ['strategy', 'reasoning', 'emotional_state', 'lessons_learned', 'notes'];
    const hasJournal = journalFields.some(k => body[k]);
    if (hasJournal) {
      const jData = {};
      journalFields.forEach(k => { if (body[k]) jData[k] = body[k]; });
      upsertJournal(tradeId, jData);
    }

    const trade = getTradeById(tradeId);
    res.status(201).json({ success: true, data: trade });
  } catch (err) {
    console.error('POST /journal/trades error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /trades ───────────────────────────────────────────────────────────────
router.get('/trades', (req, res) => {
  try {
    const userId = getUserId(req);
    const page   = Math.max(0, parseInt(req.query.page)  || 0);
    const limit  = Math.min(200, parseInt(req.query.limit) || 50);
    const symbol = req.query.symbol ? String(req.query.symbol).trim() : null;
    const trades = symbol
      ? getTradesBySymbol(userId, symbol, limit, page * limit)
      : getTrades(userId, limit, page * limit);
    const total  = symbol
      ? countTradesBySymbol(userId, symbol)
      : countTrades(userId);
    res.json({ success: true, data: trades, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const gemRes = await axios.post(
      `${geminiUrl}?key=${key}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const analysis = gemRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analysis) return res.status(500).json({ success: false, error: 'Empty AI response' });

    res.json({ success: true, analysis, symbol, tradeCount: trades.length });
  } catch (err) {
    console.error('chart-analysis error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /trades/:id ───────────────────────────────────────────────────────────
router.get('/trades/:id', (req, res) => {
  try {
    const trade = getTradeById(parseInt(req.params.id));
    if (!trade) return res.status(404).json({ success: false, error: 'Trade not found' });
    res.json({ success: true, data: trade });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /trades/:id ───────────────────────────────────────────────────────────
router.put('/trades/:id', upload.single('screenshot'), (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const body = req.body;

    const tradeFields = ['pair','direction','position_size','entry_price','exit_price','tp','sl','outcome','profit_loss','session'];
    const tradeUpdate = {};
    tradeFields.forEach(k => { if (body[k] !== undefined) tradeUpdate[k] = body[k]; });
    if (req.file) tradeUpdate.screenshot_path = `/uploads/journal/${req.file.filename}`;
    if (body.pair) tradeUpdate.pair = body.pair.toUpperCase();

    if (Object.keys(tradeUpdate).length) updateTrade(id, tradeUpdate);

    const journalFields = ['strategy', 'reasoning', 'emotional_state', 'lessons_learned', 'notes'];
    const jData = {};
    journalFields.forEach(k => { if (body[k] !== undefined) jData[k] = body[k]; });
    if (Object.keys(jData).length) upsertJournal(id, jData);

    const trade = getTradeById(id);
    res.json({ success: true, data: trade });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /trades/:id ────────────────────────────────────────────────────────
router.delete('/trades/:id', (req, res) => {
  try {
    deleteTrade(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /trades/:id/analyze — AI journal analysis ────────────────────────────
router.post('/trades/:id/analyze', checkAiTries, async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const trade = getTradeById(id);
    if (!trade) return res.status(404).json({ success: false, error: 'Trade not found' });

    const analysis = await analyzeJournalEntry(trade, {
      strategy:       trade.strategy,
      reasoning:      trade.reasoning,
      emotional_state: trade.emotional_state,
      lessons_learned: trade.lessons_learned,
      notes:          trade.notes,
    });

    // Persist the analysis
    upsertJournal(id, {}); // ensure journal row exists
    setJournalAiAnalysis(id, analysis);

    res.json({ success: true, data: analysis });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /analytics ────────────────────────────────────────────────────────────
router.get('/analytics', (req, res) => {
  try {
    const userId = getUserId(req);
    const trades = getAllTradesForUser(userId);
    const metrics = calcMetrics(trades);
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /reports ──────────────────────────────────────────────────────────────
router.get('/reports', (req, res) => {
  try {
    const userId = getUserId(req);
    const reports = getReports(userId, 20).map(r => ({
      ...r,
      report_data: r.report_data ? JSON.parse(r.report_data) : null,
    }));
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /reports — generate report (Pro/Elite only, counts as an AI try) ──────
router.post('/reports', requirePro, checkAiTries, async (req, res) => {
  try {
    const userId     = getUserId(req);
    const reportType = req.body.type || 'custom'; // weekly | monthly | custom

    const trades  = getAllTradesForUser(userId);
    const metrics = calcMetrics(trades);

    const reportData = await generatePerformanceReport(metrics, trades, reportType);
    reportData.metrics = metrics; // embed raw metrics in report

    const id = insertReport({
      user_id:     userId,
      report_type: reportType,
      report_data: JSON.stringify(reportData),
    });

    res.json({ success: true, data: { id, user_id: userId, report_type: reportType, created_at: new Date().toISOString(), report_data: reportData } });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
