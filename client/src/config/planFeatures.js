/**
 * Central plan feature configuration.
 * Single source of truth for all plan limits and feature flags.
 * Used by usePlan() hook, UpgradeModal, and PricingPage.
 */

export const PLANS_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    // Hard limits
    maxJournalEntries: 5,           // lifetime cap
    aiAnalysesLifetime: 2,          // total AI analyses ever (no monthly reset)
    aiAnalysesMonthly: null,
    // Feature flags
    realTimeData: false,
    fullEconomicCalendar: false,
    advancedAnalytics: false,
    behavioralInsights: false,
    aiReports: false,
    tradingDna: false,
    strategyOptimization: false,
    prioritySupport: false,
  },
  pro: {
    name: 'Pro',
    price: 9,
    maxJournalEntries: Infinity,
    aiAnalysesLifetime: null,       // no lifetime cap
    aiAnalysesMonthly: 50,          // resets each calendar month
    realTimeData: true,
    fullEconomicCalendar: true,
    advancedAnalytics: true,
    behavioralInsights: true,
    aiReports: false,
    tradingDna: false,
    strategyOptimization: false,
    prioritySupport: false,
  },
  elite: {
    name: 'Elite',
    price: 19,
    maxJournalEntries: Infinity,
    aiAnalysesLifetime: null,
    aiAnalysesMonthly: Infinity,    // unlimited
    realTimeData: true,
    fullEconomicCalendar: true,
    advancedAnalytics: true,
    behavioralInsights: true,
    aiReports: true,
    tradingDna: true,
    strategyOptimization: true,
    prioritySupport: true,
  },
};

/** Human-readable labels for each feature key */
export const FEATURE_LABELS = {
  realTimeData: 'Real-time market data',
  fullEconomicCalendar: 'Full economic calendar',
  advancedAnalytics: 'Advanced analytics',
  behavioralInsights: 'Behavioral insights',
  aiReports: 'AI trading reports',
  tradingDna: 'Trading DNA profile',
  strategyOptimization: 'Strategy optimization insights',
  prioritySupport: 'Priority support',
};

/** Returns the lowest plan that has a given feature key */
export function getRequiredPlanForFeature(featureKey) {
  const order = ['pro', 'elite'];
  for (const planKey of order) {
    if (PLANS_CONFIG[planKey][featureKey] === true) return planKey;
  }
  return 'pro';
}

/** Returns true if the given plan has access to the feature */
export function planHasFeature(plan, featureKey) {
  const cfg = PLANS_CONFIG[plan] ?? PLANS_CONFIG.free;
  return cfg[featureKey] === true;
}
