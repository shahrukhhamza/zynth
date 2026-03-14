import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, LineStyle, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import {
  FlaskConical, Play, Loader2, AlertCircle, TrendingUp, TrendingDown,
  Trophy, Target, BarChart2, ChevronLeft, ChevronRight, Lock, Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlanGate } from '../hooks/usePlanGate';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useTimezone } from '../contexts/TimezoneContext';
import UpgradeModal from './UpgradeModal';

// ── Symbol list ──────────────────────────────────────────────────────────────
const SYMBOLS = [
  'XAU/USD','EUR/USD','GBP/USD','USD/JPY','GBP/JPY',
  'AUD/USD','USD/CAD','NZD/USD','BTC/USD','ETH/USD','XRP/USD','SOL/USD','SPX','NDX',
];

const INTERVALS = [
  { label: '1 Minute',  value: '1min'  },
  { label: '5 Minutes', value: '5min'  },
  { label: '15 Minutes',value: '15min' },
  { label: '30 Minutes',value: '30min' },
  { label: '1 Hour',    value: '1h'    },
  { label: '4 Hours',   value: '4h'    },
  { label: '1 Day',     value: '1day'  },
];

const STRATEGIES = [
  {
    id: 'ema_cross',
    label: 'EMA Crossover',
    desc: 'Fast EMA crosses above/below slow EMA',
    params: [
      { key: 'fastEMA', label: 'Fast EMA Period', default: 9,  min: 2,  max: 200 },
      { key: 'slowEMA', label: 'Slow EMA Period', default: 21, min: 3,  max: 500 },
    ],
  },
  {
    id: 'rsi_oversold',
    label: 'RSI Strategy',
    desc: 'Buy oversold, sell overbought via RSI',
    params: [
      { key: 'period',     label: 'RSI Period',        default: 14, min: 2,  max: 100 },
      { key: 'oversold',   label: 'Oversold Level',    default: 30, min: 5,  max: 45  },
      { key: 'overbought', label: 'Overbought Level',  default: 70, min: 55, max: 95  },
    ],
  },
  {
    id: 'macd',
    label: 'MACD Strategy',
    desc: 'MACD line crosses above/below signal',
    params: [
      { key: 'fast',   label: 'Fast Period',   default: 12, min: 2,  max: 100 },
      { key: 'slow',   label: 'Slow Period',   default: 26, min: 5,  max: 200 },
      { key: 'signal', label: 'Signal Period', default: 9,  min: 2,  max: 50  },
    ],
  },
  {
    id: 'bollinger',
    label: 'Bollinger Bands',
    desc: 'Buy lower band touch, sell upper band touch',
    params: [
      { key: 'period', label: 'Band Period',         default: 20, min: 5,  max: 200 },
      { key: 'stdDev', label: 'Std Dev Multiplier',  default: 2,  min: 0.5, max: 4, step: 0.1 },
    ],
  },
  {
    id: 'support_resistance',
    label: 'S&R Breakout',
    desc: 'Buy breakout above resistance, sell below support',
    params: [
      { key: 'lookback', label: 'Lookback Period', default: 20, min: 5, max: 200 },
    ],
  },
  {
    id: 'ma_rsi_combo',
    label: 'MA + RSI Combo',
    desc: 'Price above MA & RSI crosses oversold level',
    params: [
      { key: 'maPeriod',      label: 'MA Period',            default: 50, min: 5,  max: 500 },
      { key: 'rsiPeriod',     label: 'RSI Period',           default: 14, min: 2,  max: 100 },
      { key: 'rsiOversold',   label: 'RSI Oversold Level',   default: 40, min: 10, max: 49  },
      { key: 'rsiOverbought', label: 'RSI Overbought Level', default: 60, min: 51, max: 90  },
    ],
  },
];

const TRADES_PER_PAGE = 20;

function formatDate(unixSec, formatFn) {
  try { return formatFn(new Date(unixSec * 1000), 'MMM dd, yyyy HH:mm'); }
  catch { return new Date(unixSec * 1000).toLocaleString(); }
}

