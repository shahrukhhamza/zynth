import { Lock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUpgrade } from '../../contexts/UpgradeContext';

export default function JournalUpgradePrompt() {
  const theme = useTheme();
  const { openUpgradeModal } = useUpgrade();

  return (
    <div style={{
      borderRadius: 16,
      padding: '36px 28px',
      textAlign: 'center',
      background: theme.isDark ? '#0d1120' : '#ffffff',
      border: theme.isDark ? '1px solid rgba(99,102,241,0.28)' : '1px solid rgba(99,102,241,0.18)',
      boxShadow: theme.isDark ? '0 8px 32px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.06)',
    }}>

      {/* Icon */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, borderRadius: 12, marginBottom: 18,
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.3)',
      }}>
        <Lock size={18} color="#818cf8" />
      </div>

      {/* Headline */}
      <h3 style={{
        fontSize: 18, fontWeight: 700, lineHeight: 1.3,
        color: theme.isDark ? '#f1f5f9' : '#0d1117',
        margin: '0 0 8px',
      }}>
        You&apos;ve reached your free limit
      </h3>

      {/* Benefit */}
      <p style={{
        fontSize: 14, lineHeight: 1.6,
        color: theme.isDark ? '#94a3b8' : '#64748b',
        margin: '0 0 24px',
      }}>
        Upgrade to log unlimited trades and get AI-powered analysis on every entry.
      </p>

      {/* CTA */}
      <button
        onClick={() => openUpgradeModal({
          reason: 'You have reached the free plan journal limit.',
          requiredPlan: 'pro',
          headline: 'Unlock Full Zynth',
          message: "You've started building your edge. Don't stop now.",
        })}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '11px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          transition: 'opacity 0.15s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Upgrade to continue &rarr;
      </button>

      {/* Pricing hint + social proof */}
      <p style={{
        fontSize: 12, margin: '12px 0 0',
        color: theme.isDark ? '#6b7280' : '#94a3b8',
      }}>
        From $9/mo &middot; Most users upgrade here
      </p>

    </div>
  );
}
