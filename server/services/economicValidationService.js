import axios from 'axios';
import { z } from 'zod';

const NUM = z.preprocess((v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const HIST_POINT_SCHEMA = z.object({
  date: z.string().optional(),
  actual: NUM.optional(),
  forecast: NUM.optional(),
  previous: NUM.optional(),
});

const INDICATOR_SCHEMA = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
  actual: NUM.optional(),
  forecast: NUM.optional(),
  surprise: NUM.optional(),
  impact: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  impactStrength: z.enum(['strong', 'moderate', 'weak']).optional(),
  releaseFrequency: z.string().optional(),
  releaseTime: z.string().nullable().optional(),
  lastReleaseDate: z.string().nullable().optional(),
  latestDate: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  dataSource: z.string().nullable().optional(),
  historicalData: z.array(HIST_POINT_SCHEMA).optional(),
}).passthrough();

const RELEASE_WINDOW_DAYS = {
  weekly: 14,
  monthly: 45,
  quarterly: 120,
};

const SOURCE_RELIABILITY = {
  'FRED API': 'high',
  'FRED API (Federal Reserve)': 'high',
  'Bureau of Labor Statistics': 'high',
  'BLS': 'high',
  'BEA': 'high',
  'TradingEconomics': 'medium',
  'Finnhub': 'medium',
  'manual': 'low',
};

const SCORE_WEIGHTS = {
  CPI: 2.0,
  NFP: 1.8,
  FedRate: 1.8,
  CorePCE: 1.6,
  UNEMPLOYMENT: 1.2,
  GDP: 1.2,
  JoblessClaims: 0.8,
  RetailSales: 0.8,
  ISMManufacturing: 0.7,
  ConsumerConf: 0.7,
};

const MARKETS_REGIMES = ['HIGH_INFLATION', 'RECESSION', 'OVERHEATING', 'MIXED'];

const REGIME_WEIGHTS = {
  HIGH_INFLATION: {
    CPI: 2.8,
    CorePCE: 2.2,
    FedRate: 1.2,
    NFP: 1.4,
    UNEMPLOYMENT: 0.8,
    GDP: 1.0,
    JoblessClaims: 0.6,
    RetailSales: 0.7,
    ISMManufacturing: 0.6,
    ConsumerConf: 0.6,
  },
  RECESSION: {
    UNEMPLOYMENT: 2.0,
    JoblessClaims: 1.8,
    NFP: 1.6,
    RetailSales: 1.4,
    GDP: 1.2,
    ISMManufacturing: 1.2,
    CPI: 1.0,
    CorePCE: 1.0,
    FedRate: 1.0,
    ConsumerConf: 1.0,
  },
  OVERHEATING: {
    CPI: 2.4,
    CorePCE: 2.0,
    NFP: 1.6,
    FedRate: 1.8,
    GDP: 1.4,
    RetailSales: 1.2,
    ISMManufacturing: 1.2,
    ConsumerConf: 1.0,
    UNEMPLOYMENT: 0.8,
    JoblessClaims: 0.6,
  },
  MIXED: SCORE_WEIGHTS,
};

const IMPACT_REASON_TEMPLATE = {
  CPI: 'CPI surprise impacts real-rate expectations; lower real rates usually support gold.',
  NFP: 'NFP surprise shifts growth and Fed expectations; stronger labor tends to support USD and pressure gold.',
  FedRate: 'Rate surprises move real yields directly; higher rates are typically bearish for gold.',
  CorePCE: 'Core PCE is a Fed-focused inflation gauge; upside surprise can support gold via inflation hedge flows.',
  UNEMPLOYMENT: 'Higher unemployment can signal growth stress and increase safe-haven demand for gold.',
  GDP: 'GDP surprises alter risk sentiment and yield expectations, affecting gold through USD and real rates.',
  JoblessClaims: 'Higher claims indicate labor softening, often supportive for defensive gold positioning.',
  RetailSales: 'Retail sales surprises influence growth momentum and rate expectations that feed into gold pricing.',
  ISMManufacturing: 'Manufacturing surprises change growth/risk outlook and indirectly affect gold demand.',
  ConsumerConf: 'Confidence surprises can shift growth expectations and risk appetite, influencing gold flows.',
};

let goldSeriesCache = {
  from: null,
  to: null,
  values: null,
  fetchedAt: 0,
};

