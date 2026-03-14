/**
 * journalAiService.js — Gemini-powered journal analysis and report generation
 */
import axios from 'axios';
import { bumpGemini } from '../utils/geminiCounter.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt) {
  // Key 1 is dedicated to journal (user-triggered, unpredictable volume)
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'demo') throw new Error('GEMINI_API_KEY not configured');

  const res = await axios.post(
    `${GEMINI_URL}?key=${key}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 35000 }
  );

  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  bumpGemini('journal');
  return text;
}

function parseJson(raw) {
  // Strip markdown code fences if present
  const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/,'').trim();
  return JSON.parse(clean);
}

// ── Single trade journal analysis ─────────────────────────────────────────────
export async function analyzeJournalEntry(trade, journal) {
  const prompt = `You are an expert trading psychologist and performance coach. Analyze this trade journal entry and return structured JSON feedback.

TRADE DATA:
- Pair: ${trade.pair} | Direction: ${trade.direction}
- Position Size: ${trade.position_size ?? 'N/A'} lots
- Entry: ${trade.entry_price ?? 'N/A'} | Exit: ${trade.exit_price ?? 'N/A'}
- TP: ${trade.tp ?? 'N/A'} | SL: ${trade.sl ?? 'N/A'}
- Session: ${trade.session ?? 'N/A'}
- Outcome: ${trade.outcome} | P&L: ${trade.profit_loss ?? 'N/A'}

JOURNAL:
- Strategy: ${journal.strategy || 'Not specified'}
- Reasoning: ${journal.reasoning || 'Not provided'}
- Emotional State: ${journal.emotional_state || 'Not provided'}
- Lessons Learned: ${journal.lessons_learned || 'Not provided'}
- Notes: ${journal.notes || 'Not provided'}

Return ONLY a JSON object with these exact keys (no markdown, no explanation):
{
  "psychology_score": <integer 1-10, 10 = fully disciplined>,
  "emotional_bias": <"none" | "fear" | "greed" | "overconfidence" | "revenge" | "fomo" | "calm" | "anxious">,
  "trade_quality": <"excellent" | "good" | "average" | "poor">,
  "discipline_rating": <"disciplined" | "mostly_disciplined" | "emotional" | "impulsive">,
  "risk_assessment": <"good_risk_management" | "acceptable" | "poor_risk_management">,
  "key_observations": [<string>, <string>, <string>],
  "improvement_tips": [<string>, <string>],
  "coach_message": <1-2 sentence personalized motivational/instructional message>
}`;

  try {
    const raw = await callGemini(prompt);
    return parseJson(raw);
  } catch (err) {
    console.error('Journal AI analysis error:', err.message);
    return {
      psychology_score: 5,
      emotional_bias: 'unknown',
      trade_quality: 'average',
      discipline_rating: 'mostly_disciplined',
      risk_assessment: 'acceptable',
      key_observations: ['AI analysis temporarily unavailable'],
      improvement_tips: ['Review your trade setup and execution'],
      coach_message: 'Keep journaling consistently — the data will reveal your patterns over time.',
    };
  }
}

// ── Performance report generation ─────────────────────────────────────────────
export async function generatePerformanceReport(metrics, trades, reportType = 'weekly') {
  const recentJournaledTrades = trades
    .filter(t => t.reasoning || t.emotional_state || t.notes)
    .slice(-10)
    .map(t => `[${t.pair} ${t.direction?.toUpperCase()} → ${t.outcome?.toUpperCase()} P&L:${t.profit_loss ?? '?'}] Emotion:${t.emotional_state || 'N/A'} | "${(t.reasoning || t.notes || '').slice(0, 80)}"`)
    .join('\n');

  const prompt = `You are a professional trading performance coach. Write a comprehensive ${reportType} trading performance report.

PERFORMANCE METRICS:
- Total Trades: ${metrics.totalTrades} | Wins: ${metrics.wins} | Losses: ${metrics.losses}
- Win Rate: ${metrics.winRate}% | Loss Rate: ${metrics.lossRate}%
- Net P&L: ${metrics.netPnl} | Profit Factor: ${metrics.profitFactor}
- Avg Win: ${metrics.avgWin} | Avg Loss: ${metrics.avgLoss}
- Risk/Reward: ${metrics.rrkRatio} | Expectancy: ${metrics.expectancy}
- Max Drawdown: ${metrics.maxDrawdown}
- Best Instrument: ${metrics.bestPair?.pair || 'N/A'} (WR ${metrics.bestPair?.winRate}%, PnL ${metrics.bestPair?.pnl})
- Worst Instrument: ${metrics.worstPair?.pair || 'N/A'} (WR ${metrics.worstPair?.winRate}%, PnL ${metrics.worstPair?.pnl})

STRATEGY PERFORMANCE:
${metrics.stratStats.map(s => `${s.strategy}: WR ${s.winRate}% | ${s.total} trades | PnL ${s.pnl}`).join('\n') || 'No strategy data'}

BEHAVIORAL FLAGS:
${metrics.behavioral.map(b => `⚠ ${b.type.toUpperCase()}: ${b.message}`).join('\n') || 'No behavioral flags detected'}

RECENT JOURNAL ENTRIES:
${recentJournaledTrades || 'No journal entries available'}

Return ONLY a JSON object (no markdown):
{
  "title": "${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Performance Report",
  "performance_grade": <"A+" | "A" | "B" | "C" | "D" | "F">,
  "summary": <2-3 sentence narrative overview of the period>,
  "highlights": [<positive achievement 1>, <positive achievement 2>],
  "concerns": [<concern 1>, <concern 2>],
  "psychological_assessment": <paragraph evaluating trader psychology based on journal entries>,
  "strategy_insights": [<insight about best/worst strategies>],
  "behavioral_warnings": [<specific behavioral pattern to address>],
  "action_items": [<concrete action 1>, <concrete action 2>, <concrete action 3>],
  "ai_coach_advice": <motivating 2-3 sentence personalized message from AI coach>
}`;

  try {
    const raw = await callGemini(prompt);
    return parseJson(raw);
  } catch (err) {
    console.error('Report generation error:', err.message);
    return {
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Performance Report`,
      performance_grade: metrics.winRate >= 55 ? 'B' : metrics.winRate >= 45 ? 'C' : 'D',
      summary: `This period you completed ${metrics.totalTrades} trades with a ${metrics.winRate}% win rate and a profit factor of ${metrics.profitFactor}.`,
      highlights: [`Win rate: ${metrics.winRate}%`, `Profit factor: ${metrics.profitFactor}`],
      concerns: metrics.behavioral.map(b => b.message),
      psychological_assessment: 'Continue journaling to build a comprehensive behavioral dataset.',
      strategy_insights: [],
      behavioral_warnings: [],
      action_items: ['Review your best and worst trades', 'Stick to your trading plan', 'Journal every trade'],
      ai_coach_advice: 'Keep going — consistency in journaling is the first step to mastering your trading psychology.',
    };
  }
}
