import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, Radio, Wifi } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import DataChart from './DataChart';
import DailyBrief from './DailyBrief';

// ── TradingView gold chart ─────────────────────────────────────────────────
const TV_SCRIPT_URL = 'https://s3.tradingview.com/tv.js';
let tvScriptReady = false;
function loadTvScript(cb) {
  if (tvScriptReady && window.TradingView) { cb(); return; }
  const existing = document.querySelector(`script[src="${TV_SCRIPT_URL}"]`);
  if (existing) {
    const t = setInterval(() => { if (window.TradingView) { clearInterval(t); tvScriptReady = true; cb(); } }, 80);
    return;
  }
  const s = document.createElement('script');
  s.src = TV_SCRIPT_URL; s.async = true;
  s.onload = () => { tvScriptReady = true; cb(); };
  document.head.appendChild(s);
}

// tf label → TradingView interval string
const TF_TO_TV = { '1W': '60', '1M': '240', '3M': 'D', '6M': 'D', '1Y': 'W' };

const ECO_SYMBOLS = [
  { group: 'Precious Metals', items: [
    { label: 'XAU/USD (Gold)',    tv: 'OANDA:XAUUSD'    },
    { label: 'XAG/USD (Silver)',  tv: 'OANDA:XAGUSD'    },
    { label: 'XPT/USD (Platinum)',tv: 'OANDA:XPTUSD'    },
  ]},
  { group: 'Forex', items: [
    { label: 'EUR/USD', tv: 'OANDA:EURUSD' },
    { label: 'GBP/USD', tv: 'OANDA:GBPUSD' },
    { label: 'USD/JPY', tv: 'OANDA:USDJPY' },
    { label: 'USD/CHF', tv: 'OANDA:USDCHF' },
    { label: 'AUD/USD', tv: 'OANDA:AUDUSD' },
    { label: 'DXY',     tv: 'TVC:DXY'     },
  ]},
  { group: 'Indices', items: [
    { label: 'S&P 500',  tv: 'SP:SPX'       },
    { label: 'NASDAQ',   tv: 'NASDAQ:NDX'   },
    { label: 'DOW',      tv: 'DJ:DJI'       },
    { label: 'VIX',      tv: 'CBOE:VIX'     },
  ]},
  { group: 'Commodities', items: [
    { label: 'WTI Oil',   tv: 'TVC:USOIL'   },
    { label: 'Brent Oil', tv: 'TVC:UKOIL'   },
    { label: 'Natural Gas', tv: 'TVC:NATGAS'},
    { label: 'Copper',    tv: 'COMEX:HG1!'  },
  ]},
  { group: 'Crypto', items: [
    { label: 'BTC/USD', tv: 'BINANCE:BTCUSDT' },
    { label: 'ETH/USD', tv: 'BINANCE:ETHUSDT' },
  ]},
  { group: 'US Stocks', items: [
    { label: 'Apple (AAPL)',   tv: 'NASDAQ:AAPL' },
    { label: 'Tesla (TSLA)',   tv: 'NASDAQ:TSLA' },
    { label: 'NVIDIA (NVDA)',  tv: 'NASDAQ:NVDA' },
    { label: 'S&P ETF (SPY)', tv: 'AMEX:SPY'    },
    { label: 'Gold ETF (GLD)', tv: 'AMEX:GLD'   },
    { label: 'TLT Bonds',     tv: 'NASDAQ:TLT'  },
  ]},
];
const ALL_ECO = ECO_SYMBOLS.flatMap(g => g.items);

