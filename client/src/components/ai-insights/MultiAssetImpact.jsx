/**
 * MultiAssetImpact — simple row layout showing bias + strength across all assets
 *
 * Props:
 *   summary  {object}  macroData.macroSummary (from buildMacroSummary)
 */

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function biasConfig(bias) {
  const b = String(bias || '').toLowerCase();
  if (b === 'bullish') return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp };
  if (b === 'bearish') return { text: 'text-red-400',     bg: 'bg-red-500/10',     icon: TrendingDown };
  if (b === 'mixed')   return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: AlertTriangle };
  return                      { text: 'text-slate-400',   bg: 'bg-slate-500/10',   icon: Minus };
}

function strengthLabel(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'strong')   return 'Strong';
  if (v === 'moderate') return 'Moderate';
  return 'Weak';
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Row
// ─────────────────────────────────────────────────────────────────────────────
function AssetRow({ name, signal }) {
  if (!signal) return null;

  const bc = biasConfig(signal.bias);
  const Icon = bc.icon;
  const strength = strengthLabel(signal.strength);

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
      {/* Asset name */}
      <div className="w-20 text-[13px] font-semibold text-white/70">
        {name}
      </div>

      {/* Bias + Strength + Icon */}
      <div className="flex flex-1 items-center gap-3">
        <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${bc.bg}`}>
          <Icon size={14} className={bc.text} />
          <span className={`text-[12px] font-bold ${bc.text}`}>
            {String(signal.bias || 'Neutral').charAt(0).toUpperCase() + String(signal.bias || 'Neutral').slice(1)}
          </span>
          <span className={`text-[11px] font-semibold text-white/60`}>
            ({strength})
          </span>
        </div>

        {/* Conflict warning */}
        {signal.hasConflict && (
          <div className="flex items-center gap-1" title={signal.conflictExplanation}>
            <AlertTriangle size={11} className="text-amber-400" />
            <span className="text-[10px] text-amber-400 font-semibold">Mixed signals</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function MultiAssetImpact({ summary }) {
  const gold = summary?.gold;
  const forex = summary?.forex ?? {};
  const oil = summary?.commodities?.oil;

  // Only show if we have at least one asset
  if (!gold && !forex.EURUSD && !forex.GBPUSD && !forex.USDJPY && !oil) {
    return null;
  }

  return (
    <section>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Market Impact
      </p>

      <div className={`rounded-2xl border border-white/[0.07] bg-[#0d1120] overflow-hidden`}>
        <div className="divide-y divide-white/[0.05]">
          <AssetRow name="Gold" signal={gold} />
          <AssetRow name="EUR/USD" signal={forex.EURUSD} />
          <AssetRow name="GBP/USD" signal={forex.GBPUSD} />
          <AssetRow name="USD/JPY" signal={forex.USDJPY} />
          <AssetRow name="Oil" signal={oil} />
        </div>
      </div>

      {/* Optional: derived pairs row if they exist */}
      {(forex.AUDUSD || forex.USDCHF) && (
        <div className={`mt-4 rounded-2xl border border-white/[0.07] bg-[#0d1120] overflow-hidden`}>
          <div className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 border-b border-white/[0.05]">
            Derived Pairs
          </div>
          <div className="divide-y divide-white/[0.05]">
            <AssetRow name="AUD/USD" signal={forex.AUDUSD} />
            <AssetRow name="USD/CHF" signal={forex.USDCHF} />
          </div>
        </div>
      )}
    </section>
  );
}
