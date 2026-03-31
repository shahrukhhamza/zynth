/**
 * Economic Intelligence API Routes
 * 
 * Provides endpoints for:
 * - Individual economic indicators (NFP, CPI, Unemployment)
 * - Complete economic dashboard
 * - Gemini AI macro analysis
 */

import express from 'express';
import { requireAuth, requirePro } from '../middleware/authMiddleware.js';
import {
  analyzeNFP,
  analyzeCPI,
  analyzeUnemployment,
  analyzeFedRate,
  analyzeGDP,
  analyzeCorePCE,
  analyzeJoblessClaims,
  analyzeRetailSales,
  analyzeISMManufacturing,
  analyzeConsumerConfidence,
  getEconomicDashboard,
  calculateMacroSurpriseScore,
  clearEconomicCache,
  buildAiInsightsPayload,
} from '../services/economicIntelligenceService.js';
import { analyzeMacroeconomicImpact } from '../services/geminiAnalysisService.js';

const router = express.Router();

// All economic intelligence endpoints require a Pro or Elite plan
router.use(requireAuth, requirePro);

/**
 * GET /api/economic/nfp
 * Fetch Non-Farm Payrolls analysis with surprise calculation
 */
router.get('/nfp', async (req, res) => {
  try {
    const analysis = await analyzeNFP();
    
    if (analysis.error) {
      return res.status(503).json({
        error: 'Failed to analyze NFP',
        details: analysis.error,
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('NFP endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/economic/cpi
 * Fetch Consumer Price Index analysis with surprise calculation
 */
router.get('/cpi', async (req, res) => {
  try {
    const analysis = await analyzeCPI();
    
    if (analysis.error) {
      return res.status(503).json({
        error: 'Failed to analyze CPI',
        details: analysis.error,
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('CPI endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/economic/unemployment
 * Fetch Unemployment Rate analysis with surprise calculation
 */
router.get('/unemployment', async (req, res) => {
  try {
    const analysis = await analyzeUnemployment();
    
    if (analysis.error) {
      return res.status(503).json({
        error: 'Failed to analyze Unemployment',
        details: analysis.error,
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Unemployment endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ── New high-impact indicator routes ────────────────────────────────────────

const newIndicators = [
  { path: '/fed-rate',          fn: analyzeFedRate,           name: 'Fed Rate' },
  { path: '/gdp',               fn: analyzeGDP,               name: 'GDP' },
  { path: '/core-pce',          fn: analyzeCorePCE,           name: 'Core PCE' },
  { path: '/jobless-claims',    fn: analyzeJoblessClaims,     name: 'Jobless Claims' },
  { path: '/retail-sales',      fn: analyzeRetailSales,       name: 'Retail Sales' },
  { path: '/ism-manufacturing', fn: analyzeISMManufacturing,  name: 'ISM Manufacturing' },
  { path: '/consumer-confidence',fn: analyzeConsumerConfidence,name: 'Consumer Confidence' },
];

newIndicators.forEach(({ path, fn, name }) => {
  router.get(path, async (req, res) => {
    try {
      const analysis = await fn();
      if (analysis.error) {
        return res.status(503).json({ error: `Failed to analyze ${name}`, details: analysis.error });
      }
      res.json(analysis);
    } catch (error) {
      console.error(`${name} endpoint error:`, error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });
});

/**
 * GET /api/economic/dashboard
 * Fetch complete economic intelligence dashboard
 * 
 * Includes:
 * - All three indicators (NFP, CPI, Unemployment)
 * - Overall market sentiment
 * - Gemini AI macro analysis (if enabled)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await getEconomicDashboard();
    
    if (dashboard.error) {
      return res.status(503).json({
        error: 'Failed to build dashboard',
        details: dashboard.error,
      });
    }

    // Add Gemini AI macro analysis if enabled
    if (process.env.USE_GEMINI_AI !== 'false' && process.env.GEMINI_API_KEY) {
      try {
        const macroAnalysis = await analyzeMacroeconomicImpact(dashboard);
        dashboard.aiAnalysis = macroAnalysis;
        console.log('✓ Added Gemini AI macro analysis to dashboard');
      } catch (error) {
        console.log('⚠️  Gemini analysis failed (non-critical):', error.message);
        // Don't block dashboard if Gemini fails - it's an enhancement
        dashboard.aiAnalysis = {
          error: 'AI analysis unavailable',
          message: error.message,
        };
      }
    }

    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/economic/refresh
 * Clear cache and force fresh data fetch
 */
router.post('/refresh', async (req, res) => {
  try {
    clearEconomicCache();
    
    res.json({
      success: true,
      message: 'Economic intelligence cache cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh cache',
      message: error.message,
    });
  }
});

/**
 * GET /api/economic/ai-insights
 *
 * Single endpoint for the AI Insights dashboard.
 * Returns a standardised, ready-to-render payload:
 *   { meta, score, sentiment, confidence, summary, drivers, indicators, aiSummary }
 *
 * All transformation logic runs on the server — the client receives a
 * presentation-ready object with no further processing required.
 */
router.get('/ai-insights', async (req, res) => {
  try {
    // Run dashboard + score concurrently
    const [dashboard, macroScore] = await Promise.all([
      getEconomicDashboard(),
      calculateMacroSurpriseScore(),
    ]);

    if (dashboard.error) {
      return res.status(503).json({
        error: 'Economic data unavailable',
        details: dashboard.error,
      });
    }

    // Gemini commentary is optional — never block the response if it fails
    let aiAnalysis = null;
    if (process.env.USE_GEMINI_AI !== 'false' && process.env.GEMINI_API_KEY) {
      try {
        aiAnalysis = await analyzeMacroeconomicImpact(dashboard);
      } catch (err) {
        console.log('⚠️  Gemini commentary failed (non-critical):', err.message);
      }
    }

    const payload = buildAiInsightsPayload(
      dashboard,
      macroScore.error ? null : macroScore,
      aiAnalysis,
    );

    res.json(payload);
  } catch (error) {
    console.error('AI Insights endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/economic/macro-score
 * Composite macro surprise score for gold (-10 to +10)
 */
router.get('/macro-score', async (req, res) => {
  try {
    const result = await calculateMacroSurpriseScore();
    if (result.error) {
      return res.status(503).json({ error: 'Failed to calculate macro score', details: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error('Macro score endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/economic/health
 * Check if economic intelligence service is operational
 */
router.get('/health', (req, res) => {
  const fredKey = process.env.FRED_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  res.json({
    status: 'operational',
    fredApi: fredKey ? 'configured' : 'missing',
    geminiAi: geminiKey ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
  });
});

export default router;
