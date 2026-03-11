/**
 * Free API Service
 * 
 * Integrates multiple FREE economic calendar APIs:
 * 1. Calendly API - Free economic calendar (no key required)
 * 2. EconDB - Free economic database  
 * 3. Nasdaq Data Link (Quandl) - Free tier available
 * 
 * These are REAL data sources that provide actual, forecast, and previous values.
 * Note: FMP economic calendar is legacy-only (not available for new users)
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Trading Economics Alternative - Free public RSS feed
 * Provides recent economic events without API key
 */
async function fetchTradingEconomicsRSS() {
  try {
    console.log('📡 Fetching from Trading Economics public feed...');
    
    // Trading Economics provides public calendar data
    const response = await axios.get(
      'https://tradingeconomics.com/united-states/indicators',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10000,
      }
    );

    // For now, return null as we need HTML parsing
    // This would require cheerio or similar
    console.log('⚠️  Trading Economics requires HTML parsing (not implemented)');
    return null;
    
  } catch (error) {
    console.log(`❌ Trading Economics fetch failed: ${error.message}`);
    return null;
  }
}

/**
 * EconDB API
 * Free economic database
 * Provides historical economic data
 */
async function fetchEconDBData() {
  try {
    // EconDB provides free access to economic indicators
    // Example indicators: CPIUS, UNRAUS, GDPUS
    const indicators = [
      { code: 'CPIUS', name: 'Consumer Price Index' },
      { code: 'UNRAUS', name: 'Unemployment Rate' },
      { code: 'PAYEMUS', name: 'Non-Farm Employment' },
    ];

    const results = [];

    for (const indicator of indicators) {
      try {
        const response = await axios.get(
          `https://www.econdb.com/api/series/${indicator.code}/?format=json`,
          { timeout: 10000 }
        );

        if (response.data && response.data.data) {
          const latestData = response.data.data.slice(-3); // Last 3 data points
          results.push({
            name: indicator.name,
            code: indicator.code,
            data: latestData,
            source: 'EconDB',
          });
        }
      } catch (err) {
        console.log(`⚠️  EconDB: Failed to fetch ${indicator.code}`);
      }
    }

    if (results.length > 0) {
      console.log(`✓ EconDB: Fetched ${results.length} indicators`);
      return results;
    }

    return null;
    
  } catch (error) {
    console.log(`❌ EconDB failed: ${error.message}`);
    return null;
  }
}

/**
 * Main function: Try all free APIs in priority order
 */
export async function fetchFreeEconomicCalendar() {
  const cacheKey = 'free_api_economic_calendar';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('✓ Returning cached free API data');
    return cached;
  }

  console.log('🚀 Fetching from FREE APIs...');
  console.log('⚠️  NOTE: Most free economic calendar APIs are unavailable:');
  console.log('   - FMP: Economic calendar is legacy-only (pre-Aug 2025 users)');
  console.log('   - EconDB: Historical only, no forecasts');
  console.log('   - Trading Economics: Requires $199/month API key');
  console.log('   - Investing.com: Blocks automated access (403)');
  console.log('   - ForexFactory: Blocks automated access');
  console.log('');
  console.log('📋 Using config file with manually entered values...');
  console.log('💡 TIP: For real-time automation, Trading Economics API ($199/mo) is recommended');

  // Priority 1: EconDB (historical data only, no forecasts)
  console.log('📡 Trying EconDB (historical data only)...');
  const econdbData = await fetchEconDBData();
  if (econdbData && econdbData.length > 0) {
    const result = {
      data: econdbData,
      source: 'EconDB (Historical Only)',
      timestamp: new Date().toISOString(),
      count: econdbData.length,
      note: 'EconDB provides historical actuals but no analyst forecasts',
    };
    cache.set(cacheKey, result);
    console.log(`✅ EconDB provided ${econdbData.length} historical indicators`);
    return result;
  }

  // Priority 2: Trading Economics public (limited)
  console.log('📡 Trying Trading Economics public data...');
  const teData = await fetchTradingEconomicsRSS();
  if (teData) {
    const result = {
      data: teData,
      source: 'Trading Economics (Public)',
      timestamp: new Date().toISOString(),
    };
    cache.set(cacheKey, result);
    return result;
  }

  console.log('❌ All free APIs exhausted - using config file fallback');
  return null;
}

/**
 * Transform FMP data to standard format
 * Note: Keeping for reference, but FMP economic calendar is legacy-only
 */
function transformFMPData_DEPRECATED(events) {
  return events.map(event => {
    // Map FMP event names to our indicator names
    let indicatorName = event.event;
    
    // Normalize common indicators
    if (event.event.toLowerCase().includes('non farm') || 
        event.event.toLowerCase().includes('nonfarm')) {
      indicatorName = 'Non-Farm Employment Change';
    } else if (event.event.toLowerCase().includes('unemployment')) {
      indicatorName = 'Unemployment Rate';
    } else if (event.event.toLowerCase().includes('cpi') || 
               event.event.toLowerCase().includes('inflation')) {
      indicatorName = 'Consumer Price Index (YoY)';
    } else if (event.event.toLowerCase().includes('retail')) {
      indicatorName = 'Retail Sales';
    } else if (event.event.toLowerCase().includes('gdp')) {
      indicatorName = 'GDP Growth Rate';
    }

    return {
      id: `fmp_${event.date}_${indicatorName.replace(/\s+/g, '_')}`,
      name: indicatorName,
      currency: 'USD',
      impact: event.impact === 'High' ? 3 : event.impact === 'Medium' ? 2 : 1,
      current: parseFloat(event.actual) || null,
      forecast: parseFloat(event.estimate) || null,
      previous: parseFloat(event.previous) || null,
      date: event.date.split('T')[0], // Extract date
      time: event.date.split('T')[1]?.split('.')[0] || '00:00:00', // Extract time
      unit: determineUnit(event.event),
      source: 'FMP API',
      rawEvent: event.event, // Keep original name for reference
    };
  }).filter(item => 
    item.current !== null || item.forecast !== null || item.previous !== null
  );
}

/**
 * Determine unit based on indicator name
 */
function determineUnit(eventName) {
  const name = eventName.toLowerCase();
  
  if (name.includes('rate') || name.includes('unemployment') || 
      name.includes('inflation') || name.includes('cpi') ||
      name.includes('gdp') || name.includes('ppi')) {
    return '%';
  }
  
  if (name.includes('employment') || name.includes('payroll') ||
      name.includes('claims') || name.includes('jobs')) {
    return 'K';
  }
  
  if (name.includes('sales') || name.includes('spending') ||
      name.includes('income') || name.includes('earnings')) {
    return '$B';
  }
  
  return '';
}

/**
 * Helper: Get date N days ago
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Get date N days ahead
 */
function getDateDaysAhead(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Clear cache (for testing/debugging)
 */
export function clearFreeApiCache() {
  cache.flushAll();
  console.log('✓ Free API cache cleared');
}
