import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wifi, WifiOff, Loader2,
  Search, RefreshCw, Activity, ChevronUp, ChevronDown
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { finnhubWs } from '../services/finnhubWs';

// ── constants ────────────────────────────────────────────────────────────────
const FLASH_MS   = 700;
const CATEGORIES = ['All', 'Stocks', 'Forex', 'Crypto'];

const CATEGORY_META = {
  stocks: { label: 'Stocks',     color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  forex:  { label: 'Forex',      color: '#22c55e', bg: 'rgba(34,197,94,0.15)'   },
  crypto: { label: 'Crypto',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
};

const STATUS_META = {
  connected:    { color: '#22c55e', pulse: true,  label: 'Live'          },
  connecting:   { color: '#f59e0b', pulse: true,  label: 'Connecting…'   },
  disconnected: { color: '#ef4444', pulse: false, label: 'Disconnected'  },
  error:        { color: '#ef4444', pulse: false, label: 'Error'         },
  idle:         { color: '#6b7280', pulse: false, label: 'Idle'          },
};

// ── helpers ─────────────────────────────────────────────────────────────────
function fmtPrice(price, dec = 2) {
  if (price == null) return '—';
  return price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtChange(change, dec = 2) {
  if (change == null) return '—';
  return `${change >= 0 ? '+' : ''}${change.toFixed(dec)}`;
}

function fmtPct(pct) {
  if (pct == null) return '—';
  return `${pct >= 0 ? '+' : ''}${Math.abs(pct).toFixed(2)}%`;
}

// ── subcomponents ─────────────────────────────────────────────────────────────

function StatusBar({ status, connectedCount, lastUpdate, theme }) {
  const meta = STATUS_META[status] || STATUS_META.idle;
  const { formatDateWithTimezone } = useTimezone();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}40` }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.color, animation: meta.pulse ? 'pulse 1.5s infinite' : 'none' }} />
        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
      </div>
      {status === 'connected' && (
        <span className="text-xs" style={{ color: theme.muted }}>
          {connectedCount} instrument{connectedCount !== 1 ? 's' : ''} streaming
        </span>
      )}
      {lastUpdate && (
        <span className="text-xs" style={{ color: theme.muted }}>
          Updated {formatDateWithTimezone(new Date(lastUpdate), 'HH:mm:ss')}
        </span>
      )}
    </div>
  );
}

function PriceRow({ meta, data, flash, theme, idx }) {
  const catMeta = CATEGORY_META[meta.category];
  const isUp    = (data?.changePct ?? 0) >= 0;
  const bull    = '#22c55e';
  const bear    = '#ef4444';
  const changeColor = data?.changePct != null ? (isUp ? bull : bear) : theme.muted;
  const priceColor  = data?.price != null ? theme.text : theme.muted;

  // Theme-aware flash: dark mode = subtle glow, light mode = stronger tint
  const upBg   = theme.isDark ? 'rgba(34,197,94,0.13)'  : 'rgba(34,197,94,0.22)';
  const downBg = theme.isDark ? 'rgba(239,68,68,0.13)' : 'rgba(239,68,68,0.22)';
  const flashBg = flash === 'up' ? upBg : flash === 'down' ? downBg : 'transparent';
  // Left-border stripe — space is always reserved (no layout jump), color animates
  const flashBorderColor = flash === 'up' ? '#22c55e' : flash === 'down' ? '#ef4444' : 'transparent';

  return (
    <div
      className="grid items-center py-3 rounded-xl"
      style={{
        gridTemplateColumns: '2.5rem 1fr 1fr 1fr 1fr',
        paddingLeft: '13px',   // 16px - 3px border = consistent alignment
        paddingRight: '16px',
        backgroundColor: flashBg || (idx % 2 === 0 ? 'transparent' : (theme.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)')),
        borderBottom: `1px solid ${theme.border}`,
        borderLeft: `3px solid ${flashBorderColor}`,
        transition: `background-color ${FLASH_MS}ms ease-out, border-left-color ${FLASH_MS}ms ease-out`,
      }}
    >
      {/* # */}
      <span className="text-xs tabular-nums" style={{ color: theme.muted }}>{idx + 1}</span>

      {/* Symbol + label */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ backgroundColor: catMeta.bg, color: catMeta.color }}>
          {meta.display.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: theme.text }}>{meta.display}</div>
          <div className="text-xs truncate" style={{ color: theme.muted }}>{meta.label}</div>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <div className="text-sm font-bold tabular-nums" style={{ color: priceColor }}>
          {data?.unit === '$' || meta.unit === '$' ? '$' : ''}{fmtPrice(data?.price, meta.dec ?? 2)}
        </div>
        <div className="text-xs" style={{ color: theme.muted }}>
          {catMeta.label}
        </div>
      </div>

      {/* Change */}
      <div className="text-right">
        <div className="flex items-center justify-end gap-0.5">
          {data?.changePct != null && (
            isUp
              ? <TrendingUp className="w-3 h-3" style={{ color: bull }} />
              : <TrendingDown className="w-3 h-3" style={{ color: bear }} />
          )}
          <span className="text-sm font-semibold tabular-nums" style={{ color: changeColor }}>
            {fmtPct(data?.changePct)}
          </span>
        </div>
        <div className="text-xs tabular-nums" style={{ color: changeColor, opacity: 0.8 }}>
          {fmtChange(data?.change, meta.dec ?? 2)}
        </div>
      </div>

      {/* High / Low */}
      <div className="text-right hidden sm:block">
        <div className="text-xs tabular-nums" style={{ color: bull }}>
          H: {data?.high != null ? fmtPrice(data.high, meta.dec ?? 2) : '—'}
        </div>
        <div className="text-xs tabular-nums" style={{ color: bear }}>
          L: {data?.low != null ? fmtPrice(data.low, meta.dec ?? 2) : '—'}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon: Icon, theme }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl"
      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-lg font-bold tabular-nums" style={{ color }}>{value}</div>
        <div className="text-xs" style={{ color: theme.muted }}>{label}</div>
        {sub && <div className="text-xs font-medium" style={{ color: theme.muted }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function LiveMarketTicker() {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();

  const [wsStatus,   setWsStatus]   = useState('idle');
  const [prices,     setPrices]     = useState({});
  const [symbols,    setSymbols]    = useState([]);
  const [flashMap,   setFlashMap]   = useState({});
  const [category,   setCategory]   = useState('All');
  const [search,     setSearch]     = useState('');
  const [sortKey,    setSortKey]    = useState('changePct');  // changePct | symbol | price
  const [sortAsc,    setSortAsc]    = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const flashTimers = useRef({});
  const prevPrices  = useRef({});

  // ── Connect to WS on mount ────────────────────────────────────────────────
  useEffect(() => {
    finnhubWs.connect();

    const unsubPrice = finnhubWs.onPrice((msg) => {
      if (msg.type === 'snapshot') {
        setPrices({ ...msg.prices });
        if (msg.symbols?.length) setSymbols(msg.symbols);
        setLastUpdate(Date.now());
      } else if (msg.type === 'update') {
        const { symbol, data } = msg;
        setPrices(prev => ({ ...prev, [symbol]: data }));
        setLastUpdate(Date.now());

        // Flash animation
        const prev = prevPrices.current[symbol]?.price;
        const curr = data?.price;
        if (prev != null && curr != null && prev !== curr) {
          const dir = curr > prev ? 'up' : 'down';
          setFlashMap(f => ({ ...f, [symbol]: dir }));
          if (flashTimers.current[symbol]) clearTimeout(flashTimers.current[symbol]);
          flashTimers.current[symbol] = setTimeout(() =>
            setFlashMap(f => { const n = { ...f }; delete n[symbol]; return n; }),
            FLASH_MS
          );
        }
        prevPrices.current[symbol] = data;
      }
    });

    const unsubStatus = finnhubWs.onStatus(setWsStatus);

    return () => { unsubPrice(); unsubStatus(); };
  }, []);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const allSymbols = symbols.length > 0 ? symbols : Object.keys(prices).map(s => ({
    symbol: s, display: s, label: s, category: 'stocks', unit: '$', dec: 2
  }));

  const filtered = allSymbols.filter(m => {
    const catMatch = category === 'All' || m.category === category.toLowerCase();
    const q = search.toLowerCase();
    const searchMatch = !q || m.display.toLowerCase().includes(q) || m.label.toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = prices[a.symbol] || {};
    const db = prices[b.symbol] || {};
    let va, vb;
    if (sortKey === 'changePct') { va = da.changePct ?? -999; vb = db.changePct ?? -999; }
    else if (sortKey === 'price')  { va = da.price ?? 0;       vb = db.price ?? 0; }
    else                           { va = a.display;           vb = b.display; }
    if (sortAsc) return typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return typeof va === 'string' ? vb.localeCompare(va) : vb - va;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return null;
    return sortAsc
      ? <ChevronUp   className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  // ── Summary stats ────────────────────────────────────────────────────────
  const gainers = allSymbols.filter(m => (prices[m.symbol]?.changePct ?? 0) > 0).length;
  const losers  = allSymbols.filter(m => (prices[m.symbol]?.changePct ?? 0) < 0).length;
  const loaded  = allSymbols.filter(m => prices[m.symbol]?.price != null).length;

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <Activity className="w-5 h-5 text-white" style={{ color: '#fff' }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Live Market Data</h2>
            </div>
            <p className="text-sm ml-12" style={{ color: theme.muted }}>
              Real-time prices · Stocks · Forex · Crypto
            </p>
          </div>
          <StatusBar status={wsStatus} connectedCount={loaded} lastUpdate={lastUpdate} theme={theme} />
        </div>

        {/* ── Summary cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Instruments" value={loaded} sub={`of ${allSymbols.length} loaded`} color="#3b82f6" icon={Activity}    theme={theme} />
          <SummaryCard label="Gainers"     value={gainers} sub="positive today"                  color="#22c55e" icon={TrendingUp}  theme={theme} />
          <SummaryCard label="Losers"      value={losers}  sub="negative today"                  color="#ef4444" icon={TrendingDown} theme={theme} />
          <SummaryCard label="Stream"      value="Live"    sub="WebSocket feed"                  color="#0ea5e9" icon={Wifi}        theme={theme} />
        </div>

        {/* ── Filters + search ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: category === c ? theme.accent : 'transparent',
                  color: category === c ? '#fff' : theme.muted,
                }}>
                {c}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search symbol or name…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
              onFocus={e => e.target.style.borderColor = theme.accent}
              onBlur={e => e.target.style.borderColor = theme.border}
            />
          </div>

          {/* Manual re-seed button */}
          <button
            onClick={() => finnhubWs.disconnect() || setTimeout(() => finnhubWs.connect(), 200)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}
            title="Reconnect"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </button>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>

          {/* Table header */}
          <div className="grid px-4 py-2.5"
            style={{
              gridTemplateColumns: '2.5rem 1fr 1fr 1fr 1fr',
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderBottom: `1px solid ${theme.border}`,
            }}>
            <span className="text-xs font-semibold uppercase" style={{ color: theme.muted }}>#</span>
            <button className="text-xs font-semibold uppercase text-left" style={{ color: theme.muted }}
              onClick={() => toggleSort('symbol')}>
              Symbol <SortIcon k="symbol" />
            </button>
            <button className="text-xs font-semibold uppercase text-right" style={{ color: theme.muted }}
              onClick={() => toggleSort('price')}>
              Price <SortIcon k="price" />
            </button>
            <button className="text-xs font-semibold uppercase text-right" style={{ color: theme.muted }}
              onClick={() => toggleSort('changePct')}>
              Change <SortIcon k="changePct" />
            </button>
            <span className="text-xs font-semibold uppercase text-right hidden sm:block" style={{ color: theme.muted }}>
              High / Low
            </span>
          </div>

          {/* Rows */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              {wsStatus === 'connecting' || wsStatus === 'idle' ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.accent }} />
                  <p className="text-sm" style={{ color: theme.muted }}>Connecting to live data stream…</p>
                </>
              ) : (
                <>
                  <WifiOff className="w-8 h-8" style={{ color: theme.muted }} />
                  <p className="text-sm" style={{ color: theme.muted }}>
                    {search ? 'No symbols match your search.' : 'No data available.'}
                  </p>
                </>
              )}
            </div>
          ) : (
            sorted.map((meta, idx) => (
              <PriceRow
                key={meta.symbol}
                meta={meta}
                data={prices[meta.symbol]}
                flash={flashMap[meta.symbol]}
                theme={theme}
                idx={idx}
              />
            ))
          )}
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <p className="text-center text-xs pb-2" style={{ color: theme.muted }}>
          Prices are indicative. Sourced via real-time server-side data streams.
        </p>
      </div>
    </div>
  );
}
