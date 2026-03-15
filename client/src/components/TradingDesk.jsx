import { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  Wrench, Clock, Layers, BarChart2, Activity,
  TrendingUp, ArrowLeftRight, X, Calculator, ChevronDown,
  Info, Check, AlertTriangle, XCircle,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';

const FONT = "'Space Grotesk', 'Inter', system-ui, sans-serif";

/* ── Internal token context — avoids prop-drilling into every sub-component ─ */
const TC = createContext({});
const useT = () => useContext(TC);

/** Derive theme-aware design tokens from the global theme object */
function mkTokens(theme) {
  const d = theme.isDark;
  return {
    font:        FONT,
    bg:          theme.bg,
    cardBg:      theme.surface,
    surface2:    theme.surface2,
    border:      theme.border,
    text:        theme.text,
    muted:       theme.textMuted,
    accent:      theme.accent,
    inpBg:       d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    inpBorder:   d ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.14)',
    statBg:      d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    tableThead:  d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    rowDiv:      d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    labelColor:  d ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)',
    hintColor:   d ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)',
    dimText:     d ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.52)',
    dimText2:    d ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.40)',
    dimText3:    d ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.33)',
    closedCardBg:d ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
    closedBorder:d ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.08)',
    overlapBg:   d ? 'rgba(255,255,255,0.02)'  : 'rgba(0,0,0,0.02)',
    overlapBdr:  d ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.07)',
    modalBackdrop: 'rgba(0,0,0,0.73)',
    closeBtn: {
      bg:    d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      border:d ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      color: d ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
    },
    isDark: d,
  };
}

/* ── Tool registry ───────────────────────────────────────────────────────── */
const TOOLS = [
  {
    id: 'position',
    title: 'Position Size Calculator',
    Icon: Calculator,
    badge: { text: 'POPULAR', color: '#3b82f6', bg: 'rgba(59,130,246,0.13)' },
    accent: '#3b82f6',
    desc: 'Calculate optimal lot size based on your risk tolerance and stop-loss distance',
  },
  {
    id: 'hours',
    title: 'Forex Market Hours',
    Icon: Clock,
    badge: { text: 'LIVE', color: '#22c55e', bg: 'rgba(34,197,94,0.13)' },
    accent: '#22c55e',
    desc: 'Track real-time trading sessions and find the best times to trade forex pairs',
  },
  {
    id: 'pip',
    title: 'Pip Value Calculator',
    Icon: Layers,
    badge: { text: 'NEW', color: '#a855f7', bg: 'rgba(168,85,247,0.13)' },
    accent: '#a855f7',
    desc: 'Instantly calculate pip values across all major currency pairs and account currencies',
  },
  {
    id: 'rr',
    title: 'Risk/Reward Calculator',
    Icon: BarChart2,
    badge: { text: 'HOT', color: '#f97316', bg: 'rgba(249,115,22,0.13)' },
    accent: '#f97316',
    desc: 'Visualize trade setups and measure risk-to-reward ratios before entering the market',
  },
  {
    id: 'correlation',
    title: 'Currency Correlation Matrix',
    Icon: Activity,
    badge: { text: 'LIVE', color: '#06b6d4', bg: 'rgba(6,182,212,0.13)' },
    accent: '#06b6d4',
    desc: 'Identify correlated pairs to avoid overexposure and hedge your positions effectively',
  },
  {
    id: 'compound',
    title: 'Compound Growth Calculator',
    Icon: TrendingUp,
    badge: { text: 'POPULAR', color: '#22c55e', bg: 'rgba(34,197,94,0.13)' },
    accent: '#10b981',
    desc: 'Project account growth over time with custom win rate, risk per trade, and target settings',
  },
  {
    id: 'swap',
    title: 'Swap/Rollover Calculator',
    Icon: ArrowLeftRight,
    badge: { text: 'NEW', color: '#f43f5e', bg: 'rgba(244,63,94,0.13)' },
    accent: '#f43f5e',
    desc: 'Calculate overnight swap fees and rollover costs for holding positions past market close',
  },
];

/* ── Shared form primitives ──────────────────────────────────────────────── */

/** Styled number/text input — reads theme from TC context */
function Inp({ value, onChange, type = 'number', step, min, max, placeholder }) {
  const T = useT();
  return (
    <input
      type={type} value={value} onChange={onChange}
      step={step} min={min} max={max} placeholder={placeholder}
      style={{
        backgroundColor: T.inpBg, border: `1px solid ${T.inpBorder}`,
        borderRadius: 8, color: T.text, padding: '9px 12px',
        fontSize: 14, width: '100%', outline: 'none',
        fontFamily: FONT, fontWeight: 500, boxSizing: 'border-box',
        WebkitAppearance: 'none',
      }}
    />
  );
}

