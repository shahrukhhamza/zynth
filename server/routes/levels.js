/**
 * levels.js — Price levels (Support / Resistance / Target / Stop Zone) per user + symbol
 *
 * All routes require a valid JWT (mounted with requireAuth in server.js)
 *
 * GET    /api/levels?symbol=XAU/USD    returns all levels for the authenticated user + symbol
 * POST   /api/levels                   create a new level
 * DELETE /api/levels/:id               delete a level owned by the authenticated user
 */

import { Router } from 'express';
import {
  createLevel,
  deleteLevelById,
  findLevelByIdForUser,
  getLevelsForUserSymbol,
} from '../services/journalDb.js';

const VALID_TYPES = ['Support', 'Resistance', 'Target', 'Stop Zone'];

function getUserId(req) {
  return req.user?.userId || req.user?.id;
}

const router = Router();

// ── GET /api/levels?symbol=XAU/USD ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol || typeof symbol !== 'string' || symbol.length > 30) {
      return res.status(400).json({ error: 'symbol is required (max 30 chars)' });
    }
    const userId = getUserId(req);
    const levels = await getLevelsForUserSymbol(userId, symbol);
    res.json({ levels });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/levels ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { symbol, type, price, note } = req.body ?? {};

    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0 || symbol.length > 30) {
      return res.status(400).json({ error: 'symbol is required (max 30 chars)' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }
    const cleanNote = note ? String(note).slice(0, 50) : null;

    const level = await createLevel({ user_id: userId, symbol, type, price: priceNum, note: cleanNote });
    res.status(201).json(level);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/levels/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });

    const existing = await findLevelByIdForUser(id, userId);
    if (!existing) return res.status(404).json({ error: 'Level not found or not owned by you' });

    await deleteLevelById(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
