export default function AiSummary({ aiSummary, aiStatus, actionContext }) {
  const hasAi = aiSummary && !aiSummary.error && aiSummary.summary;
  if (!hasAi && !actionContext) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Analysis Summary</p>
        {aiStatus && (
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${aiStatus === 'ai_generated' ? 'text-violet-400' : aiStatus === 'ai_fallback' ? 'text-amber-400' : 'text-zinc-500'}`}>
            {aiStatus === 'ai_generated' ? 'AI-Powered' : aiStatus === 'ai_fallback' ? 'Algorithmic' : 'Analysis'}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0c1018] px-5 py-4 space-y-3">
        {hasAi && (
          <div>
            <p className="text-[13px] leading-relaxed text-white/80">{aiSummary.summary}</p>
            {Array.isArray(aiSummary.keyPoints) && aiSummary.keyPoints.length > 0 && (
              <ul className="mt-2 space-y-1">
                {aiSummary.keyPoints.slice(0, 2).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-white/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
                    {pt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {actionContext && (
          <p className={`text-[11px] leading-relaxed italic ${hasAi ? 'text-zinc-500 border-t border-white/[0.04] pt-3' : 'text-white/70'}`}>{actionContext}</p>
        )}
      </div>
    </section>
  );
}