function formatDuration(sec) {
  if (!sec || sec < 2)  return '—';
  if (sec < 120)        return `${sec}s`;
  if (sec < 7200)       return `${Math.round(sec / 60)}m`;
  if (sec < 86400)      return `${Math.round(sec / 3600)}h`;
  return `${(sec / 86400).toFixed(1)}d`;
}

const COMMISSION_HINTS = {
  'XAU/USD': '~$0.30 typical spread',  'EUR/USD': '~$0.07 typical spread',
  'GBP/USD': '~$0.10 typical spread',  'USD/JPY': '~$0.08 typical spread',
  'GBP/JPY': '~$0.15 typical spread',  'AUD/USD': '~$0.09 typical spread',
  'BTC/USD': '~$2.00 typical spread',  'ETH/USD': '~$0.80 typical spread',
};

function StatCard({ label, value, color, sub }) {
  const theme = useTheme();
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
      <div className="text-xs mb-1" style={{ color: theme.muted }}>{label}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color: color ?? theme.text }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: theme.muted }}>{sub}</div>}
    </div>
  );
}

function EquityCurve({ equityCurve, trades, theme }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !equityCurve?.length) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 220,
      layout: { background: { color: 'transparent' }, textColor: theme.isDark ? '#9ca3af' : '#6b7280', fontSize: 11 },
      grid: {
        vertLines: { color: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        horzLines: { color: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      rightPriceScale: { borderColor: theme.isDark ? '#374151' : '#e5e7eb' },
      timeScale:       { borderColor: theme.isDark ? '#374151' : '#e5e7eb', timeVisible: true },
    });
    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#10b981', lineWidth: 2, priceLineVisible: false,
    });

    // Deduplicate by time (take last value per timestamp)
    const timeMap = new Map();
    for (const pt of equityCurve) timeMap.set(pt.time, pt.value);
    const deduped = Array.from(timeMap.entries()).sort((a, b) => a[0] - b[0]).map(([time, value]) => ({ time, value }));
    lineSeries.setData(deduped);

    // Buy/sell markers
    if (trades?.length) {
      const markers = [];
      for (const t of trades) {
        markers.push({ time: t.entryTime, position: 'belowBar', color: '#10b981', shape: 'arrowUp',   text: 'B' });
        markers.push({ time: t.exitTime,  position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'S' });
      }
      createSeriesMarkers(lineSeries, markers.sort((a, b) => a.time - b.time));
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);
    chart.timeScale().fitContent();

    return () => { ro.disconnect(); };
  }, [equityCurve, trades, theme.isDark]);

  return <div ref={containerRef} style={{ width: '100%', height: 220 }} />;
}

