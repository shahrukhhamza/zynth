import { useEffect, useMemo } from 'react';
import { ArrowRight, Check, Crown, Flame, Rocket, Sparkles, TrendingUp } from 'lucide-react';
import {
  DEFAULT_BILLING_CYCLE,
  DEFAULT_SELECTED_PLAN,
  getPaidPlansInDisplayOrder,
  getPlanDisplay,
} from '../../config/pricingPlans';

const PLAN_ICONS = {
  pro: Rocket,
  elite: Crown,
};

const CONTEXT_COPY = {
  ai: {
    title: 'Unlock Unlimited AI Insights',
    subtitle: 'Your edge compounds faster when AI feedback is always on and never throttled.',
    compactSubtitle: '50 insights run out fast. Elite traders never stop mid-analysis.',
    ctaByPlan: {
      elite: 'Unlock Unlimited AI 🚀',
      pro: 'Start With 50 Credits',
    },
  },
  journal: {
    title: 'Track Trades Like Professionals',
    subtitle: 'Turn raw executions into repeatable systems with premium journaling intelligence.',
    compactSubtitle: 'Remove journal limits and unlock structured AI review.',
    ctaByPlan: {
      elite: 'Remove All Limits 🚀',
      pro: 'Start Journaling',
    },
  },
  upgrade: {
    title: 'Unlock Full Zynth',
    subtitle: 'Elite yearly is the highest-value path for serious traders who want zero limits.',
    compactSubtitle: 'Pick a plan and continue in under 10 seconds.',
    ctaByPlan: {
      elite: 'Remove All Limits 🚀',
      pro: 'Unlock Full Power',
    },
  },
  general: {
    title: 'Choose the plan that accelerates your edge',
    subtitle: 'Elite yearly is pre-selected because it delivers full capability with the best annual value.',
    compactSubtitle: 'Serious traders choose Elite. Pick your plan.',
    ctaByPlan: {
      elite: 'Unlock Full AI Power 🚀',
      pro: 'Get Started With Pro',
    },
  },
};

// Context-specific pain and freedom hooks shown inside compact cards
const COMPACT_HOOKS = {
  pro: {
    ai:      { value: '50 AI insights per month — consistent, every month', identity: 'A solid structured starting point' },
    journal: { value: 'Unlimited journal entries included', identity: 'Build the review habit consistently' },
    upgrade: { value: 'Full access to core tools', identity: 'A great plan to start with' },
    general: { value: 'Full access to core features', identity: 'Structured and reliable' },
  },
  elite: {
    ai:      { freedom: 'Unlimited AI — always on, never interrupted.', identity: 'For traders who need full, uninterrupted flow' },
    journal: { freedom: 'Full journaling with unlimited AI review.', identity: 'Built for serious, improving traders' },
    upgrade: { freedom: 'Every feature. No limits. Full power.', identity: 'The complete Zynth experience' },
    general: { freedom: 'Full capability. Zero restrictions.', identity: 'Built for traders ready to go all-in' },
  },
};

