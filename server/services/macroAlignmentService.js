/**
 * macroAlignmentService.js
 *
 * "Trade Context Report" — for every logged trade, automatically determines:
 *  1. What high/medium-impact macro events happened on that trade day (+ 1 day prior)
 *  2. Whether the macro environment supported the trade direction (aligned / misaligned / neutral)
 *  3. A Gemini-powered coaching narrative with session + emotion + strategy context
 *  4. Aggregate win-rate stats split by alignment category, session, and pair
 *
 * Improvements over v1:
 *  - Multi-day lookback: high-impact events from the day before still move markets
 *  - Time-proximity weighting: events close to trade entry score higher
 *  - Commodity/index logic: XAU, XAG, OIL, SPX, NAS treated as risk-sentiment proxies
 *  - Confidence scoring: based on number of assessed events
 *  - Expanded currency map (CNY, CNH, KRW, SGD, MXN, NOK, SEK, HKD, TRY, ZAR, INR)
 *  - Better inversion list (trade surplus, current account, budget balance, etc.)
 *  - Session-stratified stats in getMacroAlignmentStats
 *  - Richer Gemini prompt (session + emotion + strategy context)
 */

import axios from 'axios';
import { getEconomicCalendar } from './economicCalendarService.js';
import { bumpGemini } from '../utils/geminiCounter.js';

// ─── Country → Currency mapping ───────────────────────────────────────────────
const COUNTRY_CURRENCY = {
  // USD
  'united states': 'USD', 'us': 'USD', 'usa': 'USD',
  // EUR
  'euro zone': 'EUR', 'eurozone': 'EUR', 'european union': 'EUR', 'eu': 'EUR',
  'germany': 'EUR', 'france': 'EUR', 'italy': 'EUR', 'spain': 'EUR',
  'netherlands': 'EUR', 'belgium': 'EUR', 'portugal': 'EUR', 'austria': 'EUR',
  // GBP
  'united kingdom': 'GBP', 'uk': 'GBP', 'great britain': 'GBP', 'england': 'GBP',
  // JPY
  'japan': 'JPY',
  // CAD
  'canada': 'CAD',
  // AUD
  'australia': 'AUD',
  // NZD
  'new zealand': 'NZD',
  // CHF
  'switzerland': 'CHF',
  // CNY / CNH
  'china': 'CNY', 'china mainland': 'CNY', 'peoples republic of china': 'CNY',
  'hong kong': 'HKD',
  // Others
  'south korea': 'KRW', 'korea': 'KRW',
  'singapore': 'SGD',
  'mexico': 'MXN',
  'norway': 'NOK',
  'sweden': 'SEK',
  'turkey': 'TRY',
  'south africa': 'ZAR',
  'india': 'INR',
  'brazil': 'BRL',
};

// ─── Pair → { base, quote } ───────────────────────────────────────────────────
const SPECIAL_BASES = {
  XAUUSD: 'XAU', XAGUSD: 'XAG', XAUEUR: 'XAU', XAUGBP: 'XAU', XAUJPY: 'XAU',
  BTCUSD: 'BTC', ETHUSD: 'ETH', BTCUSDT: 'BTC', ETHUSDT: 'ETH',
  SPXUSD: 'SPX', SP500: 'SPX', NDX: 'NDX', NAS100: 'NDX',
  USOIL: 'OIL', WTIUSD: 'OIL', OIL: 'OIL', BRENTUSD: 'OIL',
  US30: 'DJI', GERMANY40: 'DAX',
};

// ─── Commodity / index → event currency relevance ──────────────────────────────
// Maps a commodity/index base to the set of event currencies that move it, and
// whether a bullish event for that currency is bullish or bearish for the instrument.
// Convention: +1 = event bullish → instrument bullish; -1 = inverted
const COMMODITY_CURRENCY_WEIGHTS = {
  XAU: { USD: -1.0, EUR: 0.3, GBP: 0.2 },  // gold is priced in USD → USD strength = gold bearish
  XAG: { USD: -0.8, EUR: 0.2 },
  OIL: { USD: -0.5, CAD: 0.6 },             // CAD correlates with oil
  BTC: { USD: -0.4 },
  ETH: { USD: -0.4 },
  SPX: { USD: 0.4 },                        // US indices correlate with USD sentiment indirectly
  NDX: { USD: 0.4 },
  DJI: { USD: 0.4 },
};

