import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCcw, AlertCircle } from 'lucide-react';
import { API_URL } from '../config/api';
import { useUpgrade } from '../contexts/UpgradeContext';
import { usePlanGate } from '../hooks/usePlanGate';
import { getAuthToken } from '../utils/authStorage';
import NewAiInsightsDashboard from './ai-insights/NewAiInsightsDashboard';
import AIInsightsDashboard from './ai-insights/AIInsightsDashboard';

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
  const tickColor = isDark ? '#9ca3af' : '#6b7280';

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
        backgroundColor: isDark ? '#1f2937' : '#fff',
        titleColor: isDark ? '#f9fafb' : '#0a0a0a',
        bodyColor:  isDark ? '#9ca3af' : '#6b7280',
        borderColor: isDark ? '#374151' : '#e4e4e4',
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
  const { openUpgradeModal } = useUpgrade();
  const { isPro, isElite, isAdmin } = usePlanGate();
  const [macroData,  setMacroData]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const canAccess = isPro || isElite || isAdmin;

  const loadData = useCallback(async () => {
    if (!canAccess) return;
    try {
      setError(null);
      const token = getAuthToken();
      if (!token) { setError('Please log in'); setLoading(false); return; }
      const res = await fetch(`${API_URL}/api/economic/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Request failed (${res.status})${body ? `: ${body}` : ''}`);
      }
      setMacroData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canAccess]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const token = getAuthToken();
      await fetch(`${API_URL}/api/economic/refresh`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLoading(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!canAccess) { setLoading(false); return; }
    loadData();
    const id = setInterval(loadData, 300000);
    return () => clearInterval(id);
  }, [canAccess, loadData]);

  // ── Pro gate ─────────────────────────────────────────────────────────────
  if (!canAccess) return (
    <div className="flex flex-col items-center justify-center min-h-[520px] px-6 py-16 text-center relative
      bg-gradient-to-br from-blue-50 to-indigo-50
      dark:from-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20
          bg-gradient-to-br from-blue-400 to-emerald-400 blur-3xl" />
      </div>
      <PaywallPricingBlock onUpgrade={openUpgradeModal} />
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="p-6">
      <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-500">Failed to load economic intelligence</p>
          <p className="mt-0.5 text-xs text-slate-500">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-16">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Economic Intelligence
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Macroeconomic surprise indicators for gold (XAUUSD)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
          >
            <RefreshCcw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Dashboard ───────────────────────────────────────────────── */}
        <AIInsightsDashboard macroData={loading ? null : macroData} />

      </div>
    </div>
  );
}

