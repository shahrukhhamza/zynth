import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Brain, Calendar, Clock, ChevronRight, Activity, BookOpen, TrendingUp, TrendingDown,
  ArrowUpRight, Zap, DollarSign, Trophy, CheckCircle2, Circle, Sparkles, LineChart as LineChartIcon,
  Calculator, X, Gauge,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../utils/authStorage';
import { API_URL } from '../config/api';
import {
  Card, Pill, Ring, SectionTitle, Skeleton, Sparkline, StatCard, EmptyState, ProgressBar, Stagger, Rise, CountUp, EASE,
} from './ui';
import { smoothPath } from './ui/Widgets';

const QUOTES = [
  "The best traders don't trade every day. Patience is a position.",
  'Your edge only works if you execute it consistently.',
  "One bad trade doesn't define you. A pattern of bad trades does.",
  'Risk management is not optional. It is the job.',
  "The market will be here tomorrow. Your capital might not be.",
  'Journal every trade. The patterns will reveal themselves.',
  'Discipline is remembering what you want most.',
  'Cut losses short. Let winners run. Repeat.',
];

const SESSIONS = [
  { name: 'Tokyo',    open: 0,  close: 9,  color: '#f59e0b' },
  { name: 'London',   open: 8,  close: 17, color: '#CA8A04' },
  { name: 'New York', open: 13, close: 22, color: '#10b981' },
];

const getCurrentSessions = () => {
  const now = new Date();
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  return SESSIONS.filter((s) => h >= s.open && h < s.close);
};