function EcoSymbolPicker({ symbol, onChange, theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = ALL_ECO.find(s => s.tv === symbol) ?? ALL_ECO[0];

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 30 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
          borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.bg,
          color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 160,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{cur.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke={theme.textMuted ?? theme.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, minWidth: 200, maxHeight: 340,
          overflowY: 'auto', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
        }}>
          {ECO_SYMBOLS.map(g => (
            <div key={g.group}>
              <div style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted ?? theme.muted }}>
                {g.group}
              </div>
              {g.items.map(s => (
                <button
                  key={s.tv}
                  onClick={() => { onChange(s.tv); setOpen(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px',
                    fontSize: 13, border: 'none', background: 'transparent', cursor: 'pointer',
                    color: s.tv === symbol ? '#10b981' : theme.text,
                    fontWeight: s.tv === symbol ? 700 : 400,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TvEcoChart({ symbol, tf }) {
  const theme = useTheme();
  const isDark = theme.bg === '#0a0a0a' || (theme.bg || '').startsWith('#0') || (theme.bg || '').startsWith('#1');
  const widgetRef = useRef(null);
  const containerId = 'tv_eco_chart';

  const init = useCallback(() => {
    if (!window.TradingView) return;
    if (widgetRef.current) { try { widgetRef.current.remove(); } catch (_) {} widgetRef.current = null; }
    const el = document.getElementById(containerId);
    if (!el) return;
    widgetRef.current = new window.TradingView.widget({
      container_id: containerId,
      autosize: true,
      symbol,
      interval: TF_TO_TV[tf] ?? 'D',
      timezone: 'Etc/UTC',
      theme: isDark ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      toolbar_bg: isDark ? '#161616' : '#ffffff',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      withdateranges: true,
    });
  }, [symbol, tf, isDark]);

  useEffect(() => { loadTvScript(init); }, [init]);
  useEffect(() => () => { if (widgetRef.current) { try { widgetRef.current.remove(); } catch (_) {} } }, []);

  return <div id={containerId} style={{ height: '100%', width: '100%' }} />;
}
import { fetchGoldData, fetchEquityData, fetchMarketData, fetchLivePrices } from '../services/dataApi';
import { finnhubWs } from '../services/finnhubWs';

// ── Config ─────────────────────────────────────────────────────────────────
// Yahoo Finance polls less frequently now — Finnhub WS handles real-time prices
const LIVE_POLL_MS   = 10000;   // poll Yahoo every 10s (fast REST fallback when WS is idle)
const CHART_REFRESH_MS = 300000; // re-fetch period chart data every 5 min (keeps 3M High/Low/Chg current)
const FLASH_MS       = 800;     // price flash duration

// Maps Finnhub WebSocket symbols → EconomicDashboard liveData keys.
// OANDA:XAU_USD streams real-time spot gold via Finnhub WS. Yahoo Finance GC=F
// REST poll (every 10s) continues to seed prevClose / dayHigh / dayLow context;
// WS ticks (<10s old) take precedence for the live price.
const FINNHUB_TO_DASH = {
  'OANDA:XAU_USD':   'gold',
  'GLD':             'gld',
  'TLT':             'tlt',
  'SPY':             'spy',
  'BINANCE:BTCUSDT': 'btc',
};

const TIMEFRAMES = [
  { label: '1W', days: 7  },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

// LIVE instrument IDs match the server's LIVE_INSTRUMENTS ids
const CORR_ASSETS = [
  { id: 'dxy', label: 'US Dollar Index',   symbol: 'DX-Y.NYB', displayTicker: 'DXY', color: '#ef4444', unit: 'pts',   unitLabel: 'index pts', note: 'Inverse to gold — stronger USD suppresses prices', useMarket: true  },
  { id: 'tlt', label: '20Y Treasury Bonds',symbol: 'TLT',       displayTicker: 'TLT', color: '#3b82f6', unit: '$',     unitLabel: 'ETF/share', note: 'Rising bond prices signal falling yields — bullish for gold', useMarket: false },
  { id: 'spy', label: 'S&P 500',           symbol: 'SPY',       displayTicker: 'SPY', color: '#22c55e', unit: '$',     unitLabel: 'ETF/share', note: 'Risk-on rallies can rotate capital away from gold',  useMarket: false },
  { id: 'oil', label: 'WTI Crude Oil',     symbol: 'CL=F',      displayTicker: 'WTI', color: '#f97316', unit: '$/bbl', unitLabel: 'per barrel',note: 'Inflation proxy — oil and gold often move together',    useMarket: true  },
  { id: 'vix', label: 'CBOE VIX Index',    symbol: '^VIX',      displayTicker: 'VIX', color: '#a855f7', unit: 'pts',   unitLabel: 'volatility',note: 'Elevated fear drives safe-haven demand for gold', useMarket: true },
  { id: 'btc', label: 'Bitcoin',           symbol: 'BTC-USD',   displayTicker: 'BTC', color: '#f59e0b', unit: '$',     unitLabel: '$/coin',    note: 'Inflation hedge overlap — correlation varies by regime', useMarket: true },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function pearsonCorr(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  const ax = a.slice(-n), bx = b.slice(-n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  const num = ax.reduce((s, v, i) => s + (v - ma) * (bx[i] - mb), 0);
  const den = Math.sqrt(ax.reduce((s, v) => s + (v - ma) ** 2, 0) * bx.reduce((s, v) => s + (v - mb) ** 2, 0));
  return den === 0 ? null : Math.round((num / den) * 100) / 100;
}

function calcPeriodStats(data) {
  if (!data || data.length === 0) return null;
  const closes = data.map(d => d.close).filter(Boolean);
  const highs   = data.map(d => d.high).filter(Boolean);
  const lows    = data.map(d => d.low).filter(Boolean);
  if (!closes.length) return null;
  return {
    periodHigh:   +Math.max(...highs).toFixed(2),
    periodLow:    +Math.min(...lows).toFixed(2),
    periodChange: +(((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2),
    firstClose:   closes[0],
  };
}

function fmtPrice(v, unit = '$') {
  if (v == null) return '—';
  return unit === '$' ? `$${v.toFixed(2)}` : v.toFixed(2);
}

function fmtPct(v) {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

async function fetchCorrAsset(asset, days) {
  if (asset.useMarket) return fetchMarketData(asset.symbol, days);
  return fetchEquityData(asset.symbol, days);
}

// ── Price Flash Hook ────────────────────────────────────────────────────────
// Returns a flashMap: { id: 'up'|'down'|null }
function usePriceFlash(liveData, idList) {
  const prevRef = useRef({});
  const [flashMap, setFlashMap] = useState({});
  const timerRef = useRef({});

  useEffect(() => {
    if (!liveData) return;
    const newFlash = {};
    idList.forEach(id => {
      const curr = liveData[id]?.price;
      const prev = prevRef.current[id];
      if (curr != null && prev != null && curr !== prev) {
        newFlash[id] = curr > prev ? 'up' : 'down';
      }
      prevRef.current[id] = curr;
    });

    if (Object.keys(newFlash).length === 0) return;

    setFlashMap(f => ({ ...f, ...newFlash }));

    // Clear flashes after FLASH_MS
    Object.keys(newFlash).forEach(id => {
      if (timerRef.current[id]) clearTimeout(timerRef.current[id]);
      timerRef.current[id] = setTimeout(() => {
        setFlashMap(f => { const n = { ...f }; delete n[id]; return n; });
      }, FLASH_MS);
    });
  }, [liveData]);

  return flashMap;
}

// ── CME Gold / Forex market hours (ET-based) ─────────────────────────────
// CME Gold futures: Sun 6 PM ET → Fri 5 PM ET, with 1-hr daily maintenance 5–6 PM ET
function isFuturesOpen() {
  const now = new Date();
  const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const et = new Date(etStr);
  const day  = et.getDay(); // 0=Sun … 6=Sat
  const mins = et.getHours() * 60 + et.getMinutes();
  if (day === 6) return false;                         // Saturday: always closed
  if (day === 0) return mins >= 18 * 60;              // Sunday: open from 6 PM ET
  if (day === 5) return mins < 17 * 60;              // Friday: close at 5 PM ET
  // Mon–Thu: daily maintenance break 5:00–6:00 PM ET
  return !(mins >= 17 * 60 && mins < 18 * 60);
}




// ── Main Component ──────────────────────────────────────────────────────────
export default function EconomicDashboard() {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();

  const [tf, setTf]                 = useState('3M');
  const [chartSymbol, setChartSymbol] = useState('OANDA:XAUUSD');
  const [goldChartData, setGoldChartData] = useState([]);
  const [corrChartData, setCorrChartData] = useState({});
  const [liveData, setLiveData]     = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [lastPoll, setLastPoll]     = useState(null);
  const [pollCount, setPollCount]   = useState(0);
  const [marketState, setMarketState] = useState('—');
  const [wsStatus, setWsStatus]     = useState('idle');   // Finnhub WS connection state
  const [wsTickCount, setWsTickCount] = useState(0);      // count of live ticks received
  const [lastTick, setLastTick]     = useState(null);     // timestamp of latest Finnhub tick


  const days = TIMEFRAMES.find(t => t.label === tf)?.days ?? 90;

  // ── Yahoo Finance polling (context data: DXY, VIX, marketState, dayHigh/Low) ───
  const pollLive = useCallback(async () => {
    const data = await fetchLivePrices();
    if (data) {
      setLiveData(prev => {
        if (!prev) return data;
        // Merge: Yahoo REST provides full context (DXY, VIX, dayHigh/Low, marketState).
        // For all symbols in FINNHUB_TO_DASH (incl. OANDA:XAU_USD → gold), prefer a
        // fresh WS tick (<10 s old) over the REST poll result to avoid visual stutter.
        const WS_FRESH_MS = 10_000;
        const merged = { ...data };
        Object.keys(FINNHUB_TO_DASH).forEach(sym => {
          const id = FINNHUB_TO_DASH[sym];
          if (!prev[id]?.lastFinnhub) return;
          const wsFresh = (Date.now() - prev[id].lastFinnhub) < WS_FRESH_MS;
          const bestHigh = (prev[id].dayHigh != null && data[id]?.dayHigh != null)
            ? Math.max(prev[id].dayHigh, data[id].dayHigh)
            : (prev[id].dayHigh ?? data[id]?.dayHigh ?? null);
          const bestLow  = (prev[id].dayLow  != null && data[id]?.dayLow  != null)
            ? Math.min(prev[id].dayLow,  data[id].dayLow)
            : (prev[id].dayLow  ?? data[id]?.dayLow  ?? null);
          merged[id] = {
            ...data[id],
            ...(wsFresh ? {
              price:      prev[id].price,
              change:     prev[id].change,
              changePct:  prev[id].changePct,
            } : {}),
            dayHigh:     bestHigh,
            dayLow:      bestLow,
            lastFinnhub: prev[id].lastFinnhub,
          };
        });
        return merged;
      });
      setLastPoll(new Date());
      setPollCount(n => n + 1);
      const state = data.gold?.marketState ?? data.gld?.marketState ?? 'CLOSED';
      setMarketState(state);
    }
  }, []);

  useEffect(() => {
    pollLive();
    const interval = setInterval(pollLive, LIVE_POLL_MS);
    return () => clearInterval(interval);
  }, [pollLive]);

  // ── Finnhub WebSocket — real-time price ticks ─────────────────────────────
  useEffect(() => {
    finnhubWs.connect();

    const unsubStatus = finnhubWs.onStatus(s => setWsStatus(s));

    const unsubPrice = finnhubWs.onPrice(({ type, prices, symbol, data }) => {
      if (type === 'snapshot') {
        // Seed all mapped symbols from Finnhub REST snapshot
        setLiveData(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          Object.entries(FINNHUB_TO_DASH).forEach(([sym, id]) => {
            const d = prices[sym];
            if (d?.price) {
              next[id] = {
                ...(next[id] || {}),
                price:      d.price,
                change:     d.change     ?? next[id]?.change,
                changePct:  d.changePct  ?? next[id]?.changePct,
                high:       d.high       ?? next[id]?.high,
                low:        d.low        ?? next[id]?.low,
                prevClose:  d.prevClose  ?? next[id]?.prevClose,
                lastFinnhub: Date.now(),
              };
            }
          });
          return next;
        });
      } else if (type === 'update' && symbol) {
        const id = FINNHUB_TO_DASH[symbol];
        if (id && data?.price) {
          setLiveData(prev => ({
            ...prev,
            [id]: {
              ...(prev?.[id] || {}),
              price:      data.price,
              change:     data.change    ?? prev?.[id]?.change,
              changePct:  data.changePct ?? prev?.[id]?.changePct,
              // Keep running intraday high/low in real-time from WS ticks
              dayHigh:    prev?.[id]?.dayHigh != null
                            ? Math.max(prev[id].dayHigh, data.price)
                            : data.price,
              dayLow:     prev?.[id]?.dayLow != null
                            ? Math.min(prev[id].dayLow, data.price)
                            : data.price,
              lastFinnhub: Date.now(),
            },
          }));
          setLastTick(new Date());
          setWsTickCount(n => n + 1);
        }
      }
    });

    return () => {
      unsubPrice();
      unsubStatus();
    };
  }, []);

  // ── Chart data load (on timeframe change only) ────────────────────────────
  const loadChartData = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);
    try {
      const [gold, ...corrResults] = await Promise.allSettled([
        fetchGoldData('day', days),
        ...CORR_ASSETS.map(a => fetchCorrAsset(a, days)),
      ]);
      setGoldChartData(gold.status === 'fulfilled' ? gold.value : []);
      const corrMap = {};
      CORR_ASSETS.forEach((a, i) => {
        corrMap[a.id] = corrResults[i].status === 'fulfilled' ? corrResults[i].value : [];
      });
      setCorrChartData(corrMap);
    } catch (err) {
      setChartError(err.message);
    } finally {
      setChartLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadChartData();
    const chartInterval = setInterval(loadChartData, CHART_REFRESH_MS);
    return () => clearInterval(chartInterval);
  }, [days, loadChartData]);

  // ── Price flash ──────────────────────────────────────────────────────────
  const flashIds = ['gold', 'dxy', 'tlt', 'spy', 'oil', 'vix', 'btc'];
  const flashMap = usePriceFlash(liveData, flashIds);

  // ── Live-inject last bar with current WS price so charts update in real-time
  // goldChartData holds daily OHLC bars (refreshes every 5 min from Yahoo).
  // liveData.gold.price updates sub-second via Finnhub WS.
  // Patching the last element keeps the chart tip live without re-fetching.
  const displayGoldChartData = useMemo(() => {
    if (!goldChartData.length) return goldChartData;
    const livePrice = liveData?.gold?.price;
    if (!livePrice) return goldChartData;
    const arr  = [...goldChartData];
    const last = { ...arr[arr.length - 1], close: livePrice };
    if (liveData.gold.dayHigh != null) last.high = Math.max(last.high ?? 0, liveData.gold.dayHigh);
    if (liveData.gold.dayLow  != null) last.low  = Math.min(last.low  ?? Infinity, liveData.gold.dayLow);
    arr[arr.length - 1] = last;
    return arr;
  }, [goldChartData, liveData?.gold?.price, liveData?.gold?.dayHigh, liveData?.gold?.dayLow]);

  const displayCorrChartData = useMemo(() => {
    const result = {};
    CORR_ASSETS.forEach(a => {
      const src  = corrChartData[a.id] || [];
      const live = liveData?.[a.id];
      if (!src.length || !live?.price) { result[a.id] = src; return; }
      const arr  = [...src];
      const last = { ...arr[arr.length - 1], close: live.price };
      if (live.dayHigh != null) last.high = Math.max(last.high ?? 0, live.dayHigh);
      if (live.dayLow  != null) last.low  = Math.min(last.low  ?? Infinity, live.dayLow);
      arr[arr.length - 1] = last;
      result[a.id] = arr;
    });
    return result;
  }, [corrChartData, liveData]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const goldStats    = calcPeriodStats(goldChartData);
  const goldCloses   = goldChartData.map(d => d.close).filter(Boolean);
  const corrPeriod   = {};
  CORR_ASSETS.forEach(a => { corrPeriod[a.id] = calcPeriodStats(corrChartData[a.id]); });

  // Map TradingView symbol → liveData key so the chart card shows live data for the selected pair
  const TV_TO_DASH_KEY = {
    'OANDA:XAUUSD':    'gold',
    'AMEX:GLD':        'gld',
    'AMEX:SPY':        'spy',
    'NASDAQ:TLT':      'tlt',
    'CBOE:VIX':        'vix',
    'BINANCE:BTCUSDT': 'btc',
    'BINANCE:ETHUSDT': 'btc', // no separate eth in liveData — best effort
    'TVC:DXY':         'dxy',
    'TVC:USOIL':       'oil',
  };
  const chartDashKey   = TV_TO_DASH_KEY[chartSymbol] ?? null;
  // For gold use the dedicated liveGold object (richer), for others use liveData
  const chartLiveData  = chartDashKey === 'gold' ? liveData?.gold
                       : chartDashKey            ? liveData?.[chartDashKey]
                       : null;
  // For gold use goldChartData; for corr assets use corrChartData; else null
  const chartChartData = chartDashKey === 'gold' ? goldChartData
                       : chartDashKey            ? corrChartData[chartDashKey]
                       : null;
  const chartStats     = calcPeriodStats(chartChartData ?? []);
  // Find the ECO_SYMBOLS entry for display (label, unit prefix)
  const chartSymEntry  = ALL_ECO.find(s => s.tv === chartSymbol);
  // Clean pair label: "XAU/USD (Gold)" → "XAU/USD", "EUR/USD" → "EUR/USD"
  const pairLabel      = chartSymEntry?.label?.split(' ')[0] ?? 'XAU/USD';
  // Determine if the selected symbol is USD-priced (prefix $) or other
  const isFx           = chartSymbol?.startsWith('OANDA:') && !chartSymbol?.includes('XAU') && !chartSymbol?.includes('XAG') && !chartSymbol?.includes('XPT');
  const isCrypto       = chartSymbol?.startsWith('BINANCE:');
  const fmtChartVal    = (v) => {
    if (v == null || isNaN(v)) return '—';
    if (isFx || isCrypto) return v.toFixed(isFx ? 5 : 2);
    return `$${v.toFixed(2)}`;
  };

  const correlations = CORR_ASSETS.map(a => {
    const closes = (corrChartData[a.id] || []).map(d => d.close).filter(Boolean);
    return { ...a, corr: pearsonCorr(goldCloses, closes) };
  });

  const bull = '#22c55e';
  const bear = '#ef4444';

  // ── Smart per-asset market status ──────────────────────────────────────────
  // Returns { label, color, bg, border, pulse, subtitle }
  function getMarketStatus(sym) {
    const now   = new Date();
    const day   = now.getUTCDay();   // 0=Sun … 6=Sat
    const h     = now.getUTCHours();
    const m     = now.getUTCMinutes();
    const mins  = h * 60 + m;         // minutes since UTC midnight

    // ── Crypto — always open ────────────────────────────────────────────
    const isCryptoSym = /BINANCE:|COINBASE:|CRYPTO:/i.test(sym);
    if (isCryptoSym) {
      return { label: 'CRYPTO 24/7', color: bull, bg: '#22c55e22', border: '#22c55e44', pulse: true, subtitle: 'Crypto never closes' };
    }

    // ── Forex / Gold / Silver / Precious Metals ─────────────────────────
    // Session: Mon 00:00 UTC → Fri 21:00 UTC  (Sydney open Mon to NY close Fri)
    const isFxSym = /OANDA:|FX:|TVC:DXY/i.test(sym);
    if (isFxSym) {
      const fxOpen = (day >= 1 && day <= 4) || (day === 5 && mins < 21 * 60) || (day === 0 && mins >= 22 * 60);
      if (fxOpen) return { label: 'FOREX LIVE', color: bull, bg: '#22c55e22', border: '#22c55e44', pulse: true, subtitle: 'Forex market is open' };
      const nextMon = day === 6 ? 'Tomorrow' : 'Monday';
      return { label: 'FOREX CLOSED', color: '#9ca3af', bg: '#6b727822', border: '#6b728044', pulse: false, subtitle: `Opens ${nextMon} 00:00 UTC` };
    }

    // ── US Stocks / ETFs / Indices (NYSE/NASDAQ) ────────────────────────
    // Regular: Mon–Fri 14:30–21:00 UTC
    const weekday = day >= 1 && day <= 5;
    if (weekday) {
      const preOpen  = mins >= 9 * 60  && mins < 14 * 60 + 30;  // 09:00–14:30 UTC
      const regular  = mins >= 14 * 60 + 30 && mins < 21 * 60;   // 14:30–21:00 UTC
      const afterHrs = mins >= 21 * 60 && mins < 24 * 60;         // 21:00–24:00 UTC
      if (regular)  return { label: 'NYSE OPEN',    color: bull,      bg: '#22c55e22', border: '#22c55e44', pulse: true,  subtitle: 'Regular trading hours' };
      if (preOpen)  return { label: 'PRE-MARKET',   color: '#f59e0b', bg: '#f59e0b22', border: '#f59e0b44', pulse: true,  subtitle: 'Pre-market session' };
      if (afterHrs) return { label: 'AFTER HOURS',  color: '#f59e0b', bg: '#f59e0b22', border: '#f59e0b44', pulse: false, subtitle: 'After-hours session' };
    }
    // Weekend or outside all sessions
    const daysUntilMon = day === 0 ? 1 : day === 6 ? 2 : 0;
    const subtitle = daysUntilMon > 0
      ? `Opens ${daysUntilMon === 1 ? 'Monday' : 'in 2 days'} 14:30 UTC`
      : 'Opens 14:30 UTC';
    return { label: 'NYSE CLOSED', color: '#9ca3af', bg: '#6b727822', border: '#6b728044', pulse: false, subtitle };
  }

  // Status for the currently selected chart symbol
  const chartStatus = getMarketStatus(chartSymbol);

  // Per-asset-ID quick dot color for ticker cards
  function assetDotColor(id) {
    if (id === 'btc')                   return bull;              // crypto always green
    if (id === 'gold' || id === 'gld')  return getMarketStatus('OANDA:XAUUSD').color;
    if (id === 'dxy')                   return getMarketStatus('TVC:DXY').color;
    if (id === 'oil')                   return getMarketStatus('OANDA:XAUUSD').color; // futures ~same as forex
    return getMarketStatus('AMEX:SPY').color;                    // stocks (spy, tlt, vix)
  }

  // Flash style helper — theme-aware opacity + left-border accent
  const getFlashStyle = (id) => {
    const f = flashMap[id];
    if (!f) return { borderLeft: '3px solid transparent', paddingLeft: '9px' };
    const upBg   = theme.isDark ? '#22c55e22' : '#22c55e38';
    const downBg = theme.isDark ? '#ef444422' : '#ef444438';
    const borderColor = f === 'up' ? '#22c55e' : '#ef4444';
    return {
      transition: `background-color ${FLASH_MS}ms ease-out, border-left-color ${FLASH_MS}ms ease-out`,
      backgroundColor: f === 'up' ? upBg : downBg,
      borderLeft: `3px solid ${borderColor}`,
      paddingLeft: '9px',
    };
  };

  // ── Smart market state badge (updates with selected chart symbol) ─────────
  const stateBadge = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold"
      style={{ backgroundColor: chartStatus.bg, color: chartStatus.color, border: `1px solid ${chartStatus.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: chartStatus.color, animation: chartStatus.pulse ? 'pulse 1.5s infinite' : 'none' }} />
      {chartStatus.label}
    </div>
  );

  if (chartLoading && !liveData) return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: theme.accent }} />
          <p style={{ color: theme.muted }}>Loading market data...</p>
        </div>
      </div>
    </div>
  );

  if (chartError && !liveData) return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      <div className="border rounded-lg p-6 flex gap-3" style={{ backgroundColor: `${bear}1A`, borderColor: bear }}>
        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: bear }} />
        <div><p className="font-semibold" style={{ color: bear }}>Error</p><p style={{ color: theme.text }}>{chartError}</p></div>
      </div>
    </div>
  );

  const liveGold   = liveData?.gold;
  const liveGLD    = liveData?.gld;
  const spotPrice  = liveGold?.price ?? null;

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes priceFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Daily Brief */}
        <DailyBrief />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-7 h-7" style={{ color: '#f59e0b' }} />
              <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Market Data Terminal</h2>
              {stateBadge}
            </div>
            <p className="text-sm mt-1 flex items-center gap-2 flex-wrap" style={{ color: theme.muted }}>
              {wsStatus === 'connected' ? (
                <span className="flex items-center gap-1" style={{ color: chartStatus.color }}>
                  <Wifi className="w-3 h-3" />
                  {isCrypto ? 'Crypto prices live'
                    : /OANDA:|TVC:DXY/i.test(chartSymbol) ? (chartStatus.pulse ? 'Forex prices live' : 'Forex prices delayed')
                    : chartStatus.label === 'NYSE OPEN' ? 'Stock prices live'
                    : chartStatus.label.includes('MARKET') || chartStatus.label.includes('HOURS') ? 'Extended hours prices'
                    : 'Stock prices delayed'}
                </span>
              ) : (
                <span>Prices update automatically</span>
              )}
              &nbsp;·&nbsp;
              {lastTick
                ? `Last update: ${formatDateWithTimezone(lastTick, 'HH:mm:ss')}`
                : lastPoll
                ? `Updated: ${formatDateWithTimezone(lastPoll, 'HH:mm:ss')}`
                : 'Connecting...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              {TIMEFRAMES.map(t => (
                <button key={t.label} onClick={() => setTf(t.label)}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{ backgroundColor: tf === t.label ? theme.accent : 'transparent', color: tf === t.label ? '#fff' : theme.muted }}>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={loadChartData} disabled={chartLoading}
              className="p-2 rounded-lg" title="Refresh charts"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}>
              <RefreshCw className={`w-4 h-4 ${chartLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Ticker Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">

          {/* Gold card */}
          <div className="rounded-lg p-3 transition-colors duration-200"
            style={{ backgroundColor: theme.surface2, border: `1px solid ${theme.border}`, borderLeft: '2px solid #f59e0b55', ...getFlashStyle('gold') }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.isDark ? '#2c2c2c' : '#eef0f3'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surface2; }}>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: assetDotColor('gold'), animation: assetDotColor('gold') === bull ? 'pulse 1.5s infinite' : 'none' }} />
                <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>GOLD</span>
              </div>
              <div className="flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" style={{ color: bull, opacity: liveGold ? 1 : 0.3 }} />
                {liveGold && liveGold.changePct != null
                  ? (liveGold.changePct >= 0 ? <TrendingUp className="w-3 h-3" style={{ color: bull }} /> : <TrendingDown className="w-3 h-3" style={{ color: bear }} />)
                  : null}
              </div>
            </div>
            <div className="text-base font-bold tabular-nums" style={{ color: theme.text }}>
              {spotPrice ? `$${spotPrice.toFixed(2)}` : '—'}
            </div>
            <div className="text-xs" style={{ color: '#f59e0b' }}>per troy oz</div>
            {liveGold?.changePct != null && (
              <div className="text-xs font-semibold tabular-nums mt-0.5" style={{ color: liveGold.changePct >= 0 ? bull : bear }}>
                {liveGold.changePct >= 0 ? '+' : ''}{liveGold.change?.toFixed(1)} ({fmtPct(liveGold.changePct)})
              </div>
            )}
            {liveGLD && (
              <div className="text-xs mt-0.5" style={{ color: theme.muted }}>GLD ETF: ${liveGLD.price?.toFixed(2)}</div>
            )}
          </div>

          {/* Corr asset cards */}
          {CORR_ASSETS.map(a => {
            const ld = liveData?.[a.id];
            const up = ld?.changePct != null ? ld.changePct >= 0 : true;
            const flash = getFlashStyle(a.id);
            return (
              <div key={a.id} className="rounded-lg p-3 transition-colors duration-200"
                style={{ backgroundColor: theme.surface2, border: `1px solid ${theme.border}`, ...flash }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.isDark ? '#2c2c2c' : '#eef0f3'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surface2; }}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: assetDotColor(a.id), animation: assetDotColor(a.id) === bull ? 'pulse 1.5s infinite' : 'none' }} />
                    <span className="text-xs font-bold" style={{ color: a.color }}>{a.displayTicker}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5" style={{ color: bull, opacity: ld?.price ? 1 : 0.3 }} />
                    {ld?.price != null && (up ? <TrendingUp className="w-3 h-3" style={{ color: bull }} /> : <TrendingDown className="w-3 h-3" style={{ color: bear }} />)}
                  </div>
                </div>
                <div className="text-base font-bold tabular-nums" style={{ color: ld?.price != null ? theme.text : theme.muted }}>
                  {ld?.price != null ? (a.unit === '$' ? `$${ld.price.toFixed(2)}` : ld.price.toFixed(2)) : '—'}
                </div>
                <div className="text-xs" style={{ color: theme.muted }}>{a.unitLabel}</div>
                {ld?.changePct != null && (
                  <div className="text-xs font-semibold tabular-nums mt-0.5" style={{ color: up ? bull : bear }}>
                    {up ? '+' : ''}{ld.change?.toFixed(2)} ({fmtPct(ld.changePct)})
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Gold main chart */}
        <div className="rounded-lg border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <div className="p-4 border-b" style={{ borderColor: theme.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#f59e0b' }}>Market Chart — {tf}</h3>
                <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                  Select any pair, stock or commodity &nbsp;·&nbsp; Switch timeframe to view history
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <EcoSymbolPicker symbol={chartSymbol} onChange={setChartSymbol} theme={theme} />
                {chartLiveData?.price != null && (
                  <div className="text-2xl font-bold tabular-nums transition-colors duration-300"
                    style={{ color: '#10b981' }}>
                    {fmtChartVal(chartLiveData.price)}
                    <span className="text-sm font-normal ml-1" style={{ color: theme.muted }}>
                      {chartSymEntry?.label?.match(/\(([^)]+)\)/)?.[1] ?? ''}
                    </span>
                  </div>
                )}
                {chartLiveData?.changePct != null && (
                  <div className="text-sm font-medium tabular-nums"
                    style={{ color: chartLiveData.changePct >= 0 ? bull : bear }}>
                    {chartLiveData.changePct >= 0 ? '+' : ''}
                    {chartLiveData.change != null ? parseFloat(chartLiveData.change).toFixed(isFx ? 5 : 2) : ''}
                    &nbsp;({fmtPct(chartLiveData.changePct)}) today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          {chartDashKey ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b" style={{ borderColor: theme.border }}>
              {[
                { l: 'Day High',   v: chartLiveData?.dayHigh  != null ? fmtChartVal(chartLiveData.dayHigh)  : (chartStats ? fmtChartVal(chartStats.periodHigh) : '—'),  c: bull },
                { l: 'Day Low',    v: chartLiveData?.dayLow   != null ? fmtChartVal(chartLiveData.dayLow)   : (chartStats ? fmtChartVal(chartStats.periodLow)  : '—'),  c: bear },
                { l: `${tf} High`, v: chartStats ? fmtChartVal(chartStats.periodHigh) : '—', c: null },
                { l: `${tf} Low`,  v: chartStats ? fmtChartVal(chartStats.periodLow)  : '—', c: null },
                { l: `${tf} Chg`,  v: chartStats ? fmtPct(chartStats.periodChange) : '—', c: chartStats?.periodChange != null ? (chartStats.periodChange >= 0 ? bull : bear) : null },
                { l: 'Prev Close', v: chartLiveData?.prevClose != null ? fmtChartVal(chartLiveData.prevClose) : '—', c: null },
              ].map(item => (
                <div key={item.l} className="px-3 py-2" style={{ borderRight: `1px solid ${theme.border}` }}>
                  <div className="text-xs whitespace-nowrap" style={{ color: theme.muted }}>{item.l}</div>
                  <div className="text-sm font-bold whitespace-nowrap tabular-nums" style={{ color: item.c ?? theme.text }}>{item.v}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 border-b text-xs" style={{ borderColor: theme.border, color: theme.muted }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              OHLC price data is displayed directly inside the chart below. Live stats are available for Gold, DXY, Oil, VIX, SPY, TLT and BTC.
            </div>
          )}

          <div className="relative" style={{ height: 600 }}>
            <TvEcoChart symbol={chartSymbol} tf={tf} />
          </div>
        </div>{/* end chart card */}

        {/* Correlation mini-charts */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>
            Gold Correlation Charts — {tf}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {correlations.map(a => {
              const ld = liveData?.[a.id];
              const hasChart = (displayCorrChartData[a.id] || []).length > 0;
              const corrColor = a.corr === null ? theme.muted : a.corr > 0.5 ? bull : a.corr < -0.5 ? bear : '#eab308';
              const up = ld?.changePct != null ? ld.changePct >= 0 : true;
              return (
                <div key={a.id} className="rounded-lg border transition-colors duration-300"
                  style={{ backgroundColor: theme.surface, borderTopColor: theme.border, borderRightColor: theme.border, borderBottomColor: theme.border, ...getFlashStyle(a.id) }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                    <div>
                      <span className="font-bold text-sm" style={{ color: a.color }}>{a.displayTicker}</span>
                      <span className="text-xs ml-2" style={{ color: theme.muted }}>{a.label}</span>
                    </div>
                    <div className="text-right">
                      {ld?.price != null ? (
                        <>
                          <div className="text-sm font-bold tabular-nums" style={{ color: theme.text }}>
                            {a.unit === '$' ? `$${ld.price.toFixed(2)}` : ld.price.toFixed(2)}
                            <span className="text-xs font-normal ml-1" style={{ color: theme.muted }}>{a.unitLabel}</span>
                          </div>
                          <div className="text-xs font-semibold tabular-nums" style={{ color: up ? bull : bear }}>
                            {up ? '+' : ''}{ld.change?.toFixed(2)} ({fmtPct(ld.changePct)})
                          </div>
                        </>
                      ) : <span className="text-xs" style={{ color: theme.muted }}>No data</span>}
                    </div>
                  </div>
                  <div className="px-4 pt-2 pb-0 flex items-center gap-2 text-xs">
                    <span style={{ color: theme.muted }}>vs Gold:</span>
                    <span className="font-bold" style={{ color: corrColor }}>
                      {a.corr !== null ? a.corr.toFixed(2) : 'N/A'}
                    </span>
                    {a.corr !== null && (
                      <span style={{ color: theme.muted }}>
                        ({Math.abs(a.corr) > 0.7 ? 'strong' : Math.abs(a.corr) > 0.4 ? 'moderate' : 'weak'} {a.corr > 0 ? 'pos' : 'neg'})
                      </span>
                    )}
                  </div>
                  <div className="p-4 pt-1">
                    {hasChart
                      ? <DataChart data={displayCorrChartData[a.id]} dataKey="close" color={a.color}
                          type="line" height={150} showGrid={false}
                          formatValue={v => a.unit === '$' ? `$${v.toFixed(2)}` : v.toFixed(2)} />
                      : <div className="flex items-center justify-center h-36 text-xs rounded"
                          style={{ color: theme.muted, backgroundColor: `${theme.border}44` }}>
                          Loading chart...
                        </div>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Correlation table */}
        <div className="rounded-lg border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: theme.border }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Gold Correlation Matrix — {tf}</h3>
                <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                  Shows how closely each asset tracks gold prices over the {tf} period. High positive = moves together; negative = moves opposite.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: assetDotColor('gold') }}>
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: assetDotColor('gold'), animation: assetDotColor('gold') === bull ? 'pulse 1.5s infinite' : 'none' }} />
                {getMarketStatus('OANDA:XAUUSD').label}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Instrument', 'Symbol', 'Live Price', 'Day Chg', `${tf} %`, 'Pearson r', 'Interpretation'].map(h => (
                    <th key={h} className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider${h === 'Day Chg' || h === 'Interpretation' ? ' hidden md:table-cell' : ''}`} style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlations.map((a, i) => {
                  const ld = liveData?.[a.id];
                  const ps = corrPeriod[a.id];
                  const corrColor = a.corr === null ? theme.muted : a.corr > 0.5 ? bull : a.corr < -0.5 ? bear : '#eab308';
                  const signal = a.corr === null ? 'Insufficient data'
                    : Math.abs(a.corr) < 0.2 ? 'No consistent pattern'
                    : Math.abs(a.corr) < 0.4
                      ? (a.corr > 0 ? 'Slight tendency to follow gold' : 'Slight opposite tendency to gold')
                    : Math.abs(a.corr) < 0.65
                      ? (a.corr > 0 ? 'Often moves with gold' : 'Often moves opposite to gold')
                    : a.corr >= 0.65
                      ? 'Closely follows gold'
                      : 'Moves opposite to gold';
                  const up = ld?.changePct != null ? ld.changePct >= 0 : null;
                  const flash = getFlashStyle(a.id);
                  return (
                    <tr key={a.id}
                      className="transition-colors duration-300"
                      style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: i % 2 === 0 ? 'transparent' : `${theme.border}22`, ...flash }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                          <div>
                            <div className="font-bold" style={{ color: theme.text }}>{a.label}</div>
                            <div className="text-xs" style={{ color: theme.muted }}>{a.note}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${a.color}22`, color: a.color }}>{a.displayTicker}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums" style={{ color: theme.text }}>
                        {ld?.price != null ? (a.unit === '$' ? `$${ld.price.toFixed(2)}` : `${ld.price.toFixed(2)} ${a.unit}`) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums hidden md:table-cell" style={{ color: up === true ? bull : up === false ? bear : theme.muted }}>
                        {ld?.changePct != null ? fmtPct(ld.changePct) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums" style={{ color: ps?.periodChange != null ? (ps.periodChange >= 0 ? bull : bear) : theme.muted }}>
                        {ps?.periodChange != null ? fmtPct(ps.periodChange) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono tabular-nums" style={{ color: corrColor }}>
                        {a.corr !== null ? a.corr.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: a.corr === null ? theme.muted : Math.abs(a.corr) < 0.2 ? theme.muted : corrColor }}>{signal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs py-2" style={{ color: theme.muted }}>
          <span>Market data refreshed in real-time. Gold: Spot. Oil: WTI. Indices: Live.</span>
          <span>{lastPoll ? formatDateWithTimezone(lastPoll, 'HH:mm:ss') : '—'}</span>
        </div>

      </div>
    </div>
  );
}
