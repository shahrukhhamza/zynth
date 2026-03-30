import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Activity, AlertCircle,
  RefreshCcw, Brain, ChevronDown, ChevronUp, Minus,
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { useUpgrade } from '../contexts/UpgradeContext';
import { usePlanGate } from '../hooks/usePlanGate';
import { getAuthToken } from '../utils/authStorage';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GROUPS = [
  { label: 'Labor Market',      accent: '#3b82f6', keys: ['nfp', 'unemployment', 'joblessClaims'] },
  { label: 'Inflation',         accent: '#f59e0b', keys: ['cpi', 'corePCE'] },
  { label: 'Monetary Policy',   accent: '#0ea5e9', keys: ['fedRate'] },
  { label: 'Growth & Activity', accent: '#10b981', keys: ['gdp', 'retailSales', 'ismMfg'] },
  { label: 'Sentiment',         accent: '#ec4899', keys: ['consumerConf'] },
];

function impactColors(color) {
  if (color === 'green') return { border: '#10b981', text: '#10b981', bg: 'rgba(16,185,129,0.08)', badge: 'rgba(16,185,129,0.12)' };
  if (color === 'red')   return { border: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.06)',  badge: 'rgba(239,68,68,0.12)'  };
  return                        { border: '#374151', text: '#6b7280', bg: 'rgba(55,65,81,0.04)',   badge: 'rgba(55,65,81,0.10)'   };
}

function fmt(v, unit) {
  if (v == null || v === '') return '—';
  return `${v}${unit ?? ''}`;
}