/** Custom dropdown — replaces native <select> to avoid OS-white option backgrounds */
function CustomSelect({ value, onChange, options }) {
  const T = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const display = options.find(o => o === value) ?? value;

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: T.inpBg, border: `1px solid ${open ? T.accent : T.inpBorder}`,
          borderRadius: 8, color: T.text, padding: '9px 12px',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
        }}
      >
        <span>{display}</span>
        <ChevronDown size={14} style={{ color: T.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          backgroundColor: T.cardBg, border: `1px solid ${T.inpBorder}`,
          borderRadius: 9, maxHeight: 220, overflowY: 'auto',
          boxShadow: T.isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 8px 28px rgba(0,0,0,0.14)',
        }}>
          {options.map(opt => {
            const active = opt === value;
            return (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  padding: '9px 13px', fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', fontFamily: FONT,
                  color: active ? T.accent : T.text,
                  backgroundColor: active
                    ? (T.isDark ? 'rgba(16,185,129,0.1)' : 'rgba(5,150,105,0.07)')
                    : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = T.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  const T = useT();
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700, color: T.labelColor,
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT,
      }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: T.hintColor, marginTop: 4, lineHeight: 1.55, fontFamily: FONT }}>{hint}</div>}
    </div>
  );
}

function Stat({ label, value, color = '#10b981', large }) {
  const T = useT();
  return (
    <div style={{ background: T.statBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: FONT }}>
        {label}
      </div>
      <div style={{ fontSize: large ? 26 : 18, fontWeight: 800, color, fontFamily: FONT, letterSpacing: large ? '-0.02em' : '0' }}>
        {value}
      </div>
    </div>
  );
}

function InfoBox({ color, children }) {
  const T = useT();
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8, fontSize: 11.5, lineHeight: 1.65,
      background: `${color}0d`, border: `1px solid ${color}22`, color: T.dimText, fontFamily: FONT,
    }}>
      {children}
    </div>
  );
}

function SubCard({ children, style }) {
  const T = useT();
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: T.statBg, border: `1px solid ${T.border}`, ...style }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   1. POSITION SIZE CALCULATOR
════════════════════════════════════════════════════════════════════════════ */
function PositionCalc() {
  const [bal,  setBal]  = useState('10000');
  const [risk, setRisk] = useState('1');
  const [sl,   setSl]   = useState('20');
  const [pv,   setPv]   = useState('10');

  const riskAmt = parseFloat(bal) * parseFloat(risk) / 100;
  const lots    = riskAmt / (parseFloat(sl) * parseFloat(pv));
  const fmt     = v => (isNaN(v) || !isFinite(v)) ? '—' : v.toFixed(2);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div>
        <Field label="Account Balance ($)"><Inp value={bal} onChange={e => setBal(e.target.value)} min="0" /></Field>
        <Field label="Risk per Trade (%)"><Inp value={risk} onChange={e => setRisk(e.target.value)} step="0.1" min="0.1" max="10" /></Field>
        <Field label="Stop Loss (pips)"><Inp value={sl} onChange={e => setSl(e.target.value)} min="1" /></Field>
        <Field label="Pip Value per Lot ($)" hint="$10 for EUR/USD, GBP/USD · ~$6–7 for USD/JPY · $1 for XAU/USD">
          <Inp value={pv} onChange={e => setPv(e.target.value)} step="0.5" min="0.5" />
        </Field>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Stat label="Dollar Risk" value={isNaN(riskAmt) ? '—' : `$${riskAmt.toFixed(2)}`} color="#f97316" large />
        <Stat label="Lot Size (Standard)" value={fmt(lots)} color="#3b82f6" large />
        <Stat label="Mini Lots (÷10)" value={fmt(lots * 10)} color="#a855f7" />
        <Stat label="Micro Lots (÷100)" value={fmt(lots * 100)} color="#10b981" />
        <InfoBox color="#3b82f6">
          <Info size={13} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} /> Always round <strong style={{ color: '#93c5fd' }}>down</strong> to the nearest 0.01 lot to stay within your defined risk limit.
        </InfoBox>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   2. FOREX MARKET HOURS
════════════════════════════════════════════════════════════════════════════ */
const FX_SESSIONS = [
  { name: 'Sydney',   open: 22, close: 7,  color: '#f59e0b', pairs: 'AUD/USD, NZD/USD, AUD/JPY'  },
  { name: 'Tokyo',    open: 0,  close: 9,  color: '#60a5fa', pairs: 'USD/JPY, EUR/JPY, AUD/JPY'  },
  { name: 'London',   open: 8,  close: 17, color: '#34d399', pairs: 'EUR/USD, GBP/USD, USD/CHF'  },
  { name: 'New York', open: 13, close: 22, color: '#f87171', pairs: 'USD/CAD, USD/CHF, USD/JPY'  },
];

