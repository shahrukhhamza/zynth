import { useState } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

const ASSET_ORDER = ['gold', 'EURUSD', 'GBPUSD', 'USDJPY', 'oil'];
const ASSET_LABEL = { gold: 'Gold', EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', USDJPY: 'USD/JPY', oil: 'Oil' };

function biasConfig(bias) {
  const b = String(bias || '').toLowerCase();
  if (b === 'bullish') return { color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' };
  if (b === 'bearish') return { color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/20' };
  if (b === 'mixed') return { color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/20' };
  return { color: 'text-slate-400', bg: 'bg-slate-500/8', border: 'border-slate-500/20' };
}

function getExplanation(summary, asset) {
  if (asset === 'gold') return summary?.explanation?.gold;
  if (asset === 'oil') return summary?.explanation?.commodities?.oil;
  return summary?.explanation?.forex?.[asset];
}

function getSignal(summary, asset) {
  if (asset === 'gold') return summary?.gold;
  if (asset === 'oil') return summary?.commodities?.oil;
  return summary?.forex?.[asset];
}

export default function WhyPanel({ summary }) {
  const [active, setActive] = useState('gold');
  const expl = getExplanation(summary, active);
  const signal = getSignal(summary, active);

  if (!expl) return null;

  const bc = biasConfig(signal?.bias);
  const reasons = (Array.isArray(expl.reasoning) ? expl.reasoning : []).filter(Boolean).slice(0, 4);

  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Why is the market moving?</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {ASSET_ORDER.map(a => {
          const s = getSignal(summary, a);
          const ac = biasConfig(s?.bias);
          const isActive = a === active;
          return (
            <button key={a} onClick={() => setActive(a)} className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all ${isActive ? `${ac.bg} border ${ac.border} ${ac.color}` : 'border border-white/[0.05] text-slate-500 hover:text-slate-300'}`}>
              {ASSET_LABEL[a]}
            </button>
          );
        })}
      </div>

      <div className={`rounded-2xl border ${bc.border} ${bc.bg} px-5 py-4 space-y-3`}>
        <p className="text-[13px] leading-relaxed text-white/80">{expl.summary}</p>

        {reasons.length > 0 && (
          <ul className="space-y-2">
            {reasons.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${bc.color.replace('text-', 'bg-')}`} />
                <span className="text-[12px] text-white/70 leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        )}

        {expl.marketImpact && (
          <div className={`flex gap-2.5 rounded-lg border ${bc.border} ${bc.bg} px-3.5 py-2.5`}>
            <Zap size={12} className={`mt-0.5 shrink-0 ${bc.color}`} />
            <p className={`text-[11px] leading-relaxed ${bc.color}`}>{expl.marketImpact}</p>
          </div>
        )}

        {signal?.hasConflict && signal?.conflictExplanation && (
          <div className="flex gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.05] px-3.5 py-2.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[11px] text-amber-300 leading-relaxed">{signal.conflictExplanation}</p>
          </div>
        )}
      </div>
    </section>
  );
}
