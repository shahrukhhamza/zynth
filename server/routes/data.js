import express from 'express';
import { 
  getGoldPrices,
  getEquityData,
  getForexData,
  getCommodityData,
  getEconomicIndicators,
  getGoldSpotPrice,
  getMarketData,
  getLivePrices,
} from '../services/dataService.js';

const router = express.Router();

// Get actual gold spot price (GC=F futures via Yahoo Finance)
router.get('/gold/spot', async (req, res, next) => {
  try {
    const data = await getGoldSpotPrice();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Live price snapshot — all instruments, fast, 8s server cache
router.get('/prices/live', async (req, res, next) => {
  try {
    const data = await getLivePrices();
    res.json({ success: true, data, serverTime: Date.now() });
  } catch (error) {
    next(error);
  }
});

// Generic market endpoint — accepts any Yahoo Finance symbol via query param
// Handles special chars like CL=F, ^VIX, DX-Y.NYB
router.get('/market', async (req, res, next) => {
  try {
    const { symbol, limit = 90 } = req.query;
    if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });
    const data = await getMarketData(symbol, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get gold price data
router.get('/gold', async (req, res, next) => {
  try {
    const { timespan = 'day', limit = 90 } = req.query;
    const data = await getGoldPrices(timespan, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get equity market data
router.get('/equity/:ticker', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const { timespan = 'day', limit = 90 } = req.query;
    const data = await getEquityData(ticker, timespan, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get forex data (USD pairs)
router.get('/forex/:pair', async (req, res, next) => {
  try {
    const { pair } = req.params;
    const { timespan = 'day', limit = 90 } = req.query;
    const data = await getForexData(pair, timespan, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get commodity data
router.get('/commodity/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timespan = 'day', limit = 90 } = req.query;
    const data = await getCommodityData(symbol, timespan, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get economic indicators dashboard
router.get('/indicators', async (req, res, next) => {
  try {
    const data = await getEconomicIndicators();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
