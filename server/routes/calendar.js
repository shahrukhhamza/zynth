import express from 'express';
import { getEconomicCalendar, getIndicatorDetails, forceRefreshCalendar } from '../services/economicCalendarService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

// Get all economic indicators
router.get('/', async (req, res, next) => {
  try {
    const calendar = await getEconomicCalendar();
    res.json(calendar);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/refresh
 * Force-clear all caches and re-fetch every indicator via
 * Gemini + Google Search grounding with cross-verification.
 * Call this right after a major data release (NFP, CPI, etc.)
 * to get the latest official numbers immediately.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    console.log('🔄 Manual refresh requested via POST /api/calendar/refresh');
    const result = await forceRefreshCalendar();
    res.json({
      success: true,
      message: `Refreshed ${result.indicators.length} indicators via Gemini web search`,
      fetchedAt: result.fetchedAt,
      verifiedAt: result.verifiedAt,
      correctionCount: result.correctionCount,
      model: result.model,
      sources: result.sources,
      indicators: result.indicators,
    });
  } catch (error) {
    console.error('❌ Force-refresh failed:', error.message);
    next(error);
  }
});

// Get specific indicator details with historical data
router.get('/:indicatorId', async (req, res, next) => {
  try {
    const { indicatorId } = req.params;
    const indicator = await getIndicatorDetails(indicatorId);
    res.json(indicator);
  } catch (error) {
    next(error);
  }
});

export default router;
