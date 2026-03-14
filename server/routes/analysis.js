/**
 * analysis.js — Macro-Journal Correlation API
 *
 * GET /api/analysis/macro-correlation
 *   Correlates user trade outcomes with macro conditions at trade time.
 *   Uses FRED historical series to retroactively score past trade dates.
 *   Requires Pro or Elite plan.
 */

import { Router } from 'express';
import axios from 'axios';
import { requireAuth, requirePro, requireElite } from '../middleware/authMiddleware.js';
import {
  getAllTradesForUser,
  insertMacroSnapshot,
  getRecentMacroSnapshots,
  getChecklistHistory,
  insertDnaReport,
  getLatestDnaReport,
  countDnaReportsThisMonth,
} from '../services/journalDb.js';
import {
  calculateMacroSurpriseScore,
  getEconomicDashboard,
} from '../services/economicIntelligenceService.js';

const router = Router();
router.use(requireAuth, requirePro);

function getUserId(req) {
  return req.user?.userId || req.user?.id || 'default';
}

// ── Macro score ranges ────────────────────────────────────────────────────────
const MACRO_RANGES = [
  { label: 'Strongly Bullish', minInclusive:  6, maxExclusive:  Infinity, emoji: '🟢🟢' },
  { label: 'Bullish',          minInclusive:  2, maxExclusive:  6,        emoji: '🟢'   },
  { label: 'Neutral',          minInclusive: -2, maxExclusive:  2,        emoji: '⚪'   },
  { label: 'Bearish',          minInclusive: -6, maxExclusive: -2,        emoji: '🔴'   },
  { label: 'Strongly Bearish', minInclusive: -Infinity, maxExclusive: -6, emoji: '🔴🔴' },
];

// Indicators where a positive surprise is BEARISH for gold
const BEARISH_GOLD_ON_POSITIVE = new Set([
  'nfp', 'fedRate', 'gdp', 'retailSales', 'ismMfg', 'consumerConf',
]);

const WEIGHTS = {
  cpi: 2.0, nfp: 1.8, fedRate: 1.8, corePCE: 1.6,
  unemployment: 1.2, gdp: 1.2, joblessClaims: 0.8,
  retailSales: 0.8, ismMfg: 0.7, consumerConf: 0.7,
};
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * Build a map of { 'YYYY-MM': score } from the dashboard's historical series.
 * All FRED series return 12 months of data; we use trailing-3 as forecast proxy.
 */
function buildMonthlyMacroScores(dashboard) {
  const seriesMap = {};
  for (const [key, data] of Object.entries(dashboard.indicators || {})) {
    const hist = data?.historicalData;
    if (Array.isArray(hist) && hist.length >= 4) {
      seriesMap[key] = hist; // chronological array of { date, value }
    }
  }

  const allMonths = new Set();
  for (const series of Object.values(seriesMap)) {
    for (const p of series) {
      if (p.date) allMonths.add(p.date.slice(0, 7));
    }
  }

  const monthlyScores = {};
  for (const monthStr of allMonths) {
    let rawSum = 0;
    let contributors = 0;

    for (const [key, series] of Object.entries(seriesMap)) {
      const weight = WEIGHTS[key];
      if (!weight) continue;

      const available = series.filter(p => typeof p.date === 'string' && p.date.slice(0, 7) <= monthStr);
      if (available.length < 4) continue;

      const latest  = available[available.length - 1];
      const prev3   = available.slice(-4, -1);
      const forecast = prev3.reduce((s, p) => s + p.value, 0) / prev3.length;
      const surprise = latest.value - forecast;
      const absPct   = forecast !== 0 ? Math.abs(surprise / Math.abs(forecast)) * 100 : 0;

      let magnitude = 0;
      if (absPct >= 20) magnitude = 3;
      else if (absPct >= 10) magnitude = 2;
      else if (absPct >= 3)  magnitude = 1;
      else if (absPct > 0)   magnitude = 0.3;

      const isBearish = BEARISH_GOLD_ON_POSITIVE.has(key);
      const direction = surprise > 0 ? (isBearish ? -1 : 1) : (isBearish ? 1 : -1);
      rawSum += magnitude * weight * direction;
      contributors++;
    }

    if (contributors > 0) {
      const norm = Math.max(-10, Math.min(10, (rawSum / (3 * TOTAL_WEIGHT)) * 10));
      monthlyScores[monthStr] = Math.round(norm * 10) / 10;
    }
  }

  return monthlyScores;
}

