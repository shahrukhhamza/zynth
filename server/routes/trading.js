import express from 'express';
import {
  calculateProfitLoss,
  calculateRiskPercentage,
  simulateGrowth,
  findMinimumRisk,
  getRiskInsight,
} from '../services/tradingCalculatorService.js';

const router = express.Router();

// POST /api/calc/profit-loss
router.post('/profit-loss', (req, res, next) => {
  try {
    const { pair, lotSize, entryPrice, exitPrice, type } = req.body;

    // --- validation ---
    if (!pair || typeof pair !== 'string') {
      return res.status(400).json({ error: 'pair is required and must be a string (e.g. "EUR/USD")' });
    }
    if (typeof lotSize !== 'number' || lotSize <= 0) {
      return res.status(400).json({ error: 'lotSize must be a positive number' });
    }
    if (typeof entryPrice !== 'number' || entryPrice <= 0) {
      return res.status(400).json({ error: 'entryPrice must be a positive number' });
    }
    if (typeof exitPrice !== 'number' || exitPrice <= 0) {
      return res.status(400).json({ error: 'exitPrice must be a positive number' });
    }
    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ error: 'type must be "buy" or "sell"' });
    }

    // Use entryPrice as exchange rate (quote→USD approximation)
    const exchangeRate = entryPrice;

    const result = calculateProfitLoss(entryPrice, exitPrice, lotSize, pair, exchangeRate, type);

    // Risk % requires account balance — optional field
    const balance = typeof req.body.balance === 'number' && req.body.balance > 0
      ? req.body.balance
      : null;

    const riskPercent = balance
      ? calculateRiskPercentage(balance, Math.abs(result.profitLossUSD))
      : null;

    res.json({
      success: true,
      data: {
        pair,
        type,
        pipMovement: result.pipMovement,
        pipValue: result.pipValue,
        profitLossUSD: result.profitLossUSD,
        riskPercent,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/calc/risk-plan
router.post('/risk-plan', (req, res, next) => {
  try {
    const { balance, target, trades, winRate } = req.body;

    // --- validation ---
    if (typeof balance !== 'number' || balance <= 0) {
      return res.status(400).json({ error: 'balance must be a positive number' });
    }
    if (typeof target !== 'number' || target <= balance) {
      return res.status(400).json({ error: 'target must be a number greater than balance' });
    }
    if (!Number.isInteger(trades) || trades < 1 || trades > 10000) {
      return res.status(400).json({ error: 'trades must be an integer between 1 and 10000' });
    }

    const effectiveWinRate = typeof winRate === 'number' && winRate > 0 && winRate <= 100
      ? winRate
      : 55; // sensible default

    const RR_RATIO = 2; // assume 1:2 risk-reward for projection

    // ── Deterministic sweep: find minimum risk % to reach target ──
    const sweep = findMinimumRisk({
      balance,
      target,
      trades,
      winRate: effectiveWinRate,
      riskRewardRatio: RR_RATIO,
    });

    // If user provided a risk override, use it; otherwise use the sweep's optimal (or cap at 5%)
    const riskOverride = typeof req.body.riskOverride === 'number' && req.body.riskOverride > 0
      ? req.body.riskOverride
      : null;
    const suggestedRisk = riskOverride
      ? Math.round(riskOverride * 100) / 100
      : sweep.optimalRisk !== null
        ? sweep.optimalRisk
        : 5; // max if unreachable

    // Run a simulation with the suggested risk for win/loss counts
    const finalSim = simulateGrowth({
      balance,
      riskPercent: suggestedRisk,
      winRate: effectiveWinRate,
      riskRewardRatio: RR_RATIO,
      trades,
    });

    // Pick key scenarios at 0.5, 1, 2, 3, 5% for the breakdown
    const keyRisks = [0.5, 1, 2, 3, 5];
    const scenarioBreakdown = sweep.scenarios
      .filter(s => keyRisks.includes(s.riskPercent))
      .map(s => ({
        riskPercent: s.riskPercent,
        expectedBalance: s.expectedBalance,
        reachesTarget: s.reachesTarget,
      }));

    // Realism score (0-100): lower risk + higher win-rate = more realistic
    let realism = 100;
    if (suggestedRisk > 5) realism -= 30;
    else if (suggestedRisk > 3) realism -= 15;
    if (effectiveWinRate < 45) realism -= 25;
    else if (effectiveWinRate < 55) realism -= 10;
    const growthNeeded = ((target - balance) / balance) * 100;
    if (growthNeeded > 200) realism -= 20;
    else if (growthNeeded > 100) realism -= 10;
    realism = Math.max(0, Math.min(100, realism));

    res.json({
      success: true,
      data: {
        suggestedRiskPerTrade: suggestedRisk,
        expectedWins: finalSim.wins,
        expectedLosses: finalSim.losses,
        finalBalanceProjection: finalSim.finalBalance,
        realismScore: realism,
        reachable: sweep.reachable,
        optimalRisk: sweep.optimalRisk,
        scenarioBreakdown,
        insight: getRiskInsight({ riskPercent: suggestedRisk, winRate: effectiveWinRate, trades }),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
