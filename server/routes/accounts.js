/**
 * POST /api/accounts/add  — save MT5 credentials to DB (no MetaApi)
 * GET  /api/accounts      — list current user's linked accounts
 * DELETE /api/accounts/:id — remove an account
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createMtAccount,
  getMtAccountsByUser,
  deleteMtAccount,
} from '../db/users.js';

const router = Router();

// All account routes require an authenticated user
router.use(requireAuth);

// ── GET /api/accounts ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const accounts = await getMtAccountsByUser(req.user.id);
    // Never expose raw broker passwords — the row doesn't store them anyway
    res.json({ success: true, accounts });
  } catch (err) {
    console.error('[accounts] GET error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts.' });
  }
});

// ── POST /api/accounts/add ─────────────────────────────────────────────────────
router.post('/add', async (req, res) => {
  const { login, password, server, platform, label } = req.body ?? {};

  // ── Validate inputs ──────────────────────────────────────────────────────
  if (!login || !password || !server || !platform) {
    return res.status(400).json({
      success: false,
      error: 'login, password, server, and platform are all required.',
    });
  }
  if (!['MT5'].includes(String(platform).toUpperCase())) {
    return res.status(400).json({ success: false, error: 'platform must be MT5.' });
  }
  if (String(login).length > 20 || String(server).length > 100) {
    return res.status(400).json({ success: false, error: 'login or server value too long.' });
  }

  try {
    // Use login:server as a natural dedup key (same account can't be added twice)
    const metaKey = `mt5:${String(login).trim().toLowerCase()}:${String(server).trim().toLowerCase()}`;

    const row = await createMtAccount({
      user_id:             req.user.id,
      meta_api_account_id: metaKey,
      login:               String(login).trim(),
      password:            String(password),
      server:              String(server).trim(),
      platform:            String(platform).toUpperCase(),
      label:               label ? String(label).trim().slice(0, 64) : null,
    });

    return res.status(201).json({
      success: true,
      account: row,
      message: 'Broker account saved successfully.',
    });
  } catch (err) {
    // Unique constraint = duplicate account
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'An account with this login and server is already connected.',
      });
    }
    console.error('[accounts] /add error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to save account.',
    });
  }
});

// ── DELETE /api/accounts/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const localId = parseInt(req.params.id, 10);
  if (!Number.isFinite(localId)) {
    return res.status(400).json({ success: false, error: 'Invalid account ID.' });
  }

  try {
    const deleted = await deleteMtAccount(localId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }
    return res.json({ success: true, message: 'Account removed.' });
  } catch (err) {
    console.error('[accounts] DELETE error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to remove account.' });
  }
});

export default router;
