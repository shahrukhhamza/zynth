/**
 * macroImpactEngine.js
 *
 * Deterministic cross-asset macro impact engine.
 *
 * Maps macroeconomic indicator readings to directional market bias for:
 *   - Gold     (XAUUSD)
 *   - Forex    EURUSD | GBPUSD | USDJPY
 *   - Commodities: WTI Oil (USOIL)
 *
 * ── Core macro relationships ────────────────────────────────────────────────
 *   Interest rates ↑  → USD ↑ → EURUSD ↓ | GBPUSD ↓ | USDJPY ↑ | Gold ↓
 *   Inflation ↑       → real rate ↓ → Gold ↑ | USD ↓ (unless offset by hikes)
 *   Labor market weak → dovish Fed expectations → Gold ↑ | USD ↓
 *   Growth strong     → risk-on → Oil ↑ | USD mixed
 *   JPY safe-haven    → risk-off → USDJPY ↓ (JPY demand offsets USD strength)
 *
 * ── Impact color convention ─────────────────────────────────────────────────
 *   The `impact` field on each indicator is scored from the GOLD perspective
 *   (as set by determineGoldImpact() in economicIntelligenceService.js):
 *     'bullish' = bullish for gold  (e.g. hot CPI, weak NFP, rising unemployment)
 *     'bearish' = bearish for gold  (e.g. strong NFP, rate hike, strong GDP)
 *
 *   Because gold and USD have strong inverse correlation, the USD direction
 *   for any given indicator is the INVERSION of the gold direction.
 *
 * NO AI. All logic is deterministic, rule-based, and fully auditable.
 */

// ── Per-indicator weights in the USD strength composite ─────────────────────
// Weights reflect the indicator's historical influence on Fed policy and
// on market-implied USD direction. Total must equal 1.0.
const USD_WEIGHTS = {
  FedRate:       0.30,   // Direct monetary policy signal — dominant USD driver
  NFP:           0.20,   // Non-farm payrolls → employment mandate proxy
  CPI:           0.18,   // CPI surprise → real-rate driver
  CorePCE:       0.12,   // Fed's preferred inflation gauge
  UNEMPLOYMENT:  0.08,   // Employment confirmation signal
  GDP:           0.07,   // Growth pace → rate expectations
  RetailSales:   0.05,   // Consumption proxy
  // Total: 1.00
};

// ── Per-indicator weights for the gold composite ─────────────────────────────
const GOLD_WEIGHTS = {
  FedRate:       0.25,   // Rate hike → higher real rate → gold bearish
  CPI:           0.20,   // Hot inflation → negative real rate → gold bullish
  CorePCE:       0.15,   // Fed's gauge; tight correlation with rate expectations
  NFP:           0.15,   // Strong payrolls → risk-on → gold bearish
  UNEMPLOYMENT:  0.10,   // Rising unemployment → uncertainty → gold bullish
  GDP:           0.10,   // Strong growth → risk-on → gold bearish
  RetailSales:   0.05,   // Strong consumption → gold bearish
  // Total: 1.00
};

// ── Weights for the risk-sentiment composite ─────────────────────────────────
// Risk-on = positive → Oil ↑, JPY ↓, Gold ↓
const RISK_WEIGHTS = {
  GDP:              0.35,
  NFP:              0.25,
  RetailSales:      0.20,
  ISMManufacturing: 0.10,
  ConsumerConf:     0.10,
};

// ── Impact-strength → numeric multiplier ─────────────────────────────────────
const STRENGTH_MULT = { strong: 1.0, moderate: 0.55, weak: 0.20 };

// ── Freshness → data-quality penalty ─────────────────────────────────────────
const FRESHNESS_MULT = { fresh: 1.0, stale: 0.65, outdated: 0.25 };

// ── Threshold constants ───────────────────────────────────────────────────────
const STRONG_THRESH   = 0.38;   // |score| >= this → 'strong'
const MODERATE_THRESH = 0.18;   // |score| >= this → 'moderate'
const BIAS_THRESH     = 0.08;   // |score| >= this → directional (else 'neutral')

// ── Confidence thresholds ─────────────────────────────────────────────────────
const CONF_HIGH   = 0.70;
const CONF_MEDIUM = 0.45;

// ── Empirical cross-asset correlation coefficients ───────────────────────────
// Values reflect broad historical averages (daily returns, 2015-2025).
// Positive = co-directional. Negative = inverse.
const CORRELATIONS = {
  GOLD_USD:    -0.82,   // Gold priced in USD — dominant inverse
  GOLD_AUDUSD: +0.68,   // Australia = major gold producer; AUD tracks gold
  GOLD_USDCHF: -0.65,   // CHF and gold are both safe-havens; co-directional bids
  USD_EURUSD:  -0.92,   // EUR is the largest DXY component — near-perfect inverse
  USD_GBPUSD:  -0.87,   // GBP tracks EUR/USD with similar USD exposure
  USD_USDJPY:  +0.78,   // USD strength raises USDJPY (partially offset by JPY haven bid)
};

// Blend weight for correlation-implied signal vs. the base macro score.
// 0.35 = 35% correlation pull, 65% base score — base macro dominates.
const CORR_BLEND_WEIGHT = 0.35;

// ── Conflict pairs per asset ─────────────────────────────────────────────────
// Each entry defines two indicator codes whose opposite impact directions
// constitute a credible macro conflict for that asset.
// 'explanation' is the human-readable tension description shown to the user.
// Conflict is only active when BOTH indicators are present and directional
// (non-neutral) and point in OPPOSITE directions (per gold-perspective impact).
const CONFLICT_PAIRS_BY_ASSET = {
  gold: [
    {
      codes: ['CPI', 'FedRate'],
      explanation: 'Inflation supports gold but rising interest rates increase real yields, offsetting safe-haven demand',
    },
    {
      codes: ['CorePCE', 'FedRate'],
      explanation: 'Core inflation supports gold as an inflation hedge but elevated Fed rates create yield competition',
    },
    {
      codes: ['NFP', 'CPI'],
      explanation: 'Strong payrolls reinforce Fed hawkishness (gold bearish) but hot inflation provides inflation-hedge support',
    },
    {
      codes: ['GDP', 'CPI'],
      explanation: 'Strong economic growth reduces safe-haven demand but high inflation supports gold as a store of value',
    },
    {
      codes: ['UNEMPLOYMENT', 'RetailSales'],
      explanation: 'Rising unemployment signals economic stress (gold bullish) but robust consumer spending signals resilience',
    },
  ],
  EURUSD: [
    {
      codes: ['FedRate', 'CPI'],
      explanation: 'Elevated US rates strengthen USD carry appeal (EUR/USD bearish) but high inflation erodes the dollar\'s real purchasing power',
    },
    {
      codes: ['NFP', 'CPI'],
      explanation: 'Strong payrolls sustain USD rate advantage (EUR/USD bearish) but rising inflation reduces the dollar\'s real value',
    },
    {
      codes: ['GDP', 'CPI'],
      explanation: 'Robust US growth supports USD rate premium (EUR/USD bearish) but inflationary pressure creates policy uncertainty',
    },
  ],
  GBPUSD: [
    {
      codes: ['FedRate', 'CPI'],
      explanation: 'Elevated Fed rates support USD (GBP/USD bearish) but hot inflation undermines the dollar\'s real rate advantage',
    },
    {
      codes: ['NFP', 'CPI'],
      explanation: 'Strong US payrolls favour USD (GBP/USD bearish) but elevated inflation reduces USD real yields',
    },
  ],
  USDJPY: [
    {
      codes: ['FedRate', 'GDP'],
      explanation: 'Higher US rates support USD carry advantage (USD/JPY bullish) but slowing growth triggers JPY safe-haven inflows',
    },
    {
      codes: ['NFP', 'UNEMPLOYMENT'],
      explanation: 'Payroll growth and unemployment data send conflicting signals about the health of the US labour market',
    },
    {
      codes: ['CPI', 'GDP'],
      explanation: 'Inflationary pressure complicates Fed rate policy while growth signals affect JPY safe-haven demand simultaneously',
    },
  ],
  oil: [
    {
      codes: ['GDP', 'FedRate'],
      explanation: 'Strong economic growth supports energy demand (oil bullish) but restrictive interest rates threaten to slow activity',
    },
    {
      codes: ['RetailSales', 'CPI'],
      explanation: 'Robust consumer spending supports fuel demand but elevated inflation squeezes purchasing power and may dampen consumption',
    },
    {
      codes: ['ISMManufacturing', 'FedRate'],
      explanation: 'Manufacturing expansion supports industrial energy demand but tight monetary conditions risk slowing production growth',
    },
  ],
};
// AUDUSD and USDCHF reuse gold pairs (both derived from gold correlation).
CONFLICT_PAIRS_BY_ASSET.AUDUSD = CONFLICT_PAIRS_BY_ASSET.gold.slice(0, 3);
CONFLICT_PAIRS_BY_ASSET.USDCHF = CONFLICT_PAIRS_BY_ASSET.USDJPY.slice(0, 2);

// Confidence downgrade when conflict present:
//   high   → medium
//   medium → low
//   low    → low  (already minimum)
const CONF_DOWNGRADE = { high: 'medium', medium: 'low', low: 'low' };

// Maximum strength tier allowed when a conflict is detected.
// A conflicted signal must not be labelled 'strong'.
const MAX_STRENGTH_WITH_CONFLICT = 'moderate';


// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up an indicator by its code from the indicators array.
 * @param {Array}  indicators
 * @param {string} code
 * @returns {Object|null}
 */
function get(indicators, code) {
  return indicators.find(i => i.code === code) ?? null;
}

/**
 * Convert an indicator's impact + impactStrength + freshness into a
 * weighted numeric score expressed from either the gold or USD perspective.
 *
 * Gold perspective  : 'bullish' → +1, 'bearish' → -1
 * USD  perspective  : inverse of gold (gold bullish = USD bearish → -1)
 *
 * @param {Object|null} ind        – indicator row (null = missing → returns 0)
 * @param {'gold'|'usd'} direction – score perspective
 * @returns {number} in range [-1, 1], adjusted for strength and freshness
 */
function indicatorScore(ind, direction = 'gold') {
  if (!ind || !ind.impact || ind.impact === 'neutral') return 0;

  // Gold-perspective raw direction
  const goldRaw = ind.impact === 'bullish' ? 1 : ind.impact === 'bearish' ? -1 : 0;

  // USD direction is the inverse of gold
  const raw = direction === 'usd' ? -goldRaw : goldRaw;

  const sm = STRENGTH_MULT[ind.impactStrength] ?? STRENGTH_MULT.weak;
  const fm = FRESHNESS_MULT[ind.freshness]      ?? FRESHNESS_MULT.stale;

  return raw * sm * fm;
}

/** Clamp a value to [-1, 1]. */
function clamp(v) {
  return Math.max(-1, Math.min(1, v));
}

