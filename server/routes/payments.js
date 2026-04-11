/**
 * payments route — /api/payments
 *
 * POST   /api/payments/submit          — authenticated user submits a payment request
 * GET    /api/payments                 — admin: list all requests
 * PUT    /api/payments/:id/approve     — admin: approve + upgrade user plan
 * PUT    /api/payments/:id/reject      — admin: reject request
 * GET    /api/payments/my              — authenticated user: see own submissions
 */
import { Router }         from 'express';
import multer             from 'multer';
import { extname, join }  from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID }     from 'crypto';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as Payments      from '../db/payments.js';
import * as Users         from '../db/users.js';
import { activateUserSubscription } from '../db/users.js';
import { trackEvent }     from '../db/events.js';
import { UPLOADS_DIR }    from '../config/storagePaths.js';

// ── Multer — disk storage under uploads/payments/ ────────────────────────────
const PAYMENTS_DIR = join(UPLOADS_DIR, 'payments');
if (!existsSync(PAYMENTS_DIR)) mkdirSync(PAYMENTS_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PAYMENTS_DIR),
  filename:    (_req, file, cb) => {
    const raw = extname(file.originalname).toLowerCase();
    // Only allow safe extension characters
    const ext = /^\.[a-z0-9]+$/.test(raw) ? raw : '.jpg';
    cb(null, `pay_${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are accepted (JPEG, PNG, WebP, GIF).'));
  },
});

const router = Router();

// ── POST /api/payments/submit ─────────────────────────────────────────────────
router.post('/submit', requireAuth, upload.single('proof'), async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly', method, amount, note } = req.body ?? {};

    if (!plan || !['pro', 'elite'].includes(String(plan).trim().toLowerCase())) {
      return res.status(400).json({ error: 'Invalid plan. Must be pro or elite.' });
    }
    if (!method || typeof method !== 'string' || method.trim().length < 2) {
      return res.status(400).json({ error: 'Payment method is required.' });
    }
    if (!['monthly', 'annual'].includes(String(billingCycle).trim().toLowerCase())) {
      return res.status(400).json({ error: 'Invalid billing cycle. Must be monthly or annual.' });
    }

    const isCrypto = /crypto|usdt|trc20/i.test(String(method).trim());
    if (!req.file && !isCrypto) {
      return res.status(400).json({ error: 'Payment proof is required.' });
    }
    if (isCrypto && !note?.trim()) {
      return res.status(400).json({ error: 'Transaction ID (TXID) is required for crypto payments.' });
    }

    if (amount && !/^[A-Za-z0-9$.,\s/+~-]{1,30}$/.test(String(amount).trim())) {
      return res.status(400).json({ error: 'Invalid amount format.' });
    }

    const proofUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;

    const request = await Payments.createPaymentRequest({
      userId:   req.user.id,
      plan:     plan.trim().toLowerCase(),
      billingCycle: String(billingCycle).trim().toLowerCase(),
      method:   method.trim().slice(0, 100),
      amount:   amount?.trim().slice(0, 30) ?? null,
      note:     note?.trim().slice(0, 500)  ?? null,
      proofUrl,
    });

    trackEvent(req.user.id, 'payment_submitted', {
      requestId: request.id,
      plan: request.plan,
      billingCycle: request.billing_cycle,
      status: request.status,
    });

    res.status(201).json({ ok: true, request });
  } catch (err) {
    console.error('payments/submit error:', err);
    res.status(500).json({ error: 'Failed to submit payment request.' });
  }
});

// ── GET /api/payments/my  (own submissions — authenticated) ───────────────────
router.get('/my', requireAuth, async (req, res) => {
  try {
    const requests = await Payments.getPaymentRequestsByUser(req.user.id);
    res.json({ requests });
  } catch (err) {
    console.error('payments/my error:', err);
    res.status(500).json({ error: 'Failed to fetch your payment requests.' });
  }
});

// ── GET /api/payments  (admin only) ──────────────────────────────────────────
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await Payments.getAllPaymentRequests();
    res.json({ requests });
  } catch (err) {
    console.error('payments/list error:', err);
    res.status(500).json({ error: 'Failed to fetch payment requests.' });
  }
});

// ── PUT /api/payments/:id/approve  (admin only) ───────────────────────────────
router.put('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid payment request ID.' });
    }

    const existing = await Payments.getPaymentRequestById(id);
    if (!existing)                          return res.status(404).json({ error: 'Payment request not found.' });
    if (existing.status === 'verified')     return res.status(409).json({ error: 'Already verified.' });

    const updated = await Payments.updatePaymentStatus(id, 'verified', req.user.id);

    // ── Activate subscription (only on 'verified' path) ─────────────────────
    const now       = new Date();
    const expiresAt = new Date(now);
    if (existing.billing_cycle === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    try {
      await activateUserSubscription(existing.user_id, existing.plan, expiresAt.toISOString());
    } catch (activationErr) {
      // Revert payment status so admin can retry
      console.error('Subscription activation failed, reverting payment status:', activationErr);
      await Payments.updatePaymentStatus(id, 'pending', req.user.id);
      return res.status(500).json({ error: 'Payment verified but subscription activation failed. Status reverted to pending — please retry.' });
    }

    trackEvent(req.user.id, 'payment_verified', {
      requestId:    existing.id,
      userId:       existing.user_id,
      plan:         existing.plan,
      billingCycle: existing.billing_cycle,
    });

    return res.json({
      ok: true,
      request: updated,
      subscription: {
        userId:           existing.user_id,
        plan:             existing.plan,
        billingCycle:     existing.billing_cycle,
        active:           true,
        subscriptionStart: now.toISOString(),
        expiresAt:        expiresAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('payments/approve error:', err);
    res.status(500).json({ error: 'Failed to approve payment.' });
  }
});

// ── PUT /api/payments/:id/reject  (admin only) ────────────────────────────────
router.put('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid payment request ID.' });
    }

    const existing = await Payments.getPaymentRequestById(id);
    if (!existing)                          return res.status(404).json({ error: 'Payment request not found.' });
    if (existing.status === 'rejected')     return res.status(409).json({ error: 'Already rejected.' });

    const updated = await Payments.updatePaymentStatus(id, 'rejected', req.user.id);
    trackEvent(req.user.id, 'payment_rejected', {
      requestId: existing.id,
      userId: existing.user_id,
      plan: existing.plan,
      billingCycle: existing.billing_cycle,
    });
    res.json({ ok: true, request: updated });
  } catch (err) {
    console.error('payments/reject error:', err);
    res.status(500).json({ error: 'Failed to reject payment.' });
  }
});

export default router;
