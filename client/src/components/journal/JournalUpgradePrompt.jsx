import { useState } from 'react';
import { Lock, Zap, ArrowRight, BookOpen, Brain, BarChart2, CheckCircle2, Activity, Fingerprint, TrendingUp, Sparkles } from 'lucide-react';
import { useUpgrade } from '../../contexts/UpgradeContext';

const DEFAULT_FEATURES = [
  { icon: BookOpen,  text: 'Unlimited trade entries' },
  { icon: Brain,     text: 'AI-powered analysis on every entry' },
  { icon: BarChart2, text: 'Performance insights & patterns' },
];

export const PERFORMANCE_FEATURES = [
  { icon: BarChart2,  text: 'Full performance analytics dashboard' },
  { icon: TrendingUp, text: 'Win rate, P&L & drawdown charts' },
  { icon: Brain,      text: 'AI-driven pattern detection' },
];

export const INSIGHTS_FEATURES = [
  { icon: Sparkles,   text: 'AI-generated weekly & monthly coaching reports' },
  { icon: Brain,      text: 'Psychological assessment & bias detection' },
  { icon: BarChart2,  text: 'Personalised action items from your trade data' },
];

export const MACRO_FEATURES = [
  { icon: Activity,   text: 'Macro-to-trade impact mapping' },
  { icon: BarChart2,  text: 'Economic event correlation scores' },
  { icon: TrendingUp, text: 'High-impact event trade filters' },
];

export const DNA_FEATURES = [
  { icon: Fingerprint, text: 'Trader archetype & 8-trait DNA score' },
  { icon: Brain,       text: 'AI coach letter & improvement plan' },
  { icon: BarChart2,   text: 'Performance fingerprint over time' },
];

/**
 * Generic upgrade gate card — used by all journal sub-tabs.
 *
 * Props:
 *  headline        - main heading text
 *  description     - body paragraph
 *  badge           - pill label (default "Pro Feature")
 *  features        - array of { icon, text }
 *  openWith        - object passed to openUpgradeModal()
 *  ctaLabel        - CTA button label
 *  lockIcon        - lucide icon component for the badge (default Lock)
 */
export default function JournalUpgradePrompt({
  headline    = "You've reached your free limit",
  description = 'Upgrade to log unlimited trades and get AI-powered analysis on every entry.',
  badge       = 'Pro Feature',
  features    = DEFAULT_FEATURES,
  ctaLabel    = 'Upgrade to continue',
  lockIcon: LockIcon = Lock,
  openWith    = {
    reason:       'You have reached the free plan journal limit.',
    requiredPlan: 'pro',
    headline:     'Unlock Full Zynth',
    message:      "You've started building your edge. Don't stop now.",
  },
}) {
  const { openUpgradeModal } = useUpgrade();
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '48px 28px 36px',
      borderRadius: 20,
      background: 'var(--z-modal)',
      border: '1px solid rgba(99,102,241,0.28)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 480, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)', filter: 'blur(28px)' }} />
      </div>

      {/* Icon badge with pulse ring */}
      <div style={{ position: 'relative', marginBottom: 24, zIndex: 1 }}>
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.25)',
          animation: 'jup-ring 2.4s ease-in-out infinite',
        }} />
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
        }}>
          <LockIcon size={26} color="#a5b4fc" />
        </div>
        {/* Zap badge */}
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
          border: '2px solid var(--z-modal)',
        }}>
          <Zap size={10} color="#fff" />
        </div>
      </div>

      {/* Badge pill */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, zIndex: 1,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 12px', borderRadius: 99, marginBottom: 14,
        background: 'var(--z-badge-bg)',
        border: '1px solid var(--z-badge-bdr)',
        color: 'var(--z-badge-text)',
      }}>
        <Zap size={10} /> {badge}
      </span>

      {/* Headline */}
      <h3 style={{
        fontSize: 24, fontWeight: 900, lineHeight: 1.25,
        margin: '0 0 10px', zIndex: 1,
        background: 'var(--z-h-grad)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        {headline}
      </h3>

      {/* Subtext */}
      <p style={{
        fontSize: 14, lineHeight: 1.7, color: 'var(--z-muted)',
        margin: '0 0 24px', maxWidth: 380, zIndex: 1,
      }}>
        {description}
      </p>

      {/* Feature rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340, marginBottom: 28, zIndex: 1 }}>
        {features.map(({ icon: Icon, text }, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px', borderRadius: 12, textAlign: 'left',
            background: 'var(--z-surface)',
            border: '1px solid var(--z-border-sm)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <Icon size={15} color="#CA8A04" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-text2)', flex: 1 }}>{text}</span>
            <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => openUpgradeModal(openWith)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', maxWidth: 340, padding: '15px 32px',
          borderRadius: 14, border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 800, color: '#fff', zIndex: 1,
          background: hovered ? 'linear-gradient(135deg, #A16207, #7c3aed)' : 'linear-gradient(135deg, #CA8A04, #8b5cf6)',
          boxShadow: hovered ? '0 8px 32px rgba(99,102,241,0.55)' : '0 4px 20px rgba(99,102,241,0.38)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.18s ease',
        }}
      >
        <Zap size={16} />
        {ctaLabel}
        <ArrowRight size={15} style={{ opacity: 0.8 }} />
      </button>

      {/* Trust strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
        {[
          'From $8.90/mo',
          'Cancel anytime',
          '2,000+ traders upgraded',
        ].map((t) => (
          <span key={t} style={{ fontSize: 12, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} color="#34d399" /> {t}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes jup-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