/** Map a numeric score to a bias label. */
function toBias(score) {
  if (score >=  BIAS_THRESH) return 'bullish';
  if (score <= -BIAS_THRESH) return 'bearish';
  return 'neutral';
}

/** Map the absolute value of a score to a strength label. */
function toStrength(score) {
  const abs = Math.abs(score);
  if (abs >= STRONG_THRESH)   return 'strong';
  if (abs >= MODERATE_THRESH) return 'moderate';
  return 'weak';
}

/** Round a raw score to 3 decimal places for payload transparency. */
function roundScore(v) {
  return Math.round(v * 1000) / 1000;
}


// ─────────────────────────────────────────────────────────────────────────────
// Composite score calculators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the USD strength composite.
 *
 * Each indicator's contribution = weight × indicatorScore(ind, 'usd').
 * If the covered weight is < 60 % of the total, the sum is normalised so
 * sparse data does not artificially produce low-magnitude outputs.
 *
 * @param {Array} indicators
 * @returns {number}  positive = bullish USD, negative = bearish USD
 */
function calcUsdScore(indicators) {
  let total = 0;
  let weightApplied = 0;

  for (const [code, weight] of Object.entries(USD_WEIGHTS)) {
    const ind = get(indicators, code);
    if (!ind) continue;
    total         += indicatorScore(ind, 'usd') * weight;
    weightApplied += weight;
  }

  if (weightApplied === 0) return 0;

  const score = weightApplied < 0.6
    ? total / weightApplied   // normalise to avoid under-representation
    : total;

  return clamp(score);
}

/**
 * Calculate the real interest rate and its directional impact on gold.
 *
 * Formula: realRate = interestRate − inflation
 *
 * Relationship (established macro consensus):
 *   realRate < 0  → opportunity cost of holding gold is negative →
 *                   gold becomes attractive vs. fixed-income → Bullish gold
 *   realRate > 0  → positive real yield = competition for gold →
 *                   investors prefer yield-bearing assets → Bearish gold
 *   realRate = 0  → No directional pressure → Neutral
 *
 * Both inputs must be expressed in the same units (e.g. annualised %).
 * Typical inputs: interestRate = 5.25 (fed funds rate), inflation = 3.20 (YoY CPI %)
 *
 * @param {number} interestRate  – Nominal interest rate (annualised %)
 * @param {number} inflation     – Inflation rate in the same annualised % units
 * @returns {{
 *   realRate:    number,                          raw real rate (2 d.p.)
 *   goldImpact:  "bullish" | "bearish" | "neutral",
 *   explanation: string
 * }}
 */
export function calculateRealRate(interestRate, inflation) {
  if (typeof interestRate !== 'number' || typeof inflation !== 'number' ||
      !Number.isFinite(interestRate) || !Number.isFinite(inflation)) {
    return {
      realRate:    null,
      goldImpact:  'neutral',
      explanation: 'Real rate could not be calculated: one or both inputs are missing or invalid.',
    };
  }

  const realRate = Math.round((interestRate - inflation) * 100) / 100;

  if (realRate < 0) {
    return {
      realRate,
      goldImpact:  'bullish',
      explanation: `Real rate is negative (${realRate}%). When real yields are below zero, ` +
                   `holding gold carries no opportunity cost relative to fixed-income assets. ` +
                   `Historically this is one of the strongest structural tailwinds for gold.`,
    };
  }

  if (realRate > 0) {
    return {
      realRate,
      goldImpact:  'bearish',
      explanation: `Real rate is positive (${realRate}%). Positive real yields make interest-bearing ` +
                   `assets more attractive than non-yielding gold, creating headwinds for the metal.`,
    };
  }

  // realRate === 0
  return {
    realRate: 0,
    goldImpact:  'neutral',
    explanation: 'Real rate is exactly zero. No structural pressure on gold from real yield differential.',
  };
}

/**
 * Extract annualised real rate from the indicators array (internal use).
 *
 * CPI in this pipeline is expressed as month-over-month % (e.g. 0.3 %).
 * Multiplying by 12 gives a rough annualised rate comparable to the
 * nominal fed funds rate (e.g. 5.25 %).
 *
 * @param {Array} indicators
 * @returns {number|null}
 */
function calcRealRate(indicators) {
  const rate = get(indicators, 'FedRate');
  const cpi  = get(indicators, 'CPI');
  if (!rate || !cpi || rate.actual == null || cpi.actual == null) return null;
  const { realRate } = calculateRealRate(rate.actual, cpi.actual * 12);
  return realRate;
}

/**
 * Adjustment to gold score based on the real interest-rate level.
 *
 * Negative real rates are one of the strongest structural tailwinds for gold
 * (Erb & Harvey 2013; established academic consensus).
 *
 * @param {number|null} realRate
 * @returns {number}  additive adjustment in range [-0.30, +0.30]
 */
function realRateGoldAdj(realRate) {
  if (realRate === null) return 0;
  if (realRate <= -3) return  0.30;   // Very negative real rates → very bullish gold
  if (realRate <= -1) return  0.20;
  if (realRate <   0) return  0.10;
  if (realRate <   1) return -0.05;
  if (realRate <   3) return -0.15;
  return                     -0.25;   // Strongly positive real rates → bearish gold
}

/**
 * Calculate the gold score from all relevant macro drivers:
 *   1. Weighted indicator-level gold impact
 *   2. Real-rate structural adjustment
 *   3. USD inverse pressure (cross-indicator smoothing)
 *
 * @param {Array}  indicators
 * @param {number} usdScore  – pre-calculated USD composite
 * @returns {number}  positive = bullish gold, negative = bearish gold
 */
function calcGoldScore(indicators, usdScore) {
  let weightedSum   = 0;
  let weightApplied = 0;

  for (const [code, weight] of Object.entries(GOLD_WEIGHTS)) {
    const ind = get(indicators, code);
    if (!ind) continue;
    weightedSum   += indicatorScore(ind, 'gold') * weight;
    weightApplied += weight;
  }

  const baseScore = weightApplied === 0
    ? 0
    : weightApplied < 0.6
      ? weightedSum / weightApplied
      : weightedSum;

  const realRate  = calcRealRate(indicators);
  const realAdj   = realRateGoldAdj(realRate);

  // USD exerts inverse pressure on gold (partially already captured per-indicator,
  // but the composite adds cross-series smoothing).
  const usdAdj    = -usdScore * 0.20;

  return clamp(baseScore + realAdj + usdAdj);
}

/**
 * Calculate risk-sentiment composite.
 *
 * Positive = risk-on  (growth, jobs, consumption expanding)
 * Negative = risk-off (contraction fears, rising unemployment)
 *
 * Risk-on  → Oil ↑ | JPY sell (USDJPY ↑) | Gold ↓
 * Risk-off → Oil ↓ | JPY buy  (USDJPY ↓) | Gold ↑
 *
 * @param {Array} indicators
 * @returns {number}
 */
function calcRiskScore(indicators) {
  let total   = 0;
  let applied = 0;

  for (const [code, weight] of Object.entries(RISK_WEIGHTS)) {
    const ind = get(indicators, code);
    if (!ind) continue;
    // Growth/risk indicators: gold bearish = risk-on = positive risk score
    total   += indicatorScore(ind, 'usd') * weight;
    applied += weight;
  }

  if (applied === 0) return 0;
  return clamp(applied < 0.6 ? total / applied : total);
}

/**
 * Calculate a confidence label for an asset's bias estimate.
 *
 * Composite of:
 *   - Coverage   : % of relevant indicator codes that are present (40 %)
 *   - Freshness  : % of present indicators that are fresh or stale (35 %)
 *   - Alignment  : % of present indicators that agree on direction (25 %)
 *
 * @param {Array}    indicators
 * @param {string[]} relevantCodes – indicator codes material to this asset
 * @returns {'high'|'medium'|'low'}
 */
function calcConfidence(indicators, relevantCodes) {
  const relevant = relevantCodes.map(c => get(indicators, c)).filter(Boolean);

  if (relevant.length === 0) return 'low';

  const freshCount  = relevant.filter(i => i.freshness === 'fresh').length;
  const staleCount  = relevant.filter(i => i.freshness === 'stale').length;
  const totalCount  = relevant.length;

  const coverageRatio   = totalCount / relevantCodes.length;
  const freshnessScore  = (freshCount + staleCount * 0.5) / totalCount;

  const bullish = relevant.filter(i => i.impact === 'bullish').length;
  const bearish = relevant.filter(i => i.impact === 'bearish').length;
  const aligned = Math.max(bullish, bearish) / totalCount;

  const composite = coverageRatio * 0.40 + freshnessScore * 0.35 + aligned * 0.25;

  if (composite >= CONF_HIGH)   return 'high';
  if (composite >= CONF_MEDIUM) return 'medium';
  return 'low';
}

/**
 * Build a per-asset result object.
 * @param {number} score
 * @param {string} confidence
 * @returns {{ bias: string, strength: string, confidence: string, score: number }}
 */
function assetResult(score, confidence) {
  return {
    bias:           toBias(score),
    strength:       toStrength(score),
    confidence,
    score:          roundScore(score),
    hasConflict:    false,
    conflictExplanation: null,
  };
}

/**
 * Detect whether any defined conflict pair fires for a given asset.
 *
 * A conflict is active when both indicators in a pair:
 *   1. Are present in the indicators list
 *   2. Are directional (non-neutral)
 *   3. Have OPPOSITE impact directions (gold-perspective)
 *
 * @param {Array}  indicators – raw indicator array
 * @param {string} asset      – asset key e.g. 'gold' | 'EURUSD' | 'oil'
 * @returns {{ hasConflict: boolean, conflictingCodes: string[], explanation: string|null }}
 */
function detectAssetConflict(indicators, asset) {
  const pairs = CONFLICT_PAIRS_BY_ASSET[asset];
  if (!pairs || pairs.length === 0) {
    return { hasConflict: false, conflictingCodes: [], explanation: null };
  }

  const conflicts = [];

  for (const pair of pairs) {
    const [codeA, codeB] = pair.codes;
    const indA = get(indicators, codeA);
    const indB = get(indicators, codeB);

    // Both must be present and directional
    if (!indA || !indB) continue;
    if (!indA.impact || indA.impact === 'neutral') continue;
    if (!indB.impact || indB.impact === 'neutral') continue;

    // Conflict = opposite gold-perspective directions
    if (indA.impact !== indB.impact) {
      conflicts.push({ codes: pair.codes, explanation: pair.explanation });
    }
  }

  if (conflicts.length === 0) {
    return { hasConflict: false, conflictingCodes: [], explanation: null };
  }

  // Pick the first (highest-priority) conflict explanation.
  // If multiple pairs fire, surface the primary one and note the count.
  const primary = conflicts[0];
  const explanation = conflicts.length > 1
    ? `${primary.explanation}. Additionally, ${conflicts.length - 1} further signal conflict(s) detected.`
    : primary.explanation;

  const conflictingCodes = [...new Set(conflicts.flatMap(c => c.codes))];

  return { hasConflict: true, conflictingCodes, explanation };
}

