import { useState, useEffect, useRef } from 'react';
import { Lock, BarChart2, Check, AlertTriangle, TrendingUp, Info, Trophy, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useUpgrade } from '../contexts/UpgradeContext';
import { API_URL } from '../config/api';
import { usePlanGate } from '../hooks/usePlanGate';

// ── Session definitions (UTC hours) ─────────────────────────────────────────
const SESSIONS = [
  { key: 'Asian',    open: 0,  close: 9  },
  { key: 'London',   open: 8,  close: 17 },
  { key: 'New York', open: 13, close: 22 },
];

function sessionIsOpen(open, close, utcH) {
  if (open > close) return utcH >= open || utcH < close;
  return utcH >= open && utcH < close;
}

// ── Daily tips rotation (day-of-year % 14) ───────────────────────────────────
const TIPS = [
  'Cut losers quickly. Your data shows holding losers longer than 2× your average winner hurts your profit factor.',
  'Trade your best session only. Quality over quantity always wins.',
  'Check the macro score before every trade. Trading against macro increases risk.',
  'Log every trade — even the ones you want to forget. Patterns hide in losses.',
  'Your emotional state affects your win rate more than your strategy does.',
  'One bad trade is recoverable. Revenge trading after it often isn\'t.',
  'If you haven\'t journaled in 3 days, you\'re flying blind.',
  'Win rate means nothing without good risk:reward. Aim for 1:2 minimum.',
  'The best traders don\'t trade every day. Patience is a position.',
  'Review last week\'s trades every Monday before you place a new one.',
  'Your position size determines your survival. Never risk more than 2%.',
  'NFP week volatility is real. Reduce size or sit out entirely.',
  'London–NY overlap is the highest volume window. Plan around it.',
  'A trading plan written before market open beats instinct every time.',
];

function getDayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getGreeting(h) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatFullDate(d) {
  const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

function timeAgoStr(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Mini loading skeleton ────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 14, r = 6, theme }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      backgroundColor: theme.border,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Individual info block ─────────────────────────────────────────────────────
function Block({ title, children, bg, border, theme }) {
  return (
    <div style={{
      backgroundColor: bg ?? (theme.surface2 || theme.surface),
      border: `1px solid ${border ?? theme.border}`,
      borderRadius: 10,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.muted, marginBottom: 2 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DailyBrief() {
  const theme   = useTheme();
  const { user, token } = useAuth();
  const { getTimezoneInfo } = useTimezone();
  const { openUpgradeModal } = useUpgrade();

  const { isPro, isElite, isAdmin } = usePlanGate();
  const canSeeMacro = isPro || isElite || isAdmin;

  const [visible, setVisible] = useState(false);
  const [shown,   setShown]   = useState(false);  // mount → visible animation
  const mountRef  = useRef(false);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [macroScore, setMacroScore] = useState(null);     // { score, label } | 'locked' | 'error'
  const [trades,     setTrades]     = useState(null);     // raw trade array
  const [topNews,    setTopNews]    = useState(null);     // single news item
  const [loading,    setLoading]    = useState(true);

  // ── Derived ────────────────────────────────────────────────────────────────
  const now      = new Date();
  const hour     = now.getHours();
  const tzInfo   = getTimezoneInfo();
  const effOffset = tzInfo.type === 'local' ? -(now.getTimezoneOffset()) / 60 : tzInfo.offset;
  const utcH     = now.getUTCHours() + now.getUTCMinutes() / 60;

  const firstName = user?.name?.split(' ')[0] ?? 'Trader';
  const greeting  = getGreeting(hour);
  const dateStr   = formatFullDate(now);
  const tip       = TIPS[getDayOfYear(now) % TIPS.length];

  const DAY_NAMES  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName  = DAY_NAMES[now.getDay()];

  // ── localStorage dismiss gate ──────────────────────────────────────────────
  useEffect(() => {
    const key = `zynth_brief_${getTodayKey()}`;
    if (localStorage.getItem(key) === 'dismissed') return;
    setVisible(true);
    // Trigger fade-in on next tick
    requestAnimationFrame(() => setTimeout(() => setShown(true), 30));
  }, []);

  const dismiss = () => {
    setShown(false);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(`zynth_brief_${getTodayKey()}`, 'dismissed');
    }, 300);
  };

  // ── Fetch data (only when visible) ────────────────────────────────────────
  useEffect(() => {
    if (!visible || !token || mountRef.current) return;
    mountRef.current = true;

    const hdrs = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`${API_URL}/api/economic/macro-score`, { headers: hdrs }).then(r => r.json()),
      fetch(`${API_URL}/api/journal/trades?limit=200`, { headers: hdrs }).then(r => r.json()),
      fetch(`${API_URL}/api/news?limit=20`, { headers: hdrs }).then(r => r.json()),
    ]).then(([macro, journal, news]) => {
      // Macro score
      if (macro.status === 'fulfilled') {
        const d = macro.value;
        if (d?.score !== undefined) setMacroScore({ score: d.score, label: d.label });
        else if (d?.error === 'upgrade_required' || macro.value?.statusCode === 403) setMacroScore('locked');
        else setMacroScore('error');
      } else {
        setMacroScore('locked'); // treat network fail as locked (Pro endpoint)
      }

      // Trades
      if (journal.status === 'fulfilled' && journal.value?.data) {
        setTrades(journal.value.data);
      } else {
        setTrades([]);
      }

      // News — pick first high-impact item, else first item
      if (news.status === 'fulfilled') {
        const articles = Array.isArray(news.value) ? news.value : (news.value?.data ?? []);
        const high = articles.find(a => a.impactLevel === 'High') ?? articles[0] ?? null;
        setTopNews(high);
      }

      setLoading(false);
    });
  }, [visible, token]);

  if (!visible) return null;

  // ── Session analysis ────────────────────────────────────────────────────────
  let bestSession = null, bestRate = -1;
  const sessionStats = {};

  if (trades && trades.length > 0) {
    SESSIONS.forEach(s => {
      const st = trades.filter(t => t.session && t.session.toLowerCase().includes(s.key.toLowerCase().split(' ')[0]));
      const wins   = st.filter(t => t.outcome === 'win').length;
      const closed = st.filter(t => t.outcome === 'win' || t.outcome === 'loss').length;
      const rate   = closed >= 3 ? Math.round((wins / closed) * 100) : null;
      sessionStats[s.key] = { total: st.length, wins, closed, rate };
      if (rate !== null && rate > bestRate) {
        bestRate    = rate;
        bestSession = s.key;
      }
    });
  }

  // Current session open/about to open timing
  let sessionStatusText = '';
  if (bestSession) {
    const sInfo = SESSIONS.find(s => s.key === bestSession);
    if (sInfo) {
      const isOpen = sessionIsOpen(sInfo.open, sInfo.close, utcH);
      if (isOpen) {
        sessionStatusText = `${bestSession} is LIVE now`;
      } else {
        // minutes until open
        const nowMins  = utcH * 60;
        const openMins = sInfo.open * 60;
        let diffMins = openMins - nowMins;
        if (diffMins < 0) diffMins += 24 * 60;
        const h = Math.floor(diffMins / 60);
        const m = Math.round(diffMins % 60);
        const localOpenH = ((sInfo.open + effOffset) % 24 + 24) % 24;
        const lh = Math.floor(localOpenH);
        const lm = Math.round((localOpenH - lh) * 60);
        const tzAbbr = tzInfo.type === 'local' ? 'Local' : tzInfo.id.toUpperCase();
        const pad = n => String(n).padStart(2, '0');
        sessionStatusText = `Opens in ${h ? `${h}h ` : ''}${pad(m)}m · ${pad(lh)}:${pad(lm)} ${tzAbbr}`;
      }
    }
  }

  // ── Day-of-week analysis ────────────────────────────────────────────────────
  let dowWins = 0, dowClosed = 0;
  if (trades) {
    trades.forEach(t => {
      if (!t.created_at) return;
      const d = new Date(t.created_at);
      if (DAY_NAMES[d.getDay()] !== todayName) return;
      if (t.outcome === 'win')  dowWins++;
      if (t.outcome === 'win' || t.outcome === 'loss') dowClosed++;
    });
  }
  const dowRate = dowClosed >= 5 ? Math.round((dowWins / dowClosed) * 100) : null;

  // ── Macro score coloring ────────────────────────────────────────────────────
  let macroLabel = '', macroBullet = null, macroColor = theme.muted;
  if (macroScore && macroScore !== 'locked' && macroScore !== 'error') {
    const s = macroScore.score;
    if (s > 2)       { macroLabel = 'Bullish for Gold'; macroBullet = <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'#22c55e',verticalAlign:'middle',marginRight:3}}/>; macroColor = '#22c55e'; }
    else if (s < -2) { macroLabel = 'Bearish for Gold'; macroBullet = <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'#ef4444',verticalAlign:'middle',marginRight:3}}/>; macroColor = '#ef4444'; }
    else             { macroLabel = 'Neutral';           macroBullet = <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'#f59e0b',verticalAlign:'middle',marginRight:3}}/>; macroColor = '#f59e0b'; }
  }

  // ── Inline keyframe style ────────────────────────────────────────────────────
  const fadeStyle = {
    opacity:    shown ? 1 : 0,
    transform:  shown ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  };

  return (
    <div style={{ marginBottom: 20, ...fadeStyle }}>
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        padding: '12px 20px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss daily brief"
          style={{
            position: 'absolute', top: 10, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.muted, fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 6,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.border; }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'none'; }}
        >
          ×
        </button>

        {/* Greeting */}
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
            {greeting}, {firstName}
          </span>
          <span style={{ fontSize: 12, color: theme.muted, marginLeft: 10 }}>{dateStr}</span>
        </div>

        {/* Macro Score */}
        <div style={{ textAlign: 'right', paddingRight: 28 }}>
          {!canSeeMacro ? (
            <button
              onClick={() => openUpgradeModal({
                requiredPlan: 'pro',
                reason: 'Macro score requires a Pro or Elite plan.',
              })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Lock size={13} style={{ color: theme.muted }} />
              <span style={{ fontSize: 12, color: theme.muted }}>Macro score</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>Upgrade →</span>
            </button>
          ) : loading ? (
            <Skeleton theme={theme} h={20} w={80} />
          ) : macroScore && macroScore !== 'locked' && macroScore !== 'error' ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: macroColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {macroScore.score > 0 ? '+' : ''}{macroScore.score.toFixed(1)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: macroColor }}>{macroLabel}</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: theme.muted }}>Score unavailable</span>
          )}
          {canSeeMacro && !loading && macroScore && macroScore !== 'locked' && macroScore !== 'error' && (
            <div style={{ fontSize: 10, color: theme.muted, marginTop: 1 }}>macro index · 10 indicators</div>
          )}
        </div>
      </div>
    </div>
  );
}

