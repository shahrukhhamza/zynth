/**
 * payment.js  — /api/payment
 *
 * Developer-facing payment endpoints (complements /api/payments admin routes).
 *
 * POST  /api/payment/crypto          Submit a crypto (USDT TRC20) payment
 * POST  /api/payment/jazzcash        Submit a JazzCash payment with screenshot
 * GET   /api/payment/status/:userId  Get latest / all payment statuses for a user
 */

import { Router }                from 'express';
import multer                    from 'multer';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as Payments             from '../db/payments.js';
import { trackEvent }            from '../db/events.js';
import { savePaymentProof }       from '../services/fileStorageService.js';

const router = Router();

// ── Multer — in memory; the file is persisted (Supabase / local) only after validation passes ──

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are accepted (JPEG, PNG, WebP, GIF).'));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const VALID_PLANS         = new Set(['pro', 'elite']);
const VALID_CYCLES        = new Set(['monthly', 'annual']);
const TXID_RE             = /^[A-Fa-f0-9]{20,100}$/;     // hex TXID (TRC20 = 64 hex chars)
const AMOUNT_RE           = /^[A-Za-z0-9$.,\s/+~-]{1,30}$/;

function sanitize(str, maxLen = 200) {
  return typeof str === 'string' ? str.trim().slice(0, maxLen) : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/crypto
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Body (JSON):
 *   txid         string   — transaction hash (TXID)
 *   amount       string   — e.g. "8.90" or "$8.90 USDT"
 *   plan         string   — "pro" | "elite"
 *   billingCycle string?  — "monthly" (default) | "annual"
 *   userId       number?  — ignored if authenticated; used only for public/webhook calls
 *
 * Returns:
 *   { ok: true, message, requestId, status: "pending" }
 */
router.post('/crypto', requireAuth, async (req, res) => {
  try {
    const { txid, amount, plan, billingCycle = 'monthly' } = req.body ?? {};

    // ── Validation ──────────────────────────────────────────────────────────
    const cleanTxid  = sanitize(txid, 128);
    const cleanAmt   = sanitize(amount, 30);
    const cleanPlan  = sanitize(plan, 20).toLowerCase();
    const cleanCycle = sanitize(billingCycle, 20).toLowerCase();

    if (!cleanTxid)                            return res.status(400).json({ error: 'txid is required.' });
    if (!TXID_RE.test(cleanTxid))              return res.status(400).json({ error: 'txid format is invalid. Expected a 20-100 character hex string.' });
    if (!VALID_PLANS.has(cleanPlan))           return res.status(400).json({ error: 'plan must be "pro" or "elite".' });
    if (!VALID_CYCLES.has(cleanCycle))         return res.status(400).json({ error: 'billingCycle must be "monthly" or "annual".' });
    if (cleanAmt && !AMOUNT_RE.test(cleanAmt)) return res.status(400).json({ error: 'amount format is invalid.' });

    // The same on-chain transaction must never unlock more than one subscription.
    if (await Payments.isTxidInUse(cleanTxid)) {
      return res.status(409).json({ error: 'This transaction ID has already been submitted.' });
    }

    // ── Persist ─────────────────────────────────────────────────────────────
    const request = await Payments.createPaymentRequest({
      userId:       req.user.id,
      plan:         cleanPlan,
      billingCycle: cleanCycle,
      method:       'USDT TRC20',
      amount:       cleanAmt || null,
      note:         cleanTxid,   // TXID stored in note field
      proofUrl:     null,
    });

    trackEvent(req.user.id, 'payment_crypto_submitted', {
      requestId:    request.id,
      plan:         request.plan,
      billingCycle: request.billing_cycle,
      txid:         cleanTxid,
    });

    return res.status(201).json({
      ok:        true,
      message:   'Crypto payment received. Your transaction will be verified within 1–12 hours and your plan activated automatically.',
      requestId: request.id,
      status:    'pending',
    });

  } catch (err) {
    console.error('[payment/crypto] error:', err.message);
    res.status(500).json({ error: 'Failed to submit crypto payment.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/jazzcash
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Body (multipart/form-data):
 *   screenshot   file     — required image (JPEG / PNG / WebP / GIF, max 5 MB)
 *   amount       string   — e.g. "8.90"
 *   plan         string   — "pro" | "elite"
 *   billingCycle string?  — "monthly" (default) | "annual"
 *   note         string?  — optional transaction reference
 *
 * Returns:
 *   { ok: true, message, requestId, screenshotUrl, status: "pending" }
 */
router.post('/jazzcash', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { amount, plan, billingCycle = 'monthly', note } = req.body ?? {};

    // ── Validation ──────────────────────────────────────────────────────────
    const cleanAmt   = sanitize(amount, 30);
    const cleanPlan  = sanitize(plan, 20).toLowerCase();
    const cleanCycle = sanitize(billingCycle, 20).toLowerCase();
    const cleanNote  = sanitize(note, 500);

    if (!VALID_PLANS.has(cleanPlan))           return res.status(400).json({ error: 'plan must be "pro" or "elite".' });
    if (!VALID_CYCLES.has(cleanCycle))         return res.status(400).json({ error: 'billingCycle must be "monthly" or "annual".' });
    if (cleanAmt && !AMOUNT_RE.test(cleanAmt)) return res.status(400).json({ error: 'amount format is invalid.' });
    if (!req.file)                             return res.status(400).json({ error: 'screenshot image is required.' });

    const screenshotUrl = await savePaymentProof(req.file);

    // ── Persist ─────────────────────────────────────────────────────────────
    const request = await Payments.createPaymentRequest({
      userId:       req.user.id,
      plan:         cleanPlan,
      billingCycle: cleanCycle,
      method:       'JazzCash',
      amount:       cleanAmt || null,
      note:         cleanNote || null,
      proofUrl:     screenshotUrl,
    });

    trackEvent(req.user.id, 'payment_jazzcash_submitted', {
      requestId:    request.id,
      plan:         request.plan,
      billingCycle: request.billing_cycle,
    });

    return res.status(201).json({
      ok:           true,
      message:      'JazzCash payment screenshot received. Our team will verify and activate your plan within 1–12 hours.',
      requestId:    request.id,
      screenshotUrl,
      status:       'pending',
    });

  } catch (err) {
    // Multer file-type rejection
    if (err.message?.includes('Only image files')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('[payment/jazzcash] error:', err.message);
    res.status(500).json({ error: 'Failed to submit JazzCash payment.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/status/:userId
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns latest payment status for a user.
 *
 * Access rules:
 *   - Authenticated user can only query their own userId.
 *   - Admin can query any userId.
 * 
 * Query params:
 *   ?history=true  — include all past requests, not just the latest
 *
 * Returns:
 *   {
 *     userId,
 *     latest: { id, plan, billingCycle, method, amount, status, createdAt, reviewedAt } | null,
 *     history: [...] (only if ?history=true),
 *   }
 */
router.get('/status/:userId', requireAuth, async (req, res) => {
  try {
    const targetId = Number(req.params.userId);

    if (!Number.isInteger(targetId) || targetId < 1) {
      return res.status(400).json({ error: 'userId must be a positive integer.' });
    }

    // ── Authorization: own record OR admin ───────────────────────────────────
    const isAdmin = Number(req.user?.is_admin) === 1;
    if (!isAdmin && req.user.id !== targetId) {
      return res.status(403).json({ error: 'Forbidden. You can only query your own payment status.' });
    }

    const latest = await Payments.getLatestPaymentStatusByUser(targetId);

    const payload = {
      userId: targetId,
      latest: latest
        ? {
            id:           latest.id,
            plan:         latest.plan,
            billingCycle: latest.billing_cycle,
            method:       latest.method,
            amount:       latest.amount,
            status:       latest.status,   // "pending" | "approved" | "rejected"
            createdAt:    latest.created_at,
            reviewedAt:   latest.reviewed_at,
          }
        : null,
    };

    // Optionally include full history
    if (req.query.history === 'true') {
      const history = await Payments.getPaymentHistoryByUser(targetId);
      payload.history = history.map((r) => ({
        id:           r.id,
        plan:         r.plan,
        billingCycle: r.billing_cycle,
        method:       r.method,
        amount:       r.amount,
        status:       r.status,
        createdAt:    r.created_at,
        reviewedAt:   r.reviewed_at,
      }));
    }

    return res.json(payload);

  } catch (err) {
    console.error('[payment/status] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch payment status.' });
  }
});

export default router;
