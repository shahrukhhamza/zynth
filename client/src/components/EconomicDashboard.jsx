import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, Radio, Wifi } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import DataChart from './DataChart';
import { fetchGoldData, fetchEquityData, fetchMarketData, fetchLivePrices } from '../services/dataApi';
import { finnhubWs } from '../services/finnhubWs';

// ── Config ─────────────────────────────────────────────────────────────────
// Yahoo Finance polls less frequently now — Finnhub WS handles real-time prices
const LIVE_POLL_MS   = 10000;   // poll Yahoo every 10s (fast REST fallback when WS is idle)
const CHART_REFRESH_MS = 300000; // re-fetch period chart data every 5 min (keeps 3M High/Low/Chg current)
const FLASH_MS       = 800;     // price flash duration

// Maps Finnhub WebSocket symbols → EconomicDashboard liveData keys
const FINNHUB_TO_DASH = {
  'OANDA:XAU_USD':   'gold',
  'GLD':             'gld',
  'TLT':             'tlt',
  'SPY':             'spy',
  'OANDA:WTICO_USD': 'oil',
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
        // Merge: Yahoo provides full context; preserve any Finnhub real-time prices
        // that arrived after this Yahoo snapshot was taken.
        const merged = { ...data };
        Object.keys(FINNHUB_TO_DASH).forEach(sym => {
          const id = FINNHUB_TO_DASH[sym];
          if (!prev[id]?.lastFinnhub) return;
          // Keep Finnhub price if it's newer than what Yahoo returned
          const useFinPrice = prev[id].lastFinnhub > (data[id]?.timestamp ?? 0);
          // Yahoo futures data is ~10-15 min delayed — Finnhub may have seen a more
          // extreme intraday high/low already; keep whichever is more extreme.
          const bestHigh = (prev[id].dayHigh != null && data[id]?.dayHigh != null)
            ? Math.max(prev[id].dayHigh, data[id].dayHigh)
            : (prev[id].dayHigh ?? data[id]?.dayHigh ?? null);
          const bestLow  = (prev[id].dayLow  != null && data[id]?.dayLow  != null)
            ? Math.min(prev[id].dayLow,  data[id].dayLow)
            : (prev[id].dayLow  ?? data[id]?.dayLow  ?? null);
          merged[id] = {
            ...data[id],
            ...(useFinPrice ? {
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

  // ── Derived ──────────────────────────────────────────────────────────────
  const goldStats    = calcPeriodStats(goldChartData);
  const goldCloses   = goldChartData.map(d => d.close).filter(Boolean);
  const corrPeriod   = {};
  CORR_ASSETS.forEach(a => { corrPeriod[a.id] = calcPeriodStats(corrChartData[a.id]); });

  const correlations = CORR_ASSETS.map(a => {
    const closes = (corrChartData[a.id] || []).map(d => d.close).filter(Boolean);
    return { ...a, corr: pearsonCorr(goldCloses, closes) };
  });

  const isLive     = marketState === 'REGULAR' || (marketState !== 'PRE' && marketState !== 'POST' && isFuturesOpen());
  const isExtended = marketState === 'PRE' || marketState === 'POST';
  const bull = '#22c55e';
  const bear = '#ef4444';

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

  // ── Market state badge ───────────────────────────────────────────────────
  const stateBadge = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold"
      style={{
        backgroundColor: isLive ? '#22c55e22' : isExtended ? '#f59e0b22' : '#6b727844',
        color: isLive ? bull : isExtended ? '#f59e0b' : '#9ca3af',
        border: `1px solid ${isLive ? '#22c55e44' : isExtended ? '#f59e0b44' : '#6b728044'}`,
      }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: isLive ? bull : isExtended ? '#f59e0b' : '#6b7280',
          animation: isLive || isExtended ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      {isLive ? (marketState === 'REGULAR' ? 'MARKET OPEN' : 'MARKET ACTIVE') : isExtended ? marketState : 'MARKET CLOSED'}
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
                <span className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                  <Wifi className="w-3 h-3" />
                  Live Streaming
                </span>
              ) : (
                <span>Polling · every {LIVE_POLL_MS / 1000}s</span>
              )}
              &nbsp;·&nbsp;
              {lastTick
                ? `Tick: ${formatDateWithTimezone(lastTick, 'HH:mm:ss')}`
                : lastPoll
                ? `Polled: ${formatDateWithTimezone(lastPoll, 'HH:mm:ss')}`
                : 'Connecting...'}
              {wsTickCount > 0 && (
                <span style={{ color: '#22c55e' }}>&nbsp;·&nbsp; {wsTickCount} ticks</span>
              )}
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
          <div className="rounded-lg p-3 border transition-colors duration-300"
            style={{ backgroundColor: theme.surface, borderColor: '#f59e0b55', ...getFlashStyle('gold') }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>GOLD</span>
              <div className="flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" style={{ color: bull, opacity: liveGold ? 1 : 0.3 }} />
                {liveGold && liveGold.changePct != null
                  ? (liveGold.changePct >= 0 ? <TrendingUp className="w-3 h-3" style={{ color: bull }} /> : <TrendingDown className="w-3 h-3" style={{ color: bear }} />)
                  : null}
              </div>
            </div>
            <div className="text-base font-bold tabular-nums" style={{ color: theme.text }}>
              {spotPrice ? `$${Math.round(spotPrice).toLocaleString()}` : '—'}
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
              <div key={a.id} className="rounded-lg p-3 border transition-colors duration-300"
                style={{ backgroundColor: theme.surface, borderColor: theme.border, ...flash }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold" style={{ color: a.color }}>{a.displayTicker}</span>
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
        <div className="rounded-lg border" style={{ backgroundColor: theme.surface, borderColor: '#f59e0b55' }}>
          <div className="p-4 border-b" style={{ borderColor: theme.border }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#f59e0b' }}>Gold Price — {tf} Movement</h3>
                <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                  Chart: GLD ETF daily closes &nbsp;|&nbsp; Spot price: GC=F futures (live)
                </p>
              </div>
              <div className="text-right">
                {spotPrice && (
                  <div className="text-2xl font-bold tabular-nums transition-colors duration-300"
                    style={{ color: '#f59e0b', ...(flashMap['gold'] ? { backgroundColor: flashMap['gold'] === 'up' ? (theme.isDark ? '#22c55e22' : '#22c55e38') : (theme.isDark ? '#ef444422' : '#ef444438') } : {}) }}>
                    ${Math.round(spotPrice).toLocaleString()}
                    <span className="text-sm font-normal ml-1" style={{ color: theme.muted }}>/oz</span>
                  </div>
                )}
                {liveGLD && (
                  <div className="text-base font-semibold tabular-nums" style={{ color: theme.text }}>
                    GLD ${liveGLD.price?.toFixed(2)}/share
                  </div>
                )}
                {liveGold?.changePct != null && (
                  <div className="text-sm font-medium tabular-nums" style={{ color: liveGold.changePct >= 0 ? bull : bear }}>
                    {liveGold.changePct >= 0 ? '+' : ''}{liveGold.change?.toFixed(1)} ({fmtPct(liveGold.changePct)}) today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-6 border-b" style={{ borderColor: theme.border }}>
            {[
              { l: 'Day High',    v: liveGold?.dayHigh    ? `$${liveGold.dayHigh.toFixed(1)}`   : (goldStats ? `$${goldStats.periodHigh}` : '—'),  c: bull },
              { l: 'Day Low',     v: liveGold?.dayLow     ? `$${liveGold.dayLow.toFixed(1)}`    : (goldStats ? `$${goldStats.periodLow}` : '—'),   c: bear },
              { l: `${tf} High`,  v: goldStats ? `$${goldStats.periodHigh}` : '—', c: null },
              { l: `${tf} Low`,   v: goldStats ? `$${goldStats.periodLow}` : '—',  c: null },
              { l: `${tf} Chg`,   v: goldStats ? fmtPct(goldStats.periodChange) : '—', c: goldStats?.periodChange != null ? (goldStats.periodChange >= 0 ? bull : bear) : null },
              { l: 'Prev Close',  v: liveGold?.prevClose ? `$${Math.round(liveGold.prevClose).toLocaleString()}` : '—', c: null },
            ].map(item => (
              <div key={item.l} className="px-3 py-2" style={{ borderRight: `1px solid ${theme.border}` }}>
                <div className="text-xs whitespace-nowrap" style={{ color: theme.muted }}>{item.l}</div>
                <div className="text-sm font-bold whitespace-nowrap tabular-nums" style={{ color: item.c ?? theme.text }}>{item.v}</div>
              </div>
            ))}
          </div>

          <div className="p-4">
            <DataChart data={goldChartData} dataKey="close" color="#f59e0b" type="area"
              height={300} showGrid={true} formatValue={v => `$${v.toFixed(2)}`} />
          </div>
        </div>

        {/* Correlation mini-charts */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>
            Gold Correlation Charts — {tf}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {correlations.map(a => {
              const ld = liveData?.[a.id];
              const hasChart = (corrChartData[a.id] || []).length > 0;
              const corrColor = a.corr === null ? theme.muted : a.corr > 0.5 ? bull : a.corr < -0.5 ? bear : '#eab308';
              const up = ld?.changePct != null ? ld.changePct >= 0 : true;
              return (
                <div key={a.id} className="rounded-lg border transition-colors duration-300"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border, ...getFlashStyle(a.id) }}>
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
                      ? <DataChart data={corrChartData[a.id]} dataKey="close" color={a.color}
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
                  Pearson r coefficient vs gold over the selected period. Values above ±0.5 indicate meaningful co-movement.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: isLive ? bull : theme.muted }}>
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isLive ? bull : '#6b7280', animation: isLive ? 'pulse 1.5s infinite' : 'none' }} />
                {isLive ? 'LIVE' : marketState}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Instrument', 'Symbol', 'Live Price', 'Day Chg', `${tf} %`, 'Pearson r', 'Interpretation'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
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
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${a.color}22`, color: a.color }}>{a.symbol}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums" style={{ color: theme.text }}>
                        {ld?.price != null ? (a.unit === '$' ? `$${ld.price.toFixed(2)}` : `${ld.price.toFixed(2)} ${a.unit}`) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums" style={{ color: up === true ? bull : up === false ? bear : theme.muted }}>
                        {ld?.changePct != null ? fmtPct(ld.changePct) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums" style={{ color: ps?.periodChange != null ? (ps.periodChange >= 0 ? bull : bear) : theme.muted }}>
                        {ps?.periodChange != null ? fmtPct(ps.periodChange) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono tabular-nums" style={{ color: corrColor }}>
                        {a.corr !== null ? a.corr.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: a.corr === null ? theme.muted : Math.abs(a.corr) < 0.2 ? theme.muted : corrColor }}>{signal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs py-2" style={{ color: theme.muted }}>
          <span>Data: Yahoo Finance. Gold spot: GC=F futures. Oil: WTI CL=F. VIX: CBOE ^VIX. DXY: DX-Y.NYB.</span>
          <span>{lastPoll ? formatDateWithTimezone(lastPoll, 'HH:mm:ss') : '—'}</span>
        </div>

      </div>
    </div>
  );
}
