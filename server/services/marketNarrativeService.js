/**
 * marketNarrativeService.js
 *
 * Generates human-readable explanations for why markets moved today.
 * All logic is deterministic, based on actual indicator surprises and contributions.
 *
 * Input:  macro indicators, macro score contributors, gold price movement
 * Output: structured narrative with summary, drivers, bias, confidence
 */

// ─────────────────────────────────────────────────────────────────────────────
// Indicator-specific reasoning templates
// ─────────────────────────────────────────────────────────────────────────────

const SURPRISE_MEANING = {
  CPI: {
    positive: 'inflation running hotter than expected',
    negative: 'inflation cooling faster than forecast',
    explanation: 'CPI surprise affects real interest rate expectations and gold\'s inflation-hedge value',
  },
  CorePCE: {
    positive: 'core inflation persisting above Fed\'s comfort zone',
    negative: 'core inflation moderating, easing rate pressure',
    explanation: 'Core PCE is the Fed\'s preferred metric; movement directly influences rate path expectations',
  },
  NFP: {
    positive: 'labor market stronger than expected, reinforcing Fed resolve',
    negative: 'payroll weakness suggesting economic slowdown',
    explanation: 'NFP is a key employment mandate signal; strong reads support higher rates and USD, weak reads boost safe-haven demand',
  },
  FedRate: {
    positive: 'Fed tightened policy beyond expectations',
    negative: 'Fed held or eased more than expected',
    explanation: 'Fed rate changes directly raise real yields and cost of capital; strong dollar and gold headwind',
  },
  UNEMPLOYMENT: {
    positive: 'unemployment rose more than expected, signaling labor softening',
    negative: 'unemployment fell more than expected, reinforcing labor strength',
    explanation: 'Unemployment spikes are a recession warning and boost safe-haven demand for gold',
  },
  GDP: {
    positive: 'economic growth stronger than forecast',
    negative: 'economic growth weaker than forecast',
    explanation: 'GDP strength reduces safe-haven demand and supports USD via rate expectations',
  },
  JoblessClaims: {
    positive: 'jobless claims higher than expected, signaling labor market deterioration',
    negative: 'jobless claims lower than expected, confirming labor market resilience',
    explanation: 'Initial jobless claims are a leading labor indicator; spikes signal recession risk and boost gold demand',
  },
  RetailSales: {
    positive: 'consumer spending stronger than expected',
    negative: 'consumer spending weaker than expected',
    explanation: 'Retail sales strength supports growth expectations and reduces safe-haven flows into gold',
  },
  ISMManufacturing: {
    positive: 'manufacturing activity expanding faster than expected',
    negative: 'manufacturing contraction faster than expected',
    explanation: 'PMI changes signal cyclical growth momentum and business confidence; falls boost safe-haven demand',
  },
  ConsumerConf: {
    positive: 'consumer confidence stronger than expected',
    negative: 'consumer confidence weaker than forecast',
    explanation: 'Confidence shifts indicate spending intent and recession risk; weakness boosts defensive positioning',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function categorizeContribution(code, contribution, mag) {
  const absContrib = Math.abs(contribution);
  if (absContrib >= 1.5) return 'primary';
  if (absContrib >= 0.8) return 'secondary';
  return 'tertiary';
}

function impactLabel(direction) {
  if (direction > 0) return 'Bullish';
  if (direction < 0) return 'Bearish';
  return 'Neutral';
}

function getSurpriseInterpretation(code, surprise) {
  if (!Number.isFinite(surprise) || surprise === 0) {
    return 'released in line with expectations';
  }
  const meaning = SURPRISE_MEANING[code] || { positive: 'surprise', negative: 'miss', explanation: 'affected markets' };
  const isBeat = surprise > 0;
  const desc = isBeat ? meaning.positive : meaning.negative;
  const absValue = Math.abs(surprise).toFixed(2);
  return `${desc} (${isBeat ? '+' : ''}${absValue} surprise)`;
}

function getContributionSentence(code, contribution, direction) {
  const absContrib = Math.abs(contribution);
  const verb = direction > 0 ? 'supported' : 'pressured';
  if (absContrib >= 1.5) {
    return `${code} was a primary ${verb} — strong influence on macro bias`;
  }
  if (absContrib >= 0.8) {
    return `${code} added meaningful ${verb} pressure`;
  }
  return `${code} provided minor support`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core narrative generation
// ─────────────────────────────────────────────────────────────────────────────

export function generateMarketNarrative(data = {}) {
  const {
    indicators = [],
    contributors = [],
    macroScore = {},
    goldPrice = {},
  } = data;

  // ─────────────────────────────────────────────────────────────────────
  // MINIMUM DATA THRESHOLD: Need at least 2 indicators to generate narrative
  // ─────────────────────────────────────────────────────────────────────
  if (indicators.length < 2) {
    return {
      summary: 'Insufficient data to explain market move.',
      drivers: [],
      finalBias: 'Neutral',
      confidence: 0,
      maxConfidence: 'Low',
      reason: `Only ${indicators.length} indicator(s) available. Need at least 2.`,
    };
  }

  // Prepare indicator map for quick lookup
  const indicatorMap = new Map();
  for (const ind of indicators) {
    if (ind.code) indicatorMap.set(ind.code, ind);
  }

  // ─────────────────────────────────────────────────────────────────────
  // FALLBACK: Generate deterministic narrative even without contributors
  // ─────────────────────────────────────────────────────────────────────
  if (contributors.length === 0) {
    // Build narrative from available indicators (deterministic fallback)
    const availableIndicators = Array.from(indicatorMap.values())
      .filter(ind => ind.code && (ind.actual !== null || ind.forecast !== null))
      .slice(0, 5);

    const indicatorCodes = availableIndicators.map(ind => ind.code).join(', ');
    const summaryText = availableIndicators.length > 0
      ? `Market data reflects ${indicatorCodes}. Insufficient signal strength to determine clear directional bias.`
      : 'Macro data available but insufficient signal strength detected.';

    const finalBias = macroScore.label || 'Neutral';
    const scoreConfidence = macroScore.signalConfidence || 'Low';
    const confidenceMap = { High: 75, Medium: 55, Low: 25 };
    const confidenceValue = confidenceMap[scoreConfidence] || 25;

    return {
      summary: summaryText,
      drivers: availableIndicators.map(ind => ({
        title: `${ind.code}: Data Available`,
        explanation: `${ind.code} released. Actual: ${ind.actual ?? 'N/A'}, Forecast: ${ind.forecast ?? 'N/A'}`,
        impact: 'Neutral',
        category: 'tertiary',
        contribution: 0,
        code: ind.code,
      })),
      finalBias,
      confidence: confidenceValue,
      maxConfidence: scoreConfidence,
      reason: 'Deterministic fallback (no AI analysis)',
      regime: macroScore.regime || 'NEUTRAL',
      regimeConfidence: Math.max(20, macroScore.regimeConfidence ?? 30),
      generatedAt: new Date().toISOString(),
    };
  }

  // Sort contributors by absolute contribution (strongest first)
  const sortedContributors = [...contributors].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  // Build narrative drivers
  const drivers = [];
  let primaryCount = 0;
  let secondaryCount = 0;

  for (const contrib of sortedContributors) {
    const ind = indicatorMap.get(contrib.code);
    const category = categorizeContribution(contrib.code, contrib.contribution, contrib.magnitude);

    if (category === 'primary') primaryCount += 1;
    if (category === 'secondary') secondaryCount += 1;

    const surpriseDesc = getSurpriseInterpretation(contrib.code, contrib.surprise);
    const contributionSentence = getContributionSentence(
      contrib.code,
      contrib.contribution,
      contrib.direction
    );

    const meaning = SURPRISE_MEANING[contrib.code] || { explanation: '' };

    drivers.push({
      title: `${contrib.code}: ${impactLabel(contrib.direction)}`,
      explanation: `${contrib.code} ${surpriseDesc}. ${contributionSentence}. ${meaning.explanation}`,
      impact: impactLabel(contrib.direction),
      category,
      contribution: contrib.contribution,
      code: contrib.code,
    });
  }

  // Build summary
  const topDriver = sortedContributors[0];
  const topCode = topDriver?.code || 'macro data';
  const topDirection = topDriver?.direction || 0;
  const topImpact = impactLabel(topDirection);

  let summaryText = '';
  if (primaryCount >= 2) {
    summaryText = `Multiple strong signals drove a ${topImpact.toLowerCase()} day. ${topCode} led the charge.`;
  } else if (primaryCount === 1) {
    summaryText = `${topCode} was the key driver of ${topImpact.toLowerCase()} momentum today.`;
  } else if (secondaryCount >= 2) {
    summaryText = `Several moderate indicators combined to create ${topImpact.toLowerCase()} pressure.`;
  } else {
    summaryText = `Mixed signals with ${topCode} providing the strongest directional cue.`;
  }

  // Compute final bias from macro score
  const finalBias = macroScore.label || 'Neutral';
  const scoreConfidence = macroScore.signalConfidence || 'Low';

  // Map confidence to percentage
  const confidenceMap = { High: 75, Medium: 55, Low: 25 };
  const confidenceValue = confidenceMap[scoreConfidence] || 25;

  // Filter to include only drivers with meaningful contributions
  const meaningfulDrivers = drivers.filter((d) => Math.abs(d.contribution) >= 0.3);

  // ─────────────────────────────────────────────────────────────────────
  // ALWAYS RETURN NARRATIVE (even with low/no meaningful drivers)
  // As long as we have >= 2 indicators, we can create deterministic summary
  // ─────────────────────────────────────────────────────────────────────
  return {
    summary: summaryText || `Analysis of ${indicators.length} economic indicators.`,
    drivers: meaningfulDrivers.length > 0 
      ? meaningfulDrivers.slice(0, 5)
      : drivers.slice(0, 3), // Show top 3 drivers even if not "meaningful"
    finalBias,
    confidence: confidenceValue,
    maxConfidence: scoreConfidence,
    regime: macroScore.regime || 'NEUTRAL',
    regimeConfidence: Math.max(20, macroScore.regimeConfidence ?? 30),
    generatedAt: new Date().toISOString(),
  };
}

export default { generateMarketNarrative };
