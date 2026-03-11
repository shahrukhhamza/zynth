/**
 * analyticsService.js — Trading performance & behavioral analytics engine
 */

export function calcMetrics(trades) {
  if (!trades || trades.length === 0) {
    return { totalTrades: 0, wins: 0, losses: 0, breakevens: 0, equityCurve: [], pairStats: [], stratStats: [], behavioral: [], sessionStats: [], emotionMap: {} };
  }

  const wins       = trades.filter(t => t.outcome === 'win');
  const losses     = trades.filter(t => t.outcome === 'loss');
  const breakevens = trades.filter(t => t.outcome === 'breakeven');

  const totalTrades = trades.length;
  const winRate     = +(wins.length / totalTrades * 100).toFixed(1);
  const lossRate    = +(losses.length / totalTrades * 100).toFixed(1);

  const grossProfit = wins.reduce((s, t) => s + (t.profit_loss || 0), 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.profit_loss || 0), 0));
  const netPnl      = +(grossProfit - grossLoss).toFixed(2);

  const profitFactor = grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 999 : 0);
  const avgWin       = wins.length   > 0 ? +(grossProfit / wins.length).toFixed(2)  : 0;
  const avgLoss      = losses.length > 0 ? +(grossLoss   / losses.length).toFixed(2): 0;
  const rrkRatio     = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0;

  // Expectancy = (WR × avgWin) − (LR × avgLoss)
  const expectancy = +((wins.length / totalTrades * avgWin) - (losses.length / totalTrades * avgLoss)).toFixed(2);

  // Max drawdown
  let peak = 0, equity = 0, maxDrawdown = 0;
  trades.forEach(t => {
    equity += t.profit_loss || 0;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  // Per-pair stats
  const pairMap = {};
  trades.forEach(t => {
    if (!pairMap[t.pair]) pairMap[t.pair] = { wins: 0, losses: 0, pnl: 0, total: 0 };
    pairMap[t.pair].total++;
    pairMap[t.pair].pnl += t.profit_loss || 0;
    if (t.outcome === 'win')  pairMap[t.pair].wins++;
    if (t.outcome === 'loss') pairMap[t.pair].losses++;
  });
  const pairStats = Object.entries(pairMap)
    .map(([pair, s]) => ({ pair, ...s, pnl: +s.pnl.toFixed(2), winRate: +(s.wins / s.total * 100).toFixed(1) }))
    .sort((a, b) => b.pnl - a.pnl);

  // Per-strategy stats
  const stratMap = {};
  trades.forEach(t => {
    const key = t.strategy || 'Untagged';
    if (!stratMap[key]) stratMap[key] = { wins: 0, losses: 0, pnl: 0, total: 0 };
    stratMap[key].total++;
    stratMap[key].pnl += t.profit_loss || 0;
    if (t.outcome === 'win')  stratMap[key].wins++;
    if (t.outcome === 'loss') stratMap[key].losses++;
  });
  const stratStats = Object.entries(stratMap)
    .map(([strategy, s]) => ({ strategy, ...s, pnl: +s.pnl.toFixed(2), winRate: +(s.wins / s.total * 100).toFixed(1) }))
    .sort((a, b) => b.pnl - a.pnl);

  // Equity curve
  let runningEquity = 0;
  const equityCurve = trades.map(t => {
    runningEquity += t.profit_loss || 0;
    return { date: (t.created_at || '').slice(0, 10), equity: +runningEquity.toFixed(2), pair: t.pair, outcome: t.outcome };
  });

  // Session stats
  const sessionMap = {};
  trades.forEach(t => {
    const s = t.session || 'unknown';
    if (!sessionMap[s]) sessionMap[s] = { wins: 0, total: 0, pnl: 0 };
    sessionMap[s].total++;
    sessionMap[s].pnl += t.profit_loss || 0;
    if (t.outcome === 'win') sessionMap[s].wins++;
  });
  const sessionStats = Object.entries(sessionMap)
    .map(([session, v]) => ({ session, ...v, pnl: +v.pnl.toFixed(2), winRate: +(v.wins / v.total * 100).toFixed(1) }));

  // Emotional state distribution
  const emotionMap = {};
  trades.forEach(t => {
    const e = t.emotional_state || 'not_recorded';
    if (!emotionMap[e]) emotionMap[e] = { total: 0, wins: 0, pnl: 0 };
    emotionMap[e].total++;
    emotionMap[e].pnl += t.profit_loss || 0;
    if (t.outcome === 'win') emotionMap[e].wins++;
  });

  // Monthly P&L
  const monthlyMap = {};
  trades.forEach(t => {
    const m = (t.created_at || '').slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { pnl: 0, trades: 0, wins: 0 };
    monthlyMap[m].pnl += t.profit_loss || 0;
    monthlyMap[m].trades++;
    if (t.outcome === 'win') monthlyMap[m].wins++;
  });
  const monthlyStats = Object.entries(monthlyMap)
    .map(([month, v]) => ({ month, pnl: +v.pnl.toFixed(2), trades: v.trades, winRate: +(v.wins / v.trades * 100).toFixed(1) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate,
    lossRate,
    grossProfit: +grossProfit.toFixed(2),
    grossLoss:   +grossLoss.toFixed(2),
    netPnl,
    profitFactor,
    avgWin,
    avgLoss,
    rrkRatio,
    riskRewardRatio: rrkRatio,
    expectancy,
    maxDrawdown: +maxDrawdown.toFixed(2),
    bestPair:    pairStats[0]  || null,
    worstPair:   pairStats[pairStats.length - 1] || null,
    pairStats,
    stratStats,
    equityCurve,
    sessionStats,
    emotionMap,
    monthlyStats,
    behavioral: detectBehavior(trades),
  };
}

function detectBehavior(trades) {
  const flags = [];

  // Overtrading: >5 trades on same day
  const byDay = {};
  trades.forEach(t => { const d = (t.created_at || '').slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; });
  const otDays = Object.entries(byDay).filter(([, n]) => n > 5).length;
  if (otDays > 0) {
    flags.push({ type: 'overtrading', severity: 'warning',
      message: `Overtrading detected on ${otDays} day(s) — more than 5 trades in a single session.` });
  }

  // Revenge trading: position size ≥30% larger right after a loss
  let revengeCount = 0;
  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].outcome === 'loss' &&
        (trades[i].position_size || 0) > (trades[i - 1].position_size || 0) * 1.3) {
      revengeCount++;
    }
  }
  if (revengeCount > 0) {
    flags.push({ type: 'revenge_trading', severity: 'danger',
      message: `Revenge trading detected ${revengeCount} time(s) — position size significantly increased after a loss.` });
  }

  // Inconsistent position sizing (coefficient of variation > 50%)
  const sizes = trades.map(t => t.position_size).filter(Boolean);
  if (sizes.length > 4) {
    const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variance = sizes.reduce((a, b) => a + (b - avg) ** 2, 0) / sizes.length;
    if (avg > 0 && Math.sqrt(variance) / avg > 0.5) {
      flags.push({ type: 'inconsistent_sizing', severity: 'warning',
        message: 'Inconsistent position sizing detected — high variation in lot sizes may indicate emotional decision-making.' });
    }
  }

  // Max consecutive losses
  let curStreak = 0, maxStreak = 0;
  trades.forEach(t => {
    if (t.outcome === 'loss') { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else { curStreak = 0; }
  });
  if (maxStreak >= 3) {
    flags.push({ type: 'loss_streak', severity: 'warning',
      message: `Max consecutive losses: ${maxStreak}. Consider implementing a daily loss limit to protect your account.` });
  }

  // Emotional trading (negative emotions with poor outcomes)
  const negEmotions = ['fear', 'revenge', 'fomo', 'frustrated', 'anxious', 'angry'];
  const negTrades = trades.filter(t =>
    t.emotional_state && negEmotions.some(e => t.emotional_state.toLowerCase().includes(e))
  );
  if (negTrades.length > 0 && negTrades.length >= trades.length * 0.3) {
    const negWr = +(negTrades.filter(t => t.outcome === 'win').length / negTrades.length * 100).toFixed(1);
    flags.push({ type: 'emotional_trading', severity: 'warning',
      message: `${negTrades.length} trades logged during negative emotional states (win rate: ${negWr}%).` });
  }

  return flags;
}
