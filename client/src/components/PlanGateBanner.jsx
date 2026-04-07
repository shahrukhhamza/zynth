import { Lock, Sparkles } from 'lucide-react';

/**
 * Inline banner shown when a feature is gated behind a paid plan.
 *
 * Props:
 *   feature        — short name of the feature, e.g. "AI Analysis"
 *   requiredPlan   — "Pro" | "Elite"
 *   description    — one-line description of what they're missing
 *   onUpgradeClick — called when the user clicks "Upgrade"
 */
export default function PlanGateBanner({ feature, requiredPlan = 'Pro', description, onUpgradeClick }) {
  const isElite = requiredPlan.toLowerCase() === 'elite';

  return (
    <div className="
      relative overflow-hidden rounded-2xl border mb-4 p-5
      bg-gradient-to-br from-yellow-50 to-amber-50
      border-yellow-200/60
      dark:from-zinc-900 dark:to-zinc-800
      dark:border-yellow-500/20
    ">
      {/* Subtle glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20
        bg-gradient-to-br from-yellow-400 to-yellow-500 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-yellow-600 to-yellow-600
          shadow-[0_4px_14px_rgba(202,138,4,0.35)]
        ">
          <Lock className="w-4 h-4 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold text-zinc-900 dark:text-white">
              {feature ? `Unlock ${feature}` : 'Unlock This Feature'}
            </p>
            <span className="
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
              uppercase tracking-widest
              bg-yellow-100 text-yellow-700 border border-yellow-200
              dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/25
            ">
              {requiredPlan}
            </span>
          </div>
          {description && (
            <p className="text-[12px] mt-1 leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>

        {/* CTA */}
        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="
              flex-shrink-0 inline-flex items-center gap-1.5
              px-4 py-2 rounded-lg text-[13px] font-semibold text-white
              bg-gradient-to-r from-yellow-600 to-yellow-600
              shadow-[0_2px_10px_rgba(202,138,4,0.35)]
              hover:from-yellow-700 hover:to-yellow-700
              hover:shadow-[0_4px_16px_rgba(202,138,4,0.45)]
              active:scale-[0.97] transition-all duration-150
              border-0 cursor-pointer
            "
          >
            <Sparkles className="w-3 h-3" />
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}
