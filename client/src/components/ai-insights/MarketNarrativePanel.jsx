import { TrendingUp, TrendingDown, Info, AlertCircle } from 'lucide-react';

function biasColor(bias) {
  if (bias === 'Bullish') return { text: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', icon: TrendingUp };
  if (bias === 'Bearish') return { text: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/20', icon: TrendingDown };
  return { text: 'text-zinc-400', bg: 'bg-zinc-500/8', border: 'border-zinc-500/20', icon: Info };
}

function categoryBadge(cat) {
  if (cat === 'primary') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  if (cat === 'secondary') return 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10';
  return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/[0.06]';
}

function confColor(level) {
  if (level === 'High') return 'text-emerald-400';
  if (level === 'Medium') return 'text-amber-300';
  return 'text-zinc-400';
}

export default function MarketNarrativePanel({ narrative }) {
  if (!narrative) {
    return (
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Why Market Moved Today</p>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4">
          <p className="text-[12px] text-zinc-400">Market narrative loading\u2026</p>
        </div>
      </section>
    );
  }

  if (narrative.reason && narrative.reason.includes('indicator') && narrative.drivers?.length === 0) {
    return (
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Why Market Moved Today</p>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-zinc-400">{narrative.reason}</p>
          </div>
        </div>
      </section>
    );
  }

  const { summary, drivers = [], finalBias, maxConfidence, regime, regimeConfidence } = narrative;
  const bc = biasColor(finalBias);
  const BiasIcon = bc.icon;

  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Why Market Moved Today</p>
      <div className="space-y-3">
        {/* Summary */}
        <div className={`rounded-2xl border ${bc.border} ${bc.bg} px-5 py-4`}>
          <div className="flex items-start gap-2.5">
            <BiasIcon size={16} className={`shrink-0 mt-0.5 ${bc.text}`} />
            <div>
              <p className={`text-[13px] leading-relaxed ${bc.text}`}>{summary}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-[10px] font-semibold ${confColor(maxConfidence)}`}>Confidence: {maxConfidence}</span>
                {regime && regime !== 'NEUTRAL' && (
                  <span className="text-[10px] text-purple-300">Regime: {regime.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drivers */}
        {drivers.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] p-4 space-y-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 pb-1">Key Drivers</p>
            {drivers.map((d, i) => {
              const dc = biasColor(d.impact);
              const DIcon = dc.icon;
              return (
                <div key={d.code || i} className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">{i + 1}</span>
                      <span className="text-[12px] font-semibold text-white">{d.code}</span>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${dc.text}`}>
                        <DIcon size={10} />
                        {d.impact}
                      </span>
                      {d.category !== 'tertiary' && (
                        <span className={`text-[9px] rounded-full border px-1.5 py-0.5 ${categoryBadge(d.category)}`}>
                          {d.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-yellow-300">{d.contribution > 0 ? '+' : ''}{d.contribution?.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-300 ml-5">{d.explanation}</p>
                </div>
              );
            })}
          </div>
        )}

        {drivers.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-zinc-400">More indicators needed for a complete narrative.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
