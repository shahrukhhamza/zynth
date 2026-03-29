export const DEFAULT_SELECTED_PLAN = 'elite';
export const DEFAULT_BILLING_CYCLE = 'monthly';

const USD_TO_PKR_RATE = 280;
const PKR_ROUNDING_INCREMENT = 500;

const roundAmount = (amount, increment = 1) => Math.round(amount / increment) * increment;

export const PRICING = {
  PRO: {
    id: 'pro',
    name: 'Pro',
    monthly: 8.9,
    annual: 89,
    display: '$8.90',
    yearlyEquivalent: 'Less than $0.30/day',
  },
  ELITE: {
    id: 'elite',
    name: 'Elite',
    monthly: 17.9,
    annual: 179,
    display: '$17.90',
    yearlyEquivalent: 'Less than $0.60/day',
  },
};

const PLAN_KEY_BY_ID = {
  pro: 'PRO',
  elite: 'ELITE',
};

export const BILLING_PRICES = {
  monthly: {
    pro: PRICING.PRO.monthly,
    elite: PRICING.ELITE.monthly,
  },
  annual: {
    pro: PRICING.PRO.annual,
    elite: PRICING.ELITE.annual,
  },
};

export const ANCHORED_PRICES = {
  monthly: {
    pro: null,
    elite: null,
  },
  annual: {
    pro: +(PRICING.PRO.monthly * 12).toFixed(2),
    elite: +(PRICING.ELITE.monthly * 12).toFixed(2),
  },
};

export const PKR_PRICES = {
  monthly: {
    pro: roundAmount(PRICING.PRO.monthly * USD_TO_PKR_RATE, PKR_ROUNDING_INCREMENT),
    elite: roundAmount(PRICING.ELITE.monthly * USD_TO_PKR_RATE, PKR_ROUNDING_INCREMENT),
  },
  annual: {
    pro: roundAmount(PRICING.PRO.annual * USD_TO_PKR_RATE, PKR_ROUNDING_INCREMENT),
    elite: roundAmount(PRICING.ELITE.annual * USD_TO_PKR_RATE, PKR_ROUNDING_INCREMENT),
  },
};

export function getPricingEntry(planId) {
  const planKey = PLAN_KEY_BY_ID[planId] ?? 'PRO';
  return PRICING[planKey];
}

export function formatUsd(amount, options = {}) {
  const { forceTwoDecimals = false } = options;
  const isWholeNumber = Number.isInteger(amount);
  const minimumFractionDigits = forceTwoDecimals || !isWholeNumber ? 2 : 0;
  const maximumFractionDigits = forceTwoDecimals || !isWholeNumber ? 2 : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
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

export function getPlanPriceLabel(planId, billingCycle = DEFAULT_BILLING_CYCLE) {
  return `${formatUsd(getPlanPrice(planId, billingCycle))}${billingCycle === 'annual' ? '/year' : '/month'}`;
}

export function getPlanMonthlyLabel(planId) {
  return getPlanPriceLabel(planId, 'monthly');
}

export function getPlanDisplay(planId, billingCycle = DEFAULT_BILLING_CYCLE, options = {}) {
  const overrideAmount = options?.priceOverrides?.[billingCycle]?.[planId];
  const overrideAnchoredAmount = options?.anchoredPriceOverrides?.[billingCycle]?.[planId];
  const amount = overrideAmount ?? getPlanPrice(planId, billingCycle);
  const savings = getPlanSavings(planId);
  const monthlyEquivalent = getPlanMonthlyEquivalent(planId);
  const anchoredAmount = overrideAnchoredAmount ?? ANCHORED_PRICES[billingCycle]?.[planId] ?? ANCHORED_PRICES.monthly[planId] ?? null;
  const dailyEquivalent = billingCycle === 'annual' ? amount / 365 : amount / 30;
  const pricingEntry = getPricingEntry(planId);

  return {
    amount,
    amountDisplay: formatUsd(amount),
    anchoredAmount,
    anchoredAmountDisplay: anchoredAmount != null ? formatUsd(anchoredAmount) : null,
    suffix: billingCycle === 'annual' ? '/year' : '/month',
    label: `${formatUsd(amount)}${billingCycle === 'annual' ? '/year' : '/month'}`,
    monthlyEquivalent,
    monthlyEquivalentDisplay: formatUsd(monthlyEquivalent, { forceTwoDecimals: true }),
    dailyEquivalent,
    dailyEquivalentDisplay: formatUsd(dailyEquivalent, { forceTwoDecimals: true }),
    yearlyEquivalent: pricingEntry.yearlyEquivalent,
    savings,
    savingsDisplay: formatUsd(savings, { forceTwoDecimals: true }),
    helperText: billingCycle === 'annual'
      ? `${pricingEntry.yearlyEquivalent} billed yearly`
      : null,
    savingsText: billingCycle === 'annual' && savings > 0
      ? `Save ${formatUsd(savings, { forceTwoDecimals: true })}/year`
      : null,
  };
}