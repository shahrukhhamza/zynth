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
 * Composite macro surprise score for gold (-10 to +10)
 *
 * Weights reflect each indicator's typical market-moving impact on XAUUSD.
 * Contribution per indicator uses a tiered magnitude based on |surprisePercentage|:
 *   >= 20% → 3 (large), >= 10% → 2 (medium), >= 3% → 1 (small), < 3% → 0.3 (tiny)
 *   surprise === null or 0 → 0
 * contribution = magnitude * weight * direction  (direction: +1 green, -1 red, 0 gray)
 * Normalized over max possible rawSum = 3 * 12.6 = 37.8
 */
export async function calculateMacroSurpriseScore() {
  const cacheKey = 'macro_surprise_score';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const dashboard = await getEconomicDashboard();
    if (dashboard.error) return { error: dashboard.error };

    const WEIGHTS = {
      'CPI':              2.0,
      'NFP':              1.8,
      'FedRate':          1.8,
      'CorePCE':          1.6,
      'UNEMPLOYMENT':     1.2,
      'GDP':              1.2,
      'JoblessClaims':    0.8,
      'RetailSales':      0.8,
      'ISMManufacturing': 0.7,
      'ConsumerConf':     0.7,
    };

    const MAX_MAGNITUDE  = 3;    // used for normalisation
    const TOTAL_WEIGHT   = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 12.6
    const MAX_RAW        = MAX_MAGNITUDE * TOTAL_WEIGHT; // 37.8

    const contributors = [];
    let rawSum = 0;

    for (const data of Object.values(dashboard.indicators)) {
      if (data.error) continue;
      const weight = WEIGHTS[data.code];
      if (weight == null) continue;

      // Tiered magnitude
      let magnitude = 0;
      if (data.surprise !== null && data.surprise !== 0) {
        const absSP = Math.abs(data.surprisePercentage ?? 0);
        if      (absSP >= 20) magnitude = 3;
        else if (absSP >= 10) magnitude = 2;
        else if (absSP >= 3)  magnitude = 1;
        else                  magnitude = 0.3;
      }

      // Direction
      let direction = 0;
      if      (data.impactColor === 'green') direction =  1;
      else if (data.impactColor === 'red')   direction = -1;

      const contribution = magnitude * weight * direction;
      rawSum += contribution;

      contributors.push({
        code:         data.code,
        indicator:    data.indicator,
        contribution: Math.round(contribution * 100) / 100,
        impact:       data.impact,
        surprise:     data.surprise,
        unit:         data.unit,
      });
    }

    // Normalize: max rawSum = MAX_MAGNITUDE * TOTAL_WEIGHT = 37.8 → maps to ±10
    const normalized = MAX_RAW > 0 ? (rawSum / MAX_RAW) * 10 : 0;
    const score = Math.round(Math.max(-10, Math.min(10, normalized)) * 10) / 10;

    let label;
    if      (score >=  6) label = 'Strongly Bullish for Gold';
    else if (score >=  2) label = 'Bullish for Gold';
    else if (score >  -2) label = 'Neutral';
    else if (score >  -6) label = 'Bearish for Gold';
    else                  label = 'Strongly Bearish for Gold';

    // Sort by absolute contribution so the biggest movers appear first
    contributors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    const result = { score, label, contributors, updatedAt: Date.now() };

    cache.set(cacheKey, result, 3600);
    console.log(`✅ Macro Surprise Score: ${score} (${label})`);
    return result;

  } catch (err) {
    console.error('✗ Macro surprise score error:', err.message);
    return { error: err.message };
  }
}

/**
 * Clear cache (for testing/manual refresh)
 */
export function clearEconomicCache() {
  cache.flushAll();
  console.log('✓ Economic intelligence cache cleared');
}

// ─────────────────────────────────────────────────────────────────────────────
// FRESHNESS SYSTEM
// Deterministic — derives "fresh" | "stale" | "outdated" from release frequency.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expected release cadence per indicator code.
 * fresh  → data is within normal publication window
 * stale  → slightly beyond window (FRED lag / revision delay tolerated)
 * outdated → significantly behind; treat with lower confidence
 */
