/**
 * UsageIndicator — compact card showing current plan + live usage stats.
 *
 * Placement: top of dashboard sidebar or header area.
 *
 * Usage:
 *   <UsageIndicator />
 *   <UsageIndicator compact />          // single-line variant
 *   <UsageIndicator onUpgrade={fn} />   // override click handler
 */
import { Zap, BookOpen, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan } from '../hooks/usePlan';
import { useUpgrade } from '../contexts/UpgradeContext';
import UsageProgressBar from './UsageProgressBar';

const PLAN_COLOR = {
  free:  { dot: '#94A3B8', label: 'Free',  badge: 'rgba(148,163,184,0.12)' },
  pro:   { dot: '#3B82F6', label: 'Pro',   badge: 'rgba(59,130,246,0.12)'  },
  elite: { dot: '#F59E0B', label: 'Elite', badge: 'rgba(245,158,11,0.12)'  },
};

export default function UsageIndicator({ compact = false, onUpgrade }) {
  const theme = useTheme();
  const {
    plan, isFree, isPro, isAdmin,
    aiRemaining, aiMonthlyUsed, planConfig,
    journalCount, maxJournal, journalRemaining,
  } = usePlan();
  const { openUpgradeModal } = useUpgrade();

  const pc = PLAN_COLOR[plan] ?? PLAN_COLOR.free;

  const aiLimit    = planConfig.aiAnalysesMonthly ?? planConfig.aiAnalysesLifetime ?? 2;
  const aiUsed     = planConfig.aiAnalysesMonthly != null ? aiMonthlyUsed : (planConfig.aiAnalysesLifetime ?? 2) - aiRemaining;
  const aiIsUnlimited = aiRemaining === Infinity;

  const journalIsUnlimited = maxJournal === Infinity;

  const handleUpgradeClick = () => {
    if (onUpgrade) return onUpgrade();
    openUpgradeModal({
      reason: 'Upgrade your plan to get higher limits and unlock all features.',
      requiredPlan: isFree ? 'pro' : 'elite',
    });
  };

  // ── compact (single line) ─────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 10px', borderRadius: 8,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          fontSize: 12,
        }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 7px', borderRadius: 5,
            background: pc.badge, color: pc.dot, fontWeight: 700, letterSpacing: 0.3,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: pc.dot, display: 'inline-block',
            }}
          />
          {pc.label}
        </span>

        <span style={{ color: theme.muted }}>
          <Zap size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {aiIsUnlimited ? '∞' : `${aiRemaining} AI left`}
        </span>

        <span style={{ color: theme.muted }}>
          <BookOpen size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {journalIsUnlimited ? '∞ trades' : `${journalRemaining} trades left`}
        </span>

        {!isAdmin && (isFree || isPro) && (
          <button
            onClick={handleUpgradeClick}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 5,
              background: 'rgba(59,130,246,0.14)',
              color: '#3B82F6', fontWeight: 700, fontSize: 11,
              border: 'none', cursor: 'pointer',
            }}
          >
            Upgrade <ArrowUpRight size={10} />
          </button>
        )}
      </div>
    );
  }

  // ── full card ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: pc.dot, display: 'inline-block', flexShrink: 0,
            }}
          />
          <span style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>
            {pc.label} Plan
          </span>
        </div>

        {!isAdmin && (isFree || isPro) && (
          <button
            onClick={handleUpgradeClick}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 7,
              background: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
              color: '#fff', fontSize: 11, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(59,130,246,0.28)',
            }}
          >
            Upgrade <ArrowUpRight size={11} />
          </button>
        )}
      </div>

      {/* AI usage row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: theme.muted, fontSize: 12 }}>
            <Zap size={12} />
            AI Analyses
          </span>
          <CountLabel
            used={aiUsed}
            limit={aiLimit}
            remaining={aiRemaining}
            isUnlimited={aiIsUnlimited}
            theme={theme}
          />
        </div>
        <UsageProgressBar
          used={aiUsed}
          limit={aiLimit}
          isUnlimited={aiIsUnlimited}
          colorScheme="blue"
        />
      </div>

      {/* Journal usage row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: theme.muted, fontSize: 12 }}>
            <BookOpen size={12} />
            Trade Journal
          </span>
          <CountLabel
            used={journalCount}
            limit={maxJournal}
            remaining={journalRemaining}
            isUnlimited={journalIsUnlimited}
            theme={theme}
          />
        </div>
        <UsageProgressBar
          used={journalCount}
          limit={maxJournal}
          isUnlimited={journalIsUnlimited}
          colorScheme="teal"
        />
      </div>

      {/* Nudge — only when either is critically low */}
      <NudgeRow
        aiRemaining={aiRemaining}
        journalRemaining={journalRemaining}
        isAdmin={isAdmin}
        isFree={isFree}
        theme={theme}
        onUpgrade={handleUpgradeClick}
      />
    </div>
  );
}

// ── internal helpers ──────────────────────────────────────────────────────────

function CountLabel({ used, limit, remaining, isUnlimited, theme }) {
  if (isUnlimited) {
    return <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>Unlimited</span>;
  }
  const isLow = remaining <= 2;
  const color  = remaining === 0 ? '#F43F5E' : isLow ? '#F59E0B' : theme.muted;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color }}>
      {used} / {limit}
      {isLow && remaining > 0 && (
        <span style={{ marginLeft: 4, opacity: 0.85 }}>({remaining} left)</span>
      )}
    </span>
  );
}

function NudgeRow({ aiRemaining, journalRemaining, isAdmin, isFree, theme, onUpgrade }) {
  if (isAdmin) return null;

  const aiLow      = aiRemaining !== Infinity && aiRemaining <= 2;
  const journalLow = journalRemaining !== Infinity && journalRemaining <= 2;

  if (!aiLow && !journalLow) return null;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', borderRadius: 8,
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.18)',
      }}
    >
      <span style={{ fontSize: 11.5, color: '#F59E0B', lineHeight: 1.4, maxWidth: 180 }}>
        Running low — upgrade to avoid interruption
      </span>
      <button
        onClick={onUpgrade}
        style={{
          fontSize: 11, fontWeight: 700, color: '#F59E0B',
          background: 'none', border: 'none', cursor: 'pointer',
          textDecoration: 'underline', padding: 0, flexShrink: 0,
        }}
      >
        Upgrade
      </button>
    </div>
  );
}
