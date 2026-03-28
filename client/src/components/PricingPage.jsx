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
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-[#f5f7fb] text-slate-950'}`}>
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'border-white/8 bg-slate-950/88' : 'border-slate-200/80 bg-[#f5f7fb]/88'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark size={34} />
            <span className="text-base font-black tracking-tight">Zynth</span>
          </div>

          <button
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${isDark ? 'border-white/10 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-950'}`}
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
          <div className="absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/12 via-fuchsia-500/12 to-cyan-400/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${isDark ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              Pricing
            </span>
            <h1 className="mt-6 text-[clamp(36px,8vw,64px)] font-black tracking-[-0.04em]">
              Choose your edge. <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent">Trade at full power.</span>
            </h1>
            <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Every paid upgrade surface in Zynth now follows one pricing system: Elite leads with full-power positioning, Pro stays available as the safer step, and billing stays consistent everywhere.
            </p>
          </div>

          <PricingPlanSelector
            context="general"
            mode="full"
            className="mt-14"
            title="Pick the plan that matches your ambition"
            subtitle="Elite is the premium, no-limits path. Pro remains the structured starting point for traders who want steady improvement."
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            onPrimaryAction={handleCTA}
          />

          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/70 p-5 text-center text-sm text-slate-600 shadow-sm backdrop-blur dark:border-white/8 dark:bg-slate-900/70 dark:text-slate-300">
            Free plan is still available with journaling basics, market discovery, and starter AI access. Upgrade when you want deeper insight and full intelligence.
          </div>
        </div>
      </main>
    </div>
  );
}
