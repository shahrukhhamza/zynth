/**
 * AiSummary — concise AI narrative or deterministic action context
 *
 * Props:
 *   aiSummary      {object}  macroData.aiSummary (Gemini-generated, optional)
 *   aiStatus       {string}  macroData.aiStatus ('ai_generated', 'ai_fallback', or falsy)
 *   actionContext  {string}  macroData.actionContext (deterministic fallback)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AiSummary({ aiSummary, aiStatus, actionContext }) {
  const hasAi = aiSummary && !aiSummary.error && aiSummary.summary;
  if (!hasAi && !actionContext) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Analysis Summary
        </p>
        {aiStatus && (
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${
            aiStatus === 'ai_generated'  ? 'text-violet-400'
            : aiStatus === 'ai_fallback' ? 'text-amber-400'
            : 'text-slate-500'
          }`}>
            {aiStatus === 'ai_generated'  ? '✦ AI-Powered' : aiStatus === 'ai_fallback' ? '⚡ Algorithmic' : 'Analysis'}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1120] px-5 py-4">
        
        {/* AI-generated narrative */}
        {hasAi && (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-white/85">
              {aiSummary.summary}
            </p>
            {Array.isArray(aiSummary.keyPoints) && aiSummary.keyPoints.length > 0 && (
              <ul className="space-y-1 mt-2">
                {aiSummary.keyPoints.slice(0, 2).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-white/70">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
                    {pt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Deterministic action context (fallback or supplement) */}
        {actionContext && (
          <div className={hasAi ? 'border-t border-white/[0.05] pt-3 mt-3' : ''}>
            <p className={`text-[12px] leading-relaxed italic ${
              hasAi ? 'text-slate-500' : 'text-white/75'
            }`}>
              {actionContext}
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
