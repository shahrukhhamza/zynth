/**
 * Economic Calendar Service — Finnhub powered
 *
 * Uses Finnhub's /calendar/economic endpoint which provides:
 * - Upcoming events with scheduled release times
 * - Forecast values (analyst consensus)
 * - Actual values (filled in after release)
 * - All major currencies
 *
 * Cache: 15 minutes (short enough to catch same-day releases)
 */

import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 min cache

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

// Impact mapping based on event name keywords
function guessImpact(eventName) {
  const name = (eventName || '').toLowerCase();
  const high = [
    'nonfarm', 'non-farm', 'payroll', 'unemployment', 'cpi', 'inflation',
    'fed ', 'fomc', 'interest rate', 'gdp', 'pce', 'retail sales',
    'ppi', 'jobless claims', 'ism manufacturing', 'ism services',
    'consumer confidence', 'durable goods', 'trade balance', 'building permits',
    'housing starts', 'core cpi', 'core pce',
  ];
  const medium = [
    'pmi', 'industrial production', 'capacity utilization', 'empire state',
    'philly fed', 'chicago pmi', 'existing home', 'new home', 'pending home',
    'consumer sentiment', 'michigan', 'eia', 'crude oil', 'natural gas',
    'leading index', 'import price', 'export price', 'productivity',
  ];
  if (high.some(k => name.includes(k)))   return 'high';
  if (medium.some(k => name.includes(k))) return 'medium';
  return 'low';
}

async function fetchFromFMP(from, to) {
  const key = process.env.FMP_API_KEY1 || process.env.FMP_API_KEY;
  if (!key) throw new Error('FMP_API_KEY not configured');

  const res = await axios.get(
    'https://financialmodelingprep.com/api/v3/economic_calendar',
    {
      params: { from, to, apikey: key },
      timeout: 10000,
    }
  );

  return Array.isArray(res.data) ? res.data : [];
}

async function fetchFromFinnhub(from, to) {
  if (!FINNHUB_KEY) throw new Error('FINNHUB_API_KEY not configured');

  const res = await axios.get('https://finnhub.io/api/v1/calendar/economic', {
    params: { from, to, token: FINNHUB_KEY },
    timeout: 10000,
  });

  return res.data?.economicCalendar ?? [];
}

function normalizeFMP(raw) {
  return raw.map(e => ({
    id:       `${(e.event ?? '').replace(/\s+/g, '_').toLowerCase()}_${e.date ?? ''}`,
    event:    e.event    ?? '',
    name:     e.event    ?? '',
    currency: (e.country ?? 'US') === 'US' ? 'USD'
      : (e.country ?? '').toUpperCase(),
    country:  e.country  ?? 'US',
    impact:   (e.impact  ?? '').toLowerCase(),
    time:     e.date     ?? '',
    date:     (e.date    ?? '').split(' ')[0],
    actual:   e.actual   ?? null,
    estimate: e.estimate ?? null,
    forecast: e.estimate ?? null,
    prev:     e.previous ?? null,
    previous: e.previous ?? null,
    unit:     e.unit     ?? '',
    change:   e.change   ?? null,
  }));
}

function normalizeFinnnhub(raw) {
  return raw.map(e => ({
    id:       `${(e.event ?? '').replace(/\s+/g, '_').toLowerCase()}_${e.time ?? e.date ?? ''}`,
    event:    e.event    ?? '',
    name:     e.event    ?? '',
    currency: (e.country ?? 'USD'),
    country:  e.country  ?? 'US',
    impact:   guessImpact(e.event),
    time:     e.time     ?? '',
    date:     (e.time ?? '').split('T')[0] || (e.date ?? ''),
    actual:   e.actual   ?? null,
    estimate: e.estimate ?? null,
    forecast: e.estimate ?? null,
    prev:     e.prev     ?? null,
    previous: e.prev     ?? null,
    unit:     e.unit     ?? '',
    change:   null,
  }));
}

/**
 * Format date as YYYY-MM-DD
 */
function toISO(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for a given filter
 */
function getRange(filter = 'week') {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') {
    return { from: toISO(today), to: toISO(today) };
  }

  if (filter === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return { from: toISO(t), to: toISO(t) };
  }

  if (filter === 'next_week') {
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: toISO(mon), to: toISO(sun) };
  }

  // Default: this week (Mon–Sun)
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: toISO(mon), to: toISO(sun) };
}

/**
 * Main function: get economic calendar
 * Accepts optional { from, to } date strings or a filter string
 */
async function getEconomicCalendar(options = {}) {
  try {
    // Build date range
    let from, to;
    if (options.from && options.to) {
      from = options.from;
      to   = options.to;
    } else {
      const range = getRange(options.filter ?? 'week');
      from = range.from;
      to   = range.to;
    }

    const cacheKey = `calendar_${from}_${to}`;
    const cached   = cache.get(cacheKey);
    if (cached) {
      console.log(`✓ Calendar cache hit: ${from} → ${to}`);
      return cached;
    }

    let events;
    try {
      console.log(`📅 Fetching FMP calendar: ${from} → ${to}`);
      const raw = await fetchFromFMP(from, to);
      events = normalizeFMP(raw);
      console.log(`✅ FMP calendar: ${events.length} events (${from} → ${to})`);
    } catch (fmpErr) {
      const fmpStatus = fmpErr?.response?.status;
      const fmpDetail = fmpErr?.response?.data?.['Error Message'] ?? fmpErr?.response?.data ?? '';
      console.warn(`⚠️  FMP failed [${fmpStatus ?? fmpErr.message}] ${JSON.stringify(fmpDetail)}, falling back to Finnhub`);
      if (!FINNHUB_KEY) {
        console.error('✗ FINNHUB_API_KEY is not set — cannot fall back');
        return [];
      }
      const raw = await fetchFromFinnhub(from, to);
      events = normalizeFinnnhub(raw);
      console.log(`✅ Finnhub calendar: ${events.length} events (${from} → ${to})`);
    }

    // Sort by time ascending
    events.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(a.time) - new Date(b.time);
    });

    cache.set(cacheKey, events);
    return events;

  } catch (error) {
    console.error('✗ Calendar service error:', error.message);
    // Return empty array — don't crash, let frontend show empty state
    return [];
  }
}

/**
 * Get details for a single indicator
 */
async function getIndicatorDetails(indicatorId) {
  const calendar = await getEconomicCalendar();
  const indicator = calendar.find(e => e.id === indicatorId);
  if (!indicator) throw new Error('Indicator not found');
  return indicator;
}

/**
 * Force clear cache
 */
async function forceRefreshCalendar() {
  cache.flushAll();
  console.log('🔄 Calendar cache cleared');
  const data = await getEconomicCalendar();
  return { indicators: data, fetchedAt: new Date().toISOString() };
}

export {
  getEconomicCalendar,
  getIndicatorDetails,
  forceRefreshCalendar,
};
