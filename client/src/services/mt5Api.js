/**
 * mt5Api.js
 * ---------
 * API client for the Trade Screenshot Analysis service.
 * The Python FastAPI service runs on port 8000, proxied via /mt5 in Vite dev.
 * All requests include the JWT so the service can isolate data per user.
 */
import axios from 'axios';

const BASE = import.meta.env.VITE_MT5_API_URL || '/mt5';

const client = axios.create({
  baseURL: BASE,
  timeout: 90_000, // AI image analysis can take time
});

// Automatically attach the auth token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

/**
 * Upload a screenshot image and extract trades via OCR + Gemini AI.
 * @param {File} file  PNG / JPG screenshot of MT4/MT5 trade history
 * @returns {Promise<{success, message, trades_extracted, analysis, behavior, ai_summary, trades}>}
 */
export async function uploadTradeScreenshot(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/upload-trade-screenshot', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Fetch stored screenshot trades + analysis for the logged-in user.
 * @returns {Promise<{success, trades, analysis, behavior, ai_summary}>}
 */
export async function getScreenshotReport() {
  const response = await client.get('/screenshot-report');
  return response.data;
}

/**
 * Liveness check for the backend service.
 * @returns {Promise<{status, service}>}
 */
export async function checkServiceHealth() {
  const response = await client.get('/health');
  return response.data;
}
