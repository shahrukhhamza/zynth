import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TREND_ARROW = {
  rising:  { symbol: '↑', color: 'text-emerald-400' },
  falling: { symbol: '↓', color: 'text-red-400'     },
  stable:  { symbol: '→', color: 'text-slate-400'   },
};

const FRESHNESS_DOT = {
  fresh:    'bg-emerald-500',
  stale:    'bg-amber-400',
  outdated: 'bg-red-500',
};

// Short gold-relevance note per category section
const CATEGORY_CONTEXT = {
  'Labor':           'Strong labor data typically reduces safe-haven demand for gold via Fed tightening expectations.',
  'Inflation':       'Above-forecast inflation has historically driven gold demand as a hedge against purchasing-power erosion.',
  'Growth':          'Hot growth signals a risk-on environment — this typically pressures gold as safe-haven demand falls.',
  'Monetary Policy': 'Rate hike surprises strengthen the USD and usually weigh on non-yielding gold.',
};

function fmt(v, u) { return v == null ? '—' : `${v}${u || ''}`; }

function biasColor(bias) {
  if (bias === 'Bullish') return 'text-emerald-500';
  if (bias === 'Bearish') return 'text-red-500';
  return 'text-slate-400';
}

function surpriseColor(s) {
  if (s == null) return 'text-slate-400';
  if (s > 0) return 'text-emerald-500';
  if (s < 0) return 'text-red-500';
  return 'text-slate-400';
}

export default function CategorySection({ title, indicators, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const goldNote = CATEGORY_CONTEXT[title] ?? null;

  // Collapsed bias summary counts
  const bullish = indicators.filter(i => i.bias === 'Bullish').length;
  const bearish = indicators.filter(i => i.bias === 'Bearish').length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.07] dark:bg-slate-900">
      {/* ── Section header ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open
            ? <ChevronDown  size={12} className="shrink-0 text-slate-400" />
            : <ChevronRight size={12} className="shrink-0 text-slate-400" />}
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <span className="text-[10px] text-slate-400">
            {indicators.length} indicator{indicators.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Collapsed: show bias counts */}
        {!open && (bullish > 0 || bearish > 0) && (
          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            {bullish > 0 && <span className="font-medium text-emerald-500">{bullish} bullish</span>}
            {bearish > 0 && <span className="font-medium text-red-500">{bearish} bearish</span>}
          </div>
        )}
      </button>

      {open && (
        <>
          {/* ── Gold relevance note ───────────────────────────────────────── */}
          {goldNote && (
            <div className="border-y border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.015] px-5 py-2.5">
              <p className="text-[11px] italic text-slate-400 dark:text-slate-500">{goldNote}</p>
            </div>
          )}

          {/* ── Column headers ────────────────────────────────────────────── */}
          <div className="grid grid-cols-[1fr_76px_76px_76px_24px_20px] gap-3 border-b border-slate-100 dark:border-white/5 px-5 py-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Indicator</span>
            <span className="text-right text-[9px] font-bold uppercase tracking-widest text-slate-400">Actual</span>
            <span className="text-right text-[9px] font-bold uppercase tracking-widest text-slate-400">Forecast</span>
            <span className="text-right text-[9px] font-bold uppercase tracking-widest text-slate-400">Surprise</span>
            <span />
            <span />
          </div>

          {/* ── Indicator rows ────────────────────────────────────────────── */}
          {indicators.map((ind, i) => {
            const trendCfg  = TREND_ARROW[ind.trend]      ?? TREND_ARROW.stable;
            const freshDot  = FRESHNESS_DOT[ind.freshness] ?? FRESHNESS_DOT.outdated;
            const isLast    = i === indicators.length - 1;

            return (
              <div
                key={ind.code}
                className={`grid grid-cols-[1fr_76px_76px_76px_24px_20px] items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.025] ${!isLast ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
              >
                {/* Indicator name + strength */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{ind.name}</p>
                  {ind.impactStrength && ind.impactStrength !== 'weak' && (
                    <span className={`text-[9px] uppercase tracking-wide ${ind.impactStrength === 'strong' ? 'text-slate-500 dark:text-slate-400 font-semibold' : 'text-slate-400'}`}>
                      {ind.impactStrength} impact
                    </span>
                  )}
                </div>

                {/* Actual */}
                <p className={`text-right text-sm font-bold tabular-nums ${biasColor(ind.bias)}`}>
                  {fmt(ind.actual, ind.unit)}
                </p>

                {/* Forecast */}
                <p className="text-right text-sm tabular-nums text-slate-400 dark:text-slate-500">
                  {fmt(ind.forecast, ind.unit)}
                </p>

                {/* Surprise */}
                <p className={`text-right text-xs font-semibold tabular-nums ${surpriseColor(ind.surprise)}`}>
                  {ind.surprise != null
                    ? `${ind.surprise > 0 ? '+' : ''}${ind.surprise}${ind.unit || ''}`
                    : '—'}
                </p>

                {/* Trend arrow */}
                <span className={`text-center text-sm ${trendCfg.color}`} title={`Trend: ${ind.trend ?? 'stable'}`}>
                  {trendCfg.symbol}
                </span>

                {/* Freshness dot */}
                <span className="flex justify-center" title={`Data: ${ind.freshness ?? 'unknown'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${freshDot}`} />
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}