const STANDARD_LOT = 100000;
const JPY_PIP = 0.01;
const DEFAULT_PIP = 0.0001;

// Commodity contract specifications: contractSize (units per lot), pipSize (min tick)
const COMMODITY_CONFIG = {
  'XAUUSD':  { contractSize: 100,   pipSize: 0.01 },   // Gold – 100 troy oz
  'XAGUSD':  { contractSize: 5000,  pipSize: 0.001 },  // Silver – 5 000 oz
  'USOIL':   { contractSize: 1000,  pipSize: 0.01 },   // WTI Crude – 1 000 bbl
  'UKOIL':   { contractSize: 1000,  pipSize: 0.01 },   // Brent Crude – 1 000 bbl
  'XNGUSD':  { contractSize: 10000, pipSize: 0.001 },  // Natural Gas – 10 000 MMBtu
  'XCUUSD':  { contractSize: 25000, pipSize: 0.0001 },  // Copper – 25 000 lbs
};

function normalizePair(pair) {
  return pair.toUpperCase().replace(/[\/\s]/g, '');
}

function getCommodityConfig(pair) {
  return COMMODITY_CONFIG[normalizePair(pair)] || null;
}

function isJPYPair(pair) {
  return pair.toUpperCase().includes('JPY');
}

function getPipSize(pair) {
  const commodity = getCommodityConfig(pair);
  if (commodity) return commodity.pipSize;
  return isJPYPair(pair) ? JPY_PIP : DEFAULT_PIP;
}

function calculatePipValue(pair, lotSize, exchangeRate) {
  const commodity = getCommodityConfig(pair);
  if (commodity) {
    // Commodities priced in USD: pipValue = pipSize × contractSize × lots
    return Math.round(commodity.pipSize * commodity.contractSize * lotSize * 100) / 100;
  }
  const pipSize = isJPYPair(pair) ? JPY_PIP : DEFAULT_PIP;
  const units = lotSize * STANDARD_LOT;
  const pipValue = (pipSize / exchangeRate) * units;
  return Math.round(pipValue * 100) / 100;
}

function calculateProfitLoss(entryPrice, exitPrice, lotSize, pair, exchangeRate, type) {
  const pipSize = getPipSize(pair);
  const rawMovement = type === 'buy'
    ? (exitPrice - entryPrice) / pipSize
    : (entryPrice - exitPrice) / pipSize;

  const pipMovement = Math.round(rawMovement * 10) / 10;
  const pipValue = calculatePipValue(pair, lotSize, exchangeRate);
  const profitLossUSD = Math.round(pipMovement * pipValue * 100) / 100;

  return { pipMovement, pipValue, profitLossUSD };
}

function calculateRiskPercentage(balance, riskAmount) {
  if (balance <= 0) return 0;
  return Math.round((riskAmount / balance) * 10000) / 100;
}

function calculateLotSize(balance, riskPercent, stopLossPips, pipValue) {
  if (stopLossPips <= 0 || pipValue <= 0) return 0;
  const riskAmount = balance * (riskPercent / 100);
  const lots = riskAmount / (stopLossPips * pipValue);
  return Math.round(lots * 100) / 100;
}

function simulateGrowth({ balance, riskPercent, winRate, riskRewardRatio, trades }) {
  let current = balance;
  let wins = 0;
  let losses = 0;
  const winProb = winRate / 100;

  for (let i = 0; i < trades; i++) {
    const riskAmount = current * (riskPercent / 100);
    const isWin = Math.random() < winProb;

    if (isWin) {
      current += riskAmount * riskRewardRatio;
      wins++;
    } else {
      current -= riskAmount;
      losses++;
    }

    if (current <= 0) {
      current = 0;
      losses += trades - i - 1;
      break;
    }
  }

  const finalBalance = Math.round(current * 100) / 100;
  const expectedGrowth = Math.round(((finalBalance - balance) / balance) * 10000) / 100;

  let riskLevel;
  if (riskPercent <= 1) riskLevel = 'low';
  else if (riskPercent <= 3) riskLevel = 'moderate';
  else riskLevel = 'high';

  return { finalBalance, wins, losses, expectedGrowth, riskLevel };
}

