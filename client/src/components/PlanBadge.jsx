import { usePlanGate } from '../hooks/usePlanGate';
import { useTheme } from '../contexts/ThemeContext';

const PLAN_STYLES_DARK = {
  free:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)', label: 'Basic' },
  pro:   { bg: 'rgba(202,138,4,0.15)',  color: '#CA8A04', border: 'rgba(202,138,4,0.4)',  label: 'Pro' },
  elite: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.4)',  label: 'Elite' },
  admin: { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa', border: 'rgba(139,92,246,0.4)',  label: 'Admin' },
};

const PLAN_STYLES_LIGHT = {
  free:  { bg: '#f3f3f3',          color: '#555555', border: '#e0e0e0',          label: 'Basic' },
  pro:   { bg: 'rgba(202,138,4,0.12)',  color: '#ea580c', border: 'rgba(202,138,4,0.3)', label: 'Pro' },
  elite: { bg: 'rgba(245,158,11,0.12)',  color: '#d97706', border: 'rgba(245,158,11,0.3)', label: 'Elite' },
  admin: { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', border: 'rgba(139,92,246,0.3)', label: 'Admin' },
};

/**
 * Small pill badge showing the current user's plan.
 * Renders nothing when there is no authenticated user.
 */
export default function PlanBadge({ className = '' }) {
  const { plan, isAdmin } = usePlanGate();
  const { isDark } = useTheme();
  const PLAN_STYLES = isDark ? PLAN_STYLES_DARK : PLAN_STYLES_LIGHT;
  const key = isAdmin ? 'admin' : (plan in PLAN_STYLES ? plan : 'free');
  const s = PLAN_STYLES[key];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider select-none ${className}`}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: '0.1em',
      }}
    >
      {s.label}
    </span>
  );
}