function sessionIsOpen(open, close, utcH) {
  if (open > close) return utcH >= open || utcH < close; // crosses midnight
  return utcH >= open && utcH < close;
}

function MarketHours() {
  const T = useT();
  const { getTimezoneInfo } = useTimezone();
  const [now,    setNow]    = useState(new Date());
  const [is12h,  setIs12h]  = useState(() => localStorage.getItem('mh_12h') === 'true');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggle12h = () => setIs12h(v => {
    localStorage.setItem('mh_12h', String(!v));
    return !v;
  });

  const tzInfo    = getTimezoneInfo();
  const pad       = n => String(n).padStart(2, '0');
  const effOffset = tzInfo.type === 'local' ? -(now.getTimezoneOffset()) / 60 : tzInfo.offset;
  const tzAbbr    = tzInfo.type === 'local' ? 'Local' : tzInfo.id.toUpperCase();

  // Format an integer/fractional 24-h hour → display string
  const fmtH = (h24frac) => {
    const totalH = Math.floor(h24frac);
    const m      = Math.round((h24frac - totalH) * 60);
    if (!is12h) return `${pad(totalH)}:${pad(m)}`;
    const period = totalH >= 12 ? 'PM' : 'AM';
    const h12    = totalH % 12 || 12;
    return `${h12}:${pad(m)} ${period}`;
  };

  // Shift UTC epoch by tz offset so getUTC* fields yield local time
  const localNow = new Date(now.getTime() + effOffset * 3_600_000);
  const lH = localNow.getUTCHours(), lM = localNow.getUTCMinutes(), lS = localNow.getUTCSeconds();
  const clockStr = is12h
    ? (() => {
        const period = lH >= 12 ? 'PM' : 'AM';
        const h12    = lH % 12 || 12;
        return `${h12}:${pad(lM)}:${pad(lS)} ${period} ${tzAbbr}`;
      })()
    : `${pad(lH)}:${pad(lM)}:${pad(lS)} ${tzAbbr}`;

  const utcSmall = `UTC ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

  // Convert a UTC session hour → user-tz fractional hour
  const toLocalH = utcHour => ((utcHour + effOffset) % 24 + 24) % 24;
  const fmtTzH   = utcHour => `${fmtH(toLocalH(utcHour))} ${tzAbbr}`;

  const utcH   = now.getUTCHours() + now.getUTCMinutes() / 60;
  const lonNy  = sessionIsOpen(8, 17, utcH) && sessionIsOpen(13, 22, utcH);
  const tokLon = sessionIsOpen(0, 9, utcH)  && sessionIsOpen(8, 17, utcH);

  const toggleBtnBase = {
    padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: FONT, transition: 'background 0.15s, color 0.15s',
    border: `1px solid ${T.inpBorder}`,
  };

  return (
    <div>
      {/* ── Live clock + 12/24h toggle ── */}
      <div style={{ textAlign: 'center', marginBottom: 22, position: 'relative' }}>
        {/* Toggle pill — top-right of the clock block */}
        <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: 3 }}>
          {['24h', '12h'].map(lbl => {
            const active = lbl === '12h' ? is12h : !is12h;
            return (
              <button key={lbl} onClick={toggle12h} style={{
                ...toggleBtnBase,
                background: active ? T.accent + '22' : 'transparent',
                color:       active ? T.accent : T.muted,
                border:      `1px solid ${active ? T.accent + '55' : T.inpBorder}`,
              }}>{lbl}</button>
            );
          })}
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', fontFamily: FONT, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', paddingTop: 4 }}>
          {clockStr}
        </div>
        <div style={{ fontSize: 12, color: T.dimText2, marginTop: 3, fontFamily: FONT }}>
          {tzInfo.name}&nbsp;·&nbsp;{utcSmall}
        </div>
      </div>

      {/* ── Session cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {FX_SESSIONS.map(s => {
          const open = sessionIsOpen(s.open, s.close, utcH);

          let minsVal;
          if (open) {
            const rawH = ((s.close + (s.close <= s.open ? 24 : 0)) - utcH + 24) % 24;
            minsVal = rawH * 60;
          } else {
            minsVal = ((s.open - utcH + 24) % 24) * 60;
          }
          const hh = Math.floor(minsVal / 60);
          const mm = Math.round(minsVal % 60);
          const statusMsg = open ? `Closes in ${hh}h ${mm}m` : `Opens in ${hh}h ${mm}m`;

          return (
            <div key={s.name} style={{
              background: open ? `${s.color}0d` : T.closedCardBg,
              border: `1px solid ${open ? s.color + '33' : T.closedBorder}`,
              borderRadius: 10, padding: '14px', transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: open ? s.color : T.muted, fontFamily: FONT }}>{s.name}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: open ? `${s.color}20` : T.statBg,
                  color: open ? s.color : T.muted,
                  border: `1px solid ${open ? s.color + '44' : T.closedBorder}`,
                }}>
                  {open ? '● OPEN' : '○ CLOSED'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: T.dimText2, marginBottom: 3, fontFamily: FONT }}>
                {fmtTzH(s.open)} – {fmtTzH(s.close)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: open ? s.color : T.muted, fontFamily: FONT }}>{statusMsg}</div>
              <div style={{ fontSize: 10, color: T.dimText3, marginTop: 4, fontFamily: FONT }}>Active: {s.pairs}</div>
            </div>
          );
        })}
      </div>

      {/* ── Overlap windows ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { active: lonNy,  label: 'London–NY Overlap',   time: `${fmtTzH(13)} – ${fmtTzH(17)}`, tip: 'Peak volatility · Best for EUR/USD, GBP/USD' },
          { active: tokLon, label: 'Tokyo–London Overlap', time: `${fmtTzH(8)} – ${fmtTzH(9)}`,   tip: 'EUR/JPY, GBP/JPY volatility spikes'           },
        ].map(o => (
          <div key={o.label} style={{
            background: o.active ? 'rgba(16,185,129,0.07)' : T.overlapBg,
            border: `1px solid ${o.active ? 'rgba(16,185,129,0.25)' : T.overlapBdr}`,
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: o.active ? '#10b981' : T.muted, marginBottom: 2, fontFamily: FONT }}>
              {o.label}{o.active ? <span style={{ fontSize: 10, marginLeft: 4 }}>— ACTIVE NOW</span> : ''}
            </div>
            <div style={{ fontSize: 11, color: T.dimText2, fontFamily: FONT }}>{o.time}</div>
            <div style={{ fontSize: 10, color: T.dimText3, marginTop: 2, fontFamily: FONT }}>{o.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   3. PIP VALUE CALCULATOR
════════════════════════════════════════════════════════════════════════════ */
const PIP_DATA = [
  { pair: 'EUR/USD', pipSize: 0.0001, quote: 'USD', approxRate: 1,      cs: 100000 },
  { pair: 'GBP/USD', pipSize: 0.0001, quote: 'USD', approxRate: 1,      cs: 100000 },
  { pair: 'AUD/USD', pipSize: 0.0001, quote: 'USD', approxRate: 1,      cs: 100000 },
  { pair: 'NZD/USD', pipSize: 0.0001, quote: 'USD', approxRate: 1,      cs: 100000 },
  { pair: 'USD/JPY', pipSize: 0.01,   quote: 'JPY', approxRate: 150,    cs: 100000 },
  { pair: 'USD/CHF', pipSize: 0.0001, quote: 'CHF', approxRate: 0.89,   cs: 100000 },
  { pair: 'USD/CAD', pipSize: 0.0001, quote: 'CAD', approxRate: 1.36,   cs: 100000 },
  { pair: 'EUR/JPY', pipSize: 0.01,   quote: 'JPY', approxRate: 162,    cs: 100000 },
  { pair: 'GBP/JPY', pipSize: 0.01,   quote: 'JPY', approxRate: 190,    cs: 100000 },
  { pair: 'XAU/USD', pipSize: 0.01,   quote: 'USD', approxRate: 1,      cs: 100   },
];

function PipCalc() {
  const T = useT();
  const [pair,   setPair]   = useState('EUR/USD');
  const [lots,   setLots]   = useState('1');
  const [pairPx, setPairPx] = useState('');

  const meta   = PIP_DATA.find(p => p.pair === pair) ?? PIP_DATA[0];
  const lotF   = parseFloat(lots) || 1;
  const px     = parseFloat(pairPx) || meta.approxRate;

  const pipValueUSD = meta.quote === 'USD'
    ? meta.pipSize * meta.cs * lotF
    : (meta.pipSize * meta.cs * lotF) / px;

  const fv = v => isNaN(v) ? '—' : `$${v.toFixed(2)}`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div>
        <Field label="Currency Pair">
          <CustomSelect value={pair} onChange={setPair} options={PIP_DATA.map(p => p.pair)} />
        </Field>
        <Field label="Lot Size">
          <Inp value={lots} onChange={e => setLots(e.target.value)} step="0.01" min="0.01" />
        </Field>
        <Field
          label={`Current ${pair} Price`}
          hint={`Default: ~${meta.approxRate.toLocaleString()} (approximate). Enter live price for exact values.`}
        >
          <Inp value={pairPx} onChange={e => setPairPx(e.target.value)} step="0.00001" placeholder={String(meta.approxRate)} />
        </Field>
        <InfoBox color="#a855f7">
          <Info size={13} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} /> For USD-denominated accounts only. For other accounts multiply by your USD conversion rate.
        </InfoBox>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Stat label={`Pip Value (${lots} lot${lotF !== 1 ? 's' : ''})`} value={fv(pipValueUSD)} color="#a855f7" large />
        <Stat label="Pip Size" value={meta.pipSize.toString()} color="#06b6d4" />
        <Stat label="Contract Size" value={`${meta.cs.toLocaleString()} units`} color="#f59e0b" />
        <SubCard>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.labelColor, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT }}>
            Value by Lot Type
          </div>
          {[['Standard (1.0 lot)', 1], ['Mini (0.1 lot)', 0.1], ['Micro (0.01 lot)', 0.01]].map(([lbl, mult]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: T.dimText, fontFamily: FONT }}>
              <span>{lbl}</span>
              <span style={{ fontWeight: 700, color: '#a855f7' }}>
                {isNaN(pipValueUSD) ? '—' : `$${(pipValueUSD / lotF * mult).toFixed(2)}/pip`}
              </span>
            </div>
          ))}
        </SubCard>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   4. RISK / REWARD CALCULATOR
════════════════════════════════════════════════════════════════════════════ */
function RRCalc() {
  const T = useT();
  const [entry, setEntry] = useState('2000');
  const [sl,    setSl]    = useState('1980');
  const [tp,    setTp]    = useState('2040');

  const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
  const risk    = Math.abs(e - s);
  const reward  = Math.abs(t - e);
  const rr      = risk > 0 ? reward / risk : 0;
  const rrColor = rr >= 2 ? '#22c55e' : rr >= 1.5 ? '#f59e0b' : '#ef4444';
  const breakEven = rr > 0 ? (1 / (1 + rr)) * 100 : 0;
  const isBuy   = !isNaN(e) && !isNaN(t) && t > e;
  const maxBar  = Math.max(risk, reward, 0.001);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div>
        <Field label="Entry Price"><Inp value={entry} onChange={e => setEntry(e.target.value)} step="0.01" /></Field>
        <Field label="Stop Loss"><Inp value={sl} onChange={e => setSl(e.target.value)} step="0.01" /></Field>
        <Field label="Take Profit"><Inp value={tp} onChange={e => setTp(e.target.value)} step="0.01" /></Field>
        <InfoBox color="#f97316">
          <Info size={13} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} /> Works for any instrument: Gold (2000), Forex (1.0850), Indices (5200), etc.
        </InfoBox>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Stat label="R:R Ratio" value={isNaN(rr) || rr === 0 ? '—' : `1 : ${rr.toFixed(2)}`} color={rrColor} large />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat label="Risk (pts)" value={isNaN(risk) ? '—' : risk.toFixed(2)} color="#ef4444" />
          <Stat label="Reward (pts)" value={isNaN(reward) ? '—' : reward.toFixed(2)} color="#22c55e" />
        </div>
        <Stat label="Break-even Win Rate" value={isNaN(breakEven) || breakEven === 0 ? '—' : `${breakEven.toFixed(1)}%`} color="#f59e0b" />
        <SubCard>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.labelColor, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT }}>
            Visual Setup
          </div>
          {[
            { label: 'Risk',   val: risk,   color: '#ef4444' },
            { label: 'Reward', val: reward, color: '#22c55e' },
          ].map(b => (
            <div key={b.label} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: T.dimText, fontFamily: FONT }}>
                <span>{b.label}</span>
                <span style={{ color: b.color, fontWeight: 700 }}>{isNaN(b.val) ? '—' : b.val.toFixed(2)}</span>
              </div>
              <div style={{ height: 7, borderRadius: 99, background: T.rowDiv, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: b.color, width: `${Math.min(100, (b.val / maxBar) * 100)}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: rrColor, fontFamily: FONT }}>
            {rr >= 2 ? <><Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> Good setup (≥ 1:2)</> : rr >= 1.5 ? <><AlertTriangle size={11} color="#f59e0b" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> Fair setup (≥ 1:1.5)</> : rr > 0 ? <><XCircle size={11} color="#ef4444" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> Poor R:R ({'<'} 1:1.5)</> : '—'}
            {!isNaN(isBuy) && rr > 0 && <span style={{ color: T.muted }}>  ·  {isBuy ? '▲ BUY' : '▼ SELL'}</span>}
          </div>
        </SubCard>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   5. CURRENCY CORRELATION MATRIX
