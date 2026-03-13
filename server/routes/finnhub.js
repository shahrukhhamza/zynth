import { Router } from 'express';
import { requireAuth, requirePro } from '../middleware/authMiddleware.js';
import { finnhubService, TRACKED_SYMBOLS } from '../services/finnhubService.js';

const router = Router();

// Live market feeds are a Pro/Elite feature
router.use(requireAuth, requirePro);

// GET /api/finnhub/symbols — metadata for all tracked symbols
router.get('/symbols', (_req, res) => {
  res.json({ success: true, data: TRACKED_SYMBOLS });
});

// GET /api/finnhub/snapshot — latest cached live prices for all symbols
router.get('/snapshot', (_req, res) => {
  res.json({
    success: true,
    data:   finnhubService.getPriceSnapshot(),
    status: finnhubService.getStatus(),
    ts:     Date.now(),
  });
});

// GET /api/finnhub/quote?symbol=AAPL — single symbol REST quote
router.get('/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ success: false, error: 'symbol query param required' });

  try {
    const data = await finnhubService.getQuote(symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (err) {
    const status = err.response?.status === 429 ? 429 : 500;
    const message = status === 429
      ? 'Rate limit reached. Please wait a moment.'
      : err.message;
    res.status(status).json({ success: false, error: message });
  }
});

// GET /api/finnhub/quotes?symbols=AAPL,TSLA,BINANCE:BTCUSDT — batch REST quotes
router.get('/quotes', async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ success: false, error: 'symbols query param required' });

  const syms = symbols.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
  const results = await Promise.allSettled(syms.map(s => finnhubService.getQuote(s)));

  const data = {};
  syms.forEach((s, i) => {
    if (results[i].status === 'fulfilled') data[s] = results[i].value;
    else data[s] = { symbol: s, error: results[i].reason?.message ?? 'failed' };
  });

  res.json({ success: true, data, ts: Date.now() });
});

export default router;
