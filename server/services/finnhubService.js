/**
 * FinnhubService
 * ─────────────────────────────────────────────────────────────
 * - Opens a single WebSocket to wss://ws.finnhub.io and subscribes to all
 *   TRACKED_SYMBOLS.
 * - Caches the latest price for every symbol.
 * - Emits 'price' events so the WS broadcast server can forward them to
 *   connected frontend clients.
 * - Provides REST fallback via getQuote() / seedFromRest().
 */

import EventEmitter from 'events';
import WebSocket from 'ws';
import axios from 'axios';

// ── Tracked symbols ──────────────────────────────────────────────────────────
export const TRACKED_SYMBOLS = [
  // Stocks
  { symbol: 'AAPL',              display: 'AAPL',     label: 'Apple',         category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'TSLA',              display: 'TSLA',     label: 'Tesla',         category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'MSFT',              display: 'MSFT',     label: 'Microsoft',     category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'AMZN',              display: 'AMZN',     label: 'Amazon',        category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'NVDA',              display: 'NVDA',     label: 'NVIDIA',        category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'GOOGL',             display: 'GOOGL',    label: 'Alphabet',      category: 'stocks', unit: '$',  dec: 2 },
  // Market Terminal ETFs/indices (also used by EconomicDashboard)
  { symbol: 'GLD',               display: 'GLD',      label: 'Gold ETF',      category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'TLT',               display: 'TLT',      label: '20Y Treasuries',category: 'stocks', unit: '$',  dec: 2 },
  { symbol: 'SPY',               display: 'SPY',      label: 'S&P 500 ETF',   category: 'stocks', unit: '$',  dec: 2 },
  // Forex
  { symbol: 'OANDA:EUR_USD',     display: 'EUR/USD',  label: 'Euro / USD',    category: 'forex',  unit: '',   dec: 5 },
  { symbol: 'OANDA:GBP_USD',     display: 'GBP/USD',  label: 'Pound / USD',   category: 'forex',  unit: '',   dec: 5 },
  { symbol: 'OANDA:USD_JPY',     display: 'USD/JPY',  label: 'USD / Yen',     category: 'forex',  unit: '',   dec: 3 },
  // NOTE: OANDA:XAU_USD (spot gold) and OANDA:WTICO_USD (spot WTI) are NOT tracked here.
  // The dashboard uses Yahoo Finance GC=F / CL=F futures for gold and oil — mixing OANDA
  // OTC spot prices (~$10-20 basis) with futures causes persistent price discrepancies.
  // Crypto
  { symbol: 'BINANCE:BTCUSDT',   display: 'BTC/USDT', label: 'Bitcoin',       category: 'crypto', unit: '$',  dec: 2 },
  { symbol: 'BINANCE:ETHUSDT',   display: 'ETH/USDT', label: 'Ethereum',      category: 'crypto', unit: '$',  dec: 2 },
  { symbol: 'BINANCE:XRPUSDT',   display: 'XRP/USDT', label: 'Ripple',        category: 'crypto', unit: '$',  dec: 4 },
  { symbol: 'BINANCE:BNBUSDT',   display: 'BNB/USDT', label: 'BNB',           category: 'crypto', unit: '$',  dec: 2 },
  { symbol: 'BINANCE:SOLUSDT',   display: 'SOL/USDT', label: 'Solana',        category: 'crypto', unit: '$',  dec: 2 },
];

const FINNHUB_WS  = 'wss://ws.finnhub.io';
const FINNHUB_REST = 'https://finnhub.io/api/v1';
const REST_CACHE_TTL = 30_000; // 30 s
const MAX_RECONNECT_DELAY = 30_000;

