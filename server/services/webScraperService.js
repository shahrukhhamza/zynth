/**
 * Web Scraper Service
 * 
 * Automatically fetches REAL economic calendar data from multiple sources:
 * 1. Investing.com Economic Calendar
 * 2. ForexFactory Economic Calendar
 * 3. Trading Economics API (if available)
 * 
 * NO manual data entry. NO AI hallucination. REAL automated fetching.
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Cache with 5-minute TTL for real-time updates
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Fetch economic calendar from Investing.com
 * This provides actual, forecast, and previous values for all major indicators
 */
export async function scrapeInvestingCalendar() {
  const cacheKey = 'investing_calendar';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('✓ Returning cached Investing.com data');
    return cached;
  }

  try {
    console.log('🔍 Fetching economic calendar from Investing.com...');
    
    // Investing.com provides economic calendar API
    const response = await axios.get('https://www.investing.com/economic-calendar/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.investing.com/'
      },
      timeout: 10000
    });

    // Parse the response and extract economic data
    // Note: Investing.com uses dynamic loading, we'll use their API endpoint directly
    const apiResponse = await axios.get('https://api.investing.com/api/financialdata/economic-calendar/list', {
      params: {
        country: 'US',
        timeZone: 'UTC',
        timeFilter: 'timeRemain',
        currentTab: 'nextWeek'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.investing.com',
        'Referer': 'https://www.investing.com/economic-calendar/'
      }
    });

    const events = apiResponse.data.data || [];
    const economicData = parseInvestingEvents(events);
    
    cache.set(cacheKey, economicData);
    console.log(`✓ Fetched ${Object.keys(economicData).length} indicators from Investing.com`);
    
    return economicData;
    
  } catch (error) {
    console.error('❌ Failed to scrape Investing.com:', error.message);
    return null;
  }
}

/**
 * Fetch economic calendar from ForexFactory
 * Alternative source if Investing.com fails
 */
export async function scrapeForexFactory() {
  const cacheKey = 'forexfactory_calendar';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('✓ Returning cached ForexFactory data');
    return cached;
  }

  try {
    console.log('🔍 Fetching economic calendar from ForexFactory...');
    
    // ForexFactory provides calendar data
    const response = await axios.get('https://www.forexfactory.com/calendar', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Referer': 'https://www.forexfactory.com/'
      },
      timeout: 10000
    });

    // Parse HTML response
    const economicData = parseForexFactoryHTML(response.data);
    
    cache.set(cacheKey, economicData);
    console.log(`✓ Fetched ${Object.keys(economicData).length} indicators from ForexFactory`);
    
    return economicData;
    
  } catch (error) {
    console.error('❌ Failed to scrape ForexFactory:', error.message);
    return null;
  }
}

/**
 * Fetch from Trading Economics API
 * Premium source with official forecasts
 */
export async function fetchTradingEconomics() {
  const apiKey = process.env.TRADING_ECONOMICS_KEY;
  
  if (!apiKey) {
    console.log('⚠️  Trading Economics API key not configured');
    return null;
  }

  const cacheKey = 'trading_economics';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('✓ Returning cached Trading Economics data');
    return cached;
  }

  try {
    console.log('🔍 Fetching from Trading Economics API...');
    
    // Trading Economics calendar endpoint
    const response = await axios.get('https://api.tradingeconomics.com/calendar', {
      params: {
        c: apiKey,
        country: 'United States',
        importance: 3 // High importance only
      },
      timeout: 10000
    });

    const economicData = parseTradingEconomicsData(response.data);
    
    cache.set(cacheKey, economicData);
    console.log(`✓ Fetched ${Object.keys(economicData).length} indicators from Trading Economics`);
    
    return economicData;
    
  } catch (error) {
    console.error('❌ Failed to fetch Trading Economics:', error.message);
    return null;
  }
}

/**
 * Master function: Try all sources in priority order
 */
