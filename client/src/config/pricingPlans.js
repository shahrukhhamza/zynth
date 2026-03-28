export const DEFAULT_SELECTED_PLAN = 'elite';
export const DEFAULT_BILLING_CYCLE = 'annual';

export const BILLING_PRICES = {
  monthly: {
    pro: 9,
    elite: 19,
  },
  annual: {
    pro: 90,
    elite: 190,
  },
};

export const ANCHORED_PRICES = {
  monthly: {
    pro: 29,
    elite: 49,
  },
  annual: {
    pro: 299,
    elite: 588,
  },
};

export const PAID_PLAN_ORDER = ['elite', 'pro'];

export const PAID_PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    accent: '#2563eb',
    badge: 'Smart Start',
    eyebrow: 'Built for traders building consistency',
    headline: 'Includes 50 AI insights per month for consistent tracking',
    description: 'Get the essential system serious traders use to review, refine, and improve every week.',
    socialProof: 'A structured starting point that grows with you',
    highlightLabel: 'Consistent AI access',
    highlightText: '50 AI insights every month — track, review, refine',
    urgency: 'Upgrade anytime as your trading activity grows',
    cta: 'Start With Pro',
    icon: 'rocket',
    featured: false,
    features: [
      'Unlimited journal entries',
      'Advanced analytics dashboard',
      'Economic intelligence and macro context',
      'Full access to all core trading tools',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    accent: '#a855f7',
    badge: 'Most Powerful',
    eyebrow: 'For traders ready to operate without limits',
    headline: 'Built for uninterrupted decision-making',
    description: 'Remove every ceiling and trade with the full Zynth operating system behind every decision.',
    socialProof: 'Chosen by traders who demand full capability',
    highlightLabel: 'Unlimited access. Full capability.',
    highlightText: 'Unlimited AI insights — always on, never throttled',
    urgency: 'Early pricing — locked in for life',
    cta: 'Unlock Full AI Power 🚀',
    icon: 'crown',
    featured: true,
    features: [
      'Everything in Pro, fully unlocked',
      'Unlimited AI insights — no daily limits',
      'Premium strategy breakdowns and deeper reporting',
      'Priority support and early feature access',
    ],
  },
};

export function getPaidPlan(planId) {
  return PAID_PLANS[planId] ?? PAID_PLANS.pro;
}

export function getPaidPlansInDisplayOrder() {
  return PAID_PLAN_ORDER.map((planId) => getPaidPlan(planId));
}

export function getPlanPrice(planId, billingCycle = DEFAULT_BILLING_CYCLE) {
  return BILLING_PRICES[billingCycle]?.[planId] ?? BILLING_PRICES.monthly[planId] ?? 0;
}

export function getPlanSavings(planId) {
  const monthly = BILLING_PRICES.monthly[planId] ?? 0;
  const annual = BILLING_PRICES.annual[planId] ?? 0;
  return Math.max((monthly * 12) - annual, 0);
}

export function getPlanMonthlyEquivalent(planId) {
  const annual = BILLING_PRICES.annual[planId] ?? 0;
  return annual / 12;
}

export function getPlanCta(planId) {
  return getPaidPlan(planId).cta;
}

export function getPlanDisplay(planId, billingCycle = DEFAULT_BILLING_CYCLE, options = {}) {
  const overrideAmount = options?.priceOverrides?.[billingCycle]?.[planId];
  const overrideAnchoredAmount = options?.anchoredPriceOverrides?.[billingCycle]?.[planId];
  const amount = overrideAmount ?? getPlanPrice(planId, billingCycle);
  const savings = getPlanSavings(planId);
  const monthlyEquivalent = getPlanMonthlyEquivalent(planId);
  const anchoredAmount = overrideAnchoredAmount ?? ANCHORED_PRICES[billingCycle]?.[planId] ?? ANCHORED_PRICES.monthly[planId] ?? null;
  const dailyEquivalent = billingCycle === 'annual' ? amount / 365 : amount / 30;

  return {
    amount,
    anchoredAmount,
    suffix: billingCycle === 'annual' ? '/year' : '/month',
    monthlyEquivalent,
    dailyEquivalent,
    savings,
    helperText: billingCycle === 'annual'
      ? `Equivalent to $${monthlyEquivalent.toFixed(2)}/mo billed yearly`
      : null,
    savingsText: billingCycle === 'annual' && savings > 0
      ? `Save $${savings}/year`
      : null,
  };
}