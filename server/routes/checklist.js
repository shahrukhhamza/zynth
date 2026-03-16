/**
 * Checklist routes
 * POST   /api/checklist          — save a checklist result
 * GET    /api/checklist/history  — past results for the user
 * GET    /api/checklist/stats    — aggregate stats
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { insertChecklist, getChecklistHistory, getChecklistRawStats } from '../services/journalDb.js';

const router = Router();
router.use(requireAuth);

function getUserId(req) {
  return req.user?.userId || req.user?.id || 'default';
}

// POST /api/checklist
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { score, answers, recommendation, proceeded = 0 } = req.body;

    const id = await insertChecklist({
      user_id:        userId,
      score:          score ?? 0,
      answers:        typeof answers === 'string' ? answers : JSON.stringify(answers ?? {}),
      recommendation: recommendation ?? '',
      proceeded:      proceeded ? 1 : 0,
    });

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('POST /checklist error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checklist/history
router.get('/history', async (req, res) => {
  try {
    const rows = await getChecklistHistory(getUserId(req));
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checklist/stats
router.get('/stats', async (req, res) => {
  try {
    const rows = await getChecklistRawStats(getUserId(req));

    if (!rows.length) {
      return res.json({ success: true, data: { totalChecks: 0 } });
    }

    const total       = rows.length;
    const avgScore    = Math.round(rows.reduce((s, r) => s + (r.score || 0), 0) / total);
    const green       = rows.filter(r => r.recommendation === 'green_light').length;
    const caution     = rows.filter(r => r.recommendation === 'caution').length;
    const red         = rows.filter(r => r.recommendation === 'skip').length;
    const ignoreRed   = rows.filter(r => r.recommendation === 'skip' && r.proceeded === 1).length;

    res.json({
      success: true,
      data: { totalChecks: total, avgScore, greenLights: green, cautionLights: caution, redLights: red, proceededDespiteRed: ignoreRed },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
