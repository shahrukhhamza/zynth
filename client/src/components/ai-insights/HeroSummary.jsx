function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_CONFIG = {
  live:    { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bdr: 'border-emerald-200 dark:border-emerald-500/20', label: 'Live',    title: 'All key indicators are current' },
  delayed: { dot: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400',     bdr: 'border-amber-200 dark:border-amber-500/20',   label: 'Delayed', title: 'Some key indicators are outside their expected release window' },
  partial: { dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',         bdr: 'border-red-200 dark:border-red-500/20',       label: 'Partial', title: 'One or more key indicators are outdated or missing' },
};

const CONF_COLOR = {
  High:   { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bdr: 'border-emerald-200 dark:border-emerald-500/20' },
  Medium: { bar: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400',     bdr: 'border-amber-200 dark:border-amber-500/20'   },
  Low:    { bar: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',         bdr: 'border-red-200 dark:border-red-500/20'       },
};

function sentimentColor(sentiment) {
  const s = String(sentiment || '').toLowerCase();
  if (s.includes('bull')) return 'text-emerald-500';
  if (s.includes('bear')) return 'text-red-500';
  return 'text-slate-400 dark:text-slate-400';
}

export default function HeroSummary({ macroData }) {
  const conf      = typeof macroData.confidence === 'object'
    ? macroData.confidence
    : { value: macroData.confidence ?? 0, level: 'Medium', reasoning: '', label: '' };

  const confCfg   = CONF_COLOR[conf.level]                 ?? CONF_COLOR.Medium;
  const statusCfg = STATUS_CONFIG[macroData.status ?? 'live'] ?? STATUS_CONFIG.live;
  const score     = macroData.score ?? 0;
  const scoreColor = score > 0 ? 'text-emerald-500' : score < 0 ? 'text-red-500' : 'text-slate-400';

  const { bullishCount = 0, bearishCount = 0, neutralCount = 0, totalIndicators = 0 } =
    macroData.summary ?? {};

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.07] dark:bg-slate-900">
      {/* Directional gradient tint */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          background: score > 0
            ? 'radial-gradient(ellipse at 15% 60%, #10b981 0%, transparent 65%)'
            : score < 0
            ? 'radial-gradient(ellipse at 15% 60%, #ef4444 0%, transparent 65%)'
            : 'none',
        }}
      />

      <div className="relative px-6 pb-6 pt-5 md:px-8 md:pb-7 md:pt-6">

        {/* ── Top bar: badges + timestamp ─────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              title={statusCfg.title}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusCfg.text} ${statusCfg.bdr}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${confCfg.text} ${confCfg.bdr}`}>
              {conf.level} Confidence · {conf.value}%
            </span>
          </div>
          <time className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
            {formatRelativeTime(macroData.meta?.lastUpdated)}
          </time>
        </div>

        {/* ── Score + sentiment ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-8">
          <div className="flex items-baseline gap-3">
            <span className={`text-[4.5rem] font-extrabold leading-none tracking-tight tabular-nums ${scoreColor}`}>
              {score > 0 ? '+' : ''}{score}
            </span>
            <div className="flex flex-col gap-0.5 pb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Macro Score
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">/ 10 scale</span>
            </div>
          </div>

          <div className="pb-2">
            <p className={`text-2xl font-bold tracking-tight ${sentimentColor(macroData.sentiment)}`}>
              {macroData.sentiment}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              {totalIndicators} indicators
              &thinsp;&middot;&thinsp;
              <span className="text-emerald-500">{bullishCount} bullish</span>
              &thinsp;&middot;&thinsp;
              <span className="text-red-500">{bearishCount} bearish</span>
              &thinsp;&middot;&thinsp;
              {neutralCount} neutral
            </p>
          </div>
        </div>

        {/* ── Confidence bar ───────────────────────────────────────────────── */}
        <div className="mt-5 max-w-xs">
          <div className="h-[3px] overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
            <div
              className={`h-full rounded-full transition-all duration-500 ${confCfg.bar}`}
              style={{ width: `${conf.value}%` }}
            />
          </div>
          {conf.label && (
            <p className="mt-1.5 text-[11px] italic text-slate-400 dark:text-slate-500">{conf.label}</p>
          )}
        </div>
      </div>
    </section>
  );
}