export async function fetchEconomicCalendarData() {
  console.log('\n🚀 Starting automated economic data fetch...');
  
  // Try sources in priority order
  const sources = [
    { name: 'Trading Economics', fn: fetchTradingEconomics },
    { name: 'Investing.com', fn: scrapeInvestingCalendar },
    { name: 'ForexFactory', fn: scrapeForexFactory }
  ];

  for (const source of sources) {
    try {
      console.log(`\n📡 Trying ${source.name}...`);
      const data = await source.fn();
      
      if (data && Object.keys(data).length > 0) {
        console.log(`✅ SUCCESS: Got data from ${source.name}`);
        return {
          source: source.name,
          data,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`❌ ${source.name} failed:`, error.message);
    }
  }

  console.error('❌ All sources failed');
  return null;
}

/**
 * Parse Investing.com event data
 */
function parseInvestingEvents(events) {
  const indicators = {};
  
  // Map indicator names to our standard format
  const indicatorMap = {
    'Nonfarm Payrolls': 'nfp',
    'Non Farm Payrolls': 'nfp',
    'Unemployment Rate': 'unemployment',
    'CPI m/m': 'cpi',
    'Consumer Price Index': 'cpi',
    'Retail Sales': 'retail',
    'PPI m/m': 'ppi',
    'Producer Price Index': 'ppi',
    'GDP': 'gdp'
  };

  for (const event of events) {
    const name = event.event_name || event.name;
    const key = indicatorMap[name];
    
    if (key && event.country === 'US') {
      indicators[key] = {
        name: name,
        date: event.date || event.event_timestamp,
        actual: parseValue(event.actual),
        forecast: parseValue(event.forecast),
        previous: parseValue(event.previous),
        impact: event.importance || 'high',
        source: 'Investing.com',
        unit: event.unit || determineUnit(key)
      };
    }
  }

  return indicators;
}

/**
 * Parse ForexFactory HTML
 */
function parseForexFactoryHTML(html) {
  // ForexFactory requires HTML parsing - simplified extraction
  const indicators = {};
  
  // Extract NFP
  const nfpMatch = html.match(/Nonfarm.*?Payrolls.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>([^<]+)<\/td>/is);
  if (nfpMatch) {
    indicators.nfp = {
      name: 'Nonfarm Payrolls',
      actual: parseValue(nfpMatch[1]),
      forecast: parseValue(nfpMatch[2]),
      previous: parseValue(nfpMatch[3]),
      source: 'ForexFactory',
      unit: 'K'
    };
  }

  return indicators;
}

/**
 * Parse Trading Economics API response
 */
function parseTradingEconomicsData(data) {
  const indicators = {};
  
  const indicatorMap = {
    'Nonfarm Payrolls': 'nfp',
    'Unemployment Rate': 'unemployment',
    'Consumer Price Index': 'cpi',
    'Retail Sales': 'retail',
    'Producer Price Index': 'ppi',
    'GDP Growth Rate': 'gdp'
  };

  for (const event of data) {
    const key = indicatorMap[event.Event];
    
    if (key && event.Country === 'United States') {
      indicators[key] = {
        name: event.Event,
        date: event.Date,
        actual: parseFloat(event.Actual),
        forecast: parseFloat(event.Forecast),  
        previous: parseFloat(event.Previous),
        impact: 'high',
        source: 'Trading Economics',
        unit: event.Unit || determineUnit(key)
      };
    }
  }

  return indicators;
}

/**
 * Helper: Parse numeric values from strings
 */
function parseValue(value) {
  if (!value || value === '-' || value === 'N/A') return null;
  
  // Remove K, M, B suffixes and convert
  const cleaned = String(value).replace(/[KMB]/g, '').replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return null;
  
  // Handle K, M, B multipliers
  if (String(value).includes('K')) return parsed;
  if (String(value).includes('M')) return parsed * 1000;
  if (String(value).includes('B')) return parsed * 1000000;
  
  return parsed;
}

/**
 * Helper: Determine unit for indicator
 */
function determineUnit(key) {
  const units = {
    nfp: 'K',
    unemployment: '%',
    cpi: '%',
    ppi: '%',
    retail: '%',
    gdp: '%'
  };
  return units[key] || '';
}

/**
 * Transform scraped data to our standard format
 */
export function transformScrapedData(scrapedData) {
  if (!scrapedData || !scrapedData.data) return null;

  const { data, source, timestamp } = scrapedData;
  
  return {
    indicators: Object.entries(data).map(([key, indicator]) => ({
      id: key,
      name: indicator.name,
      date: indicator.date || new Date().toISOString(),
      value: indicator.actual,
      current: indicator.actual,
      forecast: indicator.forecast,
      previous: indicator.previous,
      impact: indicator.impact || 'high',
      unit: indicator.unit,
      source: source,
      lastUpdated: timestamp
    })),
    metadata: {
      source,
      timestamp,
      autoFetched: true
    }
  };
}
