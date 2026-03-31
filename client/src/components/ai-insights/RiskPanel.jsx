/**
 * RiskPanel — transparency about data quality and signal conflicts
 *
 * Props:
 *   summary  {object}  macroData.macroSummary (from buildMacroSummary)
 */

import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function alertSeverity(text) {
  if (/outdated|missing|delayed/i.test(text)) return 'high';
  if (/conflict|mixed|stale|low confidence/i.test(text)) return 'medium';
  return 'low';
}

function buildRiskItems(summary) {
  const items = [];

  // 1. Explicit risk alerts from the engine
  if (Array.isArray(summary?.riskAlerts)) {
    items.push(...summary.riskAlerts.map(text => ({ type: 'alert', text })));
  }

  // 2. Data quality issues from dataInfo
  const di = summary?.dataInfo ?? {};

  // Outdated indicators
  if (Array.isArray(di.outdatedCodes) && di.outdatedCodes.length > 0) {
    items.push({
      type: 'data-quality',
      text: `Outdated data: ${di.outdatedCodes.join(', ')}`,
      severity: 'high',
    });
  }

  // Missing indicators
  if (Array.isArray(di.missingCodes) && di.missingCodes.length > 0) {
    items.push({
      type: 'data-quality',
      text: `Missing data: ${di.missingCodes.join(', ')}`,
      severity: 'high',
    });
  }

  // Stale indicators
  if (Array.isArray(di.staleCodes) && di.staleCodes.length > 0) {
    items.push({
      type: 'data-quality',
      text: `Stale data: ${di.staleCodes.join(', ')} (check next release time)`,
      severity: 'medium',
    });
  }

  // Low confidence
  if ((di.confidence ?? summary?.confidence ?? 0) < 50) {
    items.push({
      type: 'confidence',
      text: 'Forecast confidence is low — use with caution',
      severity: 'medium',
    });
  }

  // Uncertainty note
  if (di.uncertainty) {
    items.push({
      type: 'uncertainty',
      text: di.uncertainty,
      severity: 'low',
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function RiskPanel({ summary }) {
  const [open, setOpen] = useState(false);

  const items = buildRiskItems(summary);

  // Clean state: no risks
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-5 py-3.5">
        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
        <p className="text-[12px] text-emerald-400 font-medium">
          No active risks — all signals are clean and data is fresh
        </p>
      </div>
    );
  }

  // Determine panel severity: highest severity among all items
  const hasHigh   = items.some(i => alertSeverity(i.text) === 'high' || i.severity === 'high');
  const hasMedium = items.some(i => alertSeverity(i.text) === 'medium' || i.severity === 'medium');

  const panelCls = hasHigh
    ? 'border-red-500/20 bg-red-500/[0.04]'
    : 'border-amber-500/20 bg-amber-500/[0.04]';

  const headerCls = hasHigh ? 'text-red-400' : 'text-amber-400';
  const dotCls    = hasHigh ? 'bg-red-500' : 'bg-amber-400';

  return (
    <section className={`rounded-2xl border ${panelCls}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={13} className={`shrink-0 ${headerCls}`} />
          <span className={`text-[12px] font-semibold ${headerCls}`}>
            {items.length} Risk Alert{items.length > 1 ? 's' : ''}
          </span>
          {!open && (
            <span className="hidden truncate text-[11px] text-slate-500 sm:block">
              — {items[0].text}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={13} className="shrink-0 text-slate-500" />
        ) : (
          <ChevronDown size={13} className="shrink-0 text-slate-500" />
        )}
      </button>

      {open && (
        <div className="space-y-2 border-t border-white/[0.05] px-5 pb-4 pt-3">
          {items.map((item, i) => {
            const sev = alertSeverity(item.text);
            const itemSeverity = item.severity ?? sev;
            const itemCls = itemSeverity === 'high'
              ? 'text-red-400'
              : itemSeverity === 'medium'
              ? 'text-amber-400'
              : 'text-slate-400';

            return (
              <div key={i} className={`flex items-start gap-2 text-[11px] leading-[1.6] ${itemCls}`}>
                <AlertCircle size={10} className="mt-0.5 shrink-0" />
                {item.text}
              </div>
            );
          })}

          {/* Transparency footer */}
          <div className="mt-3 flex items-start gap-2 border-t border-white/[0.05] pt-3 text-[10px] text-slate-500">
            <span className="mt-0.5 shrink-0">ℹ</span>
            <p>
              These alerts help you understand data quality. Use them to assess confidence in your decisions, not to dismiss signals entirely.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