// ── Indicator Card ────────────────────────────────────────────────────────────
function IndicatorCard({ data, accentColor, D }) {
  const [expanded, setExpanded] = useState(false);
  const ic = impactColors(data.impactColor);
  const surpriseColor = data.surprise > 0 ? '#10b981' : data.surprise < 0 ? '#ef4444' : D.textSub;

  return (
    <div style={{
      background: D.cardBg,
      border: `1px solid ${D.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.15s ease',
    }}>
      {/* Top color bar */}
      <div style={{ height: 3, background: ic.border }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0, lineHeight: 1.3 }}>
              {data.indicator}
            </h3>
            {data.description && (
              <p style={{ fontSize: 11, color: D.textSub, margin: '4px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {data.description}
              </p>
            )}
          </div>
          {data.latestDate && (
            <span style={{ fontSize: 10, fontWeight: 600, color: D.textSub, background: D.cardBg2, border: `1px solid ${D.border}`, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>
              {data.latestDate}
            </span>
          )}
        </div>

        {/* Data grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Actual',   value: fmt(data.actual,   data.unit), color: D.text,        size: 20 },
            { label: 'Forecast', value: fmt(data.forecast, data.unit), color: accentColor,   size: 16 },
            { label: 'Surprise', value: data.surprise != null ? `${data.surprise > 0 ? '+' : ''}${fmt(data.surprise, data.unit)}` : '—', color: surpriseColor, size: 18 },
          ].map(col => (
            <div key={col.label} style={{ background: D.cardBg2, border: `1px solid ${D.border}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                {col.label}
              </div>
              <div style={{ fontSize: col.size, fontWeight: 800, color: col.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {col.value}
              </div>
            </div>
          ))}
        </div>

        {/* Impact badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            flex: 1, padding: '7px 12px', borderRadius: 8, textAlign: 'center',
            background: ic.badge, border: `1px solid ${ic.border}40`,
            fontSize: 11, fontWeight: 700, color: ic.text, letterSpacing: '0.04em',
          }}>
            {data.impact || 'Neutral for Gold'}
          </div>
          {data.historicalData?.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ marginLeft: 8, width: 30, height: 30, borderRadius: 7, background: D.cardBg2, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: D.textSub, flexShrink: 0 }}
            >
              {expanded
                ? <ChevronUp style={{ width: 13, height: 13 }} />
                : <ChevronDown style={{ width: 13, height: 13 }} />}
            </button>
          )}
        </div>

        {/* Historical chart (expandable) */}
        {expanded && data.historicalData?.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${D.border}` }}>
            <HistoricalChart
              data={data.historicalData}
              code={data.code}
              unit={data.unit}
              isDark={D.isDark}
              color={accentColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Historical Chart ──────────────────────────────────────────────────────────
function HistoricalChart({ data, code, unit, isDark, color }) {
  if (!data?.length) return null;
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? theme.muted : theme.textMuted;

  const chartData = {
    labels: data.map(d => d.date?.slice(0, 7) ?? ''),
    datasets: [{
      data: data.map(d => d.value),
      borderColor: color,
      backgroundColor: color + '15',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
      tension: 0.3,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? theme.surface2 : '#fff',
        titleColor: isDark ? theme.text : '#0a0a0a',
        bodyColor:  isDark ? theme.muted : theme.textMuted,
        borderColor: isDark ? theme.border : '#e4e4e4',
        borderWidth: 1,
        padding: 10,
        callbacks: { label: ctx => ` ${ctx.parsed.y}${unit ?? ''}` },
      },
    },
    scales: {
      x: { ticks: { color: tickColor, maxRotation: 45, minRotation: 45, font: { size: 9 } }, grid: { color: gridColor }, border: { color: 'transparent' } },
      y: { ticks: { color: tickColor, font: { size: 9 }, callback: v => `${v}${unit ?? ''}` }, grid: { color: gridColor }, border: { color: 'transparent' } },
    },
  };

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, margin: '0 0 10px' }}>
        {code} — Last {data.length} Releases
      </p>
      <div style={{ height: 160 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

// ── Macro Score Widget ────────────────────────────────────────────────────────
function MacroScoreWidget({ macroScore, D }) {
  if (!macroScore) return (
    <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 12, padding: '24px' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ flex: 1, minWidth: 120, height: 60, background: D.cardBg2, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );

  const { score, label, contributors = [], updatedAt } = macroScore;
  const scoreColor  = score > 0 ? '#10b981' : score < 0 ? '#ef4444' : D.textSub;
  const fillPct     = ((score + 10) / 20) * 100;
  const barLeft     = score >= 0 ? 50 : fillPct;
  const barWidth    = Math.abs(fillPct - 50);
  const minutesAgo  = updatedAt != null ? Math.floor((Date.now() - updatedAt) / 60000) : null;
  const top5        = contributors.slice(0, 5);

  return (
    <div style={{
      background: D.cardBg,
      border: `1px solid ${scoreColor}35`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{ height: 3, background: scoreColor }} />

      <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>

        {/* Left: score */}
        <div style={{ padding: '24px 28px', borderRight: `1px solid ${D.border}`, borderBottom: 'none', minWidth: '100%', flex: '0 0 100%' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: scoreColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Macro Surprise Score
          </div>
          <div style={{ fontSize: 11, color: D.textSub, marginBottom: 20 }}>Real-time gold impact score</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: '-0.04em' }}>
              {score > 0 ? '+' : ''}{score}
            </span>
            <span style={{ fontSize: 18, fontWeight: 600, color: D.textSub }}>/ 10</span>
          </div>

          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 99,
            background: `${scoreColor}18`, color: scoreColor,
            border: `1px solid ${scoreColor}35`,
          }}>
            {label}
          </span>

          {/* Progress bar */}
          <div style={{ marginTop: 24 }}>
            <div style={{ position: 'relative', height: 8, background: D.cardBg2, border: `1px solid ${D.border}`, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, left: '50%', width: 2, transform: 'translateX(-50%)', background: D.border }} />
              {barWidth > 0 && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${barLeft}%`, width: `${barWidth}%`, background: scoreColor, borderRadius: 99 }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>−10</span>
              <span style={{ fontSize: 10, color: D.textSub }}>Neutral</span>
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>+10</span>
            </div>
          </div>

          {minutesAgo !== null && (
            <p style={{ fontSize: 11, color: D.textSub, marginTop: 16, margin: '16px 0 0' }}>
              Updated {minutesAgo === 0 ? 'just now' : `${minutesAgo} min ago`}
            </p>
          )}
        </div>

        {/* Right: contributors */}
        <div style={{ padding: '24px 28px', flex: 1, minWidth: '100%' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
            Top Drivers
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {top5.map(c => {
              const cc        = c.contribution > 0 ? '#10b981' : c.contribution < 0 ? '#ef4444' : D.textSub;
              const miniPct   = Math.min(50, (Math.abs(c.contribution) / 20) * 100);
              const miniLeft  = c.contribution >= 0 ? 50 : 50 - miniPct;
              const badgeText = c.impact?.includes('Bull') ? 'Bull' : c.impact?.includes('Bear') ? 'Bear' : 'Neut';

              return (
                <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: D.text, width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.code}
                  </span>

                  {/* Mini bar */}
                  <div style={{ flex: 1, position: 'relative', height: 6, maxWidth: 180 }}>
                    <div style={{ position: 'absolute', inset: 0, background: D.cardBg2, border: `1px solid ${D.border}`, borderRadius: 99 }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: D.border }} />
                    {miniPct > 0 && (
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${miniLeft}%`, width: `${miniPct}%`, background: cc, borderRadius: 99, opacity: 0.85 }} />
                    )}
                  </div>

                  <span style={{ fontSize: 12, fontWeight: 800, color: cc, width: 40, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {c.contribution > 0 ? '+' : ''}{c.contribution}
                  </span>

                  <span style={{ fontSize: 10, fontWeight: 700, color: cc, background: `${cc}15`, border: `1px solid ${cc}28`, padding: '2px 7px', borderRadius: 99, flexShrink: 0, letterSpacing: '0.04em' }}>
                    {badgeText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaywallPricingBlock({ onUpgrade }) {
  const handleUpgrade = () => {
    onUpgrade({
      requiredPlan: 'pro',
      feature: 'Economic Intelligence',
      headline: 'Unlock AI-Powered Insights',
      reason: 'Economic Intelligence is available on Pro and Elite plans.',
    });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', maxWidth: 420, margin: '0 auto',
    }}>

      {/* Icon */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 48, height: 48, borderRadius: 14, marginBottom: 20,
        background: 'rgba(59,130,246,0.14)',
        border: '1px solid rgba(59,130,246,0.3)',
      }}>
        <Brain size={20} color="#60a5fa" />
      </div>

      {/* Headline */}
      <h2 style={{
        fontSize: 22, fontWeight: 800, lineHeight: 1.3,
        color: 'var(--z-text)', margin: '0 0 10px',
      }}>
        AI Insights is a Pro feature
      </h2>

      {/* Benefit */}
      <p style={{
        fontSize: 14, lineHeight: 1.65, color: 'var(--z-muted)',
        margin: '0 0 28px', maxWidth: 340,
      }}>
        Get macro surprise scores, trend shifts, and event-to-trade correlation — all in one view.
      </p>

      {/* CTA */}
      <button
        onClick={handleUpgrade}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '12px 32px', borderRadius: 11, border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          boxShadow: '0 4px 18px rgba(59,130,246,0.35)',
          transition: 'opacity 0.15s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Unlock full access &rarr;
      </button>

      {/* Pricing hint + social proof */}
      <p style={{ fontSize: 12, color: 'var(--z-muted)', margin: '14px 0 0' }}>
        From $9/mo &middot; Most users upgrade here
      </p>

    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EconomicIntelligence() {
  const theme = useTheme();
  const { openUpgradeModal } = useUpgrade();
  const { isPro, isElite, isAdmin } = usePlanGate();
  const [dashboard,  setDashboard]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [macroScore, setMacroScore] = useState(null);

  const canAccess = isPro || isElite || isAdmin;

  // ── Design tokens ────────────────────────────────────────────────────────
  const D = {
    isDark:   theme.isDark,
    pageBg:   theme.isDark ? theme.bg        : '#f1f3f6',
    cardBg:   theme.isDark ? theme.surface    : '#ffffff',
    cardBg2:  theme.isDark ? theme.surface2   : '#f7f8fa',
    border:   theme.isDark ? theme.border     : '#e5e8ed',
    text:     theme.isDark ? theme.text       : '#0d1117',
    textSub:  theme.isDark ? '#8892a4'        : '#526174',
    textMute: theme.isDark ? 'rgba(255,255,255,0.08)' : '#8b97a8',
    accent:   '#3b82f6',
  };
  const disclaimerBg = theme.isDark ? 'rgba(245,158,11,0.05)' : '#fff7ed';
  const disclaimerBorder = theme.isDark ? 'rgba(245,158,11,0.15)' : '#fdba74';
  const disclaimerText = theme.isDark ? 'rgba(251,191,36,0.72)' : '#9a3412';
  const disclaimerLabel = theme.isDark ? 'rgba(251,191,36,0.92)' : '#c2410c';

  const loadDashboard = async () => {
    if (!canAccess) return;
    try {
      setError(null);
      const token = getAuthToken();
      if (!token) { setError('Please log in'); setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, scoreRes] = await Promise.all([
        fetch(`${API_URL}/api/economic/dashboard`, { headers }),
        fetch(`${API_URL}/api/economic/macro-score`, { headers }),
      ]);
      if (!dashRes.ok) throw new Error('Failed to load economic intelligence');
      setDashboard(await dashRes.json());
      if (scoreRes.ok) setMacroScore(await scoreRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const token = getAuthToken();
      await fetch(`${API_URL}/api/economic/refresh`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLoading(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!canAccess) { setLoading(false); return; }
    loadDashboard();
    const id = setInterval(loadDashboard, 300000);
    return () => clearInterval(id);
  }, [canAccess]);

  // ── Pro gate ─────────────────────────────────────────────────────────────
  if (!canAccess) return (
    <div className="flex flex-col items-center justify-center min-h-[520px] px-6 py-16 text-center relative
      bg-gradient-to-br from-blue-50 to-indigo-50
      dark:from-slate-900 dark:to-slate-800">

      {/* Glow blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20
          bg-gradient-to-br from-blue-400 to-emerald-400 blur-3xl" />
      </div>

      <PaywallPricingBlock onUpgrade={openUpgradeModal} />
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.pageBg, minHeight: 320 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${D.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: D.textSub, margin: 0 }}>Loading economic data…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ flex: 1, padding: 24, background: D.pageBg }}>
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', borderRadius: 12, padding: '18px 22px', display: 'flex', gap: 12 }}>
        <AlertCircle style={{ width: 18, height: 18, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', margin: '0 0 4px' }}>Failed to load economic intelligence</p>
          <p style={{ fontSize: 13, color: D.textSub, margin: 0 }}>{error}</p>
        </div>
      </div>
    </div>
  );

  if (!dashboard || dashboard.error) return null;

  const { indicators, overallSentiment, sentimentColor, summary, aiAnalysis } = dashboard;
  const sc = impactColors(sentimentColor);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: D.pageBg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 56px' }}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
              Economic Intelligence
            </h1>
            <p style={{ fontSize: 13, color: D.textSub, margin: '4px 0 0' }}>
              Macroeconomic surprise indicators for gold (XAUUSD)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: D.accent, color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.15s',
              boxShadow: `0 4px 14px ${D.accent}35`,
            }}
          >
            <RefreshCcw style={{ width: 14, height: 14, animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ── Macro Score ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <MacroScoreWidget macroScore={macroScore} D={D} />
        </div>

        {/* ── Overall Sentiment ─────────────────────────────────────────── */}
        <div style={{
          background: D.cardBg, border: `1px solid ${sc.border}40`,
          borderRadius: 12, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, marginBottom: 20,
          borderLeft: `4px solid ${sc.border}`,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: sc.text, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              Overall Market Sentiment
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: sc.text, letterSpacing: '-0.03em', marginBottom: 10 }}>
              {overallSentiment}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: `${summary.bullishIndicators} Bullish`, color: '#10b981', Icon: TrendingUp  },
                { label: `${summary.bearishIndicators} Bearish`, color: '#ef4444', Icon: TrendingDown },
                { label: `${summary.neutralIndicators} Neutral`, color: D.textSub,  Icon: Minus        },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <s.Icon style={{ width: 14, height: 14, color: s.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
                </div>
              ))}
              <span style={{ fontSize: 13, color: D.textSub }}>/ {summary.totalIndicators ?? 10} indicators</span>
            </div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `${sc.border}12`,
            border: `1px solid ${sc.border}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {sentimentColor === 'green'
              ? <TrendingUp  style={{ width: 30, height: 30, color: sc.border }} />
              : sentimentColor === 'red'
              ? <TrendingDown style={{ width: 30, height: 30, color: sc.border }} />
              : <Activity    style={{ width: 30, height: 30, color: D.textSub }} />}
          </div>
        </div>

        {/* ── AI Analysis ───────────────────────────────────────────────── */}
        {aiAnalysis && !aiAnalysis.error && (
          <div style={{
            background: D.cardBg,
            border: `1px solid #0ea5e930`,
            borderLeft: '4px solid #0ea5e9',
            borderRadius: 12, padding: '18px 22px',
            display: 'flex', gap: 14, marginBottom: 20,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0ea5e915', border: '1px solid #0ea5e925', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain style={{ width: 16, height: 16, color: '#0ea5e9' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                AI Macro Analysis
              </div>
              <p style={{ fontSize: 13, color: D.text, margin: 0, lineHeight: 1.7 }}>{aiAnalysis.analysis}</p>
            </div>
          </div>
        )}

        {/* ── Indicator Groups ──────────────────────────────────────────── */}
        {GROUPS.map(group => {
          const items = group.keys
            .map(k => ({ key: k, data: indicators[k] }))
            .filter(({ data }) => data && !data.error);
          if (!items.length) return null;

          return (
            <div key={group.label} style={{ marginBottom: 28 }}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: group.accent, flexShrink: 0 }} />
                <h3 style={{ fontSize: 11, fontWeight: 700, color: group.accent, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  {group.label}
                </h3>
                <div style={{ flex: 1, height: 1, background: `${group.accent}25` }} />
                <span style={{ fontSize: 11, color: D.textSub }}>{items.length} indicator{items.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {items.map(({ key, data }) => (
                  <IndicatorCard key={key} data={data} accentColor={group.accent} D={D} />
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div style={{
          background: disclaimerBg,
          border: `1px solid ${disclaimerBorder}`,
          borderRadius: 10, padding: '12px 16px', marginTop: 8,
        }}>
          <p style={{ fontSize: 11, color: disclaimerText, lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
            <strong style={{ color: disclaimerLabel }}>Disclaimer:</strong> Economic data and AI analysis are for informational purposes only and do not constitute financial or investment advice. Always verify data with primary sources before making trading decisions.
          </p>
        </div>

      </div>
    </div>
  );
}

