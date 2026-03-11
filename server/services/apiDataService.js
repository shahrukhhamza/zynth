/**
 * API Data Service
 * 
 * This service fetches REAL economic data from verified APIs only.
 * NO AI-generated numbers. NO hallucinations.
 * 
 * Data Flow:
 * 1. Fetch raw data from APIs (FRED, Alpha Vantage, etc.)
 * 2. Transform into standard format
 * 3. Return to frontend for visualization
 * 4. (Optional) Send to Gemini for TEXT analysis only
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Cache with 5-minute TTL for fresher API data
const cache = new NodeCache({ stdTTL: 300 });

/**
 * FRED API Integration
 * Fetches real economic data from Federal Reserve
 */
export async function fetchFredEconomicData() {
  const cacheKey = 'fred_economic_data';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('✓ Returning cached FRED data');
    return cached;
  }

  try {
    const fredKey = process.env.FRED_API_KEY;
    if (!fredKey) {
      throw new Error('FRED_API_KEY not configured');
    }

    // Define FRED series IDs for economic indicators
    const series = {
      nfp: 'PAYEMS',        // Total Nonfarm Payrolls
      unemployment: 'UNRATE', // Unemployment Rate
      cpi: 'CPIAUCSL',       // Consumer Price Index
      ppi: 'PPIACO',         // Producer Price Index
      retail: 'RSXFS',       // Retail Sales
      gdp: 'GDP',            // Gross Domestic Product
      fedFunds: 'FEDFUNDS', // Federal Funds Rate
    };

    const results = {};

    // Fetch each series from FRED
    for (const [key, seriesId] of Object.entries(series)) {
      try {
        const response = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations`,
          {
            params: {
              api_key: fredKey,
              file_type: 'json',
              series_id: seriesId,
              limit: 12,
              sort_order: 'desc',
            },
          }
        );

        if (response.data?.observations) {
          results[key] = transformFredData(seriesId, response.data.observations);
        }
      } catch (error) {
        console.error(`✗ FRED fetch error for ${seriesId}:`, error.message);
      }
    }

    console.log(`✓ Fetched ${Object.keys(results).length} indicators from FRED`);
    cache.set(cacheKey, results);
    return results;

  } catch (error) {
    console.error('✗ FRED API error:', error.message);
    return null;
  }
}

/**
 * Transform FRED API response to standard format
 */
function transformFredData(seriesId, observations) {
  const sorted = observations
    .filter(obs => obs.value && obs.value !== '.')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  // For employment data, calculate monthly change
  if (seriesId === 'PAYEMS') {
    return sorted.map((obs, index) => {
      const current = parseFloat(obs.value);
      const previous = index < sorted.length - 1 ? parseFloat(sorted[index + 1].value) : current;
      const change = ((current - previous) * 1000).toFixed(0); // Convert thousands to actual numbers
      
      return {
        date: obs.date,
        value: parseFloat(change),
        original: current,
      };
    });
  }

  // For other indicators, return direct values
  return sorted.map(obs => ({
    date: obs.date,
    value: parseFloat(obs.value),
  }));
}

/**
 * Alpha Vantage Integration (for additional market data)
 */
export async function fetchAlphaVantageData() {
  const cacheKey = 'alphavantage_data';
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;

  try {
    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      console.log('ℹ Alpha Vantage API key not configured');
      return null;
    }

    // Fetch economic indicators
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'REAL_GDP',
        interval: 'quarterly',
        apikey: apiKey,
      },
    });

    if (response.data?.data) {
      const result = {
        gdp: response.data.data.slice(0, 8),
      };
      
      cache.set(cacheKey, result);
      return result;
    }

    return null;
  } catch (error) {
    console.error('✗ Alpha Vantage error:', error.message);
    return null;
  }
}

/**
 * Fetch News from verified sources
 */
export async function fetchEconomicNews() {
  const cacheKey = 'economic_news';
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;

  try {
    // Try Marketaux API first (if configured)
    const marketauxKey = process.env.MARKETAUX_API_KEY;
    if (marketauxKey) {
      const response = await axios.get('https://api.marketaux.com/v1/news/all', {
        params: {
          api_token: marketauxKey,
          filter_entities: true,
          language: 'en',
          limit: 20,
        },
      });

      if (response.data?.data) {
        const news = response.data.data.map(item => ({
          title: item.title,
          description: item.description,
          url: item.url,
          source: item.source,
          publishedAt: item.published_at,
          image: item.image_url,
        }));

        cache.set(cacheKey, news);
        return news;
      }
    }

    // Fallback to Polygon.io (already configured)
    const polygonKey = process.env.POLYGON_API_KEY;
    if (polygonKey) {
      const response = await axios.get('https://api.polygon.io/v2/reference/news', {
        params: {
          apiKey: polygonKey,
          limit: 20,
        },
      });

      if (response.data?.results) {
        const news = response.data.results.map(item => ({
          title: item.title,
          description: item.description,
          url: item.article_url,
          source: item.publisher?.name || 'Unknown',
          publishedAt: item.published_utc,
          image: item.image_url,
        }));

        cache.set(cacheKey, news);
        return news;
      }
    }

    return null;
  } catch (error) {
    console.error('✗ News API error:', error.message);
    return null;
  }
}

/**
 * Master data fetch function
 * Returns combined data from all API sources
 */
export async function fetchAllEconomicData() {
  console.log('\n📊 Fetching economic data from APIs...');

  const [fredData, alphaData, news] = await Promise.all([
    fetchFredEconomicData(),
    fetchAlphaVantageData(),
    fetchEconomicNews(),
  ]);

  return {
    fred: fredData,
    alphaVantage: alphaData,
    news: news,
    timestamp: new Date().toISOString(),
    source: 'Verified APIs (FRED, Alpha Vantage, Polygon)',
  };
}

/**
 * Get specific indicator data
 */
export async function getIndicatorData(indicatorId) {
  const allData = await fetchAllEconomicData();
  
  if (allData.fred && allData.fred[indicatorId]) {
    return {
      id: indicatorId,
      data: allData.fred[indicatorId],
      source: 'FRED',
      timestamp: allData.timestamp,
    };
  }

  return null;
}

/**
 * Format data for chart display
 */
export function formatForChart(indicatorData) {
  if (!indicatorData || !Array.isArray(indicatorData)) {
    return { labels: [], values: [] };
  }

  const sorted = [...indicatorData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return {
    labels: sorted.map(d => d.date),
    values: sorted.map(d => d.value),
  };
}

export default {
  fetchFredEconomicData,
  fetchAlphaVantageData,
  fetchEconomicNews,
  fetchAllEconomicData,
  getIndicatorData,
  formatForChart,
};
