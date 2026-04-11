import { Clock, AlertCircle } from 'lucide-react';

function relativeTime(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'Just now';
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function qualityColor(n) {
  if (n >= 70) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Good' };
  if (n >= 55) return { bg: 'bg-amber-400', text: 'text-amber-300', label: 'Fair' };
  return { bg: 'bg-red-500', text: 'text-red-400', label: 'Low' };
}

function signalColor(level) {
  if (level === 'High') return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
  if (level === 'Medium') return 'text-amber-300 border-amber-500/20 bg-amber-500/10';
  return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10';
}

function statusInfo(s) {
  if (s === 'OK') return { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'OK' };
  if (s === 'Warning') return { dot: 'bg-amber-400', text: 'text-amber-300', label: 'Warning' };
  return { dot: 'bg-red-500', text: 'text-red-400', label: 'Degraded' };
}

export default function DataTrustPanel({ dataInfo, macroScore }) {
  if (!dataInfo && !macroScore) return null;

  const dataConfidence = Number(macroScore?.dataConfidence ?? 45);
  const signalConfidence = macroScore?.signalConfidence || 'Medium';
  const systemStatus = macroScore?.systemStatus || 'OK';
  const qc = qualityColor(dataConfidence);
  const sc = statusInfo(systemStatus);

  const released = relativeTime(dataInfo?.lastUpdated);
  const fetched = relativeTime(dataInfo?.generatedAt);

  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Data Reliability</p>

      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0c1018] px-5 py-5 space-y-4">
        {/* Status line */}
        <div className="space-y-1.5">
          <p className="text-[13px] text-zinc-800 dark:text-white/80">{dataInfo?.dataDelay || 'Latest available economic data'}</p>
          {dataInfo?.nextUpdateExpected && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Clock size={11} className="shrink-0" />
              <span>Next update: {dataInfo.nextUpdateExpected}</span>
            </div>
          )}
          <div className="flex gap-4 text-[10px] text-zinc-500">
            {released && <span>Released {released}</span>}
            {fetched && <span>Fetched {fetched}</span>}
            {!released && !fetched && <span>Timing data pending</span>}
          </div>
        </div>

        {/* Three metrics */}
        <div className="grid grid-cols-3 gap-3">
          {/* Data Quality */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Data Quality</p>
              <span className={`text-lg font-bold tabular-nums ${qc.text}`}>{dataConfidence}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-white/5">
              <div className={`h-full rounded-full ${qc.bg}`} style={{ width: `${Math.min(100, dataConfidence)}%` }} />
            </div>
            <p className="text-[9px] text-zinc-500">{qc.label} &#183; freshness + completeness + validity</p>
          </div>

          {/* Signal Alignment */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Signal Alignment</p>
            <span className={`inline-block rounded-md border px-2 py-1 text-[11px] font-bold ${signalColor(signalConfidence)}`}>{signalConfidence}</span>
            <p className="text-[9px] text-zinc-500">Directional coherence</p>
          </div>

          {/* System Status */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">System Status</p>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
              <span className={`text-[11px] font-bold ${sc.text}`}>{sc.label}</span>
            </div>
            <p className="text-[9px] text-zinc-500">Overall health</p>
          </div>
        </div>

        {/* Regime & Score details (collapsible feel - always visible but compact) */}
        {macroScore && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.04] px-3.5 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-purple-400">Market Regime</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[12px] font-bold text-purple-200">{(macroScore.regime || 'MIXED').replace(/_/g, ' ')}</p>
                <span className="text-[10px] text-purple-300 font-mono">{macroScore.regimeConfidence ?? 25}%</span>
              </div>
              {macroScore.regimeBreakdown && (
                <p className="text-[9px] text-purple-300/70 font-mono mt-1">
                  Inf: {macroScore.regimeBreakdown.inflationScore || 0} | Lab: {macroScore.regimeBreakdown.laborScore || 0} | Gr: {macroScore.regimeBreakdown.growthScore || 0}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/[0.04] px-3.5 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-yellow-400">Score Formula</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-yellow-200/80 line-clamp-3">{macroScore.formula || 'Deterministic weighted sum'}</p>
            </div>
          </div>
        )}

        {/* Data quality notes */}
        {dataInfo && (Array.isArray(dataInfo.outdatedCodes) && dataInfo.outdatedCodes.length > 0 || Array.isArray(dataInfo.missingCodes) && dataInfo.missingCodes.length > 0) && (
          <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3.5 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-400">Data Quality Notes</p>
            {Array.isArray(dataInfo.outdatedCodes) && dataInfo.outdatedCodes.length > 0 && (
              <p className="mt-1 text-[11px] text-amber-200/80">Outdated: {dataInfo.outdatedCodes.join(', ')}</p>
            )}
            {Array.isArray(dataInfo.missingCodes) && dataInfo.missingCodes.length > 0 && (
              <p className="mt-1 text-[11px] text-amber-200/80">Missing: {dataInfo.missingCodes.join(', ')}</p>
            )}
          </div>
        )}

        {dataInfo?.uncertainty && (
          <div className="flex items-start gap-2 text-[10px] text-zinc-400">
            <AlertCircle size={11} className="mt-0.5 shrink-0 text-zinc-500" />
            <p>{dataInfo.uncertainty}</p>
          </div>
        )}
      </div>
    </section>
  );
}
