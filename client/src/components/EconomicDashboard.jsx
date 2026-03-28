import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Target, Award, Brain, Calendar, BarChart2,
  Clock, ChevronRight, Flame, Activity, BookOpen,
  TrendingUp, TrendingDown, ArrowUpRight, Zap,
  DollarSign, Percent, Trophy, Layers
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
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
  { name: 'London',   open: 8,  close: 17, color: '#3b82f6' },
  { name: 'New York', open: 13, close: 22, color: '#10b981' },
];

function getCurrentSessions() {
  const h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  return SESSIONS.filter(s => h >= s.open && h < s.close);
}

// ── Metric Stat Card ────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accentColor, iconBg, iconColor, icon: Icon, badge, badgeColor }) {
  return (
    <div
      className="group relative flex flex-col gap-0 cursor-default select-none overflow-hidden
        rounded-2xl border bg-white dark:bg-slate-900
        border-gray-200 dark:border-gray-700
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.05)]
        dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_20px_rgba(0,0,0,0.2)]
        transition-all duration-200
        hover:shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_6px_rgba(0,0,0,0.06)]
        dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
        hover:-translate-y-px
        p-5"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Top row: label + badge + icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 truncate">
            {label}
          </span>
          {badge && (
            <span
              className="text-[9px] font-extrabold px-[6px] py-[2px] rounded-full tracking-[0.06em]"
              style={{ color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}30` }}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
            ml-2 transition-transform duration-200 group-hover:scale-110"
          style={{ background: iconBg }}
        >
          <Icon className="w-[15px] h-[15px]" style={{ color: iconColor }} />
        </div>
      </div>

      {/* Value */}
      <div
        className="text-[28px] font-extrabold leading-none tracking-[-0.03em] mb-2"
        style={{ color: accentColor }}
      >
        {value}
      </div>

      {/* Sub text */}
      <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500 m-0">{sub}</p>

      {/* Decorative glow strip on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}60, ${accentColor}00)` }}
      />
    </div>
  );
}

