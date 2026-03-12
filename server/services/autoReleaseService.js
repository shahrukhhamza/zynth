/**
 * Auto Release Service
 *
 * Watches known US economic release schedules via node-cron.
 * When a release window fires:
 *   1. Queries Gemini (gemini-2.0-flash with google_search grounding) for the
 *      latest actual/forecast/previous value.
 *   2. Validates the returned data.
 *   3. Updates server/config/economicData.js in-place (text manipulation).
 *   4. Clears the relevant NodeCache keys so the next API request rebuilds
 *      fresh data.
 *   5. Broadcasts { type: 'economic_update', indicator, ts } to all WebSocket
 *      clients.
 *
 * NOTE: This service uses the Gemini REST API directly (same pattern as the
 * rest of the codebase). @google/generative-ai SDK is NOT used.
 *
 * Usage from server.js:
 *   import { startAutoReleaseScheduler } from './services/autoReleaseService.js';
 *   startAutoReleaseScheduler(economicCache, wss);
 */

import cron         from 'node-cron';
import axios        from 'axios';
import fs           from 'fs';
import path         from 'path';
import EventEmitter from 'events';
import { fileURLToPath } from 'url';
import { cache } from './economicIntelligenceService.js';

const __filename         = fileURLToPath(import.meta.url);
const __dirname          = path.dirname(__filename);
const ECONOMIC_DATA_PATH = path.resolve(__dirname, '../config/economicData.js');

// ─── Cache key map ────────────────────────────────────────────────────────────
// Maps indicator id → the NodeCache key used in economicIntelligenceService.js.
// Cleared on update so the next request fetches fresh data.
const CACHE_KEY_MAP = {
  nfp:                 'nfp_analysis',
  cpi:                 'cpi_analysis',
  core_cpi:            'core_cpi_analysis',
  unemployment:        'unemployment_analysis',
  gdp:                 'gdp_analysis',
  core_pce:            'core_pce_analysis',
  ppi:                 'ppi_analysis',
  retail_sales:        'retail_sales_analysis',
  ism_manufacturing:   'ism_manufacturing_analysis',
  ism_services:        'ism_services_analysis',
  jobless_claims:      'jobless_claims_analysis',
  consumer_confidence: 'consumer_confidence_analysis',
  durable_goods:       'durable_goods_analysis',
  trade_balance:       'trade_balance_analysis',
  building_permits:    'building_permits_analysis',
};

// ─── Nth-weekday helpers ──────────────────────────────────────────────────────

/** Returns which occurrence (1st=1, 2nd=2 …) of its weekday this date is in the month. */
function nthWeekday(d) { return Math.ceil(d.getDate() / 7); }

function isFirstWeekday(d)  { return nthWeekday(d) === 1; }
function isSecondWeekday(d) { return nthWeekday(d) === 2; }
function isThirdWeekday(d)  { return nthWeekday(d) === 3; }
function isFourthWeekday(d) { return nthWeekday(d) === 4; }

/** True when there is no further occurrence of this weekday in the same month. */
function isLastWeekday(d) {
  const next = new Date(d);
  next.setDate(d.getDate() + 7);
  return next.getMonth() !== d.getMonth();
}

// ─── Release schedule ─────────────────────────────────────────────────────────
// cron expressions use America/New_York timezone (handled by the scheduler).
// check() receives the current Date and returns true only on the correct
// occurrence, so crons that fire every week can self-filter.