/**
 * Find the nearest macro score for a trade date.
 * Tries monthly scores first; falls back to saved snapshots; falls back to current.
 */
function scoreForDate(dateStr, monthlyScores, snapshots, currentScore) {
  if (!dateStr) return currentScore;

  const month = dateStr.slice(0, 7);
  if (monthlyScores[month] !== undefined) return monthlyScores[month];

  // Nearest saved snapshot
  if (snapshots.length) {
    let best = null, bestDays = Infinity;
    for (const s of snapshots) {
      const days = Math.abs(new Date(dateStr) - new Date(s.date)) / 86400000;
      if (days < bestDays) { bestDays = days; best = s.score; }
    }
    if (bestDays <= 60) return best;
  }

  return currentScore;
}

/**
 * Compute per-range stats.
 */
function computeRangeStats(closedTrades, scoreByDate) {
  return MACRO_RANGES.map(r => {
    const bucket = closedTrades.filter(t => {
      const s = scoreByDate[t.created_at?.slice(0, 10)];
      if (s === null || s === undefined) return false;
      return s >= r.minInclusive && s < r.maxExclusive;
    });
    const wins = bucket.filter(t => t.outcome === 'win').length;
    return {
      range:   r.label,
      emoji:   r.emoji,
      count:   bucket.length,
      wins,
      winRate: bucket.length > 0 ? Math.round((wins / bucket.length) * 100) : null,
    };
  });
}

/**
 * Check which trades landed on or near an indicator release day.
 * Uses latest release date of each indicator from the dashboard.
 */
function computeIndicatorImpact(closedTrades, dashboard) {
  const results = [];
  for (const [key, data] of Object.entries(dashboard.indicators || {})) {
    const releaseDate = data?.latestDate;
    if (!releaseDate) continue;

    const nearby = closedTrades.filter(t => {
      const td = t.created_at?.slice(0, 10);
      if (!td) return false;
      const diff = Math.abs(new Date(td) - new Date(releaseDate)) / 86400000;
      return diff <= 1;
    });

    if (!nearby.length) continue;
    const wins = nearby.filter(t => t.outcome === 'win').length;
    results.push({
      indicator: data.indicator || key,
      code:      key,
      releaseDate,
      tradesCount: nearby.length,
      wins,
      winRate: Math.round((wins / nearby.length) * 100),
    });
  }
  return results.sort((a, b) => b.tradesCount - a.tradesCount);
}

/**
 * Ask Gemini to write a 3-paragraph macro-journal correlation analysis.
 */
async function generateAiNarrative(macroRangeStats, indicatorImpact, currentScore) {
  const key = process.env.GEMINI_API_KEY;
  const enabled = process.env.USE_GEMINI_AI !== 'false';
  if (!key || !enabled) return null;

  const rangeLines = macroRangeStats
    .filter(r => r.count > 0)
    .map(r => `  ${r.range}: ${r.count} trades, ${r.winRate ?? 'N/A'}% win rate`)
    .join('\n');

  const indLines = indicatorImpact.length
    ? indicatorImpact.map(i => `  ${i.indicator}: ${i.tradesCount} trades on release day, ${i.winRate}% win rate`).join('\n')
    : '  Insufficient data (no trades on known indicator release days)';

  const prompt = `You are an expert trading coach. Analyze this trader's performance correlated with macro conditions.

MACRO SCORE RANGES & WIN RATES (score −10 to +10):
${rangeLines}

Current macro score: ${currentScore ?? 'unknown'} (positive = bullish USD environment)

ECONOMIC INDICATOR RELEASE DAY PERFORMANCE:
${indLines}

Write exactly 3 short paragraphs (3–4 sentences each) covering:
1. How macro conditions are affecting this trader's performance — use their specific numbers.
2. Which economic events or conditions they should be cautious about — be specific.
3. Actionable recommendations for aligning trades with macro conditions.

Be concise, data-driven and direct. No generic advice. Use plain text, no markdown headers.`;

  try {
    const resp = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 650 } },
      { timeout: 28000 }
    );
    return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch (err) {
    console.error('Gemini macro narrative error:', err.message);
    return null;
  }
}

