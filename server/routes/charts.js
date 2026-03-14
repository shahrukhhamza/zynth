import { Router } from 'express';

const router = Router();

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

// ── Simple in-process cache ─────────────────────────────────────────────────
const cache = new Map(); // key → { data, expiresAt }

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ── TTL based on interval ────────────────────────────────────────────────────
function getTtl(interval) {
  if (interval === '1min') return 30_000;        // 30 s
  if (interval === '1day') return 3_600_000;     // 1 h
  return 120_000;                                // 2 min for everything else
}

// ── Supported symbols ────────────────────────────────────────────────────────
const SYMBOLS = {
  forex:   ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
  crypto:  ['BTC/USD', 'ETH/USD', 'XRP/USD', 'SOL/USD'],
  indices: ['SPX', 'NDX', 'DJI'],
};

// ── Helper: fetch candles from Twelve Data ───────────────────────────────────
async function fetchTwelveData(symbol, interval, outputsize) {
  const key = btoa(`${symbol}_${interval}_${outputsize}`);
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `${TWELVE_DATA_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${process.env.TWELVE_DATA_API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Twelve Data responded ${res.status}`);

  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message || 'Twelve Data error');

  // Twelve Data returns newest-first → reverse to oldest-first
  const candles = (json.values || []).reverse().map(v => ({
    time:   Math.floor(new Date(v.datetime).getTime() / 1000), // Unix seconds for lightweight-charts
    open:   parseFloat(v.open),
    high:   parseFloat(v.high),
    low:    parseFloat(v.low),
    close:  parseFloat(v.close),
    volume: parseFloat(v.volume ?? 0),
  }));

  cacheSet(key, candles, getTtl(interval));
  return candles;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/charts/symbols
router.get('/symbols', (_req, res) => {
  res.json({ success: true, data: SYMBOLS });
});

