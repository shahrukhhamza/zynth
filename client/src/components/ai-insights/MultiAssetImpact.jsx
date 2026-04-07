import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

function biasConfig(bias) {
  const b = String(bias || '').toLowerCase();
  if (b === 'bullish') return { text: 'text-emerald-400', bg: 'bg-emerald-500/8', icon: TrendingUp };
  if (b === 'bearish') return { text: 'text-red-400', bg: 'bg-red-500/8', icon: TrendingDown };
  if (b === 'mixed') return { text: 'text-amber-400', bg: 'bg-amber-500/8', icon: AlertTriangle };
  return { text: 'text-zinc-400', bg: 'bg-zinc-500/8', icon: Minus };
}

function strengthLabel(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'strong') return 'Strong';
  if (v === 'moderate') return 'Moderate';
  return 'Weak';
}

function AssetRow({ name, signal }) {
  if (!signal) return null;
  const bc = biasConfig(signal.bias);
  const Icon = bc.icon;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0 px-4">
      <span className="w-20 text-[12px] font-medium text-white/70">{name}</span>
      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${bc.bg}`}>
          <Icon size={12} className={bc.text} />
          <span className={`text-[11px] font-semibold ${bc.text}`}>{String(signal.bias || 'Neutral')}</span>
          <span className="text-[10px] text-white/40">({strengthLabel(signal.strength)})</span>
        </div>
      </div>
    </div>
  );
}

export default function MultiAssetImpact({ summary }) {
  const gold = summary?.gold;
  const forex = summary?.forex ?? {};
  const oil = summary?.commodities?.oil;

  if (!gold && !forex.EURUSD && !forex.GBPUSD && !forex.USDJPY && !oil) return null;

  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Market Impact</p>
      <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] overflow-hidden">
        <AssetRow name="Gold" signal={gold} />
        <AssetRow name="EUR/USD" signal={forex.EURUSD} />
        <AssetRow name="GBP/USD" signal={forex.GBPUSD} />
        <AssetRow name="USD/JPY" signal={forex.USDJPY} />
        <AssetRow name="Oil" signal={oil} />
      </div>

      {(forex.AUDUSD || forex.USDCHF) && (
        <div className="mt-3 rounded-2xl border border-white/[0.06] bg-[#0c1018] overflow-hidden">
          <div className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600 border-b border-white/[0.04]">Derived Pairs</div>
          <AssetRow name="AUD/USD" signal={forex.AUDUSD} />
          <AssetRow name="USD/CHF" signal={forex.USDCHF} />
        </div>
      )}
    </section>
  );
}
