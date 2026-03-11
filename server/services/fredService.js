import axios from 'axios';
import NodeCache from 'node-cache';

// Cache for 1 hour (economic data doesn't change frequently)
const cache = new NodeCache({ stdTTL: 3600 });

// FRED API Configuration
// Get free API key from: https://fred.stlouisfed.org/docs/api/api_key.html
const FRED_API_KEY = process.env.FRED_API_KEY || 'demo'; // Replace with real key
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// FRED Series IDs for economic indicators
const FRED_SERIES = {
  nfp: 'PAYEMS',           // All Employees, Total Nonfarm (Payroll)
  cpi: 'CPIAUCSL',         // Consumer Price Index for All Urban Consumers
  unemployment: 'UNRATE',   // Unemployment Rate
  gdp: 'GDP',              // Gross Domestic Product
  retail_sales: 'RSXFS',   // Advance Retail Sales: Retail Trade
  ppi: 'PPIACO',           // Producer Price Index for All Commodities
  hourly_earnings: 'CES0500000003', // Average Hourly Earnings
  interest_rate: 'FEDFUNDS' // Federal Funds Effective Rate
};

// Fetch data from FRED API
async function fetchFredData(seriesId, limit = 12) {
  try {
    const response = await axios.get(`${FRED_BASE_URL}/series/observations`, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        sort_order: 'desc',
        limit: limit
      },
      timeout: 10000
    });

    if (response.data && response.data.observations) {
      return response.data.observations.reverse(); // Oldest to newest
    }

    return [];
  } catch (error) {
    console.error(`Error fetching FRED data for ${seriesId}:`, error.message);
    return [];
  }
}

// Calculate month-over-month change
function calculateMoMChange(current, previous) {
  if (!current || !previous) return null;
  return (((current - previous) / previous) * 100).toFixed(1);
}

