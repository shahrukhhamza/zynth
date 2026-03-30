export default function HeroSummary({ macroData }) {
  const sentimentColor = macroData.sentiment === 'Bullish'
    ? 'text-emerald-500'
    : macroData.sentiment === 'Bearish'
      ? 'text-red-500'
      : 'text-blue-600 dark:text-blue-400';

  const scoreColor = macroData.score > 0
    ? 'text-emerald-500'
    : macroData.score < 0
      ? 'text-red-500'
      : 'text-blue-600 dark:text-blue-400';

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:bg-[#111827] dark:shadow-[0_12px_32px_rgba(0,0,0,0.28)] md:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Macro Score</p>
          <div className="mt-2 flex items-end gap-3">
            <span className={`text-5xl font-bold tracking-tight ${scoreColor}`}>
              {macroData.score > 0 ? '+' : ''}{macroData.score}
            </span>
            <span className="pb-1 text-sm text-gray-500 dark:text-gray-400">/ 10</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${sentimentColor} bg-blue-50 dark:bg-white/5`}>
              {macroData.sentiment}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Market Bias</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Confidence</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{macroData.confidence}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200"
              style={{ width: `${macroData.confidence}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Last updated: {macroData.updated}</p>
        </div>
      </div>
    </section>
  );
}