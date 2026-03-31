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

const STRENGTH_CONFIG = {
  strong:   { label: 'Strong',   cls: 'text-slate-500 dark:text-slate-300 font-semibold' },
  moderate: { label: 'Moderate', cls: 'text-slate-400 dark:text-slate-400' },
  weak:     { label: 'Weak',     cls: 'text-slate-300 dark:text-slate-600' },
};

function biasColor(bias) {
  if (bias === 'Bullish') return 'text-emerald-500';
  if (bias === 'Bearish') return 'text-red-500';
  return 'text-slate-400';
}

export default function KeyDrivers({ drivers }) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/[0.07] dark:bg-slate-900 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Key Drivers</p>
        <p className="mt-2 text-sm text-slate-400">No driver data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.07] dark:bg-slate-900">
      {/* Section header */}
      <div className="border-b border-slate-100 dark:border-white/5 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Key Drivers</p>
      </div>

      {/* Rank rows */}
      {drivers.map((driver, i) => {
        const trendCfg    = TREND_ARROW[driver.trend]            ?? TREND_ARROW.stable;
        const freshDot    = FRESHNESS_DOT[driver.freshness]      ?? FRESHNESS_DOT.outdated;
        const strengthCfg = STRENGTH_CONFIG[driver.impactStrength] ?? STRENGTH_CONFIG.weak;
        const isLast      = i === drivers.length - 1;

        return (
          <div
            key={driver.code}
            className={`grid grid-cols-[20px_1fr_60px_16px_16px_56px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.025] ${!isLast ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
          >
            {/* Rank */}
            <span className="text-[10px] font-mono tabular-nums text-slate-300 dark:text-slate-600">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Name + value */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{driver.name}</p>
              <p className="text-[11px] tabular-nums text-slate-400">{driver.value}</p>
            </div>

            {/* Impact strength */}
            <span className={`text-right text-[10px] ${strengthCfg.cls}`}>
              {strengthCfg.label}
            </span>

            {/* Trend arrow */}
            <span className={`text-sm font-bold ${trendCfg.color}`} title={`Trend: ${driver.trend ?? 'stable'}`}>
              {trendCfg.symbol}
            </span>

            {/* Freshness dot */}
            <span title={`Data: ${driver.freshness ?? 'unknown'}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${freshDot}`} />
            </span>

            {/* Bias */}
            <span className={`text-right text-xs font-bold tabular-nums ${biasColor(driver.bias)}`}>
              {driver.bias}
            </span>
          </div>
        );
      })}
    </div>
  );
}