/**
 * macroAlignmentService.js
 *
 * "Trade Context Report" — for every logged trade, automatically determines:
 *  1. What high/medium-impact macro events happened on that trade day
 *  2. Whether the macro environment supported the trade direction (aligned / misaligned / neutral)
 *  3. A Gemini-powered 2-3 sentence coaching narrative
 *  4. Aggregate win-rate stats split by alignment category
 */

import axios from 'axios';
import { getEconomicCalendar } from './economicCalendarService.js';
import { bumpGemini } from '../utils/geminiCounter.js';

// ─── Country → Currency mapping ───────────────────────────────────────────────
const COUNTRY_CURRENCY = {
  'united states': 'USD',
  'us':            'USD',
  'usa':           'USD',
  'euro zone':     'EUR',
  'eurozone':      'EUR',
  'european union':'EUR',
  'eu':            'EUR',
  'united kingdom':'GBP',
  'uk':            'GBP',
  'japan':         'JPY',
  'canada':        'CAD',
  'australia':     'AUD',
  'new zealand':   'NZD',
  'switzerland':   'CHF',
  'china':         'CNY',
};

// ─── Pair → { base, quote } ───────────────────────────────────────────────────
const SPECIAL_BASES = {
  XAUUSD: 'XAU', XAGUSD: 'XAG', BTCUSD: 'BTC', ETHUSD: 'ETH',
  BTCUSDT: 'BTC', ETHUSDT: 'ETH', SPXUSD: 'SPX', NDX: 'NDX',
  XAUEUR: 'XAU', XAUGBP: 'XAU', XAUJPY: 'XAU',
};

export function extractCurrencies(pair) {
  const clean = (pair || '').replace('/', '').replace('-', '').toUpperCase().trim();

  for (const [k, base] of Object.entries(SPECIAL_BASES)) {
    if (clean.startsWith(k) || clean === k) {
      const quote = clean.slice(k.length) || 'USD';
      return { base, quote };
    }
  }

  // Standard 6-char FX pair
  if (clean.length === 6) {
    return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
  }

  return null;
}

// ─── Map an event's country field → ISO currency code ────────────────────────
function getEventCurrency(event) {
  // Prefer the explicit currency field
  if (event.currency && /^[A-Z]{3}$/.test(event.currency)) return event.currency;

  const country = (event.country || '').toLowerCase().trim();
  return COUNTRY_CURRENCY[country] || null;
}

// ─── Beat / Miss / Inline for a single event ─────────────────────────────────
//  Returns: 'bullish' | 'bearish' | 'neutral'
function getEventBias(event) {
  const actual   = event.actual   != null ? parseFloat(event.actual)   : null;
  const estimate = event.estimate != null ? parseFloat(event.estimate) : null;
  const forecast = event.forecast != null ? parseFloat(event.forecast) : null;
  const consensus = estimate ?? forecast;

  if (actual === null || consensus === null || isNaN(actual) || isNaN(consensus)) {
    return 'neutral'; // no data to compare
  }

  const diff = actual - consensus;

  // Indicators where HIGHER = BEARISH for that currency (e.g. Unemployment, Jobless Claims)
  const bearishOnHigher = [
    'unemployment', 'jobless', 'initial claims', 'continuing claims', 'trade deficit', 'deficit',
  ];
  const name = (event.name || event.event || '').toLowerCase();
  const invertBias = bearishOnHigher.some(kw => name.includes(kw));

  // Threshold: ignore tiny differences
  const pctDiff = consensus !== 0 ? Math.abs(diff / consensus) : Math.abs(diff);
  if (pctDiff < 0.005 && Math.abs(diff) < 0.1) return 'neutral';

  const rawBias = diff > 0 ? 'bullish' : 'bearish';
  return invertBias ? (rawBias === 'bullish' ? 'bearish' : 'bullish') : rawBias;
}

// ─── Core alignment logic ─────────────────────────────────────────────────────
/**
 * Given a trade and a list of assessed events, determine macro alignment.
 * Returns: { alignment, score, supportingEvents, opposingEvents }
 */