// ── Monthly P&L Calendar ────────────────────────────────────────────────────
function MonthlyCalendar({ trades, D }) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build daily P&L map
  const dailyPnl = useMemo(() => {
    const map = {};
    if (!trades) return map;
    trades.forEach(t => {
      if (!t.date) return;
      const d   = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      map[key]  = (map[key] ?? 0) + (parseFloat(t.pnl) || 0);
    });
    return map;
  }, [trades, year, month]);

  // Build weekly P&L
  const weeklyPnl = useMemo(() => {
    const weeks = {};
    Object.entries(dailyPnl).forEach(([day, pnl]) => {
      const d    = new Date(year, month, parseInt(day));
      const week = Math.ceil((d.getDate() + new Date(year, month, 1).getDay()) / 7);
      weeks[week] = (weeks[week] ?? 0) + pnl;
    });
    return weeks;
  }, [dailyPnl]);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const monthTotal = Object.values(dailyPnl).reduce((s, v) => s + v, 0);

  return (
    <div style={{ ...cardStyle(D), padding: '20px 22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          Monthly P&L
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: D.textSub }}>{monthName}</span>
          <span style={{
            fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
            color: monthTotal >= 0 ? D.accent : D.red,
            background: monthTotal >= 0 ? `${D.accent}12` : `${D.red}10`,
            padding: '2px 8px', borderRadius: 99,
            border: `1px solid ${monthTotal >= 0 ? D.accent : D.red}25`,
          }}>
            {monthTotal >= 0 ? '+' : ''}${Math.abs(monthTotal).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 72px', gap: 4, marginBottom: 5 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ fontSize: 9, fontWeight: 700, color: D.textSub, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 0' }}>{d}</div>
        ))}
        <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>WEEK</div>
      </div>

      {/* Calendar rows */}
      {weeks.map((week, wi) => {
        const weekNum = wi + 1;
        const wPnl    = weeklyPnl[weekNum] ?? null;
        return (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 72px', gap: 4, marginBottom: 4 }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const pnl      = dailyPnl[day];
              const isToday  = day === today;
              const hasData  = pnl !== undefined;
              const isWin    = hasData && pnl > 0;
              const isLoss   = hasData && pnl < 0;
              const isFuture = day > today;

              // Intensity: saturate bg more for larger P&L
              const maxAbs = Object.values(dailyPnl).reduce((m, v) => Math.max(m, Math.abs(v)), 1);
              const intensity = hasData ? Math.min(0.85, 0.12 + (Math.abs(pnl) / maxAbs) * 0.35) : 0.08;

              return (
                <div key={di}
                  className={`cal-cell${isFuture ? ' cal-future' : ''}`}
                  style={{
                    borderRadius: 8,
                    padding: '6px 4px 5px',
                    textAlign: 'center',
                    background: isToday
                      ? `${D.accent}22`
                      : isWin
                      ? `${D.accent}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`
                      : isLoss
                      ? `${D.red}${Math.round(intensity * 0.85 * 255).toString(16).padStart(2, '0')}`
                      : D.cardBg2,
                    border: isToday
                      ? `1.5px solid ${D.accent}60`
                      : isWin
                      ? `1px solid ${D.accent}30`
                      : isLoss
                      ? `1px solid ${D.red}25`
                      : `1px solid ${D.border}`,
                    opacity: isFuture ? 0.35 : 1,
                    minHeight: 52,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    boxShadow: isToday ? `0 0 0 2px ${D.accent}20` : 'none',
                  }}
                >
                  <span style={{
                    fontSize: 11,
                    fontWeight: isToday ? 800 : hasData ? 600 : 500,
                    color: isToday ? D.accent : hasData ? D.text : D.textSub,
                    lineHeight: 1,
                  }}>
                    {day}
                  </span>
                  {hasData && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, lineHeight: 1,
                      color: isWin ? D.accent : D.red,
                    }}>
                      {isWin ? '+' : ''}${Math.abs(pnl) >= 1000 ? (Math.abs(pnl)/1000).toFixed(1)+'k' : Math.abs(pnl).toFixed(0)}
                    </span>
                  )}
                  {/* Win/loss bar */}
                  {hasData && (
                    <div style={{
                      position: 'absolute', bottom: 3, left: '20%', right: '20%',
                      height: 2, borderRadius: 99,
                      background: isWin ? D.accent : D.red,
                      opacity: 0.6,
                    }} />
                  )}
                </div>
              );
            })}

            {/* Weekly P&L summary cell */}
            <div className="cal-cell" style={{
              borderRadius: 8, padding: '6px 6px',
              background: wPnl != null
                ? (wPnl >= 0 ? `${D.accent}12` : `${D.red}10`)
                : D.cardBg2,
              border: wPnl != null
                ? `1px solid ${wPnl >= 0 ? D.accent : D.red}25`
                : `1px solid ${D.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              minHeight: 52,
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: D.textSub, letterSpacing: '0.06em', textTransform: 'uppercase' }}>WK</span>
              {wPnl != null ? (
                <span style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em',
                  color: wPnl >= 0 ? D.accent : D.red,
                }}>
                  {wPnl >= 0 ? '+' : ''}${Math.abs(wPnl) >= 1000 ? (Math.abs(wPnl)/1000).toFixed(1)+'k' : Math.abs(wPnl).toFixed(0)}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: D.textMute, fontWeight: 500 }}>—</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, justifyContent: 'flex-end' }}>
        {[
          { color: D.accent, label: 'Profit day' },
          { color: D.red,    label: 'Loss day' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, opacity: 0.7 }} />
            <span style={{ fontSize: 10, color: D.textSub }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px solid ${D.accent}` }} />
          <span style={{ fontSize: 10, color: D.textSub }}>Today</span>
        </div>
      </div>
    </div>
  );
}

