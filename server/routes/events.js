/**
 * events.js route — accepts client-side conversion events from the React app.
 *
 * POST /api/events/track
 *   Body: { event: string, metadata?: object }
 *
 * Only a strict whitelist of event names is accepted to prevent abuse.
 * Requires authentication.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { trackEvent } from '../db/events.js';

const router = Router();

// Only these events may be sent from the browser
const ALLOWED_CLIENT_EVENTS = new Set([
  'upgrade_modal_opened',
  'upgrade_clicked',
  // 'subscription_started' is emitted server-side when a payment is verified; accepting it from
  // the browser would let anyone inflate the admin conversion numbers.
]);

router.post('/track', requireAuth, (req, res) => {
  const { event, metadata = {} } = req.body ?? {};

  if (!event || !ALLOWED_CLIENT_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Invalid or missing event name.' });
  }

  // Sanitize metadata — accept plain object only, max 10 keys
  const safeMeta = {};
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    Object.entries(metadata).slice(0, 10).forEach(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        safeMeta[k] = v;
      }
    });
  }

  trackEvent(req.user.id, event, safeMeta);
  res.json({ ok: true });
});

export default router;
