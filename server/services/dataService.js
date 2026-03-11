import axios from 'axios';
import NodeCache from 'node-cache';
import { getApiKeyManager } from '../utils/apiKeyManager.js';
import ApiKeyManager from '../utils/apiKeyManager.js';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const keyManager = getApiKeyManager();

const BASE_URL = 'https://api.polygon.io';

// ── Yahoo Finance fallback ──────────────────────────────────────────────────
// Maps days → Yahoo range string
function daysToYahooRange(days) {
  if (days <= 7)   return '5d';
  if (days <= 30)  return '1mo';
  if (days <= 90)  return '3mo';
  if (days <= 180) return '6mo';
  return '1y';
}

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

async function fetchFromYahoo(ticker, days = 90) {
  const range = daysToYahooRange(days);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
  const response = await axios.get(url, {
    params: { interval: '1d', range, includePrePost: false },
    headers: YAHOO_HEADERS,
    timeout: 15000,
  });

  const result = response.data?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance: no data for ${ticker}`);

  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  const closes = quotes.close || [];
  const opens  = quotes.open  || [];
  const highs  = quotes.high  || [];
  const lows   = quotes.low   || [];
  const vols   = quotes.volume || [];

  const data = timestamps.map((ts, i) => ({
    date:      new Date(ts * 1000).toISOString().split('T')[0],
    timestamp: ts * 1000,
    open:      opens[i]  ?? null,
    high:      highs[i]  ?? null,
    low:       lows[i]   ?? null,
    close:     closes[i] ?? null,
    volume:    vols[i]   ?? null,
    value:     closes[i] ?? null,
  })).filter(d => d.close !== null);

  console.log(`✅ Yahoo Finance: ${data.length} points for ${ticker} (${range})`);
  return data;
}

// Fetch current spot price from Yahoo (single quote)
async function fetchSpotFromYahoo(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
  const response = await axios.get(url, {
    params: { interval: '1d', range: '5d', includePrePost: false },
    headers: YAHOO_HEADERS,
    timeout: 10000,
  });
  const result = response.data?.chart?.result?.[0];
  if (!result) return null;
  return result.meta?.regularMarketPrice ?? null;
}

// ── Gold spot via XAUUSD or GC=F ───────────────────────────────────────────
export async function getGoldSpotPrice() {
  const cacheKey = 'gold_spot_price';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Try GC=F (gold futures — trades near spot price)
  try {
    const price = await fetchSpotFromYahoo('GC=F');
    if (price) {
      cache.set(cacheKey, { price, source: 'Yahoo Finance (GC=F futures)', currency: 'USD' }, 120);
      console.log(`✅ Gold spot (GC=F): $${price}/oz`);
      return { price, source: 'Yahoo Finance (GC=F futures)', currency: 'USD' };
    }
  } catch (e) { console.warn('GC=F failed, trying XAUUSD:', e.message); }

  // Fallback: XAUUSD forex
  try {
    const price = await fetchSpotFromYahoo('XAUUSD=X');
    if (price) {
      cache.set(cacheKey, { price, source: 'Yahoo Finance (XAUUSD)', currency: 'USD' }, 120);
      return { price, source: 'Yahoo Finance (XAUUSD)', currency: 'USD' };
    }
  } catch (e) { console.warn('XAUUSD failed:', e.message); }

  return null;
}

// Generic market data fetch — any Yahoo Finance symbol (CL=F, ^VIX, DX-Y.NYB, etc.)
export async function getMarketData(symbol, limit = 90) {
  const cacheKey = `market_${symbol}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  try {
    const data = await fetchFromYahoo(symbol, limit);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching market data for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch ${symbol}: ${error.message}`);
  }
}

// Live price snapshot — fetches only current price for each symbol, no chart history
// Uses Yahoo meta.regularMarketPrice — much faster than full chart fetch
// Short cache: 8 seconds so rapid polling doesn't hammer Yahoo
const LIVE_INSTRUMENTS = [
  { id: 'gold',  symbol: 'GC=F',       label: 'Gold Futures',      unit: '$/oz'    },
  { id: 'gld',   symbol: 'GLD',        label: 'Gold ETF (GLD)',     unit: '$/share' },
  { id: 'dxy',   symbol: 'DX-Y.NYB',   label: 'US Dollar Index',   unit: 'pts'     },
  { id: 'tlt',   symbol: 'TLT',        label: '20Y Treasury Bonds', unit: '$/share' },
  { id: 'spy',   symbol: 'SPY',        label: 'S&P 500 ETF',        unit: '$/share' },
  { id: 'oil',   symbol: 'CL=F',       label: 'WTI Crude Oil',      unit: '$/bbl'   },
  { id: 'vix',   symbol: '^VIX',       label: 'CBOE VIX Index',     unit: 'pts'     },
  { id: 'btc',   symbol: 'BTC-USD',    label: 'Bitcoin',            unit: '$/coin'  },
];

async function fetchLivePrice(symbol) {
  const enc = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${enc}`;
  const res = await axios.get(url, {
    params: { interval: '1m', range: '1d', includePrePost: false },
    headers: YAHOO_HEADERS,
    timeout: 8000,
  });
  const meta = res.data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price:         meta.regularMarketPrice ?? null,
    prevClose:     meta.chartPreviousClose ?? meta.previousClose ?? null,
    dayHigh:       meta.regularMarketDayHigh ?? null,
    dayLow:        meta.regularMarketDayLow ?? null,
    open:          meta.regularMarketOpen ?? null,
    volume:        meta.regularMarketVolume ?? null,
    marketState:   meta.marketState ?? 'CLOSED',  // PRE, REGULAR, POST, CLOSED
    exchangeName:  meta.exchangeName ?? '',
    timestamp:     Date.now(),
  };
}