// ── GET /api/analysis/macro-correlation ──────────────────────────────────────
router.get('/macro-correlation', async (req, res) => {
  try {
    const userId = getUserId(req);

    // 1. Fetch user's trades
    const allTrades   = getAllTradesForUser(userId);
    const closedTrades = allTrades.filter(t => t.outcome === 'win' || t.outcome === 'loss');

    // 2. Get current macro score and save as today's snapshot
    const macroResult  = await calculateMacroSurpriseScore();
    const currentScore = macroResult?.score ?? null;
    const todayStr     = new Date().toISOString().slice(0, 10);
    if (currentScore !== null) {
      try {
        insertMacroSnapshot({ score: currentScore, label: macroResult.label ?? 'Unknown', date: todayStr });
      } catch { /* duplicate date — ignore */ }
    }

    // 3. Get saved snapshots (for nearest-date lookup fallback)
    const snapshots = getRecentMacroSnapshots(365);

    // 4. Get economic dashboard to build monthly historical scores + indicator release dates
    const dashboard = await getEconomicDashboard();
    const monthlyScores = dashboard.error ? {} : buildMonthlyMacroScores(dashboard);
    const hasHistorical = Object.keys(monthlyScores).length > 0;

    // 5. Assign a macro score to each closed trade
    const scoreByDate = {};
    for (const t of closedTrades) {
      const dateStr = t.created_at?.slice(0, 10);
      if (dateStr && scoreByDate[dateStr] === undefined) {
        scoreByDate[dateStr] = scoreForDate(dateStr, monthlyScores, snapshots, currentScore ?? 0);
      }
    }

    // 6. Range stats
    const macroRangeStats = computeRangeStats(closedTrades, scoreByDate);

    // 7. Indicator impact
    const indicatorImpact = dashboard.error ? [] : computeIndicatorImpact(closedTrades, dashboard);

    // 8. Timeline data for scatter chart
    const timelineTrades = closedTrades.map(t => ({
      date:       t.created_at?.slice(0, 10),
      outcome:    t.outcome,
      pair:       t.pair,
      macroScore: scoreByDate[t.created_at?.slice(0, 10)] ?? currentScore ?? 0,
    })).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

    // 9. Monthly macro timeline for the line in the chart
    const macroTimeline = Object.entries(monthlyScores)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, score]) => ({ date, score }));

    // 10. Key insight: best macro range for win rate
    const ranked = macroRangeStats.filter(r => r.count >= 3 && r.winRate !== null)
      .sort((a, b) => b.winRate - a.winRate);
    const worst = [...ranked].sort((a, b) => a.winRate - b.winRate)[0];
    const best  = ranked[0];
    let keyInsight = null;
    if (best && worst && best !== worst) {
      const diff = best.winRate - worst.winRate;
      keyInsight = `Your win rate is ${diff}% higher during ${best.range} conditions (${best.winRate}%) vs ${worst.range} conditions (${worst.winRate}%).`;
    } else if (best) {
      keyInsight = `Your best win rate (${best.winRate}%) comes during ${best.range} macro conditions.`;
    }

    // 11. Gemini narrative
    const aiNarrative = await generateAiNarrative(macroRangeStats, indicatorImpact, currentScore);

    res.json({
      success: true,
      macroRangeStats,
      indicatorImpact,
      timelineTrades,
      macroTimeline,
      snapshots: snapshots.map(s => ({ date: s.date, score: s.score })),
      currentMacroScore: currentScore,
      currentMacroLabel: macroResult?.label ?? 'Unknown',
      keyInsight,
      aiNarrative,
      totalTrades:       allTrades.length,
      closedTradesCount: closedTrades.length,
      dataSource:        hasHistorical ? 'fred_historical' : 'current_score',
    });
  } catch (err) {
    console.error('GET /analysis/macro-correlation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Trading DNA helpers ───────────────────────────────────────────────────────

function calcTraitScores(trades, checklists) {
  const closed = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss');
  if (closed.length === 0) return null;

  const sorted = [...trades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // 1. Patience: avg days between trades
  let avgGap = 1;
  if (sorted.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (new Date(sorted[i].created_at) - new Date(sorted[i - 1].created_at)) / 86400000;
    }
    avgGap = totalGap / (sorted.length - 1);
  }
  const patience = Math.min(100, Math.max(10, Math.round((Math.min(avgGap, 14) / 14) * 100)));

  // 2. Discipline: checklist scores or strategy adherence
  let discipline;
  if (checklists.length >= 3) {
    const avgScore = checklists.reduce((s, c) => s + (c.score || 0), 0) / checklists.length;
    discipline = Math.round(avgScore);
  } else {
    const withStrategy = trades.filter(t => t.strategy && t.strategy.trim()).length;
    const stratRate = trades.length > 0 ? withStrategy / trades.length : 0;
    const badChecks = checklists.filter(c => c.proceeded === 1 && c.recommendation !== 'green_light').length;
    const penalty = checklists.length > 0 ? (badChecks / checklists.length) * 30 : 0;
    discipline = Math.max(10, Math.round(stratRate * 80 - penalty + 20));
  }
  discipline = Math.min(100, Math.max(0, discipline));

  // 3. Risk Management: avg RR + SL usage
  const tradesWithRR = trades.filter(t => t.tp && t.sl && t.entry_price && t.direction);
  let avgRR = 1.0;
  if (tradesWithRR.length > 0) {
    const rrVals = tradesWithRR.map(t => {
      const e = parseFloat(t.entry_price), tp = parseFloat(t.tp), sl = parseFloat(t.sl);
      if (t.direction === 'buy') { const r = e - sl, w = tp - e; return r > 0 ? w / r : null; }
      const r = sl - e, w = e - tp; return r > 0 ? w / r : null;
    }).filter(v => v !== null && v > 0);
    if (rrVals.length > 0) avgRR = rrVals.reduce((a, b) => a + b, 0) / rrVals.length;
  }
  const slRate = trades.length > 0 ? trades.filter(t => t.sl).length / trades.length : 0;
  const riskManagement = Math.min(100, Math.round((Math.min(avgRR, 3) / 3) * 60 + slRate * 40));

  // 4. Emotional Control
  const BAD = new Set(['revenge', 'frustrated', 'anxious', 'fearful', 'fomo', 'greedy']);
  const GOOD = new Set(['calm', 'confident', 'neutral']);
  const withEmotion = trades.filter(t => t.emotional_state);
  let emotionalControl = 70;
  if (withEmotion.length >= 3) {
    const goodRate = withEmotion.filter(t => GOOD.has(t.emotional_state)).length / withEmotion.length;
    const badBad = withEmotion.filter(t => BAD.has(t.emotional_state) && t.outcome === 'loss').length;
    const badTotal = withEmotion.filter(t => BAD.has(t.emotional_state)).length;
    const badLossRate = badTotal > 0 ? badBad / badTotal : 0;
    emotionalControl = Math.round(goodRate * 60 + (1 - badLossRate) * 40);
  }
  emotionalControl = Math.min(100, Math.max(0, emotionalControl));

  // 5. Consistency: coefficient of variation in P&L
  const pnlVals = closed.filter(t => t.profit_loss !== null).map(t => parseFloat(t.profit_loss));
  let consistency = 50;
  if (pnlVals.length >= 4) {
    const mean = pnlVals.reduce((a, b) => a + b, 0) / pnlVals.length;
    const variance = pnlVals.reduce((s, v) => s + (v - mean) ** 2, 0) / pnlVals.length;
    const cv = mean !== 0 ? Math.abs(Math.sqrt(variance) / mean) : 2;
    consistency = Math.min(100, Math.max(10, Math.round(100 - Math.min(cv, 2) * 45)));
  }

  // 6. Strategy Adherence
  const withStrat = trades.filter(t => t.strategy?.trim()).length;
  const stratRate = trades.length > 0 ? withStrat / trades.length : 0;
  const uniqStrats = new Set(trades.map(t => t.strategy).filter(Boolean)).size;
  const focusBonus = uniqStrats <= 2 ? 20 : uniqStrats <= 4 ? 10 : 0;
  const strategyAdherence = Math.min(100, Math.round(stratRate * 80 + focusBonus));

  // 7. Macro Awareness: session quality proxy
  const BEST = new Set(['london', 'new_york', 'overlap']);
  const withSession = trades.filter(t => t.session);
  const goodSessionRate = withSession.length > 0
    ? withSession.filter(t => BEST.has(t.session)).length / withSession.length : 0.5;
  const macroAwareness = Math.min(100, Math.round(goodSessionRate * 70 + stratRate * 30));

  // 8. Learning Rate: first-half vs second-half win rate
  let learningRate = 50;
  if (closed.length >= 6) {
    const sc = [...closed].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const h = Math.floor(sc.length / 2);
    const wr1 = sc.slice(0, h).filter(t => t.outcome === 'win').length / h;
    const wr2 = sc.slice(h).filter(t => t.outcome === 'win').length / (sc.length - h);
    learningRate = Math.min(100, Math.max(10, Math.round(50 + (wr2 - wr1) * 100)));
  }

  return { patience, discipline, riskManagement, emotionalControl, consistency, strategyAdherence, macroAwareness, learningRate, avgRR: Math.round(avgRR * 100) / 100 };
}

function determineArchetype(traits, trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const daySpan = sorted.length >= 2
    ? Math.max(1, (new Date(sorted[sorted.length - 1].created_at) - new Date(sorted[0].created_at)) / 86400000)
    : 1;
  const tradesPerDay = trades.length / daySpan;
  const stratCounts = {};
  trades.forEach(t => { if (t.strategy) stratCounts[t.strategy] = (stratCounts[t.strategy] || 0) + 1; });
  const topStrat = (Object.entries(stratCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '').toLowerCase();

  if (traits.discipline < 30 && traits.riskManagement < 30) return 'The Gambler';
  if (tradesPerDay > 3 || traits.patience < 25) return 'The Scalper';
  if (traits.patience > 70 && traits.discipline > 65) return 'The Sniper';
  if (topStrat.includes('trend') || topStrat.includes('momentum') || topStrat.includes('breakout')) return 'The Momentum Rider';
  if (topStrat.includes('contra') || topStrat.includes('counter') || topStrat.includes('reversal')) return 'The Contrarian';
  if (topStrat.includes('news') || topStrat.includes('event') || topStrat.includes('release')) return 'The News Trader';
  if (traits.patience > 55) return 'The Swing Trader';
  return 'The Momentum Rider';
}

function computeBehaviorFlags(trades) {
  const flags = [];
  const sorted = [...trades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let revengeCount = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].outcome === 'loss') {
      const gap = (new Date(sorted[i + 1].created_at) - new Date(sorted[i].created_at)) / 3600000;
      if (gap < 2) revengeCount++;
    }
  }
  if (revengeCount > 0) flags.push(`Revenge trading detected: ${revengeCount} trades placed within 2 hours of a loss`);

  const friClosed = trades.filter(t => {
    const d = new Date(t.created_at).getUTCDay();
    return d === 5 && (t.outcome === 'win' || t.outcome === 'loss');
  });
  if (friClosed.length >= 3) {
    const friWR = Math.round(friClosed.filter(t => t.outcome === 'win').length / friClosed.length * 100);
    if (friWR < 40) flags.push(`Poor Friday performance: ${friWR}% win rate across ${friClosed.length} Friday trades`);
  }

  if (flags.length === 0) flags.push('No major behavioral red flags detected');
  return flags;
}

async function callGeminiDNA({ stats, traits, archetype, behaviorFlags, userName }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const prompt = `You are a world-class trading coach and behavioral psychologist. Analyze this trader's complete history and generate their Trading DNA report.

TRADER: ${userName || 'Trader'}
SUMMARY: ${stats.totalTrades} total trades | ${stats.winRate}% win rate | Net P&L: ${stats.netPnl} | Avg RR: ${traits.avgRR}
TRADING SINCE: ${stats.firstTradeDate} | Best pair: ${stats.bestPair || 'N/A'} | Most used strategy: ${stats.topStrategy || 'N/A'}

ASSIGNED ARCHETYPE: ${archetype}

DNA TRAIT SCORES (0-100):
Patience ${traits.patience} | Discipline ${traits.discipline} | Risk Management ${traits.riskManagement} | Emotional Control ${traits.emotionalControl} | Consistency ${traits.consistency} | Strategy Adherence ${traits.strategyAdherence} | Macro Awareness ${traits.macroAwareness} | Learning Rate ${traits.learningRate}

BEHAVIORAL OBSERVATIONS:
${behaviorFlags.join('\n')}

Return ONLY valid JSON (no markdown, no code fences):
{
  "archetypeDescription": "2-sentence description of the ${archetype} archetype as it applies to this specific trader's numbers",
  "tagline": "3-6 word memorable tagline for the archetype",
  "strengths": [
    {"title": "short strength title", "description": "specific evidence from their data"},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ],
  "weaknesses": [
    {"title": "short weakness title", "description": "specific evidence and impact"},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ],
  "coachMessage": "2-3 paragraph personal letter. Start: Dear ${userName || 'Trader'},. Warm, specific to their numbers. Encouraging but honest.",
  "improvementPlan": [
    {"week": 1, "focus": "focus area title", "action": "specific daily action"},
    {"week": 2, "focus": "...", "action": "..."},
    {"week": 3, "focus": "...", "action": "..."},
    {"week": 4, "focus": "...", "action": "..."}
  ]
}`;
  try {
    const resp = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } },
      { timeout: 35000 }
    );
    const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini DNA error:', err.message);
    return null;
  }
}

