import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, CrosshairMode, LineStyle, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import {
  RefreshCw, TrendingUp, TrendingDown, Loader2, AlertCircle,
  Eye, EyeOff, ChevronDown, Activity,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const SYMBOLS = [
  { value: 'XAU/USD',  label: 'XAU/USD',  group: 'Forex'   },
  { value: 'EUR/USD',  label: 'EUR/USD',  group: 'Forex'   },
  { value: 'GBP/USD',  label: 'GBP/USD',  group: 'Forex'   },
  { value: 'USD/JPY',  label: 'USD/JPY',  group: 'Forex'   },
  { value: 'GBP/JPY',  label: 'GBP/JPY',  group: 'Forex'   },
  { value: 'AUD/USD',  label: 'AUD/USD',  group: 'Forex'   },
  { value: 'USD/CAD',  label: 'USD/CAD',  group: 'Forex'   },
  { value: 'NZD/USD',  label: 'NZD/USD',  group: 'Forex'   },
  { value: 'BTC/USD',  label: 'BTC/USD',  group: 'Crypto'  },
  { value: 'ETH/USD',  label: 'ETH/USD',  group: 'Crypto'  },
  { value: 'XRP/USD',  label: 'XRP/USD',  group: 'Crypto'  },
  { value: 'SOL/USD',  label: 'SOL/USD',  group: 'Crypto'  },
  { value: 'SPX',      label: 'S&P 500',  group: 'Indices' },
  { value: 'NDX',      label: 'NASDAQ',   group: 'Indices' },
];

const TIMEFRAMES = [
  { label: '1M',  value: '1min',  outputsize: 120 },
  { label: '5M',  value: '5min',  outputsize: 200 },
  { label: '15M', value: '15min', outputsize: 200 },
  { label: '30M', value: '30min', outputsize: 200 },
  { label: '1H',  value: '1h',    outputsize: 300 },
  { label: '4H',  value: '4h',    outputsize: 300 },
  { label: '1D',  value: '1day',  outputsize: 365 },
];

function getRefreshMs(interval) {
  return interval === '1min' ? 30_000 : 120_000;
}

export default function LiveChart() {
  const theme   = useTheme();
  const { token } = useAuth();

  const [symbol,   setSymbol]   = useState('XAU/USD');
  const [tf,       setTf]       = useState('1h');
  const [candles,  setCandles]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showEMA,  setShowEMA]  = useState(true);
  const [symOpen,  setSymOpen]  = useState(false);
  const [lastPrice, setLastPrice] = useState(null);
  const [prevClose, setPrevClose] = useState(null);

  const chartContainerRef = useRef(null);
  const chartRef          = useRef(null);
  const candleSeriesRef   = useRef(null);
  const volumeSeriesRef   = useRef(null);
  const ema9Ref           = useRef(null);
  const ema21Ref          = useRef(null);
  const timerRef          = useRef(null);

  // ── Fetch candles ──────────────────────────────────────────────────────────
  const tfMeta = TIMEFRAMES.find(t => t.value === tf) ?? TIMEFRAMES[4];

  const fetchCandles = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/charts/candles?symbol=${encodeURIComponent(symbol)}&interval=${tf}&outputsize=${tfMeta.outputsize}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load chart data');
      setCandles(json.data);
      if (json.data.length > 0) {
        setLastPrice(json.data[json.data.length - 1].close);
        setPrevClose(json.data.length > 1 ? json.data[json.data.length - 2].close : null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, tf, tfMeta.outputsize, token]);

  // Initial + on symbol/tf change
  useEffect(() => {
    fetchCandles(true);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchCandles(false), getRefreshMs(tf));
    return () => clearInterval(timerRef.current);
  }, [fetchCandles, tf]);

  // ── Build / rebuild chart ────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Destroy old chart
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const isDark = theme.isDark;
    const chart = createChart(chartContainerRef.current, {
      width:  chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background:  { color: 'transparent' },
        textColor:   isDark ? '#9ca3af' : '#6b7280',
        fontSize:    12,
        fontFamily:  'Inter, sans-serif',
      },
      grid: {
        vertLines:   { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        horzLines:   { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: isDark ? '#4b5563' : '#9ca3af', style: LineStyle.Dashed, labelBackgroundColor: isDark ? '#1f2937' : '#f3f4f6' },
        horzLine: { color: isDark ? '#4b5563' : '#9ca3af', style: LineStyle.Dashed, labelBackgroundColor: isDark ? '#1f2937' : '#f3f4f6' },
      },
      rightPriceScale: { borderColor: isDark ? '#374151' : '#e5e7eb' },
      timeScale:       { borderColor: isDark ? '#374151' : '#e5e7eb', timeVisible: true, secondsVisible: false },
    });

    chartRef.current = chart;

    // Candlestick series
    const cs = chart.addSeries(CandlestickSeries, {
      upColor:         '#10b981',
      downColor:       '#ef4444',
      borderUpColor:   '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor:     '#10b981',
      wickDownColor:   '#ef4444',
    });
    candleSeriesRef.current = cs;

    // Volume histogram (separate pane)
    const vs = chart.addSeries(HistogramSeries, {
      color:    '#6b728040',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volumeSeriesRef.current = vs;

    // EMA lines
    const e9  = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: 'EMA 9',  priceLineVisible: false });
    const e21 = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1, title: 'EMA 21', priceLineVisible: false });
    ema9Ref.current  = e9;
    ema21Ref.current = e21;

    // Responsive resize
    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    });
    ro.observe(chartContainerRef.current);

    return () => { ro.disconnect(); };
  }, [theme.isDark]);

  // ── Feed data into chart ────────────────────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    candleSeriesRef.current.setData(candles);

    // Volume
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(candles.map(c => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
      })));
    }

    // EMA overlays
    if (ema9Ref.current && ema21Ref.current) {
      const closes = candles.map(c => c.close);
      const ema9d  = calcEMAData(closes, candles, 9);
      const ema21d = calcEMAData(closes, candles, 21);
      ema9Ref.current.setData(showEMA ? ema9d  : []);
      ema21Ref.current.setData(showEMA ? ema21d : []);
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, showEMA]);

  // toggle EMA without refetch
  useEffect(() => {
    if (!ema9Ref.current || candles.length === 0) return;
    const closes = candles.map(c => c.close);
    const ema9d  = calcEMAData(closes, candles, 9);
    const ema21d = calcEMAData(closes, candles, 21);
    ema9Ref.current.setData(showEMA ? ema9d  : []);
    ema21Ref.current.setData(showEMA ? ema21d : []);
  }, [showEMA]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────
  function calcEMAData(closes, candles, period) {
    const k = 2 / (period + 1);
    const res = [];
    let seed = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period - 1; i < closes.length; i++) {
      if (i === period - 1) { res.push({ time: candles[i].time, value: seed }); }
      else { seed = closes[i] * k + seed * (1 - k); res.push({ time: candles[i].time, value: seed }); }
    }
    return res;
  }

  const changePct = lastPrice && prevClose ? ((lastPrice - prevClose) / prevClose) * 100 : null;
  const isUp      = changePct !== null ? changePct >= 0 : true;

  const selectedSymMeta = SYMBOLS.find(s => s.value === symbol);
  const groupedSymbols  = SYMBOLS.reduce((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7" style={{ color: theme.accent }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Live Charts</h2>
              <p className="text-sm mt-0.5" style={{ color: theme.muted }}>
                Professional candlestick charts with real-time data
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCandles(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Chart Card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: theme.border }}>

            {/* Symbol selector */}
            <div className="relative">
              <button
                onClick={() => setSymOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, minWidth: 120 }}
              >
                {symbol}
                <ChevronDown className="w-4 h-4 ml-auto" style={{ color: theme.muted }} />
              </button>
              {symOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 rounded-xl border shadow-2xl overflow-auto"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border, minWidth: 200, maxHeight: 320 }}>
                  {Object.entries(groupedSymbols).map(([grp, items]) => (
                    <div key={grp}>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{grp}</div>
                      {items.map(s => (
                        <button key={s.value}
                          onClick={() => { setSymbol(s.value); setSymOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm font-medium transition-colors"
                          style={{
                            color: s.value === symbol ? theme.accent : theme.text,
                            backgroundColor: s.value === symbol ? (theme.isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)') : 'transparent',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = s.value === symbol ? (theme.isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)') : 'transparent'}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeframe buttons */}
            <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
              {TIMEFRAMES.map(t => (
                <button key={t.value}
                  onClick={() => setTf(t.value)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: tf === t.value ? theme.accent : 'transparent',
                    color: tf === t.value ? '#fff' : theme.muted,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* EMA toggle */}
            <button
              onClick={() => setShowEMA(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                backgroundColor: showEMA ? 'rgba(245,158,11,0.15)' : theme.bg,
                color: showEMA ? '#f59e0b' : theme.muted,
                border: `1px solid ${showEMA ? 'rgba(245,158,11,0.4)' : theme.border}`,
              }}
            >
              {showEMA ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              EMA 9/21
            </button>
          </div>

          {/* Price display */}
          <div className="flex items-center gap-4 px-5 py-3 border-b" style={{ borderColor: theme.border }}>
            <div>
              <span className="text-3xl font-bold tabular-nums" style={{ color: theme.text }}>
                {lastPrice ? lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '—'}
              </span>
              {changePct !== null && (
                <span className="ml-3 flex items-center gap-1 text-sm font-semibold inline-flex" style={{ color: isUp ? '#10b981' : '#ef4444' }}>
                  {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isUp ? '+' : ''}{changePct.toFixed(3)}%
                </span>
              )}
            </div>
            <div className="text-xs ml-auto" style={{ color: theme.muted }}>
              <span className="font-semibold">{selectedSymMeta?.group}</span> · {tfMeta.label} chart · {candles.length} candles
            </div>
          </div>

          {/* Chart area */}
          <div className="relative" style={{ height: 500 }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10"
                style={{ backgroundColor: `${theme.surface}e0` }}>
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.accent }} />
                  <span className="text-sm" style={{ color: theme.muted }}>Loading chart data…</span>
                </div>
              </div>
            )}
            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <AlertCircle className="w-10 h-10" style={{ color: '#ef4444' }} />
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{error}</p>
                  <button
                    onClick={() => fetchCandles(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              </div>
            )}
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* EMA legend */}
          {showEMA && (
            <div className="flex items-center gap-4 px-5 py-2 border-t" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: theme.muted }}>
                <span className="w-6 h-0.5 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} />
                EMA 9
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: theme.muted }}>
                <span className="w-6 h-0.5 rounded-full inline-block" style={{ backgroundColor: '#60a5fa' }} />
                EMA 21
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs" style={{ color: theme.muted }}>
          Prices are indicative. Chart data refreshes automatically every {getRefreshMs(tf) / 1000}s.
        </p>
      </div>
    </div>
  );
}
