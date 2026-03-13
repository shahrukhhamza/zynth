import { Lock, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Inline banner shown when a feature is gated behind a paid plan.
 *
 * Props:
 *   feature       — short name of the feature, e.g. "AI Analysis"
 *   requiredPlan  — "Pro" | "Elite"
 *   description   — one-line description of what they're missing
 *   onUpgradeClick — called when the user clicks "Upgrade"
 */
export default function PlanGateBanner({ feature, requiredPlan = 'Pro', description, onUpgradeClick }) {
  const theme = useTheme();

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-4"
      style={{
        backgroundColor: theme.isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)',
        borderColor: theme.isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.3)',
      }}
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
        style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
      >
        <Lock className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: theme.text }}>
          {feature ? `${feature} requires ${requiredPlan}` : `${requiredPlan} plan required`}
        </p>
        {description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.muted }}>
            {description}
          </p>
        )}
      </div>

      {onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ backgroundColor: theme.accent }}
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </button>
      )}
    </div>
  );
}
