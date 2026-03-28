import { useTheme } from '../../contexts/ThemeContext';
import { usePlan } from '../../hooks/usePlan';
import { useUpgrade } from '../../contexts/UpgradeContext';
import { Lock, Rocket, BarChart2, BrainCircuit, Dna, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

const BENEFITS = [
  { icon: TrendingUp,   text: 'Unlimited trade journaling' },
  { icon: BrainCircuit, text: 'Advanced AI insights & pattern detection' },
  { icon: BarChart2,    text: 'Full performance analytics' },
  { icon: Dna,          text: 'Trading DNA & macro correlation' },
];

/**
 * JournalUpgradePrompt — full-screen upgrade card shown when the free plan
 * journal limit is reached. Renders in place of the trade entry form.
 */
export default function JournalUpgradePrompt({ total }) {
  const theme = useTheme();
  const { journalCount: hookCount } = usePlan();
  const journalCount = total ?? hookCount;
  const { openUpgradeModal } = useUpgrade();

  const handleUpgrade = (view = 'pro') => {
    openUpgradeModal({
      reason:       'You have reached the free plan journal limit.',
      requiredPlan: 'pro',
      headline:     'Unlock Full Zynth',
      message:      "You've started building your edge. Don't stop now.",
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
      style={{
        background: theme.isDark
          ? 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.97) 100%)'
          : theme.surface,
        border: theme.isDark
          ? '1px solid rgba(99,102,241,0.28)'
          : '1px solid rgba(99,102,241,0.22)',
        boxShadow: theme.isDark
          ? '0 0 0 1px rgba(99,102,241,0.08), 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 0 0 1px rgba(99,102,241,0.06), 0 8px 30px rgba(0,0,0,0.07)',
        backdropFilter: 'blur(16px)',
        animation: 'journal-upgrade-fadein 0.35s ease-out both',
      }}
    >
      <style>{`
        @keyframes journal-upgrade-fadein {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>

      {/* Top gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: theme.isDark
          ? 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.14) 0%, transparent 55%)'
          : 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.06) 0%, transparent 55%)' }}
      />

      {/* ── Badge row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}
        >
          <Lock className="w-2.5 h-2.5" /> Free Plan Limit
        </span>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}
        >
          <Sparkles className="w-2.5 h-2.5" /> Most traders upgrade here
        </span>
      </div>

      {/* ── Headline ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3.5 mb-2">
        <div
          className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 4px 14px rgba(99,102,241,0.45)' }}
        >
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-[17px] leading-tight" style={{ color: theme.text }}>
            You've reached your free plan limit
          </h3>
          <p className="text-sm mt-0.5 leading-snug" style={{ color: theme.muted }}>
            You've started building your edge. Don't stop now.
          </p>
        </div>
      </div>

      {/* ── Progress psychology ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mt-3 mb-4"
        style={{
          background: theme.isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.06)',
          border: `1px solid ${theme.isDark ? 'rgba(99,102,241,0.14)' : 'rgba(99,102,241,0.18)'}`,
        }}
      >
        <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#818cf8' }} />
        <p className="text-xs leading-snug" style={{ color: '#818cf8' }}>
          You've logged <span className="font-bold" style={{ color: theme.isDark ? '#fff' : '#1e293b' }}>{journalCount} trade{journalCount !== 1 ? 's' : ''}</span> — imagine the insights at 100+
        </p>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="my-4" style={{ borderTop: `1px solid ${theme.border}` }} />

      {/* ── Benefits ────────────────────────────────────────────────────────── */}
      <ul className="space-y-2.5 mb-5">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <div
              className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: theme.isDark ? 'rgba(99,102,241,0.14)' : 'rgba(99,102,241,0.10)' }}
            >
              <Icon className="w-3 h-3" style={{ color: '#818cf8' }} />
            </div>
            <span className="text-sm" style={{ color: theme.textSecondary }}>{text}</span>
          </li>
        ))}
      </ul>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={() => handleUpgrade('pro')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            boxShadow: '0 4px 18px rgba(99,102,241,0.5)',
          }}
        >
          <Rocket className="w-4 h-4" />
          Unlock Full Zynth
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleUpgrade('plans')}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: theme.surface2,
            border: `1px solid ${theme.border}`,
            color: theme.muted,
          }}
        >
          View Plans
        </button>
      </div>

      {/* ── Micro-trust line ─────────────────────────────────────────────────── */}
      <p className="text-center text-[11px] mt-3" style={{ color: theme.muted }}>
        Takes less than 30 seconds
      </p>
    </div>
  );
}
