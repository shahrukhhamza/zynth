/**
 * DataTrustPanel — transparency about data freshness, coverage, and completeness
 *
 * Props:
 *   dataInfo  {object}  macroData.macroSummary.dataInfo (from generateDataTransparency)
 */

import { Clock, Database, CheckCircle2, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function relativeTime(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0)         return 'Just now';
  const m = Math.floor(ms / 60_000);
  if (m < 1)          return 'Just now';
  if (m < 60)         return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)         return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function confidenceColor(n) {
  const v = Number(n ?? 0);
  if (v >= 70) return { text: 'text-emerald-400', label: 'High' };
  if (v >= 45) return { text: 'text-amber-400',   label: 'Medium' };
  return               { text: 'text-red-400',    label: 'Low' };
}

function completenessLabel(indicators) {
  if (!Array.isArray(indicators)) return 'Unknown';
  const total = indicators.length;
  if (total === 0) return 'Unknown';
  
  const fresh = indicators.filter(i => i.freshness === 'fresh').length;
  const stale = indicators.filter(i => i.freshness === 'stale').length;
  const outdated = indicators.filter(i => i.freshness === 'outdated').length;
  
  if (outdated > 0) return 'Low';
  if (stale > total * 0.3) return 'Medium';
  return 'High';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DataTrustPanel({ dataInfo }) {
  if (!dataInfo) return null;

  const confidence = Number(dataInfo.confidence ?? 0);
  const confColor = confidenceColor(confidence);
  const completeness = completenessLabel(dataInfo.indicators);
  const updated = relativeTime(dataInfo.lastUpdated);

  return (
    <section>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Data Reliability
      </p>

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1120] px-6 py-5 space-y-5">

        {/* Top summary row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          
          {/* Left: Data status text */}
          <div className="space-y-2">
            <p className="text-sm text-white/80">
              {dataInfo.dataDelay || 'Latest available economic data'}
            </p>
            
            {/* Next update */}
            {dataInfo.nextUpdateExpected && (
              <div className="flex items-center gap-2 text-[12px] text-slate-400">
                <Clock size={13} className="shrink-0" />
                Next update: {dataInfo.nextUpdateExpected}
              </div>
            )}
          </div>

          {/* Right: Confidence score */}
          <div className="flex flex-col items-end gap-2">
            <div className={`text-3xl font-extrabold font-mono tabular-nums ${confColor.text}`}>
              {confidence}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Confidence Score
            </div>
          </div>

        </div>

        {/* Confidence bar */}
        <div>
          <div className="h-1 w-full rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                confidence >= 70 ? 'bg-emerald-500'
                : confidence >= 45 ? 'bg-amber-400'
                : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          
          {/* Forecast coverage */}
          {dataInfo.forecastCoverage != null && (
            <div className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Forecast Coverage
              </p>
              <p className={`text-lg font-bold font-mono ${
                dataInfo.forecastCoverage >= 75 ? 'text-emerald-400'
                : dataInfo.forecastCoverage >= 50 ? 'text-amber-400'
                : 'text-red-400'
              }`}>
                {dataInfo.forecastCoverage}%
              </p>
            </div>
          )}

          {/* Data completeness */}
          <div className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
              Completeness
            </p>
            <p className={`text-base font-bold ${
              completeness === 'High' ? 'text-emerald-400'
              : completeness === 'Medium' ? 'text-amber-400'
              : 'text-red-400'
            }`}>
              {completeness}
            </p>
          </div>

          {/* Indicators count */}
          {Array.isArray(dataInfo.indicators) && (
            <div className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Indicators
              </p>
              <p className="text-lg font-bold text-white">
                {dataInfo.indicators.length}
              </p>
            </div>
          )}

        </div>

        {/* Per-indicator freshness list */}
        {Array.isArray(dataInfo.indicators) && dataInfo.indicators.length > 0 && (
          <div className="space-y-2 border-t border-white/[0.05] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Data Status by Indicator
            </p>
            <div className="space-y-1.5">
              {dataInfo.indicators.slice(0, 8).map(ind => {
                const freshClass = 
                  ind.freshness === 'fresh' ? 'text-emerald-400'
                  : ind.freshness === 'stale' ? 'text-amber-400'
                  : 'text-red-400';
                const freshLabel = 
                  ind.freshness === 'fresh' ? '✓ Fresh'
                  : ind.freshness === 'stale' ? '⚠ Stale'
                  : '✕ Outdated';

                return (
                  <div key={ind.code} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="flex-1 truncate text-white/70">
                      {ind.name || ind.code}
                    </span>
                    <span className={`shrink-0 font-semibold ${freshClass}`}>
                      {freshLabel}
                    </span>
                    {ind.nextUpdateExpected && (
                      <span className="text-[10px] text-slate-500">
                        {ind.nextUpdateExpected}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Uncertainty / notes */}
        {dataInfo.uncertainty && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <AlertCircle size={13} className="mt-0.5 shrink-0 text-slate-500" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              {dataInfo.uncertainty}
            </p>
          </div>
        )}

        {/* Real rate info */}
        {dataInfo.realRate?.realRate != null && (
          <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
            dataInfo.realRate.goldImpact === 'bullish' ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
            : dataInfo.realRate.goldImpact === 'bearish' ? 'border-red-500/20 bg-red-500/[0.06]'
            : 'border-white/[0.06] bg-white/[0.03]'
          }`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Real Interest Rate
              </p>
              <p className="text-[11px] text-white/70">{dataInfo.realRate.explanation}</p>
            </div>
            <div className={`font-mono text-lg font-bold shrink-0 ${
              (dataInfo.realRate.realRate ?? 0) < 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {dataInfo.realRate.realRate > 0 ? '+' : ''}{dataInfo.realRate.realRate}%
            </div>
          </div>
        )}

        {/* Trust statement footer */}
        <div className="border-t border-white/[0.05] pt-3">
          <p className="text-[10px] leading-relaxed text-slate-600">
            ℹ️ Data scores reflect freshness, completeness, and consistency. Use as one signal among many for decision-making.
          </p>
        </div>

      </div>
    </section>
  );
}