export async function getLivePrices() {
  const cacheKey = 'live_prices';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const results = await Promise.allSettled(
    LIVE_INSTRUMENTS.map(inst => fetchLivePrice(inst.symbol))
  );

  const prices = {};
  LIVE_INSTRUMENTS.forEach((inst, i) => {
    if (results[i].status === 'fulfilled' && results[i].value) {
      const d = results[i].value;
      const change = d.price != null && d.prevClose != null ? +(d.price - d.prevClose).toFixed(4) : null;
      const changePct = change != null && d.prevClose ? +(change / d.prevClose * 100).toFixed(3) : null;
      prices[inst.id] = {
        ...inst,
        ...d,
        change,
        changePct,
      };
    } else {
      prices[inst.id] = { ...inst, price: null, error: true };
    }
  });

  cache.set(cacheKey, prices, 8); // cache only 8 seconds
  console.log(`✅ Live prices fetched for ${Object.keys(prices).length} instruments`);
  return prices;
}

/**
 * Make API call with automatic key rotation on rate limit
 */
async function makeApiCallWithFallback(url, params = {}, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyInfo = keyManager.getCurrentKey();
    
    if (!keyInfo || !keyInfo.key) {
      throw new Error('No API keys available');
    }
    
    try {
      const response = await axios.get(url, {
        params: {
          ...params,
          apiKey: keyInfo.key
        }
      });
      
      keyManager.markRequestSuccess(keyInfo.index);
      return response;
      
    } catch (error) {
      lastError = error;
      
      if (ApiKeyManager.isRateLimitError(error)) {
        console.log(`⚠️  Rate limit hit with key #${keyInfo.index + 1}, rotating...`);
        keyManager.markCurrentKeyAsLimited();
        
        if (attempt < maxRetries - 1) {
          console.log(`🔄 Retrying with next key (attempt ${attempt + 2}/${maxRetries})...`);
          continue;
        }
      } else {
        keyManager.markRequestFailed(keyInfo.index, false);
        throw error;
      }
    }
  }
  
  throw lastError || new Error('All API keys exhausted or rate limited');
}

