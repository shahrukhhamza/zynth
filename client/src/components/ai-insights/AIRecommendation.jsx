import { AlertTriangle, Bot } from 'lucide-react';

// Ordered commentary sections
const SECTIONS = [
  { key: 'summary',      label: 'Overview'        },
  { key: 'marketImpact', label: 'Market Context'  },
  { key: 'whyItMatters', label: 'Why It Matters'  },
  { key: 'riskNote',     label: 'Risk Note', isRisk: true },
];

export default function AIRecommendation({ aiSummary, aiStatus }) {
  // Unavailable — single muted line, no card chrome
  if (aiStatus === 'unavailable' || !aiSummary) {
    return (
      <div className="flex items-center gap-3 px-1">
        <Bot size={13} className="shrink-0 text-zinc-400" />
        <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
          AI commentary unavailable — showing data-driven insights only.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.07] dark:bg-zinc-900">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Bot size={13} className="text-yellow-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">AI Commentary</span>
        </div>
        {aiSummary.model && (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{aiSummary.model}</span>
        )}
      </div>

      {/* ── Content sections ──────────────────────────────────────────────── */}
      <div className="divide-y divide-zinc-100 dark:divide-white/5">
        {SECTIONS.map(({ key, label, isRisk }) => {
          const text = aiSummary[key];
          if (!text) return null;
          return (
            <div key={key} className="px-5 py-4">
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                {label}
              </p>
              <p className={`text-sm leading-[1.75] ${isRisk ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {text}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Warnings strip (first warning only) ──────────────────────────── */}
      {aiSummary.warnings && aiSummary.warnings.length > 0 && (
        <div className="flex items-start gap-2 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.015] px-5 py-3">
          <AlertTriangle size={10} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[10px] leading-4 text-zinc-400 dark:text-zinc-500">
            {aiSummary.warnings[0]}
          </p>
        </div>
      )}
    </div>
  );
}