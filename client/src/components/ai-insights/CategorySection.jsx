import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function biasTextClass(bias) {
  if (bias === 'Bullish') return 'text-emerald-500';
  if (bias === 'Bearish') return 'text-red-500';
  return 'text-blue-600 dark:text-blue-400';
}

export default function CategorySection({ title, indicators, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:bg-[#111827] dark:shadow-[0_12px_32px_rgba(0,0,0,0.28)] md:p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{indicators.length} indicators</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
      </button>

      {open && (
        <div className="mt-4 space-y-2">
          {indicators.map((indicator) => (
            <div key={indicator.code} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{indicator.name}</p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    Actual {indicator.actual} · Forecast {indicator.forecast}
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className={`h-full rounded-full ${indicator.bias === 'Bullish' ? 'bg-emerald-500' : indicator.bias === 'Bearish' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${indicator.intensity}%` }} />
                  </div>
                </div>
                <div className={`text-right text-xs font-semibold ${biasTextClass(indicator.bias)}`}>{indicator.bias}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}