class FinnhubService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // many WS clients can attach listeners
    this.ws          = null;
    this.prices      = {};   // symbol → price record
    this.restCache   = {};   // symbol → { data, ts }
    this.reconnectDelay = 2_000;
    this.reconnectTimer = null;
    this.connected      = false;
    this.isConnecting   = false;
  }

  _key() { return process.env.FINNHUB_API_KEY || ''; }

  // ── WebSocket ────────────────────────────────────────────────────────────

  connect() {
    if (this.isConnecting || this.connected) return;
    const key = this._key();
    if (!key) { console.warn('⚠️  FINNHUB_API_KEY not set — WS disabled'); return; }

    this.isConnecting = true;
    console.log('🔌 Connecting to Finnhub WebSocket…');

    this.ws = new WebSocket(`${FINNHUB_WS}?token=${key}`);

    this.ws.on('open', () => {
      this.isConnecting  = false;
      this.connected     = true;
      this.reconnectDelay = 2_000;
      console.log('✅ Finnhub WS connected');
      this.emit('status', 'connected');
      TRACKED_SYMBOLS.forEach(({ symbol }) =>
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }))
      );
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          msg.data.forEach(t => this._onTrade(t));
        } else if (msg.type === 'ping') {
          this.ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (_) { /* ignore malformed frames */ }
    });

    this.ws.on('error', (err) => {
      console.error('❌ Finnhub WS error:', err.message);
      this.connected   = false;
      this.isConnecting = false;
      this.emit('status', 'error');
    });

    this.ws.on('close', () => {
      this.connected   = false;
      this.isConnecting = false;
      this.emit('status', 'disconnected');
      console.warn(`⚠️  Finnhub WS closed — reconnecting in ${this.reconnectDelay}ms`);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
        this.connect();
      }, this.reconnectDelay);
    });
  }

  _onTrade({ p: price, s: symbol, t: timestamp, v: volume }) {
    if (!price || !symbol) return;
    const prev      = this.prices[symbol] || {};
    const prevClose = prev.prevClose ?? prev.price ?? null;   // best known baseline
    const change    = prevClose != null ? +(price - prevClose).toFixed(6) : null;
    const changePct = prevClose != null && prevClose !== 0
      ? +(change / prevClose * 100).toFixed(4) : null;

    this.prices[symbol] = {
      ...prev,
      price,
      change,
      changePct,
      volume,
      timestamp,
      lastUpdate: Date.now(),
      source: 'ws',
    };

    this.emit('price', { symbol, price, change, changePct, volume, ts: Date.now() });
  }

  // ── REST seeding ─────────────────────────────────────────────────────────

  /** Populate price cache from REST before WS starts delivering trades */
  async seedFromRest() {
    const key = this._key();
    if (!key) return;
    console.log('📊 Seeding Finnhub prices via REST…');

    // 5 symbols per batch to avoid hammering rate limits
    const batches = [];
    for (let i = 0; i < TRACKED_SYMBOLS.length; i += 5)
      batches.push(TRACKED_SYMBOLS.slice(i, i + 5));

    for (const batch of batches) {
      await Promise.allSettled(batch.map(async ({ symbol }) => {
        try {
          const d = await this._restQuoteRaw(symbol, key);
          if (d?.c) {
            this.prices[symbol] = {
              ...(this.prices[symbol] || {}),
              price:    d.c,
              change:   d.d,
              changePct: d.dp,
              high:     d.h,
              low:      d.l,
              open:     d.o,
              prevClose: d.pc,
              timestamp: d.t ? d.t * 1000 : Date.now(),
              lastUpdate: Date.now(),
              source: 'rest',
            };
          }
        } catch (_) { /* ignore individual symbol failures */ }
      }));
      await new Promise(r => setTimeout(r, 250)); // respect rate limits
    }
    console.log(`✅ REST seed: ${Object.keys(this.prices).length} symbols loaded`);
    this.emit('snapshot', this.prices);
  }

  async _restQuoteRaw(symbol, key) {
    const res = await axios.get(`${FINNHUB_REST}/quote`, {
      params: { symbol, token: key },
      timeout: 8_000,
    });
    return res.data;
  }

  /** Single-symbol REST quote (with short cache for repeated calls) */
  async getQuote(symbol) {
    const key = this._key();
    if (!key) throw new Error('FINNHUB_API_KEY not configured');

    const cached = this.restCache[symbol];
    if (cached && Date.now() - cached.ts < REST_CACHE_TTL) return cached.data;

    const d = await this._restQuoteRaw(symbol, key);
    if (!d || d.c === 0) throw new Error(`No data for ${symbol}`);

    const result = {
      symbol,
      price:     d.c,
      change:    d.d,
      changePct: d.dp,
      high:      d.h,
      low:       d.l,
      open:      d.o,
      prevClose: d.pc,
      timestamp: d.t ? d.t * 1000 : Date.now(),
    };

    this.restCache[symbol] = { data: result, ts: Date.now() };

    // Also update live price cache
    this.prices[symbol] = { ...(this.prices[symbol] || {}), ...result, source: 'rest', lastUpdate: Date.now() };

    return result;
  }

  // ── Accessors ────────────────────────────────────────────────────────────

  getPriceSnapshot() { return this.prices; }
  getStatus()        { return this.connected ? 'connected' : 'disconnected'; }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.terminate();
    this.connected = false;
  }
}

export const finnhubService = new FinnhubService();