const money = (n, digits = 2) => `${n < 0 ? '-' : n > 0 ? '+' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/* ── Interactive equity curve (own SVG so the dashboard stays light) ───────── */
function EquityChart({ points, color, theme }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  const W = 800; const H = 270; const padX = 6; const padT = 18; const padB = 30;

  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const vals = points.map((p) => p.v);
    const min = Math.min(0, ...vals); const max = Math.max(0, ...vals); const span = max - min || 1;
    const x = (i) => padX + (i / (points.length - 1)) * (W - padX * 2);
    const y = (v) => padT + (1 - (v - min) / span) * (H - padT - padB);
    const pts = points.map((p, i) => [x(i), y(p.v)]);
    return { pts, zeroY: y(0), line: smoothPath(pts), x, y };
  }, [points]);

  if (!geo) return null;
  const { pts, zeroY, line } = geo;
  const area = `${line} L ${pts[pts.length - 1][0]} ${H - padB} L ${pts[0][0]} ${H - padB} Z`;
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(rel * (points.length - 1)))));
  };
  const hp = hover != null ? points[hover] : null;
  const hxy = hover != null ? pts[hover] : null;

  return (
    <div ref={ref} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: 'pan-y' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ height: 270 }} preserveAspectRatio="none" aria-label="Equity curve">
        <defs>
          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={W} y1={padT + g * (H - padT - padB)} y2={padT + g * (H - padT - padB)} stroke={theme.border} strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
        ))}
        <line x1="0" x2={W} y1={zeroY} y2={zeroY} stroke={theme.textMuted} strokeOpacity="0.45" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
        <motion.path d={area} fill="url(#eq-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
        <motion.path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: EASE }} />
        {hxy && <line x1={hxy[0]} x2={hxy[0]} y1={padT} y2={H - padB} stroke={color} strokeOpacity="0.5" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hxy && hp && (
        <>
          <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: `${(hxy[0] / W) * 100}%`, top: `${(hxy[1] / H) * 100}%`, background: color, boxShadow: `0 0 0 4px ${color}33` }} />
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border px-3 py-2 text-[12px] shadow-xl"
            style={{ left: `${Math.min(88, Math.max(12, (hxy[0] / W) * 100))}%`, top: 6, background: theme.surface, borderColor: theme.border, color: theme.text }}
          >
            <div className="font-display text-[14px] font-bold" style={{ color: hp.v >= 0 ? '#10b981' : '#f43f5e' }}>{money(hp.v)}</div>
            <div style={{ color: theme.textMuted }}>{hp.label}</div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Mini bars: daily P&L Monday → Sunday of the current week ──────────────── */
function WeekBars({ trades, C, theme }) {
  const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const pnl = trades.filter((t) => { const x = new Date(t.date); return x.toDateString() === d.toDateString(); }).reduce((s, t) => s + t.pnl, 0);
    return { label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), pnl, future: d > new Date() };
  });
  const max = Math.max(1, ...days.map((d) => Math.abs(d.pnl)));
  return (
    <div className="flex h-[46px] items-end gap-1.5">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <motion.div
            className="w-full rounded-md"
            initial={{ height: 0 }} animate={{ height: d.pnl === 0 ? 4 : Math.max(6, (Math.abs(d.pnl) / max) * 30) }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.05 }}
            style={{ background: d.pnl === 0 ? theme.border : d.pnl > 0 ? C.green : C.red, opacity: d.future ? 0.35 : 1 }}
          />
          <span className="text-[9px] font-semibold leading-none" style={{ color: theme.textMuted }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Month heatmap ────────────────────────────────────────────────────────── */
function MonthHeatmap({ trades, theme, C }) {
  const now = new Date();
  const year = now.getFullYear(); const month = now.getMonth();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dailyPnl = useMemo(() => {
    const map = {};
    (trades || []).forEach((t) => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      map[d.getDate()] = (map[d.getDate()] ?? 0) + (parseFloat(t.pnl) || 0);
    });
    return map;
  }, [trades, year, month]);

  const weeklyPnl = useMemo(() => {
    const weeks = {};
    Object.entries(dailyPnl).forEach(([day, pnl]) => {
      const d = new Date(year, month, parseInt(day, 10));
      const week = Math.ceil((d.getDate() + new Date(year, month, 1).getDay()) / 7);
      weeks[week] = (weeks[week] ?? 0) + pnl;
    });
    return weeks;
  }, [dailyPnl, year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const monthTotal = Object.values(dailyPnl).reduce((s, v) => s + v, 0);
  const maxAbs = Math.max(1, ...Object.values(dailyPnl).map(Math.abs));
  const short = (n) => `${n > 0 ? '+' : n < 0 ? '-' : ''}$${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(1)}k` : Math.abs(n).toFixed(0)}`;

  return (
    <Card style={{ padding: 24, height: '100%' }}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <SectionTitle icon={Calendar}>Monthly P&amp;L</SectionTitle>
        <div className="-mt-4 flex items-center gap-3">
          <span className="text-[13px]" style={{ color: theme.textMuted }}>{monthName}</span>
          <Pill color={monthTotal >= 0 ? C.green : C.red}>{monthTotal === 0 ? '$0' : short(monthTotal)}</Pill>
        </div>
      </div>

      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr) 62px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Wk'].map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>{d}</div>
        ))}
        {weeks.map((week, wi) => {
          const wPnl = weeklyPnl[wi + 1] ?? null;
          const padded = [...week, ...Array(7 - week.length).fill(null)];
          return [
            ...padded.map((day, di) => {
              if (!day) return <div key={`${wi}-${di}`} />;
              const pnl = dailyPnl[day]; const has = pnl !== undefined;
              const isToday = day === today; const future = day > today;
              const k = has ? Math.min(0.85, 0.16 + (Math.abs(pnl) / maxAbs) * 0.6) : 0;
              const bg = has ? `${pnl >= 0 ? C.green : C.red}${Math.round(k * 255).toString(16).padStart(2, '0')}` : theme.surface2;
              return (
                <motion.div
                  key={`${wi}-${di}`}
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: future ? 0.35 : 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.03 * (wi * 7 + di), ease: EASE }}
                  title={has ? `${monthName.split(' ')[0]} ${day}: ${money(pnl)}` : undefined}
                  className="flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl transition-transform duration-150 hover:scale-[1.06]"
                  style={{ background: bg, boxShadow: isToday ? `0 0 0 2px ${C.gold}` : 'none' }}
                >
                  <span className="text-[11.5px] leading-none" style={{ fontWeight: isToday || has ? 700 : 500, color: has ? (pnl >= 0 ? C.greenText : C.redText) : isToday ? C.gold : theme.textMuted }}>{day}</span>
                  {has && <span className="text-[9.5px] font-bold leading-none" style={{ color: pnl >= 0 ? C.greenText : C.redText }}>{short(pnl)}</span>}
                </motion.div>
              );
            }),
            <div key={`${wi}-w`} className="flex min-h-[50px] items-center justify-center rounded-xl text-[10.5px] font-bold" style={{ background: theme.surface2, color: wPnl == null ? theme.textMuted : wPnl >= 0 ? C.green : C.red }}>
              {wPnl == null ? '—' : short(wPnl)}
            </div>,
          ];
        })}
      </div>
    </Card>
  );
}

