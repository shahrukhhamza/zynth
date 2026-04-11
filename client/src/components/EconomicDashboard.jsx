import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Award, Brain, Calendar,
  Clock, ChevronRight, Activity, BookOpen,
  TrendingUp, TrendingDown, ArrowUpRight, Zap,
  DollarSign, Percent, Trophy,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../utils/authStorage';
import { API_URL } from '../config/api';

const QUOTES = [
  "The best traders don't trade every day. Patience is a position.",
  "Your edge only works if you execute it consistently.",
  "One bad trade doesn't define you. A pattern of bad trades does.",
  "Risk management is not optional. It is the job.",
  "The market will be here tomorrow. Your capital might not be.",
  "Journal every trade. The patterns will reveal themselves.",
  "Discipline is remembering what you want most.",
  "Cut losses short. Let winners run. Repeat.",
];

const SESSIONS = [
  { name: 'Tokyo',    open: 0,  close: 9,  color: '#f59e0b' },
  { name: 'London',   open: 8,  close: 17, color: '#CA8A04' },
  { name: 'New York', open: 13, close: 22, color: '#10b981' },
];

function getCurrentSessions() {
  const h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  return SESSIONS.filter(s => h >= s.open && h < s.close);
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const LIGHT = {
  page:        '#f8fafc',
  card:        '#ffffff',
  cardInner:   '#eef2f7',
  text:        '#0b0b0f',
  textSub:     '#52525b',
  textMute:    '#71717a',
  green:       '#059669',
  red:         '#dc2626',
  blue:        '#CA8A04',
};
const DARK = {
  page:        '#0b0b0f',
  card:        '#0b0b0f',
  cardInner:   '#1c1c1e',
  text:        '#f9fafb',
  textSub:     '#9ca3af',
  textMute:    '#4b5563',
  green:       '#10b981',
  red:         '#ef4444',
  blue:        '#CA8A04',
};

// ── Shared shadows ─────────────────────────────────────────────────────────────
const SHADOW_SM  = '0 1px 4px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.07)';
const SHADOW_HOV = '0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)';

// ── Reusable Card ─────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {}, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl bg-white dark:bg-[#0b0b0f] transition-all duration-200 hover:-tranzinc-y-[2px] ${className}`}
      style={{
        boxShadow: SHADOW_SM,
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        width: '100%',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = SHADOW_HOV; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = SHADOW_SM; }}
    >
      {children}
    </Tag>
  );
}

