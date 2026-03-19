import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Plus, ArrowRight,
  Target, Award, Brain, Calendar, BarChart2,
  Clock, ChevronRight, Flame, Activity, BookOpen
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import DailyBrief from './DailyBrief';

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
  { name: 'Tokyo',  open: 0,  close: 9,  color: '#f59e0b' },
  { name: 'London', open: 8,  close: 17, color: '#60a5fa' },
  { name: 'New York', open: 13, close: 22, color: '#34d399' },
];

function getCurrentSessions() {
  const utcH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  return SESSIONS.filter(s => utcH >= s.open && utcH < s.close);
}

// ── Mini sparkline SVG ───────────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, trend }) {
  const theme = useTheme();
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      transition: 'border-color 0.15s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = theme.isDark ? '#2a2a2a' : '#d0d0d0'}
      onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: theme.textMuted,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: color ? `${color}18` : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 12, height: 12, color: color ?? theme.textMuted }} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? theme.text, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }) {
  const theme = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h2 style={{
        fontSize: 11, fontWeight: 700, color: theme.textMuted,
        letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
      }}>
        {title}
      </h2>
      {action && (
        <button
          onClick={onAction}
          style={{
            fontSize: 11, color: '#10b981', background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
            fontWeight: 500, padding: 0,
          }}
        >
          {action} <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EconomicDashboard({ onViewChange }) {
  const theme = useTheme();
  const { user } = useAuth();

  const [weekStats, setWeekStats]   = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [allTrades, setAllTrades]   = useState(null);
  const [keyEvent, setKeyEvent]     = useState(null);
  const [loading, setLoading]       = useState(true);

  // ── Navigate to journal ───────────────────────────────────────────────────
  const goToJournal = () => {
    if (onViewChange) { onViewChange('journal'); return; }
    window.history.pushState({ view: 'journal' }, '', '/journal');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'journal' } }));
  };

  const goToView = (view) => {
    if (onViewChange) { onViewChange(view); return; }
    window.history.pushState({ view }, '', `/${view}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state: { view } }));
  };

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    console.log('Dashboard token:', token ? 'found' : 'missing');
    console.log('Dashboard API_URL:', API_URL);
    if (!token) { setLoading(false); return; }

    const now = new Date();

    // This week
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch all trades (server provides pagination; request a large limit and compute week/month client-side)
    Promise.all([
      fetch(`${API_URL}/api/journal/trades?limit=500`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`${API_URL}/api/economic/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([tradesRes, eco]) => {
      const trades = tradesRes?.data ?? [];
      console.log('All trades result:', tradesRes);

      const calcStats = (data) => {
        if (!Array.isArray(data) || data.length === 0) return null;
        const wins  = data.filter(t => parseFloat(t.profit_loss ?? t.pnl ?? 0) > 0).length;
        const pnl   = data.reduce((s, t) => s + (parseFloat(t.profit_loss ?? t.pnl) || 0), 0);
        const winRate = data.length > 0 ? Math.round((wins / data.length) * 100) : 0;
        return { total: data.length, wins, losses: data.length - wins, pnl, winRate };
      };

      // set all trades
      setAllTrades(trades);

      // compute week and month slices
      const wk = trades.filter(t => {
        const d = new Date(t.created_at || t.date || t.createdAt || t.created_at);
        return d >= new Date(weekStart + 'T00:00:00');
      });
      const mn = trades.filter(t => {
        const d = new Date(t.created_at || t.date || t.createdAt || t.created_at);
        return d >= new Date(monthStart + 'T00:00:00');
      });

      setWeekStats(calcStats(wk));
      setMonthStats(calcStats(mn));

      if (eco) {
        const events = Array.isArray(eco) ? eco : (eco?.events ?? []);
        const high = events.find(e => (e.impact ?? '').toLowerCase() === 'high');
        if (high) setKeyEvent({ title: high.event ?? high.title ?? 'High Impact Event', time: high.time ?? '' });
      }

      setLoading(false);
    }).catch(err => {
      console.error('Dashboard fetch error:', err);
      setLoading(false);
    });
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const greeting  = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();
  const firstName  = user?.name?.split(' ')[0] ?? 'Trader';
  const dayOfYear  = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote      = QUOTES[dayOfYear % QUOTES.length];
  const sessions   = getCurrentSessions();
  const today      = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Edge calculations
  const edgeData = useMemo(() => {
    if (!allTrades || allTrades.length < 5) return null;
    const byKey = (fn) => {
      const map = {};
      allTrades.forEach(t => {
        const k = fn(t); if (!k) return;
        if (!map[k]) map[k] = { wins: 0, total: 0, pnl: 0 };
        map[k].total++;
        const pnl = parseFloat(t.pnl ?? 0);
        if (pnl > 0) map[k].wins++;
        map[k].pnl += pnl;
      });
      let best = null, bestRate = -1;
      Object.entries(map).forEach(([k, v]) => {
        if (v.total < 2) return;
        const rate = v.wins / v.total;
        if (rate > bestRate) { bestRate = rate; best = { key: k, rate: Math.round(rate * 100), total: v.total, pnl: v.pnl }; }
      });
      return best;
    };
    return {
      bestSession: byKey(t => t.session),
      bestPair:    byKey(t => t.pair),
      topEmotion:  byKey(t => t.emotion_before),
    };
  }, [allTrades]);

  // Streak calculation
  const streak = useMemo(() => {
    if (!allTrades || allTrades.length === 0) return null;
    const sorted = [...allTrades].sort((a, b) => new Date(b.date) - new Date(a.date));
    let count = 0;
    let type = null;
    for (const t of sorted) {
      const pnl = parseFloat(t.pnl ?? 0);
      const isWin = pnl > 0;
      if (type === null) { type = isWin ? 'win' : 'loss'; count = 1; }
      else if ((type === 'win') === isWin) count++;
      else break;
    }
    return { count, type };
  }, [allTrades]);

  // Recent 5 trades
  const recentTrades = useMemo(() => {
    if (!allTrades) return [];
    return [...allTrades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [allTrades]);

  // Monthly P&L sparkline (last 8 weeks)
  const pnlSparkline = useMemo(() => {
    if (!allTrades || allTrades.length === 0) return [];
    const weeks = {};
    allTrades.forEach(t => {
      const d = new Date(t.date);
      const week = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      weeks[week] = (weeks[week] ?? 0) + (parseFloat(t.pnl) || 0);
    });
    return Object.values(weeks).slice(-8);
  }, [allTrades]);

  // Colors
  const C = {
    bg:      theme.isDark ? '#0d0d0d' : '#f8f8f8',
    surface: theme.isDark ? '#111111' : '#ffffff',
    surface2:theme.isDark ? '#161616' : '#f3f3f3',
    border:  theme.isDark ? '#1e1e1e' : '#e8e8e8',
    border2: theme.isDark ? '#2a2a2a' : '#d8d8d8',
    text:    theme.isDark ? '#e8e8e8' : '#111111',
    muted:   theme.isDark ? '#555555' : '#888888',
    muted2:  theme.isDark ? '#333333' : '#aaaaaa',
    accent:  '#10b981',
    gold:    '#f59e0b',
    red:     '#ef4444',
  };

  const CARD = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.muted, fontSize: 13 }}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: C.bg, padding: '24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── ROW 1: GREETING + QUICK STATS ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'stretch' }}>

          {/* Greeting Card */}
          <div style={{ ...CARD, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
                  {greeting}, {firstName}
                </h1>
                <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{today}</p>
              </div>
              {/* Session pills */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {sessions.length > 0 ? sessions.map(s => (
                  <span key={s.name} style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 10px',
                    borderRadius: 99, color: s.color,
                    background: `${s.color}15`, border: `1px solid ${s.color}35`,
                    letterSpacing: '0.06em',
                  }}>
                    {s.name.toUpperCase()}
                  </span>
                )) : (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, color: C.muted, background: `${C.muted}15`, border: `1px solid ${C.muted}25`, letterSpacing: '0.06em' }}>
                    ALL CLOSED
                  </span>
                )}
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.accent, fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
              "{quote}"
            </p>
            {/* Key event */}
            {keyEvent && (
              <div style={{
                marginTop: 4, padding: '10px 14px', borderRadius: 8,
                background: `${C.gold}10`, border: `1px solid ${C.gold}25`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Calendar style={{ width: 13, height: 13, color: C.gold, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{keyEvent.title}</span>
                {keyEvent.time && <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{keyEvent.time}</span>}
              </div>
            )}
          </div>

          {/* Log Trade CTA */}
          <div style={{
            ...CARD,
            padding: '22px 24px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, minWidth: 200, textAlign: 'center',
            background: theme.isDark
              ? 'linear-gradient(135deg, #0d1f17 0%, #111 100%)'
              : 'linear-gradient(135deg, #f0faf6 0%, #fff 100%)',
            borderColor: `${C.accent}30`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${C.accent}18`, border: `1px solid ${C.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen style={{ width: 20, height: 20, color: C.accent }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>Log a Trade</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                {allTrades != null ? `${allTrades.length} trades logged` : 'Start journaling'}
              </div>
            </div>
            <button
              onClick={goToJournal}
              style={{
                width: '100%', padding: '10px 0',
                background: C.accent, color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Plus style={{ width: 14, height: 14 }} /> New Entry
            </button>
          </div>
        </div>

        {/* ── ROW 2: PERFORMANCE STATS ────────────────────────────────────── */}
        <div>
          <SectionHeader title="This Week" action="Full stats" onAction={() => goToView('journal')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard
              label="Trades"
              value={weekStats?.total ?? 0}
              sub={weekStats ? `${weekStats.wins}W · ${weekStats.losses}L` : 'No trades yet'}
              icon={BarChart2}
              color={C.text}
            />
            <StatCard
              label="Win Rate"
              value={weekStats?.total > 0 ? `${weekStats.winRate}%` : '—'}
              sub={weekStats?.total > 0 ? (weekStats.winRate >= 50 ? 'Above target' : 'Below target') : 'Log trades to track'}
              icon={Target}
              color={weekStats?.total > 0 ? (weekStats.winRate >= 50 ? C.accent : C.red) : C.muted}
            />
            <StatCard
              label="P&L"
              value={weekStats?.total > 0 ? `${weekStats.pnl >= 0 ? '+' : ''}$${Math.abs(weekStats.pnl).toFixed(0)}` : '—'}
              sub={monthStats?.total > 0 ? `Month: ${monthStats.pnl >= 0 ? '+' : ''}$${Math.abs(monthStats.pnl).toFixed(0)}` : 'This week'}
              icon={weekStats?.pnl >= 0 ? TrendingUp : TrendingDown}
              color={weekStats?.total > 0 ? (weekStats.pnl >= 0 ? C.accent : C.red) : C.muted}
            />
            <StatCard
              label="Streak"
              value={streak ? `${streak.count}` : '—'}
              sub={streak ? `${streak.type === 'win' ? 'Winning' : 'Losing'} streak` : 'No trades yet'}
              icon={Flame}
              color={streak ? (streak.type === 'win' ? C.accent : C.red) : C.muted}
            />
          </div>
        </div>

        {/* ── ROW 3: EDGE + RECENT TRADES ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>

          {/* Your Edge */}
          <div style={{ ...CARD, padding: 20 }}>
            <SectionHeader title="Your Edge" action="View all" onAction={() => goToView('journal')} />
            {edgeData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Best Session', value: edgeData.bestSession?.key, rate: edgeData.bestSession?.rate, icon: Clock, color: C.accent },
                  { label: 'Best Pair',    value: edgeData.bestPair?.key,    rate: edgeData.bestPair?.rate,    icon: Activity, color: C.gold },
                  { label: 'Top Emotion',  value: edgeData.topEmotion?.key,  rate: edgeData.topEmotion?.rate,  icon: Brain, color: '#a855f7' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: `${row.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <row.icon style={{ width: 13, height: 13, color: row.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{row.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 1 }}>
                          {row.value ?? '—'}
                        </div>
                      </div>
                    </div>
                    {row.rate != null && (
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: row.color,
                        background: `${row.color}15`, border: `1px solid ${row.color}30`,
                        padding: '3px 8px', borderRadius: 99,
                      }}>
                        {row.rate}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 10, padding: '24px 0', textAlign: 'center',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${C.accent}12`, border: `1px solid ${C.accent}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Award style={{ width: 20, height: 20, color: C.accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Unlock Your Edge</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                    Log {Math.max(0, 5 - (allTrades?.length ?? 0))} more trade{Math.max(0, 5 - (allTrades?.length ?? 0)) !== 1 ? 's' : ''} to reveal your patterns
                  </div>
                </div>
                {allTrades != null && allTrades.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{
                        width: 20, height: 4, borderRadius: 99,
                        background: i < allTrades.length ? C.accent : C.border,
                        transition: 'background 0.2s ease',
                      }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Trades */}
          <div style={{ ...CARD, padding: 20 }}>
            <SectionHeader title="Recent Trades" action="View all" onAction={() => goToView('journal')} />
            {recentTrades.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recentTrades.map((t, i) => {
                  const pnl     = parseFloat(t.pnl ?? 0);
                  const dir     = (t.direction ?? '').toUpperCase();
                  const outcome = (t.outcome ?? (pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : '')).toUpperCase();
                  const pillBase = {
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                  };
                  return (
                    <div
                      key={t.id ?? i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 0',
                        borderBottom: i < recentTrades.length - 1 ? `1px solid ${C.border}` : 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {/* Outcome indicator */}
                      <div style={{
                        width: 3, height: 32, borderRadius: 99, flexShrink: 0,
                        background: outcome === 'WIN' ? C.accent : outcome === 'LOSS' ? C.red : C.muted,
                      }} />

                      {/* Date */}
                      <span style={{ fontSize: 11, color: C.muted, width: 64, flexShrink: 0 }}>
                        {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>

                      {/* Pair */}
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 76, flexShrink: 0 }}>
                        {t.pair ?? '—'}
                      </span>

                      {/* Direction */}
                      {dir && (
                        <span style={{
                          ...pillBase,
                          background: dir === 'BUY' ? `${C.accent}15` : `${C.red}15`,
                          color: dir === 'BUY' ? C.accent : C.red,
                          border: `1px solid ${dir === 'BUY' ? C.accent : C.red}30`,
                        }}>
                          {dir}
                        </span>
                      )}

                      {/* Session */}
                      {t.session && (
                        <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
                          {t.session}
                        </span>
                      )}

                      {/* Strategy */}
                      {t.strategy && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: C.muted,
                          background: C.surface2, border: `1px solid ${C.border}`,
                          padding: '2px 7px', borderRadius: 99, flexShrink: 0,
                          maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.strategy}
                        </span>
                      )}

                      {/* P&L */}
                      <span style={{
                        marginLeft: 'auto', fontSize: 14, fontWeight: 700,
                        color: pnl > 0 ? C.accent : pnl < 0 ? C.red : C.muted,
                        flexShrink: 0,
                      }}>
                        {pnl !== 0 ? `${pnl > 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, padding: '32px 0', textAlign: 'center',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${C.accent}10`, border: `1px solid ${C.accent}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen style={{ width: 22, height: 22, color: C.accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>No trades logged yet</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                    Start journaling your trades to track your performance and unlock AI insights
                  </div>
                  <button
                    onClick={goToJournal}
                    style={{
                      padding: '9px 20px', background: C.accent, color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Plus style={{ width: 14, height: 14 }} /> Log Your First Trade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 4: QUICK ACCESS CARDS ────────────────────────────────────── */}
        <div>
          <SectionHeader title="Quick Access" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              {
                view: 'screenshot',
                icon: Activity,
                color: '#a855f7',
                title: 'Screenshot Analysis',
                desc: 'Upload your MT4/MT5 screenshot for AI analysis',
                badge: 'AI',
              },
              {
                view: 'intelligence',
                icon: Brain,
                color: '#3b82f6',
                title: 'AI Insights',
                desc: 'Macro surprise scores and economic intelligence',
                badge: 'AI',
              },
              {
                view: 'calendar',
                icon: Calendar,
                color: C.gold,
                title: 'Economic Calendar',
                desc: 'Track high impact economic events and releases',
                badge: null,
              },
            ].map(item => (
              <button
                key={item.view}
                onClick={() => goToView(item.view)}
                style={{
                  ...CARD,
                  padding: '16px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  textAlign: 'left', border: `1px solid ${C.border}`,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${item.color}40`;
                  e.currentTarget.style.background = `${item.color}08`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.surface;
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${item.color}15`, border: `1px solid ${item.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon style={{ width: 16, height: 16, color: item.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.title}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#a855f7',
                        background: '#a855f715', border: '1px solid #a855f730',
                        padding: '1px 5px', borderRadius: 99, letterSpacing: '0.05em',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: C.muted2, flexShrink: 0, marginTop: 2 }} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