/* ── Macro snapshot ───────────────────────────────────────────────────────── */
function MacroSnapshot({ macro, keyEvent, theme, C, goTo }) {
  const score = typeof macro?.score === 'number' ? macro.score : null;
  const angle = score == null ? -80 : Math.max(-80, Math.min(80, (score / 10) * 80));
  const tone = score == null ? theme.textMuted : score > 1 ? C.green : score < -1 ? C.red : C.gold;
  return (
    <Card style={{ padding: 22 }} onClick={() => goTo('intelligence')}>
      <SectionTitle icon={Gauge} action={<ArrowUpRight size={15} style={{ color: theme.textMuted, marginTop: -16 }} />}>Macro snapshot</SectionTitle>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 70" className="w-[128px] shrink-0" aria-hidden="true">
          <defs>
            <linearGradient id="mg" x1="0" x2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset="0.5" stopColor="#CA8A04" /><stop offset="1" stopColor="#10b981" /></linearGradient>
          </defs>
          <path d="M 10 62 A 50 50 0 0 1 110 62" fill="none" stroke={theme.border} strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 62 A 50 50 0 0 1 110 62" fill="none" stroke="url(#mg)" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
          <motion.g initial={{ rotate: -80 }} animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.3 }} style={{ transformOrigin: '60px 62px' }}>
            <line x1="60" y1="62" x2="60" y2="22" stroke={theme.text} strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="60" cy="62" r="5" fill={tone} />
          </motion.g>
        </svg>
        <div className="min-w-0">
          <div className="font-display text-[30px] font-bold leading-none" style={{ color: tone }}>{score == null ? '—' : <CountUp value={score} format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}`} />}</div>
          <p className="m-0 mt-1.5 text-[13px] font-semibold" style={{ color: theme.text }}>{macro?.label ?? 'Awaiting data'}</p>
          <p className="m-0 mt-0.5 text-[11.5px]" style={{ color: theme.textMuted }}>US data surprise score (−10 to +10)</p>
        </div>
      </div>
      {keyEvent && (
        <div className="mt-4 flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(202,138,4,0.09)' }}>
          <Calendar size={15} style={{ color: C.gold, marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.gold }}>Next key event</p>
            <p className="m-0 mt-0.5 text-[13px] font-semibold" style={{ color: theme.text }}>{keyEvent.title}</p>
            {keyEvent.time && <p className="m-0 text-[11.5px]" style={{ color: theme.textMuted }}>{keyEvent.time}</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── First-run checklist ──────────────────────────────────────────────────── */
const DISMISS_KEY = 'zynth_getting_started_dismissed';

function GettingStarted({ steps, theme, onDismiss }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
      className="relative overflow-hidden rounded-[22px] border p-6 md:p-7"
      style={{ borderColor: 'rgba(202,138,4,0.32)', background: theme.isDark ? 'linear-gradient(135deg, rgba(202,138,4,0.14), rgba(202,138,4,0.03) 60%)' : 'linear-gradient(135deg, rgba(202,138,4,0.12), rgba(255,255,255,0.7) 65%)' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.28), transparent 70%)' }} />
      <button onClick={onDismiss} aria-label="Dismiss checklist" className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: theme.textMuted }}><X size={15} /></button>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="lg:w-[34%]">
          <p className="m-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#A16207' }}><Sparkles size={13} /> Getting started</p>
          <h2 className="m-0 mt-2 text-[24px] font-bold leading-tight" style={{ color: theme.text }}>Set up your edge in 5 steps</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed" style={{ color: theme.textMuted }}>Each step unlocks sharper insights. It takes about two minutes.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1"><ProgressBar value={pct} /></div>
            <span className="text-[12px] font-bold" style={{ color: theme.text }}>{done}/{steps.length}</span>
          </div>
        </div>
        <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
          {steps.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.45, ease: EASE }}
              onClick={s.onClick}
              disabled={s.done}
              className="group flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0"
              style={{ background: theme.surface, borderColor: s.done ? 'rgba(16,185,129,0.35)' : theme.border }}
            >
              {s.done ? <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} /> : <Circle size={20} style={{ color: theme.textMuted, flexShrink: 0 }} />}
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold" style={{ color: s.done ? theme.textMuted : theme.text, textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
                <span className="block text-[11.5px]" style={{ color: theme.textMuted }}>{s.hint}</span>
              </span>
              {!s.done && <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" style={{ color: '#CA8A04' }} />}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function EconomicDashboard({ onViewChange }) {
  const theme = useTheme();
  const { user } = useAuth();

  const [allTrades, setAllTrades] = useState(null);
  const [keyEvent, setKeyEvent] = useState(null);
  const [macro, setMacro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');
  const seenInsights = (() => { try { return localStorage.getItem('zynth_seen_insights') === '1'; } catch { return false; } })();
  const [checklistHidden, setChecklistHidden] = useState(() => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } });

  const C = theme.isDark
    ? { green: '#34d399', red: '#fb7185', gold: '#EAB308', greenText: '#6ee7b7', redText: '#fda4af' }
    : { green: '#059669', red: '#e11d48', gold: '#A16207', greenText: '#047857', redText: '#be123c' };

  const goTo = (view) => {
    if (onViewChange) { onViewChange(view); return; }
    window.history.pushState({ view }, '', `/${view}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { view } }));
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    let alive = true;
    const getJson = (path) => fetch(`${API_URL}${path}`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    // The page renders as soon as the journal arrives; the slower market-data calls fill in later.
    getJson('/api/journal/trades?limit=200').then((res) => {
      if (!alive) return;
      setAllTrades((res?.data ?? []).map((t) => {
        const raw = parseFloat(t.profit_loss) || 0;
        const pnl = t.outcome === 'loss' ? -Math.abs(raw) : t.outcome === 'win' ? Math.abs(raw) : raw;
        return { ...t, pnl, date: t.created_at, emotion_before: t.emotional_state };
      }));
      setLoading(false);
    });
    getJson('/api/calendar?filter=week').then((events) => {
      if (!alive || !Array.isArray(events)) return;
      const highs = events.filter((e) => (e.impact ?? '').toLowerCase() === 'high');
      const high = highs.find((e) => new Date(e.time).getTime() >= Date.now()) ?? highs[0];
      if (!high) return;
      const when = new Date(high.time);
      setKeyEvent({ title: high.event ?? high.title ?? 'High impact event', time: Number.isNaN(when.getTime()) ? (high.time ?? '') : when.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) });
    });
    getJson('/api/economic/macro-score').then((m) => { if (alive && m) setMacro(m); });
    return () => { alive = false; };
  }, []);

  /* ── Derived data ── */
  const trades = allTrades ?? [];
  const sorted = useMemo(() => [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)), [trades]);

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.pnl !== 0);
    const winners = closed.filter((t) => t.pnl > 0); const losers = closed.filter((t) => t.pnl < 0);
    const total = trades.reduce((s, t) => s + t.pnl, 0);
    const avgWin = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
    const avgLoss = losers.length ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0;
    const grossWin = winners.reduce((s, t) => s + t.pnl, 0); const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
    const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    const week = trades.filter((t) => new Date(t.date) >= monday);
    return {
      total, count: trades.length, wins: winners.length, losses: losers.length,
      winRate: closed.length ? Math.round((winners.length / closed.length) * 100) : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? grossWin : 0,
      avgWin, avgLoss,
      best: closed.length ? Math.max(...closed.map((t) => t.pnl)) : 0,
      worst: closed.length ? Math.min(...closed.map((t) => t.pnl)) : 0,
      weekPnl: week.reduce((s, t) => s + t.pnl, 0), weekCount: week.length,
      weekW: week.filter((t) => t.pnl > 0).length, weekL: week.filter((t) => t.pnl < 0).length,
    };
  }, [trades]);

  const equity = useMemo(() => {
    const cutoff = range === 'all' ? 0 : Date.now() - (range === '7d' ? 7 : 30) * 86400000;
    let run = 0;
    const all = sorted.map((t) => { run += t.pnl; return { t: new Date(t.date), v: run }; });
    const inRange = all.filter((p) => p.t.getTime() >= cutoff);
    const base = range === 'all' ? 0 : (all.filter((p) => p.t.getTime() < cutoff).pop()?.v ?? 0);
    return inRange.map((p) => ({ v: p.v - base, label: p.t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));
  }, [sorted, range]);

  const edge = useMemo(() => {
    if (trades.length < 5) return null;
    const best = (fn) => {
      const map = {};
      trades.forEach((t) => { const k = fn(t); if (!k) return; map[k] ??= { w: 0, n: 0 }; map[k].n += 1; if (t.pnl > 0) map[k].w += 1; });
      let top = null; let rate = -1;
      Object.entries(map).forEach(([k, v]) => { if (v.n >= 2 && v.w / v.n > rate) { rate = v.w / v.n; top = { key: k, rate: Math.round(rate * 100) }; } });
      return top;
    };
    return { session: best((t) => t.session), pair: best((t) => t.pair), mindset: best((t) => t.emotion_before) };
  }, [trades]);

  const recent = useMemo(() => [...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6), [trades]);

  const checklist = useMemo(() => [
    { label: 'Log your first trade', hint: 'Quick mode takes 10 seconds', done: trades.length >= 1, onClick: () => goTo('journal') },
    { label: 'Log 5 trades', hint: 'Unlocks pattern detection', done: trades.length >= 5, onClick: () => goTo('journal') },
    { label: 'Run an AI analysis', hint: 'Open any trade and tap Analyze', done: (user?.ai_analysis_tries ?? 0) > 0 || (user?.ai_monthly_count ?? 0) > 0, onClick: () => goTo('journal') },
    { label: 'Explore AI Insights', hint: 'See the live macro backdrop', done: seenInsights, onClick: () => goTo('intelligence') },
    { label: 'Personalise your profile', hint: 'Experience, markets and goals', done: !!user?.onboarding_done, onClick: () => window.dispatchEvent(new CustomEvent('zynth:open-profile')) },
  ], [trades.length, user, seenInsights]); // eslint-disable-line react-hooks/exhaustive-deps

  const showChecklist = !checklistHidden && checklist.some((s) => !s.done);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'Trader';
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];
  const sessions = getCurrentSessions();
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const totalColor = !stats.count ? theme.textMuted : stats.total >= 0 ? C.green : C.red;
  const cumulative = useMemo(() => { let r = 0; return sorted.map((t) => (r += t.pnl)); }, [sorted]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-16 pt-8 md:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
          <div className="flex items-end justify-between"><div className="space-y-3"><Skeleton className="h-9 w-72" /><Skeleton className="h-4 w-44" /></div><Skeleton className="h-11 w-36" /></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[150px] !rounded-[20px]" />)}</div>
          <div className="grid gap-4 xl:grid-cols-12"><Skeleton className="h-[360px] !rounded-[20px] xl:col-span-8" /><Skeleton className="h-[360px] !rounded-[20px] xl:col-span-4" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-16 pt-7 md:px-8">
      <Stagger className="mx-auto flex max-w-[1320px] flex-col gap-5" gap={0.07}>

        {/* ── Header ───────────────────────────────────────────── */}
        <Rise className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-[30px] font-bold leading-tight md:text-[36px]" style={{ color: theme.text, letterSpacing: '-0.03em' }}>
              {greeting}, <span style={{ color: C.gold }}>{firstName}</span>
            </h1>
            <p className="m-0 mt-1.5 text-[14px]" style={{ color: theme.textMuted }}>{todayStr}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {sessions.length > 0 ? sessions.map((s) => <Pill key={s.name} color={s.color} dot>{s.name} open</Pill>) : <Pill color={theme.textMuted}>Markets quiet</Pill>}
            <button
              onClick={() => goTo('journal')}
              className="group relative flex h-11 items-center gap-2 overflow-hidden rounded-xl px-5 text-[13px] font-bold text-[#1a1203] transition-all hover:translate-y-[1px] active:translate-y-[3px] md:hidden"
              style={{ background: 'linear-gradient(180deg,#E0A010,#C98A06)', boxShadow: '0 3px 0 #8a5a05, 0 14px 26px -10px rgba(202,138,4,0.7)' }}
            >
              <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/40 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
              <Plus size={16} strokeWidth={2.6} /> <span className="relative">New entry</span>
            </button>
          </div>
        </Rise>

        {showChecklist && (
          <Rise><GettingStarted steps={checklist} theme={theme} onDismiss={() => { setChecklistHidden(true); try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ } }} /></Rise>
        )}

        {/* ── KPIs ─────────────────────────────────────────────── */}
        <Rise data-tour="dash-stats" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Net P&L" color={totalColor} icon={DollarSign}
            value={stats.count ? stats.total : '$0.00'} format={(n) => money(n)}
            sub={stats.count ? `Across ${stats.count} trade${stats.count === 1 ? '' : 's'}` : 'Log a trade to begin'}
            spark={cumulative.length > 1 ? <Sparkline data={cumulative} color={totalColor} /> : null}
          />
          <StatCard
            label="Win rate" color={!stats.count ? theme.textMuted : stats.winRate >= 50 ? C.green : C.red}
            value={stats.count ? `${stats.winRate}%` : '—'}
            sub={stats.count ? `${stats.wins}W · ${stats.losses}L` : 'No closed trades yet'}
            ring={<Ring value={stats.winRate} color={!stats.count ? theme.border : stats.winRate >= 50 ? C.green : C.red} size={72} stroke={7}><span className="text-[12px] font-bold" style={{ color: theme.text }}>{stats.count ? stats.winRate : 0}</span></Ring>}
          />
          <StatCard
            label="This week" color={stats.weekCount ? (stats.weekPnl >= 0 ? C.green : C.red) : theme.textMuted}
            icon={stats.weekPnl >= 0 ? TrendingUp : TrendingDown}
            value={stats.weekCount ? stats.weekPnl : '$0'} format={(n) => money(n, 0)}
            sub={stats.weekCount ? `${stats.weekW}W · ${stats.weekL}L this week` : 'No trades this week'}
            spark={<WeekBars trades={trades} C={C} theme={theme} />}
          />
          <StatCard
            label="Profit factor" color={stats.profitFactor >= 1 ? C.green : stats.profitFactor > 0 ? C.red : theme.textMuted} icon={Trophy}
            value={stats.profitFactor > 0 ? stats.profitFactor : '—'} format={(n) => n.toFixed(2)}
            sub={stats.count ? `Avg win ${money(stats.avgWin, 0)} · loss ${money(-stats.avgLoss, 0)}` : 'Needs closed trades'}
            spark={<div className="pt-3"><div className="mb-1.5 flex justify-between text-[10px] font-semibold" style={{ color: theme.textMuted }}><span>0</span><span>1.0</span><span>3.0+</span></div><ProgressBar value={Math.min(100, (stats.profitFactor / 3) * 100)} color={stats.profitFactor >= 1 ? C.green : C.red} /></div>}
          />
        </Rise>

        {/* ── Equity + macro ───────────────────────────────────── */}
        <Rise data-tour="dash-equity" className="grid gap-4 xl:grid-cols-12">
          <Card style={{ padding: 24 }} className="xl:col-span-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle icon={LineChartIcon}>Equity curve</SectionTitle>
              <div className="-mt-4 inline-flex rounded-xl border p-0.5" style={{ borderColor: theme.border, background: theme.surface2 }}>
                {[['7d', '7D'], ['30d', '30D'], ['all', 'All']].map(([k, l]) => (
                  <button key={k} onClick={() => setRange(k)} className="rounded-[10px] px-3 py-1.5 text-[12px] font-bold transition-all"
                    style={{ background: range === k ? theme.surface : 'transparent', color: range === k ? theme.text : theme.textMuted, boxShadow: range === k ? theme.shadow : 'none' }}>{l}</button>
                ))}
              </div>
            </div>
            {equity.length >= 2 ? (
              <EquityChart key={range} points={equity} color={equity[equity.length - 1].v >= 0 ? C.green : C.red} theme={theme} />
            ) : (
              <EmptyState compact icon={LineChartIcon} title="Your equity curve starts here" description="Log at least two trades and watch your performance take shape." action={<button onClick={() => goTo('journal')} className="rounded-xl bg-[#CA8A04] px-4 py-2.5 text-[13px] font-bold text-[#1a1203]">Log a trade</button>} />
            )}
          </Card>
          <div className="xl:col-span-4"><MacroSnapshot macro={macro} keyEvent={keyEvent} theme={theme} C={C} goTo={goTo} /></div>
        </Rise>

        {/* ── Calendar + edge ──────────────────────────────────── */}
        <Rise className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7"><MonthHeatmap trades={trades} theme={theme} C={C} /></div>
          <div className="flex flex-col gap-4 xl:col-span-5">
            <Card style={{ padding: 24, flex: 1 }}>
              <SectionTitle icon={Brain} action={<button onClick={() => goTo('journal')} className="-mt-4 flex items-center gap-1 text-[12px] font-bold" style={{ color: C.gold }}>View all <ChevronRight size={13} /></button>}>Your edge</SectionTitle>
              {edge ? (
                <div className="flex flex-col">
                  {[
                    { label: 'Best session', v: edge.session, Icon: Clock },
                    { label: 'Best pair', v: edge.pair, Icon: Activity },
                    { label: 'Best mindset', v: edge.mindset, Icon: Brain },
                  ].map((row, i, arr) => (
                    <div key={row.label} className="flex items-center gap-3 py-3.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(202,138,4,0.12)', color: C.gold }}><row.Icon size={17} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>{row.label}</p>
                        <p className="m-0 mt-0.5 truncate text-[14.5px] font-semibold capitalize" style={{ color: theme.text }}>{row.v?.key ?? '—'}</p>
                      </div>
                      {row.v?.rate > 0 && <Pill color={C.green}>{row.v.rate}% win</Pill>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon={Sparkles} title="Unlock your edge" description={`Log ${Math.max(0, 5 - stats.count)} more trade${5 - stats.count === 1 ? '' : 's'} to reveal your best session, pair and mindset.`} />
              )}
            </Card>
            <Card style={{ padding: 22, borderLeft: '3px solid #CA8A04' }}>
              <p className="m-0 text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>Today&apos;s mindset</p>
              <p className="font-display m-0 mt-2.5 text-[16px] font-medium leading-relaxed" style={{ color: theme.text }}>&ldquo;{quote}&rdquo;</p>
            </Card>
          </div>
        </Rise>

        {/* ── Recent activity + quick access ───────────────────── */}
        <Rise className="grid gap-4 xl:grid-cols-12">
          <Card style={{ padding: 24 }} className="xl:col-span-7">
            <SectionTitle icon={BookOpen} action={<button onClick={() => goTo('journal')} className="-mt-4 flex items-center gap-1 text-[12px] font-bold" style={{ color: C.gold }}>View journal <ChevronRight size={13} /></button>}>Recent activity</SectionTitle>
            {recent.length ? (
              <div className="flex flex-col gap-1">
                {recent.map((t, i) => {
                  const dir = (t.direction ?? '').toUpperCase();
                  const win = t.pnl > 0;
                  return (
                    <motion.button
                      key={t.id ?? i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05, duration: 0.4, ease: EASE }}
                      onClick={() => goTo('journal')}
                      className="group flex items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: win ? 'rgba(16,185,129,0.14)' : t.pnl < 0 ? 'rgba(244,63,94,0.14)' : theme.surface2, color: win ? C.green : t.pnl < 0 ? C.red : theme.textMuted }}>
                        {win ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold" style={{ color: theme.text }}>{t.pair ?? '—'}</span>
                        <span className="block text-[11.5px]" style={{ color: theme.textMuted }}>{t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}{t.session ? ` · ${t.session}` : ''}</span>
                      </span>
                      {dir && <span className="hidden rounded-md px-2 py-0.5 text-[10px] font-bold sm:block" style={{ background: dir === 'BUY' ? 'rgba(16,185,129,0.14)' : 'rgba(244,63,94,0.14)', color: dir === 'BUY' ? C.green : C.red }}>{dir}</span>}
                      <span className="font-display w-24 text-right text-[15px] font-bold" style={{ color: win ? C.green : t.pnl < 0 ? C.red : theme.textMuted }}>{t.pnl !== 0 ? money(t.pnl) : '—'}</span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <EmptyState compact icon={BookOpen} title="No trades logged yet" description="Start journaling to track performance and unlock AI coaching." action={<button onClick={() => goTo('journal')} className="rounded-xl bg-[#CA8A04] px-4 py-2.5 text-[13px] font-bold text-[#1a1203]">Log your first trade</button>} />
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
            {[
              { view: 'intelligence', Icon: Zap, title: 'AI Insights', desc: 'Macro surprise scores and market intelligence', badge: 'AI' },
              { view: 'calendar', Icon: Calendar, title: 'Economic Calendar', desc: 'High-impact events and their market effect' },
              { view: 'calculator/risk', Icon: Calculator, title: 'Risk Planner', desc: 'Size positions and plan your growth' },
            ].map((q) => (
              <Card key={q.view} onClick={() => goTo(q.view)} style={{ padding: '18px 20px', cursor: 'pointer' }}>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(202,138,4,0.12)', color: C.gold }}><q.Icon size={19} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-[14.5px] font-bold" style={{ color: theme.text }}>{q.title}</span>{q.badge && <Pill color={C.gold}>{q.badge}</Pill>}</div>
                    <p className="m-0 mt-0.5 text-[12px] leading-snug" style={{ color: theme.textMuted }}>{q.desc}</p>
                  </div>
                  <ArrowUpRight size={16} style={{ color: theme.textMuted }} />
                </div>
              </Card>
            ))}
          </div>
        </Rise>
      </Stagger>
    </div>
  );
}
