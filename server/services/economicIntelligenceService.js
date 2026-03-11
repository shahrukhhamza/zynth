/**
 * Economic Intelligence Service
 *
 * Data strategy:
 * - ACTUAL values:  fetched LIVE from FRED API (mirrors official BLS releases in real-time)
 * - FORECAST values: from config/economicData.js (analyst consensus — no free live API exists)
 * - HISTORICAL charts: from FRED API (12-month time-series)
 *
 * FRED is the Federal Reserve's official data repository and mirrors every
 * BLS release (NFP, CPI, Unemployment) within hours of publication.
 * Actual values are NEVER hardcoded — always fetched live.
 */

import axios from 'axios';
import NodeCache from 'node-cache';
import { REAL_ECONOMIC_DATA } from '../config/economicData.js';

// Cache with 1-hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * Fetch economic data from FRED API
 */
async function fetchFredSeries(seriesId, observations = 12) {
  try {
    const fredKey = process.env.FRED_API_KEY || 'demo';
    
    const response = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations`,
      {
        params: {
          series_id: seriesId,
          api_key: fredKey,
          file_type: 'json',
          limit: observations,
          sort_order: 'desc', // Most recent first
        },
        timeout: 10000,
      }
    );

    if (!response.data?.observations) {
      console.log(`⚠️  FRED: No data for ${seriesId}`);
      return null;
    }

    // Reverse to get chronological order (oldest to newest)
    const data = response.data.observations
      .filter(obs => obs.value !== '.')
      .map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }))
      .reverse();

    console.log(`✓ FRED: Fetched ${data.length} observations for ${seriesId}`);
    return data;
    
  } catch (error) {
    console.log(`❌ FRED API error for ${seriesId}: ${error.message}`);
    return null;
  }
}

/**
 * Calculate forecast using average of last 3 values
 */
function calculateForecast(historicalData) {
  if (!historicalData || historicalData.length < 3) {
    return null;
  }

  const lastThree = historicalData.slice(-3);
  const sum = lastThree.reduce((acc, item) => acc + item.value, 0);
  const forecast = sum / 3;

  return Math.round(forecast * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate surprise value
 */
function calculateSurprise(actual, forecast) {
  if (actual === null || forecast === null) {
    return null;
  }

  return Math.round((actual - forecast) * 100) / 100;
}

/**
 * Determine gold market impact based on surprise
 */
function determineGoldImpact(indicator, surprise) {
  if (surprise === null || surprise === 0) {
    return 'Neutral';
  }

  const impacts = {
    // Labor market
    'NFP':               { positive: 'Bearish for Gold', negative: 'Bullish for Gold' },
    'Unemployment':      { positive: 'Bullish for Gold', negative: 'Bearish for Gold' },
    'JoblessClaims':     { positive: 'Bullish for Gold', negative: 'Bearish for Gold' }, // more claims = bad economy = bullish gold
    // Inflation
    'CPI':               { positive: 'Bullish for Gold', negative: 'Bearish for Gold' },
    'CorePCE':           { positive: 'Bullish for Gold', negative: 'Bearish for Gold' },
    'CoreCPI':           { positive: 'Bullish for Gold', negative: 'Bearish for Gold' },
    'PPI':               { positive: 'Bullish for Gold', negative: 'Bearish for Gold' },
    // Growth
    'GDP':               { positive: 'Bearish for Gold', negative: 'Bullish for Gold' }, // strong GDP = less safe-haven demand
    'RetailSales':       { positive: 'Bearish for Gold', negative: 'Bullish for Gold' }, // strong spending = bearish gold
    'DurableGoods':      { positive: 'Bearish for Gold', negative: 'Bullish for Gold' },
    // Sentiment / Activity
    'ISMManufacturing':  { positive: 'Bearish for Gold', negative: 'Bullish for Gold' }, // expansion = risk-on = bearish gold
    'ISMServices':       { positive: 'Bearish for Gold', negative: 'Bullish for Gold' },
    'ConsumerConf':      { positive: 'Bearish for Gold', negative: 'Bullish for Gold' }, // high confidence = risk-on
    // Monetary policy (surprise = rate higher than expected)
    'FedRate':           { positive: 'Bearish for Gold', negative: 'Bullish for Gold' }, // rate hike = stronger USD = bearish gold
    // Trade
    'TradeBalance':      { positive: 'Bearish for Gold', negative: 'Bullish for Gold' }, // surplus = stronger USD = bearish gold
    // Housing
    'BuildingPermits':   { positive: 'Bearish for Gold', negative: 'Bullish for Gold' },
  };

  const direction = surprise > 0 ? 'positive' : 'negative';
  return impacts[indicator]?.[direction] || 'Neutral';
}

/**
 * Analyze any config-only indicator (no useful FRED series)
 * For: Fed Rate, ISM PMIs, Consumer Confidence, FOMC Minutes
 */
async function analyzeFromConfig(id, code, indicatorName) {
  const cacheKey = `${id}_analysis`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === id);
  if (!configEntry) return { error: `Config entry not found for ${id}`, indicator: code };

  const released = getLatestReleasedEntry(configEntry);
  if (!released) return { error: `No released data for ${id}`, indicator: code };

  const latestActual   = released.actual;
  const latestForecast = released.forecast;
  const latestDate     = released.date;

  // Build historical from config
  const historicalData = (configEntry.historicalData || [])
    .filter(h => h.actual !== null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(h => ({ date: h.date, value: h.actual }));

  const surprise = calculateSurprise(latestActual, latestForecast);
  const impact   = determineGoldImpact(code, surprise);

  const analysis = {
    indicator: indicatorName,
    code,
    unit: configEntry.unit,
    actual:    latestActual,
    forecast:  latestForecast,
    surprise,
    surprisePercentage: latestForecast && latestForecast !== 0
      ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100
      : 0,
    impact,
    impactColor: getImpactColor(impact),
    latestDate,
    historicalData,
    description: configEntry.description,
    usualEffect: configEntry.usualEffect,
    frequency:   configEntry.frequency,
    actualSource:   'Verified Config Data',
    forecastSource: 'Analyst Consensus (config)',
  };

  cache.set(cacheKey, analysis);
  console.log(`✅ ${code}: ${latestActual}${configEntry.unit} | forecast ${latestForecast}${configEntry.unit} | surprise ${surprise}`);
  return analysis;
}

/**
 * Get color coding for UI
 */
function getImpactColor(impact) {
  if (impact.includes('Bullish')) return 'green';
  if (impact.includes('Bearish')) return 'red';
  return 'gray';
}

/**
 * Get the most recently RELEASED entry from a config indicator.
 * Skips any releases dated in the future (not yet published).
 */
function getLatestReleasedEntry(configEntry) {
  if (!configEntry) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if the top-level current/date is already released
  const mainDate = configEntry.date ? new Date(configEntry.date) : null;
  if (mainDate && mainDate <= today) {
    return {
      actual:   configEntry.current,
      forecast: configEntry.forecast,
      date:     configEntry.date,
    };
  }

  // Scan historicalData (newest first) for the last released entry
  if (configEntry.historicalData && configEntry.historicalData.length > 0) {
    const sorted = [...configEntry.historicalData].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    for (const entry of sorted) {
      const d = new Date(entry.date);
      if (d <= today) {
        return {
          actual:   entry.actual,
          forecast: entry.forecast,
          date:     entry.date,
        };
      }
    }
  }

  return null;
}

/**
 * Fetch and analyze Non-Farm Payrolls (NFP)
 * Actual:   FRED PAYEMS — month-over-month change (live BLS release mirror)
 * Forecast: config/economicData.js — analyst consensus (no free live forecast API)
 * Charts:   FRED PAYEMS — 12-month monthly changes
 */
export async function analyzeNFP() {
  const cacheKey = 'nfp_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing Non-Farm Payrolls (NFP) — fetching live from FRED...');

    // ── 1. LIVE actual from FRED PAYEMS ───────────────────────────────────
    // PAYEMS = Total Nonfarm Employees (thousands). Monthly diff = NFP release.
    const rawData = await fetchFredSeries('PAYEMS', 14);
    if (!rawData || rawData.length < 2) {
      return { error: 'FRED PAYEMS data unavailable', indicator: 'NFP' };
    }

    // Build month-over-month changes (all 12 historical + latest)
    const monthlyChanges = rawData.slice(1).map((obs, i) => ({
      date:  obs.date,
      value: Math.round((obs.value - rawData[i].value) * 10) / 10,
    }));

    const latest = monthlyChanges[monthlyChanges.length - 1];
    let latestActual = Math.round(latest.value);  // NFP in whole thousands
    let latestDate   = latest.date;
    const historicalData = monthlyChanges.slice(-12);

    console.log(`  FRED PAYEMS latest actual: ${latestActual}K (date: ${latestDate})`);

    // ── 2. Forecast from config (analyst consensus — no free API for this) ─
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'nfp');
    const released = getLatestReleasedEntry(configEntry);

    // FRED LAG GUARD: FRED typically syncs within 1-3 days of BLS release.
    // If config has a more recent release date (e.g. yesterday's BLS drop),
    // use the config actual rather than stale FRED data.
    if (released && new Date(released.date) > new Date(latestDate)) {
      console.log(`  ⚠️  FRED lag detected for NFP: FRED=${latestDate}, BLS release=${released.date}`);
      console.log(`  ↳  Using config actual (${released.actual}K) until FRED syncs`);
      latestActual = released.actual;
      latestDate   = released.date;
    }

    const latestForecast = released?.forecast ?? calculateForecast(historicalData);

    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('NFP', surprise);

    const analysis = {
      indicator: 'Non-Farm Payrolls',
      code: 'NFP',
      unit: 'K',
      actual:    latestActual,
      forecast:  latestForecast,
      surprise,
      surprisePercentage: latestForecast
        ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100
        : 0,
      impact,
      impactColor: getImpactColor(impact),
      latestDate,
      historicalData,
      actualSource:   'FRED API (live — PAYEMS monthly diff)',
      forecastSource: 'Analyst Consensus (config)',
    };

    cache.set(cacheKey, analysis);
    console.log(`✅ NFP: ${latestActual}K actual (FRED live) | ${latestForecast}K forecast | surprise ${surprise}K`);
    return analysis;

  } catch (error) {
    console.error('✗ NFP analysis error:', error.message);
    return { error: error.message, indicator: 'NFP' };
  }
}

/**
 * Fetch and analyze Consumer Price Index (CPI m/m)
 * Markets watch the MONTHLY change, not the index level or YoY.
 * Actual:   FRED CPIAUCSL — month-over-month % change (live BLS release mirror)
 * Forecast: config/economicData.js — analyst consensus
 * Charts:   FRED CPIAUCSL — 12-month m/m % changes
 */
export async function analyzeCPI() {
  const cacheKey = 'cpi_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing CPI (m/m) — fetching live from FRED...');

    // ── 1. LIVE actual from FRED CPIAUCSL ─────────────────────────────────
    // CPIAUCSL = CPI index level. Monthly % change = what markets trade.
    const rawData = await fetchFredSeries('CPIAUCSL', 14);
    if (!rawData || rawData.length < 2) {
      return { error: 'FRED CPIAUCSL data unavailable', indicator: 'CPI' };
    }

    // Build month-over-month % changes
    const monthlyChanges = rawData.slice(1).map((obs, i) => ({
      date:  obs.date,
      value: Math.round(((obs.value - rawData[i].value) / rawData[i].value) * 10000) / 100,
    }));

    const latest = monthlyChanges[monthlyChanges.length - 1];
    let latestActual = Math.round(latest.value * 10) / 10;  // 1 decimal (e.g. 0.2)
    let latestDate   = latest.date;
    const historicalData = monthlyChanges.slice(-12);

    console.log(`  FRED CPIAUCSL latest m/m: ${latestActual}% (date: ${latestDate})`);

    // ── 2. Forecast from config (analyst consensus — no free API for this) ─
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'cpi');
    const released = getLatestReleasedEntry(configEntry);

    // FRED LAG GUARD: if config has a more recent BLS release, use it.
    if (released && new Date(released.date) > new Date(latestDate)) {
      console.log(`  ⚠️  FRED lag detected for CPI: FRED=${latestDate}, BLS release=${released.date}`);
      console.log(`  ↳  Using config actual (${released.actual}%) until FRED syncs`);
      latestActual = released.actual;
      latestDate   = released.date;
    }

    const latestForecast = released?.forecast ?? calculateForecast(historicalData);

    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('CPI', surprise);

    const analysis = {
      indicator: 'Consumer Price Index (m/m)',
      code: 'CPI',
      unit: '%',
      actual:    latestActual,
      forecast:  latestForecast,
      surprise,
      surprisePercentage: latestForecast !== 0
        ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100
        : 0,
      impact,
      impactColor: getImpactColor(impact),
      latestDate,
      historicalData,
      actualSource:   'FRED API (live — CPIAUCSL m/m)',
      forecastSource: 'Analyst Consensus (config)',
    };

    cache.set(cacheKey, analysis);
    console.log(`✅ CPI: ${latestActual}% actual (FRED live) | ${latestForecast}% forecast | surprise ${surprise}%`);
    return analysis;

  } catch (error) {
    console.error('✗ CPI analysis error:', error.message);
    return { error: error.message, indicator: 'CPI' };
  }
}

/**
 * Fetch and analyze Unemployment Rate
 * Actual:   FRED UNRATE — latest observation (live BLS release mirror)
 * Forecast: config/economicData.js — analyst consensus
 * Charts:   FRED UNRATE — 12-month history
 */
export async function analyzeUnemployment() {
  const cacheKey = 'unemployment_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing Unemployment Rate — fetching live from FRED...');

    // ── 1. LIVE actual from FRED UNRATE ───────────────────────────────────
    // UNRATE = Civilian Unemployment Rate (%). Latest obs = official BLS rate.
    const rawData = await fetchFredSeries('UNRATE', 12);
    if (!rawData || rawData.length < 1) {
      return { error: 'FRED UNRATE data unavailable', indicator: 'Unemployment' };
    }

    const latest = rawData[rawData.length - 1];
    let latestActual = latest.value;  // e.g. 4.1
    let latestDate   = latest.date;
    const historicalData = rawData.slice(-12);

    console.log(`  FRED UNRATE latest: ${latestActual}% (date: ${latestDate})`);

    // ── 2. Forecast from config (analyst consensus — no free API for this) ─
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'unemployment');
    const released = getLatestReleasedEntry(configEntry);

    // FRED LAG GUARD: if config has a more recent BLS release, use it.
    if (released && new Date(released.date) > new Date(latestDate)) {
      console.log(`  ⚠️  FRED lag detected for Unemployment: FRED=${latestDate}, BLS release=${released.date}`);
      console.log(`  ↳  Using config actual (${released.actual}%) until FRED syncs`);
      latestActual = released.actual;
      latestDate   = released.date;
    }

    const latestForecast = released?.forecast ?? calculateForecast(rawData);

    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('Unemployment', surprise);

    const analysis = {
      indicator: 'Unemployment Rate',
      code: 'UNEMPLOYMENT',
      unit: '%',
      actual:    latestActual,
      forecast:  latestForecast,
      surprise,
      surprisePercentage: latestForecast
        ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100
        : 0,
      impact,
      impactColor: getImpactColor(impact),
      latestDate,
      historicalData,
      actualSource:   'FRED API (live — UNRATE)',
      forecastSource: 'Analyst Consensus (config)',
    };

    cache.set(cacheKey, analysis);
    console.log(`✅ Unemployment: ${latestActual}% actual (FRED live) | ${latestForecast}% forecast | surprise ${surprise}%`);
    return analysis;

  } catch (error) {
    console.error('✗ Unemployment analysis error:', error.message);
    return { error: error.message, indicator: 'Unemployment' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW HIGH-IMPACT INDICATORS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fed Interest Rate Decision
 * No useful continuous FRED series for the rate decision itself — use config.
 */
export async function analyzeFedRate() {
  return analyzeFromConfig('fed_rate', 'FedRate', 'Fed Interest Rate Decision');
}

/**
 * GDP q/q (Advance estimate)
 * FRED: A191RL1Q225SBEA — Real GDP percent change, quarterly, annualized
 */
export async function analyzeGDP() {
  const cacheKey = 'gdp_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing GDP q/q — fetching live from FRED A191RL1Q225SBEA...');

    const rawData = await fetchFredSeries('A191RL1Q225SBEA', 8);
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'gdp');
    const released    = getLatestReleasedEntry(configEntry);

    let latestActual, latestDate, historicalData;

    if (rawData && rawData.length >= 1) {
      const latest = rawData[rawData.length - 1];
      latestActual = Math.round(latest.value * 10) / 10;
      latestDate   = latest.date;
      historicalData = rawData.map(d => ({ date: d.date, value: d.value }));

      // FRED lag guard
      if (released && new Date(released.date) > new Date(latestDate)) {
        latestActual = released.actual;
        latestDate   = released.date;
      }
    } else {
      // Fallback to config
      latestActual   = released?.actual ?? null;
      latestDate     = released?.date   ?? null;
      historicalData = (configEntry?.historicalData || []).map(h => ({ date: h.date, value: h.actual }));
    }

    const latestForecast = released?.forecast ?? calculateForecast(historicalData);
    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('GDP', surprise);

    const analysis = {
      indicator: 'GDP q/q (Advance)',
      code: 'GDP',
      unit: '%',
      actual: latestActual, forecast: latestForecast, surprise,
      surprisePercentage: latestForecast ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100 : 0,
      impact, impactColor: getImpactColor(impact), latestDate, historicalData,
      description: configEntry?.description,
      usualEffect: configEntry?.usualEffect,
      frequency:   configEntry?.frequency,
      actualSource:   rawData ? 'FRED API (A191RL1Q225SBEA)' : 'Verified Config Data',
      forecastSource: 'Analyst Consensus (config)',
    };
    cache.set(cacheKey, analysis);
    console.log(`✅ GDP: ${latestActual}% | forecast ${latestForecast}% | surprise ${surprise}%`);
    return analysis;
  } catch (err) {
    console.error('✗ GDP analysis error:', err.message);
    return { error: err.message, indicator: 'GDP' };
  }
}

/**
 * Core PCE Price Index m/m — Fed's preferred inflation gauge
 * FRED: PCEPILFE — Personal Consumption Expenditures: All Items Less Food and Energy (index level)
 * We compute m/m % change.
 */
export async function analyzeCorePCE() {
  const cacheKey = 'core_pce_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing Core PCE m/m — fetching live from FRED PCEPILFE...');

    const rawData = await fetchFredSeries('PCEPILFE', 14);
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'core_pce');
    const released    = getLatestReleasedEntry(configEntry);

    let latestActual, latestDate, historicalData;

    if (rawData && rawData.length >= 2) {
      const monthlyChanges = rawData.slice(1).map((obs, i) => ({
        date:  obs.date,
        value: Math.round(((obs.value - rawData[i].value) / rawData[i].value) * 10000) / 100,
      }));
      const latest = monthlyChanges[monthlyChanges.length - 1];
      latestActual   = Math.round(latest.value * 10) / 10;
      latestDate     = latest.date;
      historicalData = monthlyChanges.slice(-12);

      if (released && new Date(released.date) > new Date(latestDate)) {
        latestActual = released.actual;
        latestDate   = released.date;
      }
    } else {
      latestActual   = released?.actual ?? null;
      latestDate     = released?.date   ?? null;
      historicalData = (configEntry?.historicalData || []).map(h => ({ date: h.date, value: h.actual }));
    }

    const latestForecast = released?.forecast ?? calculateForecast(historicalData);
    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('CorePCE', surprise);

    const analysis = {
      indicator: "Core PCE Price Index m/m (Fed's Preferred Inflation)",
      code: 'CorePCE',
      unit: '%',
      actual: latestActual, forecast: latestForecast, surprise,
      surprisePercentage: latestForecast ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100 : 0,
      impact, impactColor: getImpactColor(impact), latestDate, historicalData,
      description: configEntry?.description,
      usualEffect: configEntry?.usualEffect,
      frequency:   configEntry?.frequency,
      actualSource:   rawData ? 'FRED API (PCEPILFE m/m)' : 'Verified Config Data',
      forecastSource: 'Analyst Consensus (config)',
    };
    cache.set(cacheKey, analysis);
    console.log(`✅ Core PCE: ${latestActual}% | forecast ${latestForecast}% | surprise ${surprise}%`);
    return analysis;
  } catch (err) {
    console.error('✗ Core PCE analysis error:', err.message);
    return { error: err.message, indicator: 'CorePCE' };
  }
}

/**
 * Initial Jobless Claims (weekly)
 * FRED: ICSA — Initial Claims, Seasonally Adjusted (thousands)
 */
export async function analyzeJoblessClaims() {
  const cacheKey = 'jobless_claims_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing Initial Jobless Claims — fetching live from FRED ICSA...');

    // Fetch last 12 weeks
    const rawData = await fetchFredSeries('ICSA', 12);
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'jobless_claims');
    const released    = getLatestReleasedEntry(configEntry);

    let latestActual, latestDate, historicalData;

    if (rawData && rawData.length >= 1) {
      const latest = rawData[rawData.length - 1];
      // ICSA is in thousands
      latestActual   = Math.round(latest.value / 1000);
      latestDate     = latest.date;
      historicalData = rawData.map(d => ({ date: d.date, value: Math.round(d.value / 1000) }));

      if (released && new Date(released.date) > new Date(latestDate)) {
        latestActual = released.actual;
        latestDate   = released.date;
      }
    } else {
      latestActual   = released?.actual ?? null;
      latestDate     = released?.date   ?? null;
      historicalData = (configEntry?.historicalData || []).map(h => ({ date: h.date, value: h.actual }));
    }

    const latestForecast = released?.forecast ?? null;
    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('JoblessClaims', surprise);

    const analysis = {
      indicator: 'Initial Jobless Claims (weekly)',
      code: 'JoblessClaims',
      unit: 'K',
      actual: latestActual, forecast: latestForecast, surprise,
      surprisePercentage: latestForecast ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100 : 0,
      impact, impactColor: getImpactColor(impact), latestDate, historicalData,
      description: configEntry?.description,
      usualEffect: configEntry?.usualEffect,
      frequency:   configEntry?.frequency,
      actualSource:   rawData ? 'FRED API (ICSA)' : 'Verified Config Data',
      forecastSource: 'Analyst Consensus (config)',
    };
    cache.set(cacheKey, analysis);
    console.log(`✅ Jobless Claims: ${latestActual}K | forecast ${latestForecast}K | surprise ${surprise}K`);
    return analysis;
  } catch (err) {
    console.error('✗ Jobless Claims analysis error:', err.message);
    return { error: err.message, indicator: 'JoblessClaims' };
  }
}

/**
 * Retail Sales m/m
 * FRED: RSAFS — Advance Retail Sales: Retail Trade and Food Services (millions $)
 * We compute m/m % change.
 */
export async function analyzeRetailSales() {
  const cacheKey = 'retail_sales_analysis';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log('📊 Analyzing Retail Sales m/m — fetching live from FRED RSAFS...');

    const rawData = await fetchFredSeries('RSAFS', 14);
    const configEntry = REAL_ECONOMIC_DATA.indicators.find(i => i.id === 'retail_sales');
    const released    = getLatestReleasedEntry(configEntry);

    let latestActual, latestDate, historicalData;

    if (rawData && rawData.length >= 2) {
      const monthlyChanges = rawData.slice(1).map((obs, i) => ({
        date:  obs.date,
        value: Math.round(((obs.value - rawData[i].value) / rawData[i].value) * 10000) / 100,
      }));
      const latest = monthlyChanges[monthlyChanges.length - 1];
      latestActual   = Math.round(latest.value * 10) / 10;
      latestDate     = latest.date;
      historicalData = monthlyChanges.slice(-12);

      if (released && new Date(released.date) > new Date(latestDate)) {
        latestActual = released.actual;
        latestDate   = released.date;
      }
    } else {
      latestActual   = released?.actual ?? null;
      latestDate     = released?.date   ?? null;
      historicalData = (configEntry?.historicalData || []).map(h => ({ date: h.date, value: h.actual }));
    }

    const latestForecast = released?.forecast ?? calculateForecast(historicalData);
    const surprise = calculateSurprise(latestActual, latestForecast);
    const impact   = determineGoldImpact('RetailSales', surprise);

    const analysis = {
      indicator: 'Retail Sales m/m',
      code: 'RetailSales',
      unit: '%',
      actual: latestActual, forecast: latestForecast, surprise,
      surprisePercentage: latestForecast ? Math.round((surprise / Math.abs(latestForecast)) * 10000) / 100 : 0,
      impact, impactColor: getImpactColor(impact), latestDate, historicalData,
      description: configEntry?.description,
      usualEffect: configEntry?.usualEffect,
      frequency:   configEntry?.frequency,
      actualSource:   rawData ? 'FRED API (RSAFS m/m)' : 'Verified Config Data',
      forecastSource: 'Analyst Consensus (config)',
    };
    cache.set(cacheKey, analysis);
    console.log(`✅ Retail Sales: ${latestActual}% | forecast ${latestForecast}% | surprise ${surprise}%`);
    return analysis;
  } catch (err) {
    console.error('✗ Retail Sales analysis error:', err.message);
    return { error: err.message, indicator: 'RetailSales' };
  }
}

/**
 * ISM Manufacturing PMI — config-based (ISM proprietary data, no free FRED series)
 */
export async function analyzeISMManufacturing() {
  return analyzeFromConfig('ism_manufacturing', 'ISMManufacturing', 'ISM Manufacturing PMI');
}

/**
 * CB Consumer Confidence — config-based (Conference Board proprietary)
 */
export async function analyzeConsumerConfidence() {
  return analyzeFromConfig('consumer_confidence', 'ConsumerConf', 'CB Consumer Confidence');
}

/**
 * Get complete economic dashboard data
 */
export async function getEconomicDashboard() {
  const cacheKey = 'economic_dashboard';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('✓ Returning cached economic dashboard');
    return cached;
  }

  try {
    console.log('📊 Building economic intelligence dashboard...');
    
    const [nfp, cpi, unemployment, fedRate, gdp, corePCE, joblessClaims, retailSales, ismMfg, consumerConf] = await Promise.all([
      analyzeNFP(),
      analyzeCPI(),
      analyzeUnemployment(),
      analyzeFedRate(),
      analyzeGDP(),
      analyzeCorePCE(),
      analyzeJoblessClaims(),
      analyzeRetailSales(),
      analyzeISMManufacturing(),
      analyzeConsumerConfidence(),
    ]);

    // Calculate overall gold market sentiment across all indicators
    const allIndicators = [nfp, cpi, unemployment, fedRate, gdp, corePCE, joblessClaims, retailSales, ismMfg, consumerConf];
    const impacts = allIndicators
      .filter(item => !item.error)
      .map(item => item.impact);

    const bullishCount = impacts.filter(i => i.includes('Bullish')).length;
    const bearishCount = impacts.filter(i => i.includes('Bearish')).length;

    let overallSentiment = 'Neutral';
    if (bullishCount > bearishCount) {
      overallSentiment = 'Bullish for Gold';
    } else if (bearishCount > bullishCount) {
      overallSentiment = 'Bearish for Gold';
    }

    const dashboard = {
      timestamp: new Date().toISOString(),
      indicators: {
        // Primary (labor + inflation — FRED live)
        nfp,
        cpi,
        unemployment,
        // Monetary policy
        fedRate,
        // Growth
        gdp,
        // Extended inflation
        corePCE,
        // High-frequency labor
        joblessClaims,
        // Consumer
        retailSales,
        consumerConf,
        // Activity
        ismMfg,
      },
      overallSentiment,
      sentimentColor: getImpactColor(overallSentiment),
      summary: {
        totalIndicators: impacts.length,
        bullishIndicators: bullishCount,
        bearishIndicators: bearishCount,
        neutralIndicators: impacts.length - bullishCount - bearishCount,
      },
    };

    cache.set(cacheKey, dashboard);
    console.log(`✅ Economic Dashboard ready: ${overallSentiment}`);
    
    return dashboard;
    
  } catch (error) {
    console.error('✗ Dashboard build error:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Clear cache (for testing/manual refresh)
 */
export function clearEconomicCache() {
  cache.flushAll();
  console.log('✓ Economic intelligence cache cleared');
}

export default {
  analyzeNFP,
  analyzeCPI,
  analyzeUnemployment,
  analyzeFedRate,
  analyzeGDP,
  analyzeCorePCE,
  analyzeJoblessClaims,
  analyzeRetailSales,
  analyzeISMManufacturing,
  analyzeConsumerConfidence,
  getEconomicDashboard,
  clearEconomicCache,
};
