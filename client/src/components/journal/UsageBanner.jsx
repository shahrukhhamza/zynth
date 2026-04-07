import { TrendingUp, Zap, ArrowRight, BarChart2 } from 'lucide-react';
import { usePlan } from '../../hooks/usePlan';
import { useUpgrade } from '../../contexts/UpgradeContext';

/**
 * UsageBanner — progressive upgrade nudge for journal usage.
 *
 * Three states (free plan only):
 *   • Early  (<50%) — subtle, neutral info bar
 *   • Mid   (50–99%) — amber warning with pulsing accent, CTA button
 *   • Limit (100%) — consumed: JournalUpgradePrompt takes over in parent
 *
 * Returns null for Pro / Elite / Admin users and at 100% (parent handles that).
 */
export default function UsageBanner({ count: livCount }) {
  const { isFree, journalCount: hookCount, maxJournal } = usePlan();
  const { openUpgradeModal } = useUpgrade();

  // Prefer live count from parent (actual API total) over stale user object
  const journalCount    = livCount ?? hookCount;
  const limitReached    = maxJournal !== Infinity && maxJournal > 0 && journalCount >= maxJournal;

  // Only relevant for capped free users that haven't hit the limit yet
  if (!isFree || limitReached || maxJournal === Infinity || maxJournal <= 0) return null;

  const pct       = Math.min(100, Math.round((journalCount / maxJournal) * 100));
  const remaining = maxJournal - journalCount;
  const isMid     = pct >= 50;

  const handleUpgrade = () => {
    openUpgradeModal({
      reason:       'Upgrade to Pro for unlimited trade journaling.',
      requiredPlan: 'pro',
      headline:     'Unlock Unlimited Journaling',
      message:      "You're building your edge — don't let a limit slow you down.",
    });
  };

  /* ── Shared progress bar ──────────────────────────────────────────────── */
  const ProgressBar = () => (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: 4, background: isMid ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: isMid
            ? 'linear-gradient(90deg, #f59e0b, #fb923c)'
            : 'linear-gradient(90deg, #CA8A04, #CA8A04)',
        }}
      />
    </div>
  );

  /* ── EARLY STAGE (< 50%) ─────────────────────────────────────────────── */
  if (!isMid) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
        style={{
          background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <BarChart2 className="w-4 h-4 flex-shrink-0" style={{ color: '#CA8A04' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: '#CA8A04' }}>
              Journal Usage
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: '#CA8A04' }}>
              {journalCount}/{maxJournal}
            </span>
          </div>
          <ProgressBar />
        </div>
      </div>
    );
  }

  /* ── MID STAGE (50–99%) ──────────────────────────────────────────────── */
  return (
    <div
      className="relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
      style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderLeft: '3px solid #f59e0b',
      }}
    >
      {/* Glow pulse ring on icon */}
      <div className="relative flex-shrink-0">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ background: 'rgba(245,158,11,0.5)' }}
        />
        <Zap className="relative w-4 h-4" style={{ color: '#f59e0b' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>
            Nearing your limit — {journalCount}/{maxJournal} journals used
          </span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#f59e0b' }}>
            {remaining} left
          </span>
        </div>
        <ProgressBar />
      </div>

      <button
        onClick={handleUpgrade}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.35)',
          color: '#fbbf24',
          letterSpacing: '0.03em',
        }}
      >
        Upgrade
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