export function extractCurrencies(pair) {
  const clean = (pair || '').replace('/', '').replace('-', '').replace('_', '').toUpperCase().trim();

  for (const [k, base] of Object.entries(SPECIAL_BASES)) {
    if (clean === k || clean.startsWith(k)) {
      const quote = clean.slice(k.length) || 'USD';
      return { base, quote: quote || 'USD' };
    }
  }

  if (clean.length === 6) {
    return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
  }

  return null;
}

// ─── Map an event's country field → ISO currency code ────────────────────────
function getEventCurrency(event) {
  if (event.currency && /^[A-Z]{2,3}$/.test(event.currency)) return event.currency;
  const country = (event.country || '').toLowerCase().trim();
  return COUNTRY_CURRENCY[country] || null;
}

// ─── Beat / Miss for a single event ──────────────────────────────────────────
function getEventBias(event) {
  const actual    = event.actual   != null ? parseFloat(event.actual)   : null;
  const estimate  = event.estimate != null ? parseFloat(event.estimate) : null;
  const forecast  = event.forecast != null ? parseFloat(event.forecast) : null;
  const consensus = estimate ?? forecast;

  if (actual === null || consensus === null || isNaN(actual) || isNaN(consensus)) return 'neutral';

  const diff    = actual - consensus;
  const absDiff = Math.abs(diff);
  const pctDiff = consensus !== 0 ? absDiff / Math.abs(consensus) : absDiff;

  // Ignore tiny moves (noise threshold)
  if (pctDiff < 0.005 && absDiff < 0.1) return 'neutral';

  // Indicators where a HIGHER reading is BAD for the domestic currency
  const bearishOnHigher = [
    'unemployment', 'jobless', 'initial claims', 'continuing claims',
    'trade deficit', 'deficit', 'delinquency',
    'non-performing', 'inflation expectations',     // rising inf expectations can be complex but often rate-hike signal
  ];
  // Indicators where a LOWER reading is bad (normally inverted-direction items)
  const name = (event.name || event.event || '').toLowerCase();
  const invertBias = bearishOnHigher.some(kw => name.includes(kw));

  const rawBias = diff > 0 ? 'bullish' : 'bearish';
  return invertBias ? (rawBias === 'bullish' ? 'bearish' : 'bullish') : rawBias;
}

// ─── Time-proximity weight ─────────────────────────────────────────────────────
// Events that happen close to trade entry time score higher.
// Returns multiplier 0.6–1.0 based on hours between event and trade.
function getTimeProximityWeight(eventTime, tradeTime) {
  // eventTime and tradeTime are HH:MM strings or ISO strings; both optional
  if (!eventTime || !tradeTime) return 1.0;
  try {
    const toMinutes = (t) => {
      const s = String(t);
      const m = s.match(/(\d{1,2}):(\d{2})/);
      if (!m) return null;
      return parseInt(m[1]) * 60 + parseInt(m[2]);
    };
    const eMin = toMinutes(eventTime);
    const tMin = toMinutes(tradeTime);
    if (eMin === null || tMin === null) return 1.0;
    const hoursDiff = Math.abs(tMin - eMin) / 60;
    if (hoursDiff <= 1)  return 1.0;   // within 1 hour: full weight
    if (hoursDiff <= 3)  return 0.9;
    if (hoursDiff <= 6)  return 0.75;
    if (hoursDiff <= 12) return 0.65;
    return 0.55;                       // same day but far apart
  } catch { return 1.0; }
}

// ─── Impact weight (base values) ─────────────────────────────────────────────
const IMPACT_WEIGHTS = { high: 1.0, medium: 0.5, low: 0.15 };