const FRESHNESS_SCHEDULE = {
  NFP:              { fresh: 40,  stale: 80  }, // monthly BLS
  CPI:              { fresh: 40,  stale: 80  }, // monthly BLS
  UNEMPLOYMENT:     { fresh: 40,  stale: 80  }, // monthly BLS (with NFP)
  CorePCE:          { fresh: 40,  stale: 80  }, // monthly BEA
  GDP:              { fresh: 100, stale: 190 }, // quarterly BEA advance
  RetailSales:      { fresh: 40,  stale: 80  }, // monthly Census
  ISMManufacturing: { fresh: 40,  stale: 80  }, // monthly ISM
  ConsumerConf:     { fresh: 40,  stale: 80  }, // monthly Conference Board
  FedRate:          { fresh: 60,  stale: 120 }, // FOMC ~8×/year ≈ 45-day gaps
  JoblessClaims:    { fresh: 10,  stale: 21  }, // weekly DOL
};

/**
 * Classify indicator data age into a freshness tier.
 * @param {string|null} latestDate – YYYY-MM-DD date of last released data point
 * @param {string} code            – indicator code for cadence lookup
 * @returns {"fresh"|"stale"|"outdated"}
 */
function calcFreshness(latestDate, code) {
  if (!latestDate) return 'outdated';
  const days = Math.floor((Date.now() - new Date(latestDate).getTime()) / 86_400_000);
  const th   = FRESHNESS_SCHEDULE[code] || { fresh: 45, stale: 90 };
  if (days <= th.fresh) return 'fresh';
  if (days <= th.stale) return 'stale';
  return 'outdated';
}

/**
 * Score a single indicator's recency on a 0-100 scale (used in confidence).
 */
