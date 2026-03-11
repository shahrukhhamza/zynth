import axios from 'axios';
import NodeCache from 'node-cache';
import { getRealEconomicData as getRealDataFromConfig } from '../config/economicData.js';
import apiDataService from './apiDataService.js';
import geminiAnalysisService from './geminiAnalysisService.js';
import * as webScraperService from './webScraperService.js';
import * as freeApiService from './freeApiService.js';
import geminiWebSearchService from './geminiWebSearchService.js';

// Cache for 2 minutes (120s) for near real-time updates
const cache = new NodeCache({ stdTTL: 120 });

// Data source configuration
const USE_FREE_APIS = process.env.USE_FREE_APIS !== 'false'; // Default true - FREE APIS
const USE_WEB_SCRAPING = process.env.USE_WEB_SCRAPING === 'true'; // Changed to opt-in
const USE_API_DATA = process.env.USE_API_DATA === 'true';
const USE_REAL_DATA = process.env.USE_REAL_ECONOMIC_DATA !== 'false'; // Default true
const USE_AI_ANALYSIS = process.env.USE_GEMINI_AI === 'true';

/**
 * Economic Calendar Service
 *
 * Data source priority (highest accuracy first):
 *  0. Gemini AI + Google Search grounding  ← PRIMARY (live web search)
 *  1. Old Gemini prompt (training-data fallback)
 *  2. Free APIs (FMP, EconDB)
 *  3. Web scraping (Investing.com, ForexFactory)
 *  4. FRED / Alpha Vantage APIs
 *  5. Verified config file (static 2026 data)
 *  6. Mock data (dev only)
 */

