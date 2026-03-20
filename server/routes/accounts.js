/**
 * POST /api/accounts/add     — provision a new MetaApi cloud account
 * GET  /api/accounts         — list current user's linked accounts
 * DELETE /api/accounts/:id   — remove an account
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createMtAccount,
  getMtAccountsByUser,
  deleteMtAccount,
  getMtAccountByMetaId,
} from '../db/users.js';
import { deployAccount, removeAccount, registerWebhook } from '../services/metaApiService.js';

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
    // ── Deploy on MetaApi (cloud account) ────────────────────────────────
    const { accountId, state } = await deployAccount({
      login:    String(login).trim(),
      password: String(password),          // sent to MetaApi only — never stored locally
      server:   String(server).trim(),
      platform: String(platform).toUpperCase(),
      label:    label ? String(label).trim().slice(0, 64) : undefined,
    });

    // ── Register webhook so trade events POST back to us ─────────────────
    const webhookBase =
      process.env.RAILWAY_STATIC_URL        // e.g. https://ai-dashboard-xxxx.up.railway.app
      ?? process.env.SELF_URL               // fallback manual override
      ?? 'http://localhost:5000';
    await registerWebhook(accountId, `${webhookBase}/api/webhook/metaapi`);

    // ── Persist in Postgres (NO password stored) ─────────────────────────
    const row = await createMtAccount({
      user_id:             req.user.id,
      meta_api_account_id: accountId,
      login:               String(login).trim(),
      server:              String(server).trim(),
      platform:            String(platform).toUpperCase(),
      label:               label ? String(label).trim().slice(0, 64) : null,
    });

    return res.status(201).json({
      success:   true,
      account:   { ...row, state },
      message:   'Broker account connected successfully.',
    });
  } catch (err) {
    console.error('[accounts] /add error:', err.message);
    return res.status(500).json({
      success: false,
      error:   err.message ?? 'Failed to deploy MetaApi account.',
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
    // Fetch row to get the MetaApi account ID
    const accounts = await getMtAccountsByUser(req.user.id);
    const row = accounts.find(a => a.id === localId);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    // Undeploy from MetaApi first
    await removeAccount(row.meta_api_account_id);

    // Delete from local DB
    await deleteMtAccount(localId, req.user.id);

    return res.json({ success: true, message: 'Account removed.' });
  } catch (err) {
    console.error('[accounts] DELETE error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to remove account.' });
  }
});

export default router;