function CompactPlanCard({ plan, selected, billingCycle, onSelect, context, priceOverrides, anchoredPriceOverrides }) {
  const display = getPlanDisplay(plan.id, billingCycle, {
    priceOverrides,
    anchoredPriceOverrides,
  });
  const isElite = plan.id === 'elite';
  const ctx = context ?? 'general';
  const eliteHook = COMPACT_HOOKS.elite[ctx] ?? COMPACT_HOOKS.elite.general;
  const proHook   = COMPACT_HOOKS.pro[ctx]   ?? COMPACT_HOOKS.pro.general;

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`group relative flex flex-col rounded-2xl border p-3 text-left transition-all duration-200
        ${isElite
          ? 'bg-gradient-to-br from-violet-500/8 via-purple-500/6 to-indigo-500/8 dark:from-violet-500/12 dark:via-purple-500/8 dark:to-indigo-500/10'
          : 'bg-white dark:bg-slate-800/50'}
        ${selected
          ? isElite
            ? 'border-violet-400/60 shadow-[0_8px_24px_rgba(109,40,217,0.18)] dark:border-violet-500/50'
            : 'border-slate-400 shadow-md dark:border-slate-500'
          : 'border-slate-200/80 shadow-sm dark:border-slate-700/60'}`}
    >
      {/* Header: badge + price */}
      <div className="flex items-start justify-between gap-1">
        {isElite ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/40 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300">
            🔥 Most Popular
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
            {plan.badge}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-2 flex items-end gap-1">
        {display.anchoredAmount && display.anchoredAmount > display.amount && (
          <span className="text-[11px] font-semibold text-slate-400 line-through dark:text-slate-500">
            ${display.anchoredAmount}
          </span>
        )}
        <span className={`text-xl font-black tracking-tight ${isElite ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
          ${display.amount}
        </span>
        <span className="pb-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{display.suffix}</span>
      </div>
      <p className={`mt-0.5 text-sm font-bold ${isElite ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
        {plan.name}
      </p>

      {/* Psychological hook */}
      {isElite ? (
        <div className="mt-2 rounded-lg border border-violet-200/70 bg-violet-50/70 px-2.5 py-1.5 dark:border-violet-500/25 dark:bg-violet-500/12">
          <p className="text-[11px] font-semibold leading-4 text-violet-800 dark:text-violet-300">
            {eliteHook.freedom}
          </p>
          <p className="mt-0.5 text-[10px] text-violet-600/70 dark:text-violet-400/70">
            {eliteHook.identity}
          </p>
        </div>
      ) : (
        <div className="mt-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 dark:border-slate-600/40 dark:bg-slate-700/30">
          <p className="text-[11px] font-semibold leading-4 text-slate-700 dark:text-slate-300">
            {proHook.value}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            {proHook.identity}
          </p>
        </div>
      )}

      {/* Savings */}
      {billingCycle === 'annual' && display.savings > 0 && (
        <p className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          Save ${display.savings}/year
        </p>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className={`mt-auto pt-2 flex items-center gap-1 text-[10px] font-bold ${isElite ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Check size={10} />
          Selected
        </div>
      )}
    </button>
  );
}

function PlanCard({ plan, billingCycle, selected, onSelect, context, priceOverrides, anchoredPriceOverrides }) {
  const Icon = PLAN_ICONS[plan.id] ?? Rocket;
  const display = getPlanDisplay(plan.id, billingCycle, {
    priceOverrides,
    anchoredPriceOverrides,
  });
  const highlightedFeature = plan.features.find((feature) => /Unlimited AI insights|Unlimited AI/i.test(feature));
  const isYearly = billingCycle === 'annual';

  if (plan.featured) {
    return (
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-[1.5px] text-left transition-all duration-200 hover:shadow-[0_16px_40px_rgba(109,40,217,0.25)] ${selected ? 'shadow-[0_12px_32px_rgba(109,40,217,0.3)]' : 'opacity-[0.98]'}`}
      >
        <div className="relative h-full rounded-[13px] bg-white px-5 py-5 dark:bg-[#16122a]">
          <div className="relative flex h-full flex-col">
            {/* Header: badge + urgency hook + icon */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/15 dark:text-violet-300">
                  {plan.badge}
                </span>
                {plan.urgency && (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                    ✦ {plan.urgency}
                  </span>
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <Icon size={16} />
              </div>
            </div>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {plan.eyebrow}
            </p>

            {/* Name + headline + reinforcing sub-line */}
            <div className="mt-1.5">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-0.5 text-xs font-semibold leading-4 text-violet-700 dark:text-violet-400">
                {plan.headline}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                No limits. Full edge unlocked.
              </p>
            </div>

            {/* Price */}
            <div className="mt-3 flex items-end gap-1.5">
              {display.anchoredAmount && display.anchoredAmount > display.amount && (
                <span className="pb-0.5 text-xs font-semibold text-slate-400 line-through dark:text-slate-500">
                  ${display.anchoredAmount}
                </span>
              )}
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">${display.amount}</span>
              <span className="pb-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{display.suffix}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {display.savingsText && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{display.savingsText}</p>
              )}
              {isYearly && display.dailyEquivalent && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">${display.dailyEquivalent.toFixed(2)}/day</p>
              )}
            </div>

            {/* Core value — dominant, single mention */}
            <div className="mt-3 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50/60 px-3 py-2.5 dark:border-violet-500/25 dark:from-violet-500/15 dark:to-purple-500/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">
                {plan.highlightLabel}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-white">{plan.highlightText}</p>
            </div>

            {/* Behavioral trigger */}
            {plan.behavioralTrigger && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <Flame className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  {plan.behavioralTrigger}
                </p>
              </div>
            )}

            {/* Features — skip highlighted one (shown above), secondary items dimmer */}
            <div className="mt-3 space-y-1.5">
              {plan.features
                .filter((f) => f !== highlightedFeature)
                .map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                  >
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100/80 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400">
                      <Check size={10} />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                  </div>
                ))}
            </div>

            {/* Selection indicator */}
            <div className="mt-auto pt-3 flex justify-end">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${selected ? 'border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-500 dark:bg-violet-500/20 dark:text-violet-300' : 'border-slate-200 bg-white text-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-600'}`}>
                <Check size={12} />
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 hover:shadow-lg ${selected ? 'border-slate-300 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800' : 'border-slate-200 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60'}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {plan.badge}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
            <Icon size={16} />
          </div>
        </div>

        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {plan.eyebrow}
        </p>

        {/* Name + headline */}
        <div className="mt-1.5">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{plan.name}</h3>
          <p className="mt-0.5 text-xs leading-4 text-slate-500 dark:text-slate-400">{plan.headline}</p>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-end gap-1.5">
          {display.anchoredAmount && display.anchoredAmount > display.amount && (
            <span className="pb-0.5 text-xs font-semibold text-slate-400 line-through dark:text-slate-500">
              ${display.anchoredAmount}
            </span>
          )}
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">${display.amount}</span>
          <span className="pb-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{display.suffix}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {display.savingsText && (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{display.savingsText}</p>
          )}
          {isYearly && display.dailyEquivalent && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">${display.dailyEquivalent.toFixed(2)}/day</p>
          )}
        </div>

        {/* Value highlight — positive framing */}
        {(plan.highlightLabel || plan.highlightText) && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-600/40 dark:bg-slate-700/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {plan.highlightLabel}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{plan.highlightText}</p>
          </div>
        )}

        {/* Features */}
        <div className="mt-3 space-y-1.5">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 dark:border-slate-700/50 dark:bg-slate-700/30">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400">
                <Check size={10} />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{plan.urgency}</p>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${selected ? 'border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-300' : 'border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'}`}>
            <Check size={12} />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function PricingPlanSelector({
  title,
  subtitle,
  context = 'general',
  mode = 'full',
  selectedPlan = DEFAULT_SELECTED_PLAN,
  onSelectPlan,
  billingCycle = DEFAULT_BILLING_CYCLE,
  onBillingCycleChange,
  onPrimaryAction,
  onContinue,
  onTrack,
  primaryActionLabel,
  ctaLabel,
  ctaByPlan,
  planOrder,
  priceOverrides,
  anchoredPriceOverrides,
  experimentVariant = 'control',
  defaultPlan,
  defaultBillingCycle,
  showPrimaryAction = true,
  showBillingToggle = true,
  usagePercent,
  className = '',
}) {
  const copy = CONTEXT_COPY[context] ?? CONTEXT_COPY.general;
  const resolvedDefaultPlan = defaultPlan ?? DEFAULT_SELECTED_PLAN;
  const resolvedDefaultBilling = defaultBillingCycle ?? DEFAULT_BILLING_CYCLE;
  const plans = useMemo(() => {
    if (!Array.isArray(planOrder) || planOrder.length === 0) {
      return getPaidPlansInDisplayOrder();
    }

    const allPlans = getPaidPlansInDisplayOrder();
    const byId = Object.fromEntries(allPlans.map((plan) => [plan.id, plan]));
    return planOrder.map((id) => byId[id]).filter(Boolean);
  }, [planOrder]);
  const selectedPlanId = selectedPlan ?? resolvedDefaultPlan;
  const selectedBilling = billingCycle ?? resolvedDefaultBilling;

  const selectedCta = useMemo(() => {
    if (primaryActionLabel) return primaryActionLabel;
    if (ctaLabel) return ctaLabel;
    if (ctaByPlan?.[selectedPlanId]) return ctaByPlan[selectedPlanId];
    if (copy?.ctaByPlan?.[selectedPlanId]) return copy.ctaByPlan[selectedPlanId];
    return selectedPlanId === 'elite' ? 'Upgrade to Elite 🚀' : 'Unlock Full Power';
  }, [copy, ctaByPlan, ctaLabel, primaryActionLabel, selectedPlanId]);

  useEffect(() => {
    onTrack?.('pricing_viewed', {
      context,
      selectedPlan: selectedPlanId,
      billingCycle: selectedBilling,
      experimentVariant,
    });
  }, [context, experimentVariant, onTrack, selectedBilling, selectedPlanId]);

  const billingNudgeVisible = selectedPlanId === 'elite' && selectedBilling !== 'annual';
  const compactMode = mode === 'compact';
  const showUsageUrgency = compactMode && typeof usagePercent === 'number' && usagePercent >= 60;
  const selectedDisplay = getPlanDisplay(selectedPlanId, selectedBilling, {
    priceOverrides,
    anchoredPriceOverrides,
  });

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-700/50 dark:bg-slate-900/80 ${compactMode ? 'p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)]' : 'p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)]'} ${className}`}>
      <div className={`flex ${compactMode ? 'flex-col gap-2.5' : 'flex-col gap-4 md:flex-row md:items-end md:justify-between'}`}>
        <div>
          <p className={`${compactMode ? 'text-[10px]' : 'text-[11px]'} font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400`}>
            Pricing Plans
          </p>
          <h2 className={`${compactMode ? 'mt-1 text-[17px] md:text-[18px]' : 'mt-1.5 text-xl md:text-2xl'} font-black tracking-tight text-slate-950 dark:text-white`}>
            {title ?? copy.title}
          </h2>
          <p className={`${compactMode ? 'mt-1 text-[12px] leading-5' : 'mt-2 text-sm leading-6'} max-w-2xl text-slate-600 dark:text-slate-300`}>
            {subtitle ?? (compactMode ? copy.compactSubtitle : copy.subtitle)}
          </p>
        </div>

        {showBillingToggle && (
          <div className={`inline-flex items-center rounded-2xl border border-slate-200/80 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.03] ${compactMode ? 'self-start' : ''}`}>
            {['monthly', 'annual'].map((cycle) => {
              const active = selectedBilling === cycle;
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => {
                    onBillingCycleChange?.(cycle);
                    onTrack?.('pricing_billing_selected', {
                      context,
                      billingCycle: cycle,
                      selectedPlan: selectedPlanId,
                      experimentVariant,
                    });
                  }}
                  className={`rounded-xl ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-semibold transition-all ${active ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              );
            })}
            <span className={`ml-1 rounded-full border border-emerald-400/35 bg-emerald-500/10 ${compactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300`}>
              {selectedBilling === 'annual' && selectedDisplay.savings > 0
                ? `Save $${selectedDisplay.savings}/year`
                : 'Yearly Best Value'}
            </span>
          </div>
        )}
      </div>

      {billingNudgeVisible && (
        <div className={`${compactMode ? 'mt-2 text-[11px]' : 'mt-4 text-xs'} rounded-xl border border-amber-300/40 bg-amber-50/70 px-3 py-2 font-semibold text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-300`}>
          Elite + yearly unlocks the strongest value and full-power workflow.
        </div>
      )}

      {/* Dynamic usage urgency — shown when caller provides usagePercent ≥ 60 */}
      {showUsageUrgency && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/70 px-3 py-2 dark:border-rose-500/25 dark:bg-rose-500/10">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rose-200 dark:bg-rose-500/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="shrink-0 text-[11px] font-bold text-rose-700 dark:text-rose-400">
            {usagePercent >= 90 ? 'Limit almost reached' : `${usagePercent}% of your limit used`}
          </p>
        </div>
      )}

      <div className={`${compactMode ? 'mt-3 grid grid-cols-2 gap-2.5' : 'mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch'}`}>
        {plans.map((plan) => {
          const onSelect = (planId) => {
            onSelectPlan?.(planId);
            onTrack?.('pricing_plan_selected', {
              context,
              selectedPlan: planId,
              billingCycle: selectedBilling,
              experimentVariant,
            });
          };

          if (compactMode) {
            return (
              <CompactPlanCard
                key={plan.id}
                plan={plan}
                billingCycle={selectedBilling}
                selected={selectedPlanId === plan.id}
                onSelect={onSelect}
                context={context}
                priceOverrides={priceOverrides}
                anchoredPriceOverrides={anchoredPriceOverrides}
              />
            );
          }

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={selectedBilling}
              selected={selectedPlanId === plan.id}
              onSelect={onSelect}
              context={context}
              priceOverrides={priceOverrides}
              anchoredPriceOverrides={anchoredPriceOverrides}
            />
          );
        })}
      </div>

      {/* Social proof — compact only */}
      {compactMode && (
        <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Most traders hit their limit within{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">3–5 days</span>
        </p>
      )}

      {showPrimaryAction && (
        <div className={compactMode ? 'mt-3' : 'mt-6'}>
          {!compactMode && (
            <p className="mb-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
              Upgrade once. No limits forever.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              onTrack?.('pricing_cta_clicked', {
                context,
                selectedPlan: selectedPlanId,
                billingCycle: selectedBilling,
                cta: selectedCta,
                experimentVariant,
              });
              onPrimaryAction?.(selectedPlanId, selectedBilling);
              onContinue?.(selectedPlanId, selectedBilling);
            }}
            className={`group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${compactMode ? 'px-4 py-2.5 shadow-[0_8px_20px_rgba(109,40,217,0.25)]' : 'px-5 py-3.5 shadow-[0_16px_40px_rgba(99,102,241,0.28)] hover:shadow-[0_22px_55px_rgba(59,130,246,0.34)]'}`}
          >
            {selectedCta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          {compactMode ? (
            <div className="mt-2 space-y-0.5 text-center">
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Upgrade once. Remove all limits.
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                7-day risk-free · Cancel anytime
              </p>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              7-day risk-free • Cancel anytime
            </p>
          )}
        </div>
      )}
    </div>
  );
}