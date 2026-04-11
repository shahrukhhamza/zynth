import { Compass, ShieldAlert, Search, PauseCircle } from 'lucide-react';

function actionStyle(action) {
  if (action === 'No Trade') return { icon: ShieldAlert, text: 'text-red-700 dark:text-red-300', bg: 'bg-red-500/8', border: 'border-red-500/20', badge: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25' };
  if (action === 'Wait') return { icon: PauseCircle, text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/8', border: 'border-amber-500/20', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' };
  return { icon: Search, text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' };
}

function biasColor(bias) {
  if (bias === 'Bullish') return 'text-emerald-700 dark:text-emerald-300';
  if (bias === 'Bearish') return 'text-red-700 dark:text-red-300';
  return 'text-zinc-600 dark:text-zinc-300';
}

export default function TradeInsightPanel({ tradeInsight, tradeNarrative }) {
  if (!tradeInsight) return null;

  const { bias = 'Neutral', strength = 'Weak', action = 'Wait', explanation = '' } = tradeInsight;
  const style = actionStyle(action);
  const ActionIcon = style.icon;
  const headline = tradeNarrative?.headline || `${strength} ${bias} Bias`;
  const traderExplanation = tradeNarrative?.explanation || explanation;

  return (
    <section className={`rounded-2xl border px-5 py-4 ${style.bg} ${style.border}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass size={15} className="text-yellow-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Trader Insight</span>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold ${style.badge}`}>
          <ActionIcon size={12} />
          {action}
        </span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${biasColor(bias)}`}>{headline}</p>
      {traderExplanation && <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{traderExplanation}</p>}
    </section>
  );
}
