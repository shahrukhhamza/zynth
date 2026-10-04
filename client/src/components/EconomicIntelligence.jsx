import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCcw, AlertCircle, Zap, TrendingUp, BarChart2, Activity, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config/api';
import { useUpgrade } from '../contexts/UpgradeContext';
import { usePlanGate } from '../hooks/usePlanGate';
import { getAuthToken } from '../utils/authStorage';
import AIInsightsDashboard from './ai-insights/AIInsightsDashboard';

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

const PAYWALL_FEATURES = [
  { icon: TrendingUp,  text: 'Macro surprise scores & trend shifts' },
  { icon: BarChart2,   text: 'Event-to-trade correlation engine' },
  { icon: Activity,    text: 'Real-time economic signal alerts' },
];

function PaywallPricingBlock({ onUpgrade }) {
  const [hovered, setHovered] = useState(false);

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
      position: 'relative', zIndex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', maxWidth: 520, width: '100%',
      margin: '0 auto', padding: '0 24px',
    }}>

      {/* Icon badge */}
      <div style={{
        position: 'relative', marginBottom: 28,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Pulse ring */}
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.25)',
          animation: 'paywall-ring 2.4s ease-in-out infinite',
        }} />
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
        }}>
          <Brain size={28} color="#a5b4fc" />
        </div>
        {/* Lock badge */}
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
          border: '2px solid var(--z-modal)',
        }}>
          <Lock size={10} color="#fff" />
        </div>
      </div>

      {/* Badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 12px', borderRadius: 99, marginBottom: 16,
        background: 'var(--z-badge-bg)',
        border: '1px solid var(--z-badge-bdr)',
        color: 'var(--z-badge-text)',
      }}>
        <Zap size={10} />
        Pro Feature
      </span>

      {/* Headline */}
      <h2 style={{
        fontSize: 28, fontWeight: 900, lineHeight: 1.25,
        margin: '0 0 12px',
        background: 'var(--z-h-grad)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        AI Insights is a Pro feature
      </h2>

      {/* Subtext */}
      <p style={{
        fontSize: 14, lineHeight: 1.7, color: 'var(--z-muted)',
        margin: '0 0 28px', maxWidth: 380,
      }}>
        Get macro surprise scores, trend shifts, and event-to-trade correlation — all in one view.
      </p>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, marginBottom: 32 }}>
        {PAYWALL_FEATURES.map(({ icon: Icon, text }, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px', borderRadius: 12, textAlign: 'left',
            background: 'var(--z-surface)',
            border: '1px solid var(--z-border-sm)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <Icon size={15} color="#CA8A04" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-text2)' }}>{text}</span>
            <CheckCircle2 size={14} color="#34d399" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={handleUpgrade}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', maxWidth: 360, padding: '15px 32px',
          borderRadius: 14, border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 800, color: '#fff',
          background: hovered
            ? 'linear-gradient(135deg, #A16207, #7c3aed)'
            : 'linear-gradient(135deg, #CA8A04, #8b5cf6)',
          boxShadow: hovered
            ? '0 8px 32px rgba(99,102,241,0.55)'
            : '0 4px 20px rgba(99,102,241,0.38)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.18s ease',
          letterSpacing: '0.01em',
        }}
      >
        <Zap size={16} />
        Unlock AI Insights
        <ArrowRight size={15} style={{ opacity: 0.8 }} />
      </button>

      {/* Trust line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={12} color="#34d399" /> From $8.90/mo
        </span>
        <span style={{ fontSize: 12, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={12} color="#34d399" /> Cancel anytime
        </span>
        <span style={{ fontSize: 12, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={12} color="#34d399" /> 2,000+ traders upgraded
        </span>
      </div>

      <style>{`
        @keyframes paywall-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EconomicIntelligence() {
  useEffect(() => { try { localStorage.setItem('zynth_seen_insights', '1'); } catch { /* ignore */ } }, []);
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
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950" style={{ position: 'relative', minHeight: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 48 }}>
      {/* Ambient glows — pointer-events:none so they never block clicks */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)', filter: 'blur(32px)' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(202,138,4,0.1) 0%, transparent 70%)', filter: 'blur(20px)' }} />
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
          <p className="mt-0.5 text-xs text-zinc-500">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-16 md:px-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border" style={{ background: 'rgba(202,138,4,0.12)', borderColor: 'rgba(202,138,4,0.3)', color: '#CA8A04' }}>
              <Brain className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display m-0 text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white">
                Economic Intelligence
              </h1>
              <p className="m-0 mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                What the macro data says about gold and the majors, and what to do about it.
              </p>
            </div>
          </div>
          <button
            data-tour="insights-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#1a1203] transition-all duration-150 hover:translate-y-[1px] active:translate-y-[2px] disabled:opacity-60"
            style={{ background: "linear-gradient(180deg,#E0A010,#C98A06)", boxShadow: "0 3px 0 #8a5a05" }}
          >
            <RefreshCcw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh data
          </button>
        </div>

        {/* ── Dashboard ───────────────────────────────────────────────── */}
        <AIInsightsDashboard macroData={loading ? null : macroData} />

      </div>
    </div>
  );
}