/**
 * Build a per-asset result object with conflict awareness.
 *
 * Rules when conflict detected:
 *   - `bias` becomes 'mixed' IFF the net score is near-zero (within 2× BIAS_THRESH);
 *     otherwise the directional bias is retained but weakened.
 *   - `strength` is capped at 'moderate' — never 'strong' when conflicting.
 *   - `confidence` is downgraded one tier (high→medium, medium→low).
 *
 * @param {number} score
 * @param {string} confidence
 * @param {{ hasConflict: boolean, conflictingCodes: string[], explanation: string|null }} conflict
 * @returns {Object}
 */
function assetResultWithConflict(score, confidence, conflict) {
  if (!conflict.hasConflict) {
    return {
      bias:                toBias(score),
      strength:            toStrength(score),
      confidence,
      score:               roundScore(score),
      hasConflict:         false,
      conflictingCodes:    [],
      conflictExplanation: null,
    };
  }

  // Conflict present — apply rules
  const rawBias     = toBias(score);
  const rawStrength = toStrength(score);

  // Bias: go 'mixed' when the net score cannot confidently pick a direction
  const bias = Math.abs(score) <= BIAS_THRESH * 2 ? 'mixed' : rawBias;

  // Strength: never 'strong' when conflicted
  const strength = rawStrength === 'strong' ? MAX_STRENGTH_WITH_CONFLICT : rawStrength;

  // Confidence: downgrade one tier
  const adjConfidence = CONF_DOWNGRADE[confidence] ?? 'low';

  return {
    bias,
    strength,
    confidence:          adjConfidence,
    score:               roundScore(score),
    hasConflict:         true,
    conflictingCodes:    conflict.conflictingCodes,
    conflictExplanation: conflict.explanation,
  };
}

/**
 * Fallback output when no valid indicators are supplied.
 * @returns {Object}
 */
