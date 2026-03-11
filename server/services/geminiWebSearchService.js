/**
 * Gemini Web Search Service
 *
 * Uses Gemini 2.0 Flash with the google_search grounding tool so that
 * Gemini actually queries live web pages (BLS, Fed, Trading Economics,
 * Reuters, etc.) before answering — giving 100% up-to-date released values
 * instead of stale training-data guesses.
 *
 * Flow
 * ────
 * 1. callGeminiWithSearch()  — raw HTTP call to Gemini with google_search tool
 * 2. fetchLatestReleasedData() — main export: structured JSON for all key
 *    US economic indicators (NFP, CPI, PPI, Unemployment, Retail Sales,
 *    GDP, Fed Funds Rate, Average Hourly Earnings, Core CPI, PCE)
 * 3. crossVerifyIndicator()  — re-queries Gemini for a single indicator to
 *    confirm the first answer; detects mis-matches
 * 4. forceRefreshAllData()   — clears cache and re-fetches everything
 *    (called by the /api/calendar/refresh endpoint)
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Cache: 20 minutes  — fresh enough to catch post-release corrections
const cache = new NodeCache({ stdTTL: 1200 });

const GEMINI_API_KEY = () => process.env.GEMINI_API_KEY || '';

// We prefer gemini-2.0-flash (has native google_search tool).
// Falls back to gemini-1.5-flash with google_search_retrieval grounding.
const MODELS = [
  {
    id: 'gemini-2.0-flash',
    tool: { google_search: {} },
  },
  {
    id: 'gemini-1.5-flash',
    tool: {
      google_search_retrieval: {
        dynamic_retrieval_config: { mode: 'MODE_DYNAMIC', dynamic_threshold: 0.0 },
      },
    },
  },
];

/**
 * Low-level call to Gemini API with search grounding.
 * Returns the raw text response and any grounding metadata.
 */
async function callGeminiWithSearch(promptText, maxOutputTokens = 2048) {
  const key = GEMINI_API_KEY();
  if (!key || key === 'demo' || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured');
  }

  let lastError = null;

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${key}`;

      const body = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        tools: [model.tool],
        generationConfig: {
          temperature: 0.1,   // very low — we want facts, not creativity
          maxOutputTokens,
          responseMimeType: 'text/plain',
        },
      };

      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000,
      });

      const candidate = response.data?.candidates?.[0];
      if (!candidate) throw new Error('Empty candidate in Gemini response');

      const text = candidate.content?.parts?.map(p => p.text || '').join('') || '';
      const groundingMeta = candidate.groundingMetadata || null;
      const sources = extractSources(groundingMeta);

      console.log(`✅ Gemini (${model.id}) responded — ${text.length} chars, ${sources.length} sources`);

      return { text, sources, model: model.id };
    } catch (err) {
      console.warn(`⚠️  Gemini model ${model.id} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Extract grounding source URLs from Gemini metadata
 */
function extractSources(groundingMeta) {
  if (!groundingMeta) return [];
  const chunks = groundingMeta.groundingChunks || [];
  return chunks
    .map(c => ({
      title: c.web?.title || '',
      url: c.web?.uri || '',
    }))
    .filter(s => s.url);
}

/**
 * Parse JSON from a Gemini text response (handles markdown code blocks)
 */
function parseJsonFromText(text) {
  let clean = text.trim();

  // Strip markdown fences
  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) clean = fenced[1].trim();

  // Find first { ... } block
  const braceStart = clean.indexOf('{');
  const braceEnd = clean.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1) {
    clean = clean.slice(braceStart, braceEnd + 1);
  }

  return JSON.parse(clean);
}

/**
 * Build the main web-search prompt.
 * We ask Gemini to search the web and return a strict JSON object.
 */