export function determineAlignment(trade, assessedEvents) {
  const currencies = extractCurrencies(trade.pair);
  if (!currencies) return { alignment: 'neutral', score: 0, supportingEvents: [], opposingEvents: [] };

  const { base, quote } = currencies;
  const isBuy = (trade.direction || '').toLowerCase() === 'buy';

  const supportingEvents = [];
  const opposingEvents   = [];
  let score = 0;

  for (const ev of assessedEvents) {
    if (ev.bias === 'neutral') continue;
    const impactWeight = ev.impact === 'high' ? 1.0 : ev.impact === 'medium' ? 0.5 : 0.2;

    // Does this currency match base or quote?
    const isBase  = ev.currency === base;
    const isQuote = ev.currency === quote;

    if (!isBase && !isQuote) continue;

    // For BUY: base bullish → support; base bearish → oppose; quote bullish → oppose; quote bearish → support
    // For SELL: invert
    let rawSignal = 0;
    if (isBase)  rawSignal = ev.bias === 'bullish' ? +1 : -1;
    if (isQuote) rawSignal = ev.bias === 'bullish' ? -1 : +1;
    if (!isBuy)  rawSignal *= -1;

    const weightedSignal = rawSignal * impactWeight;
    score += weightedSignal;

    if (weightedSignal > 0) supportingEvents.push(ev);
    else opposingEvents.push(ev);
  }

  let alignment;
  if (supportingEvents.length === 0 && opposingEvents.length === 0) {
    alignment = 'no_events';
  } else if (score > 0.3) {
    alignment = 'aligned';
  } else if (score < -0.3) {
    alignment = 'misaligned';
  } else {
    alignment = 'neutral';
  }

  return { alignment, score: parseFloat(score.toFixed(2)), supportingEvents, opposingEvents };
}

