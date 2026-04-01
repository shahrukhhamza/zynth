import { jest } from '@jest/globals';
import {
  calculatePipValue,
  calculateProfitLoss,
  calculateRiskPercentage,
  calculateLotSize,
  simulateGrowth,
  calculateExpectedBalance,
  findMinimumRisk,
  getRiskInsight,
} from '../services/tradingCalculatorService.js';

// ─────────────────────────────────────────────
// 1. calculatePipValue
// ─────────────────────────────────────────────
describe('calculatePipValue', () => {
  test('returns correct pip value for non-JPY pair (EUR/USD)', () => {
    // 1 standard lot, rate 1.1000
    // pipValue = (0.0001 / 1.1) * 100000 ≈ 9.09
    const result = calculatePipValue('EURUSD', 1, 1.1);
    expect(result).toBeCloseTo(9.09, 1);
  });

  test('returns correct pip value for JPY pair (USD/JPY)', () => {
    // 1 standard lot, rate 150.00
    // pipValue = (0.01 / 150) * 100000 ≈ 6.67
    const result = calculatePipValue('USDJPY', 1, 150);
    expect(result).toBeCloseTo(6.67, 1);
  });

  test('scales linearly with lot size', () => {
    const oneLot = calculatePipValue('EURUSD', 1, 1.1);
    const twoLots = calculatePipValue('EURUSD', 2, 1.1);
    expect(twoLots).toBeCloseTo(oneLot * 2, 2);
  });

  test('handles mini lot (0.1)', () => {
    const result = calculatePipValue('EURUSD', 0.1, 1.1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(2);
  });

  // Edge case: zero lot size
  test('returns 0 for zero lot size', () => {
    const result = calculatePipValue('EURUSD', 0, 1.1);
    expect(result).toBe(0);
  });

  // Edge case: very small exchange rate
  test('handles very small exchange rate', () => {
    const result = calculatePipValue('EURUSD', 1, 0.001);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 2. calculateProfitLoss
// ─────────────────────────────────────────────
describe('calculateProfitLoss', () => {
  test('calculates profit on a winning BUY trade', () => {
    const result = calculateProfitLoss(1.1000, 1.1050, 1, 'EURUSD', 1.1050, 'buy');
    expect(result.pipMovement).toBeCloseTo(50, 0);
    expect(result.pipValue).toBeGreaterThan(0);
    expect(result.profitLossUSD).toBeGreaterThan(0);
  });

  test('calculates loss on a losing BUY trade', () => {
    const result = calculateProfitLoss(1.1050, 1.1000, 1, 'EURUSD', 1.1000, 'buy');
    expect(result.pipMovement).toBeCloseTo(-50, 0);
    expect(result.profitLossUSD).toBeLessThan(0);
  });

  test('calculates profit on a winning SELL trade', () => {
    const result = calculateProfitLoss(1.1050, 1.1000, 1, 'EURUSD', 1.1000, 'sell');
    expect(result.pipMovement).toBeCloseTo(50, 0);
    expect(result.profitLossUSD).toBeGreaterThan(0);
  });

  test('calculates loss on a losing SELL trade', () => {
    const result = calculateProfitLoss(1.1000, 1.1050, 1, 'EURUSD', 1.1050, 'sell');
    expect(result.pipMovement).toBeCloseTo(-50, 0);
    expect(result.profitLossUSD).toBeLessThan(0);
  });

  test('works with JPY pair', () => {
    // USDJPY buy: entry 149.00 → exit 150.00 = 100 pips
    const result = calculateProfitLoss(149.00, 150.00, 1, 'USDJPY', 150, 'buy');
    expect(result.pipMovement).toBeCloseTo(100, 0);
    expect(result.profitLossUSD).toBeGreaterThan(0);
  });

  test('returns correct shape', () => {
    const result = calculateProfitLoss(1.1, 1.105, 1, 'EURUSD', 1.105, 'buy');
    expect(result).toHaveProperty('pipMovement');
    expect(result).toHaveProperty('pipValue');
    expect(result).toHaveProperty('profitLossUSD');
  });

  // Edge case: zero lot size → zero profit
  test('returns 0 profit for zero lot size', () => {
    const result = calculateProfitLoss(1.1, 1.105, 0, 'EURUSD', 1.105, 'buy');
    expect(result.pipValue).toBe(0);
    expect(result.profitLossUSD).toBe(0);
  });

  // Edge case: negative prices
  test('handles negative entry/exit prices without crashing', () => {
    const result = calculateProfitLoss(-1.1, -1.05, 1, 'EURUSD', 1.1, 'buy');
    expect(Number.isFinite(result.pipMovement)).toBe(true);
    expect(Number.isFinite(result.profitLossUSD)).toBe(true);
  });

  // Edge case: same entry and exit
  test('returns 0 pip movement when entry equals exit', () => {
    const result = calculateProfitLoss(1.1, 1.1, 1, 'EURUSD', 1.1, 'buy');
    expect(result.pipMovement).toBe(0);
    expect(result.profitLossUSD).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 3. calculateRiskPercentage
// ─────────────────────────────────────────────
describe('calculateRiskPercentage', () => {
  test('calculates risk percentage correctly', () => {
    // 100 risk on 10000 balance = 1%
    expect(calculateRiskPercentage(10000, 100)).toBe(1);
  });

  test('returns 0 for zero balance', () => {
    expect(calculateRiskPercentage(0, 100)).toBe(0);
  });

  test('returns 0 for negative balance', () => {
    expect(calculateRiskPercentage(-5000, 100)).toBe(0);
  });

  test('handles large risk amounts', () => {
    expect(calculateRiskPercentage(10000, 10000)).toBe(100);
  });
});

// ─────────────────────────────────────────────
// 4. calculateLotSize
// ─────────────────────────────────────────────
describe('calculateLotSize', () => {
  test('calculates lot size with standard inputs', () => {
    // balance=10000, risk=2%, SL=50 pips, pipValue=10
    // riskAmount = 200, lots = 200 / (50*10) = 0.4
    const result = calculateLotSize(10000, 2, 50, 10);
    expect(result).toBe(0.4);
  });

  test('returns 0 when stopLossPips is 0', () => {
    expect(calculateLotSize(10000, 2, 0, 10)).toBe(0);
  });

  test('returns 0 when pipValue is 0', () => {
    expect(calculateLotSize(10000, 2, 50, 0)).toBe(0);
  });

  test('returns 0 when stopLossPips is negative', () => {
    expect(calculateLotSize(10000, 2, -10, 10)).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 5. simulateGrowth (uses Math.random — mock it)
// ─────────────────────────────────────────────
describe('simulateGrowth', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('all wins scenario (mock random < winProb always)', () => {
    // Force all wins: Math.random always returns 0
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = simulateGrowth({
      balance: 10000,
      riskPercent: 2,
      winRate: 60,
      riskRewardRatio: 2,
      trades: 10,
    });

    expect(result.wins).toBe(10);
    expect(result.losses).toBe(0);
    expect(result.finalBalance).toBeGreaterThan(10000);
    expect(result.expectedGrowth).toBeGreaterThan(0);
  });

  test('all losses scenario (mock random > winProb always)', () => {
    // Force all losses: Math.random always returns 0.99
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = simulateGrowth({
      balance: 10000,
      riskPercent: 2,
      winRate: 60,
      riskRewardRatio: 2,
      trades: 10,
    });

    expect(result.wins).toBe(0);
    expect(result.losses).toBe(10);
    expect(result.finalBalance).toBeLessThan(10000);
    expect(result.expectedGrowth).toBeLessThan(0);
  });

  test('mixed scenario with deterministic sequence', () => {
    // Alternate: win, loss, win, loss... (winRate=60 → threshold 0.6)
    let call = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      return call++ % 2 === 0 ? 0.1 : 0.9; // alternates below/above 0.6
    });

    const result = simulateGrowth({
      balance: 10000,
      riskPercent: 2,
      winRate: 60,
      riskRewardRatio: 2,
      trades: 10,
    });

    expect(result.wins).toBe(5);
    expect(result.losses).toBe(5);
    expect(result.wins + result.losses).toBe(10);
  });

  test('account blows up with extreme risk', () => {
    // 100% risk per trade, all losses
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = simulateGrowth({
      balance: 10000,
      riskPercent: 100,
      winRate: 50,
      riskRewardRatio: 1,
      trades: 5,
    });

    expect(result.finalBalance).toBe(0);
    expect(result.losses).toBe(5);
  });

  test('returns correct risk level labels', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    expect(simulateGrowth({ balance: 1000, riskPercent: 0.5, winRate: 60, riskRewardRatio: 2, trades: 1 }).riskLevel).toBe('low');
    expect(simulateGrowth({ balance: 1000, riskPercent: 2, winRate: 60, riskRewardRatio: 2, trades: 1 }).riskLevel).toBe('moderate');
    expect(simulateGrowth({ balance: 1000, riskPercent: 5, winRate: 60, riskRewardRatio: 2, trades: 1 }).riskLevel).toBe('high');
  });

  test('returns correct shape', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3);
    const result = simulateGrowth({
      balance: 10000,
      riskPercent: 2,
      winRate: 60,
      riskRewardRatio: 2,
      trades: 5,
    });

    expect(result).toHaveProperty('finalBalance');
    expect(result).toHaveProperty('wins');
    expect(result).toHaveProperty('losses');
    expect(result).toHaveProperty('expectedGrowth');
    expect(result).toHaveProperty('riskLevel');
  });
});

// ─────────────────────────────────────────────
// 6. calculateExpectedBalance
// ─────────────────────────────────────────────
describe('calculateExpectedBalance', () => {
  test('grows with positive edge', () => {
    // 60% WR, 2% risk, 2:1 RR, 100 trades
    const result = calculateExpectedBalance(10000, 2, 60, 2, 100);
    expect(result).toBeGreaterThan(10000);
  });

  test('shrinks with negative edge', () => {
    // 30% WR, 5% risk, 1:1 RR
    const result = calculateExpectedBalance(10000, 5, 30, 1, 100);
    expect(result).toBeLessThan(10000);
  });

  test('returns 0 when multiplier goes negative', () => {
    // extreme scenario: 0% win rate, 100% risk → multiplier = 0
    const result = calculateExpectedBalance(10000, 100, 0, 1, 10);
    expect(result).toBe(0);
  });

  test('1 trade matches manual calculation', () => {
    // balance=1000, risk=2%, WR=60%, RR=2, trades=1
    // multiplier = 0.6*(1+0.02*2) + 0.4*(1-0.02) = 0.6*1.04 + 0.4*0.98 = 0.624+0.392 = 1.016
    // expected = 1000 * 1.016 = 1016
    const result = calculateExpectedBalance(1000, 2, 60, 2, 1);
    expect(result).toBeCloseTo(1016, 0);
  });
});

// ─────────────────────────────────────────────
// 7. findMinimumRisk
// ─────────────────────────────────────────────
describe('findMinimumRisk', () => {
  test('finds reachable target', () => {
    const result = findMinimumRisk({
      balance: 10000,
      target: 11000, // modest 10% growth
      trades: 100,
      winRate: 60,
      riskRewardRatio: 2,
    });

    expect(result.reachable).toBe(true);
    expect(result.optimalRisk).toBeGreaterThanOrEqual(0.5);
    expect(result.optimalRisk).toBeLessThanOrEqual(5);
    expect(result.bestScenario.reachesTarget).toBe(true);
  });

  test('flags unreachable target', () => {
    const result = findMinimumRisk({
      balance: 10000,
      target: 10000000, // 1000x growth → unreachable
      trades: 10,
      winRate: 55,
      riskRewardRatio: 2,
    });

    expect(result.reachable).toBe(false);
    expect(result.optimalRisk).toBeNull();
  });

  test('scenarios array has correct structure', () => {
    const result = findMinimumRisk({
      balance: 10000,
      target: 12000,
      trades: 100,
      winRate: 60,
      riskRewardRatio: 2,
    });

    expect(result.scenarios.length).toBeGreaterThan(0);
    result.scenarios.forEach((s) => {
      expect(s).toHaveProperty('riskPercent');
      expect(s).toHaveProperty('expectedBalance');
      expect(s).toHaveProperty('reachesTarget');
    });
  });

  test('optimal risk is always the lowest that reaches target', () => {
    const result = findMinimumRisk({
      balance: 10000,
      target: 11000,
      trades: 100,
      winRate: 60,
      riskRewardRatio: 2,
    });

    if (result.reachable) {
      const reachable = result.scenarios.filter((s) => s.reachesTarget);
      const minReachable = Math.min(...reachable.map((s) => s.riskPercent));
      expect(result.optimalRisk).toBe(minReachable);
    }
  });
});

// ─────────────────────────────────────────────
// 8. getRiskInsight
// ─────────────────────────────────────────────
describe('getRiskInsight', () => {
  test('flags extreme risk', () => {
    const text = getRiskInsight({ riskPercent: 15, winRate: 50, trades: 100 });
    expect(text).toContain('wipeout');
  });

  test('flags high risk', () => {
    const text = getRiskInsight({ riskPercent: 7, winRate: 50, trades: 100 });
    expect(text).toContain('High risk');
  });

  test('flags balanced risk', () => {
    const text = getRiskInsight({ riskPercent: 2, winRate: 60, trades: 100 });
    expect(text).toContain('Balanced');
  });

  test('flags unrealistic win rate', () => {
    const text = getRiskInsight({ riskPercent: 2, winRate: 90, trades: 100 });
    expect(text).toContain('unrealistic');
  });

  test('warns about small trade sample', () => {
    const text = getRiskInsight({ riskPercent: 2, winRate: 60, trades: 10 });
    expect(text).toContain('Small sample');
  });

  test('combined: high risk + low WR → blow warning', () => {
    const text = getRiskInsight({ riskPercent: 8, winRate: 35, trades: 100 });
    expect(text).toContain('blowing the account');
  });

  test('combined: low risk + good edge → strong setup', () => {
    const text = getRiskInsight({ riskPercent: 0.5, winRate: 65, trades: 100 });
    expect(text).toContain('Strong setup');
  });

  test('returns fallback for empty/zero inputs', () => {
    const text = getRiskInsight({ riskPercent: 0, winRate: 0, trades: 0 });
    expect(text).toBe('Unable to assess — check your inputs.');
  });
});

// ─────────────────────────────────────────────
// 9. Exception & invalid input handling
// ─────────────────────────────────────────────
describe('exception handling & invalid inputs', () => {
  test('calculatePipValue with NaN exchange rate returns NaN gracefully', () => {
    const result = calculatePipValue('EURUSD', 1, NaN);
    expect(Number.isNaN(result)).toBe(true);
  });

  test('calculateProfitLoss with undefined type still returns numbers', () => {
    // type is undefined → (entry - exit) / pipSize direction may be off but should not throw
    const result = calculateProfitLoss(1.1, 1.105, 1, 'EURUSD', 1.105, undefined);
    expect(Number.isFinite(result.pipMovement)).toBe(true);
  });

  test('simulateGrowth with zero trades returns starting balance', () => {
    const result = simulateGrowth({
      balance: 5000,
      riskPercent: 2,
      winRate: 60,
      riskRewardRatio: 2,
      trades: 0,
    });
    expect(result.finalBalance).toBe(5000);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
  });

  test('calculateLotSize with NaN inputs returns NaN or 0', () => {
    const result = calculateLotSize(NaN, 2, 50, 10);
    // NaN / positive = NaN, rounded → NaN
    expect(Number.isNaN(result) || result === 0).toBe(true);
  });

  test('findMinimumRisk with negative balance still returns structure', () => {
    const result = findMinimumRisk({
      balance: -1000,
      target: 5000,
      trades: 50,
      winRate: 60,
      riskRewardRatio: 2,
    });
    expect(result).toHaveProperty('reachable');
    expect(result).toHaveProperty('scenarios');
  });
});
