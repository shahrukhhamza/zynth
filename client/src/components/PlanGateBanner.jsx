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
      bg-gradient-to-br from-blue-50 to-indigo-50
      border-blue-200/60
      dark:from-slate-900 dark:to-slate-800
      dark:border-blue-500/20
    ">
      {/* Subtle glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20
        bg-gradient-to-br from-blue-400 to-indigo-500 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          bg-gradient-to-br from-blue-600 to-indigo-600
          shadow-[0_4px_14px_rgba(99,102,241,0.35)]
        ">
          <Lock className="w-4 h-4 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold text-gray-900 dark:text-white">
              {feature ? `Unlock ${feature}` : 'Unlock This Feature'}
            </p>
            <span className="
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
              uppercase tracking-widest
              bg-blue-100 text-blue-700 border border-blue-200
              dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25
            ">
              {requiredPlan}
            </span>
          </div>
          {description && (
            <p className="text-[12px] mt-1 leading-relaxed text-gray-500 dark:text-gray-400">
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
              bg-gradient-to-r from-blue-600 to-indigo-600
              shadow-[0_2px_10px_rgba(99,102,241,0.35)]
              hover:from-blue-700 hover:to-indigo-700
              hover:shadow-[0_4px_16px_rgba(99,102,241,0.45)]
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