// Get gold prices — Polygon primary, Yahoo Finance fallback
export async function getGoldPrices(timespan = 'day', limit = 90) {
  const cacheKey = `gold_${timespan}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) { console.log('📦 Returning cached gold data'); return cached; }

  // Try Polygon first
  try {
    const ticker = 'GLD';
    const to   = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await makeApiCallWithFallback(
      `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/${timespan}/${from}/${to}`,
      { adjusted: true, sort: 'asc', limit: 5000 }
    );
    if (!response.data?.results) throw new Error('Invalid Polygon response');
    const data = response.data.results.map(item => ({
      date: new Date(item.t).toISOString().split('T')[0],
      timestamp: item.t, open: item.o, high: item.h,
      low: item.l, close: item.c, volume: item.v, value: item.c,
    }));
    cache.set(cacheKey, data);
    console.log(`✅ Fetched ${data.length} gold price points (Polygon)`);
    return data;
  } catch (polygonErr) {
    console.warn(`⚠️  Polygon gold failed (${polygonErr.message}), trying Yahoo Finance...`);
  }

  // Yahoo Finance fallback — GLD ETF
  try {
    const data = await fetchFromYahoo('GLD', limit);
    cache.set(cacheKey, data);
    return data;
  } catch (yahooErr) {
    console.error('❌ Both Polygon and Yahoo failed for gold:', yahooErr.message);
    throw new Error(`Failed to fetch gold data: ${yahooErr.message}`);
  }
}

// Get equity data — Polygon primary, Yahoo Finance fallback
export async function getEquityData(ticker, timespan = 'day', limit = 90) {
  const cacheKey = `equity_${ticker}_${timespan}_${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;

  // Try Polygon first
  try {
    const to   = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await makeApiCallWithFallback(
      `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/${timespan}/${from}/${to}`,
      { adjusted: true, sort: 'asc', limit: 5000 }
    );
    if (!response.data?.results) throw new Error('Invalid Polygon response');
    const data = response.data.results.map(item => ({
      date: new Date(item.t).toISOString().split('T')[0],
      timestamp: item.t, open: item.o, high: item.h,
      low: item.l, close: item.c, volume: item.v, value: item.c,
    }));
    cache.set(cacheKey, data);
    console.log(`✅ Fetched ${data.length} data points for ${ticker} (Polygon)`);
    return data;
  } catch (polygonErr) {
    console.warn(`⚠️  Polygon ${ticker} failed (${polygonErr.message}), trying Yahoo Finance...`);
  }

  // Yahoo Finance fallback
  try {
    const data = await fetchFromYahoo(ticker, limit);
    cache.set(cacheKey, data);
    return data;
  } catch (yahooErr) {
    console.error(`❌ Both Polygon and Yahoo failed for ${ticker}:`, yahooErr.message);
    throw new Error(`Failed to fetch ${ticker} data: ${yahooErr.message}`);
  }
}

// Get forex data
export async function getForexData(pair, timespan = 'day', limit = 90) {
  const cacheKey = `forex_${pair}_${timespan}_${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;

  try {
    const multiplier = 1;
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.get(
      `${BASE_URL}/v2/aggs/ticker/C:${pair}/range/${multiplier}/${timespan}/${from}/${to}`,
      {
        params: {
          apiKey: getApiKey(),
          adjusted: true,
          sort: 'asc',
          limit: 5000
        }
      }
    );

    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from Polygon API');
    }

    const data = response.data.results.map(item => ({
      date: new Date(item.t).toISOString().split('T')[0],
      timestamp: item.t,
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
      value: item.c
    }));

    cache.set(cacheKey, data);
    console.log(`✅ Fetched ${data.length} forex data points for ${pair}`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error fetching forex ${pair} data:`, error.message);
    throw new Error(`Failed to fetch forex ${pair} data: ${error.message}`);
  }
}

// Get commodity data
export async function getCommodityData(symbol, timespan = 'day', limit = 90) {
  return await getEquityData(symbol, timespan, limit);
}

// Get multiple economic indicators
export async function getEconomicIndicators() {
  const cacheKey = 'economic_indicators';
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;

  try {
    // Fetch multiple indicators in parallel
    const [goldData, spyData, usdData, oilData] = await Promise.all([
      getGoldPrices('day', 90).catch(() => null),
      getEquityData('SPY', 'day', 90).catch(() => null),
      getForexData('EURUSD', 'day', 90).catch(() => null),
      getEquityData('USO', 'day', 90).catch(() => null) // Oil ETF
    ]);

    const data = {
      gold: goldData,
      spy: spyData,
      usd: usdData,
      oil: oilData,
      lastUpdated: new Date().toISOString()
    };

    cache.set(cacheKey, data);
    console.log('✅ Fetched economic indicators dashboard');
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching economic indicators:', error.message);
    throw new Error(`Failed to fetch economic indicators: ${error.message}`);
  }
}
