import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN } from '../config/pricingPlans';

export default function PricingPage({ onBack }) {
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [billingCycle, setBillingCycle] = useState(DEFAULT_BILLING_CYCLE);

  const handleCTA = () => {
    if (onBack) {
      onBack();
      return;
    }
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0b0f] text-white' : 'bg-[#fafaf9] text-zinc-950'}`}>
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'border-white/8 bg-[#0b0b0f]/88' : 'border-zinc-200/80 bg-[#fafaf9]/88'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark size={34} />
            <span className="text-base font-black tracking-tight">Zynth</span>
          </div>

          <button
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${isDark ? 'border-white/10 text-zinc-300 hover:text-white' : 'border-zinc-200 text-zinc-500 hover:text-zinc-950'}`}
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
            type="button"
          >
            ← Back
          </button>
        </div>
      </nav>

      <main className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500/12 via-amber-500/12 to-yellow-400/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${isDark ? 'border-[#CA8A04]/35 bg-[#CA8A04]/10 text-[#FBBF24]' : 'border-[#CA8A04]/35 bg-[#CA8A04]/10 text-[#8a5a05]'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              Pricing
            </span>
            <h1 className="font-display mt-6 text-[clamp(36px,8vw,68px)] font-bold uppercase leading-[0.98] tracking-[-0.025em]">
              Simple pricing. <span className="text-[#CA8A04]">Serious results.</span>
            </h1>
            <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Start free and upgrade only when you want deeper insight. Pay with USDT (TRC20) or JazzCash. Plans activate after you submit a payment, and nothing is ever charged automatically.
            </p>
          </div>

          <PricingPlanSelector
            context="general"
            mode="full"
            className="mt-14"
            title="Pick the plan that fits how you trade"
            subtitle="Elite includes every feature with no limits. Pro is a solid step up from Free for traders building consistency."
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            onPrimaryAction={handleCTA}
          />

          <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white/70 p-5 text-center text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-white/8 dark:bg-zinc-900/70 dark:text-zinc-300">
            The Free plan stays free forever: 5 journal entries, 2 AI trade analyses, the core analytics dashboard and the profit and risk calculators.
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Alternative payment options available via email support@zynth.com
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
