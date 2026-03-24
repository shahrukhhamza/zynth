import express from 'express';
import { getEconomicCalendar, getIndicatorDetails, forceRefreshCalendar } from '../services/economicCalendarService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/calendar
 * Query params:
 *   from=YYYY-MM-DD  (optional)
 *   to=YYYY-MM-DD    (optional)
 *   filter=today|tomorrow|this_week|next_week (optional, default: week)
 */
router.get('/', async (req, res, next) => {
  try {
    const { from, to, filter } = req.query;
    const options = from && to ? { from, to } : { filter: filter ?? 'week' };
    const calendar = await getEconomicCalendar(options);
    res.json(calendar);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const result = await forceRefreshCalendar();
    res.json({ success: true, count: result.indicators.length, fetchedAt: result.fetchedAt });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/:indicatorId
 */
router.get('/:indicatorId', async (req, res, next) => {
  try {
    const indicator = await getIndicatorDetails(req.params.indicatorId);
    res.json(indicator);
  } catch (error) {
    next(error);
  }
});

export default router;
