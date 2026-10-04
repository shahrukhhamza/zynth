/**
 * PromoBanner — launch-offer strip shown to accounts that received Elite from the promotion
 * (user.promo_elite, set by the server while PROMO_ELITE_FREE is on). Dismissible; remembered
 * in localStorage so it does not reappear on every visit.
 */
import { useState } from 'react';
import { Crown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const DISMISS_KEY = 'zynth_promo_elite_dismissed';

export const PROMO_HEADLINE = 'Lucky you! The first 100 users get the Elite plan free';
export const PROMO_MESSAGE = 'You are one of them — every feature is unlocked for you, no payment needed.';

export default function PromoBanner() {
  const { user } = useAuth();
  const theme = useTheme();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (!user?.promo_elite || dismissed) return null;

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage unavailable */ }
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="shrink-0 flex items-center gap-3 px-4 py-2 text-sm"
      style={{
        background: theme.isDark ? 'rgba(202,138,4,0.14)' : 'rgba(202,138,4,0.10)',
        borderBottom: '1px solid rgba(202,138,4,0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Crown size={16} style={{ color: '#CA8A04', flexShrink: 0 }} />
      <p className="flex-1 text-xs sm:text-sm" style={{ color: theme.text }}>
        <strong>{'🎉'} {PROMO_HEADLINE}.</strong> {PROMO_MESSAGE}
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-1 rounded transition-opacity hover:opacity-70"
        style={{ color: theme.muted }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
