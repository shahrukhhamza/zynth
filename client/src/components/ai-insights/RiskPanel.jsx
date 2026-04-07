import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function alertSeverity(text) {
  if (/outdated|missing|delayed/i.test(text)) return 'high';
  if (/conflict|mixed|stale|low confidence/i.test(text)) return 'medium';
  return 'low';
}

function buildRiskItems(summary) {
  const items = [];
  if (Array.isArray(summary?.riskAlerts)) {
    items.push(...summary.riskAlerts.map(text => ({ type: 'alert', text })));
  }
  const di = summary?.dataInfo ?? {};
  if (Array.isArray(di.outdatedCodes) && di.outdatedCodes.length > 0) {
    items.push({ type: 'data-quality', text: `Outdated data: ${di.outdatedCodes.join(', ')}`, severity: 'high' });
  }
  if (Array.isArray(di.missingCodes) && di.missingCodes.length > 0) {
    items.push({ type: 'data-quality', text: `Missing data: ${di.missingCodes.join(', ')}`, severity: 'high' });
  }
  if (Array.isArray(di.staleCodes) && di.staleCodes.length > 0) {
    items.push({ type: 'data-quality', text: `Approaching refresh: ${di.staleCodes.join(', ')} \u2014 updates expected soon.`, severity: 'medium' });
  }
  return items;
}

export default function RiskPanel({ summary }) {
  const [open, setOpen] = useState(false);
  const items = buildRiskItems(summary);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <p className="text-[11px] text-emerald-400">All signals clean — no active risks</p>
      </div>
    );
  }

  const hasHigh = items.some(i => (i.severity || alertSeverity(i.text)) === 'high');
  const panelBorder = hasHigh ? 'border-red-500/15' : 'border-amber-500/15';
  const panelBg = hasHigh ? 'bg-red-500/[0.03]' : 'bg-amber-500/[0.03]';
  const headerColor = hasHigh ? 'text-red-400' : 'text-amber-400';

  return (
    <section className={`rounded-2xl border ${panelBorder} ${panelBg}`}>
      <button type="button" onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} className={headerColor} />
          <span className={`text-[11px] font-semibold ${headerColor}`}>{items.length} Risk Alert{items.length > 1 ? 's' : ''}</span>
          {!open && <span className="truncate text-[10px] text-zinc-500 hidden sm:block">\u2014 {items[0].text}</span>}
        </div>
        {open ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
      </button>

      {open && (
        <div className="space-y-1.5 border-t border-white/[0.04] px-4 pb-3 pt-2">
          {items.map((item, i) => {
            const sev = item.severity || alertSeverity(item.text);
            const cls = sev === 'high' ? 'text-red-400' : sev === 'medium' ? 'text-amber-400' : 'text-zinc-400';
            return (
              <div key={i} className={`flex items-start gap-1.5 text-[10px] leading-relaxed ${cls}`}>
                <AlertCircle size={10} className="mt-0.5 shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