function buildDataPrompt() {
  const today = new Date().toISOString().split('T')[0];

  return `Today is ${today}.

Use Google Search to find the LATEST OFFICIALLY RELEASED values for the following US economic indicators. Search BLS.gov, federalreserve.gov, bea.gov, census.gov, and financial sites like Trading Economics, Reuters, Bloomberg, MarketWatch, or Investing.com.

For every indicator below, find:
- actual  : the NUMBER that was officially released (most recent report)
- forecast: the analyst consensus BEFORE that release (median estimate from Bloomberg/Reuters/Trading Economics)
- previous: the value from the period BEFORE the latest release
- releaseDate: exact date of the latest release (YYYY-MM-DD)
- reportingPeriod: e.g. "February 2026" or "Q4 2025"
- source: the official agency / website you got the data from

Indicators to find:
1. Non-Farm Payrolls (NFP) – monthly change in thousands of jobs (BLS Employment Situation)
2. Unemployment Rate – monthly % (BLS)
3. CPI m/m – Consumer Price Index, month-over-month % change (BLS)
4. CPI y/y – Consumer Price Index, year-over-year % change (BLS)
5. Core CPI m/m – CPI excluding food & energy, month-over-month % (BLS)
6. PPI m/m – Producer Price Index, month-over-month % change (BLS)
7. Retail Sales m/m – % change (Census Bureau)
8. GDP q/q – GDP growth rate, quarter-over-quarter annualized % (BEA)
9. PCE Price Index m/m – Personal Consumption Expenditures, month-over-month % (BEA)
10. Fed Funds Rate – current target rate midpoint % (Federal Reserve)
11. Average Hourly Earnings m/m – % change (BLS)
12. ISM Manufacturing PMI – latest reading (ISM)
13. ISM Services PMI – latest reading (ISM)

Return ONLY the following JSON with no extra text, no markdown fences, no explanations:

{
  "fetchedAt": "${new Date().toISOString()}",
  "indicators": [
    {
      "id": "nfp",
      "name": "Non-Farm Employment Change",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<e.g. February 2026>",
      "unit": "K",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "unemployment",
      "name": "Unemployment Rate",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "cpi_mm",
      "name": "CPI m/m",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "cpi_yy",
      "name": "CPI y/y",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "core_cpi",
      "name": "Core CPI m/m",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "ppi",
      "name": "PPI m/m",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "medium",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "retail_sales",
      "name": "Retail Sales m/m",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "medium",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "gdp",
      "name": "GDP q/q",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "pce",
      "name": "PCE Price Index m/m",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "fed_funds",
      "name": "Fed Funds Rate",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "high",
      "currency": "USD",
      "source": "Federal Reserve"
    },
    {
      "id": "avg_hourly_earnings",
      "name": "Average Hourly Earnings m/m",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "%",
      "impact": "medium",
      "currency": "USD",
      "source": "<official source>"
    },
    {
      "id": "ism_manufacturing",
      "name": "ISM Manufacturing PMI",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "",
      "impact": "medium",
      "currency": "USD",
      "source": "ISM"
    },
    {
      "id": "ism_services",
      "name": "ISM Services PMI",
      "actual": <number>,
      "forecast": <number>,
      "previous": <number>,
      "releaseDate": "<YYYY-MM-DD>",
      "reportingPeriod": "<period>",
      "unit": "",
      "impact": "medium",
      "currency": "USD",
      "source": "ISM"
    }
  ]
}`;
}

/**
 * Build a cross-verification prompt for a single indicator.
 * Used to double-check suspicious values.
 */
function buildVerifyPrompt(indicator) {
  return `Today is ${new Date().toISOString().split('T')[0]}.

Use Google Search to find the EXACT officially released value for:
  Indicator: ${indicator.name}
  I previously found: actual = ${indicator.actual}${indicator.unit}, release date = ${indicator.releaseDate}

Search BLS.gov, bea.gov, federalreserve.gov, Trading Economics for confirmation.

Return ONLY JSON — no markdown, no text:
{
  "id": "${indicator.id}",
  "confirmed_actual": <number>,
  "confirmed_forecast": <number>,
  "confirmed_previous": <number>,
  "confirmed_releaseDate": "<YYYY-MM-DD>",
  "match": <true if matches my value, false if different>,
  "source": "<URL or site>"
}`;
}

/**
 * Fetch ALL economic indicators via Gemini web search.
 * Results are cached for 20 minutes.
 */
export async function fetchLatestReleasedData() {
  const cacheKey = 'gemini_websearch_all';
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('✓ Returning cached Gemini web-search data');
    return cached;
  }

  console.log('🌐 Fetching live economic data via Gemini Google Search grounding...');

  const prompt = buildDataPrompt();
  const { text, sources, model } = await callGeminiWithSearch(prompt, 3000);

  let parsed;
  try {
    parsed = parseJsonFromText(text);
  } catch (e) {
    console.error('❌ Failed to parse Gemini JSON response:', e.message);
    console.error('Raw response (first 500 chars):', text.substring(0, 500));
    throw new Error('Gemini returned unparseable response: ' + e.message);
  }

  if (!Array.isArray(parsed?.indicators) || parsed.indicators.length === 0) {
    throw new Error('Gemini response has no indicators array');
  }

  const result = {
    indicators: parsed.indicators,
    sources,
    fetchedAt: parsed.fetchedAt || new Date().toISOString(),
    model,
    verifiedAt: null, // set after cross-verification
  };

  cache.set(cacheKey, result);
  console.log(`✅ Gemini web search: ${result.indicators.length} indicators fetched via ${model}`);
  return result;
}

/**
 * Cross-verify a specific indicator — re-queries Gemini independently.
 * Returns { confirmed: true/false, correctedValue? }
 */