════════════════════════════════════════════════════════════════════════════ */
const CORR_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
const CORR_MATRIX = [
//   EUR    GBP    JPY    CHF    AUD    CAD    NZD
  [ 1.00,  0.91, -0.48, -0.94,  0.71, -0.62,  0.73],  // EUR/USD
  [ 0.91,  1.00, -0.44, -0.88,  0.65, -0.57,  0.67],  // GBP/USD
  [-0.48, -0.44,  1.00,  0.62, -0.37,  0.55, -0.39],  // USD/JPY
  [-0.94, -0.88,  0.62,  1.00, -0.66,  0.68, -0.68],  // USD/CHF
  [ 0.71,  0.65, -0.37, -0.66,  1.00, -0.50,  0.94],  // AUD/USD
  [-0.62, -0.57,  0.55,  0.68, -0.50,  1.00, -0.51],  // USD/CAD
  [ 0.73,  0.67, -0.39, -0.68,  0.94, -0.51,  1.00],  // NZD/USD
];

function corrStyle(v, isDark) {
  if (v >= 0.7)  return { bg: 'rgba(34,197,94,0.22)',  text: '#4ade80' };
  if (v >= 0.3)  return { bg: 'rgba(34,197,94,0.10)',  text: isDark ? '#86efac' : '#16a34a' };
  if (v >= -0.3) return { bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', text: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' };
  if (v >= -0.7) return { bg: 'rgba(239,68,68,0.10)',  text: isDark ? '#fca5a5' : '#dc2626' };
  return               { bg: 'rgba(239,68,68,0.22)',   text: '#f87171' };
}

