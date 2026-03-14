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
import { getDb } from '../services/journalDb.js';

const VALID_TYPES = ['Support', 'Resistance', 'Target', 'Stop Zone'];

function getUserId(req) {
  return req.user?.userId || req.user?.id;
}

function ensureTable() {
  // Idempotent — called on every request to handle fresh DB instances
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS levels (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT    NOT NULL,
      symbol     TEXT    NOT NULL,
      type       TEXT    NOT NULL,
      price      REAL    NOT NULL,
      note       TEXT,
      created_at TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_levels_user_sym ON levels(user_id, symbol);
  `);
}

const router = Router();

// ── GET /api/levels?symbol=XAU/USD ───────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol || typeof symbol !== 'string' || symbol.length > 30) {
      return res.status(400).json({ error: 'symbol is required (max 30 chars)' });
    }
    const userId = getUserId(req);
    ensureTable();
    const levels = getDb()
      .prepare('SELECT * FROM levels WHERE user_id = ? AND symbol = ? ORDER BY price DESC')
      .all(String(userId), symbol.trim());
    res.json({ levels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/levels ──────────────────────────────────────────────────────────
router.post('/', (req, res) => {
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

    ensureTable();
    const r = getDb()
      .prepare('INSERT INTO levels (user_id, symbol, type, price, note) VALUES (?, ?, ?, ?, ?)')
      .run(String(userId), symbol.trim(), type, priceNum, cleanNote);

    res.status(201).json({
      id: r.lastInsertRowid,
      user_id: userId,
      symbol: symbol.trim(),
      type,
      price: priceNum,
      note: cleanNote,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/levels/:id ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });

    ensureTable();
    const existing = getDb()
      .prepare('SELECT id FROM levels WHERE id = ? AND user_id = ?')
      .get(id, String(userId));
    if (!existing) return res.status(404).json({ error: 'Level not found or not owned by you' });

    getDb().prepare('DELETE FROM levels WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