async function getEconomicCalendar() {
  try {
    const cacheKey = 'economic_calendar';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('✓ Returning cached calendar data');
      return cached;
    }
    
    let data;
    let dataSource = 'unknown';

    // ─────────────────────────────────────────────────────────────────────
    // STEP 0: Gemini AI + Google Search grounding  (PRIMARY — live web data)
    // ─────────────────────────────────────────────────────────────────────
    const USE_GEMINI_WEBSEARCH = process.env.USE_GEMINI_WEBSEARCH !== 'false'; // default ON
    if (USE_GEMINI_WEBSEARCH && process.env.GEMINI_API_KEY) {
      try {
        console.log('🌐 [Step 0] Gemini + Google Search: fetching live economic data...');
        const wsResult = await geminiWebSearchService.fetchLatestReleasedData();

        if (wsResult && wsResult.indicators && wsResult.indicators.length > 0) {
          console.log(`✅ [Step 0] Gemini web search: ${wsResult.indicators.length} indicators from live web`);
          data = transformWebSearchDataToCalendar(wsResult);
          dataSource = `Gemini AI + Google Search (${wsResult.model})`;
        }
      } catch (error) {
        console.error('✗ [Step 0] Gemini web search failed:', error.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Old Gemini prompt (training-data — less accurate)
    // ─────────────────────────────────────────────────────────────────────
    const USE_GEMINI_DATA = process.env.USE_GEMINI_DATA !== 'false'; // Default true
    if (!data && USE_GEMINI_DATA) {
      try {
        console.log('🤖 [Step 1] Attempting Gemini AI (training-data fallback)...');
        const geminiData = await geminiAnalysisService.fetchEconomicDataWithGemini();
        
        if (geminiData && geminiData.data && geminiData.data.length > 0) {
          console.log(`✅ [Step 1] Gemini: ${geminiData.data.length} indicators`);
          data = await transformGeminiDataToCalendar(geminiData);
          dataSource = geminiData.source;
        }
      } catch (error) {
        console.error('✗ [Step 1] Gemini data fetch failed:', error.message);
      }
    }
    
    // STEP 2: Try FREE APIs (Financial Modeling Prep, EconDB)
    if (!data && USE_FREE_APIS) {
      try {
        console.log('🆓 Attempting FREE API sources (FMP, EconDB)...');
        const freeApiData = await freeApiService.fetchFreeEconomicCalendar();
        
        if (freeApiData && freeApiData.data && freeApiData.data.length > 0) {
          console.log(`✅ SUCCESS: Got REAL data from ${freeApiData.source}`);
          data = await transformFreeApiDataToCalendar(freeApiData);
          dataSource = freeApiData.source;
        }
      } catch (error) {
        console.error('✗ Free API fetch failed:', error.message);
      }
    }
    
    // STEP 3: Try WEB SCRAPING (Investing.com, ForexFactory) if free APIs failed
    if (!data && USE_WEB_SCRAPING) {
      try {
        console.log('🌐 Attempting web scraping from economic calendars...');
        const scrapedData = await webScraperService.fetchEconomicCalendarData();
        
        if (scrapedData && scrapedData.data) {
          console.log(`✅ SUCCESS: Got REAL data from ${scrapedData.source}`);
          data = await transformScrapedDataToCalendar(scrapedData);
          dataSource = scrapedData.source;
        }
      } catch (error) {
        console.error('✗ Web scraping failed:', error.message);
      }
    }
    
    // STEP 4: Try fetching from APIs (FRED, Alpha Vantage) if other methods failed
    if (!data && USE_API_DATA) {
      try {
        console.log('📊 Fetching REAL data from APIs (FRED, Alpha Vantage)...');
        const apiData = await apiDataService.fetchAllEconomicData();
        
        if (apiData && apiData.fred) {
          console.log('✓ Using REAL API data from Federal Reserve (FRED)');
          data = await transformApiDataToCalendar(apiData.fred);
          dataSource = 'FRED API';
        }
      } catch (error) {
        console.error('✗ API fetch failed:', error.message);
      }
    }
    
    // STEP 5: Fallback to config file (verified 2026 data)
    if (!data) {
      if (USE_REAL_DATA) {
        console.log('✓ Using verified config file data (Fair Economy 2026)');
        data = getRealDataFromConfig();
        dataSource = 'Verified Config (Fair Economy)';
      } else {
        console.log('⚠️ Using mock data (development only)');
        data = generateEconomicData();
        dataSource = 'Mock Data';
      }
    }
    
    // FINAL STEP: Optionally enhance with AI text analysis (no number generation)
    if (USE_AI_ANALYSIS && data && data.length > 0) {
      try {
        console.log('🤖 Generating AI text insights (analysis only, no numbers)...');
        data = await enhanceWithAIAnalysis(data);
      } catch (error) {
        console.error('✗ AI analysis failed (continuing without insights):', error.message);
      }
    }
    
    console.log(`✓ Calendar ready: ${data.length} indicators from ${dataSource}`);
    
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('✗ Calendar service error:', error);
    
    // Emergency fallback
    const fallbackData = getRealDataFromConfig();
    return fallbackData;
  }
}

/**
 * Force-refresh the calendar: clear all caches and re-fetch via Gemini web search.
 * Used by POST /api/calendar/refresh.
 */
async function forceRefreshCalendar() {
  cache.flushAll();
  console.log('🔄 Force-refresh triggered — clearing calendar cache and re-fetching via Gemini web search');

  // Run full Gemini web search + cross-verification
  const wsResult = await geminiWebSearchService.forceRefreshAllData();

  if (!wsResult || !wsResult.indicators || wsResult.indicators.length === 0) {
    throw new Error('Force-refresh: Gemini web search returned no data');
  }

  const calendarData = transformWebSearchDataToCalendar(wsResult);

  // Store in calendar cache
  cache.set('economic_calendar', calendarData);

  return {
    indicators: calendarData,
    fetchedAt: wsResult.fetchedAt,
    verifiedAt: wsResult.verifiedAt,
    correctionCount: wsResult.correctionCount || 0,
    model: wsResult.model,
    sources: wsResult.sources || [],
  };
}

/**
 * Transform Gemini web-search result to calendar format.
 * This is the primary transform for Step 0 data.
 */
function transformWebSearchDataToCalendar(wsResult) {
  const { indicators, sources = [], fetchedAt, verifiedAt, model } = wsResult;

  return indicators.map(ind => {
    const id = (ind.id || ind.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const impactLevel =
      ind.impact === 'high' || ind.impact === 3
        ? 'high'
        : ind.impact === 'low' || ind.impact === 1
        ? 'low'
        : 'medium';

    // Release time — most US econ data drops at 08:30 ET
    const releaseTime = knownReleaseTimes[id] || '08:30';

    return {
      id,
      name: ind.name,
      currency: ind.currency || 'USD',
      impact: impactLevel,
      current: parseFloat(ind.actual),
      forecast: parseFloat(ind.forecast),
      previous: parseFloat(ind.previous),
      date: ind.releaseDate || new Date().toISOString().split('T')[0],
      time: releaseTime,
      reportingPeriod: ind.reportingPeriod || '',
      source: ind.source || 'Gemini AI + Google Search',
      dataSource: `Gemini AI + Google Search (${model || 'gemini-2.0-flash'})`,
      webVerified: true,
      corrected: ind.corrected || false,
      verificationSources: sources.slice(0, 3).map(s => s.url).filter(Boolean),
      fetchedAt: fetchedAt || new Date().toISOString(),
      verifiedAt: verifiedAt || null,
      description: getDescriptionForIndicator(id),
      usualEffect: getEffectForIndicator(id),
      frequency: getFrequencyForIndicator(id),
      unit: ind.unit || '',
      lastUpdated: new Date().toISOString(),
      historicalData: [],
      releases: [{
        date: ind.releaseDate || new Date().toISOString().split('T')[0],
        time: releaseTime,
        actual: parseFloat(ind.actual),
        forecast: parseFloat(ind.forecast),
        previous: parseFloat(ind.previous),
        reportingPeriod: ind.reportingPeriod || '',
      }],
    };
  });
}

// Known ET release times for US economic indicators
const knownReleaseTimes = {
  nfp: '08:30',
  unemployment: '08:30',
  avg_hourly_earnings: '08:30',
  avg_hourly_earnings_mm: '08:30',
  cpi_mm: '08:30',
  cpi_yy: '08:30',
  core_cpi: '08:30',
  core_cpi_mm: '08:30',
  ppi: '08:30',
  ppi_mm: '08:30',
  retail_sales: '08:30',
  retail_sales_mm: '08:30',
  gdp: '08:30',
  gdp_qq: '08:30',
  pce: '08:30',
  pce_price_index_mm: '08:30',
  fed_funds: '14:00',
  fed_funds_rate: '14:00',
  ism_manufacturing: '10:00',
  ism_manufacturing_pmi: '10:00',
  ism_services: '10:00',
  ism_services_pmi: '10:00',
};

/**
 * Transform API data to calendar format
 */
async function transformApiDataToCalendar(fredData) {
  const indicators = [];

  // Transform NFP data
  if (fredData.nfp && fredData.nfp.length > 0) {
    const latest = fredData.nfp[0];
    const previous = fredData.nfp[1] || latest;

    indicators.push({
      id: 'nfp',
      name: 'Non-Farm Employment Change',
      currency: 'USD',
      impact: 'high',
      current: latest.value,
      forecast: Math.round(latest.value * 0.9), // Note: FRED doesn't provide forecasts
      previous: previous.value,
      date: latest.date,
      time: '08:30',
      source: 'FRED API (Bureau of Labor Statistics)',
      description: 'Change in the number of employed people during the previous month, excluding the farming industry',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly, first Friday after month ends',
      unit: 'K',
      historicalData: fredData.nfp.slice(0, 12).map((d, i) => ({
        date: d.date,
        actual: d.value,
        forecast: Math.round(d.value * 0.9),
        previous: fredData.nfp[i + 1]?.value || 0,
      })),
    });
  }

  // Transform Unemployment data
  if (fredData.unemployment && fredData.unemployment.length > 0) {
    const latest = fredData.unemployment[0];
    const previous = fredData.unemployment[1] || latest;

    indicators.push({
      id: 'unemployment',
      name: 'Unemployment Rate',
      currency: 'USD',
      impact: 'high',
      current: latest.value,
      forecast: latest.value,
      previous: previous.value,
      date: latest.date,
      time: '08:30',
      source: 'FRED API (Bureau of Labor Statistics)',
      description: 'Percentage of the total work force that is unemployed and actively seeking employment',
      usualEffect: 'Actual less than Forecast is good for currency',
      frequency: 'Monthly, first Friday',
      unit: '%',
      historicalData: fredData.unemployment.slice(0, 12).map((d, i) => ({
        date: d.date,
        actual: d.value,
        forecast: d.value,
        previous: fredData.unemployment[i + 1]?.value || 0,
      })),
    });
  }

  // Transform CPI data
  if (fredData.cpi && fredData.cpi.length > 0) {
    const latest = fredData.cpi[0];
    const previous = fredData.cpi[1] || latest;
    const monthlyChange = ((latest.value - previous.value) / previous.value * 100).toFixed(1);

    indicators.push({
      id: 'cpi',
      name: 'Consumer Price Index m/m',
      currency: 'USD',
      impact: 'high',
      current: parseFloat(monthlyChange),
      forecast: parseFloat(monthlyChange),
      previous: 0,
      date: latest.date,
      time: '08:30',
      source: 'FRED API (Bureau of Labor Statistics)',
      description: 'Change in the price of goods and services purchased by consumers',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly',
      unit: '%',
      historicalData: fredData.cpi.slice(0, 12).map((d, i) => {
        const prev = fredData.cpi[i + 1];
        const change = prev ? ((d.value - prev.value) / prev.value * 100).toFixed(1) : 0;
        return {
          date: d.date,
          actual: parseFloat(change),
          forecast: parseFloat(change),
          previous: prev ? 0 : 0,
        };
      }),
    });
  }

  return indicators;
}

/**
 * Enhance calendar data with AI text analysis
 * CRITICAL: This does NOT generate numbers, only text insights!
 */
async function enhanceWithAIAnalysis(calendarData) {
  try {
    const enhanced = await Promise.all(
      calendarData.map(async (indicator) => {
        // Only analyze high-impact indicators
        if (indicator.impact !== 'high') {
          return indicator;
        }

        let aiInsights = null;
        let scenarioAnalysis = null;
        
        // Get AI text analysis (NO number generation)
        if (indicator.id === 'nfp') {
          aiInsights = await geminiAnalysisService.analyzeNFPImpact({
            actual: indicator.current,
            forecast: indicator.forecast,
            previous: indicator.previous,
            date: indicator.date,
          });
        }

        // Get scenario analysis (hypothetical text only)
        scenarioAnalysis = await geminiAnalysisService.generateScenarioAnalysis(indicator);

        return {
          ...indicator,
          aiInsights: aiInsights,
          scenarioAnalysis: scenarioAnalysis,
          enhancedByAI: aiInsights || scenarioAnalysis ? true : false,
        };
      })
    );

    return enhanced;
  } catch (error) {
    console.error('✗ AI enhancement error:', error.message);
    return calendarData; // Return original data if AI fails
  }
}

/**
 * Generate mock data (development/testing only)
 */
function generateEconomicData() {
  const currentDate = new Date();
  
  const indicators = [
    {
      id: 'nfp',
      name: 'Non-Farm Employment Change',
      currency: 'USD',
      impact: 'high',
      current: Math.floor(Math.random() * 300) - 100,
      forecast: Math.floor(Math.random() * 200),
      previous: Math.floor(Math.random() * 200),
      date: currentDate.toISOString().split('T')[0],
      time: '08:30',
      source: 'Mock Data (Development Only)',
      description: 'Change in the number of employed people during the previous month',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly',
      unit: 'K',
    },
    {
      id: 'unemployment',
      name: 'Unemployment Rate',
      currency: 'USD',
      impact: 'high',
      current: (Math.random() * 2 + 3).toFixed(1),
      forecast: (Math.random() * 2 + 3).toFixed(1),
      previous: (Math.random() * 2 + 3).toFixed(1),
      date: currentDate.toISOString().split('T')[0],
      time: '08:30',
      source: 'Mock Data (Development Only)',
      unit: '%',
    },
  ];

  return indicators;
}

async function getIndicatorDetails(indicatorId) {
  try {
    const calendar = await getEconomicCalendar();
    const indicator = calendar.find(ind => ind.id === indicatorId);
    
    if (!indicator) {
      throw new Error('Indicator not found');
    }
    
    return indicator;
  } catch (error) {
    console.error('Error fetching indicator details:', error);
    throw error;
  }
}

/**
 * Transform free API data to our calendar format
 */
async function transformFreeApiDataToCalendar(freeApiResult) {
  const { data, source } = freeApiResult;
  
  // Data is already in our standard format from freeApiService
  // Just need to ensure it matches our calendar structure
  return data.map(indicator => ({
    id: indicator.id || `${indicator.name.replace(/\s+/g, '_').toLowerCase()}`,
    name: indicator.name,
    currency: indicator.currency || 'USD',
    impact: indicator.impact === 3 ? 'high' : indicator.impact === 2 ? 'medium' : 'low',
    current: indicator.current,
    forecast: indicator.forecast,
    previous: indicator.previous,
    date: indicator.date,
    time: indicator.time || '08:30',
    source: `${source} (Free API)`,
    description: getDescriptionForIndicator(indicator.name.toLowerCase()) || `Economic indicator from ${source}`,
    usualEffect: getEffectForIndicator(indicator.name.toLowerCase()) || 'Impact varies by context',
    frequency: 'Monthly',
    unit: indicator.unit || '',
    lastUpdated: new Date().toISOString(),
    historicalData: [] // Can be populated if available
  }));
}

/**
 * Transform Gemini AI data to our calendar format
 */
async function transformGeminiDataToCalendar(geminiResult) {
  const { data, source } = geminiResult;
  
  // Gemini provides data in our requested format, just need to normalize
  return data.map(indicator => {
    // Determine impact level
    let impactLevel = 'medium';
    if (indicator.impact === 'high' || indicator.impact === 3) {
      impactLevel = 'high';
    } else if (indicator.impact === 'low' || indicator.impact === 1) {
      impactLevel = 'low';
    }

    // Generate ID from name
    const id = indicator.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '')
      .replace(/_+/g, '_');

    return {
      id: id,
      name: indicator.name,
      currency: indicator.currency || 'USD',
      impact: impactLevel,
      current: parseFloat(indicator.actual),
      forecast: parseFloat(indicator.forecast),
      previous: parseFloat(indicator.previous),
      date: indicator.date,
      time: indicator.time || '08:30',
      source: `${source} (AI-powered)`,
      description: getDescriptionForIndicator(id) || indicator.description || `Economic indicator fetched via AI search`,
      usualEffect: getEffectForIndicator(id) || 'Impact varies by context',
      frequency: indicator.frequency || 'Monthly',
      unit: indicator.unit || '',
      lastUpdated: new Date().toISOString(),
      historicalData: indicator.historicalData || []
    };
  });
}

/**
 * Transform scraped web data to our calendar format
 */
async function transformScrapedDataToCalendar(scrapedResult) {
  const { data, source } = scrapedResult;
  const indicators = [];

  // Transform each scraped indicator
  for (const [key, indicator] of Object.entries(data)) {
    indicators.push({
      id: key,
      name: indicator.name,
      currency: 'USD',
      impact: indicator.impact || 'high',
      current: indicator.actual,
      forecast: indicator.forecast,
      previous: indicator.previous,
      date: indicator.date ? new Date(indicator.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: extractTime(indicator.date) || '08:30',
      source: `${source} (Auto-fetched)`,
      description: getDescriptionForIndicator(key),
      usualEffect: getEffectForIndicator(key),
      frequency: 'Monthly',
      unit: indicator.unit || '',
      lastUpdated: new Date().toISOString(),
      historicalData: [] // Can be populated from historical scraping
    });
  }

  return indicators;
}

/**
 * Helper: Extract time from date string
 */
function extractTime(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toTimeString().slice(0, 5);
  } catch {
    return null;
  }
}

/**
 * Helper: Get description for indicator
 */
function getDescriptionForIndicator(key) {
  const keyLower = key.toLowerCase();
  
  const descriptions = {
    nfp: 'Change in the number of employed people during the previous month, excluding the farming industry',
    non_farm_employment_change: 'Change in the number of employed people during the previous month, excluding the farming industry',
    nonfarm_payrolls: 'Change in the number of employed people during the previous month, excluding the farming industry',
    unemployment: 'Percentage of the total work force that is unemployed and actively seeking employment',
    unemployment_rate: 'Percentage of the total work force that is unemployed and actively seeking employment',
    cpi: 'Change in the price of goods and services purchased by consumers',
    cpi_mm: 'Month-over-month change in the price of goods and services purchased by consumers',
    cpi_yy: 'Year-over-year change in the price of goods and services purchased by consumers',
    core_cpi: 'Change in the price of goods and services purchased by consumers, excluding food and energy',
    core_cpi_mm: 'Month-over-month change in CPI excluding food and energy',
    consumer_price_index: 'Change in the price of goods and services purchased by consumers',
    inflation: 'Change in the price of goods and services purchased by consumers',
    ppi: 'Change in the price of finished goods and services sold by producers',
    ppi_mm: 'Month-over-month change in the price of finished goods sold by producers',
    producer_price_index: 'Change in the price of finished goods and services sold by producers',
    retail: 'Change in the total value of sales at the retail level',
    retail_sales: 'Change in the total value of retail-level sales across the US',
    retail_sales_mm: 'Month-over-month change in the total value of retail sales',
    gdp: 'Annualized change in the inflation-adjusted value of all goods and services produced',
    gdp_qq: 'Quarter-over-quarter annualized GDP growth rate',
    gdp_growth_rate: 'Annualized change in the inflation-adjusted value of all goods and services',
    pce: 'Change in the price of goods and services purchased by consumers (Fed preferred inflation measure)',
    pce_price_index_mm: 'Month-over-month change in the PCE price index (Fed preferred inflation gauge)',
    fed_funds: 'Federal Reserve target interest rate range midpoint',
    fed_funds_rate: 'Federal Reserve target interest rate',
    avg_hourly_earnings: 'Month-over-month change in average hourly earnings across all industries',
    avg_hourly_earnings_mm: 'Month-over-month change in average hourly wages',
    ism_manufacturing: 'Survey-based index of manufacturing sector activity (above 50 = expansion)',
    ism_manufacturing_pmi: 'ISM survey-based manufacturing PMI (above 50 = expansion)',
    ism_services: 'Survey-based index of services sector activity (above 50 = expansion)',
    ism_services_pmi: 'ISM survey-based services PMI (above 50 = expansion)',
  };
  
  return descriptions[keyLower] || descriptions[key] || 'Economic indicator';
}

/**
 * Helper: Get usual market effect for indicator
 */
function getEffectForIndicator(key) {
  const keyLower = key.toLowerCase();
  
  const effects = {
    nfp: 'Actual greater than Forecast is good for currency',
    non_farm_employment_change: 'Actual greater than Forecast is good for currency',
    nonfarm_payrolls: 'Actual greater than Forecast is good for currency',
    unemployment: 'Actual less than Forecast is good for currency',
    unemployment_rate: 'Actual less than Forecast is good for currency',
    cpi: 'Actual greater than Forecast is good for currency',
    cpi_mm: 'Actual greater than Forecast is good for currency',
    cpi_yy: 'Actual greater than Forecast is good for currency',
    core_cpi: 'Actual greater than Forecast is good for currency',
    core_cpi_mm: 'Actual greater than Forecast is good for currency',
    consumer_price_index: 'Actual greater than Forecast is good for currency',
    inflation: 'Actual greater than Forecast is good for currency',
    ppi: 'Actual greater than Forecast is good for currency',
    ppi_mm: 'Actual greater than Forecast is good for currency',
    producer_price_index: 'Actual greater than Forecast is good for currency',
    retail: 'Actual greater than Forecast is good for currency',
    retail_sales: 'Actual greater than Forecast is good for currency',
    retail_sales_mm: 'Actual greater than Forecast is good for currency',
    gdp: 'Actual greater than Forecast is good for currency',
    gdp_qq: 'Actual greater than Forecast is good for currency',
    gdp_growth_rate: 'Actual greater than Forecast is good for currency',
    pce: 'Actual greater than Forecast is good for currency',
    pce_price_index_mm: 'Actual greater than Forecast is good for currency',
    fed_funds: 'No direct forex impact — rate changes affect forward guidance',
    fed_funds_rate: 'No direct forex impact — rate changes affect forward guidance',
    avg_hourly_earnings: 'Actual greater than Forecast is good for currency',
    avg_hourly_earnings_mm: 'Actual greater than Forecast is good for currency',
    ism_manufacturing: 'Actual greater than Forecast is good for currency',
    ism_manufacturing_pmi: 'Actual greater than Forecast is good for currency',
    ism_services: 'Actual greater than Forecast is good for currency',
    ism_services_pmi: 'Actual greater than Forecast is good for currency',
  };
  
  return effects[keyLower] || effects[key] || 'Impact varies by context';
}

/**
 * Helper: Get release frequency for indicator
 */
function getFrequencyForIndicator(key) {
  const keyLower = key.toLowerCase();

  const frequencies = {
    nfp: 'Monthly, first Friday after month ends',
    non_farm_employment_change: 'Monthly, first Friday after month ends',
    unemployment: 'Monthly, first Friday',
    unemployment_rate: 'Monthly, first Friday',
    cpi: 'Monthly, mid-month',
    cpi_mm: 'Monthly, mid-month',
    cpi_yy: 'Monthly, mid-month',
    core_cpi: 'Monthly, mid-month',
    core_cpi_mm: 'Monthly, mid-month',
    ppi: 'Monthly',
    ppi_mm: 'Monthly',
    retail_sales: 'Monthly',
    retail_sales_mm: 'Monthly',
    gdp: 'Quarterly (advance, preliminary, final)',
    gdp_qq: 'Quarterly',
    pce: 'Monthly',
    pce_price_index_mm: 'Monthly',
    fed_funds: 'Every 6-8 weeks at FOMC meetings',
    fed_funds_rate: 'Every 6-8 weeks at FOMC meetings',
    avg_hourly_earnings: 'Monthly, first Friday',
    avg_hourly_earnings_mm: 'Monthly, first Friday',
    ism_manufacturing: 'Monthly, first business day',
    ism_manufacturing_pmi: 'Monthly, first business day',
    ism_services: 'Monthly, third business day',
    ism_services_pmi: 'Monthly, third business day',
  };

  return frequencies[keyLower] || frequencies[key] || 'Monthly';
}

export {
  getEconomicCalendar,
  getIndicatorDetails,
  forceRefreshCalendar,
};