function buildEmptyOutput() {
  const neutral = { bias: 'neutral', strength: 'weak', confidence: 'low', score: 0 };
  return {
    gold:        { ...neutral },
    forex: {
      EURUSD: { ...neutral },
      GBPUSD: { ...neutral },
      USDJPY: { ...neutral },
    },
    commodities: {
      oil: { ...neutral },
    },
    meta: {
      usdScore:       0,
      riskScore:      0,
      realRate:       null,
      indicatorsUsed: 0,
      calculatedAt:   new Date().toISOString(),
    },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate market impact across gold, forex, and oil from macroeconomic data.
 *
 * ── Input ────────────────────────────────────────────────────────────────────
 * @param {Array} indicators  Array of indicator objects (from buildAiInsightsPayload).
 *   Each object must contain:
 *     code           {string}       'CPI' | 'NFP' | 'FedRate' | 'GDP' | etc.
 *     impact         {string}       'bullish' | 'bearish' | 'neutral'  ← GOLD perspective
 *     impactStrength {string}       'strong' | 'moderate' | 'weak'
 *     freshness      {string}       'fresh' | 'stale' | 'outdated'
 *     actual         {number|null}  Current reading (used for real-rate calc)
 *
 * ── Output ───────────────────────────────────────────────────────────────────
 * @returns {{
 *   gold:        { bias, strength, confidence, score },
 *   forex: {
 *     EURUSD:    { bias, strength, confidence, score },
 *     GBPUSD:    { bias, strength, confidence, score },
 *     USDJPY:    { bias, strength, confidence, score },
 *   },
 *   commodities: {
 *     oil:       { bias, strength, confidence, score },
 *   },
 *   meta: {
 *     usdScore, riskScore, realRate, indicatorsUsed, calculatedAt
 *   }
 * }}
 *
 * ── Bias values   ─────────────────────────────────────────────────────────────
 *   'bullish' | 'bearish' | 'neutral'
 *
 * ── Strength values ───────────────────────────────────────────────────────────
 *   'strong' | 'moderate' | 'weak'
 *
 * ── Confidence values ─────────────────────────────────────────────────────────
 *   'high' | 'medium' | 'low'  (based on coverage, freshness, signal alignment)
 *
 * ── Score field ───────────────────────────────────────────────────────────────
 *   Raw composite in [-1, 1]. Positive = bullish, negative = bearish.
 *   Included for transparency; not required by spec but useful for debugging.
 */
/**
 * Apply cross-asset correlation rules to a set of base signals, returning
 * adjusted signals that are internally consistent across gold, forex, and
 * commodities.
 *
 * ── Relationships enforced ────────────────────────────────────────────────────
 *   Gold  ↔ USD      inverse   (-0.82)  Gold ↑ → USD ↓
 *   Gold  ↔ AUDUSD   positive  (+0.68)  Gold ↑ → AUDUSD ↑
 *   Gold  ↔ USDCHF   inverse   (-0.65)  Gold ↑ → USDCHF ↓  (CHF = safe-haven)
 *   USD   ↔ EURUSD   inverse   (-0.92)  USD ↑  → EURUSD ↓
 *   USD   ↔ GBPUSD   inverse   (-0.87)  USD ↑  → GBPUSD ↓
 *   USD   ↔ USDJPY   positive  (+0.78)  USD ↑  → USDJPY ↑
 *
 * AUDUSD and USDCHF are *derived* pairs (not present in calculateMarketImpact
 * output); they are added here from correlation inference.
 *
 * Existing forex scores are *blended* (65 % base + 35 % correlation-implied)
 * rather than replaced, so the underlying macro signal still dominates.
 *
 * ── Input ─────────────────────────────────────────────────────────────────────
 * @param {Object} baseSignals  – Output of calculateMarketImpact(), or any
 *   object conforming to:
 *   {
 *     gold:        { score, bias, strength, confidence },
 *     forex:       { EURUSD, GBPUSD, USDJPY }  (each with score, bias, strength, confidence),
 *     commodities: { oil: { score, ... } },
 *     meta:        { usdScore, riskScore }
 *   }
 *
 * ── Output ────────────────────────────────────────────────────────────────────
 * @returns {{
 *   gold:        { bias, strength, confidence, score, baseScore },
 *   forex: {
 *     EURUSD:    { bias, strength, confidence, score, baseScore },
 *     GBPUSD:    { bias, strength, confidence, score, baseScore },
 *     USDJPY:    { bias, strength, confidence, score, baseScore },
 *     AUDUSD:    { bias, strength, confidence, score },   // derived
 *     USDCHF:    { bias, strength, confidence, score },   // derived
 *   },
 *   commodities: { oil: { bias, strength, confidence, score } },
 *   correlations: { [pairKey]: { coefficient, relationship, description } },
 *   consistency:  { goldUsd, goldAudusd, goldUsdchf },
 *   meta:         { usdScore, goldImpliedUsdScore, correlationBlendWeight, adjustedAt, ... }
 * }}
 */
export function calculateCrossAssetImpact(baseSignals) {
  if (!baseSignals || typeof baseSignals !== 'object') {
    return { error: 'Invalid baseSignals: expected object from calculateMarketImpact()' };
  }

  // ── Step 1: extract base scores ───────────────────────────────────────────
  const goldScore   = baseSignals.gold?.score       ?? 0;
  const eurusdBase  = baseSignals.forex?.EURUSD?.score ?? 0;
  const gbpusdBase  = baseSignals.forex?.GBPUSD?.score ?? 0;
  const usdJpyBase  = baseSignals.forex?.USDJPY?.score ?? 0;
  const oilBase     = baseSignals.commodities?.oil?.score ?? 0;

  // USD score: use meta value if available, otherwise infer from gold inverse.
  const usdScore = baseSignals.meta?.usdScore
    ?? clamp(-goldScore * Math.abs(CORRELATIONS.GOLD_USD));

  // ── Step 2: correlation-implied scores ───────────────────────────────────
  // Each pair's "implied" score is what the correlation alone predicts.
  const eurusdImplied  = usdScore  * CORRELATIONS.USD_EURUSD;   // negative of usdScore
  const gbpusdImplied  = usdScore  * CORRELATIONS.USD_GBPUSD;   // negative of usdScore
  const usdJpyImplied  = usdScore  * CORRELATIONS.USD_USDJPY;   // same direction as usdScore
  const goldImpliedUsd = goldScore * CORRELATIONS.GOLD_USD;      // inverse of goldScore

  // ── Step 3: blended adjusted scores (base 65% + corr-implied 35%) ────────
  const K = CORR_BLEND_WEIGHT;
  const eurusdAdj = clamp(eurusdBase * (1 - K) + eurusdImplied * K);
  const gbpusdAdj = clamp(gbpusdBase * (1 - K) + gbpusdImplied * K);
  const usdJpyAdj = clamp(usdJpyBase * (1 - K) + usdJpyImplied * K);

  // Gold gets a small USD-inverse consistency nudge.
  const goldAdj = clamp(goldScore * (1 - K) + (-usdScore * Math.abs(CORRELATIONS.GOLD_USD)) * K);

  // ── Step 4: derive AUDUSD and USDCHF ─────────────────────────────────────
  //
  // AUDUSD: positively correlated with gold (AUD = commodity currency).
  //   audusdScore = goldAdj × |coefficient|
  const audusdScore = clamp(goldAdj * CORRELATIONS.GOLD_AUDUSD);

  // USDCHF: CHF is a safe-haven like gold → inversely correlated with gold
  //   and positively correlated with USD strength (it is a USD pair).
  //   Split: 55% USD driver + 45% gold-inverse driver.
  const usdchfScore = clamp(
    usdScore   *  0.55 +
    (-goldAdj) * Math.abs(CORRELATIONS.GOLD_USDCHF) * 0.45,
  );

  // ── Step 5: consistency audit ─────────────────────────────────────────────
  // Flag when gold and USD are directionally in agreement (both bullish or
  // both bearish) — this contradicts the established inverse relationship.
  const goldDir = goldScore >  BIAS_THRESH ? 1 : goldScore < -BIAS_THRESH ? -1 : 0;
  const usdDir  = usdScore  >  BIAS_THRESH ? 1 : usdScore  < -BIAS_THRESH ? -1 : 0;
  const goldUsdConsistent = goldDir === 0 || usdDir === 0 || goldDir !== usdDir;

  const audusdDir = audusdScore >= 0 ? 1 : -1;
  const goldAudusdConsistent = goldDir === 0
    || Math.sign(goldDir) === Math.sign(audusdDir);

  const usdchfDir = usdchfScore >= 0 ? 1 : -1;
  const goldUsdchfConsistent = goldDir === 0
    || Math.sign(goldDir) !== Math.sign(usdchfDir);

  const consistency = {
    goldUsd: {
      relationship: 'inverse',
      consistent:   goldUsdConsistent,
      note: goldUsdConsistent
        ? 'Gold and USD are moving in expected opposite directions'
        : 'Divergence: gold and USD signals point in the same direction — unusual macro environment',
    },
    goldAudusd: {
      relationship: 'positive',
      consistent:   goldAudusdConsistent,
      note: 'AUDUSD derived from gold positive correlation (AUD = commodity currency)',
    },
    goldUsdchf: {
      relationship: 'inverse',
      consistent:   goldUsdchfConsistent,
      note: 'USDCHF derived from USD strength and gold inverse (CHF = safe-haven)',
    },
  };

  // ── Step 6: confidence on derived pairs ───────────────────────────────────
  const goldConf  = baseSignals.gold?.confidence       ?? 'low';
  const forexConf = baseSignals.forex?.EURUSD?.confidence ?? 'low';

  // ── Step 7: assemble output ───────────────────────────────────────────────
  return {
    gold: {
      ...baseSignals.gold,
      score:     roundScore(goldAdj),
      bias:      toBias(goldAdj),
      strength:  toStrength(goldAdj),
      baseScore: roundScore(goldScore),
    },
    forex: {
      EURUSD: {
        ...baseSignals.forex?.EURUSD,
        score:     roundScore(eurusdAdj),
        bias:      toBias(eurusdAdj),
        strength:  toStrength(eurusdAdj),
        baseScore: roundScore(eurusdBase),
      },
      GBPUSD: {
        ...baseSignals.forex?.GBPUSD,
        score:     roundScore(gbpusdAdj),
        bias:      toBias(gbpusdAdj),
        strength:  toStrength(gbpusdAdj),
        baseScore: roundScore(gbpusdBase),
      },
      USDJPY: {
        ...baseSignals.forex?.USDJPY,
        score:     roundScore(usdJpyAdj),
        bias:      toBias(usdJpyAdj),
        strength:  toStrength(usdJpyAdj),
        baseScore: roundScore(usdJpyBase),
      },
      // Derived pairs — inferred from correlations
      AUDUSD: assetResult(audusdScore, goldConf),
      USDCHF: assetResult(usdchfScore, forexConf),
    },
    commodities: {
      oil: { ...baseSignals.commodities?.oil },
    },
    correlations: {
      GOLD_USD:    { coefficient: CORRELATIONS.GOLD_USD,    relationship: 'inverse',  description: 'Gold priced in USD — strong inverse relationship' },
      GOLD_AUDUSD: { coefficient: CORRELATIONS.GOLD_AUDUSD, relationship: 'positive', description: 'Australia is a major gold producer; AUD tracks gold closely' },
      GOLD_USDCHF: { coefficient: CORRELATIONS.GOLD_USDCHF, relationship: 'inverse',  description: 'CHF and gold are both safe-haven assets — co-directional safe-haven bids' },
      USD_EURUSD:  { coefficient: CORRELATIONS.USD_EURUSD,  relationship: 'inverse',  description: 'EUR is the primary inverse component of the DXY dollar index' },
      USD_GBPUSD:  { coefficient: CORRELATIONS.USD_GBPUSD,  relationship: 'inverse',  description: 'GBP tracks EUR/USD with similar USD exposure' },
      USD_USDJPY:  { coefficient: CORRELATIONS.USD_USDJPY,  relationship: 'positive', description: 'USD strength drives USDJPY higher; partially offset by JPY safe-haven flows' },
    },
    consistency,
    meta: {
      ...baseSignals.meta,
      usdScore:               roundScore(usdScore),
      goldImpliedUsdScore:    roundScore(goldImpliedUsd),
      correlationBlendWeight: CORR_BLEND_WEIGHT,
      adjustedAt:             new Date().toISOString(),
    },
  };
}

export function calculateMarketImpact(indicators = []) {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return buildEmptyOutput();
  }

  // ── Step 1: core composites ───────────────────────────────────────────────
  const usdScore  = calcUsdScore(indicators);
  const riskScore = calcRiskScore(indicators);
  const realRate  = calcRealRate(indicators);
  const goldScore = calcGoldScore(indicators, usdScore);

  // ── Step 2: forex ─────────────────────────────────────────────────────────

  // EURUSD
  //   Primary driver: USD strength (inverse).
  //   Minor risk-on overlay: when global growth is strong, EUR can benefit
  //   slightly from improved trade conditions vs USD.
  const eurusdScore = clamp(-usdScore * 0.95 + riskScore * 0.05);

  // GBPUSD
  //   Same mechanism as EURUSD. GBP has independent energy/trade factors
  //   but without UK-specific data, we use a slightly attenuated USD inverse.
  const gbpusdScore = clamp(-usdScore * 0.90 + riskScore * 0.10);

  // USDJPY
  //   USD direction AND risk sentiment both matter significantly.
  //   Risk-on  → JPY safe-haven demand falls → USDJPY rises further
  //   Risk-off → JPY safe-haven bid → USDJPY falls even if USD is firm
  //
  //   Formula: usdScore × 0.55 + riskScore × 0.45
  //   At max risk-off, riskScore = -1 fully offsets USD strength.
  const usdJpyScore = clamp(usdScore * 0.55 + riskScore * 0.45);

  // ── Step 3: oil ───────────────────────────────────────────────────────────
  //   Demand driver (growth): GDP, RetailSales, ISMManufacturing   (50 %)
  //   USD inverse (priced in USD):                                 (30 %)
  //   Risk sentiment (risk-on = higher demand expectations):       (20 %)

  const gdp = get(indicators, 'GDP');
  const rs  = get(indicators, 'RetailSales');
  const ism = get(indicators, 'ISMManufacturing');

  const growthSignal = clamp(
    indicatorScore(gdp, 'usd') * 0.45 +
    indicatorScore(rs,  'usd') * 0.30 +
    indicatorScore(ism, 'usd') * 0.25,
  );

  const oilScore = clamp(
    growthSignal  * 0.50 +
    (-usdScore)   * 0.30 +   // Stronger USD → oil priced up for foreign buyers → demand falls
    riskScore     * 0.20,
  );

  // ── Step 4: confidence per asset ─────────────────────────────────────────
  const goldConf  = calcConfidence(indicators, ['FedRate', 'CPI', 'CorePCE', 'NFP', 'UNEMPLOYMENT', 'GDP']);
  const forexConf = calcConfidence(indicators, ['FedRate', 'CPI', 'NFP', 'UNEMPLOYMENT', 'RetailSales', 'GDP']);
  const oilConf   = calcConfidence(indicators, ['GDP', 'RetailSales', 'ISMManufacturing', 'NFP']);

  // ── Step 5: conflict detection per asset ────────────────────────────────
  const goldConflict   = detectAssetConflict(indicators, 'gold');
  const eurusdConflict = detectAssetConflict(indicators, 'EURUSD');
  const gbpusdConflict = detectAssetConflict(indicators, 'GBPUSD');
  const usdJpyConflict = detectAssetConflict(indicators, 'USDJPY');
  const oilConflict    = detectAssetConflict(indicators, 'oil');

  // ── Step 6: assemble output ───────────────────────────────────────────────
  return {
    gold:        assetResultWithConflict(goldScore,   goldConf,  goldConflict),
    forex: {
      EURUSD:    assetResultWithConflict(eurusdScore, forexConf, eurusdConflict),
      GBPUSD:    assetResultWithConflict(gbpusdScore, forexConf, gbpusdConflict),
      USDJPY:    assetResultWithConflict(usdJpyScore, forexConf, usdJpyConflict),
    },
    commodities: {
      oil:       assetResultWithConflict(oilScore,    oilConf,   oilConflict),
    },
    meta: {
      usdScore:       roundScore(usdScore),
      riskScore:      roundScore(riskScore),
      realRate:       realRate !== null ? Math.round(realRate * 100) / 100 : null,
      indicatorsUsed: indicators.filter(i => i.impact && i.impact !== 'neutral').length,
      calculatedAt:   new Date().toISOString(),
    },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Explanation engine — deterministic, template-based, no AI
// ─────────────────────────────────────────────────────────────────────────────

/** Format an indicator's actual value with its unit (e.g. "0.3%", "215K"). */
function fmtVal(ind) {
  if (ind.actual == null) return 'N/A';
  return `${ind.actual}${ind.unit || ''}`;
}

/** Human-readable display names for each asset key. */
const ASSET_DISPLAY = {
  gold:   'Gold (XAUUSD)',
  EURUSD: 'EUR/USD',
  GBPUSD: 'GBP/USD',
  USDJPY: 'USD/JPY',
  AUDUSD: 'AUD/USD',
  USDCHF: 'USD/CHF',
  oil:    'WTI Oil',
};

/**
 * Asset category governs which template column is used:
 *   gold      → gold-perspective (bullish = good for gold)
 *   anti_usd  → USD-bearish = asset-bullish (EURUSD, GBPUSD, AUDUSD)
 *   usd_base  → USD-bullish = asset-bullish (USDJPY, USDCHF)
 *   oil       → growth/demand-oriented
 */
const ASSET_CATEGORY = {
  gold:   'gold',
  EURUSD: 'anti_usd',
  GBPUSD: 'anti_usd',
  AUDUSD: 'anti_usd',
  USDJPY: 'usd_base',
  USDCHF: 'usd_base',
  oil:    'oil',
};

/**
 * Indicator priority per asset (most material first).
 * Only these indicators contribute reasoning bullets.
 */
const ASSET_PRIORITY = {
  gold:   ['FedRate', 'CPI', 'CorePCE', 'NFP', 'UNEMPLOYMENT', 'GDP', 'RetailSales', 'JoblessClaims'],
  EURUSD: ['FedRate', 'CPI', 'NFP', 'GDP', 'UNEMPLOYMENT', 'RetailSales', 'ISMManufacturing'],
  GBPUSD: ['FedRate', 'CPI', 'NFP', 'GDP', 'RetailSales'],
  USDJPY: ['FedRate', 'NFP', 'GDP', 'CPI', 'UNEMPLOYMENT'],
  AUDUSD: ['FedRate', 'CPI', 'NFP', 'GDP', 'RetailSales'],
  USDCHF: ['FedRate', 'CPI', 'NFP', 'GDP', 'CorePCE'],
  oil:    ['GDP', 'RetailSales', 'ISMManufacturing', 'NFP', 'ConsumerConf', 'FedRate'],
};

/**
 * Reason-line templates.
 * Keyed by [indicatorCode][assetCategory]['bullish'|'bearish'|'neutral'].
 * 'bullish'/'bearish' are from the indicator's GOLD perspective.
 * null = this indicator is not material for that asset category.
 * Each value is a function: (ind) => string
 */
const REASON_TEMPLATES = {
  FedRate: {
    gold: {
      bullish: i => `Fed rate at ${fmtVal(i)} — rate cut expectations reduce real-yield competition, supporting gold`,
      bearish: i => `Fed rate at ${fmtVal(i)} — elevated rates raise real yields, pressuring gold`,
      neutral: i => `Interest rates stable at ${fmtVal(i)} — no new catalyst from monetary policy`,
    },
    anti_usd: {
      bullish: i => `Fed rate at ${fmtVal(i)} — dovish rate outlook weakens USD, supporting the pair`,
      bearish: i => `Fed rate at ${fmtVal(i)} — higher Fed rates strengthen USD, pressuring the pair`,
      neutral: i => `Interest rates stable at ${fmtVal(i)} — no change to USD rate advantage`,
    },
    usd_base: {
      bullish: i => `Fed rate at ${fmtVal(i)} — rate cut outlook softens USD carry appeal`,
      bearish: i => `Fed rate at ${fmtVal(i)} — elevated Fed rate sustains USD carry advantage, lifting the pair`,
      neutral: i => `Interest rates stable at ${fmtVal(i)} — USD rate advantage unchanged`,
    },
    oil: {
      bullish: i => `Fed rate at ${fmtVal(i)} — potential rate cuts support growth expectations and oil demand`,
      bearish: i => `Fed rate at ${fmtVal(i)} — restrictive rates weigh on economic activity and oil demand`,
      neutral: i => `Interest rates stable at ${fmtVal(i)} — neutral impact on oil demand outlook`,
    },
  },
  CPI: {
    gold: {
      bullish: i => `CPI at ${fmtVal(i)} m/m — rising inflation erodes real yields, historically bullish for gold`,
      bearish: i => `CPI at ${fmtVal(i)} m/m — cooling inflation reduces gold's inflation-hedge appeal`,
      neutral: i => `CPI at ${fmtVal(i)} m/m — inflation met expectations, no CPI catalyst`,
    },
    anti_usd: {
      bullish: i => `CPI at ${fmtVal(i)} m/m — elevated inflation reduces USD real purchasing power`,
      bearish: i => `CPI at ${fmtVal(i)} m/m — cooling inflation supports USD real value`,
      neutral: i => `CPI at ${fmtVal(i)} m/m — inflation in line with expectations, no USD catalyst`,
    },
    usd_base: {
      bullish: i => `CPI at ${fmtVal(i)} m/m — high inflation erodes USD real value, potentially softening the pair`,
      bearish: i => `CPI at ${fmtVal(i)} m/m — contained inflation supports USD real-rate premium`,
      neutral: i => `CPI at ${fmtVal(i)} m/m — inflation in line with expectations`,
    },
    oil: {
      bullish: i => `CPI at ${fmtVal(i)} m/m — inflationary environment can signal commodity demand pressure`,
      bearish: i => `CPI at ${fmtVal(i)} m/m — cooling inflation reduces commodity price tailwinds`,
      neutral: i => `CPI at ${fmtVal(i)} m/m — neutral inflation signal for commodities`,
    },
  },
  CorePCE: {
    gold: {
      bullish: i => `Core PCE at ${fmtVal(i)} m/m — Fed's preferred gauge elevated, strengthening real-rate case for gold`,
      bearish: i => `Core PCE at ${fmtVal(i)} m/m — cooling core inflation reduces gold's inflation-hedge demand`,
      neutral: i => `Core PCE at ${fmtVal(i)} m/m — Fed inflation gauge met expectations`,
    },
    anti_usd: {
      bullish: i => `Core PCE at ${fmtVal(i)} m/m — elevated core inflation reduces USD long-term rate outlook`,
      bearish: i => `Core PCE at ${fmtVal(i)} m/m — contained core PCE supports USD rate premium`,
      neutral: i => `Core PCE at ${fmtVal(i)} m/m — Fed inflation signal neutral`,
    },
    usd_base: {
      bullish: i => `Core PCE at ${fmtVal(i)} m/m — peak inflation signals may indicate Fed pivot ahead`,
      bearish: i => `Core PCE at ${fmtVal(i)} m/m — contained core inflation supports sustained USD rates`,
      neutral: i => `Core PCE at ${fmtVal(i)} m/m — no directional Fed inflation signal`,
    },
    oil: null,
  },
  NFP: {
    gold: {
      bullish: i => `Non-Farm Payrolls at ${fmtVal(i)} — weak jobs growth raises rate-cut expectations, supporting gold`,
      bearish: i => `Non-Farm Payrolls at ${fmtVal(i)} — strong payrolls reinforce Fed hawkishness, pressuring gold`,
      neutral: i => `Non-Farm Payrolls at ${fmtVal(i)} — jobs met expectations, no monetary policy shift signaled`,
    },
    anti_usd: {
      bullish: i => `Payrolls at ${fmtVal(i)} — weak labor data reduces USD rate premium`,
      bearish: i => `Payrolls at ${fmtVal(i)} — strong labor market sustains USD rate advantage`,
      neutral: i => `Payrolls at ${fmtVal(i)} — inline with expectations, stable USD rate outlook`,
    },
    usd_base: {
      bullish: i => `Payrolls at ${fmtVal(i)} — weak jobs reduce USD rate premium, softening the pair`,
      bearish: i => `Payrolls at ${fmtVal(i)} — strong labor market supports USD carry advantage`,
      neutral: i => `Payrolls at ${fmtVal(i)} — no payroll surprise, neutral USD impact`,
    },
    oil: {
      bullish: i => `Payrolls at ${fmtVal(i)} — weak hiring signals slower economic growth and oil demand`,
      bearish: i => `Payrolls at ${fmtVal(i)} — strong employment confirms robust activity and energy demand`,
      neutral: i => `Payrolls at ${fmtVal(i)} — inline with expectations, neutral for oil demand`,
    },
  },
  UNEMPLOYMENT: {
    gold: {
      bullish: i => `Unemployment at ${fmtVal(i)} — rising joblessness signals economic stress, increasing safe-haven demand`,
      bearish: i => `Unemployment at ${fmtVal(i)} — tight labor market supports continued Fed restrictiveness`,
      neutral: i => `Unemployment at ${fmtVal(i)} — stable, no incremental safe-haven catalyst`,
    },
    anti_usd: {
      bullish: i => `Unemployment at ${fmtVal(i)} — rising unemployment signals possible Fed pivot, weakening USD`,
      bearish: i => `Unemployment at ${fmtVal(i)} — low unemployment keeps rate-cut expectations contained`,
      neutral: i => `Unemployment at ${fmtVal(i)} — stable, no directional USD shift`,
    },
    usd_base: {
      bullish: i => `Unemployment at ${fmtVal(i)} — labor stress may force Fed pivot, softening USD pairs`,
      bearish: i => `Unemployment at ${fmtVal(i)} — strong employment supports USD rate premium`,
      neutral: i => `Unemployment at ${fmtVal(i)} — stable, no incremental USD catalyst`,
    },
    oil: null,
  },
  GDP: {
    gold: {
      bullish: i => `GDP at ${fmtVal(i)} — slowing growth reduces risk appetite, increasing gold's safe-haven appeal`,
      bearish: i => `GDP at ${fmtVal(i)} — strong growth drives risk-on sentiment, reducing safe-haven gold demand`,
      neutral: i => `GDP at ${fmtVal(i)} — growth in line with expectations, neutral for safe-haven positioning`,
    },
    anti_usd: {
      bullish: i => `GDP at ${fmtVal(i)} — weak US growth may prompt Fed easing, reducing USD appeal`,
      bearish: i => `GDP at ${fmtVal(i)} — robust US growth reinforces USD rate premium over peers`,
      neutral: i => `GDP at ${fmtVal(i)} — growth met expectations, no new USD rate divergence signal`,
    },
    usd_base: {
      bullish: i => `GDP at ${fmtVal(i)} — slowing growth may soften USD rate expectations`,
      bearish: i => `GDP at ${fmtVal(i)} — strong US growth sustains USD rate advantage, supporting dollar pairs`,
      neutral: i => `GDP at ${fmtVal(i)} — growth in line with trend, neutral for dollar pairs`,
    },
    oil: {
      bullish: i => `GDP at ${fmtVal(i)} — slowing economic growth signals reduced energy demand`,
      bearish: i => `GDP at ${fmtVal(i)} — strong economic growth supports oil demand outlook`,
      neutral: i => `GDP at ${fmtVal(i)} — growth on trend, neutral oil demand signal`,
    },
  },
  RetailSales: {
    gold: {
      bullish: i => `Retail sales at ${fmtVal(i)} — weak consumer spending signals growth concerns, supporting gold`,
      bearish: i => `Retail sales at ${fmtVal(i)} — robust consumption supports growth, reducing safe-haven demand`,
      neutral: i => `Retail sales at ${fmtVal(i)} — consumer spending in line with expectations`,
    },
    anti_usd: {
      bullish: i => `Retail sales at ${fmtVal(i)} — weak spending signals potential growth slowdown, reducing USD appeal`,
      bearish: i => `Retail sales at ${fmtVal(i)} — strong consumption supports growth and USD rate outlook`,
      neutral: i => `Retail sales at ${fmtVal(i)} — spending met expectations`,
    },
    usd_base: {
      bullish: i => `Retail sales at ${fmtVal(i)} — weak spending signals growth concerns, softening USD outlook`,
      bearish: i => `Retail sales at ${fmtVal(i)} — strong retail activity supports growth and USD rate premium`,
      neutral: i => `Retail sales at ${fmtVal(i)} — spending in line with expectations`,
    },
    oil: {
      bullish: i => `Retail sales at ${fmtVal(i)} — weak consumer activity signals lower energy demand`,
      bearish: i => `Retail sales at ${fmtVal(i)} — strong consumer spending supports gasoline and energy demand`,
      neutral: i => `Retail sales at ${fmtVal(i)} — neutral signal for energy consumption`,
    },
  },
  ISMManufacturing: {
    gold: {
      bullish: i => `ISM Manufacturing at ${fmtVal(i)} — sector contraction raises growth concerns, supporting gold`,
      bearish: i => `ISM Manufacturing at ${fmtVal(i)} — manufacturing expansion signals risk-on environment`,
      neutral: i => `ISM Manufacturing at ${fmtVal(i)} — near expansion/contraction boundary, neutral signal`,
    },
    anti_usd: {
      bullish: i => `ISM at ${fmtVal(i)} — manufacturing contraction may accelerate Fed pivot expectations`,
      bearish: i => `ISM at ${fmtVal(i)} — manufacturing expansion supports US economic backdrop and USD`,
      neutral: i => `ISM at ${fmtVal(i)} — neutral ISM reading, no directional USD catalyst`,
    },
    usd_base: null,
    oil: {
      bullish: i => `ISM Manufacturing at ${fmtVal(i)} — industrial contraction signals reduced energy demand`,
      bearish: i => `ISM Manufacturing at ${fmtVal(i)} — manufacturing expansion supports industrial energy demand`,
      neutral: i => `ISM Manufacturing at ${fmtVal(i)} — near-neutral, limited oil demand signal`,
    },
  },
  JoblessClaims: {
    gold: {
      bullish: i => `Jobless claims at ${fmtVal(i)} — rising claims signal labor deterioration, supporting safe-haven gold`,
      bearish: i => `Jobless claims at ${fmtVal(i)} — low claims confirm labor market resilience`,
      neutral: i => `Jobless claims at ${fmtVal(i)} — stable, no incremental gold catalyst`,
    },
    anti_usd: {
      bullish: i => `Jobless claims at ${fmtVal(i)} — rising claims may accelerate Fed rate-cut expectations`,
      bearish: i => `Jobless claims at ${fmtVal(i)} — low claims support continued Fed rate hold`,
      neutral: i => `Jobless claims at ${fmtVal(i)} — stable, no shift in rate-cut timeline`,
    },
    usd_base: null,
    oil: null,
  },
  ConsumerConf: {
    gold: {
      bullish: i => `Consumer confidence at ${fmtVal(i)} — falling confidence signals growth concerns, bullish for gold`,
      bearish: i => `Consumer confidence at ${fmtVal(i)} — elevated confidence signals risk-on appetite`,
      neutral: i => `Consumer confidence at ${fmtVal(i)} — stable, neutral macro signal`,
    },
    anti_usd: null,
    usd_base: null,
    oil: {
      bullish: i => `Consumer confidence at ${fmtVal(i)} — falling confidence signals reduced spending and energy demand`,
      bearish: i => `Consumer confidence at ${fmtVal(i)} — high confidence supports consumer spending and oil demand`,
      neutral: i => `Consumer confidence at ${fmtVal(i)} — stable, neutral energy demand signal`,
    },
  },
};

/**
 * Pull the asset-level result from a signals object.
 * Handles output of both calculateMarketImpact() and calculateCrossAssetImpact().
 */
function getAssetSignal(asset, signals) {
  if (asset === 'gold') return signals?.gold;
  if (asset === 'oil')  return signals?.commodities?.oil;
  return signals?.forex?.[asset];
}

/**
 * Build up to `maxLines` reason strings for a given asset.
 *
 * Selection strategy:
 *   1. Collect indicators relevant to this asset (from ASSET_PRIORITY order)
 *   2. Sort directional (non-neutral) ones by impactStrength then priority rank
 *   3. Fill remaining slots with top neutral indicator only if it is a
 *      top-2-priority indicator that has real data (e.g. "FedRate stable")
 */
function buildReasoningLines(asset, indicators, maxLines = 4) {
  const category = ASSET_CATEGORY[asset];
  const priority = ASSET_PRIORITY[asset] ?? [];
  if (!category || !priority.length) return [];

  const STRENGTH_RANK = { strong: 3, moderate: 2, weak: 1 };

  const candidates = priority
    .map((code, priorityIdx) => {
      const ind  = indicators.find(i => i.code === code);
      if (!ind)  return null;
      const tmpl = REASON_TEMPLATES[code]?.[category];
      if (!tmpl) return null;
      return { ind, tmpl, code, priorityIdx };
    })
    .filter(Boolean);

  const directional = candidates
    .filter(({ ind }) => ind.impact && ind.impact !== 'neutral')
    .sort((a, b) => {
      const rankDiff =
        (STRENGTH_RANK[b.ind.impactStrength] ?? 0) -
        (STRENGTH_RANK[a.ind.impactStrength] ?? 0);
      return rankDiff !== 0 ? rankDiff : a.priorityIdx - b.priorityIdx;
    });

  const neutralTop = candidates
    .filter(({ ind, priorityIdx }) =>
      ind.impact === 'neutral' && ind.actual != null && priorityIdx <= 1,
    )
    .sort((a, b) => a.priorityIdx - b.priorityIdx);

  // Build selection: up to (maxLines-1) directional + optionally 1 neutral filler
  const selected = directional.slice(0, maxLines - 1);
  if (selected.length < maxLines) {
    const remaining = directional.slice(selected.length);
    if (remaining.length > 0) {
      selected.push(remaining[0]);
    } else if (neutralTop.length > 0) {
      selected.push(neutralTop[0]);
    }
  }

  const lines = [];
  for (const { ind, tmpl } of selected.slice(0, maxLines)) {
    const key = ind.impact === 'neutral' ? 'neutral' : ind.impact;
    const fn  = tmpl[key];
    if (typeof fn === 'function') {
      try { lines.push(fn(ind)); } catch (_) { /* skip */ }
    }
  }
  return lines;
}


// ─────────────────────────────────────────────────────────────────────────────
// Public API — explanation engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a human-readable market explanation for a specific asset.
 *
 * Uses ONLY actual indicator data — no AI, no invented values.
 *
 * @param {string} asset       – 'gold' | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'AUDUSD' | 'USDCHF' | 'oil'
 * @param {Object} signals     – Output of calculateMarketImpact() or calculateCrossAssetImpact()
 * @param {Array}  indicators  – Raw indicator array from buildAiInsightsPayload()
 * @returns {{
 *   summary:      string,            one-sentence bias summary
 *   reasoning:    string[],          3–4 bullet point explanations (WHY)
 *   marketImpact: string             plain-English directional conclusion
 * }}
 */
export function generateMarketExplanation(asset, signals, indicators = []) {
  const assetSignal = getAssetSignal(asset, signals);
  const displayName = ASSET_DISPLAY[asset] || asset;

  if (!assetSignal) {
    return {
      summary:      `No signal data available for ${displayName}.`,
      reasoning:    [],
      marketImpact: 'Insufficient data to determine market impact.',
    };
  }

  const { bias = 'neutral', strength = 'weak', confidence = 'low' } = assetSignal;
  const reasoning = buildReasoningLines(asset, indicators);

  // ── Summary ───────────────────────────────────────────────────────────────
  const biasLabel   = bias === 'neutral' ? 'neutral' : `${strength}ly ${bias}`;
  const dataLabel   = reasoning.length > 0
    ? `${reasoning.length} macro indicator${reasoning.length > 1 ? 's' : ''}`
    : 'available data';
  const summary = `${displayName} signal is ${biasLabel} (${confidence} confidence) based on ${dataLabel}.`;

  // ── Market impact ─────────────────────────────────────────────────────────
  let marketImpact;
  if (bias === 'neutral') {
    marketImpact = `${displayName} shows no strong directional bias. Current macro data is mixed or provides insufficient evidence for a clear view.`;
  } else {
    const dirWord       = bias === 'bullish' ? 'upside' : 'downside';
    const strengthPhrase = strength === 'strong'   ? 'Multiple high-conviction macro signals'
                         : strength === 'moderate' ? 'Several macro indicators'
                         :                           'Limited macro data';
    const confNote      = confidence === 'high'   ? 'High data coverage supports this view.'
                        : confidence === 'medium' ? 'Medium confidence — key indicators are available but some data may be stale.'
                        :                           'Low confidence — data coverage is limited; treat this signal with caution.';
    marketImpact = `${strengthPhrase} point to ${dirWord} pressure on ${displayName}. ${confNote}`;
  }

  return { summary, reasoning, marketImpact };
}

/**
 * Generate explanations for all assets in a single pass.
 *
 * @param {Object} signals    – Output of calculateMarketImpact() or calculateCrossAssetImpact()
 * @param {Array}  indicators – Raw indicator array from buildAiInsightsPayload()
 * @returns {{
 *   gold:        { summary, reasoning, marketImpact },
 *   forex:       { EURUSD, GBPUSD, USDJPY, AUDUSD, USDCHF },
 *   commodities: { oil }
 * }}
 */
export function generateAllExplanations(signals, indicators = []) {
  return {
    gold: generateMarketExplanation('gold', signals, indicators),
    forex: {
      EURUSD: generateMarketExplanation('EURUSD', signals, indicators),
      GBPUSD: generateMarketExplanation('GBPUSD', signals, indicators),
      USDJPY: generateMarketExplanation('USDJPY', signals, indicators),
      AUDUSD: generateMarketExplanation('AUDUSD', signals, indicators),
      USDCHF: generateMarketExplanation('USDCHF', signals, indicators),
    },
    commodities: {
      oil: generateMarketExplanation('oil', signals, indicators),
    },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Data transparency system — deterministic, no AI
// ─────────────────────────────────────────────────────────────────────────────

// Indicator importance weights used for confidence scoring (mirrors USD_WEIGHTS
// but includes all indicators that contribute to any asset signal).
const TRANSPARENCY_WEIGHTS = {
  FedRate:          0.22,
  NFP:              0.17,
  CPI:              0.15,
  CorePCE:          0.12,
  UNEMPLOYMENT:     0.10,
  GDP:              0.09,
  RetailSales:      0.07,
  ISMManufacturing: 0.05,
  ConsumerConf:     0.03,
};
const TRANSPARENCY_TOTAL_WEIGHT = Object.values(TRANSPARENCY_WEIGHTS)
  .reduce((s, w) => s + w, 0);

/** Human-readable release frequency labels. */
const FREQ_LABEL = {
  weekly:    'weekly',
  monthly:   'monthly',
  quarterly: 'quarterly',
};

/**
 * Return a plain-English description of how stale an indicator is.
 * @param {string}      freshness       – 'fresh' | 'stale' | 'outdated'
 * @param {number|null} daysSinceRelease
 * @param {string}      releaseFrequency
 * @returns {string}
 */
function describeDelay(freshness, daysSinceRelease, releaseFrequency) {
  const freq  = FREQ_LABEL[releaseFrequency] || 'periodic';
  const days  = daysSinceRelease != null ? Math.floor(daysSinceRelease) : null;
  const dayStr = days != null ? `${days} day${days === 1 ? '' : 's'}` : 'an unknown number of days';

  if (freshness === 'fresh') return `Current (released ${dayStr} ago, ${freq} indicator)`;
  if (freshness === 'stale') return `Stale — released ${dayStr} ago (${freq} indicator); update expected soon`;
  return `Outdated — released ${dayStr} ago (${freq} indicator); data may not reflect latest conditions`;
}

/**
 * Build a human-readable "next update expected in X days (indicator name)" string.
 * @param {string|null} nextReleaseDate   – ISO date string or null
 * @param {string}      indicatorName
 * @param {string}      releaseFrequency
 * @returns {string}
 */
function describeNextUpdate(nextReleaseDate, indicatorName, releaseFrequency) {
  if (!nextReleaseDate) {
    const freq = FREQ_LABEL[releaseFrequency] || 'periodic';
    return `Next ${indicatorName} update date unavailable (${freq} indicator)`;
  }
  const now     = Date.now();
  const target  = new Date(nextReleaseDate).getTime();
  const diffMs  = target - now;
  const diffDay = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay <= 0)  return `${indicatorName} release is due now or overdue`;
  if (diffDay === 1) return `Next update expected tomorrow (${indicatorName})`;
  return `Next update expected in ${diffDay} day${diffDay === 1 ? '' : 's'} (${indicatorName})`;
}

/**
 * Derive the soonest upcoming release date across all indicators.
 * @param {Array} indicators
 * @returns {{ date: string|null, indicatorName: string|null, daysUntil: number|null }}
 */
function findNextSystemUpdate(indicators) {
  const now = Date.now();
  let soonest = null;

  for (const ind of indicators) {
    if (!ind.nextReleaseDate) continue;
    const ms = new Date(ind.nextReleaseDate).getTime();
    if (ms < now) continue;  // already due / overdue
    if (!soonest || ms < new Date(soonest.date).getTime()) {
      soonest = {
        date:          ind.nextReleaseDate,
        indicatorName: ind.name || ind.indicator || ind.code,
        daysUntil:     Math.ceil((ms - now) / (1000 * 60 * 60 * 24)),
      };
    }
  }

  return soonest ?? { date: null, indicatorName: null, daysUntil: null };
}

/**
 * Compute the confidence score (0–100) for the current data snapshot.
 *
 * Each indicator contributes its importance weight, scaled by:
 *   - Freshness penalty   (fresh = 1.0 | stale = 0.65 | outdated = 0.25 | missing = 0)
 *   - Delay flag penalty  (isReleaseDelayed reduces score an additional 15 %)
 *
 * @param {Array} indicators
 * @returns {number} integer in [0, 100]
 */
function calcTransparencyConfidence(indicators) {
  if (!indicators || indicators.length === 0) return 0;

  const FRESH_MULT = { fresh: 1.00, stale: 0.65, outdated: 0.25 };
  let weightedScore = 0;

  for (const [code, weight] of Object.entries(TRANSPARENCY_WEIGHTS)) {
    const ind = indicators.find(i => i.code === code);
    if (!ind) continue;

    const freshMult  = FRESH_MULT[ind.freshness]   ?? 0.25;
    const delayMult  = ind.isReleaseDelayed ? 0.85 : 1.00;
    weightedScore += (weight / TRANSPARENCY_TOTAL_WEIGHT) * freshMult * delayMult;
  }

  return Math.round(Math.min(100, weightedScore * 100));
}


/**
 * Generate a complete data transparency report for the current indicator snapshot.
 *
 * ── Per-indicator entries ─────────────────────────────────────────────────────
 * Each entry in `indicators` is reported with:
 *   code            – indicator code
 *   name            – display name
 *   lastUpdated     – ISO date of latest observed release
 *   nextUpdateExpected – human-readable string (e.g. "in 3 days (CPI)")
 *   nextReleaseDate – raw ISO date or null
 *   dataDelay       – plain-English freshness description
 *   freshness       – 'fresh' | 'stale' | 'outdated'
 *   isDelayed       – true when release date passed but data not yet available
 *   delayReason     – reason string if delayed, else null
 *   confidence      – 0–100 integer for this indicator
 *
 * ── System-level summary ──────────────────────────────────────────────────────
 *   lastUpdated         – most recent lastReleaseDate across all indicators
 *   nextUpdateExpected  – human-readable soonest upcoming release
 *   nextReleaseDate     – raw ISO date of that soonest release
 *   dataDelay           – overall freshness label ('All current' | 'Some data stale' | etc.)
 *   confidence          – 0–100 weighted composite confidence
 *   staleCodes          – indicator codes that are stale
 *   outdatedCodes       – indicator codes that are outdated
 *   delayedCodes        – indicator codes whose release is delayed
 *   missingCodes        – expected codes with no data present
 *   uncertainty         – plain-English uncertainty statement
 *
 * @param {Array} indicators  – Raw indicator array from buildAiInsightsPayload()
 * @returns {{
 *   lastUpdated:        string|null,
 *   nextUpdateExpected: string,
 *   nextReleaseDate:    string|null,
 *   dataDelay:          string,
 *   confidence:         number,
 *   staleCodes:         string[],
 *   outdatedCodes:      string[],
 *   delayedCodes:       string[],
 *   missingCodes:       string[],
 *   uncertainty:        string,
 *   indicators:         Array<Object>
 * }}
 */
export function generateDataTransparency(indicators = []) {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return {
      lastUpdated:        null,
      nextUpdateExpected: 'No indicator data available',
      nextReleaseDate:    null,
      dataDelay:          'No data',
      confidence:         0,
      staleCodes:         [],
      outdatedCodes:      [],
      delayedCodes:       [],
      missingCodes:       Object.keys(TRANSPARENCY_WEIGHTS),
      uncertainty:        'No indicator data is available. All signals are unreliable.',
      indicators:         [],
    };
  }

  // ── Per-indicator entries ────────────────────────────────────────────────
  const perIndicator = indicators.map(ind => {
    const name      = ind.name || ind.indicator || ind.code;
    const freq      = ind.releaseFrequency || 'monthly';
    const conf      = (() => {
      const FRESH_MULT = { fresh: 1.00, stale: 0.65, outdated: 0.25 };
      const fm = FRESH_MULT[ind.freshness] ?? 0.25;
      const dm = ind.isReleaseDelayed ? 0.85 : 1.00;
      return Math.round(fm * dm * 100);
    })();

    return {
      code:               ind.code,
      name,
      lastUpdated:        ind.lastReleaseDate || ind.lastUpdated || ind.latestDate || null,
      nextUpdateExpected: describeNextUpdate(ind.nextReleaseDate, name, freq),
      nextReleaseDate:    ind.nextReleaseDate || null,
      dataDelay:          describeDelay(ind.freshness || 'outdated', ind.daysSinceRelease, freq),
      freshness:          ind.freshness || 'outdated',
      isDelayed:          Boolean(ind.isReleaseDelayed),
      delayReason:        ind.delayReason || null,
      confidence:         conf,
    };
  });

  // ── System-level aggregates ──────────────────────────────────────────────
  const staleCodes    = indicators.filter(i => i.freshness === 'stale').map(i => i.code);
  const outdatedCodes = indicators.filter(i => i.freshness === 'outdated').map(i => i.code);
  const delayedCodes  = indicators.filter(i => i.isReleaseDelayed).map(i => i.code);
  const missingCodes  = Object.keys(TRANSPARENCY_WEIGHTS)
    .filter(code => !indicators.find(i => i.code === code));

  // Most recent release date across all indicators
  const lastUpdated = indicators
    .map(i => i.lastReleaseDate || i.lastUpdated || i.latestDate)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  const nextSystem = findNextSystemUpdate(indicators);
  const nextUpdateExpected = nextSystem.date
    ? nextSystem.daysUntil === 1
      ? `Next update expected tomorrow (${nextSystem.indicatorName})`
      : `Next update expected in ${nextSystem.daysUntil} day${nextSystem.daysUntil === 1 ? '' : 's'} (${nextSystem.indicatorName})`
    : 'Next update date unavailable';

  const confidence = calcTransparencyConfidence(indicators);

  // Overall freshness label
  const dataDelay = outdatedCodes.length > 0 && staleCodes.length > 0
    ? `${outdatedCodes.length} indicator(s) outdated, ${staleCodes.length} stale — data may be behind recent conditions`
    : outdatedCodes.length > 0
      ? `${outdatedCodes.length} indicator(s) outdated — data may not reflect the latest releases`
      : staleCodes.length > 0
        ? `${staleCodes.length} indicator(s) approaching next release — slight staleness present`
        : delayedCodes.length > 0
          ? `All data current, but ${delayedCodes.length} release(s) are delayed beyond scheduled date`
          : 'All indicators current';

  // Uncertainty statement
  const uncertainty = (() => {
    const parts = [];
    if (outdatedCodes.length > 0) {
      parts.push(`Outdated: ${outdatedCodes.join(', ')} — readings may predate recent market-moving events`);
    }
    if (staleCodes.length > 0) {
      parts.push(`Approaching refresh: ${staleCodes.join(', ')} — updates expected soon`);
    }
    if (delayedCodes.length > 0) {
      parts.push(`Release delayed: ${delayedCodes.join(', ')} — scheduled date passed, awaiting publication`);
    }
    if (missingCodes.length > 0) {
      parts.push(`Missing: ${missingCodes.join(', ')} — no data available for these indicators`);
    }
    if (parts.length === 0) {
      return `All ${indicators.length} indicators are current. Data reliability is high.`;
    }
    return parts.join('. ') + '.';
  })();

  return {
    lastUpdated,
    nextUpdateExpected,
    nextReleaseDate:    nextSystem.date,
    dataDelay,
    confidence,
    staleCodes,
    outdatedCodes,
    delayedCodes,
    missingCodes,
    uncertainty,
    indicators:         perIndicator,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Public API — conflict detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect macro signal conflicts across all assets and return a structured report.
 *
 * A conflict fires when two indicators in a defined pair are both present,
 * both directional, and point in OPPOSITE directions (gold-perspective impact).
 *
 * Rules applied to any conflicted asset:
 *   - `bias` → 'mixed'  when net score is within 2 × BIAS_THRESH of zero
 *   - `strength`   capped at 'moderate' (never 'strong')
 *   - `confidence` downgraded one tier (high→medium, medium→low)
 *
 * @param {Array} indicators – Raw indicator array from buildAiInsightsPayload()
 * @returns {{
 *   gold:        { hasConflict, conflictingCodes, explanation },
 *   forex: {
 *     EURUSD:    { hasConflict, conflictingCodes, explanation },
 *     GBPUSD:    { hasConflict, conflictingCodes, explanation },
 *     USDJPY:    { hasConflict, conflictingCodes, explanation },
 *     AUDUSD:    { hasConflict, conflictingCodes, explanation },
 *     USDCHF:    { hasConflict, conflictingCodes, explanation },
 *   },
 *   commodities: {
 *     oil:       { hasConflict, conflictingCodes, explanation },
 *   },
 *   summary: {
 *     totalConflicts:    number,     total assets with at least one conflict
 *     conflictedAssets:  string[],   list of asset keys that have a conflict
 *     overallSeverity:   'none' | 'low' | 'medium' | 'high',
 *     note:              string      plain-English summary
 *   }
 * }}
 */
export function detectSignalConflicts(indicators = []) {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    const none = { hasConflict: false, conflictingCodes: [], explanation: null };
    return {
      gold:        { ...none },
      forex:       { EURUSD: { ...none }, GBPUSD: { ...none }, USDJPY: { ...none }, AUDUSD: { ...none }, USDCHF: { ...none } },
      commodities: { oil: { ...none } },
      summary: { totalConflicts: 0, conflictedAssets: [], overallSeverity: 'none', note: 'No indicator data available.' },
    };
  }

  const gold   = detectAssetConflict(indicators, 'gold');
  const eurusd = detectAssetConflict(indicators, 'EURUSD');
  const gbpusd = detectAssetConflict(indicators, 'GBPUSD');
  const usdjpy = detectAssetConflict(indicators, 'USDJPY');
  const audusd = detectAssetConflict(indicators, 'AUDUSD');
  const usdchf = detectAssetConflict(indicators, 'USDCHF');
  const oil    = detectAssetConflict(indicators, 'oil');

  const allResults = { gold, eurusd, gbpusd, usdjpy, audusd, usdchf, oil };
  const assetKeys  = Object.keys(allResults);
  const conflictedAssets = assetKeys.filter(k => allResults[k].hasConflict);
  const totalConflicts   = conflictedAssets.length;

  const overallSeverity = totalConflicts === 0         ? 'none'
                        : totalConflicts <= 2          ? 'low'
                        : totalConflicts <= 4          ? 'medium'
                        :                               'high';

  const note = totalConflicts === 0
    ? 'All macro signals are internally consistent. No conflicting indicator pairs detected.'
    : `${totalConflicts} asset signal(s) have conflicting macro drivers: ${conflictedAssets.join(', ')}. ` +
      `Treat signals for these assets with reduced conviction.`;

  return {
    gold,
    forex:       { EURUSD: eurusd, GBPUSD: gbpusd, USDJPY: usdjpy, AUDUSD: audusd, USDCHF: usdchf },
    commodities: { oil },
    summary: { totalConflicts, conflictedAssets, overallSeverity, note },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Final unified output — buildMacroSummary
// ─────────────────────────────────────────────────────────────────────────────

/** Numeric mapping used to derive the overall market bias. */
const BIAS_NUM = { bullish: 1, bearish: -1, mixed: 0, neutral: 0 };

/** Asset importance weights for the overall market bias composite. */
const OVERALL_ASSET_WEIGHTS = {
  gold:   0.30,
  EURUSD: 0.20,
  GBPUSD: 0.15,
  USDJPY: 0.15,
  oil:    0.20,
};

/** Strength tier → numeric magnitude used in weighted sums. */
const STRENGTH_NUM = { strong: 1.0, moderate: 0.55, weak: 0.20 };

/** Map 0-100 transparency confidence to a label. */
function transparencyConfLabel(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/** Rising risk-alerts that are always surfaced in the summary. */
const ALWAYS_SURFACE_ALERT_PATTERNS = [
  /outdated/i,
  /delayed/i,
  /fallback/i,
  /stale/i,
  /missing/i,
  /conflict/i,
  /low.confidence/i,
];

/**
 * Select the most decision-relevant risk alerts (max 5).
 * Priority: (1) data quality, (2) conflict, (3) everything else.
 */
function pickTopAlerts(riskAlerts, conflictSummary, transparency) {
  const alerts = [];

  // Conflict warnings first
  if (conflictSummary.overallSeverity !== 'none') {
    alerts.push(`Signal conflict detected (${conflictSummary.conflictedAssets.join(', ')}): ${conflictSummary.note}`);
  }

  // Data quality warnings
  if (transparency.outdatedCodes.length > 0) {
    alerts.push(`Outdated data: ${transparency.outdatedCodes.join(', ')} — readings may not reflect recent conditions`);
  }
  if (transparency.delayedCodes.length > 0) {
    alerts.push(`Release delayed: ${transparency.delayedCodes.join(', ')} — scheduled publication date has passed`);
  }
  if (transparency.missingCodes.length > 0) {
    alerts.push(`Missing indicators: ${transparency.missingCodes.join(', ')} — signals derived without these inputs`);
  }
  if (transparency.staleCodes.length > 0) {
    alerts.push(`Approaching refresh: ${transparency.staleCodes.join(', ')} — next release expected soon`);
  }

  // Additional alerts from the existing risk-alert array (deduplicated)
  if (Array.isArray(riskAlerts)) {
    for (const a of riskAlerts) {
      if (alerts.length >= 5) break;
      if (!alerts.some(existing => existing.slice(0, 40) === String(a).slice(0, 40))) {
        alerts.push(String(a));
      }
    }
  }

  return alerts.slice(0, 5);
}

/**
 * Build the overall market bias from per-asset results.
 *
 * Weighted sum of asset bias × strength across primary assets.
 * Conflicts reduce the effective contribution of that asset by 40 %.
 *
 * @param {Object} signals – output of calculateMarketImpact()
 * @returns {{ bias: string, strength: string, score: number }}
 */
function calcOverallBias(signals) {
  let total   = 0;
  let weights = 0;

  for (const [asset, weight] of Object.entries(OVERALL_ASSET_WEIGHTS)) {
    const result = asset === 'gold' ? signals.gold
                 : asset === 'oil'  ? signals.commodities?.oil
                 : signals.forex?.[asset];
    if (!result) continue;

    const dir  = BIAS_NUM[result.bias]   ?? 0;
    const mag  = STRENGTH_NUM[result.strength] ?? STRENGTH_NUM.weak;
    const conf = result.hasConflict ? 0.60 : 1.00;   // conflict penalty

    total   += dir * mag * conf * weight;
    weights += weight;
  }

  if (weights === 0) return { bias: 'neutral', strength: 'weak', score: 0 };

  const score = total / weights;
  return {
    bias:     score >=  BIAS_THRESH ? 'Bullish'
            : score <= -BIAS_THRESH ? 'Bearish'
            : 'Neutral',
    strength: Math.abs(score) >= STRONG_THRESH   ? 'Strong'
            : Math.abs(score) >= MODERATE_THRESH ? 'Moderate'
            : 'Weak',
    score:    roundScore(score),
  };
}

/**
 * Build the final unified macro summary for end-user consumption.
 *
 * Combines:
 *   calculateMarketImpact()     → per-asset bias / strength / conflict
 *   calculateCrossAssetImpact() → correlation-adjusted signals + AUDUSD/USDCHF
 *   generateAllExplanations()   → human-readable WHY per asset
 *   generateDataTransparency()  → data freshness, next release, confidence 0-100
 *   detectSignalConflicts()     → conflict scan across all assets
 *   calculateRealRate()         → real yield structural context
 *
 * Output is designed for a single API response that lets users instantly answer:
 *   1. What is happening?   → marketBias, strength, confidence
 *   2. Why?                 → explanation (per-asset reasoning)
 *   3. Can I trust this?    → confidence, riskAlerts, dataInfo
 *
 * @param {Array}    indicators   – raw indicator array from buildAiInsightsPayload()
 * @param {string[]} [extraAlerts] – optional pre-built risk alerts from the
 *                                   existing economicIntelligenceService pipeline
 * @returns {{
 *   marketBias:  string,             'Bullish' | 'Bearish' | 'Neutral'
 *   strength:    string,             'Strong' | 'Moderate' | 'Weak'
 *   confidence:  number,             0–100 integer
 *   gold:        Object,             bias/strength/confidence/score/conflict + explanation
 *   forex:       Object,             EURUSD | GBPUSD | USDJPY | AUDUSD | USDCHF
 *   commodities: Object,             oil
 *   explanation: Object,             { summary, reasoning[], marketImpact } per asset
 *   riskAlerts:  string[],           max 5 most decision-relevant alerts
 *   dataInfo:    Object              lastUpdated, nextUpdateExpected, dataDelay,
 *                                    confidence, uncertainty
 * }}
 */
export function buildMacroSummary(indicators = [], extraAlerts = []) {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return {
      marketBias:  'Neutral',
      strength:    'Weak',
      confidence:  0,
      gold:        null,
      forex:       null,
      commodities: null,
      explanation: null,
      riskAlerts:  ['No indicator data available — all signals are unreliable.'],
      dataInfo: {
        lastUpdated:        null,
        nextUpdateExpected: 'Unknown',
        dataDelay:          'No data',
        confidence:         0,
        uncertainty:        'No indicator data is available.',
      },
    };
  }

  // ── Step 1: run all sub-engines ──────────────────────────────────────────
  const baseSignals    = calculateMarketImpact(indicators);
  const crossSignals   = calculateCrossAssetImpact(baseSignals);
  const explanations   = generateAllExplanations(crossSignals, indicators);
  const transparency   = generateDataTransparency(indicators);
  const conflictReport = detectSignalConflicts(indicators);

  // Real rate context (informational)
  const fedRate = indicators.find(i => i.code === 'FedRate');
  const cpi     = indicators.find(i => i.code === 'CPI');
  const realRateInfo = (fedRate?.actual != null && cpi?.actual != null)
    ? calculateRealRate(fedRate.actual, cpi.actual * 12)
    : null;

  // ── Step 2: overall bias ─────────────────────────────────────────────────
  const overall = calcOverallBias(baseSignals);

  // ── Step 3: confidence — transparency score, conflict-adjusted ───────────
  let confidence = transparency.confidence;
  if (conflictReport.summary.overallSeverity === 'high')   confidence = Math.round(confidence * 0.60);
  else if (conflictReport.summary.overallSeverity === 'medium') confidence = Math.round(confidence * 0.75);
  else if (conflictReport.summary.overallSeverity === 'low')    confidence = Math.round(confidence * 0.88);
  confidence = Math.max(0, Math.min(100, confidence));

  // ── Step 4: merge explanations into per-asset signal objects ─────────────
  function mergeExplanation(signal, expl) {
    if (!signal) return null;
    return {
      ...signal,
      explanation: expl ?? null,
    };
  }

  const gold = mergeExplanation(crossSignals.gold, explanations.gold);

  const forex = {
    EURUSD: mergeExplanation(crossSignals.forex?.EURUSD, explanations.forex?.EURUSD),
    GBPUSD: mergeExplanation(crossSignals.forex?.GBPUSD, explanations.forex?.GBPUSD),
    USDJPY: mergeExplanation(crossSignals.forex?.USDJPY, explanations.forex?.USDJPY),
    AUDUSD: mergeExplanation(crossSignals.forex?.AUDUSD, explanations.forex?.AUDUSD),
    USDCHF: mergeExplanation(crossSignals.forex?.USDCHF, explanations.forex?.USDCHF),
  };

  const commodities = {
    oil: mergeExplanation(crossSignals.commodities?.oil, explanations.commodities?.oil),
  };

  // ── Step 5: risk alerts ───────────────────────────────────────────────────
  const riskAlerts = pickTopAlerts(extraAlerts, conflictReport.summary, transparency);

  // ── Step 6: dataInfo — stripped to essentials ────────────────────────────
  const dataInfo = {
    lastUpdated:        transparency.lastUpdated,
    nextUpdateExpected: transparency.nextUpdateExpected,
    nextReleaseDate:    transparency.nextReleaseDate,
    dataDelay:          transparency.dataDelay,
    confidence,
    confidenceLabel:    transparencyConfLabel(confidence),
    uncertainty:        transparency.uncertainty,
    staleCodes:         transparency.staleCodes,
    outdatedCodes:      transparency.outdatedCodes,
    delayedCodes:       transparency.delayedCodes,
    missingCodes:       transparency.missingCodes,
    realRate:           realRateInfo,
    conflictSeverity:   conflictReport.summary.overallSeverity,
  };

  return {
    marketBias:  overall.bias,
    strength:    overall.strength,
    confidence,
    gold,
    forex,
    commodities,
    explanation: explanations,
    riskAlerts,
    dataInfo,
  };
}
