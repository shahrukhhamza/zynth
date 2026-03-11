import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchEconomicCalendar = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/calendar`);
    return response.data;
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    throw error;
  }
};

export const fetchIndicatorDetails = async (indicatorId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/calendar/${indicatorId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching indicator details:', error);
    throw error;
  }
};

/**
 * Force-refresh all economic data via Gemini + Google Search grounding.
 * Clears backend cache and re-fetches live data with cross-verification.
 * Use after a major release (NFP, CPI, etc.) to get the latest numbers.
 */
export const forceRefreshCalendar = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/calendar/refresh`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing economic calendar:', error);
    throw error;
  }
};

