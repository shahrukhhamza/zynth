/**
 * HeroSection — top-of-page macro bias card
 *
 * Props:
 *   summary  {object}  macroData.macroSummary (from buildMacroSummary)
 */

import { TrendingUp, TrendingDown, Minus, Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function relativeTime(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0)         return 'Just now';
  const m = Math.floor(ms / 60_000);
  if (m < 1)          return 'Just now';
  if (m < 60)         return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)         return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function deriveBias(summary) {
  const b = String(summary?.marketBias || '').toLowerCase();
  if (b === 'bullish') return { label: 'Bullish', color: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', glow: '#10b98114', icon: TrendingUp };
  if (b === 'bearish') return { label: 'Bearish', color: '#ef4444', text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',     glow: '#ef444414', icon: TrendingDown };
  if (b === 'mixed')   return { label: 'Mixed',   color: '#f59e0b', text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   glow: '#f59e0b14', icon: Activity };
  return                      { label: 'Neutral', color: '#64748b', text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   glow: 'transparent', icon: Minus };
}

function deriveStrength(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'strong')   return { label: 'Strong',   cls: 'text-white/90 font-bold' };
  if (v === 'moderate') return { label: 'Moderate', cls: 'text-white/70 font-semibold' };
  return                       { label: 'Weak',     cls: 'text-white/40 font-normal' };
}

function deriveConfidence(n) {
  const v = Number(n ?? 0);
  if (v >= 70) return { text: 'text-emerald-400', bar: 'bg-emerald-500' };
  if (v >= 45) return { text: 'text-amber-400',   bar: 'bg-amber-400'   };
  return               { text: 'text-red-400',    bar: 'bg-red-500'     };
}

/**
 * Derives a 3-tier system status from the data envelope.
 *
 *  Healthy  — no outdated/missing data, confidence >= 65
 *  Warning  — stale indicators or confidence 40-64
 *  Critical — outdated/missing indicators or confidence < 40
 */
function deriveStatus(summary) {
  const di      = summary?.dataInfo ?? {};
  const staleCnt    = (di.staleCodes    ?? []).length;
  const outdatedCnt = (di.outdatedCodes ?? []).length;
  const missingCnt  = (di.missingCodes  ?? []).length;
  const conf        = Number(di.confidence ?? summary?.confidence ?? 0);

  if (outdatedCnt > 0 || missingCnt > 0 || conf < 40) {
    return { label: 'Critical', icon: XCircle,       dot: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/25',     bg: 'bg-red-500/[0.08]'   };
  }
  if (staleCnt > 0 || conf < 65) {
    return { label: 'Warning',  icon: AlertTriangle,  dot: 'bg-amber-400',   text: 'text-amber-400',   border: 'border-amber-500/25',   bg: 'bg-amber-500/[0.08]' };
  }
  return   { label: 'Healthy',  icon: CheckCircle2,   dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/[0.08]' };
}

/**
 * Pick the single best one-line explanation.
 * Priority: gold summary → first forex summary → dataInfo uncertainty
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function HeroSection({ summary }) {
  const bias     = deriveBias(summary);
  const str      = deriveStrength(summary?.strength);
  const conf     = Number(summary?.confidence ?? 0);
  const confCls  = deriveConfidence(conf);
  const status   = deriveStatus(summary);
  const explain  = pickExplanation(summary);
  const updated  = relativeTime(summary?.dataInfo?.lastUpdated ?? summary?.lastUpdated);
  const Icon     = bias.icon;
  const StatusIcon = status.icon;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d1120]"
      aria-label="Market bias summary"
    >
      {/* Directional ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 8% 55%, ${bias.glow} 0%, transparent 58%)` }}
      />

      <div className="relative px-7 py-7 md:px-9 md:py-9 space-y-7">

        {/* ── Row 1: header meta ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Macro Intelligence
          </span>
          {updated && (
            <div className="flex items-center gap-1.5">
              <Clock size={10} className="text-slate-600 shrink-0" />
              <span className="text-[11px] tabular-nums text-slate-500">Updated {updated}</span>
            </div>
          )}
        </div>

        {/* ── Row 2: BIAS — the biggest element ──────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
          {/* Icon badge */}
          <div className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${bias.bg} ${bias.border}`}>
            <Icon size={27} className={bias.text} strokeWidth={2.2} />
          </div>

          <div>
            {/* Primary: "Bullish for Gold (Moderate)" */}
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className={`text-[2.6rem] leading-none font-extrabold tracking-tight md:text-[3rem] ${bias.text}`}>
                {bias.label}
              </span>
              <span className={`text-xl leading-none tracking-tight ${str.cls}`}>
                ({str.label})
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Overall macro market bias
            </p>
          </div>
        </div>

        {/* ── Row 3: status strip ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Confidence */}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2">
            <div className="h-[28px] w-[2px] rounded-full bg-white/10" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">Confidence</p>
              <p className={`text-base font-extrabold tabular-nums leading-none ${confCls.text}`}>{conf}%</p>
            </div>
          </div>

          {/* System status pill */}
          <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 ${status.bg} ${status.border}`}>
            <span className={`h-2 w-2 rounded-full shrink-0 ${status.dot} ${status.label === 'Healthy' ? 'shadow-[0_0_6px_#10b981]' : ''}`} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</p>
              <p className={`text-base font-extrabold leading-none ${status.text}`}>{status.label}</p>
            </div>
          </div>

          {/* Confidence bar (full width, inside its own row below on small screens) */}
          <div className="hidden min-w-[120px] flex-1 items-center gap-2 sm:flex">
            <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confCls.bar}`}
                style={{ width: `${Math.min(100, conf)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mobile: full-width confidence bar */}
        <div className="sm:hidden">
          <div className="h-1 w-full rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${confCls.bar}`}
              style={{ width: `${Math.min(100, conf)}%` }}
            />
          </div>
        </div>

        {/* ── Row 4: one-line explanation ────────────────────────────── */}
        {explain && (
          <blockquote className={`rounded-xl border ${bias.border} ${bias.bg} px-4 py-3`}>
            <p className={`text-[13px] leading-relaxed italic ${bias.text}`}>
              "{explain}"
            </p>
          </blockquote>
        )}

      </div>
    </section>
  );
}
