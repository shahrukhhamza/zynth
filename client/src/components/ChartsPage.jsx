import { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Clock, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ── Symbol map ─────────────────────────────────────────────────────────── */
const SYMBOL_GROUPS = [
  {
    group: 'Forex',
    items: [
      { label: 'XAU/USD',  tv: 'OANDA:XAUUSD'   },
      { label: 'EUR/USD',  tv: 'OANDA:EURUSD'   },
      { label: 'GBP/USD',  tv: 'OANDA:GBPUSD'   },
      { label: 'USD/JPY',  tv: 'OANDA:USDJPY'   },
    ],
  },
  {
    group: 'Crypto',
    items: [
      { label: 'BTC/USD',  tv: 'BINANCE:BTCUSDT' },
      { label: 'ETH/USD',  tv: 'BINANCE:ETHUSDT' },
    ],
  },
  {
    group: 'Indices & Commodities',
    items: [
      { label: 'S&P 500',  tv: 'SP:SPX'          },
      { label: 'NASDAQ',   tv: 'NASDAQ:NDX'       },
      { label: 'DXY',      tv: 'TVC:DXY'          },
      { label: 'WTI Oil',  tv: 'TVC:USOIL'        },
    ],
  },
];

const ALL_SYMBOLS = SYMBOL_GROUPS.flatMap(g => g.items);

const INTERVALS = [
  { label: '1m',  tv: '1'   },
  { label: '5m',  tv: '5'   },
  { label: '15m', tv: '15'  },
  { label: '1H',  tv: '60'  },
  { label: '4H',  tv: '240' },
  { label: '1D',  tv: 'D'   },
  { label: '1W',  tv: 'W'   },
];

const TV_SCRIPT_URL = 'https://s3.tradingview.com/tv.js';

let tvScriptLoaded = false; // module-level flag so we only inject once

function loadTvScript(cb) {
  if (tvScriptLoaded && window.TradingView) { cb(); return; }
  if (document.querySelector(`script[src="${TV_SCRIPT_URL}"]`)) {
    // Script already injected but may still be loading
    const check = setInterval(() => {
      if (window.TradingView) { clearInterval(check); tvScriptLoaded = true; cb(); }
    }, 80);
    return;
  }
  const s = document.createElement('script');
  s.src = TV_SCRIPT_URL;
  s.async = true;
  s.onload = () => { tvScriptLoaded = true; cb(); };
  document.head.appendChild(s);
}

/* ── TradingView chart widget ────────────────────────────────────────────── */
function TvChart({ symbol, interval, containerId, height = 580 }) {
  const theme  = useTheme();
  const isDark = theme.isDark;
  const widgetRef = useRef(null);

  const init = useCallback(() => {
    if (!window.TradingView) return;
    if (widgetRef.current) {
      try { widgetRef.current.remove(); } catch (_) {}
      widgetRef.current = null;
    }
    // container div must exist before creating widget
    const el = document.getElementById(containerId);
    if (!el) return;

    widgetRef.current = new window.TradingView.widget({
      container_id:    containerId,
      autosize:        true,
      symbol,
      interval,
      timezone:        'Etc/UTC',
      theme:           isDark ? 'dark' : 'light',
      style:           '1',
      locale:          'en',
      toolbar_bg:      isDark ? theme.bg : '#ffffff',
      enable_publishing: false,
      hide_top_toolbar:  false,
      hide_legend:       false,
      save_image:        false,
      studies:           [],
      show_popup_button: true,
      withdateranges:    true,
    });
  }, [symbol, interval, containerId, height, isDark]);

  useEffect(() => {
    loadTvScript(init);
  }, [init]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (_) {}
        widgetRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id={containerId}
      style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }}
    />
  );
}