// GET /api/charts/candles?symbol=XAU/USD&interval=1h&outputsize=300
router.get('/candles', async (req, res) => {
  const { symbol = 'XAU/USD', interval = '1h', outputsize = '300' } = req.query;

  const VALID_INTERVALS = ['1min', '5min', '15min', '30min', '1h', '4h', '1day'];
  if (!VALID_INTERVALS.includes(interval)) {
    return res.status(400).json({ success: false, error: `Invalid interval. Use: ${VALID_INTERVALS.join(', ')}` });
  }

  const size = Math.min(Math.max(parseInt(outputsize, 10) || 300, 1), 5000);

  try {
    const candles = await fetchTwelveData(symbol, interval, size);
    res.json({ success: true, data: candles, symbol, interval, count: candles.length });
  } catch (err) {
    console.error('[charts/candles]', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const ema = new Array(closes.length).fill(null);
  let seed = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema[period - 1] = seed;
  for (let i = period; i < closes.length; i++) {
    seed = closes[i] * k + seed * (1 - k);
    ema[i] = seed;
  }
  return ema;
}

function calcRSI(closes, period) {
  const rsi = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d >= 0 ? d : 0;
    const loss = d <  0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function calcMACD(closes, fast, slow, signal) {
  const fastEMA   = calcEMA(closes, fast);
  const slowEMA   = calcEMA(closes, slow);
  const macdLine  = closes.map((_, i) =>
    fastEMA[i] !== null && slowEMA[i] !== null ? fastEMA[i] - slowEMA[i] : null);

  // Signal line = EMA of macd line (skip leading nulls)
  const firstValid = macdLine.findIndex(v => v !== null);
  const macdValues = macdLine.slice(firstValid);
  const signalRaw  = calcEMA(macdValues, signal);
  const signalLine = new Array(firstValid).fill(null).concat(signalRaw);

  const histogram = macdLine.map((m, i) =>
    m !== null && signalLine[i] !== null ? m - signalLine[i] : null);

  return { macdLine, signalLine, histogram };
}

function calcBollinger(closes, period, stdDev) {
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  const mid   = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean  = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd    = Math.sqrt(variance);
    mid[i]   = mean;
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }
  return { upper, lower, mid };
}

function calcSMA(closes, period) {
  const sma = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    sma[i] = slice.reduce((a, b) => a + b, 0) / period;
  }
  return sma;
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKTEST ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function runBacktest(candles, strategy, params, startCapital = 10000, riskMgmt = {}) {
  const closes = candles.map(c => c.close);
  const trades = [];
  let capital  = startCapital;
  let inTrade  = false;
  let entry    = null;
  let slPrice  = null;
  let tpPrice  = null;
  const equityCurve = [{ time: candles[0]?.time, value: capital }];

  const commission   = parseFloat(riskMgmt.commission)    || 0;
  const posSizeType  = riskMgmt.posSizeType  || 'percent';
  const posSizeValue = parseFloat(riskMgmt.posSizeValue)  || 100;
  const slType  = riskMgmt.slType  || 'none';
  const slValue = parseFloat(riskMgmt.slValue)  || 0;
  const tpType  = riskMgmt.tpType  || 'none';
  const tpValue = parseFloat(riskMgmt.tpValue)  || 0;

  // ── Generate signals ────────────────────────────────────────────────────
  const buySignal  = new Array(closes.length).fill(false);
  const sellSignal = new Array(closes.length).fill(false);

  if (strategy === 'ema_cross') {
    const fast = calcEMA(closes, params.fastEMA ?? 9);
    const slow = calcEMA(closes, params.slowEMA ?? 21);
    for (let i = 1; i < closes.length; i++) {
      if (fast[i] !== null && slow[i] !== null && fast[i-1] !== null && slow[i-1] !== null) {
        if (fast[i-1] < slow[i-1] && fast[i] >= slow[i]) buySignal[i]  = true;
        if (fast[i-1] > slow[i-1] && fast[i] <= slow[i]) sellSignal[i] = true;
      }
    }
  } else if (strategy === 'rsi_oversold') {
    const rsi = calcRSI(closes, params.period ?? 14);
    const os  = params.oversold   ?? 30;
    const ob  = params.overbought ?? 70;
    for (let i = 1; i < closes.length; i++) {
      if (rsi[i] !== null && rsi[i-1] !== null) {
        if (rsi[i-1] <= os && rsi[i] > os) buySignal[i]  = true;
        if (rsi[i-1] <= ob && rsi[i] > ob) sellSignal[i] = true;
      }
    }
  } else if (strategy === 'macd') {
    const { macdLine, signalLine } = calcMACD(closes, params.fast ?? 12, params.slow ?? 26, params.signal ?? 9);
    for (let i = 1; i < closes.length; i++) {
      if (macdLine[i] !== null && signalLine[i] !== null && macdLine[i-1] !== null && signalLine[i-1] !== null) {
        if (macdLine[i-1] < signalLine[i-1] && macdLine[i] >= signalLine[i]) buySignal[i]  = true;
        if (macdLine[i-1] > signalLine[i-1] && macdLine[i] <= signalLine[i]) sellSignal[i] = true;
      }
    }
  } else if (strategy === 'bollinger') {
    const { upper, lower } = calcBollinger(closes, params.period ?? 20, params.stdDev ?? 2);
    for (let i = 0; i < closes.length; i++) {
      if (upper[i] !== null) {
        if (closes[i] <= lower[i]) buySignal[i]  = true;
        if (closes[i] >= upper[i]) sellSignal[i] = true;
      }
    }
  } else if (strategy === 'support_resistance') {
    const lookback = Math.max(parseInt(params.lookback) || 20, 2);
    for (let i = lookback; i < candles.length; i++) {
      const window   = candles.slice(i - lookback, i);
      const prevHigh = Math.max(...window.map(c => c.high));
      const prevLow  = Math.min(...window.map(c => c.low));
      if (candles[i].high > prevHigh) buySignal[i]  = true;
      if (candles[i].low  < prevLow)  sellSignal[i] = true;
    }
  } else if (strategy === 'ma_rsi_combo') {
    const ma  = calcSMA(closes, parseInt(params.maPeriod) || 50);
    const rsi = calcRSI(closes, parseInt(params.rsiPeriod) || 14);
    const os  = params.rsiOversold   ?? 40;
    const ob  = params.rsiOverbought ?? 60;
    for (let i = 1; i < closes.length; i++) {
      if (ma[i] !== null && rsi[i] !== null && rsi[i-1] !== null) {
        if (closes[i] > ma[i] && rsi[i-1] <= os && rsi[i] > os) buySignal[i]  = true;
        if (closes[i] < ma[i] && rsi[i-1] <= ob && rsi[i] > ob) sellSignal[i] = true;
      }
    }
  }

  // ── Simulate trades ──────────────────────────────────────────────────────
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const price  = closes[i];
    const time   = candle.time;

    if (inTrade && entry) {
      let exitPrice  = null;
      let exitReason = null;

      // Stop loss: candle low touches or breaks through SL
      if (slPrice !== null && candle.low <= slPrice) {
        exitPrice  = slPrice;
        exitReason = 'SL';
      }
      // Take profit: candle high touches TP (only if SL not hit first)
      if (exitPrice === null && tpPrice !== null && candle.high >= tpPrice) {
        exitPrice  = tpPrice;
        exitReason = 'TP';
      }
      // Strategy sell signal
      if (exitPrice === null && sellSignal[i]) {
        exitPrice  = price;
        exitReason = 'Signal';
      }

      if (exitPrice !== null) {
        const pnlPct = (exitPrice - entry.price) / entry.price;
        const netPnl = entry.posSize * pnlPct - commission;
        capital     += netPnl;
        trades.push({
          entryTime:   entry.time,
          exitTime:    time,
          entryPrice:  entry.price,
          exitPrice,
          exitReason,
          pnl:         +netPnl.toFixed(2),
          pnlPct:      +(pnlPct * 100).toFixed(3),
          result:      netPnl >= 0 ? 'WIN' : 'LOSS',
          capitalAfter: +capital.toFixed(2),
          duration:    time - entry.time,
        });
        inTrade = false; entry = null; slPrice = null; tpPrice = null;
      }
    }

    if (!inTrade && buySignal[i]) {
      const posSize = posSizeType === 'fixed'
        ? Math.min(posSizeValue, capital)
        : capital * (posSizeValue / 100);
      let slP = null, tpP = null;
      if (slType === 'pips'    && slValue > 0) slP = price - slValue;
      if (slType === 'percent' && slValue > 0) slP = price * (1 - slValue / 100);
      if (tpType === 'pips'    && tpValue > 0) tpP = price + tpValue;
      if (tpType === 'percent' && tpValue > 0) tpP = price * (1 + tpValue / 100);
      inTrade = true;
      slPrice = slP;
      tpPrice = tpP;
      entry   = { price, time, posSize: Math.max(posSize, 0) };
    }

    equityCurve.push({ time, value: +capital.toFixed(2) });
  }

  // Force-close open trade at last bar
  if (inTrade && entry) {
    const last   = candles[candles.length - 1];
    const exitP  = last.close;
    const pnlPct = (exitP - entry.price) / entry.price;
    const netPnl = entry.posSize * pnlPct - commission;
    capital     += netPnl;
    trades.push({
      entryTime: entry.time, exitTime: last.time,
      entryPrice: entry.price, exitPrice: exitP, exitReason: 'End',
      pnl: +netPnl.toFixed(2), pnlPct: +(pnlPct * 100).toFixed(3),
      result: netPnl >= 0 ? 'WIN' : 'LOSS',
      capitalAfter: +capital.toFixed(2), duration: last.time - entry.time,
    });
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const wins   = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const winRate     = trades.length ? (wins.length / trades.length) * 100 : 0;
  const totalPnL    = capital - startCapital;
  const totalPnLPct = (totalPnL / startCapital) * 100;

  // Max drawdown in % and $
  let peak = startCapital, maxDrawdown = 0, maxDrawdownAmt = 0;
  for (const pt of equityCurve) {
    if (pt.value > peak) peak = pt.value;
    const ddAmt = peak - pt.value;
    const dd    = ddAmt / peak * 100;
    if (dd > maxDrawdown) { maxDrawdown = dd; maxDrawdownAmt = ddAmt; }
  }

  const rets    = trades.map(t => t.pnlPct / 100);
  const avgRet  = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const variance = rets.length ? rets.reduce((a, b) => a + (b - avgRet) ** 2, 0) / rets.length : 0;
  const sharpe   = variance > 0 ? (avgRet / Math.sqrt(variance)) * Math.sqrt(252) : 0;

  const grossProfit  = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss    = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWin  = wins.length   ? wins.reduce((a, t) => a + t.pnl, 0)   / wins.length   : 0;
  const avgLoss = losses.length ? losses.reduce((a, t) => a + t.pnl, 0) / losses.length : 0;
  const pnls    = trades.map(t => t.pnl);
  const bestTrade  = pnls.length ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length ? Math.min(...pnls) : 0;

  // Advanced stats
  const avgDurationSec = trades.length
    ? Math.round(trades.reduce((a, t) => a + t.duration, 0) / trades.length)
    : 0;

  let maxConsecWins = 0, maxConsecLosses = 0, curW = 0, curL = 0;
  for (const t of trades) {
    if (t.result === 'WIN') { curW++; curL = 0; if (curW > maxConsecWins) maxConsecWins = curW; }
    else                    { curL++; curW = 0; if (curL > maxConsecLosses) maxConsecLosses = curL; }
  }

  const recoveryFactor = maxDrawdownAmt > 0 ? totalPnL / maxDrawdownAmt : totalPnL > 0 ? 999 : 0;
  const expectancy     = trades.length ? totalPnL / trades.length : 0;

  // Buy & Hold comparison
  const bhEntry  = candles[0].close;
  const bhExit   = candles[candles.length - 1].close;
  const bhReturn = ((bhExit - bhEntry) / bhEntry) * 100;
  const bhPnL    = startCapital * (bhExit - bhEntry) / bhEntry;

  return {
    totalTrades:     trades.length,
    winningTrades:   wins.length,
    losingTrades:    losses.length,
    winRate:         +winRate.toFixed(2),
    totalPnL:        +totalPnL.toFixed(2),
    totalPnLPercent: +totalPnLPct.toFixed(2),
    maxDrawdown:     +maxDrawdown.toFixed(2),
    maxDrawdownAmt:  +maxDrawdownAmt.toFixed(2),
    sharpeRatio:     +sharpe.toFixed(3),
    bestTrade:       +bestTrade.toFixed(2),
    worstTrade:      +worstTrade.toFixed(2),
    avgWin:          +avgWin.toFixed(2),
    avgLoss:         +avgLoss.toFixed(2),
    profitFactor:    isFinite(profitFactor) ? +profitFactor.toFixed(3) : 999,
    finalCapital:    +capital.toFixed(2),
    avgDurationSec,
    maxConsecWins,
    maxConsecLosses,
    recoveryFactor:  isFinite(recoveryFactor) ? +recoveryFactor.toFixed(3) : 999,
    expectancy:      +expectancy.toFixed(2),
    buyAndHold: { returnPct: +bhReturn.toFixed(2), pnl: +bhPnL.toFixed(2) },
    equityCurve,
    trades,
  };
}

// GET /api/charts/backtest
router.get('/backtest', async (req, res) => {
  const {
    symbol   = 'XAU/USD',
    interval = '1h',
    strategy = 'ema_cross',
    startDate,
    endDate,
    capital  = '10000',
  } = req.query;

  let params = {};
  try {
    params = req.query.params ? JSON.parse(req.query.params) : {};
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid params JSON' });
  }

  const riskMgmt = {
    slType:        req.query.slType        || 'none',
    slValue:       parseFloat(req.query.slValue)       || 0,
    tpType:        req.query.tpType        || 'none',
    tpValue:       parseFloat(req.query.tpValue)       || 0,
    posSizeType:   req.query.posSizeType   || 'percent',
    posSizeValue:  parseFloat(req.query.posSizeValue)  || 100,
    maxOpenTrades: parseInt(req.query.maxOpenTrades)   || 1,
    commission:    parseFloat(req.query.commission)    || 0,
  };

  const VALID_STRATEGIES = ['ema_cross', 'rsi_oversold', 'macd', 'bollinger', 'support_resistance', 'ma_rsi_combo'];
  if (!VALID_STRATEGIES.includes(strategy)) {
    return res.status(400).json({ success: false, error: `Invalid strategy. Use: ${VALID_STRATEGIES.join(', ')}` });
  }

  try {
    const allCandles = await fetchTwelveData(symbol, interval, 5000);
    let candles = allCandles;
    if (startDate) {
      const start = Math.floor(new Date(startDate).getTime() / 1000);
      candles = candles.filter(c => c.time >= start);
    }
    if (endDate) {
      const end = Math.floor(new Date(endDate).getTime() / 1000);
      candles = candles.filter(c => c.time <= end);
    }
    if (candles.length < 30) {
      return res.status(422).json({ success: false, error: 'Not enough data for the selected range. Try a wider date range or a different interval.' });
    }
    const startCapital = Math.min(Math.max(parseFloat(capital) || 10000, 100), 10_000_000);
    const results = runBacktest(candles, strategy, params, startCapital, riskMgmt);
    res.json({ success: true, data: results, meta: { symbol, interval, strategy, candleCount: candles.length } });
  } catch (err) {
    console.error('[charts/backtest]', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