// ── Trading DNA routes ────────────────────────────────────────────────────────

// GET /api/analysis/trading-dna/latest
router.get('/trading-dna/latest', requireElite, async (req, res) => {
  try {
    const userId = getUserId(req);
    const allTrades = getAllTradesForUser(userId);
    const closed = allTrades.filter(t => t.outcome === 'win' || t.outcome === 'loss');
    const latest = getLatestDnaReport(userId);
    const reportsThisMonth = countDnaReportsThisMonth(userId);
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    return res.json({
      success: true,
      report: latest ? {
        ...latest,
        trait_scores:     JSON.parse(latest.trait_scores || 'null'),
        strengths:        JSON.parse(latest.strengths || '[]'),
        weaknesses:       JSON.parse(latest.weaknesses || '[]'),
        improvement_plan: JSON.parse(latest.improvement_plan || '[]'),
        report_data:      JSON.parse(latest.report_data || 'null'),
      } : null,
      tradeCount:    allTrades.length,
      closedCount:   closed.length,
      canGenerate:   reportsThisMonth === 0,
      nextAvailable: reportsThisMonth > 0 ? nextMonth.toISOString() : null,
    });
  } catch (err) {
    console.error('GET /analysis/trading-dna/latest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/analysis/trading-dna
router.post('/trading-dna', requireElite, async (req, res) => {
  try {
    const userId = getUserId(req);
    const allTrades = getAllTradesForUser(userId);
    const closed = allTrades.filter(t => t.outcome === 'win' || t.outcome === 'loss');

    if (allTrades.length < 10) {
      return res.status(422).json({ success: false, insufficientData: true, tradeCount: allTrades.length, required: 10 });
    }

    const reportsThisMonth = countDnaReportsThisMonth(userId);
    if (reportsThisMonth > 0) {
      const now = new Date();
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      return res.status(429).json({ success: false, alreadyGenerated: true, nextAvailable: nextMonth.toISOString() });
    }

    const checklists = getChecklistHistory(userId, 200);
    const traits = calcTraitScores(allTrades, checklists);
    const archetype = determineArchetype(traits, allTrades);
    const behaviorFlags = computeBehaviorFlags(allTrades);

    const winRate = closed.length > 0 ? Math.round(closed.filter(t => t.outcome === 'win').length / closed.length * 100) : 0;
    const netPnl = closed.reduce((s, t) => s + (parseFloat(t.profit_loss) || 0), 0).toFixed(2);

    const pairCounts = {};
    allTrades.forEach(t => { pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1; });
    const bestPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const stratCounts = {};
    allTrades.forEach(t => { if (t.strategy) stratCounts[t.strategy] = (stratCounts[t.strategy] || 0) + 1; });
    const topStrategy = Object.entries(stratCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const sorted = [...allTrades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstTradeDate = sorted[0]?.created_at?.slice(0, 10) ?? 'Unknown';

    const userName = req.user?.name || req.user?.username || 'Trader';
    const stats = { totalTrades: allTrades.length, winRate, netPnl, firstTradeDate, bestPair, topStrategy };

    const aiResult = await callGeminiDNA({ stats, traits, archetype, behaviorFlags, userName });

    const radarData = [
      { axis: 'Win Rate',      value: winRate },
      { axis: 'Profit Factor', value: Math.min(100, Math.round(parseFloat(netPnl) > 0 ? 60 + (traits.consistency / 100 * 40) : 30)) },
      { axis: 'RR Ratio',      value: Math.min(100, Math.round((traits.avgRR / 3) * 100)) },
      { axis: 'Consistency',   value: traits.consistency },
      { axis: 'Discipline',    value: traits.discipline },
      { axis: 'Psychology',    value: traits.emotionalControl },
    ];

    const reportData = { archetype, traits, stats, radarData, behaviorFlags, ...(aiResult || {}) };

    insertDnaReport({
      user_id:          userId,
      archetype,
      trait_scores:     JSON.stringify(traits),
      strengths:        JSON.stringify(aiResult?.strengths ?? []),
      weaknesses:       JSON.stringify(aiResult?.weaknesses ?? []),
      coach_message:    aiResult?.coachMessage ?? '',
      improvement_plan: JSON.stringify(aiResult?.improvementPlan ?? []),
      report_data:      JSON.stringify(reportData),
    });

    return res.json({ success: true, data: reportData });
  } catch (err) {
    console.error('POST /analysis/trading-dna error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