export default function BacktestEngine() {
  const theme   = useTheme();
  const { token } = useAuth();
  const { isFree } = usePlanGate();
  const { formatDateWithTimezone } = useTimezone();

  const [symbol,   setSymbol]   = useState('XAU/USD');
  const [interval, setInterval] = useState('1h');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [endDate,   setEndDate]   = useState(() => new Date().toISOString().slice(0, 10));
  const [capital,   setCapital]   = useState('10000');
  const [strategy,  setStrategy]  = useState('ema_cross');
  const [params,    setParams]    = useState(() => buildDefaultParams('ema_cross'));
  const [running,   setRunning]   = useState(false);
  const [results,   setResults]   = useState(null);
  const [error,     setError]     = useState(null);
  const [tradePage, setTradePage] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [riskMgmt, setRiskMgmt] = useState({
    slType: 'none',       slValue: '50',
    tpType: 'none',       tpValue: '100',
    posSizeType: 'percent', posSizeValue: '100',
    maxOpenTrades: '1',   commission: '0',
  });
  const setRM = (key, val) => setRiskMgmt(prev => ({ ...prev, [key]: val }));

  function buildDefaultParams(stratId) {
    const s = STRATEGIES.find(s => s.id === stratId);
    return Object.fromEntries((s?.params ?? []).map(p => [p.key, p.default]));
  }

  const handleStrategyChange = (id) => {
    setStrategy(id);
    setParams(buildDefaultParams(id));
    setResults(null);
    setError(null);
  };

  const handleParamChange = (key, val) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const runBacktest = useCallback(async () => {
    if (isFree) { setShowUpgradeModal(true); return; }
    setRunning(true);
    setError(null);
    setResults(null);
    setTradePage(1);
    try {
      const qs = new URLSearchParams({
        symbol, interval, strategy, startDate, endDate, capital,
        params: JSON.stringify(params),
        ...riskMgmt,
      });
      const res  = await fetch(`${API_URL}/api/charts/backtest?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Backtest failed');
      setResults(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }, [isFree, symbol, interval, strategy, startDate, endDate, capital, params, token, riskMgmt]);

  const stratMeta    = STRATEGIES.find(s => s.id === strategy);
  const bull = '#10b981', bear = '#ef4444';
  const totalPnLColor = results ? (results.totalPnL >= 0 ? bull : bear) : theme.text;

  // Paginate trades
  const allTrades   = results?.trades ?? [];
  const totalPages  = Math.ceil(allTrades.length / TRADES_PER_PAGE);
  const pageTrades  = allTrades.slice((tradePage - 1) * TRADES_PER_PAGE, tradePage * TRADES_PER_PAGE);

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      {showUpgradeModal && <UpgradeModal open={true} onClose={() => setShowUpgradeModal(false)} />}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-7 h-7" style={{ color: theme.accent }} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Backtesting Engine</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>PRO</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: theme.muted }}>
                Test trading strategies on historical data before risking real money
              </p>
            </div>
          </div>
        </div>

        {/* Free user gate banner */}
        {isFree && (
          <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border"
            style={{ backgroundColor: theme.isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
              <Lock className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: theme.text }}>Backtesting requires Pro or Elite</p>
              <p className="text-sm mt-0.5" style={{ color: theme.muted }}>
                Upgrade to run unlimited backtests across all symbols and timeframes.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: theme.accent }}
            >
              <Zap className="w-4 h-4" /> Upgrade
            </button>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* ── LEFT PANEL: Configuration ───────────────────────────── */}
          <div className="rounded-2xl border space-y-5 p-5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: theme.muted }}>Configuration</h3>

            {/* Section 1: Asset */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>Asset & Period</p>

              <label className="block">
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Symbol</span>
                <select value={symbol} onChange={e => setSymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                  {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Interval</span>
                <select value={interval} onChange={e => setInterval(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                  {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Start Date</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
                </label>
                <label className="block">
                  <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>End Date</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
                </label>
              </div>

              <label className="block">
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Starting Capital ($)</span>
                <input type="number" value={capital} min="100" max="10000000"
                  onChange={e => setCapital(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
              </label>
            </div>

            <div className="border-t" style={{ borderColor: theme.border }} />

            {/* Section 2: Strategy */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>Strategy</p>
              {STRATEGIES.map(s => (
                <button key={s.id}
                  onClick={() => handleStrategyChange(s.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: strategy === s.id
                      ? (theme.isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)')
                      : 'transparent',
                    borderColor: strategy === s.id ? `${theme.accent}60` : theme.border,
                    color: strategy === s.id ? theme.accent : theme.text,
                  }}
                >
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: theme.muted }}>{s.desc}</div>
                </button>
              ))}
            </div>

            <div className="border-t" style={{ borderColor: theme.border }} />

            {/* Section 3: Parameters */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>Parameters</p>
              {stratMeta?.params.map(p => (
                <label key={p.key} className="block">
                  <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>{p.label}</span>
                  <input
                    type="number"
                    value={params[p.key] ?? p.default}
                    min={p.min} max={p.max} step={p.step ?? 1}
                    onChange={e => handleParamChange(p.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  />
                </label>
              ))}
            </div>

            <div className="border-t" style={{ borderColor: theme.border }} />

            {/* Section 4: Risk Management */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>Risk Management</p>

              {/* Stop Loss */}
              <div>
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Stop Loss</span>
                <div className="flex gap-2">
                  <select value={riskMgmt.slType} onChange={e => setRM('slType', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                    <option value="none">None</option>
                    <option value="pips">Fixed Pips</option>
                    <option value="percent">% of Price</option>
                  </select>
                  {riskMgmt.slType !== 'none' && (
                    <input type="number" value={riskMgmt.slValue} min="0.01" step="0.1"
                      onChange={e => setRM('slValue', e.target.value)}
                      className="w-20 px-2 py-2 rounded-lg text-sm border focus:outline-none"
                      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      placeholder={riskMgmt.slType === 'percent' ? '%' : 'pips'} />
                  )}
                </div>
              </div>

              {/* Take Profit */}
              <div>
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Take Profit</span>
                <div className="flex gap-2">
                  <select value={riskMgmt.tpType} onChange={e => setRM('tpType', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                    <option value="none">None</option>
                    <option value="pips">Fixed Pips</option>
                    <option value="percent">% of Price</option>
                  </select>
                  {riskMgmt.tpType !== 'none' && (
                    <input type="number" value={riskMgmt.tpValue} min="0.01" step="0.1"
                      onChange={e => setRM('tpValue', e.target.value)}
                      className="w-20 px-2 py-2 rounded-lg text-sm border focus:outline-none"
                      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      placeholder={riskMgmt.tpType === 'percent' ? '%' : 'pips'} />
                  )}
                </div>
              </div>

              {/* Position Size */}
              <div>
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Position Size</span>
                <div className="flex gap-2">
                  <select value={riskMgmt.posSizeType} onChange={e => setRM('posSizeType', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                    <option value="percent">% of Capital</option>
                    <option value="fixed">Fixed $ Amount</option>
                  </select>
                  <input type="number" value={riskMgmt.posSizeValue} min="1"
                    onChange={e => setRM('posSizeValue', e.target.value)}
                    className="w-20 px-2 py-2 rounded-lg text-sm border focus:outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    placeholder={riskMgmt.posSizeType === 'percent' ? '100' : '$'} />
                </div>
              </div>

              {/* Max open trades */}
              <label className="block">
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Max Open Trades</span>
                <input type="number" value={riskMgmt.maxOpenTrades} min="1" max="5"
                  onChange={e => setRM('maxOpenTrades', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
              </label>

              {/* Commission */}
              <label className="block">
                <span className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Commission per Trade ($)</span>
                <input type="number" value={riskMgmt.commission} min="0" step="0.01"
                  onChange={e => setRM('commission', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} />
                {COMMISSION_HINTS[symbol] && (
                  <p className="text-xs mt-1" style={{ color: theme.muted }}>{COMMISSION_HINTS[symbol]}</p>
                )}
              </label>
            </div>

            {/* Run button */}
            <button
              onClick={runBacktest}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: running ? `${theme.accent}88` : theme.accent }}
            >
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Backtest…</>
                : <><Play className="w-4 h-4" /> Run Backtest</>}
            </button>
          </div>

          {/* ── RIGHT PANEL: Results ─────────────────────────────────── */}
          <div className="space-y-5 min-w-0">

            {/* Empty state */}
            {!results && !running && !error && (
              <div className="rounded-2xl border flex flex-col items-center justify-center py-20 gap-4"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <BarChart2 className="w-14 h-14 opacity-20" style={{ color: theme.accent }} />
                <div className="text-center">
                  <p className="font-semibold" style={{ color: theme.text }}>Configure and run a backtest</p>
                  <p className="text-sm mt-1" style={{ color: theme.muted }}>
                    Select a symbol, strategy, and date range, then click Run Backtest
                  </p>
                </div>
              </div>
            )}

            {/* Running spinner */}
            {running && (
              <div className="rounded-2xl border flex flex-col items-center justify-center py-20 gap-4"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.accent }} />
                <p className="text-sm" style={{ color: theme.muted }}>Fetching data and running strategy…</p>
              </div>
            )}

            {/* Error state */}
            {error && !running && (
              <div className="rounded-2xl border flex flex-col items-center justify-center py-16 gap-3"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <AlertCircle className="w-12 h-12" style={{ color: '#ef4444' }} />
                <p className="font-semibold" style={{ color: theme.text }}>Backtest failed</p>
                <p className="text-sm text-center px-6" style={{ color: theme.muted }}>{error}</p>
                <button onClick={runBacktest}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: theme.accent }}>
                  <Play className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}

            {/* Results */}
            {results && !running && (
              <>
                {/* Stats grid — row 1: core */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Total Return"  value={`${results.totalPnLPercent >= 0 ? '+' : ''}${results.totalPnLPercent}%`} color={totalPnLColor} sub={`${results.totalPnL >= 0 ? '+' : ''}$${results.totalPnL.toFixed(2)}`} />
                  <StatCard label="Win Rate"      value={`${results.winRate}%`}      color={results.winRate >= 50 ? bull : bear} sub={`${results.winningTrades}W / ${results.losingTrades}L`} />
                  <StatCard label="Total Trades"  value={results.totalTrades}        sub={`${results.winningTrades} winning`} />
                  <StatCard label="Profit Factor" value={results.profitFactor === 999 ? '∞' : results.profitFactor} color={results.profitFactor >= 1 ? bull : bear} />
                  <StatCard label="Max Drawdown"  value={`${results.maxDrawdown}%`}  color={bear} sub="Peak-to-trough" />
                  <StatCard label="Sharpe Ratio"  value={results.sharpeRatio}        color={results.sharpeRatio >= 1 ? bull : results.sharpeRatio >= 0 ? '#f59e0b' : bear} />
                  <StatCard label="Best Trade"    value={`+$${results.bestTrade}`}   color={bull} />
                  <StatCard label="Worst Trade"   value={`-$${Math.abs(results.worstTrade)}`} color={bear} />
                </div>

                {/* Stats grid — row 2: advanced */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <StatCard label="Avg Duration"      value={formatDuration(results.avgDurationSec)} sub="per trade" />
                  <StatCard label="Consec. Wins"       value={results.maxConsecWins}    color={bull} sub="best streak" />
                  <StatCard label="Consec. Losses"     value={results.maxConsecLosses}  color={bear} sub="worst streak" />
                  <StatCard label="Recovery Factor"    value={results.recoveryFactor === 999 ? '∞' : results.recoveryFactor} color={results.recoveryFactor >= 1 ? bull : bear} sub="return / drawdown" />
                  <StatCard label="Expectancy / Trade" value={`${results.expectancy >= 0 ? '+' : ''}$${results.expectancy.toFixed(2)}`} color={results.expectancy >= 0 ? bull : bear} sub="avg per trade" />
                </div>

                {/* Buy & Hold comparison */}
                {results.buyAndHold && (
                  <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <h4 className="font-bold text-sm mb-3" style={{ color: theme.text }}>Strategy vs Buy &amp; Hold</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs mb-1" style={{ color: theme.muted }}>Strategy Return</div>
                        <div className="text-xl font-bold tabular-nums" style={{ color: totalPnLColor }}>
                          {results.totalPnLPercent >= 0 ? '+' : ''}{results.totalPnLPercent}%
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: theme.muted }}>
                          Final: ${results.finalCapital.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: theme.muted }}>Buy &amp; Hold Return</div>
                        <div className="text-xl font-bold tabular-nums" style={{ color: results.buyAndHold.returnPct >= 0 ? bull : bear }}>
                          {results.buyAndHold.returnPct >= 0 ? '+' : ''}{results.buyAndHold.returnPct}%
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: theme.muted }}>
                          {results.buyAndHold.pnl >= 0 ? '+' : ''}${results.buyAndHold.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} on same capital
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: theme.border }}>
                      {results.totalPnLPercent > results.buyAndHold.returnPct ? (
                        <><TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: bull }} />
                          <span className="text-sm font-semibold" style={{ color: bull }}>
                            Strategy outperformed Buy &amp; Hold by +{(results.totalPnLPercent - results.buyAndHold.returnPct).toFixed(2)}%
                          </span></>
                      ) : results.totalPnLPercent < results.buyAndHold.returnPct ? (
                        <><TrendingDown className="w-4 h-4 flex-shrink-0" style={{ color: bear }} />
                          <span className="text-sm font-semibold" style={{ color: bear }}>
                            Buy &amp; Hold beat strategy by {(results.buyAndHold.returnPct - results.totalPnLPercent).toFixed(2)}%
                          </span></>
                      ) : (
                        <span className="text-sm" style={{ color: theme.muted }}>Equal performance</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Commission note */}
                <p className="text-xs px-1" style={{ color: theme.muted }}>
                  {parseFloat(riskMgmt.commission) > 0
                    ? `Results include $${parseFloat(riskMgmt.commission).toFixed(2)} commission per trade (${results.totalTrades} trades = $${(parseFloat(riskMgmt.commission) * results.totalTrades).toFixed(2)} total). `
                    : ''}
                  Spread, slippage, and partial fills are not simulated.
                </p>

                {/* Equity curve */}
                <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold" style={{ color: theme.text }}>Equity Curve</h4>
                    <div className="flex items-center gap-3 text-xs" style={{ color: theme.muted }}>
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-green-400 inline-block rounded-full" /> Portfolio value</span>
                      <span className="flex items-center gap-1"><span style={{ color: bull }}>▲</span> Buy</span>
                      <span className="flex items-center gap-1"><span style={{ color: bear }}>▼</span> Sell</span>
                    </div>
                  </div>
                  <EquityCurve equityCurve={results.equityCurve} trades={results.trades} theme={theme} />
                </div>

                {/* Trades table */}
                {allTrades.length > 0 && (
                  <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: theme.border }}>
                      <h4 className="font-bold" style={{ color: theme.text }}>
                        All Trades <span className="text-sm font-normal" style={{ color: theme.muted }}>({allTrades.length})</span>
                      </h4>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: theme.muted }}>
                          <button disabled={tradePage === 1} onClick={() => setTradePage(p => p - 1)}
                            className="p-1 rounded disabled:opacity-30" style={{ color: theme.accent }}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          {tradePage} / {totalPages}
                          <button disabled={tradePage === totalPages} onClick={() => setTradePage(p => p + 1)}
                            className="p-1 rounded disabled:opacity-30" style={{ color: theme.accent }}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                            {['#', 'Entry Date', 'Exit Date', 'Entry Price', 'Exit Price', 'Exit', 'PnL $', 'PnL %', 'Result'].map(h => (
                              <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageTrades.map((t, i) => {
                            const isWin = t.result === 'WIN';
                            const rowBg = isWin
                              ? (theme.isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.05)')
                              : (theme.isDark ? 'rgba(239,68,68,0.06)'  : 'rgba(239,68,68,0.05)');
                            return (
                              <tr key={i} style={{ backgroundColor: rowBg, borderBottom: `1px solid ${theme.border}` }}>
                                <td className="px-4 py-2 text-xs" style={{ color: theme.muted }}>{(tradePage - 1) * TRADES_PER_PAGE + i + 1}</td>
                                <td className="px-4 py-2 text-xs">{formatDate(t.entryTime, formatDateWithTimezone)}</td>
                                <td className="px-4 py-2 text-xs">{formatDate(t.exitTime, formatDateWithTimezone)}</td>
                                <td className="px-4 py-2 font-mono tabular-nums">{t.entryPrice.toFixed(5)}</td>
                                <td className="px-4 py-2 font-mono tabular-nums">{t.exitPrice.toFixed(5)}</td>
                                <td className="px-4 py-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                    style={{
                                      backgroundColor: t.exitReason === 'SL' ? 'rgba(239,68,68,0.15)' : t.exitReason === 'TP' ? 'rgba(16,185,129,0.15)' : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                      color: t.exitReason === 'SL' ? bear : t.exitReason === 'TP' ? bull : theme.muted,
                                    }}>
                                    {t.exitReason ?? 'Signal'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 font-semibold tabular-nums" style={{ color: isWin ? bull : bear }}>
                                  {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 font-semibold tabular-nums" style={{ color: isWin ? bull : bear }}>
                                  {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                                </td>
                                <td className="px-4 py-2">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                    style={{ backgroundColor: isWin ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isWin ? bull : bear }}>
                                    {t.result}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
