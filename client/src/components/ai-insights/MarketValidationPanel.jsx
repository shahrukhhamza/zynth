import { AlertCircle, TrendingUp, TrendingDown, Zap } from 'lucide-react';

function conflictColor(severity) {
  if (severity === 'high') return { bg: 'bg-red-500/15', border: 'border-red-500/25', text: 'text-red-300' };
  if (severity === 'moderate') return { bg: 'bg-amber-500/15', border: 'border-amber-500/25', text: 'text-amber-300' };
  return { bg: 'bg-yellow-500/15', border: 'border-yellow-500/25', text: 'text-yellow-300' };
}

function priceIcon(dir) {
  if (dir === 'UP') return <TrendingUp size={16} className="text-emerald-400" />;
  if (dir === 'DOWN') return <TrendingDown size={16} className="text-red-400" />;
  return <Zap size={16} className="text-slate-400" />;
}

function biasText(b) {
  if (b === 'Bullish') return 'text-emerald-300';
  if (b === 'Bearish') return 'text-red-300';
  return 'text-slate-300';
}

export default function MarketValidationPanel({ marketValidation, macroScore }) {
  if (!marketValidation) return null;

  const { priceDirection, macroBias, conflict, severity, severityLabel, message } = marketValidation;

  if (!priceDirection) {
    return (
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Market Validation</p>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <AlertCircle size={13} />
            <span>{message || 'Awaiting price data for validation.'}</span>
          </div>
        </div>
      </section>
    );
  }

  const cc = conflictColor(severity);

  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Market Validation</p>
      <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4 space-y-3">

        {/* Price vs Macro */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            {priceIcon(priceDirection)}
            <span className={`text-[11px] font-semibold ${priceDirection === 'UP' ? 'text-emerald-300' : priceDirection === 'DOWN' ? 'text-red-300' : 'text-slate-300'}`}>Price {priceDirection}</span>
          </div>
          <span className="text-[11px] text-slate-500">vs</span>
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${macroBias === 'Bullish' ? 'bg-emerald-500/10' : macroBias === 'Bearish' ? 'bg-red-500/10' : 'bg-slate-500/10'}`}>
            <span className={`text-[11px] font-semibold ${biasText(macroBias)}`}>Macro {macroBias}</span>
          </div>
          {conflict && (
            <span className={`ml-auto text-[10px] font-bold uppercase rounded-md border px-2 py-1 ${cc.bg} ${cc.border} ${cc.text}`}>
              {severityLabel || (severity === 'high' ? 'Conflict' : 'Diverging')}
            </span>
          )}
        </div>

        {/* Message */}
        <div className={`rounded-lg border px-3.5 py-2.5 text-[11px] leading-relaxed ${conflict ? 'border-amber-500/20 bg-amber-500/[0.05] text-amber-100' : 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-100'}`}>
          {message}
        </div>

        {/* Data context */}
        {macroScore && (
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span>Score: <span className={macroScore.score > 0 ? 'text-emerald-300' : macroScore.score < 0 ? 'text-red-300' : 'text-slate-300'}>{macroScore.score > 0 ? '+' : ''}{macroScore.score}</span></span>
            <span>Quality: <span className={macroScore.dataConfidence >= 70 ? 'text-emerald-300' : macroScore.dataConfidence >= 55 ? 'text-amber-300' : 'text-red-300'}>{macroScore.dataConfidence ?? 45}%</span></span>
            <span>Signal: {macroScore.signalStrength || 'Moderate'} &#183; {macroScore.signalConfidence || 'Medium'}</span>
          </div>
        )}
      </div>
    </section>
  );
}