/* ── Symbol dropdown ─────────────────────────────────────────────────────── */
function SymbolDropdown({ symbol, onSelect, theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = ALL_SYMBOLS.find(s => s.tv === symbol) ?? ALL_SYMBOLS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
          color: theme.text, minWidth: 130, borderRadius: 8,
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <span style={{ flex: 1 }}>{current.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke={theme.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 rounded-xl shadow-2xl overflow-y-auto"
          style={{
            backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
            minWidth: 190, maxHeight: 320,
          }}
        >
          {SYMBOL_GROUPS.map(g => (
            <div key={g.group}>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: theme.textMuted }}>{g.group}</div>
              {g.items.map(s => (
                <button
                  key={s.tv}
                  onClick={() => { onSelect(s.tv); setOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '7px 14px',
                    fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none',
                    color: s.tv === symbol ? theme.accent : theme.text,
                    fontWeight: s.tv === symbol ? 700 : 400,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.accentGlow ?? 'rgba(202,138,4,0.08)'}
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

/* ── Interval buttons ────────────────────────────────────────────────────── */
function IntervalBar({ interval, onSelect, theme }) {
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
      {INTERVALS.map(i => {
        const active = i.tv === interval;
        return (
          <button
            key={i.tv}
            onClick={() => onSelect(i.tv)}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
              border: 'none', cursor: 'pointer',
              background: active ? theme.accent : 'transparent',
              color:      active ? '#fff'       : theme.textMuted,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}


/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ChartsPage({ onNavigate, initialTab }) {
  const theme = useTheme();

  const [activeTab,  setActiveTab]  = useState(initialTab === 'backtesting' ? 'backtesting' : 'live');
  const [symbol,     setSymbol]     = useState('OANDA:XAUUSD');
  const [interval,   setInterval]   = useState('60');
  const [symOpen,    setSymOpen]    = useState(false);

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ backgroundColor: theme.bg }}
      onClick={() => symOpen && setSymOpen(false)}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(202,138,4,0.15)' }}
        >
          <LineChart className="w-5 h-5" style={{ color: theme.accent }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Charts</h2>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            Live TradingView charts &amp; Bar Replay backtesting
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: `2px solid ${theme.border}` }}>
        {[
          { id: 'live',        label: 'Live Chart'   },
          { id: 'backtesting', label: 'Backtesting'  },
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                fontSize: 14, fontWeight: active ? 700 : 500,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: active ? '#CA8A04' : theme.textMuted,
                borderBottom: active ? '2px solid #CA8A04' : '2px solid transparent',
                marginBottom: -2,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Shared controls ── */}
      <div
        className="flex flex-wrap items-center gap-3 mb-4 p-4 rounded-xl"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.textMuted }}>
          <Clock size={12} className="inline-block mr-1 mb-0.5" />Symbol
        </span>
        <SymbolDropdown symbol={symbol} onSelect={setSymbol} theme={theme} />

        <span className="text-xs font-semibold uppercase tracking-widest ml-2" style={{ color: theme.textMuted }}>
          Interval
        </span>
        <IntervalBar interval={interval} onSelect={setInterval} theme={theme} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: LIVE CHART
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'live' && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <TvChart
            symbol={symbol}
            interval={interval}
            containerId="tv_live_chart"
            height={600}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: BACKTESTING
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'backtesting' && (
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ minHeight: 'calc(100vh - 260px)' }}
        >
          {/* ── Coming Soon card ── */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl"
            style={{
              width: '100%',
              height: '100%',
              minHeight: 'calc(100vh - 260px)',
            }}
          >
            <div
              className="flex flex-col items-center gap-4 px-8 py-8 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', maxWidth: 380 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(100,116,139,0.2)' }}
              >
                <Lock size={28} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: '#fff' }}>Coming Soon</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Automated backtesting is under development.<br />
                  In the meantime, use <strong style={{ color: 'rgba(255,255,255,0.85)' }}>TradingView Bar Replay</strong> on
                  the Live Chart to backtest manually.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('live')}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#059669', color: '#fff', fontWeight: 700, fontSize: 14,
                }}
              >
                Go to Live Chart →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