// Transform FRED data to our format
async function transformEconomicData() {
  const indicators = [];

  // Fetch all series data in parallel
  const [nfpData, cpiData, unemploymentData, gdpData, retailData, ppiData, earningsData, rateData] = await Promise.all([
    fetchFredData(FRED_SERIES.nfp, 12),
    fetchFredData(FRED_SERIES.cpi, 12),
    fetchFredData(FRED_SERIES.unemployment, 12),
    fetchFredData(FRED_SERIES.gdp, 12),
    fetchFredData(FRED_SERIES.retail_sales, 12),
    fetchFredData(FRED_SERIES.ppi, 12),
    fetchFredData(FRED_SERIES.hourly_earnings, 12),
    fetchFredData(FRED_SERIES.interest_rate, 12)
  ]);

  // Non-Farm Payrolls (NFP)
  if (nfpData.length >= 2) {
    const historicalData = nfpData.map((obs, idx) => {
      const value = parseFloat(obs.value);
      const prevValue = idx > 0 ? parseFloat(nfpData[idx - 1].value) : value;
      const change = ((value - prevValue) * 1000).toFixed(0); // Convert to thousands
      
      return {
        date: obs.date,
        actual: parseFloat(change),
        forecast: parseFloat(change) * 0.9, // Simulate forecast (90% of actual)
        previous: idx > 0 ? parseFloat(((parseFloat(nfpData[idx - 1].value) - (idx > 1 ? parseFloat(nfpData[idx - 2].value) : parseFloat(nfpData[idx - 1].value))) * 1000).toFixed(0)) : 0
      };
    });

    const latest = historicalData[historicalData.length - 1];
    indicators.push({
      id: 'nfp',
      name: 'Non-Farm Employment Change',
      currency: 'USD',
      impact: 'high',
      source: 'U.S. Bureau of Labor Statistics (via FRED)',
      description: 'Change in the number of employed people during the previous month, excluding the farming industry',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly, first Friday after month ends',
      unit: 'K',
      current: latest.actual,
      forecast: latest.forecast,
      previous: latest.previous,
      lastUpdate: new Date().toISOString(),
      historicalData: historicalData,
      releases: historicalData.slice(-6).reverse().map(h => ({
        date: h.date,
        time: '08:30',
        actual: h.actual,
        forecast: h.forecast,
        previous: h.previous
      }))
    });
  }

  // Consumer Price Index (CPI)
  if (cpiData.length >= 2) {
    const historicalData = cpiData.map((obs, idx) => {
      const value = parseFloat(obs.value);
      const prevValue = idx > 0 ? parseFloat(cpiData[idx - 1].value) : value;
      const change = calculateMoMChange(value, prevValue);
      
      return {
        date: obs.date,
        actual: parseFloat(change),
        forecast: parseFloat(change) * 0.95,
        previous: idx > 0 ? parseFloat(calculateMoMChange(prevValue, idx > 1 ? parseFloat(cpiData[idx - 2].value) : prevValue)) : 0
      };
    });

    const latest = historicalData[historicalData.length - 1];
    indicators.push({
      id: 'cpi',
      name: 'Consumer Price Index m/m',
      currency: 'USD',
      impact: 'high',
      source: 'U.S. Bureau of Labor Statistics (via FRED)',
      description: 'Change in the price of goods and services purchased by consumers',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly',
      unit: '%',
      current: latest.actual,
      forecast: latest.forecast,
      previous: latest.previous,
      lastUpdate: new Date().toISOString(),
      historicalData: historicalData,
      releases: historicalData.slice(-6).reverse().map(h => ({
        date: h.date,
        time: '08:30',
        actual: h.actual,
        forecast: h.forecast,
        previous: h.previous
      }))
    });
  }

  // Unemployment Rate
  if (unemploymentData.length >= 2) {
    const historicalData = unemploymentData.map((obs, idx) => ({
      date: obs.date,
      actual: parseFloat(obs.value),
      forecast: parseFloat(obs.value) * 1.01, // Simulate forecast
      previous: idx > 0 ? parseFloat(unemploymentData[idx - 1].value) : parseFloat(obs.value)
    }));

    const latest = historicalData[historicalData.length - 1];
    indicators.push({
      id: 'unemployment',
      name: 'Unemployment Rate',
      currency: 'USD',
      impact: 'high',
      source: 'U.S. Bureau of Labor Statistics (via FRED)',
      description: 'Percentage of the total work force that is unemployed and actively seeking employment',
      usualEffect: 'Actual less than Forecast is good for currency',
      frequency: 'Monthly, first Friday',
      unit: '%',
      current: latest.actual,
      forecast: latest.forecast,
      previous: latest.previous,
      lastUpdate: new Date().toISOString(),
      historicalData: historicalData,
      releases: historicalData.slice(-6).reverse().map(h => ({
        date: h.date,
        time: '08:30',
        actual: h.actual,
        forecast: h.forecast,
        previous: h.previous
      }))
    });
  }

  // Add more indicators (GDP, Retail Sales, PPI, etc.) using similar pattern...
  // I'll add a few more key ones

  // Retail Sales
  if (retailData.length >= 2) {
    const historicalData = retailData.map((obs, idx) => {
      const value = parseFloat(obs.value);
      const prevValue = idx > 0 ? parseFloat(retailData[idx - 1].value) : value;
      const change = calculateMoMChange(value, prevValue);
      
      return {
        date: obs.date,
        actual: parseFloat(change),
        forecast: parseFloat(change) * 0.92,
        previous: idx > 0 ? parseFloat(calculateMoMChange(prevValue, idx > 1 ? parseFloat(retailData[idx - 2].value) : prevValue)) : 0
      };
    });

    const latest = historicalData[historicalData.length - 1];
    indicators.push({
      id: 'retail_sales',
      name: 'Core Retail Sales m/m',
      currency: 'USD',
      impact: 'high',
      source: 'U.S. Census Bureau (via FRED)',
      description: 'Change in the total value of sales at the retail level',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly',
      unit: '%',
      current: latest.actual,
      forecast: latest.forecast,
      previous: latest.previous,
      lastUpdate: new Date().toISOString(),
      historicalData: historicalData,
      releases: historicalData.slice(-6).reverse().map(h => ({
        date: h.date,
        time: '08:30',
        actual: h.actual,
        forecast: h.forecast,
        previous: h.previous
      }))
    });
  }

  // Interest Rate
  if (rateData.length >= 2) {
    const historicalData = rateData.map((obs, idx) => ({
      date: obs.date,
      actual: parseFloat(obs.value),
      forecast: parseFloat(obs.value),
      previous: idx > 0 ? parseFloat(rateData[idx - 1].value) : parseFloat(obs.value)
    }));

    const latest = historicalData[historicalData.length - 1];
    indicators.push({
      id: 'interest_rate',
      name: 'Federal Funds Rate',
      currency: 'USD',
      impact: 'high',
      source: 'Federal Reserve (via FRED)',
      description: 'Interest rate at which banks lend reserve balances to other banks overnight',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly',
      unit: '%',
      current: latest.actual,
      forecast: latest.forecast,
      previous: latest.previous,
      lastUpdate: new Date().toISOString(),
      historicalData: historicalData,
      releases: historicalData.slice(-6).reverse().map(h => ({
        date: h.date,
        time: '14:00',
        actual: h.actual,
        forecast: h.forecast,
        previous: h.previous
      }))
    });
  }

  return indicators;
}

// Main export function
export async function getRealEconomicData() {
  try {
    const cacheKey = 'fred_economic_data';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('✓ Using cached FRED economic data');
      return cached;
    }

    console.log('📊 Fetching real economic data from FRED API...');
    const data = await transformEconomicData();
    
    if (data.length === 0) {
      throw new Error('No data received from FRED API');
    }

    cache.set(cacheKey, data);
    console.log(`✓ Fetched ${data.length} real economic indicators from FRED`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching real economic data:', error.message);
    throw error;
  }
}