export async function crossVerifyIndicator(indicator) {
  const cacheKey = `verify_${indicator.id}_${indicator.actual}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  console.log(`🔍 Cross-verifying ${indicator.name} (actual=${indicator.actual}${indicator.unit})...`);

  try {
    const prompt = buildVerifyPrompt(indicator);
    const { text } = await callGeminiWithSearch(prompt, 512);

    const parsed = parseJsonFromText(text);
    const result = {
      id: indicator.id,
      originalActual: indicator.actual,
      confirmedActual: parsed.confirmed_actual,
      confirmedForecast: parsed.confirmed_forecast,
      confirmedPrevious: parsed.confirmed_previous,
      confirmedReleaseDate: parsed.confirmed_releaseDate,
      match: parsed.match,
      source: parsed.source,
    };

    if (!result.match && result.confirmedActual !== undefined) {
      console.warn(
        `⚠️  MISMATCH for ${indicator.name}: ` +
        `first fetch=${indicator.actual}, verified=${result.confirmedActual}`
      );
    } else {
      console.log(`✅ Verified ${indicator.name}: ${result.confirmedActual}${indicator.unit} confirmed`);
    }

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`❌ Cross-verification failed for ${indicator.name}: ${err.message}`);
    return { id: indicator.id, match: null, error: err.message };
  }
}

/**
 * Fetch + cross-verify all HIGH impact indicators.
 * This is called during a forced refresh (POST /api/calendar/refresh).
 */
export async function fetchAndVerifyAllData() {
  const raw = await fetchLatestReleasedData();

  const highImpact = raw.indicators.filter(i => i.impact === 'high');
  console.log(`🔍 Cross-verifying ${highImpact.length} high-impact indicators in parallel...`);

  const verifications = await Promise.allSettled(
    highImpact.map(ind => crossVerifyIndicator(ind))
  );

  // Merge verification corrections back into indicators
  const correctionMap = {};
  verifications.forEach((v, idx) => {
    if (v.status === 'fulfilled' && v.value.match === false && v.value.confirmedActual !== undefined) {
      const id = highImpact[idx].id;
      correctionMap[id] = v.value;
    }
  });

  const verifiedIndicators = raw.indicators.map(ind => {
    const correction = correctionMap[ind.id];
    if (correction) {
      return {
        ...ind,
        actual: correction.confirmedActual,
        forecast: correction.confirmedForecast ?? ind.forecast,
        previous: correction.confirmedPrevious ?? ind.previous,
        releaseDate: correction.confirmedReleaseDate ?? ind.releaseDate,
        corrected: true,
        verificationSource: correction.source,
      };
    }
    return ind;
  });

  const result = {
    ...raw,
    indicators: verifiedIndicators,
    verifiedAt: new Date().toISOString(),
    correctionCount: Object.keys(correctionMap).length,
  };

  // Update cache with verified data
  cache.set('gemini_websearch_all', result);
  console.log(
    `✅ Verification complete. ${result.correctionCount} correction(s) applied.`
  );

  return result;
}

/**
 * Force-clear the cache and re-fetch everything with cross-verification.
 * Called by POST /api/calendar/refresh endpoint.
 */
export async function forceRefreshAllData() {
  cache.flushAll();
  console.log('🔄 Cache cleared — force-refreshing all economic data via Gemini web search...');
  return fetchAndVerifyAllData();
}

/**
 * Fetch a single indicator by id (for on-demand refresh of one indicator).
 */
export async function fetchSingleIndicator(indicatorId) {
  // Try to get from cached batch first
  const batch = cache.get('gemini_websearch_all');
  if (batch) {
    const found = batch.indicators.find(i => i.id === indicatorId);
    if (found) return found;
  }

  // Otherwise do a targeted single-indicator search
  const today = new Date().toISOString().split('T')[0];
  const prompt = `Today is ${today}. Use Google Search to find the latest officially released value for the US ${indicatorId.replace(/_/g, ' ')} economic indicator. Return ONLY JSON:
{
  "id": "${indicatorId}",
  "name": "<full indicator name>",
  "actual": <number>,
  "forecast": <number>,
  "previous": <number>,
  "releaseDate": "<YYYY-MM-DD>",
  "reportingPeriod": "<period>",
  "unit": "<% or K or empty>",
  "impact": "<high|medium|low>",
  "currency": "USD",
  "source": "<source>"
}`;

  const { text, sources } = await callGeminiWithSearch(prompt, 512);
  const parsed = parseJsonFromText(text);
  return { ...parsed, sources };
}

export default {
  fetchLatestReleasedData,
  crossVerifyIndicator,
  fetchAndVerifyAllData,
  forceRefreshAllData,
  fetchSingleIndicator,
};