const RELEASE_SCHEDULE = [
  // ── Friday releases ──────────────────────────────────────────────────────
  {
    indicatorId: 'nfp',
    name:        'Non-Farm Payrolls',
    unit:        'K',
    cron:        '30 8 * * 5',    // every Friday 08:30 ET
    check:       isFirstWeekday,  // first Friday of month
    label:       'NFP (1st Friday)',
  },
  {
    indicatorId: 'unemployment',
    name:        'Unemployment Rate',
    unit:        '%',
    cron:        '30 8 * * 5',    // every Friday 08:30 ET
    check:       isFirstWeekday,  // same release as NFP
    label:       'Unemployment Rate (1st Friday)',
  },
  {
    indicatorId: 'core_pce',
    name:        'Core PCE Price Index m/m',
    unit:        '%',
    cron:        '30 8 * * 5',    // every Friday 08:30 ET
    check:       isLastWeekday,   // last Friday of month
    label:       'Core PCE (last Friday)',
  },

  // ── Wednesday releases ───────────────────────────────────────────────────
  {
    indicatorId: 'cpi',
    name:        'Consumer Price Index m/m',
    unit:        '%',
    cron:        '30 8 * * 3',     // every Wednesday 08:30 ET
    check:       isSecondWeekday,  // second Wednesday
    label:       'CPI (2nd Wednesday)',
  },
  {
    indicatorId: 'core_cpi',
    name:        'Core CPI m/m',
    unit:        '%',
    cron:        '30 8 * * 3',     // every Wednesday 08:30 ET
    check:       isSecondWeekday,
    label:       'Core CPI (2nd Wednesday)',
  },
  {
    indicatorId: 'gdp',
    name:        'GDP q/q (Advance)',
    unit:        '%',
    cron:        '30 8 * * 3',     // every Wednesday 08:30 ET
    check:       isLastWeekday,    // last Wednesday
    label:       'GDP (last Wednesday)',
  },
  {
    indicatorId: 'retail_sales',
    name:        'Retail Sales m/m',
    unit:        '%',
    cron:        '30 8 * * 3',     // every Wednesday 08:30 ET
    check:       isThirdWeekday,   // third Wednesday
    label:       'Retail Sales (3rd Wednesday)',
  },
  {
    indicatorId: 'building_permits',
    name:        'Building Permits',
    unit:        'M',
    cron:        '30 8 * * 3',     // every Wednesday 08:30 ET
    check:       isThirdWeekday,
    label:       'Building Permits (3rd Wednesday)',
  },
  {
    indicatorId: 'trade_balance',
    name:        'Trade Balance',
    unit:        'B',
    cron:        '30 8 * * 3',     // every Wednesday 08:30 ET
    check:       isFirstWeekday,   // first Wednesday
    label:       'Trade Balance (1st Wednesday)',
  },
  {
    indicatorId: 'ism_services',
    name:        'ISM Services PMI',
    unit:        '',
    cron:        '0 10 * * 3',     // every Wednesday 10:00 ET
    check:       isFirstWeekday,
    label:       'ISM Services (1st Wednesday)',
  },

  // ── Thursday releases ────────────────────────────────────────────────────
  {
    indicatorId: 'ppi',
    name:        'PPI m/m',
    unit:        '%',
    cron:        '30 8 * * 4',     // every Thursday 08:30 ET
    check:       isSecondWeekday,  // second Thursday
    label:       'PPI (2nd Thursday)',
  },
  {
    indicatorId: 'jobless_claims',
    name:        'Initial Jobless Claims',
    unit:        'K',
    cron:        '30 8 * * 4',     // every Thursday 08:30 ET
    check:       () => true,       // every Thursday
    label:       'Initial Jobless Claims (every Thursday)',
  },
  {
    indicatorId: 'durable_goods',
    name:        'Durable Goods Orders m/m',
    unit:        '%',
    cron:        '30 8 * * 4',     // every Thursday 08:30 ET
    check:       isFourthWeekday,  // fourth Thursday
    label:       'Durable Goods (4th Thursday)',
  },

  // ── Monday release ───────────────────────────────────────────────────────
  {
    indicatorId: 'ism_manufacturing',
    name:        'ISM Manufacturing PMI',
    unit:        '',
    cron:        '0 10 * * 1',     // every Monday 10:00 ET
    check:       isFirstWeekday,   // first Monday
    label:       'ISM Manufacturing (1st Monday)',
  },

  // ── Tuesday release ──────────────────────────────────────────────────────
  {
    indicatorId: 'consumer_confidence',
    name:        'CB Consumer Confidence',
    unit:        '',
    cron:        '0 10 * * 2',     // every Tuesday 10:00 ET
    check:       isLastWeekday,    // last Tuesday
    label:       'Consumer Confidence (last Tuesday)',
  },
];

// ─── Gemini fetch (with web-search grounding) ─────────────────────────────────

// Model priority list — same pattern as geminiWebSearchService.js
const GEMINI_MODELS = [
  {
    id:   'gemini-2.0-flash',
    tool: { google_search: {} },
  },
  {
    id:   'gemini-1.5-flash-latest',
    tool: {
      google_search_retrieval: {
        dynamic_retrieval_config: { mode: 'MODE_DYNAMIC', dynamic_threshold: 0.0 },
      },
    },
  },
];

/**
 * Query Gemini (with Google Search grounding) for the latest released value
 * of a US economic indicator.
 *
 * @param {string} indicatorId   - e.g. 'nfp'
 * @param {string} indicatorName - human name, e.g. 'Non-Farm Payrolls'
 * @param {string} unit          - e.g. 'K', '%', 'B', ''
 * @returns {{ actual: number, forecast: number, previous: number, date: string }|null}
 */
