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
  countTradesThisMonth,
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
    const trades = getTrades(userId, limit, page * limit);
    const total  = countTrades(userId);
    res.json({ success: true, data: trades, total, page, limit });
  } catch (err) {
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
