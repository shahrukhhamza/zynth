/**
 * WhyPanel — explains market movement with simple reasoning bullets
 *
 * Props:
 *   summary  {object}  macroData.macroSummary (from buildMacroSummary)
 */

import { useState } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asset metadata for tab display
 */
const ASSET_ORDER = ['gold', 'EURUSD', 'GBPUSD', 'USDJPY', 'oil'];
const ASSET_LABEL = {
  gold: 'Gold', EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD',
  USDJPY: 'USD/JPY', AUDUSD: 'AUD/USD', USDCHF: 'USD/CHF', oil: 'Oil',
};

function biasConfig(bias) {
  const b = String(bias || '').toLowerCase();
  if (b === 'bullish') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  if (b === 'bearish') return { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     };
  if (b === 'mixed')   return { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   };
  return                      { color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20'   };
}

/**
 * Fetch explanation for a given asset from the nested summary structure
 */
function getExplanation(summary, asset) {
  if (asset === 'gold') return summary?.explanation?.gold;
  if (asset === 'oil')  return summary?.explanation?.commodities?.oil;
  return summary?.explanation?.forex?.[asset];
}

/**
 * Fetch signal (with bias/strength/conflict info) for a given asset
 */
function getSignal(summary, asset) {
  if (asset === 'gold') return summary?.gold;
  if (asset === 'oil')  return summary?.commodities?.oil;
  return summary?.forex?.[asset];
}

/**
 * Simplify reasoning bullets: take first 4, remove redundancy, keep simple language
 */
function simplifyReasons(reasons) {
  if (!Array.isArray(reasons)) return [];
  // Filter out empty and take first 4
  return reasons.filter(r => r && String(r).trim()).slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function WhyPanel({ summary }) {
  const [active, setActive] = useState('gold');

  const expl   = getExplanation(summary, active);
  const signal = getSignal(summary, active);

  if (!expl) return null;

  const bc = biasConfig(signal?.bias);
  const reasons = simplifyReasons(expl.reasoning);

  return (
    <section>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Why is the market moving?
      </p>

      {/* Asset tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {ASSET_ORDER.map(a => {
          const s  = getSignal(summary, a);
          const ac = biasConfig(s?.bias);
          const isActive = a === active;
          return (
            <button
              key={a}
              onClick={() => setActive(a)}
              className={`rounded-xl px-3.5 py-1.5 text-[11px] font-semibold transition-all ${
                isActive
                  ? `${ac.bg} border border-white/10 ${ac.color}`
                  : 'border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}
            >
              {ASSET_LABEL[a]}
            </button>
          );
        })}
      </div>

      {/* Main explanation card */}
      <div className={`rounded-2xl border ${bc.border} ${bc.bg} px-6 py-5 space-y-4`}>

        {/* Summary line */}
        <p className="text-sm leading-relaxed text-white/80">
          {expl.summary}
        </p>

        {/* Reasoning bullets (max 4, plain language) */}
        {reasons.length > 0 && (
          <ul className="space-y-2.5">
            {reasons.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${bc.color.replace('text-', 'bg-')}`} />
                <span className="text-[13px] text-white/80 leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Market impact callout */}
        {expl.marketImpact && (
          <div className={`flex gap-3 rounded-xl border ${bc.border} ${bc.bg} px-4 py-3`}>
            <Zap size={13} className={`mt-0.5 shrink-0 ${bc.color}`} />
            <p className={`text-[12px] leading-relaxed ${bc.color}`}>
              {expl.marketImpact}
            </p>
          </div>
        )}

        {/* Conflict warning (sticky, stays visible even if user tabs) */}
        {signal?.hasConflict && signal?.conflictExplanation && (
          <div className="flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[12px] text-amber-300 leading-relaxed">
              {signal.conflictExplanation}
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
