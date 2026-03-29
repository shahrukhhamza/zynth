import { useState } from 'react';
import { Lock, Rocket, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUpgrade } from '../../contexts/UpgradeContext';
import PricingPlanSelector from '../pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN } from '../../config/pricingPlans';

export default function JournalUpgradePrompt() {
  const theme = useTheme();
  const { openUpgradeModal } = useUpgrade();
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [billingCycle, setBillingCycle] = useState(DEFAULT_BILLING_CYCLE);

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 transition-all duration-300"
      style={{
        background: theme.isDark
          ? 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.97) 100%)'
          : theme.surface,
        border: theme.isDark
          ? '1px solid rgba(99,102,241,0.22)'
          : '1px solid rgba(99,102,241,0.16)',
        boxShadow: theme.isDark
          ? '0 0 0 1px rgba(99,102,241,0.06), 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 0 0 1px rgba(99,102,241,0.04), 0 8px 30px rgba(0,0,0,0.07)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background: theme.isDark
            ? 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.14) 0%, transparent 55%)'
            : 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}
          >
            <Lock className="h-3 w-3" /> Free Plan Limit
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}
          >
            <Sparkles className="h-3 w-3" /> Most traders upgrade here
          </span>
        </div>

        <div className="mb-5 flex items-start gap-3.5">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 4px 14px rgba(99,102,241,0.45)' }}
          >
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-[18px] font-extrabold leading-tight" style={{ color: theme.text }}>
              You&apos;re hitting your trading ceiling.
            </h3>
            <p className="mt-1 text-sm leading-snug" style={{ color: theme.muted }}>
              Your patterns are just getting clear — don&apos;t stop now.
            </p>
          </div>
        </div>

        <PricingPlanSelector
          context="journal"
          mode="compact"
          title="Unlock unlimited journaling and premium AI review"
          subtitle="Elite is selected by default because it removes every ceiling. Pro stays available if you want the lighter step up first."
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
          onPrimaryAction={(plan, cycle) => openUpgradeModal({
            reason: 'You have reached the free plan journal limit.',
            requiredPlan: plan,
            billingCycle: cycle,
            headline: 'Unlock Full Zynth',
            message: "You've started building your edge. Don't stop now.",
          })}
        />
      </div>
    </div>
  );
}