/**
 * Deterministic expected balance after N trades using geometric expectation.
 * E[balance] = balance * [(winProb * (1 + risk*RR)) + ((1-winProb) * (1 - risk))]^trades
 */
function calculateExpectedBalance(balance, riskPercent, winRate, riskRewardRatio, trades) {
  const r = riskPercent / 100;
  const p = winRate / 100;
  const multiplier = p * (1 + r * riskRewardRatio) + (1 - p) * (1 - r);
  if (multiplier <= 0) return 0;
  return balance * Math.pow(multiplier, trades);
}

/**
 * Sweep risk from 0.5% → 5.0% in 0.1% steps.
 * Returns the minimum risk % that reaches the target, plus all scenarios tried.
 */
function findMinimumRisk({ balance, target, trades, winRate, riskRewardRatio = 2 }) {
  const scenarios = [];
  let optimalRisk = null;

  for (let risk = 0.5; risk <= 5.0; risk = Math.round((risk + 0.1) * 10) / 10) {
    const expected = calculateExpectedBalance(balance, risk, winRate, riskRewardRatio, trades);
    const reachesTarget = expected >= target;

    scenarios.push({
      riskPercent: risk,
      expectedBalance: Math.round(expected * 100) / 100,
      reachesTarget,
    });

    if (reachesTarget && optimalRisk === null) {
      optimalRisk = risk;
    }
  }

  // If even 5% doesn't reach target, flag the best we can do
  const bestScenario = optimalRisk !== null
    ? scenarios.find(s => s.riskPercent === optimalRisk)
    : scenarios[scenarios.length - 1]; // highest risk scenario

  return {
    optimalRisk,
    reachable: optimalRisk !== null,
    bestScenario,
    scenarios,
  };
}

function getRiskInsight({ riskPercent, winRate, trades }) {
  const insights = [];

  // Risk per trade analysis
  if (riskPercent > 10) {
    insights.push('Extreme risk: account wipeout is almost certain at this level.');
  } else if (riskPercent > 5) {
    insights.push('High risk: significant drawdown likely. Consider reducing to 1-3%.');
  } else if (riskPercent > 3) {
    insights.push('Elevated risk: manageable for experienced traders, but volatility will be high.');
  } else if (riskPercent >= 1) {
    insights.push('Balanced risk level: aligns with standard risk management.');
  } else if (riskPercent > 0) {
    insights.push('Conservative risk: slow but steady growth. Good for capital preservation.');
  }

  // Win rate analysis
  if (winRate > 80) {
    insights.push('Win rate above 80% is unrealistic long-term. Backtest thoroughly before relying on this.');
  } else if (winRate >= 55) {
    insights.push('Solid win rate. Profitable with proper risk-reward.');
  } else if (winRate >= 40) {
    insights.push('Win rate is below average — you need a risk-reward ratio above 1.5:1 to stay profitable.');
  } else if (winRate > 0) {
    insights.push('Low win rate: only viable with a very high risk-reward ratio (3:1+).');
  }

  // Trade count analysis
  if (trades > 200) {
    insights.push('Large sample size — projection is statistically meaningful.');
  } else if (trades >= 50) {
    insights.push('Decent sample size for a rough projection.');
  } else if (trades > 0) {
    insights.push('Small sample: results will vary significantly. Use 50+ trades for better accuracy.');
  }

  // Combined edge cases
  if (riskPercent > 5 && winRate < 50) {
    insights.push('Warning: high risk with low win rate is a fast path to blowing the account.');
  }
  if (riskPercent <= 1 && winRate >= 60 && trades >= 50) {
    insights.push('Strong setup: low risk with a good edge. Compounding should work well here.');
  }

  return insights.length
    ? insights.join(' ')
    : 'Unable to assess — check your inputs.';
}

export {
  calculatePipValue,
  calculateProfitLoss,
  calculateRiskPercentage,
  calculateLotSize,
  simulateGrowth,
  calculateExpectedBalance,
  findMinimumRisk,
  getRiskInsight,
};