export async function fetchLatestRelease(indicatorId, indicatorName, unit) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'demo' || apiKey === 'your_gemini_api_key_here') {
    console.warn(`⚠️  autoRelease: GEMINI_API_KEY not configured — skipping ${indicatorName}`);
    return null;
  }

  const now      = new Date();
  const monthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const prompt =
    `Search the web for the most recent official release of the ${indicatorName} US economic indicator ` +
    `in ${monthStr}. ` +
    `Return ONLY a JSON object with these exact fields (no markdown, no explanation): ` +
    `{ "actual": <number>, "forecast": <number>, "previous": <number>, "date": "<YYYY-MM-DD>" }`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`;

      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [model.tool],
        generationConfig: {
          temperature:    0.05,
          maxOutputTokens: 256,
        },
      };

      const resp = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000,
      });

      const raw = resp.data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || '').join('') ?? '';

      // Strip markdown fences Gemini sometimes adds
      const cleaned = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
      const match   = cleaned.match(/\{[\s\S]*?\}/);
      if (!match) throw new Error('No JSON object found in Gemini response');

      const parsed = JSON.parse(match[0]);
      console.log(`✅ autoRelease (${model.id}): ${indicatorName} → ${JSON.stringify(parsed)}`);
      return parsed;

    } catch (err) {
      console.warn(`  ⚠️  autoRelease model ${model.id} failed for ${indicatorName}: ${err.message}`);
      lastError = err;
    }
  }

  console.error(`❌ autoRelease: all Gemini models failed for ${indicatorName} — ${lastError?.message}`);
  return null;
}

// ─── Config file updater ──────────────────────────────────────────────────────

/**
 * Update an indicator's current/forecast/previous/date fields in economicData.js
 * and prepend a new entry to its historicalData array.
 * Operates on the raw file text — no eval, no dynamic import.
 *
 * @param {string} indicatorId
 * @param {{ actual: number, forecast: number, previous: number, date: string }} newData
 * @returns {boolean}
 */
export async function updateIndicatorInConfig(indicatorId, newData) {
  try {
    let text = fs.readFileSync(ECONOMIC_DATA_PATH, 'utf8');

    // 1) Find the indicator block by its id field
    const idPattern = new RegExp(`id:\\s*'${indicatorId}'`);
    const idMatch   = idPattern.exec(text);
    if (!idMatch) {
      console.error(`❌ autoRelease: id '${indicatorId}' not found in economicData.js`);
      return false;
    }

    // 2) Isolate the entire object that contains this indicator.
    //    Walk back to the opening { then forward counting brace depth.
    const openBrace = text.lastIndexOf('{', idMatch.index);
    let depth   = 0;
    let blockEnd = openBrace;
    for (let i = openBrace; i < text.length; i++) {
      if      (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) { blockEnd = i; break; }
      }
    }

    let block = text.slice(openBrace, blockEnd + 1);

    // 3) Replace scalar top-level fields within the block
    const replaceField = (fieldName, newValue) => {
      const formatted = typeof newValue === 'string' ? `'${newValue}'` : String(newValue);
      block = block.replace(
        new RegExp(`(\\b${fieldName}:\\s*)([^,\\n]+)`),
        `$1${formatted}`
      );
    };

    replaceField('current',  newData.actual);
    replaceField('forecast', newData.forecast);
    replaceField('previous', newData.previous);
    replaceField('date',     newData.date);

    // 4) Prepend new entry to historicalData array
    const histMatch = /historicalData:\s*\[/.exec(block);
    if (histMatch) {
      const insertPos = histMatch.index + histMatch[0].length;
      const entry =
        `\n        { date: '${newData.date}', actual: ${newData.actual}, ` +
        `forecast: ${newData.forecast}, previous: ${newData.previous} },`;
      block = block.slice(0, insertPos) + entry + block.slice(insertPos);
    }

    // 5) Splice updated block back into the full file text
    text = text.slice(0, openBrace) + block + text.slice(blockEnd + 1);
    fs.writeFileSync(ECONOMIC_DATA_PATH, text, 'utf8');

    console.log(`✅ autoRelease: economicData.js updated — '${indicatorId}' actual=${newData.actual}, date=${newData.date}`);
    return true;

  } catch (err) {
    console.error(`❌ autoRelease: config update failed for '${indicatorId}': ${err.message}`);
    return false;
  }
}

// ─── Event emitter ────────────────────────────────────────────────────────────

/** Emits 'data_updated' with { indicatorId, data } after a successful update. */
export const releaseEvents = new EventEmitter();

// ─── Core check-and-update ────────────────────────────────────────────────────

/**
 * Fetch → validate → update config → clear cache → emit event.
 *
 * @param {string}    indicatorId
 * @param {string}    indicatorName
 * @param {string}    unit
 * @param {NodeCache} cache  - the NodeCache instance from economicIntelligenceService
 * @returns {boolean} true if all steps succeeded
 */
export async function checkAndUpdateRelease(indicatorId, indicatorName, unit) {
  console.log(`🔍 autoRelease: checking ${indicatorName} (${indicatorId})...`);

  const data = await fetchLatestRelease(indicatorId, indicatorName, unit);
  if (!data) {
    console.warn(`⚠️  autoRelease: no data returned for ${indicatorId} — skipping`);
    return false;
  }

  // Validate: actual must be a finite number
  if (typeof data.actual !== 'number' || !isFinite(data.actual)) {
    console.warn(`⚠️  autoRelease: invalid actual for ${indicatorId}: ${data.actual}`);
    return false;
  }

  // Validate: date must be YYYY-MM-DD
  if (typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    console.warn(`⚠️  autoRelease: invalid date for ${indicatorId}: ${data.date}`);
    return false;
  }

  // Validate: date must be within ±7 days of today
  const dayDiff = (new Date() - new Date(data.date)) / (1000 * 60 * 60 * 24);
  if (dayDiff > 7 || dayDiff < -1) {
    console.warn(`⚠️  autoRelease: date ${data.date} is ${Math.round(dayDiff)}d from today — skipping`);
    return false;
  }

  const updated = await updateIndicatorInConfig(indicatorId, data);
  if (!updated) return false;

  // Clear cache so next request rebuilds with new data
  const specificKey = CACHE_KEY_MAP[indicatorId];
  if (specificKey) cache.del(specificKey);
  cache.del('economic_dashboard');
  cache.del('macro_surprise_score');
  console.log(`🗑️  autoRelease: cache cleared — ${specificKey}, economic_dashboard, macro_surprise_score`);

  releaseEvents.emit('data_updated', { indicatorId, data });
  return true;
}

// ─── Scheduler startup ────────────────────────────────────────────────────────

/**
 * Register all cron jobs. Call once from server.js after the server is ready.
 *
 * @param {NodeCache}      cache - NodeCache instance from economicIntelligenceService
 * @param {WebSocketServer} wss  - the ws WebSocketServer instance
 */
export function startAutoReleaseScheduler(wss) {
  console.log('⏰ autoRelease: starting scheduler...');

  for (const entry of RELEASE_SCHEDULE) {
    cron.schedule(
      entry.cron,
      async () => {
        const now = new Date();

        // Self-filter: skip if this isn't the correct Nth occurrence
        if (!entry.check(now)) return;

        console.log(`⏰ autoRelease: cron fired → ${entry.label}`);

        // Random jitter 0–90 s so multiple indicators sharing the same cron
        // slot don't all hit Gemini simultaneously
        const jitter = Math.floor(Math.random() * 90_000);
        await new Promise(r => setTimeout(r, jitter));

        const success = await checkAndUpdateRelease(
          entry.indicatorId, entry.name, entry.unit
        );

        if (success && wss) {
          const msg = JSON.stringify({
            type:      'economic_update',
            indicator: entry.indicatorId,
            ts:        Date.now(),
          });
          wss.clients.forEach(client => {
            if (client.readyState === 1 /* WebSocket.OPEN */) client.send(msg);
          });
          console.log(`📡 autoRelease: WS broadcast sent for ${entry.indicatorId}`);
        }
      },
      { timezone: 'America/New_York' }
    );

    console.log(`  ✓ ${entry.label}  [${entry.cron}]`);
  }

  console.log(`⏰ autoRelease: scheduler ready — ${RELEASE_SCHEDULE.length} jobs registered`);
}

// ─── Manual trigger ───────────────────────────────────────────────────────────

/**
 * Force an immediate fetch-and-update cycle for any indicator.
 * Use via a REST endpoint for testing without waiting for the cron.
 *
 * @param {string}         indicatorId
 * @param {NodeCache}      cache
 * @param {WebSocketServer} wss
 * @returns {{ success: boolean, indicatorId: string, error?: string }}
 */
export async function manualTrigger(indicatorId, wss) {
  const entry = RELEASE_SCHEDULE.find(e => e.indicatorId === indicatorId);
  if (!entry) {
    return { success: false, indicatorId, error: `Unknown indicatorId: '${indicatorId}'` };
  }

  console.log(`🔧 autoRelease: manual trigger → ${entry.label}`);

  const success = await checkAndUpdateRelease(
    entry.indicatorId, entry.name, entry.unit
  );

  if (success && wss) {
    const msg = JSON.stringify({
      type:      'economic_update',
      indicator: indicatorId,
      ts:        Date.now(),
    });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg);
    });
  }

  return { success, indicatorId };
}