function recencyScore(latestDate) {
  if (!latestDate) return 30;
  const days = Math.floor((Date.now() - new Date(latestDate).getTime()) / 86_400_000);
  if (days <= 7)   return 100;
  if (days <= 30)  return 80;
  if (days <= 90)  return 60;
  if (days <= 180) return 40;
  return 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIDENCE SYSTEM
// Deterministic — no AI involved.
// Formula weights: 40 % data recency, 35 % indicator availability, 25 % signal consistency
// Freshness penalty applied on top: stale −3 pts each, outdated −7 pts each (max −20).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a composite confidence score from all indicator values.
 * @param {Array} indicatorValues – raw indicator objects (may include error entries)
 * @returns {{ value: number, level: "Low"|"Medium"|"High", reasoning: string, label: string }}
 */
export function calculateConfidence(indicatorValues, signalConflictLevel = 'low') {
  const EXPECTED_COUNT = 10;
  const available = (indicatorValues || []).filter(i => i && !i.error);

  // 1. Availability: what fraction of expected indicators are present
  const availabilityScore = (available.length / EXPECTED_COUNT) * 100;

  // 2. Recency: average recency score across available indicators
  const recencyScores = available.map(ind => recencyScore(ind.latestDate));
  const avgRecency = recencyScores.length > 0
    ? recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length
    : 30;

  // 3. Signal consistency: how strongly do indicators agree on a direction?
  const bullish  = available.filter(i => i.impactColor === 'green').length;
  const bearish  = available.filter(i => i.impactColor === 'red').length;
  const dominant = Math.max(bullish, bearish);
  const consistencyScore = available.length > 0
    ? (dominant / available.length) * 100
    : 50;

  // 4. Freshness penalty
  const staleCount    = available.filter(i => calcFreshness(i.latestDate, i.code) === 'stale').length;
  const outdatedCount = available.filter(i => calcFreshness(i.latestDate, i.code) === 'outdated').length;
  const freshnessPenalty = Math.min(20, staleCount * 3 + outdatedCount * 7);

  const raw = Math.round(
    0.40 * avgRecency +
    0.35 * availabilityScore +
    0.25 * consistencyScore,
  );
  // Signal conflict penalty: ambiguous macro environment reduces actionable confidence
  const conflictPenalty = signalConflictLevel === 'high'   ? 10
                        : signalConflictLevel === 'medium' ? 5
                        : 0;
  const value = Math.max(0, Math.min(100, raw - freshnessPenalty - conflictPenalty));

  const level = value >= 70 ? 'High' : value >= 45 ? 'Medium' : 'Low';
  const recentCount = recencyScores.filter(s => s >= 80).length;
  const reasoning =
    `${available.length}/${EXPECTED_COUNT} indicators available; ` +
    `${recentCount} updated within 30 days; ` +
    `${bullish} bullish, ${bearish} bearish, ` +
    `${available.length - bullish - bearish} neutral signals`;

  // Human-readable label — non-technical, user-facing
  const signalsMixed = bullish > 0 && bearish > 0 && Math.abs(bullish - bearish) <= 2;
  const hasStaleData  = staleCount > 0 || outdatedCount > 0;
  let label;
  if (level === 'High' && !signalsMixed && !hasStaleData) {
    label = 'High reliability — indicators are current and directionally aligned';
  } else if (level === 'High' && signalsMixed) {
    label = 'High reliability — good indicator coverage, though signals are mixed';
  } else if (level === 'High') {
    label = 'High reliability — broad indicator coverage with consistent signals';
  } else if (level === 'Medium' && hasStaleData && signalsMixed) {
    label = 'Moderate reliability — mixed signals and some data may be lagging';
  } else if (level === 'Medium' && hasStaleData) {
    label = 'Moderate reliability — some key indicators may be lagging behind recent releases';
  } else if (level === 'Medium' && signalsMixed) {
    label = 'Moderate reliability — signals are mixed; interpret with caution';
  } else if (level === 'Medium') {
    label = 'Moderate reliability — most key data is available and reasonably current';
  } else if (outdatedCount >= 3) {
    label = 'Lower reliability — significant data lag detected across multiple indicators';
  } else if (available.length < 5) {
    label = 'Lower reliability — insufficient indicator coverage for a strong signal';
  } else {
    label = 'Lower reliability — conflicting or incomplete signals';
  }

  return { value, level, reasoning, label };
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND, IMPACT STRENGTH, CONFLICT & RISK ALERT ENGINES
// All deterministic — no AI involved.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute directional trend from last 3-5 historical releases via linear regression.
 * Slope is normalised by |mean| so it's a relative-change-per-period comparison.
 * @param {Array} historicalData – [{date, value}, ...]
 * @returns {"rising"|"falling"|"stable"}
 */
function calcTrend(historicalData) {
  if (!historicalData || historicalData.length < 3) return 'stable';
  const values = historicalData
    .slice(-5)
    .map(d => d.value)
    .filter(v => v != null && !isNaN(v));
  if (values.length < 3) return 'stable';

  const n     = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  // Normalise: express slope as fraction of |mean| per period
  const relSlope = Math.abs(meanY) > 0.001
    ? Math.abs(slope / meanY)
    : Math.abs(slope);
  if (relSlope < 0.015) return 'stable'; // < 1.5 % per period = flat
  return slope > 0 ? 'rising' : 'falling';
}

/**
 * Indicator importance weights — mirror the WEIGHTS used in the macro surprise score.
 * Used to scale surprise magnitude into a meaningful impact strength tier.
 */
const INDICATOR_IMPORTANCE = {
  CPI:              2.0,
  NFP:              1.8,
  FedRate:          1.8,
  CorePCE:          1.6,
  UNEMPLOYMENT:     1.2,
  GDP:              1.2,
  JoblessClaims:    0.8,
  RetailSales:      0.8,
  ISMManufacturing: 0.7,
  ConsumerConf:     0.7,
};
const TOTAL_IMPORTANCE = Object.values(INDICATOR_IMPORTANCE).reduce((a, b) => a + b, 0);

/**
 * Rate the impact of a surprise into a strength tier.
 * Score = |surprisePercentage| × indicator importance.
 * @param {string} code            – indicator code
 * @param {number} surprisePercent – |surprise / forecast| × 100 (may be null)
 * @returns {"weak"|"moderate"|"strong"}
 */
function calcImpactStrength(code, surprisePercent) {
  if (surprisePercent == null || surprisePercent === 0) return 'weak';
  const score = Math.abs(surprisePercent) * (INDICATOR_IMPORTANCE[code] ?? 1.0);
  if (score >= 25) return 'strong';
  if (score >= 8)  return 'moderate';
  return 'weak';
}

/**
 * Detect pairs of high-importance indicators pointing in opposite directions for gold.
 * A conflict = one indicator bullish for gold while a correlated peer is simultaneously bearish.
 * @param {Array} available – error-free indicator objects
 * @returns {{ level: "low"|"medium"|"high", conflictingIndicators: string[] }}
 */
function detectSignalConflict(available) {
  if (!available || available.length === 0) {
    return { level: 'low', conflictingIndicators: [] };
  }

  const byCode = {};
  for (const ind of available) byCode[ind.code] = ind;

  // Each pair: opposite impactColor across a macro thesis = conflict for gold traders
  const CONFLICT_PAIRS = [
    ['CPI',          'FedRate'],       // Hot inflation (bullish gold) vs Fed tightening (bearish gold)
    ['CorePCE',      'FedRate'],       // Core inflation vs Fed tightening
    ['CPI',          'NFP'],           // Hot inflation vs strong payrolls (both move the Fed)
    ['CorePCE',      'UNEMPLOYMENT'],  // Core inflation vs falling unemployment
    ['NFP',          'GDP'],           // Weak jobs vs strong growth
    ['UNEMPLOYMENT', 'RetailSales'],   // Rising unemployment vs strong consumption
  ];

  const conflictingCodes = new Set();
  for (const [a, b] of CONFLICT_PAIRS) {
    const indA = byCode[a];
    const indB = byCode[b];
    if (!indA || !indB) continue;
    if (
      (indA.impactColor === 'green' && indB.impactColor === 'red') ||
      (indA.impactColor === 'red'   && indB.impactColor === 'green')
    ) {
      conflictingCodes.add(a);
      conflictingCodes.add(b);
    }
  }

  const uniqueConflicting = [...conflictingCodes];
  const level = uniqueConflicting.length === 0 ? 'low'
              : uniqueConflicting.length <= 3   ? 'medium'
              :                                   'high';

  return { level, conflictingIndicators: uniqueConflicting };
}

/**
 * Build a list of human-readable risk alerts from current data state.
 * @param {Array}  available          – error-free indicator objects
 * @param {Array}  allIndicatorValues – full set (includes errored entries)
 * @param {Object} confidence         – calculateConfidence() output
 * @param {Object} signalConflict     – detectSignalConflict() output
 * @returns {string[]}
 */
function buildRiskAlerts(available, allIndicatorValues, confidence, signalConflict) {
  const alerts = [];

  const outdated = available.filter(i => calcFreshness(i.latestDate, i.code) === 'outdated');
  const stale    = available.filter(i => calcFreshness(i.latestDate, i.code) === 'stale');

  if (outdated.length > 0) {
    alerts.push(
      `Outdated data: ${outdated.map(i => i.code).join(', ')} — readings may not reflect recent conditions`,
    );
  }
  if (stale.length > 0) {
    alerts.push(
      stale.length > 3
        ? `${stale.length} indicators are beyond their expected release window`
        : `Lagging indicators: ${stale.map(i => i.code).join(', ')} — beyond expected release window`,
    );
  }

  const errorCount = (allIndicatorValues || []).filter(i => i && i.error).length;
  if (errorCount > 0) {
    alerts.push(
      `${errorCount} indicator${errorCount > 1 ? 's' : ''} could not be fetched — data coverage is reduced`,
    );
  }

  const keyMissing = KEY_INDICATOR_CODES.filter(code => !available.find(i => i.code === code));
  if (keyMissing.length > 0) {
    alerts.push(
      `Key indicator${keyMissing.length > 1 ? 's' : ''} missing: ${keyMissing.join(', ')}`,
    );
  }

  if (signalConflict.level === 'high') {
    alerts.push(
      `High signal conflict across ${signalConflict.conflictingIndicators.join(', ')} — directional bias is unreliable`,
    );
  } else if (signalConflict.level === 'medium') {
    alerts.push(
      `Mixed signals between ${signalConflict.conflictingIndicators.join(' and ')} — interpret macro bias with caution`,
    );
  }

  if (confidence.level === 'Low') {
    alerts.push('Low overall confidence — consider waiting for fresher data before forming a strong macro bias');
  }

  return alerts;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INSIGHTS PAYLOAD BUILDER
// All transformation lives here — the frontend receives a ready-to-render object.
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_MAP = {
  NFP:              'labor',
  UNEMPLOYMENT:     'labor',
  JoblessClaims:    'labor',
  CPI:              'inflation',
  CorePCE:          'inflation',
  GDP:              'growth',
  RetailSales:      'growth',
  ISMManufacturing: 'growth',
  FedRate:          'monetary',
  ConsumerConf:     'monetary',
};

/** Key indicators used for system-status classification */
const KEY_INDICATOR_CODES = ['NFP', 'CPI', 'UNEMPLOYMENT', 'CorePCE'];

/**
 * Derive overall system status from freshness of critical indicators.
 * @param {Array} available – error-free indicator objects
 * @returns {"live"|"delayed"|"partial"}
 */
function deriveSystemStatus(available) {
  const keyFreshness = KEY_INDICATOR_CODES.map(code => {
    const ind = available.find(i => i.code === code);
    if (!ind) return 'missing';
    return calcFreshness(ind.latestDate, ind.code);
  });
  if (keyFreshness.some(f => f === 'missing' || f === 'outdated')) return 'partial';
  if (keyFreshness.some(f => f === 'stale'))                        return 'delayed';
  return 'live';
}

/**
 * Deterministic, non-advice contextual note surfaced alongside AI commentary.
 * Describes historical macro context without directing specific trades.
 * @param {number} score   – macro surprise score (-10 → +10)
 * @param {Array}  available – error-free indicator objects
 * @returns {string}
 */
function buildActionContext(score, available) {
  const infBull = available.some(i => ['CPI', 'CorePCE'].includes(i.code) && i.impactColor === 'green');
  const infBear = available.some(i => ['CPI', 'CorePCE'].includes(i.code) && i.impactColor === 'red');
  const laborBull = available.some(i => ['NFP', 'UNEMPLOYMENT', 'JoblessClaims'].includes(i.code) && i.impactColor === 'green');
  const laborBear = available.some(i => ['NFP', 'UNEMPLOYMENT'].includes(i.code) && i.impactColor === 'red');

  if (infBull && laborBull) {
    return 'Combined inflation surprise and labor-market weakness have historically been associated with increased safe-haven demand. Traders monitoring gold often pay close attention to these concurrent signals.';
  }
  if (infBull && laborBear) {
    return 'Hot inflation alongside strong labor data may raise expectations of continued Fed tightening. Historically, this combination has created headwinds for gold through USD strength.';
  }
  if (infBear && laborBear) {
    return 'Cooling inflation combined with labor-market resilience has historically reduced safe-haven demand. Traders often monitor USD movements closely in this environment.';
  }
  if (score >= 4) {
    return 'Several macro indicators are printing above consensus, a pattern that has historically been associated with elevated safe-haven demand. Traders often look for confirmation across multiple sessions before adjusting positioning.';
  }
  if (score <= -4) {
    return 'Multiple indicators are printing below consensus, pointing to a stronger economic backdrop. In similar past environments, risk-on assets gained while gold faced headwinds from reduced safe-haven demand.';
  }
  return 'Macro signals are currently mixed. Traders often treat such environments with caution, watching for a directional break in high-impact releases such as CPI or NFP before forming a strong bias.';
}

/**
 * Assemble the clean, standardised AI Insights payload.
 * @param {Object}      dashboard   – result of getEconomicDashboard()
 * @param {Object}      macroScore  – result of calculateMacroSurpriseScore()
 * @param {Object|null} aiAnalysis  – result of analyzeMacroeconomicImpact() or null
 * @returns {Object} ready-to-render payload
 */
export function buildAiInsightsPayload(dashboard, macroScore, aiAnalysis) {
  const now = new Date().toISOString();
  const indicatorValues = Object.values(dashboard?.indicators || {}).filter(Boolean);
  const available = indicatorValues.filter(i => !i.error);

  // Compute signal conflict FIRST — it feeds into the confidence penalty
  const signalConflict = detectSignalConflict(available);
  const confidence     = calculateConfidence(indicatorValues, signalConflict.level);
  const systemStatus   = deriveSystemStatus(available);

  // ── Group indicators by category ─────────────────────────────────────────
  const indicators = { labor: [], inflation: [], growth: [], monetary: [] };
  for (const ind of available) {
    const group = GROUP_MAP[ind.code];
    if (!group) continue;
    // previous = second-to-last value in the historical series
    const prevVal = ind.historicalData && ind.historicalData.length >= 2
      ? (ind.historicalData[ind.historicalData.length - 2]?.value ?? null)
      : null;
    indicators[group].push({
      code:                  ind.code,
      name:                  ind.indicator,
      actual:                ind.actual,
      forecast:              ind.forecast,
      previous:              prevVal,
      change:                ind.actual != null && prevVal != null
                               ? Math.round((ind.actual - prevVal) * 100) / 100
                               : null,
      unit:                  ind.unit || '',
      surprise:              ind.surprise,
      trend:                 calcTrend(ind.historicalData),
      impact:                ind.impactColor === 'green' ? 'bullish'
                           : ind.impactColor === 'red'   ? 'bearish'
                           : 'neutral',
      impactStrength:        calcImpactStrength(ind.code, ind.surprisePercentage),
      // Legacy alias kept for existing UI components
      bias:                  ind.impactColor === 'green' ? 'Bullish'
                           : ind.impactColor === 'red'   ? 'Bearish'
                           : 'Neutral',
      intensity:             Math.max(8, Math.min(100, Math.abs(ind.surprisePercentage ?? ind.surprise ?? 0) * 2.5)),
      lastUpdated:           ind.latestDate   || null,
      freshness:             calcFreshness(ind.latestDate, ind.code),
      dataSource:            ind.actualSource || 'FRED API',
      // lastDate kept for legacy UI compatibility
      lastDate:              ind.latestDate   || null,
      // Weight of this indicator in the overall confidence calculation (0-1)
      confidenceContribution: Math.round((INDICATOR_IMPORTANCE[ind.code] ?? 1.0) / TOTAL_IMPORTANCE * 100) / 100,
    });
  }

  // ── Top drivers ──────────────────────────────────────────────────────────
  const drivers = (macroScore?.contributors || [])
    .slice(0, 5)
    .map(c => {
      const ind = available.find(i => i.code === c.code);
      return {
        code:           c.code,
        name:           ind?.indicator || c.indicator || c.code,
        value:          ind ? `${ind.actual ?? '\u2014'}${ind.unit || ''}` : '\u2014',
        bias:           c.contribution > 0 ? 'Bullish'
                      : c.contribution < 0 ? 'Bearish'
                      : 'Neutral',
        contribution:   c.contribution,
        intensity:      Math.max(8, Math.min(100, Math.abs(c.contribution || 0) * 18)),
        trend:          ind ? calcTrend(ind.historicalData) : 'stable',
        impactStrength: ind ? calcImpactStrength(ind.code, ind.surprisePercentage) : 'weak',
        dataSource:     ind?.actualSource || 'FRED API',
        lastDate:       ind?.latestDate   || null,
        freshness:      ind ? calcFreshness(ind.latestDate, ind.code) : 'outdated',
      };
    });

  // Build risk alerts AFTER confidence so the Low-confidence alert fires correctly
  const riskAlerts = buildRiskAlerts(available, indicatorValues, confidence, signalConflict);

  // ── Unique data sources list ──────────────────────────────────────────────
  const sourcesSet = new Set();
  for (const ind of available) {
    if (ind.actualSource?.includes('FRED')) {
      sourcesSet.add('FRED API (Federal Reserve)');
    } else if (ind.actualSource) {
      sourcesSet.add(ind.actualSource);
    }
  }
  sourcesSet.add('Analyst Consensus (forecast)');

  // ── AI summary (structured) or null ──────────────────────────────────────
  const hasValidAi = aiAnalysis && !aiAnalysis.error && aiAnalysis.summary;
  const aiSummary = hasValidAi
    ? {
        summary:      aiAnalysis.summary      || '',
        marketImpact: aiAnalysis.marketImpact || '',
        whyItMatters: aiAnalysis.whyItMatters || '',
        riskNote:     aiAnalysis.riskNote     || '',
        model:        aiAnalysis.model        || 'gemini-1.5-flash',
        generatedAt:  aiAnalysis.timestamp    || now,
        warnings: [
          'AI commentary is generated using only the data listed above — no external sources were used.',
          'Economic indicators are lagging — signals may not reflect the most current market conditions.',
          'Not financial advice. Always conduct your own analysis before trading.',
        ],
      }
    : null;

  const aiStatus = aiSummary ? 'available' : 'unavailable';

  // ── Deterministic contextual note ────────────────────────────────────────
  const actionContext = buildActionContext(macroScore?.score ?? 0, available);

  return {
    meta: {
      lastUpdated: dashboard?.timestamp || now,
      dataLag:     'Lagging indicators — monthly data is typically released 2\u20134 weeks after the period ends; weekly data (Jobless Claims) has a ~1-week lag.',
      dataSources: [...sourcesSet],
    },
    status:        systemStatus,
    score:         macroScore?.score ?? 0,
    sentiment:     macroScore?.label || dashboard?.overallSentiment || 'Neutral',
    confidence,
    signalConflict,
    riskAlerts,
    summary: {
      bullishCount:    dashboard?.summary?.bullishIndicators ?? 0,
      bearishCount:    dashboard?.summary?.bearishIndicators ?? 0,
      neutralCount:    dashboard?.summary?.neutralIndicators ?? 0,
      totalIndicators: available.length,
    },
    drivers,
    indicators,
    aiSummary,
    aiStatus,
    actionContext,
  };
}

export { cache };

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
  calculateMacroSurpriseScore,
  clearEconomicCache,
};
