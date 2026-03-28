import { ArrowRight, Check, Crown, Rocket, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    badge: 'Smart Start',
    eyebrow: 'Built for traders building consistency',
    headline: 'Sharpen your execution with structured AI feedback.',
    valueAnchor: 'Trusted by traders building their first real edge',
    urgency: 'Start here, upgrade anytime',
    cta: 'Start With Pro',
    featured: false,
    icon: Rocket,
    features: [
      'Unlimited journal entries',
      '50 AI insights every month',
      'Advanced analytics dashboard',
      'Economic intelligence and macro context',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 19,
    badge: 'Most Powerful',
    eyebrow: 'For traders ready to operate without limits',
    headline: 'Unlock Full AI Trading Intelligence',
    valueAnchor: 'Used by top 5% of serious Zynth traders',
    urgency: 'Limited-time pricing for early members',
    cta: 'Unlock Full Power',
    featured: true,
    icon: Crown,
    features: [
      'Everything in Pro',
      'Unlimited AI insights — no cap',
      'Premium strategy breakdowns and deeper reporting',
      'Priority support and early feature access',
    ],
  },
];

function EliteCard({ plan, onCTA }) {
  const Icon = plan.icon;

  return (
    <div className="relative pt-5 md:pt-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-10 h-40 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-violet-500/25 to-cyan-400/25 blur-3xl"
      />
      <div className="relative rounded-[28px] bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 p-[1px] shadow-[0_30px_80px_rgba(76,29,149,0.28)] transition-all duration-300 md:scale-[1.04] md:hover:scale-[1.07]">
        <div className="relative overflow-hidden rounded-[27px] bg-white px-7 py-7 dark:bg-slate-950 md:px-8 md:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-gradient-to-br from-fuchsia-500/18 to-cyan-400/14 blur-3xl"
          />
          <div className="relative flex min-h-[560px] flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-fuchsia-700 dark:border-fuchsia-400/25 dark:bg-fuchsia-500/12 dark:text-fuchsia-300">
                  {plan.badge}
                </span>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {plan.eyebrow}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-cyan-400/15 text-violet-700 dark:text-cyan-300">
                <Icon size={22} />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                {plan.name}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                {plan.headline}
              </p>
            </div>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                ${plan.price}
              </span>
              <span className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                /month
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-fuchsia-500/8 to-cyan-400/8 px-4 py-3 dark:border-violet-500/20 dark:from-fuchsia-500/10 dark:to-cyan-400/10">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-cyan-300">
                Trade Without Limits
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Unlimited AI insights — no cap
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {plan.valueAnchor}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                {plan.urgency}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => {
                const highlighted = feature.includes('Unlimited AI insights');
                return (
                  <div key={feature} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3 dark:border-white/8 dark:bg-white/[0.03]">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/15 to-cyan-400/15 text-violet-700 dark:text-cyan-300">
                      <Check size={12} />
                    </div>
                    <span className={`text-sm leading-6 ${highlighted ? 'font-semibold text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-7">
              <button
                onClick={onCTA}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_40px_rgba(99,102,241,0.34)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_22px_55px_rgba(59,130,246,0.38)] active:scale-[0.98]"
                type="button"
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Premium access. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProCard({ plan, onCTA }) {
  const Icon = plan.icon;

  return (
    <div className="relative rounded-[28px] border border-slate-200/90 bg-white/80 p-7 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/8 dark:bg-slate-900/85 md:mt-6 md:scale-[0.97] md:hover:scale-[0.99]">
      <div className="flex min-h-[540px] flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              {plan.badge}
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {plan.eyebrow}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Icon size={20} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {plan.name}
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
            {plan.headline}
          </p>
        </div>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            ${plan.price}
          </span>
          <span className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            /month
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {plan.valueAnchor}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {plan.urgency}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/6 dark:bg-white/[0.02]">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <Check size={12} />
              </div>
              <span className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-7">
          <button
            onClick={onCTA}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-blue-600 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-slate-950"
            type="button"
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Flexible and low-risk.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage({ onBack }) {
  const { isDark } = useTheme();

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
              Pro gets you structured improvement. Elite removes every ceiling, unlocks unlimited AI intelligence, and gives serious traders the full Zynth operating system.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            {PLANS.map((plan) => (
              plan.featured
                ? <EliteCard key={plan.id} plan={plan} onCTA={handleCTA} />
                : <ProCard key={plan.id} plan={plan} onCTA={handleCTA} />
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-sm dark:border-white/8 md:flex-row">
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Monthly billing. 7-day refund guarantee. Upgrade or cancel anytime.
            </p>
            <div className={`flex items-center gap-5 text-xs uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Secure checkout</span>
              <span>Priority support</span>
              <span>Fast activation</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
