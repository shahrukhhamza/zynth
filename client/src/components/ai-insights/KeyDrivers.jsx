function driverColor(bias) {
  if (bias === 'Bullish') return 'bg-emerald-500';
  if (bias === 'Bearish') return 'bg-red-500';
  return 'bg-blue-600';
}

function textColor(bias) {
  if (bias === 'Bullish') return 'text-emerald-500';
  if (bias === 'Bearish') return 'text-red-500';
  return 'text-blue-600 dark:text-blue-400';
}

export default function KeyDrivers({ drivers }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:bg-[#111827] dark:shadow-[0_12px_32px_rgba(0,0,0,0.28)] md:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Key Drivers</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">The strongest indicators behind the current macro bias.</p>
      </div>

      <div className="space-y-3">
        {drivers.map((driver) => (
          <div key={driver.code} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
            <div className="grid grid-cols-[minmax(0,1.2fr)_auto] gap-3 md:grid-cols-[minmax(0,1.2fr)_120px_90px] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{driver.name}</p>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{driver.value}</p>
              </div>
              <div className="hidden md:block">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className={`h-full rounded-full ${driverColor(driver.bias)}`} style={{ width: `${driver.intensity}%` }} />
                </div>
              </div>
              <div className={`text-right text-xs font-semibold ${textColor(driver.bias)}`}>
                {driver.bias}
              </div>
            </div>
            <div className="mt-3 md:hidden">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className={`h-full rounded-full ${driverColor(driver.bias)}`} style={{ width: `${driver.intensity}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}