// ── Card style helper ────────────────────────────────────────────────────────
function cardStyle(D, extra = {}) {
  return {
    background: D.cardBg,
    border: `1px solid ${D.border}`,
    borderRadius: 14,
    boxShadow: D.shadow || 'none',
    ...extra,
  };
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function EconomicDashboard({ onViewChange }) {
  const theme = useTheme();
  const { user } = useAuth();

  const [weekStats,  setWeekStats]  = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [allTrades,  setAllTrades]  = useState(null);
  const [keyEvent,   setKeyEvent]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  const goTo = (view) => {
    if (onViewChange) { onViewChange(view); return; }
    window.history.pushState({ view }, '', `/${view}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { view } }));
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setLoading(false); return; }

    const now        = new Date();
    const monday     = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekStart  = monday.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const headers    = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`${API_URL}/api/journal/trades?limit=200`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/economic/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([allResult, eco]) => {
      // Normalize DB field names so all downstream code (t.pnl, t.date, t.emotion_before) works
      // Also correct P&L sign for old trades stored with wrong sign (outcome takes precedence)
      const normalize = (t) => {
        const rawPnl = parseFloat(t.profit_loss) || 0;
        const pnl = t.outcome === 'loss'
          ? -Math.abs(rawPnl)
          : t.outcome === 'win'
          ? Math.abs(rawPnl)
          : rawPnl;
        return {
          ...t,
          pnl,
          date:           t.created_at,
          emotion_before: t.emotional_state,
        };
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
      if (eco.status   === 'fulfilled' && eco.value) {
        const events = Array.isArray(eco.value) ? eco.value : (eco.value?.events ?? []);
        const high   = events.find(e => (e.impact ?? '').toLowerCase() === 'high');
        if (high) setKeyEvent({ title: high.event ?? high.title ?? 'High Impact Event', time: high.time ?? '' });
      }
      setLoading(false);
    });
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────
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
    return {
      bestSession: byKey(t => t.session),
      bestPair:    byKey(t => t.pair),
      topEmotion:  byKey(t => t.emotion_before),
    };
  }, [allTrades]);

  const streak = useMemo(() => {
    if (!allTrades?.length) return null;
    const sorted = [...allTrades].sort((a, b) => new Date(b.date) - new Date(a.date));
    let count = 0, type = null;
    for (const t of sorted) {
      const win = parseFloat(t.pnl ?? 0) > 0;
      if (!type) { type = win ? 'win' : 'loss'; count = 1; }
      else if ((type === 'win') === win) count++;
      else break;
    }
    return { count, type };
  }, [allTrades]);

  const recentTrades = useMemo(() => {
    if (!allTrades) return [];
    return [...allTrades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [allTrades]);

  // Quick stats
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
  const todayStr  = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // ── Design tokens ────────────────────────────────────────────────────────
  const D = theme.isDark ? {
    pageBg:      theme.bg,
    cardBg:      theme.surface,
    cardBg2:     theme.surface2,
    border:      theme.border,
    border2:     'rgba(255,255,255,0.10)',
    text:        theme.text,
    textSub:     '#8892a4',
    textMute:    'rgba(255,255,255,0.08)',
    accent:      '#10b981',
    gold:        '#f59e0b',
    red:         '#ef4444',
    blue:        '#0ea5e9',
    shadow:      'none',
    shadowHover: '0 4px 24px rgba(0,0,0,0.35)',
  } : {
    pageBg:      '#f1f5f9',
    cardBg:      '#ffffff',
    cardBg2:     '#f8fafc',
    border:      'rgba(0,0,0,0.07)',
    border2:     'rgba(0,0,0,0.12)',
    text:        '#0f172a',
    textSub:     '#475569',
    textMute:    '#94a3b8',
    accent:      '#10b981',
    gold:        '#d97706',
    red:         '#dc2626',
    blue:        '#2563eb',
    shadow:      '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)',
    shadowHover: '0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.08)',
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.pageBg, height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${theme.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ fontSize: 13, color: D.textSub, margin: 0 }}>Loading your dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const CS = cardStyle.bind(null, D);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: D.pageBg, padding: '24px 24px 56px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dc:hover { border-color: ${D.border2} !important; box-shadow: ${D.shadowHover} !important; }
        .trade-row { transition: background 0.12s ease; border-radius: 8px; }
        .trade-row:hover { background: ${D.cardBg2} !important; }
        .qcard:hover { border-color: var(--qhc) !important; background: var(--qhb) !important; }
        .new-entry-btn:hover { opacity: 0.92 !important; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(16,185,129,0.35) !important; }
        .cal-cell { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; cursor: default; position: relative; }
        .cal-cell:not(.cal-future):hover { transform: scale(1.06); box-shadow: ${D.shadowHover}; border-color: ${D.border2} !important; z-index: 2; }
        .qstat { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; cursor: default; }
        .qstat:hover { transform: translateY(-2px); box-shadow: ${D.shadowHover}; border-color: ${D.border2} !important; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══ ROW 1: HEADER ══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
              {greeting}, <span style={{ color: theme.accent }}>{firstName}</span>
            </h1>
            <p style={{ fontSize: 13, color: D.textSub, margin: '3px 0 0' }}>{todayStr}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {sessions.length > 0 ? sessions.map(s => (
              <span key={s.name} style={{
                fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99,
                color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}35`,
                letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                {s.name}
              </span>
            )) : (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 99, color: D.textSub, background: D.cardBg2, border: `1px solid ${D.border}` }}>
                All Sessions Closed
              </span>
            )}
            <button
              onClick={() => goTo('journal')}
              className="new-entry-btn"
              style={{
                padding: '9px 18px', background: theme.accent, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: `0 4px 14px ${theme.accent}40`,
                transition: 'opacity 0.15s, transform 0.15s',
              }}
            >
              <Plus style={{ width: 14, height: 14 }} /> New Entry
            </button>
          </div>
        </div>

        {/* ══ ROW 2: STAT CARDS ══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* Total P&L */}
          {(() => {
            const totalPnl = allTrades?.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0) ?? 0;
            return (
              <MetricCard
                label="Total P&L"
                value={allTrades?.length ? `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}` : '+$0.00'}
                sub={allTrades?.length ? `${allTrades.length} total trades` : '0 trades'}
                accentColor={totalPnl >= 0 ? D.accent : D.red}
                iconBg="#10b98118"
                iconColor={D.accent}
                icon={DollarSign}
                badge="TOTAL"
                badgeColor={D.blue}
              />
            );
          })()}

          {/* Win Rate */}
          {(() => {
            const wins = allTrades?.filter(t => parseFloat(t.pnl ?? 0) > 0).length ?? 0;
            const losses = allTrades?.filter(t => parseFloat(t.pnl ?? 0) < 0).length ?? 0;
            const wr = allTrades?.length ? Math.round((wins / allTrades.length) * 100) : 0;
            return (
              <MetricCard
                label="Win Rate"
                value={allTrades?.length ? `${wr}%` : '0%'}
                sub={allTrades?.length ? `${wins}W · ${losses}L` : 'No trades yet'}
                accentColor={!allTrades?.length ? D.textSub : wr >= 50 ? D.accent : D.red}
                iconBg="#f59e0b18"
                iconColor={D.gold}
                icon={Percent}
              />
            );
          })()}

          {/* This Week P&L */}
          <MetricCard
            label="This Week P&L"
            value={weekStats?.total > 0 ? `${weekStats.pnl >= 0 ? '+' : ''}$${Math.abs(weekStats.pnl).toFixed(2)}` : '+$0.00'}
            sub={weekStats?.total > 0 ? `${weekStats.wins}W · ${weekStats.losses}L this week` : 'No trades this week'}
            accentColor={weekStats?.total > 0 ? (weekStats.pnl >= 0 ? D.accent : D.red) : D.textSub}
            iconBg="#0ea5e918"
            iconColor={D.blue}
            icon={weekStats?.pnl >= 0 ? TrendingUp : TrendingDown}
          />

          {/* Profit Factor */}
          <MetricCard
            label="Profit Factor"
            value={quickStats?.pf > 0 ? quickStats.pf.toFixed(2) : '0.00'}
            sub={quickStats ? `Avg win: $${quickStats.avgWin.toFixed(0)}` : 'No closed trades'}
            accentColor={quickStats?.pf >= 1 ? D.accent : quickStats?.pf > 0 ? D.red : D.textSub}
            iconBg="#10b98118"
            iconColor={D.accent}
            icon={Trophy}
          />
        </div>

        {/* ══ ROW 3: MONTHLY CALENDAR + QUICK STATS ══════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* Monthly P&L Calendar */}
          <MonthlyCalendar trades={allTrades} D={D} />

          {/* Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Quote card */}
            <div style={{
              ...CS({ padding: '18px 20px' }),
              borderLeft: `3px solid ${theme.accent}`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Today's Mindset
              </div>
              <p style={{ fontSize: 13, color: D.text, fontStyle: 'italic', margin: 0, lineHeight: 1.7 }}>
                "{quote}"
              </p>
            </div>

            {/* Quick Stats card */}
            <div style={{ ...CS({ padding: '18px 20px' }), flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                Quick Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Avg Win',     value: quickStats ? `+$${quickStats.avgWin.toFixed(0)}`    : '—', color: D.accent, accent: D.accent },
                  { label: 'Avg Loss',    value: quickStats ? `-$${quickStats.avgLoss.toFixed(0)}`   : '—', color: quickStats ? D.red : D.textSub, accent: D.red },
                  { label: 'Best Trade',  value: quickStats ? `+$${quickStats.best.toFixed(0)}`      : '—', color: D.accent, accent: D.accent },
                  { label: 'Worst Trade', value: quickStats ? `$${quickStats.worst.toFixed(0)}`      : '—', color: quickStats?.worst < 0 ? D.red : D.textSub, accent: D.red },
                ].map(q => (
                  <div key={q.label} className="qstat" style={{
                    background: D.cardBg2,
                    border: `1px solid ${D.border}`,
                    borderLeft: `3px solid ${q.accent}30`,
                    borderRadius: 8,
                    padding: '12px 13px',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {q.label}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: q.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {q.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Key event */}
              {keyEvent && (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: `${D.gold}10`, border: `1px solid ${D.gold}25`, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Calendar style={{ width: 13, height: 13, color: D.gold, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: D.gold, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Key Event</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: D.text, lineHeight: 1.4 }}>{keyEvent.title}</div>
                    {keyEvent.time && <div style={{ fontSize: 11, color: D.textSub, marginTop: 2 }}>{keyEvent.time}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ ROW 4: YOUR EDGE + RECENT TRADES ══════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>

          {/* Your Edge */}
          <div className="dc" style={{ ...CS({ padding: '20px' }) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Your Edge</h2>
              <button onClick={() => goTo('journal')} style={{ fontSize: 11, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                View all <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>

            {edgeData ? (
              <div>
                {[
                  { label: 'Best Session', value: edgeData.bestSession?.key, rate: edgeData.bestSession?.rate, icon: Clock,    color: theme.accent },
                  { label: 'Best Pair',    value: edgeData.bestPair?.key,    rate: edgeData.bestPair?.rate,    icon: Activity, color: D.gold   },
                  { label: 'Top Mindset',  value: edgeData.topEmotion?.key,  rate: edgeData.topEmotion?.rate,  icon: Brain,    color: D.blue   },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${row.color}14`, border: `1px solid ${row.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <row.icon style={{ width: 14, height: 14, color: row.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: D.textSub, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value ?? '—'}</div>
                    </div>
                    {row.rate > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: row.color, background: `${row.color}12`, border: `1px solid ${row.color}25`, padding: '3px 9px', borderRadius: 99, flexShrink: 0 }}>
                        {row.rate}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${theme.accent}10`, border: `1px solid ${theme.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award style={{ width: 22, height: 22, color: theme.accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 5 }}>Unlock Your Edge</div>
                  <div style={{ fontSize: 12, color: D.textSub, lineHeight: 1.7 }}>
                    Log <span style={{ color: theme.accent, fontWeight: 700 }}>{Math.max(0, 5 - (allTrades?.length ?? 0))} more trade{Math.max(0, 5 - (allTrades?.length ?? 0)) !== 1 ? 's' : ''}</span> to reveal patterns
                  </div>
                </div>
                {allTrades?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{ width: 22, height: 4, borderRadius: 99, background: i < allTrades.length ? theme.accent : D.border2 }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Trades */}
          <div className="dc" style={{ ...CS({ padding: '20px' }) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Recent Activity</h2>
              <button onClick={() => goTo('journal')} style={{ fontSize: 11, color: theme.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                View all <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>

            {recentTrades.length > 0 ? recentTrades.map((t, i) => {
              const pnl     = parseFloat(t.pnl ?? 0);
              const dir     = (t.direction ?? '').toUpperCase();
              const outcome = (t.outcome ?? (pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : '')).toUpperCase();
              const isWin   = outcome === 'WIN';
              return (
                <div key={t.id ?? i} className="trade-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', marginBottom: 2, cursor: 'pointer' }}>
                  {/* Outcome dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isWin ? D.accent : outcome === 'LOSS' ? D.red : D.border2 }} />

                  {/* Date */}
                  <span style={{ fontSize: 11, color: D.textSub, width: 54, flexShrink: 0 }}>
                    {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </span>

                  {/* Pair */}
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text, width: 75, flexShrink: 0 }}>{t.pair ?? '—'}</span>

                  {/* Direction */}
                  {dir && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, flexShrink: 0, background: dir === 'BUY' ? `${D.accent}15` : `${D.red}15`, color: dir === 'BUY' ? D.accent : D.red, border: `1px solid ${dir === 'BUY' ? D.accent : D.red}30` }}>
                      {dir}
                    </span>
                  )}

                  {/* Session */}
                  {t.session && (
                    <span style={{ fontSize: 11, color: D.textSub, background: D.cardBg2, border: `1px solid ${D.border}`, padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>{t.session}</span>
                  )}

                  {/* Strategy */}
                  {t.strategy && (
                    <span style={{ fontSize: 10, color: D.textSub, background: D.cardBg2, border: `1px solid ${D.border}`, padding: '2px 7px', borderRadius: 99, flexShrink: 0, maxWidth: 85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.strategy}</span>
                  )}

                  {/* P&L */}
                  <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, color: pnl > 0 ? D.accent : pnl < 0 ? D.red : D.textSub, letterSpacing: '-0.02em', flexShrink: 0 }}>
                    {pnl !== 0 ? `${pnl > 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}` : '—'}
                  </span>
                </div>
              );
            }) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 0', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${theme.accent}10`, border: `1px solid ${theme.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen style={{ width: 24, height: 24, color: theme.accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: D.text, marginBottom: 5 }}>No trades logged yet</div>
                  <div style={{ fontSize: 12, color: D.textSub, marginBottom: 16, lineHeight: 1.7 }}>Start journaling to track performance and unlock AI insights</div>
                  <button onClick={() => goTo('journal')} style={{ padding: '10px 22px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px ${theme.accent}35` }}>
                    <Plus style={{ width: 14, height: 14 }} /> Log Your First Trade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ ROW 5: QUICK ACCESS ════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { view: 'intelligence',Icon: Zap,       color: D.blue,   title: 'AI Insights',         desc: 'Macroeconomic surprise scores and market intelligence',   badge: 'AI' },
            { view: 'calendar',    Icon: Calendar,  color: D.gold,   title: 'Economic Calendar',   desc: 'High impact economic events and their market impact',     badge: null },
          ].map(item => (
            <button
              key={item.view}
              onClick={() => goTo(item.view)}
              className="dc qcard"
              style={{
                '--qhc': `${item.color}40`,
                '--qhb': `${item.color}06`,
                ...CS({ padding: '16px 18px' }),
                display: 'flex', alignItems: 'flex-start', gap: 12,
                textAlign: 'left', cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${item.color}14`, border: `1px solid ${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon style={{ width: 17, height: 17, color: item.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{item.title}</span>
                  {item.badge && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#8b5cf6', background: '#8b5cf615', border: '1px solid #8b5cf625', padding: '2px 5px', borderRadius: 99 }}>{item.badge}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: D.textSub, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
              <ArrowUpRight style={{ width: 14, height: 14, color: D.textMute, flexShrink: 0, marginTop: 2 }} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

