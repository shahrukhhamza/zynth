/**
 * AnalyticsDashboard — conversion intelligence panel for the admin dashboard.
 *
 * Sections:
 *   1. KPI cards row
 *   2. Conversion funnel (horizontal steps with drop-through %)
 *   3. Drop-off analysis cards
 *   4. Top upgrade triggers (ranked source bars)
 *   5. Auto-generated insight bullets
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPlus, BookOpen, Zap, AlertTriangle, Eye,
  MousePointerClick, ShoppingCart, TrendingUp, RefreshCw,
  ArrowRight, Lightbulb, Target,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import ErrorBar from './ErrorBar';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 32, r = 8 }) {
  const theme = useTheme();
  return (
    <div style={{
      height: h, borderRadius: r,
      background: theme.isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, Icon, loading, sub }) {
  const theme = useTheme();
  return (
    <div style={{
      borderRadius: 12, padding: '12px 14px',
      background: theme.isDark ? theme.surface : '#ffffff',
      border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
      boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.05)',
      display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0,
      transition: 'box-shadow 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: theme.isDark ? theme.muted : '#64748b' }}>
          {label}
        </span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      {loading ? <Skeleton h={28} /> : <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</div>}
      {sub && !loading && <div style={{ fontSize: 10, color: theme.muted }}>{sub}</div>}
    </div>
  );
}

// ── Funnel step ───────────────────────────────────────────────────────────────

function FunnelStep({ label, count, pct, color, relativeWidth, isFirst, loading, theme }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (!barRef.current || loading) return;
    barRef.current.style.width = '0%';
    const t = setTimeout(() => { if (barRef.current) barRef.current.style.width = `${relativeWidth}%`; }, 80);
    return () => clearTimeout(t);
  }, [relativeWidth, loading]);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted }}>{label}</span>
        {loading ? <Skeleton h={24} /> : <span style={{ fontSize: 20, fontWeight: 800, color }}>{count.toLocaleString()}</span>}
      </div>
      <div style={{ height: 6, borderRadius: 3, background: theme.isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', overflow: 'hidden' }}>
        <div ref={barRef} style={{ height: '100%', borderRadius: 3, background: color, transition: 'width 0.65s cubic-bezier(0.4,0,0.2,1)', width: '0%' }} />
      </div>
      {!isFirst && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {loading ? <Skeleton h={14} r={4} /> : (
            <>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
              <span style={{ fontSize: 10, color: theme.muted }}>from prev</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drop-off card ─────────────────────────────────────────────────────────────

function DropoffCard({ stage, count, label, hint, color, loading, theme }) {
  return (
    <div style={{
      borderRadius: 11, padding: '12px 14px',
      background: theme.isDark ? `${color}0a` : `${color}08`,
      border: `1px solid ${color}25`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted }}>{stage}</div>
      {loading ? <Skeleton h={28} /> : <div style={{ fontSize: 22, fontWeight: 800, color }}>{count >= 0 ? count.toLocaleString() : '—'}</div>}
      <div style={{ fontSize: 11, color: theme.muted, lineHeight: 1.4 }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color, fontWeight: 600 }}>{hint}</div>}
    </div>
  );
}

// ── Trigger bar ───────────────────────────────────────────────────────────────

const TRIGGER_COLORS = ['#2563eb', '#059669', '#3b82f6', '#10b981', '#1d4ed8'];
const TRIGGER_LABELS = {
  ai_limit: 'AI limit hit', journal_limit: 'Journal limit hit',
  advancedAnalytics: 'Advanced analytics gate', behavioralInsights: 'Behavioral insights gate',
  aiReports: 'AI reports gate', tradingDna: 'Trading DNA gate', unknown: 'Unknown source',
};

function TriggerBar({ source, count, total, index, theme }) {
  const pct    = total > 0 ? (count / total) * 100 : 0;
  const color  = TRIGGER_COLORS[index % TRIGGER_COLORS.length];
  const barRef = useRef(null);

  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = '0%';
    const t = setTimeout(() => { if (barRef.current) barRef.current.style.width = `${pct}%`; }, 80 + index * 60);
    return () => clearTimeout(t);
  }, [pct, index]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{TRIGGER_LABELS[source] ?? source}</span>
        <span style={{ fontSize: 11, color: theme.muted, flexShrink: 0, marginLeft: 8 }}>{count.toLocaleString()} ({Math.round(pct)}%)</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: theme.isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', overflow: 'hidden' }}>
        <div ref={barRef} style={{ height: '100%', borderRadius: 3, background: color, transition: `width 0.65s cubic-bezier(0.4,0,0.2,1) ${index * 60}ms`, width: '0%' }} />
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, theme, extra }) {
  return (
    <div style={{
      borderRadius: 14, padding: '16px 18px',
      background: theme.isDark ? theme.surface : '#ffffff',
      border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
      boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{title}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const theme      = useTheme();
  const { token }  = useAuth();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/analytics`, { headers: headers() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load analytics');
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  // Pull from structured payload, fall back to legacy flat keys
  const tot      = data?.totals ?? {};
  const funnel   = data?.funnel ?? {};
  const drops    = data?.dropoffs ?? {};
  const triggers = Array.isArray(data?.topTriggers) ? data.topTriggers : [];
  const insights = Array.isArray(data?.insights) ? data.insights : [];

  const aiUsed      = tot.aiUsed       ?? data?.ai_used        ?? 0;
  const totalLimits = tot.totalLimitHits ?? ((data?.ai_limit_hits ?? 0) + (data?.journal_limit_hits ?? 0));
  const modalOpens  = tot.modalOpens    ?? data?.modal_opens    ?? 0;
  const clicks      = tot.upgradeClicks ?? data?.upgrade_clicks ?? 0;
  const subs        = tot.subscriptions ?? data?.subscriptions  ?? 0;

  // Relative widths for funnel bars (max step = 100%)
  const funnelCounts = [aiUsed, totalLimits, modalOpens, clicks, subs];
  const maxCount     = Math.max(1, ...funnelCounts);
  const relWidths    = funnelCounts.map(c => Math.max(4, Math.round((c / maxCount) * 100)));

  const FUNNEL_STEPS = [
    { label: 'AI Analyses',     color: '#3B82F6', pct: 100,                          count: aiUsed,      relativeWidth: relWidths[0] },
    { label: 'Limit Hit',       color: '#DC2626', pct: funnel.aiToLimit      ?? 0,   count: totalLimits, relativeWidth: relWidths[1] },
    { label: 'Modal Opened',    color: '#2563EB', pct: funnel.limitToModal    ?? 0,   count: modalOpens,  relativeWidth: relWidths[2] },
    { label: 'Clicked Upgrade', color: '#1D4ED8', pct: funnel.modalToClick    ?? 0,   count: clicks,      relativeWidth: relWidths[3] },
    { label: 'Subscribed',      color: '#059669', pct: funnel.clickToSubscribe ?? 0,  count: subs,        relativeWidth: relWidths[4] },
  ];

  const KPI_CARDS = [
    { label: 'Signups',         value: tot.signups         ?? data?.signups,         color: '#059669', Icon: UserPlus },
    { label: 'Trades Logged',   value: tot.tradesAdded     ?? data?.trades_added,    color: '#2563EB', Icon: BookOpen },
    { label: 'AI Analyses',     value: aiUsed,                                       color: '#3B82F6', Icon: Zap },
    { label: 'Limit Hits',      value: totalLimits,                                  color: '#DC2626', Icon: AlertTriangle,
      sub: `AI ${tot.aiLimitHits ?? data?.ai_limit_hits ?? 0}  ·  Journal ${tot.journalLimitHits ?? data?.journal_limit_hits ?? 0}` },
    { label: 'Modal Opens',     value: modalOpens,                                   color: '#2563EB', Icon: Eye },
    { label: 'Upgrade Clicks',  value: clicks,                                       color: '#1D4ED8', Icon: MousePointerClick },
    { label: 'Subscriptions',   value: subs,                                         color: '#059669', Icon: ShoppingCart,
      sub: `${funnel.signupToConvert ?? data?.conversionRate ?? 0}% of signups` },
    { label: 'Click → Sub',     value: `${funnel.clickToSubscribe ?? 0}%`,           color: '#059669', Icon: TrendingUp,
      sub: 'of clickers complete payment' },
  ];

  const totalTriggerCount = triggers.reduce((s, x) => s + x.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="#3B82F6" />
          <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Conversion Intelligence</span>
        </div>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 9,
            background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${theme.border}`,
            color: theme.muted, fontSize: 12, cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} />Refresh
        </button>
      </div>

      {error && <ErrorBar message={error} />}

      {/* ── 1. KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {KPI_CARDS.map(c => <KpiCard key={c.label} loading={loading} {...c} />)}
      </div>

      {/* ── 2. Conversion funnel ── */}
      <Section title="Conversion Funnel" theme={theme}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {FUNNEL_STEPS.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', flex: 1, alignItems: 'flex-start', minWidth: 0 }}>
              <FunnelStep {...step} isFirst={i === 0} loading={loading} theme={theme} />
              {i < FUNNEL_STEPS.length - 1 && (
                <div style={{ flexShrink: 0, paddingTop: 22, paddingLeft: 6, paddingRight: 6 }}>
                  <ArrowRight size={13} color={theme.muted} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rate summary */}
        {!loading && data && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 10, borderTop: `1px solid ${theme.border}` }}>
            {[
              { label: 'AI → Limit',    value: `${funnel.aiToLimit ?? 0}%`,        color: '#DC2626' },
              { label: 'Limit → Modal', value: `${funnel.limitToModal ?? 0}%`,      color: '#2563EB' },
              { label: 'Modal → Click', value: `${funnel.modalToClick ?? 0}%`,      color: '#1D4ED8' },
              { label: 'Click → Sub',   value: `${funnel.clickToSubscribe ?? 0}%`,  color: '#059669' },
              { label: 'Signup → Paid', value: `${funnel.signupToConvert ?? 0}%`,   color: '#3B82F6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── 3. Drop-off analysis ── */}
      <Section title="Drop-off Analysis" theme={theme}
        extra={<span style={{ fontSize: 11, color: theme.muted }}>Users lost at each stage</span>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          <DropoffCard stage="After AI Usage"      count={drops.afterAI    ?? (aiUsed - totalLimits)} color="#3B82F6"
            label="Used AI but never hit a limit"  hint={aiUsed > 0 ? `${100 - (funnel.aiToLimit ?? 0)}% didn't trigger` : undefined} loading={loading} theme={theme} />
          <DropoffCard stage="After Limit Hit"     count={drops.afterLimit  ?? (totalLimits - modalOpens)} color="#DC2626"
            label="Hit limit but never saw modal"  hint="Optimize: surface modal faster" loading={loading} theme={theme} />
          <DropoffCard stage="After Modal Opened"  count={drops.afterModal  ?? (modalOpens - clicks)} color="#2563EB"
            label="Saw modal but didn't click"     hint="Optimize: modal copy / CTA" loading={loading} theme={theme} />
          <DropoffCard stage="After Clicking"      count={drops.afterClick  ?? (clicks - subs)} color="#1D4ED8"
            label="Clicked but didn't subscribe"   hint="Optimize: reduce checkout friction" loading={loading} theme={theme} />
        </div>
      </Section>

      {/* ── 4. Top upgrade triggers ── */}
      <Section title="Top Upgrade Triggers" theme={theme}
        extra={<span style={{ fontSize: 11, color: theme.muted }}>By modal open source</span>}
      >
        {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[...Array(3)].map((_, i) => <Skeleton key={i} h={30} />)}</div>}
        {!loading && triggers.length === 0 && (
          <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', padding: '12px 0' }}>
            No trigger data — include <code style={{ fontSize: 11, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>source</code> in <code style={{ fontSize: 11, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>upgrade_modal_opened</code> events.
          </div>
        )}
        {!loading && triggers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {triggers.map((tr, i) => <TriggerBar key={tr.source} {...tr} total={totalTriggerCount} index={i} theme={theme} />)}
          </div>
        )}
      </Section>

      {/* ── 5. Insights ── */}
      {(insights.length > 0 || loading) && (
        <Section title="Insights" theme={theme}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
              <Lightbulb size={11} color="#F59E0B" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>Auto-generated</span>
            </div>
          }
        >
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[...Array(4)].map((_, i) => <Skeleton key={i} h={18} />)}</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 5, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <Target size={10} color="#3B82F6" />
                    </div>
                    <span style={{ fontSize: 12.5, color: theme.text, lineHeight: 1.5 }}>{ins}</span>
                  </div>
                ))}
              </div>
            )
          }
        </Section>
      )}

    </div>
  );
}
