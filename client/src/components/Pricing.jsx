import { useState } from 'react';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN } from '../config/pricingPlans';
import { useTheme } from '../contexts/ThemeContext';

export default function Pricing({ onGetStarted, spotsLeft }) {
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [billingCycle, setBillingCycle] = useState(DEFAULT_BILLING_CYCLE);
  const { isDark } = useTheme();

  const handleContinue = () => {
    if (onGetStarted) {
      onGetStarted({ plan: selectedPlan, billingCycle });
    }
  };

  return (
    <section className={`relative overflow-hidden px-6 py-24 ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            isDark
              ? 'radial-gradient(55% 55% at 50% 0%, rgba(59,130,246,0.22) 0%, rgba(15,23,42,0) 70%)'
              : 'radial-gradient(55% 55% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className={`text-4xl font-black tracking-tight sm:text-5xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Institutional tools, retail pricing.
          </h2>
          <p className={`mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-[15px] ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Choose your plan and unlock the same intelligence stack used across the full Zynth workflow.
          </p>
          {typeof spotsLeft === 'number' && spotsLeft > 0 && (
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              {spotsLeft} founder spots left
            </p>
          )}
        </div>

        <PricingPlanSelector
          context="general"
          mode="full"
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
          onContinue={handleContinue}
          ctaLabel="Start Trading Smarter"
        />
      </div>
    </section>
  );
}