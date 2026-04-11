/**
 * HeroSection — clean, minimalistic macro bias card
 */

import { TrendingUp, TrendingDown, Minus, Activity, Clock } from 'lucide-react';

function relativeTime(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'Just now';
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function deriveBias(summary) {
  const b = String(summary?.marketBias || '').toLowerCase();
  if (b === 'bullish') return { label: 'Bullish', color: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingUp };
  if (b === 'bearish') return { label: 'Bearish', color: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: TrendingDown };
  if (b === 'mixed') return { label: 'Mixed', color: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Activity };
  return { label: 'Neutral', color: '#64748b', text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', icon: Minus };
}

function deriveStrength(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'strong') return 'Strong';
  if (v === 'moderate') return 'Moderate';
  return 'Weak';
}

function confidenceColor(level) {
  if (level === 'High') return 'text-emerald-400';
  if (level === 'Medium') return 'text-amber-300';
  return 'text-zinc-400';
}

function statusDot(status) {
  if (status === 'OK') return 'bg-emerald-500';
  if (status === 'Warning') return 'bg-amber-400';
  return 'bg-red-500';
}

function pickExplanation(summary) {
  const goldSummary = summary?.explanation?.gold?.summary;
  if (goldSummary) return goldSummary;
  const forexKeys = ['EURUSD', 'GBPUSD', 'USDJPY'];
  for (const k of forexKeys) {
    const line = summary?.explanation?.forex?.[k]?.summary;
    if (line) return line;
  }
  return summary?.dataInfo?.uncertainty ?? null;
}

export default function HeroSection({ summary, generatedAt, macroScore }) {
  const bias = deriveBias(summary);
  const strength = deriveStrength(summary?.strength);
  const explain = pickExplanation(summary);

  const releasedAt = relativeTime(summary?.dataInfo?.lastUpdated);
  const fetchedAt = relativeTime(
    generatedAt ?? summary?.generatedAt ?? summary?.dataInfo?.generatedAt ?? summary?.lastUpdated ?? summary?.dataInfo?.lastUpdated
  );

  const regime = macroScore?.regime || 'MIXED';
  const regimeConfidence = macroScore?.regimeConfidence ?? 25;
  const dataConfidence = macroScore?.dataConfidence ?? 45;
  const signalStrength = macroScore?.signalStrength || 'Moderate';
  const signalConfidence = macroScore?.signalConfidence || 'Medium';
  const uncertainty = macroScore?.uncertainty || 'Medium';
  const systemStatus = macroScore?.systemStatus || 'OK';

  const Icon = bias.icon;

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0c1018]" aria-label="Market bias summary">
      <div className="px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">Macro Intelligence</span>
          <div className="flex items-center gap-3 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-500">
            {releasedAt && (
              <span className="flex items-center gap-1">
                <Clock size={10} className="text-zinc-500 dark:text-zinc-600" />
                Released {releasedAt}
              </span>
            )}
            {fetchedAt && <span className="text-zinc-500 dark:text-zinc-600">&#183; Fetched {fetchedAt}</span>}
          </div>
        </div>

        {/* Bias */}
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bias.bg} border ${bias.border}`}>
            <Icon size={22} className={bias.text} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold tracking-tight ${bias.text}`}>{bias.label}</span>
              <span className="text-base text-zinc-500 dark:text-white/50">({strength})</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Overall macro market bias</p>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="flex flex-wrap items-center gap-2">
          <Pill label="Signal" value={`${signalStrength} \u00b7 ${signalConfidence}`} cls={confidenceColor(signalConfidence)} />
          <Pill label="Uncertainty" value={uncertainty} cls={uncertainty === 'High' ? 'text-amber-400' : uncertainty === 'Low' ? 'text-emerald-400' : 'text-zinc-600 dark:text-zinc-300'} />
          <Pill label="System" value={systemStatus} cls={systemStatus === 'OK' ? 'text-emerald-400' : systemStatus === 'Warning' ? 'text-amber-400' : 'text-red-400'} prefix={<span className={`h-1.5 w-1.5 rounded-full ${statusDot(systemStatus)}`} />} />
          <Pill label="Regime" value={regime.replace(/_/g, ' ')} cls="text-purple-300" sub={`${regimeConfidence}%`} />
          <div className="ml-auto hidden sm:block">
            <span className="text-[10px] text-zinc-500">
              Quality: <span className={dataConfidence >= 70 ? 'text-emerald-400' : dataConfidence >= 55 ? 'text-amber-300' : 'text-red-400'}>{dataConfidence}%</span>
            </span>
          </div>
        </div>

        {/* Explanation */}
        {explain && (
          <p className={`text-[12px] leading-relaxed italic ${bias.text} opacity-80 border-l-2 pl-3`} style={{ borderColor: bias.color + '40' }}>
            {explain}
          </p>
        )}
      </div>
    </section>
  );
}

function Pill({ label, value, cls = 'text-zinc-700 dark:text-white/80', prefix, sub }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.05] bg-zinc-50 dark:bg-white/[0.02] px-2.5 py-1.5">
      {prefix}
      <div>
        <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-600">{label}</p>
        <p className={`text-[11px] font-bold leading-none ${cls}`}>
          {value}
          {sub && <span className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500 ml-1">{sub}</span>}
        </p>
      </div>
    </div>
  );
}