function parseDateOnly(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

function sourceReliabilityFor(source) {
  if (!source) return 'medium';
  return SOURCE_RELIABILITY[source] || 'medium';
}

function normalizeReleaseFrequency(freq) {
  const lower = String(freq || '').toLowerCase();
  if (lower.includes('week')) return 'weekly';
  if (lower.includes('quarter')) return 'quarterly';
  return 'monthly';
}

function computeReleasedAt(lastReleaseDate, releaseTime) {
  if (!lastReleaseDate) return null;
  const date = String(lastReleaseDate).slice(0, 10);
  if (!releaseTime) return `${date}T00:00:00.000Z`;
  const [hh, mm] = String(releaseTime).split(':').map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return `${date}T00:00:00.000Z`;
  const dt = new Date(`${date}T00:00:00.000Z`);
  dt.setUTCHours(hh, mm, 0, 0);
  return dt.toISOString();
}

function isStaleByReleaseWindow(lastReleaseDate, releaseFrequency) {
  const d = parseDateOnly(lastReleaseDate);
  if (!d) return true;
  const daysOld = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const maxDays = RELEASE_WINDOW_DAYS[normalizeReleaseFrequency(releaseFrequency)] || RELEASE_WINDOW_DAYS.monthly;
  return daysOld > maxDays;
}

export function calculateSurprise(actual, forecast) {
  if (!Number.isFinite(actual) || !Number.isFinite(forecast)) return null;
  return Math.round((actual - forecast) * 10000) / 10000;
}

function normalizeImpactDirection(indicator) {
  const impact = String(indicator.impact || '').toLowerCase();
  if (impact === 'bullish') return 1;
  if (impact === 'bearish') return -1;
  return 0;
}

export function generateImpactReason(indicator) {
  const base = IMPACT_REASON_TEMPLATE[indicator.code] || 'Macro surprise affects USD, real yields, and risk sentiment.';
  const surprise = indicator.surprise;
  if (!Number.isFinite(surprise) || surprise === 0) {
    return `${indicator.code}: no measurable surprise vs forecast; directional signal is weak.`;
  }

  const sign = surprise > 0 ? 'above' : 'below';
  const bias = indicator.impact === 'bullish' ? 'bullish for gold' : indicator.impact === 'bearish' ? 'bearish for gold' : 'neutral for gold';
  return `${indicator.code} printed ${sign} forecast (${surprise > 0 ? '+' : ''}${surprise}). ${base} Net interpretation: ${bias}.`;
}

export function validateEconomicIndicator(indicator, fetchedAtIso) {
  const parsed = INDICATOR_SCHEMA.safeParse(indicator);
  if (!parsed.success) {
    return {
      ...indicator,
      actual: null,
      forecast: null,
      surprise: null,
      dataUnavailable: true,
      validation: {
        valid: false,
        issues: ['Schema validation failed'],
        checks: {
          surpriseVerified: false,
          freshnessOk: false,
          numericOk: false,
          sourceReliable: false,
        },
      },
    };
  }

  const data = parsed.data;
  const source = data.source || data.dataSource || 'FRED API';
  const reliability = sourceReliabilityFor(source);

  const actual = Number.isFinite(data.actual) ? data.actual : null;
  const forecast = Number.isFinite(data.forecast) ? data.forecast : null;
  const recomputedSurprise = calculateSurprise(actual, forecast);
  const providedSurprise = Number.isFinite(data.surprise) ? data.surprise : null;

  const surpriseMismatch = (
    Number.isFinite(providedSurprise)
    && Number.isFinite(recomputedSurprise)
    && Math.abs(providedSurprise - recomputedSurprise) > 0.0001
  );

  const releaseFrequency = normalizeReleaseFrequency(data.releaseFrequency);
  const lastReleaseDate = data.lastReleaseDate || data.latestDate || null;
  const staleByWindow = isStaleByReleaseWindow(lastReleaseDate, releaseFrequency);
  const releasedAt = computeReleasedAt(lastReleaseDate, data.releaseTime || null);

  const issues = [];
  if (actual === null) issues.push('Missing or invalid actual value');
  if (forecast === null) issues.push('Missing or invalid forecast value');
  if (surpriseMismatch) issues.push('Provided surprise did not match actual-forecast and was corrected');
  if (staleByWindow) issues.push('Data is outside freshness release window');
  if (reliability === 'low') issues.push('Low reliability data source');

  const impact = data.impact || indicator.impact || 'neutral';

  return {
    ...indicator,
    actual,
    forecast,
    surprise: recomputedSurprise,
    source,
    sourceReliability: reliability,
    releaseFrequency,
    releasedAt,
    dataFetchedAt: fetchedAtIso,
    dataUnavailable: actual === null || forecast === null,
    reasoning: generateImpactReason({ ...indicator, code: data.code, impact, surprise: recomputedSurprise }),
    validation: {
      valid: issues.length === 0,
      issues,
      checks: {
        surpriseVerified: !surpriseMismatch && recomputedSurprise !== null,
        freshnessOk: !staleByWindow,
        numericOk: actual !== null && forecast !== null,
        sourceReliable: reliability !== 'low',
      },
    },
  };
}

function confidenceFromContributors(contributors) {
  const directional = contributors.filter((c) => c.direction !== 0);
  const positives = directional.filter((c) => c.direction > 0).length;
  const negatives = directional.filter((c) => c.direction < 0).length;
  const strong = directional.filter((c) => c.magnitude >= 0.7).length;

  if (directional.length >= 4 && strong >= 3 && (positives === 0 || negatives === 0)) return 'High';
  if (directional.length >= 3 && positives > 0 && negatives > 0) return 'Medium';
  if (directional.length >= 2) return 'Medium';
  return 'Low';
}

export function detectMarketRegime(indicators = []) {
  const indicatorMap = new Map();
  for (const ind of indicators) {
    indicatorMap.set(ind.code, ind);
  }

  // Extract all economic surprises
  const cpiSurprise = indicatorMap.get('CPI')?.surprise ?? 0;
  const corePceSurprise = indicatorMap.get('CorePCE')?.surprise ?? 0;
  const nfpSurprise = indicatorMap.get('NFP')?.surprise ?? 0;
  const unemploymentSurprise = indicatorMap.get('UNEMPLOYMENT')?.surprise ?? 0;
  const joblessClaimsSurprise = indicatorMap.get('JoblessClaims')?.surprise ?? 0;
  const retailSalesSurprise = indicatorMap.get('RetailSales')?.surprise ?? 0;
  const gdpSurprise = indicatorMap.get('GDP')?.surprise ?? 0;
  const consumerConfidenceSurprise = indicatorMap.get('ConsumerConf')?.surprise ?? 0;

  // Initialize three-factor scoring system
  let inflationScore = 0;
  let laborScore = 0;
  let growthScore = 0;

  // INFLATION SCORING (CPI/CorePCE surprise is in percentage points, typical range ±0.1–0.3)
  if (cpiSurprise > 0.1) inflationScore += 2;
  else if (cpiSurprise > 0) inflationScore += 1;
  if (cpiSurprise < -0.1) inflationScore -= 2;
  else if (cpiSurprise < 0) inflationScore -= 1;
  if (corePceSurprise > 0.1) inflationScore += 2;
  else if (corePceSurprise > 0) inflationScore += 1;
  if (corePceSurprise < -0.1) inflationScore -= 2;
  else if (corePceSurprise < 0) inflationScore -= 1;

  // LABOR SCORING (NFP surprise is in thousands, normalize: >50K significant)
  if (nfpSurprise < -50) laborScore -= 2;
  else if (nfpSurprise < 0) laborScore -= 1;
  if (nfpSurprise > 50) laborScore += 2;
  else if (nfpSurprise > 0) laborScore += 1;
  if (unemploymentSurprise > 0.1) laborScore -= 2;
  else if (unemploymentSurprise > 0) laborScore -= 1;
  if (unemploymentSurprise < -0.1) laborScore += 1;
  if (joblessClaimsSurprise > 5) laborScore -= 1;
  if (joblessClaimsSurprise < -5) laborScore += 1;

  // GROWTH SCORING (now can increment AND decrement)
  if (retailSalesSurprise < -0.2) growthScore -= 2;
  else if (retailSalesSurprise < 0) growthScore -= 1;
  if (retailSalesSurprise > 0.2) growthScore += 2;
  else if (retailSalesSurprise > 0) growthScore += 1;
  if (gdpSurprise < -0.2) growthScore -= 3;
  else if (gdpSurprise < 0) growthScore -= 1;
  if (gdpSurprise > 0.2) growthScore += 3;
  else if (gdpSurprise > 0) growthScore += 1;
  if (consumerConfidenceSurprise < -1) growthScore -= 1;
  if (consumerConfidenceSurprise > 1) growthScore += 1;

  // REGIME CLASSIFICATION LOGIC
  let regime = 'MIXED';

  // Check for HIGH_INFLATION regime: strong inflation + stable labor
  if (inflationScore > 1 && laborScore >= 0) {
    regime = 'HIGH_INFLATION';
  }
  // Check for RECESSION regime: weak labor + weak growth
  else if (laborScore < -2 && growthScore < -2) {
    regime = 'RECESSION';
  }
  // Check for OVERHEATING regime: strong inflation + strong growth
  else if (inflationScore > 1 && growthScore > 1) {
    regime = 'OVERHEATING';
  }
  // All other combinations classified as MIXED

  // ─────────────────────────────────────────────────────────────────────
  // ENHANCED REGIME CONFIDENCE: base + signalStrengthFactor + alignmentFactor
  // ─────────────────────────────────────────────────────────────────────
  // Formula: confidence = base (30–85%) + signalStrengthFactor (0–25%) + alignmentFactor (0–15%)
  // Rules: MIXED=30–60%, Strong Regime=60–85%, minimum=20%, never 0%
  
  const totalSignalStrength = Math.abs(inflationScore) + Math.abs(laborScore) + Math.abs(growthScore);

  // 1. BASE confidence by regime type
  let baseConfidence;
  if (regime === 'HIGH_INFLATION' || regime === 'OVERHEATING') {
    baseConfidence = 60; // Strong regime: start at 60%
  } else if (regime === 'RECESSION') {
    baseConfidence = 35; // Recession: start at 35% (moderate concern)
  } else {
    baseConfidence = 32; // MIXED: start at 32%
  }

  // 2. SIGNAL STRENGTH FACTOR: +0 to +25% based on how strong the signals are
  // Normalize: 0–6 range → 0–25% bonus
  const signalStrengthFactor = Math.min(25, (totalSignalStrength / 6) * 25);

  // 3. ALIGNMENT FACTOR: +0 to +15% based on how aligned the three pillars are
  // Perfect alignment (all 3 strong): +15%, Partial alignment: +5–10%, Weak alignment: 0–5%
  let alignmentFactor = 0;
  const maxAbsScore = Math.max(Math.abs(inflationScore), Math.abs(laborScore), Math.abs(growthScore));
  if (maxAbsScore >= 3) {
    alignmentFactor = 15; // All pillars very strong
  } else if (maxAbsScore >= 2) {
    alignmentFactor = 10; // Strong signals in multiple pillars
  } else if (maxAbsScore >= 1) {
    alignmentFactor = 5;  // Moderate alignment
  }

  // 4. AGGREGATE confidence (before clipping to regime bounds)
  let rawConfidence = baseConfidence + signalStrengthFactor + alignmentFactor;

  // 5. APPLY REGIME-SPECIFIC BOUNDS
  let regimeConfidence;
  if (regime === 'HIGH_INFLATION' || regime === 'OVERHEATING') {
    // Strong regime: 60–85%, minimum 20%
    regimeConfidence = Math.max(20, Math.min(85, rawConfidence));
  } else if (regime === 'RECESSION') {
    // Recession: 30–70%, minimum 20%
    regimeConfidence = Math.max(20, Math.min(70, rawConfidence));
  } else {
    // MIXED: 30–60%, minimum 20%
    regimeConfidence = Math.max(20, Math.min(60, rawConfidence));
  }

  return {
    regime: regime,
    regimeConfidence: Math.round(regimeConfidence),
    regimeBreakdown: {
      inflationScore,
      laborScore,
      growthScore,
    },
  };
}

export function getDynamicWeights(regime = 'MIXED') {
  return REGIME_WEIGHTS[regime] || REGIME_WEIGHTS.MIXED;
}

export function computeMacroScore(indicators = []) {
  // Detect market regime
  const regimeResult = detectMarketRegime(indicators);
  const { regime, regimeConfidence } = regimeResult;

  // Get dynamic weights based on regime
  const dynamicWeights = getDynamicWeights(regime);

  const contributors = [];
  let rawSum = 0;
  let maxRaw = 0;

  for (const indicator of indicators) {
    const weight = dynamicWeights[indicator.code];
    if (!weight) continue;

    const direction = normalizeImpactDirection(indicator);
    const strength = String(indicator.impactStrength || 'weak').toLowerCase();
    const magnitude = strength === 'strong' ? 1.0 : strength === 'moderate' ? 0.6 : 0.25;
    const contribution = direction * magnitude * weight;

    maxRaw += weight;
    rawSum += contribution;

    contributors.push({
      code: indicator.code,
      name: indicator.name || indicator.code,
      actual: indicator.actual ?? null,
      forecast: indicator.forecast ?? null,
      surprise: indicator.surprise ?? null,
      contribution: Math.round(contribution * 100) / 100,
      direction,
      magnitude,
      source: indicator.source || indicator.dataSource || null,
      releasedAt: indicator.releasedAt || null,
      lastUpdated: indicator.dataFetchedAt || null,
      reasoning: indicator.reasoning || generateImpactReason(indicator),
      weight: Math.round(weight * 100) / 100,
    });
  }

  const normalized = maxRaw > 0 ? (rawSum / maxRaw) * 10 : 0;
  const score = Math.round(Math.max(-10, Math.min(10, normalized)) * 10) / 10;

  let label = 'Neutral';
  if (score >= 2) label = 'Bullish';
  if (score <= -2) label = 'Bearish';

  const signalStrength = computeSignalStrength(contributors);
  const dataConfidence = computeDataConfidence(indicators);
  const signalConfidence = computeSignalConfidence({
    contributors,
    regime,
    signalStrength,
    dataConfidence,
  });
  const uncertainty = computeUncertainty({
    contributors,
    regime,
    signalStrength,
    dataConfidence,
  });
  const signalConfidenceScore = mapSignalConfidenceToRange(signalConfidence, contributors);
  const systemStatus = computeSystemStatus(dataConfidence, signalConfidence);

  contributors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const dynamicWeightsStr = Object.entries(dynamicWeights)
    .filter(([code]) => dynamicWeights[code] !== SCORE_WEIGHTS[code])
    .map(([code, weight]) => `${code}: ${weight}`)
    .join(', ');

  const formula =
    regime === 'MIXED'
      ? 'score = clamp(-10..10, (sum(weight_i * direction_i * magnitude_i) / sum(weight_i)) * 10)'
      : `score = clamp(-10..10, (sum(weight_i_${regime} * direction_i * magnitude_i) / sum(weight_i_${regime})) * 10) [regime weights applied]`;

  return {
    score,
    label,
    bias: label,
    signalStrength,
    signalConfidence,
    signalConfidenceScore,
    uncertainty,
    dataConfidence,
    systemStatus,
    regime,
    regimeConfidence,
    formula,
    weights: dynamicWeights,
    contributors,
    computation: {
      rawSum: Math.round(rawSum * 1000) / 1000,
      maxRaw: Math.round(maxRaw * 1000) / 1000,
      normalization: 'x10 / sum(weights)',
      appliedWeightAdjustments: dynamicWeightsStr ? `(${regime}): ${dynamicWeightsStr}` : 'baseline weights',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Three-part confidence system
// ─────────────────────────────────────────────────────────────────────────────

export function computeDataConfidence(indicators = []) {
  // Three-factor data quality scoring system
  // Formula: dataQuality = (completeness * 0.5) + (freshness * 0.3) + (validity * 0.2)
  // Output range: 40–95% (never 0% unless system failure)
  // Factors:
  //   1. Completeness: % of indicators available vs expected
  //   2. Freshness: Time recency (recent = high, stale = low penalty not zero)
  //   3. Validity: % of valid indicators without null/invalid values

  // ─────────────────────────────────────────────────────────────────────
  // SYSTEM FAILURE: No indicators at all
  // ─────────────────────────────────────────────────────────────────────
  if (indicators.length === 0) return 0;

  const EXPECTED_COUNT = 10; // Expected number of key indicators

  // ─────────────────────────────────────────────────────────────────────
  // 1. COMPLETENESS FACTOR (0–100): % of available indicators
  // ─────────────────────────────────────────────────────────────────────
  // Full credit at 7+ indicators, scales down proportionally
  const completenessScore = Math.min(100, (indicators.length / EXPECTED_COUNT) * 100);

  // ─────────────────────────────────────────────────────────────────────
  // 2. FRESHNESS FACTOR (0–100): Time-based quality scoring
  // ─────────────────────────────────────────────────────────────────────
  // Fresh (≤7 days): 100%
  // Recent (≤30 days): 75%
  // Moderate (≤45 days): 50%
  // Stale (>45 days): 30% (NOT zero — stale data still has value)
  
  let freshnessTotalScore = 0;
  let freshnessCount = 0;

  for (const ind of indicators) {
    // Try multiple date sources for freshness calculation
    const dateStr = ind.releasedAt || ind.lastReleaseDate || ind.latestDate || ind.lastDate || null;
    if (!dateStr) {
      freshnessTotalScore += 50;
    } else {
      const parsed = new Date(dateStr);
      const daysOld = Number.isNaN(parsed.getTime()) ? 999 : Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
      
      if (daysOld <= 7) {
        freshnessTotalScore += 100; // Fresh
      } else if (daysOld <= 14) {
        freshnessTotalScore += 85;  // Very recent
      } else if (daysOld <= 30) {
        freshnessTotalScore += 70;  // Recent
      } else if (daysOld <= 45) {
        freshnessTotalScore += 50;  // Moderate
      } else {
        freshnessTotalScore += 30;  // Stale (never 0)
      }
    }
    freshnessCount++;
  }

  const freshnessScore = freshnessCount > 0 ? freshnessTotalScore / freshnessCount : 50;

  // ─────────────────────────────────────────────────────────────────────
  // 3. VALIDITY FACTOR (0–100): % of valid data without issues
  // ─────────────────────────────────────────────────────────────────────
  // Valid: indicator has actual/forecast data and no validation issues
  // Invalid: missing data (null) or validation errors
  
  const validIndicators = indicators.filter(ind => {
    // Must have at least one of: actual, forecast, or derived value
    const hasData = ind.actual !== null && ind.actual !== undefined 
                    || ind.forecast !== null && ind.forecast !== undefined;
    
    // Must not have data unavailable flag
    const isAvailable = !ind.dataUnavailable;
    
    // Must not have validation issues
    const isValid = !ind.validation?.issues || ind.validation.issues.length === 0;
    
    return hasData && isAvailable && isValid;
  }).length;

  const validityScore = indicators.length > 0 
    ? (validIndicators / indicators.length) * 100 
    : 50;

  // ─────────────────────────────────────────────────────────────────────
  // 4. AGGREGATE: THREE-FACTOR FORMULA
  // ─────────────────────────────────────────────────────────────────────
  const rawScore = (completenessScore * 0.5) + (freshnessScore * 0.3) + (validityScore * 0.2);

  // Apply output range: 40–95% (never 0% with data present)
  const dataConfidence = Math.max(40, Math.min(95, Math.round(rawScore)));

  return dataConfidence;
}

export function computeSignalStrength(contributors = []) {
  const totalSignals = contributors.length;
  if (totalSignals === 0) return 'Weak';

  const positives = contributors.filter(c => c.direction > 0).length;
  const negatives = contributors.filter(c => c.direction < 0).length;
  const alignedSignals = Math.max(positives, negatives);
  const alignmentRatio = alignedSignals / totalSignals;

  if (alignmentRatio >= 0.75) return 'Strong';
  if (alignmentRatio >= 0.5) return 'Moderate';
  return 'Weak';
}

export function computeSignalConfidence({
  contributors = [],
  regime = 'MIXED',
  signalStrength = 'Weak',
  dataConfidence = 40,
} = {}) {
  if (contributors.length === 0) return 'Low';

  const totalSignals = contributors.length;
  const positives = contributors.filter(c => c.direction > 0).length;
  const negatives = contributors.filter(c => c.direction < 0).length;
  const alignedSignals = Math.max(positives, negatives);
  const alignmentRatio = alignedSignals / totalSignals;

  const regimeClear = regime !== 'MIXED';
  const freshData = dataConfidence >= 60;
  const staleData = dataConfidence < 45;
  const avgMagnitude = contributors.reduce((sum, c) => sum + Math.abs(c.magnitude || 0), 0) / totalSignals;
  const strongSurprise = avgMagnitude >= 0.6;

  // Low: genuinely unreliable
  if (staleData || (signalStrength === 'Weak' && alignmentRatio < 0.4)) {
    return 'Low';
  }

  // High: strong signals with decent data
  if (signalStrength === 'Strong' && freshData && (regimeClear || strongSurprise)) {
    return 'High';
  }

  // Medium: everything else (usable but not definitive)
  return 'Medium';
}

export function computeUncertainty({
  contributors = [],
  regime = 'MIXED',
  signalStrength = 'Weak',
  dataConfidence = 40,
} = {}) {
  if (contributors.length === 0) return 'High';

  const positives = contributors.filter(c => c.direction > 0).length;
  const negatives = contributors.filter(c => c.direction < 0).length;
  const totalSignals = contributors.length;
  const alignedSignals = Math.max(positives, negatives);
  const alignmentRatio = alignedSignals / totalSignals;

  // Mixed signals: require meaningful split (not just 1 outlier)
  const minorityRatio = Math.min(positives, negatives) / totalSignals;
  const mixedSignals = alignmentRatio < 0.5 || minorityRatio >= 0.35;
  if (mixedSignals && dataConfidence < 50) return 'High';
  if (mixedSignals || regime === 'MIXED' || dataConfidence < 60) return 'Medium';
  if (signalStrength === 'Weak') return 'Medium';
  return 'Low';
}

export function mapSignalConfidenceToRange(signalConfidence = 'Low', contributors = []) {
  const avgMagnitude = contributors.length > 0
    ? contributors.reduce((sum, c) => sum + Math.abs(c.magnitude || 0), 0) / contributors.length
    : 0;

  if (signalConfidence === 'Low') {
    return Math.round(Math.min(55, 40 + avgMagnitude * 15));
  }
  if (signalConfidence === 'Medium') {
    return Math.round(Math.min(70, 55 + avgMagnitude * 15));
  }
  return Math.round(Math.min(85, 70 + avgMagnitude * 15));
}

export function computeSystemStatus(dataConfidence = 40, signalConfidence = 'Low') {
  // System status: OK / Warning / Critical
  // Critical only for genuine system failures (no data at all)
  // Warning for degraded but usable states
  // OK for normal operation
  
  if (dataConfidence < 30) {
    return 'Critical';
  }
  
  if (dataConfidence < 55 || signalConfidence === 'Low') {
    return 'Warning';
  }
  
  return 'OK';
}

function expectedDirectionForGold(code, surprise) {
  if (!Number.isFinite(surprise) || surprise === 0) return 0;
  const positiveBullish = new Set(['CPI', 'CorePCE', 'UNEMPLOYMENT', 'JoblessClaims']);
  const positiveBearish = new Set(['NFP', 'FedRate', 'GDP', 'RetailSales', 'ISMManufacturing', 'ConsumerConf']);
  if (positiveBullish.has(code)) return surprise > 0 ? 1 : -1;
  if (positiveBearish.has(code)) return surprise > 0 ? -1 : 1;
  return 0;
}

async function fetchGoldSeries(fromDate, toDate) {
  const withinCache = (
    goldSeriesCache.values
    && goldSeriesCache.from
    && goldSeriesCache.to
    && goldSeriesCache.from <= fromDate
    && goldSeriesCache.to >= toDate
    && (Date.now() - goldSeriesCache.fetchedAt) < 6 * 60 * 60 * 1000
  );

  if (withinCache) return goldSeriesCache.values;

  const fredKey = process.env.FRED_API_KEY || 'demo';
  const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
    params: {
      series_id: 'GOLDAMGBD228NLBM',
      api_key: fredKey,
      file_type: 'json',
      observation_start: fromDate,
      observation_end: toDate,
      sort_order: 'asc',
    },
    timeout: 12000,
  });

  const map = new Map();
  for (const obs of response.data?.observations || []) {
    const value = Number(obs.value);
    if (!Number.isFinite(value)) continue;
    map.set(obs.date, value);
  }

  goldSeriesCache = {
    from: fromDate,
    to: toDate,
    values: map,
    fetchedAt: Date.now(),
  };

  return map;
}

function getGoldMovePctOnNextSession(releaseDate, goldMap) {
  const baseDate = parseDateOnly(releaseDate);
  if (!baseDate) return null;

  const base = goldMap.get(toIsoDate(baseDate));
  if (!Number.isFinite(base)) return null;

  for (let i = 1; i <= 5; i += 1) {
    const nextDate = addDays(baseDate, i);
    const next = goldMap.get(toIsoDate(nextDate));
    if (Number.isFinite(next)) {
      return ((next - base) / base) * 100;
    }
  }

  return null;
}

function summarizeHistoricalValidation(code, points, goldMap, sampleSize) {
  const validPoints = [...(points || [])]
    .filter((p) => p?.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, sampleSize);

  let evaluated = 0;
  let hits = 0;
  const moves = [];

  for (const point of validPoints) {
    const surprise = calculateSurprise(Number(point.actual), Number(point.forecast));
    const expected = expectedDirectionForGold(code, surprise);
    const movePct = getGoldMovePctOnNextSession(point.date, goldMap);
    if (!Number.isFinite(movePct) || expected === 0) continue;

    evaluated += 1;
    moves.push(movePct);

    if ((movePct > 0 && expected > 0) || (movePct < 0 && expected < 0)) {
      hits += 1;
    }
  }

  if (evaluated === 0) {
    return {
      available: false,
      sampleSize,
      evaluatedSamples: 0,
      hitRatePct: null,
      averageMovePct: null,
      statement: 'Historical validation unavailable: insufficient aligned release and gold close data.',
    };
  }

  const hitRatePct = Math.round((hits / evaluated) * 100);
  const avgMove = moves.reduce((a, b) => a + b, 0) / moves.length;
  const averageMovePct = Math.round(avgMove * 100) / 100;

  return {
    available: true,
    sampleSize,
    evaluatedSamples: evaluated,
    hitRatePct,
    averageMovePct,
    statement: `Last ${evaluated} ${code} surprises: gold moved in expected direction ${hitRatePct}% of the time (avg move ${averageMovePct > 0 ? '+' : ''}${averageMovePct}%).`,
  };
}

export async function buildHistoricalValidation(indicators = [], sampleSize = 10) {
  try {
    const releaseDates = indicators
      .flatMap((ind) => ind?.historicalData || [])
      .map((p) => p?.date)
      .filter(Boolean)
      .sort();

    if (releaseDates.length === 0) {
      return {};
    }

    const from = releaseDates[0];
    const to = releaseDates[releaseDates.length - 1];
    const goldMap = await fetchGoldSeries(from, to);

    const out = {};
    for (const indicator of indicators) {
      out[indicator.code] = summarizeHistoricalValidation(
        indicator.code,
        indicator.historicalData,
        goldMap,
        sampleSize,
      );
    }

    return out;
  } catch (error) {
    const out = {};
    for (const indicator of indicators) {
      out[indicator.code] = {
        available: false,
        sampleSize,
        evaluatedSamples: 0,
        hitRatePct: null,
        averageMovePct: null,
        statement: `Historical validation unavailable: ${error.message}`,
      };
    }
    return out;
  }
}


/**
 * Determine price direction from price data
 * @param {number} currentPrice - current market price
 * @param {number} previousPrice - previous price (e.g. 4h ago, 1d ago)
 * @returns {"UP"|"DOWN"|"SIDEWAYS"}
 */
export function determinePriceDirection(currentPrice, previousPrice) {
  if (currentPrice === null || previousPrice === null || previousPrice === 0) {
    return 'SIDEWAYS';
  }
  
  const changePercent = ((currentPrice - previousPrice) / Math.abs(previousPrice)) * 100;
  
  // 0.5% threshold for meaningful movement
  if (Math.abs(changePercent) < 0.5) {
    return 'SIDEWAYS';
  }
  
  return changePercent > 0 ? 'UP' : 'DOWN';
}

/**
 * Determine macro bias from computed macro score
 * @param {Object} macroScore - output from computeMacroScore()
 * @returns {"Bullish"|"Bearish"|"Neutral"}
 */
export function determineMacroBias(macroScore) {
  if (!macroScore) return 'Neutral';
  
  const score = macroScore.score ?? 0;
  
  if (score >= 2) {
    return 'Bullish';
  } else if (score <= -2) {
    return 'Bearish';
  }
  
  return 'Neutral';
}

/**
 * Detect macro vs price conflict
 * @param {number} currentPrice - current market price
 * @param {number} previousPrice - previous price for comparison
 * @param {Object} macroScore - computed macro score
 * @returns {{ priceDirection: string, macroBias: string, conflict: boolean, severity: string, message: string }}
 */
export function detectMacroVsPriceConflict(currentPrice, previousPrice, macroScore) {
  const priceDirection = determinePriceDirection(currentPrice, previousPrice);
  const macroBias = determineMacroBias(macroScore);
  const macroStrength = Math.abs(Number(macroScore?.score ?? 0));
  
  // Determine if conflict exists
  let conflict = false;
  let severity = 'none';
  let message = '';
  
  if (macroBias === 'Bullish' && priceDirection === 'DOWN') {
    conflict = true;
    severity = macroStrength >= 5 ? 'high' : macroStrength <= 2 ? 'low' : 'moderate';
    message = `Macro signals suggest bullish bias (Score: ${macroScore?.score ?? 0}), but price action is moving lower. ` +
              `This indicates possible divergence due to USD strength, liquidity flows, or market positioning. ` +
              `Monitor for mean reversion or confirmation that macro thesis has changed.`;
  } else if (macroBias === 'Bearish' && priceDirection === 'UP') {
    conflict = true;
    severity = macroStrength >= 5 ? 'high' : macroStrength <= 2 ? 'low' : 'moderate';
    message = `Macro signals suggest bearish bias (Score: ${macroScore?.score ?? 0}), but price action is moving higher. ` +
              `This indicates possible divergence due to short covering, USD weakness, or technical support holding. ` +
              `Monitor for continuation or pullback to align with macro fundamentals.`;
  } else if (macroBias === 'Neutral' && priceDirection !== 'SIDEWAYS') {
    conflict = true;
    severity = 'low';
    const direction = priceDirection === 'UP' ? 'rising' : 'falling';
    message = `Macro signals are neutral but price action is ${direction}. ` +
              `Signals may be too weak or conflicting to form a clear directional bias. ` +
              `Wait for stronger macro alignment before trading the move.`;
  } else {
    message = 'Macro signals are aligned with current price action.';
  }
  
  return {
    priceDirection,
    macroBias,
    conflict,
    severity,
    severityLabel: severity === 'high'
      ? 'High Conflict'
      : severity === 'low' && conflict
        ? 'Low Confidence Signal'
        : severity === 'moderate'
          ? 'Conflict'
          : 'Aligned',
    message,
  };
}

/**
 * Log a macro/price conflict for accuracy tracking
 * @param {Object} conflictData - result from detectMacroVsPriceConflict
 * @param {string} asset - asset code (e.g. 'XAUUSD')
 */
export function logConflictEvent(conflictData, asset = 'XAUUSD') {
  if (!conflictData || !conflictData.conflict) return null;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    asset,
    priceDirection: conflictData.priceDirection,
    macroBias: conflictData.macroBias,
    severity: conflictData.severity,
    message: conflictData.message,
  };
  
  console.log(`📍 MACRO/PRICE CONFLICT [${asset}] @${logEntry.timestamp}:`, {
    severity: logEntry.severity.toUpperCase(),
    priceAction: logEntry.priceDirection,
    macroSignal: logEntry.macroBias,
    reason: logEntry.message.split('.')[0],
  });
  
  return logEntry;
}
