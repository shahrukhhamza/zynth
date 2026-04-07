import {
  ANCHORED_PRICES,
  BILLING_PRICES,
  DEFAULT_BILLING_CYCLE,
  DEFAULT_SELECTED_PLAN,
  PKR_PRICES,
  PRICING,
  formatUsd,
  getPlanDisplay,
  getPlanMonthlyEquivalent,
  getPlanMonthlyLabel,
  getPlanPrice,
  getPlanPriceLabel,
  getPlanSavings,
} from './pricing';

export {
  ANCHORED_PRICES,
  BILLING_PRICES,
  DEFAULT_BILLING_CYCLE,
  DEFAULT_SELECTED_PLAN,
  PKR_PRICES,
  PRICING,
  formatUsd,
  getPlanDisplay,
  getPlanMonthlyEquivalent,
  getPlanMonthlyLabel,
  getPlanPrice,
  getPlanPriceLabel,
  getPlanSavings,
};

export const PAID_PLAN_ORDER = ['elite', 'pro'];

export const PAID_PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    accent: '#CA8A04',
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

export function getPlanCta(planId) {
  return getPaidPlan(planId).cta;
}