function CorrelationMatrix() {
  const T = useT();
  const short = p => p.replace('/USD', '').replace('USD/', '');
  return (
    <div>
      <p style={{ fontSize: 12, color: T.dimText, marginBottom: 14, lineHeight: 1.7, margin: '0 0 14px', fontFamily: FONT }}>
        Typical 6-month rolling correlations.&nbsp;
        <strong style={{ color: '#4ade80' }}>Green = move together</strong> —&nbsp;
        <strong style={{ color: '#f87171' }}>Red = move opposite</strong>.
        Strong correlations (&gt; ±0.7) indicate overexposure risk when holding both pairs.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%', fontFamily: FONT }}>
          <thead>
            <tr>
              <th style={{ fontSize: 10, color: T.muted, padding: '4px 6px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>Pair</th>
              {CORR_PAIRS.map(p => (
                <th key={p} style={{ fontSize: 10, color: T.dimText, padding: '4px 6px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>{short(p)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORR_MATRIX.map((row, i) => (
              <tr key={i}>
                <td style={{ fontSize: 11, fontWeight: 700, color: T.text, padding: '4px 10px 4px 4px', whiteSpace: 'nowrap', fontFamily: FONT }}>{CORR_PAIRS[i]}</td>
                {row.map((v, j) => {
                  const cs = corrStyle(v, T.isDark);
                  return (
                    <td key={j} style={{
                      textAlign: 'center', padding: '7px 5px',
                      background: cs.bg, color: cs.text,
                      fontSize: 12, fontWeight: 700, borderRadius: 5,
                    }}>
                      {v === 1.00 ? '—' : v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { range: '+0.70 → +1.00', color: '#4ade80', bg: 'rgba(34,197,94,0.2)',  info: 'Strong positive — avoid holding both simultaneously' },
          { range: '−0.70 → −1.00', color: '#f87171', bg: 'rgba(239,68,68,0.2)', info: 'Strong negative — natural hedge between pairs'       },
        ].map(x => (
          <div key={x.range} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.dimText, fontFamily: FONT }}>
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 5, background: x.bg, color: x.color, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap' }}>
              {x.range}
            </span>
            {x.info}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   6. COMPOUND GROWTH CALCULATOR
════════════════════════════════════════════════════════════════════════════ */
function CompoundCalc() {
  const T = useT();
  const [startBal,  setStartBal]  = useState('10000');
  const [monthPct,  setMonthPct]  = useState('5');
  const [monthsCnt, setMonthsCnt] = useState('12');

  const start  = parseFloat(startBal) || 0;
  const mPct   = parseFloat(monthPct) || 0;
  const mCount = Math.min(Math.max(parseInt(monthsCnt) || 12, 1), 60);

  const rows = [];
  let bal = start;
  for (let m = 1; m <= mCount; m++) {
    const gain = bal * mPct / 100;
    bal += gain;
    rows.push({ month: m, gain, balance: bal });
  }
  const totalGain = bal - start;
  const totalPct  = start > 0 ? (totalGain / start) * 100 : 0;
  const money     = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 28 }}>
      <div>
        <Field label="Starting Balance ($)"><Inp value={startBal} onChange={e => setStartBal(e.target.value)} /></Field>
        <Field label="Monthly Return (%)"><Inp value={monthPct} onChange={e => setMonthPct(e.target.value)} step="0.5" min="0.1" /></Field>
        <Field label="Number of Months" hint="Max: 60 months"><Inp value={monthsCnt} onChange={e => setMonthsCnt(e.target.value)} min="1" max="60" /></Field>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <Stat label="Final Balance" value={`$${money(bal)}`} color="#10b981" large />
          <Stat label="Total Profit" value={`+$${money(totalGain)}`} color="#22c55e" />
          <Stat label="Total Return" value={`+${totalPct.toFixed(1)}%`} color="#f59e0b" />
        </div>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 360, borderRadius: 10, border: `1px solid ${T.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, background: T.surface2, zIndex: 1 }}>
            <tr>
              {['Mo.', 'Profit', 'Balance'].map(h => (
                <th key={h} style={{
                  fontSize: 10, fontWeight: 700, color: T.labelColor,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  padding: '9px 10px', textAlign: h === 'Mo.' ? 'left' : 'right',
                  borderBottom: `1px solid ${T.border}`,
                  fontFamily: FONT,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.month} style={{ borderBottom: `1px solid ${T.rowDiv}` }}>
                <td style={{ padding: '7px 10px', color: T.muted, fontWeight: 600, fontFamily: FONT }}>M{r.month}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: '#22c55e', fontWeight: 600, fontFamily: FONT }}>+${money(r.gain)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.text, fontWeight: 700, fontFamily: FONT }}>${money(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   7. SWAP / ROLLOVER CALCULATOR
════════════════════════════════════════════════════════════════════════════ */
const SWAP_RATES = [
  { pair: 'EUR/USD', long:  -8.35, short:   2.12 },
  { pair: 'GBP/USD', long:  -3.85, short:   0.52 },
  { pair: 'USD/JPY', long:   2.18, short:  -5.65 },
  { pair: 'USD/CHF', long:   0.85, short:  -3.22 },
  { pair: 'AUD/USD', long:  -4.12, short:   0.98 },
  { pair: 'NZD/USD', long:  -2.85, short:   0.62 },
  { pair: 'USD/CAD', long:   0.42, short:  -3.15 },
  { pair: 'EUR/JPY', long:  -4.22, short:  -1.85 },
  { pair: 'GBP/JPY', long:  -2.15, short:  -3.45 },
  { pair: 'EUR/GBP', long:  -1.95, short:   0.38 },
  { pair: 'XAU/USD', long: -14.25, short:   3.85 },
];

function SwapCalc() {
  const T = useT();
  const [pair, setPair] = useState('XAU/USD');
  const [lots, setLots] = useState('1');
  const [dir,  setDir]  = useState('long');
  const [days, setDays] = useState('3');

  const meta       = SWAP_RATES.find(s => s.pair === pair) ?? SWAP_RATES[0];
  const lotF       = parseFloat(lots) || 1;
  const daysF      = parseInt(days) || 1;
  const ratePerDay = dir === 'long' ? meta.long : meta.short;
  const total      = ratePerDay * lotF * daysF;
  const totalColor = total >= 0 ? '#22c55e' : '#ef4444';
  const hasTriple  = daysF >= 3 && pair !== 'XAU/USD';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div>
        <Field label="Pair">
          <CustomSelect value={pair} onChange={setPair} options={SWAP_RATES.map(s => s.pair)} />
        </Field>
        <Field label="Position Size (Lots)">
          <Inp value={lots} onChange={e => setLots(e.target.value)} step="0.01" min="0.01" />
        </Field>
        <Field label="Direction">
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'long',  label: '▲ LONG',  color: '#22c55e' },
              { key: 'short', label: '▼ SHORT', color: '#ef4444' },
            ].map(d => (
              <button key={d.key} onClick={() => setDir(d.key)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8,
                border: `1px solid ${d.color}`, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: FONT,
                background: dir === d.key ? `${d.color}18` : 'transparent',
                color: d.color, transition: 'background 0.15s',
              }}>
                {d.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Days Held">
          <Inp value={days} onChange={e => setDays(e.target.value)} min="1" />
        </Field>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Stat
          label={`Swap per Day · 1 lot · ${dir}`}
          value={`${ratePerDay >= 0 ? '+' : ''}$${ratePerDay.toFixed(2)}`}
          color={ratePerDay >= 0 ? '#22c55e' : '#ef4444'}
        />
        <Stat
          label={`Total Swap · ${lotF} lot${lotF !== 1 ? 's' : ''} · ${daysF} day${daysF !== 1 ? 's' : ''}`}
          value={`${total >= 0 ? '+' : ''}$${total.toFixed(2)}`}
          color={totalColor}
          large
        />
        <SubCard>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.labelColor, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT }}>
            {pair} Indicative Rates / Standard Lot / Day
          </div>
          {[['Long', meta.long], ['Short', meta.short]].map(([lbl, r]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, fontFamily: FONT }}>
              <span style={{ color: T.dimText }}>{lbl}</span>
              <span style={{ fontWeight: 700, color: r >= 0 ? '#22c55e' : '#ef4444' }}>
                {r >= 0 ? '+' : ''}${r.toFixed(2)}/day
              </span>
            </div>
          ))}
          {hasTriple && (
            <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 6, fontWeight: 600, fontFamily: FONT }}>
              <AlertTriangle size={11} style={{display:'inline-block',verticalAlign:'middle',marginRight:3}} /> Wednesday positions attract triple swap (covers the weekend).
            </div>
          )}
          <div style={{ fontSize: 10, color: T.hintColor, marginTop: 6, lineHeight: 1.6, fontFamily: FONT }}>
            Indicative only — actual rates vary by broker and change with central bank decisions.
          </div>
        </SubCard>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOOL CARD
════════════════════════════════════════════════════════════════════════════ */
function ToolCard({ tool, T, onOpen }) {
  const [hov, setHov] = useState(false);
  const { title, Icon, badge, accent, desc } = tool;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onOpen(tool.id)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hov ? accent : T.border}`,
        borderTop: `2px solid ${hov ? accent : T.border}`,
        borderRadius: 14, padding: '22px 20px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: 'pointer', position: 'relative',
        fontFamily: FONT,
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov
          ? (T.isDark ? `0 10px 36px rgba(0,0,0,0.45), 0 0 0 1px ${accent}1a` : `0 8px 28px rgba(0,0,0,0.12), 0 0 0 1px ${accent}22`)
          : (T.isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)'),
      }}
    >
      {/* Badge */}
      <span style={{
        position: 'absolute', top: 14, right: 14,
        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
        letterSpacing: '0.08em', background: badge.bg, color: badge.color,
        border: `1px solid ${badge.color}44`,
      }}>
        {badge.text}
      </span>

      {/* Icon box */}
      <div style={{
        width: 44, height: 44, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${accent}18`, border: `1px solid ${accent}30`,
      }}>
        <Icon size={20} style={{ color: accent }} />
      </div>

      {/* Title + desc */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{desc}</div>
      </div>

      {/* Open link */}
      <div style={{ fontSize: 12, fontWeight: 700, color: hov ? accent : T.muted, paddingTop: 4, transition: 'color 0.2s' }}>
        Open Tool →
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOOL MODAL
════════════════════════════════════════════════════════════════════════════ */
function ToolContent({ id }) {
  switch (id) {
    case 'position':    return <PositionCalc />;
    case 'hours':       return <MarketHours />;
    case 'pip':         return <PipCalc />;
    case 'rr':          return <RRCalc />;
    case 'correlation': return <CorrelationMatrix />;
    case 'compound':    return <CompoundCalc />;
    case 'swap':        return <SwapCalc />;
    default:            return null;
  }
}

function ToolModal({ tool, T, onClose }) {
  if (!tool) return null;
  const { title, Icon, accent } = tool;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: T.modalBackdrop,
        backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: FONT,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: T.cardBg, border: `1px solid ${T.border}`,
        borderTop: `2px solid ${accent}`, borderRadius: 16,
        width: '100%', maxWidth: 820, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: T.isDark ? '0 32px 80px rgba(0,0,0,0.7)' : '0 24px 60px rgba(0,0,0,0.16)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
          flexShrink: 0, background: T.cardBg,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: `${accent}18`, border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: T.text, flex: 1, fontFamily: FONT, letterSpacing: '-0.01em' }}>{title}</span>
          <button onClick={onClose} style={{
            background: T.closeBtn.bg, border: `1px solid ${T.closeBtn.border}`,
            cursor: 'pointer', color: T.closeBtn.color,
            padding: 6, borderRadius: 7, display: 'flex', alignItems: 'center',
            transition: 'background 0.15s',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Body — key forces remount on tool switch, resetting all calculator state */}
        <div key={tool.id} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, background: T.bg }}>
          <ToolContent id={tool.id} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE EXPORT
════════════════════════════════════════════════════════════════════════════ */
export default function TradingDesk() {
  const theme = useTheme();
  const T = mkTokens(theme);
  const [openId, setOpenId] = useState(null);
  const activeTool = TOOLS.find(t => t.id === openId) ?? null;

  return (
    <TC.Provider value={T}>
      {/* Load Space Grotesk */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        .td-root * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
        .td-root input::-webkit-inner-spin-button, .td-root input::-webkit-outer-spin-button { opacity: 0.4; }
      `}</style>

      <div className="td-root" style={{ flex: 1, overflowY: 'auto', backgroundColor: T.bg, padding: '28px 28px 56px', fontFamily: FONT }}>

        {/* ── Section header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wrench size={22} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, fontFamily: FONT, letterSpacing: '-0.02em' }}>
              Trading Desk
            </h2>
            <p style={{ fontSize: 13, color: T.muted, margin: '3px 0 0', fontFamily: FONT }}>
              Professional calculators and utilities to enhance your trading workflow
            </p>
          </div>
        </div>

        {/* ── Card grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {TOOLS.map(t => <ToolCard key={t.id} tool={t} T={T} onOpen={setOpenId} />)}
        </div>
      </div>

      <ToolModal tool={activeTool} T={T} onClose={() => setOpenId(null)} />
    </TC.Provider>
  );
}
