/**
 * UpgradeNudgeBanner — subtle near-limit warning strip.
 *
 * Shown only when a free user has exactly 1 AI analysis remaining (urgencyLevel === 'warning').
 * Dismissed per session. Never shown to paid users or admins.
 * Position: fixed below the 64 px header, full-width.
 */
import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan } from '../hooks/usePlan';
import { useUpgrade } from '../contexts/UpgradeContext';

const BANNER_DISMISS_KEY = 'zynth_nudge_banner_dismissed';

export default function UpgradeNudgeBanner({ urgencyLevel }) {
  const theme = useTheme();
  const { isFree, isAdmin } = usePlan();
  const { openUpgradeModal } = useUpgrade();

  const [dismissed, setDismissed] = useState(
    () => { try { return sessionStorage.getItem(BANNER_DISMISS_KEY) === '1'; } catch { return false; } },
  );

  // Only render for free users at warning level (exactly 1 analysis left), not dismissed
  if (isAdmin || !isFree || urgencyLevel !== 'warning' || dismissed) return null;

  function dismiss() {
    try { sessionStorage.setItem(BANNER_DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  }

  function handleUpgrade() {
    dismiss();
    openUpgradeModal({
      reason:       "You have 1 AI analysis left. Upgrade to keep your edge.",
      requiredPlan: 'pro',
      headline:     '1 AI analysis remaining',
      message:      "You're almost at your limit. Upgrade now to unlock unlimited AI insights and never lose momentum.",
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 18px',
        background: theme.isDark
          ? 'rgba(245,158,11,0.10)'
          : 'rgba(245,158,11,0.09)',
        borderBottom: '1px solid rgba(245,158,11,0.24)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Zap size={13} color="#F59E0B" style={{ flexShrink: 0 }} />

      <span style={{ flex: 1, fontSize: 12.5, color: theme.text, lineHeight: 1.4 }}>
        <strong style={{ color: '#F59E0B' }}>1 AI analysis left</strong>
        {' '}— upgrade before you run out and lose your trading edge.
      </span>

      <button
        onClick={handleUpgrade}
        style={{
          flexShrink: 0,
          padding: '4px 13px',
          borderRadius: 7,
          background: '#F59E0B',
          color: '#000',
          fontSize: 11.5,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Upgrade Now
      </button>

      <button
        onClick={dismiss}
        aria-label="Dismiss warning"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: theme.muted,
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = theme.text; }}
        onMouseLeave={e => { e.currentTarget.style.color = theme.muted; }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
