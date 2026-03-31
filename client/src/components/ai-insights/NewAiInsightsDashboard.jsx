import { useState } from 'react';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import HeroSummary from './HeroSummary';
import KeyDrivers from './KeyDrivers';
import CategorySection from './CategorySection';
import AIRecommendation from './AIRecommendation';

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
      {label}
    </p>
  );
}

// ── Risk strip (collapsible, 1-line when closed) ──────────────────────────────
function alertTextColor(text) {
  if (/outdated|missing/i.test(text)) return 'text-red-500 dark:text-red-400';
  if (/conflict|mixed/i.test(text))   return 'text-amber-500 dark:text-amber-400';
  return 'text-slate-500 dark:text-slate-400';
}

function RiskStrip({ riskAlerts, signalConflict }) {
  const [open, setOpen] = useState(false);
  const hasConflict = signalConflict && signalConflict.level !== 'low';

  const allAlerts = [
    ...(hasConflict
      ? [`${signalConflict.level === 'high' ? 'High' : 'Mixed'} signal conflict — ${(signalConflict.conflictingIndicators ?? []).join(', ')}`]
      : []),
    ...(riskAlerts ?? []),
  ];
  if (allAlerts.length === 0) return null;

  const isHigh = allAlerts.some(a => /outdated|missing|high/i.test(a));
  const stripBorder = isHigh
    ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.04]'
    : 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.04]';
  const iconColor = isHigh ? 'text-red-500' : 'text-amber-500';
  const labelColor = isHigh ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <div className={`rounded-2xl border ${stripBorder}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle size={12} className={`shrink-0 ${iconColor}`} />
          <span className={`shrink-0 text-[11px] font-semibold ${labelColor}`}>
            {allAlerts.length} Risk Alert{allAlerts.length > 1 ? 's' : ''}
          </span>
          {!open && (
            <span className="hidden truncate text-[11px] text-slate-400 sm:block">
              — {allAlerts[0]}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp   size={12} className="shrink-0 text-slate-400" />
          : <ChevronDown size={12} className="shrink-0 text-slate-400" />}
      </button>

      {open && (
        <ul className="space-y-1.5 border-t border-current/10 px-4 pb-3 pt-2">
          {allAlerts.map((alert, i) => (
            <li key={i} className={`flex items-start gap-2 text-[11px] leading-4 ${alertTextColor(alert)}`}>
              <AlertCircle size={9} className="mt-0.5 shrink-0" />
              {alert}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Action context (left accent bar + italic prose) ───────────────────────────
function ActionContext({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-3 px-1">
      <div className="mt-1 h-full min-h-[40px] w-[2px] shrink-0 rounded-full bg-blue-400 dark:bg-blue-500" />
      <p className="text-sm italic leading-[1.75] text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

// ── Data footer ───────────────────────────────────────────────────────────────
const CONFLICT_LABEL = {
  low:    { color: 'text-emerald-500', label: 'Signals aligned' },
  medium: { color: 'text-amber-500',   label: 'Mixed signals'   },
  high:   { color: 'text-red-500',     label: 'High conflict'   },
};

function DataFooter({ meta, confidence, signalConflict }) {
  if (!meta) return null;
  const cc = CONFLICT_LABEL[signalConflict?.level] ?? CONFLICT_LABEL.low;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-white/[0.07] dark:bg-slate-900">
      {/* Sources + conflict indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(meta.dataSources ?? []).map(src => (
            <span key={src} className="text-[10px] text-slate-400 dark:text-slate-500">{src}</span>
          ))}
        </div>
        {signalConflict && (
          <span className={`text-[10px] font-semibold ${cc.color}`}>● {cc.label}</span>
        )}
      </div>

      {/* Data lag */}
      {meta.dataLag && (
        <div className="flex items-start gap-2">
          <Clock size={10} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[10px] leading-4 text-slate-400 dark:text-slate-500">{meta.dataLag}</p>
        </div>
      )}

      {/* Confidence basis */}
      {confidence?.reasoning && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Confidence basis: {confidence.reasoning}
        </p>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="space-y-3">
      {[160, 80, 80, 120].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function NewAiInsightsDashboard({ macroData }) {
  if (!macroData) return <LoadingState />;

  const CATEGORY_LABELS = {
    labor:     'Labor',
    inflation: 'Inflation',
    growth:    'Growth',
    monetary:  'Monetary Policy',
  };

  const categories = Object.entries(macroData.indicators || {})
    .filter(([, items]) => Array.isArray(items) && items.length > 0)
    .map(([key, items], i) => ({
      key,
      title:       CATEGORY_LABELS[key] || key,
      indicators:  items,
      defaultOpen: i === 0,
    }));

  return (
    <div className="space-y-3">

      {/* 1 · Hero */}
      <HeroSummary macroData={macroData} />

      {/* 2 · Risk strip */}
      <RiskStrip riskAlerts={macroData.riskAlerts} signalConflict={macroData.signalConflict} />

      {/* 3 · Key drivers */}
      <div>
        <SectionLabel label="Key Drivers" />
        <KeyDrivers drivers={macroData.drivers} />
      </div>

      {/* 4 · Economic indicators */}
      <div>
        <SectionLabel label="Economic Indicators" />
        <div className="space-y-1.5">
          {categories.map(({ key, title, indicators, defaultOpen }) => (
            <CategorySection
              key={key}
              title={title}
              indicators={indicators}
              defaultOpen={defaultOpen}
            />
          ))}
        </div>
      </div>

      {/* 5 · AI Commentary */}
      <div>
        <SectionLabel label="AI Commentary" />
        <div className="space-y-3">
          <AIRecommendation aiSummary={macroData.aiSummary} aiStatus={macroData.aiStatus} />
          <ActionContext text={macroData.actionContext} />
        </div>
      </div>

      {/* 6 · Data footer */}
      <DataFooter
        meta={macroData.meta}
        confidence={macroData.confidence}
        signalConflict={macroData.signalConflict}
      />

    </div>
  );
}

