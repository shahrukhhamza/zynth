import { useState } from 'react';

const BASELINE_WEIGHTS = {
  CPI: 2.0, NFP: 1.8, FedRate: 1.8, CorePCE: 1.6, UNEMPLOYMENT: 1.2,
  GDP: 1.2, JoblessClaims: 0.8, RetailSales: 0.8, ISMManufacturing: 0.7, ConsumerConf: 0.7,
};

function biasColor(b) {
  if (b === 'Bullish') return 'text-emerald-400';
  if (b === 'Bearish') return 'text-red-400';
  return 'text-zinc-400';
}

function freshDot(f) {
  if (f === 'fresh') return { cls: 'text-emerald-400', title: 'Fresh' };
  if (f === 'stale') return { cls: 'text-amber-400', title: 'Stale' };
  return { cls: 'text-red-400', title: 'Outdated' };
}

function trendArrow(t) {
  if (t === 'rising') return { sym: '\u25b2', cls: 'text-emerald-400' };
  if (t === 'falling') return { sym: '\u25bc', cls: 'text-red-400' };
  return { sym: '\u2013', cls: 'text-zinc-500' };
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function validLabel(v) {
  if (!v) return { label: 'Unchecked', cls: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/[0.06]' };
  if (v.valid) return { label: 'Valid', cls: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/[0.06]' };
  return { label: 'Partial', cls: 'text-amber-300 border-amber-500/20 bg-amber-500/[0.06]' };
}

export default function KeyDrivers({ drivers, macroScore }) {
  const [openCode, setOpenCode] = useState(null);

  if (!drivers || drivers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Key Drivers</p>
        <p className="mt-2 text-[12px] text-zinc-400">No driver data available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] overflow-hidden">
      <div className="border-b border-white/[0.04] px-5 py-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Key Drivers</p>
        <p className="text-[10px] text-zinc-500">Actual, forecast, surprise, weighted contribution, bias, reasoning.</p>
      </div>

      {drivers.map((d, i) => {
        const trend = trendArrow(d.trend);
        const fresh = freshDot(d.freshness);
        const isOpen = openCode === d.code;
        const vl = validLabel(d.validation);

        return (
          <div key={d.code} className="border-b border-white/[0.03] last:border-0">
            <button type="button" onClick={() => setOpenCode(prev => prev === d.code ? null : d.code)} className="w-full px-5 py-3 text-left hover:bg-white/[0.015] transition-colors">
              <div className="grid grid-cols-[20px_1fr_70px_60px_20px_20px] items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white">{d.name}</p>
                  <p className="text-[10px] tabular-nums text-zinc-400">{d.value ?? '\u2014'}</p>
                </div>
                <span className="text-right text-[11px] tabular-nums text-yellow-300">{Number.isFinite(d.contribution) ? `${d.contribution > 0 ? '+' : ''}${d.contribution}` : '\u2013'}</span>
                <span className={`text-right text-[11px] font-semibold ${biasColor(d.bias)}`}>{d.bias || 'Neutral'}</span>
                <span className={`text-center text-[10px] ${fresh.cls}`} title={fresh.title}>{'\u2022'}</span>
                <span className={`text-center text-[11px] ${trend.cls}`}>{trend.sym}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-4 space-y-2.5">
                <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.1em]">
                  <span className={`rounded-md border px-1.5 py-0.5 ${vl.cls}`}>{vl.label}</span>
                  <span className="rounded-md border border-yellow-500/15 bg-yellow-500/[0.06] px-1.5 py-0.5 text-yellow-200">{d.dataSource || 'FRED API'}</span>
                  <span className="rounded-md border border-violet-500/15 bg-violet-500/[0.06] px-1.5 py-0.5 text-violet-200">Reliability: {d.sourceReliability || 'medium'}</span>
                  <span className="rounded-md border border-zinc-500/15 bg-zinc-500/[0.06] px-1.5 py-0.5 text-zinc-300">Weight: {d.weight || BASELINE_WEIGHTS[d.code] || '\u2014'}</span>
                </div>

                <div className="flex gap-4 text-[10px] text-zinc-400">
                  {fmtDate(d.releaseTime) && <span>Released: {fmtDate(d.releaseTime)}</span>}
                  {fmtDate(d.fetchedAt) && <span>Fetched: {fmtDate(d.fetchedAt)}</span>}
                  {!fmtDate(d.releaseTime) && !fmtDate(d.fetchedAt) && <span className="text-zinc-500">Timing data pending</span>}
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-1">Why this matters</p>
                  <p className="text-[11px] leading-relaxed text-zinc-200">{d.reasoning || 'Analysis pending \u2014 data being validated.'}</p>
                </div>

                {d.historicalValidation && (
                  <div className="rounded-lg border border-yellow-500/15 bg-yellow-500/[0.04] px-3 py-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-yellow-400 mb-1">Backtest (last {d.historicalValidation.sampleSize || 10})</p>
                    <p className="text-[11px] leading-relaxed text-yellow-200/80">{d.historicalValidation.statement}</p>
                  </div>
                )}

                {Array.isArray(d.validation?.issues) && d.validation.issues.length > 0 && (
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-400 mb-1">Validation Notes</p>
                    {d.validation.issues.map(issue => (
                      <p key={issue} className="text-[11px] text-amber-200/80">{'\u2022'} {issue}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