// ── Primary KPI Card (Total P&L) ──────────────────────────────────────────────
function PrimaryKPICard({ label, value, sub, color, icon: Icon, badge, badgeColor }) {
  return (
    <Card style={{ padding: '32px 32px 28px' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          {badge && (
            <span
              className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: badgeColor, background: `${badgeColor}18` }}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
      <div
        className="text-5xl font-bold tracking-tight leading-none mb-3"
        style={{ color, letterSpacing: '-0.03em' }}
      >
        {value}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium m-0">{sub}</p>
    </Card>
  );
}

// ── Secondary KPI Card ────────────────────────────────────────────────────────
function SecondaryKPICard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card style={{ padding: '24px 20px 20px' }}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div
        className="text-3xl font-bold tracking-tight leading-none mb-2"
        style={{ color, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium m-0">{sub}</p>
    </Card>
  );
}

// ── Monthly P&L Calendar ──────────────────────────────────────────────────────
function MonthlyCalendar({ trades, D, isMobile = false }) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dailyPnl = useMemo(() => {
    const map = {};
    if (!trades) return map;
    trades.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      map[key] = (map[key] ?? 0) + (parseFloat(t.pnl) || 0);
    });
    return map;
  }, [trades, year, month]);

  const weeklyPnl = useMemo(() => {
    const weeks = {};
    Object.entries(dailyPnl).forEach(([day, pnl]) => {
      const d    = new Date(year, month, parseInt(day));
      const week = Math.ceil((d.getDate() + new Date(year, month, 1).getDay()) / 7);
      weeks[week] = (weeks[week] ?? 0) + pnl;
    });
    return weeks;
  }, [dailyPnl]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = now.getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthTotal = Object.values(dailyPnl).reduce((s, v) => s + v, 0);

  return (
    <Card style={{ padding: '24px' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 m-0">
          Monthly P&amp;L
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{monthName}</span>
          <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{
              color:      monthTotal >= 0 ? D.green : D.red,
              background: monthTotal >= 0 ? `${D.green}12` : `${D.red}10`,
            }}
          >
            {monthTotal >= 0 ? '+' : ''}${Math.abs(monthTotal).toFixed(0)}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr) ${isMobile ? '48px' : '64px'}`, gap: 3, marginBottom: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 py-1 uppercase tracking-wider">{d}</div>
        ))}
        <div className="text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 py-1 uppercase tracking-wider">Wk</div>
      </div>

      {weeks.map((week, wi) => {
        const wPnl = weeklyPnl[wi + 1] ?? null;
        return (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr) ${isMobile ? '48px' : '64px'}`, gap: 3, marginBottom: 3 }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const pnl      = dailyPnl[day];
              const isToday  = day === today;
              const hasData  = pnl !== undefined;
              const isWin    = hasData && pnl > 0;
              const isLoss   = hasData && pnl < 0;
              const isFuture = day > today;
              const maxAbs   = Object.values(dailyPnl).reduce((m, v) => Math.max(m, Math.abs(v)), 1);
              const intensity = hasData ? Math.min(0.8, 0.10 + (Math.abs(pnl) / maxAbs) * 0.32) : 0;
              return (
                <div key={di} style={{
                  borderRadius: 8, padding: '6px 3px 5px',
                  textAlign: 'center',
                  background: isToday
                    ? `${D.blue}20`
                    : isWin  ? `${D.green}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`
                    : isLoss ? `${D.red}${Math.round(intensity * 0.85 * 255).toString(16).padStart(2, '0')}`
                    : D.cardInner,
                  boxShadow: isToday ? `0 0 0 1.5px ${D.blue}50` : 'none',
                  opacity: isFuture ? 0.3 : 1,
                  minHeight: isMobile ? 42 : 48,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  transition: 'transform 0.12s ease',
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: isToday ? 700 : hasData ? 600 : 400,
                    color: isToday ? D.blue : hasData ? D.text : D.textSub,
                    lineHeight: 1,
                  }}>{day}</span>
                  {hasData && (
                    <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: isWin ? D.green : D.red }}>
                      {isWin ? '+' : ''}${Math.abs(pnl) >= 1000 ? (Math.abs(pnl)/1000).toFixed(1)+'k' : Math.abs(pnl).toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
            <div style={{
              borderRadius: 8, padding: '6px 4px',
              background: wPnl != null ? (wPnl >= 0 ? `${D.green}10` : `${D.red}08`) : D.cardInner,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              minHeight: isMobile ? 42 : 48,
            }}>
              {wPnl != null ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: wPnl >= 0 ? D.green : D.red }}>
                  {wPnl >= 0 ? '+' : ''}${Math.abs(wPnl) >= 1000 ? (Math.abs(wPnl)/1000).toFixed(1)+'k' : Math.abs(wPnl).toFixed(0)}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: D.textMute }}>—</span>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-end gap-4 mt-4">
        {[{ color: D.green, label: 'Profit' }, { color: D.red, label: 'Loss' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, opacity: 0.7 }} />
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div style={{ width: 8, height: 8, borderRadius: 2, boxShadow: `0 0 0 1.5px ${D.blue}` }} />
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Today</span>
        </div>
      </div>
    </Card>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest m-0">{title}</h3>
      {action}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EconomicDashboard({ onViewChange }) {
  const theme = useTheme();
  const { user } = useAuth();

  const [weekStats,  setWeekStats]  = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [allTrades,  setAllTrades]  = useState(null);
  const [keyEvent,   setKeyEvent]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 768);

  const D = theme.isDark ? DARK : LIGHT;

  const goTo = (view) => {
    if (onViewChange) { onViewChange(view); return; }
    window.history.pushState({ view }, '', `/${view}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { view } }));
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    const now    = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const headers = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      fetch(`${API_URL}/api/journal/trades?limit=200`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/economic/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([allResult, eco]) => {
      const normalize = (t) => {
        const rawPnl = parseFloat(t.profit_loss) || 0;
        const pnl = t.outcome === 'loss' ? -Math.abs(rawPnl) : t.outcome === 'win' ? Math.abs(rawPnl) : rawPnl;
        return { ...t, pnl, date: t.created_at, emotion_before: t.emotional_state };
      };
      const calc = (data) => {
        if (!Array.isArray(data) || !data.length) return null;
        const wins = data.filter(t => parseFloat(t.pnl ?? 0) > 0).length;
        const pnl  = data.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
        return { total: data.length, wins, losses: data.length - wins, pnl, winRate: Math.round((wins / data.length) * 100) };
      };
      if (allResult.status === 'fulfilled' && allResult.value?.data) {
        const allData = allResult.value.data.map(normalize);
        setAllTrades(allData);
        setWeekStats(calc(allData.filter(t => new Date(t.created_at) >= monday)));
        setMonthStats(calc(allData.filter(t => new Date(t.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1))));
      }
      if (eco.status === 'fulfilled' && eco.value) {
        const events = Array.isArray(eco.value) ? eco.value : (eco.value?.events ?? []);
        const high = events.find(e => (e.impact ?? '').toLowerCase() === 'high');
        if (high) setKeyEvent({ title: high.event ?? high.title ?? 'High Impact Event', time: high.time ?? '' });
      }
      setLoading(false);
    });
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const edgeData = useMemo(() => {
    if (!allTrades || allTrades.length < 5) return null;
    const byKey = (fn) => {
      const map = {};
      allTrades.forEach(t => {
        const k = fn(t); if (!k) return;
        if (!map[k]) map[k] = { wins: 0, total: 0 };
        map[k].total++;
        if (parseFloat(t.pnl ?? 0) > 0) map[k].wins++;
      });
      let best = null, bestRate = -1;
      Object.entries(map).forEach(([k, v]) => {
        if (v.total < 2) return;
        const rate = v.wins / v.total;
        if (rate > bestRate) { bestRate = rate; best = { key: k, rate: Math.round(rate * 100) }; }
      });
      return best;
    };
    return { bestSession: byKey(t => t.session), bestPair: byKey(t => t.pair), topEmotion: byKey(t => t.emotion_before) };
  }, [allTrades]);

  const recentTrades = useMemo(() => {
    if (!allTrades) return [];
    return [...allTrades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [allTrades]);

  const quickStats = useMemo(() => {
    if (!allTrades?.length) return null;
    const closed  = allTrades.filter(t => parseFloat(t.pnl ?? 0) !== 0);
    const winners = closed.filter(t => parseFloat(t.pnl) > 0);
    const losers  = closed.filter(t => parseFloat(t.pnl) < 0);
    const avgWin  = winners.length ? winners.reduce((s, t) => s + parseFloat(t.pnl), 0) / winners.length : 0;
    const avgLoss = losers.length  ? Math.abs(losers.reduce((s, t) => s + parseFloat(t.pnl), 0) / losers.length) : 0;
    const best    = closed.length  ? Math.max(...closed.map(t => parseFloat(t.pnl))) : 0;
    const worst   = closed.length  ? Math.min(...closed.map(t => parseFloat(t.pnl))) : 0;
    const pf      = avgLoss > 0 ? (avgWin / avgLoss) : 0;
    return { avgWin, avgLoss, best, worst, pf };
  }, [allTrades]);

  const greeting  = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const firstName = user?.name?.split(' ')[0] ?? 'Trader';
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote     = QUOTES[dayOfYear % QUOTES.length];
  const sessions  = getCurrentSessions();
  const todayStr  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const totalPnl      = allTrades?.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0) ?? 0;
  const totalPnlColor = allTrades?.length ? (totalPnl >= 0 ? D.green : D.red) : D.textMute;
  const wins          = allTrades?.filter(t => parseFloat(t.pnl ?? 0) > 0).length ?? 0;
  const losses        = allTrades?.filter(t => parseFloat(t.pnl ?? 0) < 0).length ?? 0;
  const wr            = allTrades?.length ? Math.round((wins / allTrades.length) * 100) : 0;
  const wrColor       = !allTrades?.length ? D.textMute : wr >= 50 ? D.green : D.red;

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.page, height: '100%' }}>
      <div className="text-center">
        <div style={{ width: 28, height: 28, border: `2px solid ${D.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: D.textSub, margin: 0 }}>Loading your dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: D.page, padding: isMobile ? '20px 12px 56px' : '32px 24px 64px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .trade-row:hover { background: ${D.cardInner} !important; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 24 }}>

        {/* ══ HEADER ════════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold m-0" style={{ color: D.text, letterSpacing: '-0.02em' }}>
              {greeting}, <span style={{ color: D.blue }}>{firstName}</span>
            </h1>
            <p className="text-sm m-0 mt-1" style={{ color: D.textSub }}>{todayStr}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {sessions.length > 0 ? sessions.map(s => (
              <span key={s.name} style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                color: s.color, background: `${s.color}12`,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                {s.name}
              </span>
            )) : (
              <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 99, color: D.textSub, background: D.cardInner }}>
                All Sessions Closed
              </span>
            )}
            <button
              onClick={() => goTo('journal')}
              style={{
                padding: '9px 18px', background: D.green, color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: `0 4px 16px ${D.green}35`,
              }}
            >
              <Plus size={14} /> New Entry
            </button>
          </div>
        </div>

        {/* ══ ROW 1: KPI GRID 6/2/2/2 ═══════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(12, 1fr)', gap: 12 }}>
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 6' }}>
            <PrimaryKPICard
              label="Total P&L"
              value={allTrades?.length ? `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}` : '$0.00'}
              sub={allTrades?.length ? `Across ${allTrades.length} total trades` : 'No trades logged yet'}
              color={totalPnlColor}
              icon={DollarSign}
              badge="ALL TIME"
              badgeColor={D.blue}
            />
          </div>
          <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
            <SecondaryKPICard
              label="Win Rate"
              value={allTrades?.length ? `${wr}%` : '—'}
              sub={allTrades?.length ? `${wins}W · ${losses}L` : 'No trades'}
              color={wrColor}
              icon={Percent}
            />
          </div>
          <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
            <SecondaryKPICard
              label="This Week"
              value={weekStats?.total > 0 ? `${weekStats.pnl >= 0 ? '+' : ''}$${Math.abs(weekStats.pnl).toFixed(0)}` : '$0'}
              sub={weekStats?.total > 0 ? `${weekStats.wins}W · ${weekStats.losses}L` : 'No trades'}
              color={weekStats?.total > 0 ? (weekStats.pnl >= 0 ? D.green : D.red) : D.textMute}
              icon={weekStats?.pnl >= 0 ? TrendingUp : TrendingDown}
            />
          </div>
          <div style={{ gridColumn: isMobile ? 'span 2' : 'span 2' }}>
            <SecondaryKPICard
              label="Profit Factor"
              value={quickStats?.pf > 0 ? quickStats.pf.toFixed(2) : '—'}
              sub={quickStats ? `Avg win $${quickStats.avgWin.toFixed(0)}` : 'No closed trades'}
              color={quickStats?.pf >= 1 ? D.green : quickStats?.pf > 0 ? D.red : D.textMute}
              icon={Trophy}
            />
          </div>
        </div>

        {/* ══ ROW 2: CALENDAR 8 / MINDSET+STATS 4 ══════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: 12 }}>
          <div style={{ gridColumn: isMobile ? 'span 1' : 'span 8' }}>
            <MonthlyCalendar trades={allTrades} D={D} isMobile={isMobile} />
          </div>
          <div style={{ gridColumn: isMobile ? 'span 1' : 'span 4', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card style={{ padding: '24px 20px', borderLeft: `3px solid ${D.blue}` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 m-0" style={{ color: D.textSub }}>
                Today&apos;s Mindset
              </p>
              <p className="text-sm leading-relaxed m-0 italic" style={{ color: D.text }}>
                &ldquo;{quote}&rdquo;
              </p>
            </Card>
            <Card style={{ padding: '24px 20px', flex: 1 }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 m-0" style={{ color: D.textSub }}>
                Quick Stats
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Avg Win',     value: quickStats ? `+$${quickStats.avgWin.toFixed(0)}`  : '—', color: D.green },
                  { label: 'Avg Loss',    value: quickStats ? `-$${quickStats.avgLoss.toFixed(0)}` : '—', color: quickStats ? D.red : D.textMute },
                  { label: 'Best Trade',  value: quickStats ? `+$${quickStats.best.toFixed(0)}`    : '—', color: D.green },
                  { label: 'Worst Trade', value: quickStats ? `$${quickStats.worst.toFixed(0)}`    : '—', color: quickStats?.worst < 0 ? D.red : D.textMute },
                ].map(q => (
                  <div key={q.label} style={{ borderRadius: 10, padding: '12px', background: D.cardInner }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider m-0 mb-1.5" style={{ color: D.textSub }}>{q.label}</p>
                    <p className="text-base font-bold leading-none m-0" style={{ color: q.color, letterSpacing: '-0.02em' }}>{q.value}</p>
                  </div>
                ))}
              </div>
              {keyEvent && (
                <div className="flex items-start gap-2 mt-4 rounded-xl p-3" style={{ background: `${D.blue}0d` }}>
                  <Calendar size={13} style={{ color: D.blue, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider m-0 mb-1" style={{ color: D.blue }}>Key Event</p>
                    <p className="text-xs font-semibold m-0" style={{ color: D.text }}>{keyEvent.title}</p>
                    {keyEvent.time && <p className="text-[11px] m-0 mt-0.5" style={{ color: D.textSub }}>{keyEvent.time}</p>}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ══ ROW 3: EDGE 6 / RECENT ACTIVITY 6 ════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: 12 }}>
          <div style={{ gridColumn: isMobile ? 'span 1' : 'span 6' }}>
            <Card style={{ padding: '24px' }}>
              <SectionHeader
                title="Your Edge"
                action={
                  <button onClick={() => goTo('journal')}
                    style={{ fontSize: 12, color: D.green, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600, padding: 0 }}>
                    View all <ChevronRight size={12} />
                  </button>
                }
              />
              {edgeData ? (
                <div className="flex flex-col">
                  {[
                    { label: 'Best Session', value: edgeData.bestSession?.key, rate: edgeData.bestSession?.rate, Icon: Clock,    color: D.green },
                    { label: 'Best Pair',    value: edgeData.bestPair?.key,    rate: edgeData.bestPair?.rate,    Icon: Activity, color: D.blue  },
                    { label: 'Top Mindset',  value: edgeData.topEmotion?.key,  rate: edgeData.topEmotion?.rate,  Icon: Brain,    color: D.blue  },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 0',
                      borderBottom: i < arr.length - 1 ? `1px solid ${D.cardInner}` : 'none',
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${row.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <row.Icon size={15} style={{ color: row.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider m-0 mb-1" style={{ color: D.textSub }}>{row.label}</p>
                        <p className="text-sm font-semibold m-0 truncate" style={{ color: D.text }}>{row.value ?? '—'}</p>
                      </div>
                      {row.rate > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: row.color, background: `${row.color}10`, padding: '3px 10px', borderRadius: 99, flexShrink: 0 }}>
                          {row.rate}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${D.green}0e`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={22} style={{ color: D.green }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold m-0 mb-1" style={{ color: D.text }}>Unlock Your Edge</p>
                    <p className="text-xs m-0" style={{ color: D.textSub }}>
                      Log <span style={{ color: D.green, fontWeight: 700 }}>{Math.max(0, 5 - (allTrades?.length ?? 0))} more trade{Math.max(0, 5 - (allTrades?.length ?? 0)) !== 1 ? 's' : ''}</span> to reveal patterns
                    </p>
                  </div>
                  {allTrades?.length > 0 && (
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ width: 20, height: 3, borderRadius: 99, background: i < allTrades.length ? D.green : D.cardInner }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          <div style={{ gridColumn: isMobile ? 'span 1' : 'span 6' }}>
            <Card style={{ padding: '24px' }}>
              <SectionHeader
                title="Recent Activity"
                action={
                  <button onClick={() => goTo('journal')}
                    style={{ fontSize: 12, color: D.green, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600, padding: 0 }}>
                    View all <ChevronRight size={12} />
                  </button>
                }
              />
              {recentTrades.length > 0 ? recentTrades.map((t, i) => {
                const pnl     = parseFloat(t.pnl ?? 0);
                const dir     = (t.direction ?? '').toUpperCase();
                const outcome = (t.outcome ?? (pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : '')).toUpperCase();
                const isWin   = outcome === 'WIN';
                const dateLabel = t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                return (
                  <div key={t.id ?? i} className="trade-row flex items-center gap-3 px-2 py-3 rounded-xl cursor-pointer" style={{ marginBottom: 2 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: isWin ? D.green : outcome === 'LOSS' ? D.red : D.textMute }} />
                    {isMobile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: D.text, lineHeight: 1.2 }}>{t.pair ?? '—'}</span>
                        <span style={{ fontSize: 11, color: D.textSub }}>{dateLabel}{dir ? ` · ${dir}` : ''}</span>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: 11, color: D.textSub, width: 52, flexShrink: 0 }}>{dateLabel}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: D.text, width: 72, flexShrink: 0 }}>{t.pair ?? '—'}</span>
                        {dir && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, flexShrink: 0, background: dir === 'BUY' ? `${D.green}12` : `${D.red}12`, color: dir === 'BUY' ? D.green : D.red }}>
                            {dir}
                          </span>
                        )}
                        {t.session && (
                          <span style={{ fontSize: 10, color: D.textSub, background: D.cardInner, padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>{t.session}</span>
                        )}
                      </>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: pnl > 0 ? D.green : pnl < 0 ? D.red : D.textSub, letterSpacing: '-0.02em', flexShrink: 0 }}>
                      {pnl !== 0 ? `${pnl > 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}` : '—'}
                    </span>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${D.green}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={24} style={{ color: D.green }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold m-0 mb-1" style={{ color: D.text }}>No trades logged yet</p>
                    <p className="text-xs m-0 mb-4" style={{ color: D.textSub }}>Start journaling to track performance and unlock AI insights</p>
                    <button onClick={() => goTo('journal')} style={{ padding: '10px 20px', background: D.green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Log Your First Trade
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ══ ROW 4: QUICK ACCESS ════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { view: 'intelligence', Icon: Zap,      color: D.blue, title: 'AI Insights',       desc: 'Macro surprise scores and market intelligence', badge: 'AI' },
            { view: 'calendar',     Icon: Calendar, color: D.blue, title: 'Economic Calendar', desc: 'High-impact events and their market effects',    badge: null },
          ].map(item => (
            <Card key={item.view} onClick={() => goTo(item.view)} style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon size={18} style={{ color: item.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: D.text }}>{item.title}</span>
                  {item.badge && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: D.blue, background: `${D.blue}12`, padding: '2px 5px', borderRadius: 99 }}>{item.badge}</span>
                  )}
                </div>
                <p className="text-xs m-0" style={{ color: D.textSub }}>{item.desc}</p>
              </div>
              <ArrowUpRight size={14} style={{ color: D.textMute, flexShrink: 0 }} />
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
