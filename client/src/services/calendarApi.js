import axios from 'axios';
import { API_URL } from '../config/api';

const API_BASE_URL = `${API_URL}/api`;

// Shared axios instance with automatic JWT attachment
const calendarAxios = axios.create({ baseURL: API_BASE_URL });
calendarAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const fetchEconomicCalendar = async () => {
  try {
    const response = await calendarAxios.get('/calendar');
    return response.data;
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    throw error;
  }
};

export const fetchIndicatorDetails = async (indicatorId) => {
  try {
    const response = await calendarAxios.get(`/calendar/${indicatorId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching indicator details:', error);
    throw error;
  }
};

export const forceRefreshCalendar = async () => {
  try {
    const response = await calendarAxios.post('/calendar/refresh');
    return response.data;
  } catch (error) {
    console.error('Error refreshing economic calendar:', error);
    throw error;
  }
};

