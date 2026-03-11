import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fetch actual gold spot price (GC=F via Yahoo Finance)
export async function fetchGoldSpot() {
  try {
    const response = await api.get('/data/gold/spot');
    if (response.data.success) return response.data.data;
    throw new Error('Failed to fetch gold spot price');
  } catch (error) {
    console.error('API Error:', error);
    return null; // non-fatal
  }
}

// Fetch live price snapshot for all instruments (polls every ~10s on client)
export async function fetchLivePrices() {
  try {
    const response = await api.get('/data/prices/live');
    if (response.data.success) return response.data.data;
    throw new Error('Failed to fetch live prices');
  } catch (error) {
    console.error('Live prices error:', error);
    return null;
  }
}

// Fetch any market symbol (handles CL=F, ^VIX, DX-Y.NYB etc via query param)
export async function fetchMarketData(symbol, limit = 90) {
  try {
    const response = await api.get('/data/market', { params: { symbol, limit } });
    if (response.data.success) return response.data.data;
    throw new Error(`Failed to fetch ${symbol}`);
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || `Failed to fetch ${symbol}`);
  }
}

// Fetch gold price data
export async function fetchGoldData(timespan = 'day', limit = 90) {
  try {
    const response = await api.get(`/data/gold`, {
      params: { timespan, limit }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch gold data');
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch gold data');
  }
}

// Fetch equity data
export async function fetchEquityData(ticker, timespan = 'day', limit = 90) {
  try {
    const response = await api.get(`/data/equity/${ticker}`, {
      params: { timespan, limit }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch equity data');
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch equity data');
  }
}

// Fetch forex data
export async function fetchForexData(pair, timespan = 'day', limit = 90) {
  try {
    const response = await api.get(`/data/forex/${pair}`, {
      params: { timespan, limit }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch forex data');
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch forex data');
  }
}

// Fetch all economic indicators
export async function fetchEconomicIndicators() {
  try {
    const response = await api.get('/data/indicators');
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch economic indicators');
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch economic indicators');
  }
}

export default api;