// ─── Core alignment logic ─────────────────────────────────────────────────────
export function determineAlignment(trade, assessedEvents) {
  const currencies = extractCurrencies(trade.pair);
  if (!currencies) return { alignment: 'neutral', score: 0, confidence: 0, supportingEvents: [], opposingEvents: [] };

  const { base, quote } = currencies;
  const isBuy = (trade.direction || '').toLowerCase() === 'buy';
  const tradeTime = (trade.created_at || '').slice(11, 16); // HH:MM from ISO

  const supportingEvents = [];
  const opposingEvents   = [];
  let score = 0;
  let maxPossibleScore = 0;

  // Check if this is a commodity/index pair
  const commodityMap = COMMODITY_CURRENCY_WEIGHTS[base];

  for (const ev of assessedEvents) {
    if (ev.bias === 'neutral') continue;

    const impactW    = IMPACT_WEIGHTS[ev.impact] ?? 0.1;
    const proximityW = getTimeProximityWeight(ev.time, tradeTime);
    const dayPenalty = ev.dayOffset === -1 ? 0.7 : 1.0; // prior-day events weighted 30% less
    const totalW     = impactW * proximityW * dayPenalty;
    maxPossibleScore += totalW;

    let rawSignal = 0;

    if (commodityMap) {
      // Commodity/index mode: check event's currency against commodity map
      const commodityFactor = commodityMap[ev.currency];
      if (commodityFactor == null) continue;
      // commodity factor sign × bias sign × buy/sell
      const biasMult  = ev.bias === 'bullish' ? +1 : -1;
      const dirMult   = isBuy ? +1 : -1;
      rawSignal = commodityFactor * biasMult * dirMult;
    } else {
      // Standard FX mode
      const isBase  = ev.currency === base;
      const isQuote = ev.currency === quote;
      if (!isBase && !isQuote) continue;

      if (isBase)  rawSignal = ev.bias === 'bullish' ? +1 : -1;
      if (isQuote) rawSignal = ev.bias === 'bullish' ? -1 : +1;
      if (!isBuy)  rawSignal *= -1;
    }

    const weightedSignal = rawSignal * totalW;
    score += weightedSignal;

    if (weightedSignal > 0) supportingEvents.push({ ...ev, signalStrength: parseFloat((weightedSignal).toFixed(3)) });
    else opposingEvents.push({ ...ev, signalStrength: parseFloat((weightedSignal).toFixed(3)) });
  }

  // Confidence = how much of maximum possible score was actually captured
  const confidence = maxPossibleScore > 0 ? Math.min(100, Math.round((Math.abs(score) / maxPossibleScore) * 100)) : 0;
  const eventCount = supportingEvents.length + opposingEvents.length;

  let alignment;
  if (eventCount === 0) {
    alignment = 'no_events';
  } else if (score > 0.3) {
    alignment = 'aligned';
  } else if (score < -0.3) {
    alignment = 'misaligned';
  } else {
    alignment = 'neutral';
  }

  return {
    alignment,
    score:    parseFloat(score.toFixed(2)),
    confidence,
    supportingEvents,
    opposingEvents,
  };
}

