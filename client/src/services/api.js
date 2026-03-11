import axios from 'axios';
import { API_URL } from '../config/api';

const API_BASE_URL = `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fetch news with optional filters
export async function fetchNews(filters = {}) {
  try {
    const params = {};
    
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    
    const response = await api.get('/news', { params: { limit: 100, ...params } });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch news');
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch news. Please check your API key.');
  }
}

// Fetch specific news by ID
export async function fetchNewsById(id) {
  try {
    const response = await api.get(`/news/${id}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch news article');
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch news article');
  }
}

// Health check
export async function checkHealth() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health Check Error:', error);
    return { status: 'error' };
  }
}

export default api;