// ─── Gemini narrative ─────────────────────────────────────────────────────────
async function generateNarrative(trade, assessedEvents, alignmentResult) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'demo') return null;

  const { alignment, supportingEvents, opposingEvents } = alignmentResult;
  const currencies = extractCurrencies(trade.pair);

  const eventLines = assessedEvents
    .filter(e => e.bias !== 'neutral')
    .slice(0, 6)
    .map(e => `  • ${e.name} [${e.currency}] — ${e.bias.toUpperCase()} (actual: ${e.actual ?? '?'}, est: ${e.estimate ?? e.forecast ?? '?'}, impact: ${e.impact})`)
    .join('\n') || '  • No significant macro data releases detected.';

  const pnlStr = trade.profit_loss != null ? `${parseFloat(trade.profit_loss) >= 0 ? '+' : ''}${parseFloat(trade.profit_loss).toFixed(2)}` : 'N/A';

  const prompt = `You are Zynth, an elite trading coach. Write a 3-sentence "Trade Context Report" for this trade.

TRADE:
  Pair: ${trade.pair} | Direction: ${(trade.direction || '').toUpperCase()} | Outcome: ${(trade.outcome || 'N/A').toUpperCase()} | P&L: ${pnlStr}
  Date: ${(trade.created_at || '').slice(0, 10)}
  Currencies: base=${currencies?.base ?? '?'}, quote=${currencies?.quote ?? '?'}

MACRO EVENTS ON TRADE DAY:
${eventLines}

ALIGNMENT RESULT: ${alignment.toUpperCase()}
  Supporting events: ${supportingEvents.map(e => e.name).join(', ') || 'none'}
  Opposing events:   ${opposingEvents.map(e => e.name).join(', ')  || 'none'}

INSTRUCTIONS:
- Sentence 1: Describe the macroeconomic backdrop on the trade day (what major data released and what it meant).
- Sentence 2: Explain whether the macro environment supported or opposed this specific trade direction.
- Sentence 3: A precise, actionable coaching lesson specific to this trade setup (not generic advice).
- Tone: confident, direct, mentor-like. No fluff. No bullet points. Pure prose, 3 sentences only.
- Do NOT start with "I" or "As Zynth". Just write the report.`;

  try {
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const res = await axios.post(
      `${GEMINI_URL}?key=${key}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 512 } },
      { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
    );
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) bumpGemini('macro_context');
    return text || null;
  } catch (err) {
    console.warn('macroAlignment: Gemini narrative failed:', err.message);
    return null;
  }
}

// ─── Main: get full context for a single trade ─────────────────────────────────
export async function getMacroContextForTrade(trade, { withNarrative = true } = {}) {
  const tradeDate = (trade.created_at || '').slice(0, 10);
  if (!tradeDate) return buildEmptyContext('no_date');

  // Fetch calendar events for that specific date
  let rawEvents = [];
  try {
    rawEvents = await getEconomicCalendar({ filter: 'custom', from: tradeDate, to: tradeDate });
  } catch (err) {
    console.warn('macroAlignment: calendar fetch failed:', err.message);
  }

  // Keep only high + medium impact events with currency data
  const relevantEvents = (rawEvents || []).filter(e =>
    (e.impact === 'high' || e.impact === 'medium') && getEventCurrency(e)
  );

  // Assess each event
  const assessedEvents = relevantEvents.map(e => ({
    id:       e.id,
    name:     e.name || e.event,
    currency: getEventCurrency(e),
    country:  e.country,
    impact:   e.impact,
    time:     e.time,
    actual:   e.actual,
    estimate: e.estimate ?? e.forecast,
    previous: e.previous ?? e.prev,
    bias:     getEventBias(e),
  }));

  const alignmentResult = determineAlignment(trade, assessedEvents);

  let narrative = null;
  if (withNarrative) {
    narrative = await generateNarrative(trade, assessedEvents, alignmentResult);
  }

  return {
    tradeDate,
    events:          assessedEvents,
    eventCount:      assessedEvents.length,
    alignment:       alignmentResult.alignment,
    alignmentScore:  alignmentResult.score,
    supportingEvents: alignmentResult.supportingEvents,
    opposingEvents:   alignmentResult.opposingEvents,
    narrative,
  };
}

function buildEmptyContext(reason) {
  return {
    tradeDate: null,
    events: [],
    eventCount: 0,
    alignment: 'no_events',
    alignmentScore: 0,
    supportingEvents: [],
    opposingEvents: [],
    narrative: null,
    reason,
  };
}

// ─── Aggregate stats: win rate by alignment category ──────────────────────────
/**
 * Given trades that already have macro_alignment stored, compute win-rate stats.
 * For trades without it, we skip them in the stats (they haven't been analysed yet).
 */
export function getMacroAlignmentStats(trades) {
  const cats = {
    aligned:    { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
    misaligned: { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
    neutral:    { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
    no_events:  { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
  };

  for (const t of trades) {
    const cat = t.macro_alignment;
    if (!cat || !cats[cat]) continue;

    const bucket = cats[cat];
    bucket.total += 1;
    if (t.outcome === 'win')       bucket.wins      += 1;
    else if (t.outcome === 'loss') bucket.losses    += 1;
    else                           bucket.breakevens += 1;
    bucket.netPnl += parseFloat(t.profit_loss) || 0;
    bucket.trades.push({ id: t.id, pair: t.pair, direction: t.direction, outcome: t.outcome, pnl: t.profit_loss });
  }

  // Derive win rates
  const result = {};
  for (const [key, b] of Object.entries(cats)) {
    result[key] = {
      ...b,
      netPnl:  parseFloat(b.netPnl.toFixed(2)),
      winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : null,
    };
  }

  // Pair-level breakdown (how many aligned vs misaligned per pair)
  const pairMap = {};
  for (const t of trades) {
    if (!t.macro_alignment) continue;
    const p = t.pair?.toUpperCase() || 'UNKNOWN';
    if (!pairMap[p]) pairMap[p] = { pair: p, aligned: 0, misaligned: 0, neutral: 0, no_events: 0, totalAlignedWins: 0, totalMisalignedWins: 0 };
    pairMap[p][t.macro_alignment] = (pairMap[p][t.macro_alignment] || 0) + 1;
    if (t.outcome === 'win' && t.macro_alignment === 'aligned')    pairMap[p].totalAlignedWins++;
    if (t.outcome === 'win' && t.macro_alignment === 'misaligned') pairMap[p].totalMisalignedWins++;
  }

  const pairBreakdown = Object.values(pairMap)
    .sort((a, b) => (b.aligned + b.misaligned) - (a.aligned + a.misaligned))
    .slice(0, 10);

  const analysedCount = trades.filter(t => !!t.macro_alignment).length;
  const totalClosed   = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss').length;

  return {
    stats: result,
    pairBreakdown,
    analysedCount,
    totalClosed,
    coveragePct: totalClosed > 0 ? Math.round((analysedCount / totalClosed) * 100) : 0,
  };
}