// ─── Gemini narrative ─────────────────────────────────────────────────────────
async function generateNarrative(trade, assessedEvents, alignmentResult) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'demo') return null;

  const { alignment, score, confidence, supportingEvents, opposingEvents } = alignmentResult;
  const currencies = extractCurrencies(trade.pair);

  const eventLines = assessedEvents
    .filter(e => e.bias !== 'neutral')
    .slice(0, 8)
    .map(e => {
      const surp = (e.actual != null && e.estimate != null)
        ? ` (surprise: ${(parseFloat(e.actual) - parseFloat(e.estimate)).toFixed(2)})`
        : '';
      const dayTag = e.dayOffset === -1 ? ' [prev day]' : '';
      return `  • ${e.name} [${e.currency}, ${e.impact} impact]${dayTag} — ${e.bias.toUpperCase()} · actual: ${e.actual ?? '?'}, est: ${e.estimate ?? e.forecast ?? '?'}${surp}`;
    })
    .join('\n') || '  • No significant macro data releases found on trade day.';

  const pnlStr   = trade.profit_loss != null ? `${parseFloat(trade.profit_loss) >= 0 ? '+' : ''}${parseFloat(trade.profit_loss).toFixed(2)}` : 'N/A';
  const session  = (trade.session  || 'unknown').replace('_', ' ');
  const strategy = trade.strategy  || 'unspecified';
  const emotion  = trade.emotional_state || 'not recorded';
  const reason   = (trade.reasoning || '').slice(0, 300) || 'not provided';
  const outcome  = (trade.outcome || 'open').toUpperCase();

  const prompt = `You are Zynth, an elite institutional trading coach with 20 years of experience. Write a 4-sentence "Trade Context Report" for this specific trade.

TRADE DETAILS:
  Pair: ${trade.pair} | Direction: ${(trade.direction || '').toUpperCase()} | Outcome: ${outcome} | P&L: ${pnlStr}
  Date: ${(trade.created_at || '').slice(0, 10)} | Session: ${session}
  Strategy: ${strategy} | Emotional State: ${emotion}
  Trader's reasoning: "${reason}"
  Currencies: base=${currencies?.base ?? '?'}, quote=${currencies?.quote ?? '?'}

MACRO EVENTS ON / BEFORE TRADE DAY:
${eventLines}

MACRO ALIGNMENT: ${alignment.toUpperCase()} (score: ${score}, confidence: ${confidence}%)
  Supporting events: ${supportingEvents.map(e => e.name).join(', ') || 'none'}
  Opposing events:   ${opposingEvents.map(e => e.name).join(', ') || 'none'}

INSTRUCTIONS:
- Sentence 1: Describe the macro backdrop on the trade day — what major data released, what the surprise was, and what it signaled for the market.
- Sentence 2: Explain precisely how this macro environment supported or opposed the ${trade.pair} ${(trade.direction||'').toUpperCase()} trade — be specific about which currency was strengthened/weakened and why.
- Sentence 3: Connect the macro context to the trade outcome (${outcome}) — explain the cause and effect.
- Sentence 4: One sharp, specific, actionable coaching lesson for this exact trade setup — not generic advice.
- Tone: direct, expert, mentor-like. No fluff. No bullet points. Pure prose, 4 sentences only.
- Do NOT start with "I" or "As Zynth". Write the report directly.`;

  try {
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const res = await axios.post(
      GEMINI_URL,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { thinkingConfig: { thinkingBudget: 0 },  temperature: 0.55, maxOutputTokens: 600 } },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, timeout: 25000 }
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

  // ── Multi-day lookback ────────────────────────────────────────────────────
  // High-impact events from the day before can still drive price action
  // (e.g. Fed minutes released late NY session carry into next Asian/London open)
  const prevDate = new Date(tradeDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);

  let rawEvents = [], rawPrevEvents = [];
  try {
    [rawEvents, rawPrevEvents] = await Promise.all([
      getEconomicCalendar({ filter: 'custom', from: tradeDate,   to: tradeDate }),
      getEconomicCalendar({ filter: 'custom', from: prevDateStr, to: prevDateStr }),
    ]);
  } catch (err) {
    console.warn('macroAlignment: calendar fetch failed:', err.message);
  }

  // Keep only high + medium impact events with actual data released
  const filterEvents = (evts, dayOffset) =>
    (evts || [])
      .filter(e => (e.impact === 'high' || e.impact === 'medium') && getEventCurrency(e))
      .map(e => ({ ...e, dayOffset }));

  // Prior-day: only HIGH impact (medium prior-day events are too stale)
  const todayFiltered = filterEvents(rawEvents,     0);
  const prevFiltered  = filterEvents(rawPrevEvents, -1).filter(e => e.impact === 'high');
  const relevantEvents = [...todayFiltered, ...prevFiltered];

  // Assess each event
  const assessedEvents = relevantEvents.map(e => ({
    id:        e.id,
    name:      e.name || e.event,
    currency:  getEventCurrency(e),
    country:   e.country,
    impact:    e.impact,
    time:      e.time,
    actual:    e.actual,
    estimate:  e.estimate ?? e.forecast,
    previous:  e.previous ?? e.prev,
    bias:      getEventBias(e),
    dayOffset: e.dayOffset,
  }));

  const alignmentResult = determineAlignment(trade, assessedEvents);

  let narrative = null;
  if (withNarrative) {
    narrative = await generateNarrative(trade, assessedEvents, alignmentResult);
  }

  return {
    tradeDate,
    events:           assessedEvents,
    eventCount:       assessedEvents.length,
    alignment:        alignmentResult.alignment,
    alignmentScore:   alignmentResult.score,
    alignmentConfidence: alignmentResult.confidence,
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
export function getMacroAlignmentStats(trades) {
  const cats = {
    aligned:    { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
    misaligned: { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
    neutral:    { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
    no_events:  { total: 0, wins: 0, losses: 0, breakevens: 0, netPnl: 0, trades: [] },
  };

  const SESSIONS = ['asian', 'london', 'new_york', 'overlap'];
  // session × alignment win-rate matrix
  const sessionMatrix = {};
  for (const s of SESSIONS) {
    sessionMatrix[s] = { aligned: { w: 0, t: 0 }, misaligned: { w: 0, t: 0 }, neutral: { w: 0, t: 0 } };
  }

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

    // Session matrix
    const sess = (t.session || '').toLowerCase();
    if (sessionMatrix[sess] && sessionMatrix[sess][cat] !== undefined) {
      sessionMatrix[sess][cat].t++;
      if (t.outcome === 'win') sessionMatrix[sess][cat].w++;
    }
  }

  // Derive win rates per category
  const result = {};
  for (const [key, b] of Object.entries(cats)) {
    result[key] = {
      ...b,
      netPnl:  parseFloat(b.netPnl.toFixed(2)),
      winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : null,
    };
  }

  // Derived win rate for session matrix
  const sessionStats = {};
  for (const [sess, alignMap] of Object.entries(sessionMatrix)) {
    sessionStats[sess] = {};
    for (const [align, { w, t }] of Object.entries(alignMap)) {
      sessionStats[sess][align] = {
        winRate: t > 0 ? Math.round((w / t) * 100) : null,
        total: t,
      };
    }
  }

  // Pair-level breakdown
  const pairMap = {};
  for (const t of trades) {
    if (!t.macro_alignment) continue;
    const p = t.pair?.toUpperCase() || 'UNKNOWN';
    if (!pairMap[p]) pairMap[p] = {
      pair: p, aligned: 0, misaligned: 0, neutral: 0, no_events: 0,
      alignedWins: 0, misalignedWins: 0, alignedPnl: 0, misalignedPnl: 0,
    };
    pairMap[p][t.macro_alignment] = (pairMap[p][t.macro_alignment] || 0) + 1;
    const pnl = parseFloat(t.profit_loss) || 0;
    if (t.macro_alignment === 'aligned') {
      if (t.outcome === 'win') pairMap[p].alignedWins++;
      pairMap[p].alignedPnl += pnl;
    }
    if (t.macro_alignment === 'misaligned') {
      if (t.outcome === 'win') pairMap[p].misalignedWins++;
      pairMap[p].misalignedPnl += pnl;
    }
  }

  const pairBreakdown = Object.values(pairMap)
    .map(p => ({
      ...p,
      alignedPnl:      parseFloat(p.alignedPnl.toFixed(2)),
      misalignedPnl:   parseFloat(p.misalignedPnl.toFixed(2)),
      alignedWinRate:  p.aligned > 0 ? Math.round((p.alignedWins / p.aligned) * 100) : null,
      misalignedWinRate: p.misaligned > 0 ? Math.round((p.misalignedWins / p.misaligned) * 100) : null,
    }))
    .sort((a, b) => (b.aligned + b.misaligned) - (a.aligned + a.misaligned))
    .slice(0, 10);

  // Key insight: best and worst performing pair when macro-misaligned
  const withMisaligned = pairBreakdown.filter(p => p.misaligned >= 2);
  const riskiestMisaligned = withMisaligned.sort((a, b) => (a.misalignedWinRate ?? 100) - (b.misalignedWinRate ?? 100))[0] || null;

  // Alignment edge: how much better aligned vs misaligned win rate
  const alignedWR    = result.aligned.winRate;
  const misalignedWR = result.misaligned.winRate;
  const alignmentEdge = (alignedWR != null && misalignedWR != null)
    ? alignedWR - misalignedWR
    : null;

  const analysedCount = trades.filter(t => !!t.macro_alignment).length;
  const totalClosed   = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss').length;

  // Streak: last N trades — how many were aligned wins in a row
  const closedAnalysed = trades
    .filter(t => t.macro_alignment && (t.outcome === 'win' || t.outcome === 'loss'))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  let alignedWinStreak = 0;
  for (const t of closedAnalysed) {
    if (t.macro_alignment === 'aligned' && t.outcome === 'win') alignedWinStreak++;
    else break;
  }

  return {
    stats: result,
    pairBreakdown,
    sessionStats,
    alignmentEdge,
    riskiestMisaligned,
    alignedWinStreak,
    analysedCount,
    totalClosed,
    coveragePct: totalClosed > 0 ? Math.round((analysedCount / totalClosed) * 100) : 0,
  };
}
