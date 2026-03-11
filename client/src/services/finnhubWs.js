/**
 * finnhubWs.js — singleton WebSocket client
 * ─────────────────────────────────────────────────────────────
 * Connects to wss://<backend>/ws/market.
 * In dev, Vite proxies /ws → localhost:5000 so window.location.host works.
 * In production (Vercel), VITE_API_URL must point to the Render backend.
 * Receives:
 *   { type: 'snapshot', data: {...}, symbols: [...], status, ts }
 *   { type: 'price', data: { symbol, price, change, changePct, volume }, ts }
 *   { type: 'status', status: 'connected' | 'disconnected', ts }
 *
 * Usage:
 *   import { finnhubWs } from './finnhubWs';
 *   finnhubWs.connect();
 *   const unsub = finnhubWs.onPrice(({ type, prices, symbol, data }) => { ... });
 *   const unsubStatus = finnhubWs.onStatus((status) => { ... });
 *   // cleanup: unsub(); unsubStatus();
 */

import { API_URL } from '../config/api';

const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000];

class FinnhubWsClient {
  constructor() {
    this.ws                = null;
    this.prices            = {};   // symbol → latest data
    this.symbols           = [];   // TRACKED_SYMBOLS metadata from server
    this.status            = 'idle';
    this.reconnectAttempt  = 0;
    this.reconnectTimer    = null;
    this.manualClose       = false;
    this._priceListeners   = new Set();
    this._statusListeners  = new Set();
  }

  /** Build WS URL — works in both dev (Vite proxy) and production (Render) */
  _url() {
    // Only use the explicit env var — NOT the localhost fallback.
    // If VITE_API_URL is not set we're in dev and Vite's proxy handles /ws.
    const explicitApi = import.meta.env.VITE_API_URL;
    if (explicitApi) {
      // https://... → wss://...   |   http://... → ws://...
      return explicitApi.replace(/^http/, 'ws') + '/ws/market';
    }
    // Dev: let Vite proxy forward /ws → localhost:5000
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/ws/market`;
  }

  connect() {
    if (this.ws &&
        (this.ws.readyState === WebSocket.OPEN ||
         this.ws.readyState === WebSocket.CONNECTING)) return;

    this.manualClose = false;
    this._setStatus('connecting');

    try { this.ws = new WebSocket(this._url()); }
    catch (_) { this._setStatus('error'); this._scheduleReconnect(); return; }

    this.ws.onopen  = () => { this.reconnectAttempt = 0; this._setStatus('connected'); };
    this.ws.onclose = () => { if (!this.manualClose) { this._setStatus('disconnected'); this._scheduleReconnect(); } };
    this.ws.onerror = ()  => this._setStatus('error');
    this.ws.onmessage = ({ data }) => {
      try { this._handle(JSON.parse(data)); } catch (_) {}
    };
  }

  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
    this._setStatus('idle');
  }

  _handle(msg) {
    if (msg.type === 'snapshot') {
      this.prices  = msg.data  || {};
      this.symbols = msg.symbols || this.symbols;
      this._notifyPrice({ type: 'snapshot', prices: this.prices, symbols: this.symbols });
    } else if (msg.type === 'price') {
      const u = msg.data;
      if (u?.symbol) {
        this.prices[u.symbol] = { ...(this.prices[u.symbol] || {}), ...u, lastUpdate: msg.ts };
        this._notifyPrice({ type: 'update', symbol: u.symbol, data: this.prices[u.symbol] });
      }
    } else if (msg.type === 'status') {
      // Finnhub upstream status — propagate as a sub-status
      this._notifyPrice({ type: 'upstreamStatus', status: msg.status });
    }
  }

  _setStatus(s) {
    this.status = s;
    this._statusListeners.forEach(cb => cb(s));
  }

  _notifyPrice(payload) {
    this._priceListeners.forEach(cb => cb(payload));
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** Subscribe to price / snapshot events. Returns unsub function. */
  onPrice(cb) {
    this._priceListeners.add(cb);
    // Immediately deliver current snapshot if we already have data
    if (Object.keys(this.prices).length > 0) {
      cb({ type: 'snapshot', prices: this.prices, symbols: this.symbols });
    }
    return () => this._priceListeners.delete(cb);
  }

  /** Subscribe to WS connection status. Returns unsub function. */
  onStatus(cb) {
    this._statusListeners.add(cb);
    cb(this.status); // immediate
    return () => this._statusListeners.delete(cb);
  }

  getPrices()  { return this.prices;  }
  getSymbols() { return this.symbols; }
  getStatus()  { return this.status;  }
}

// Singleton — one WS connection is shared across all components
export const finnhubWs = new FinnhubWsClient();
