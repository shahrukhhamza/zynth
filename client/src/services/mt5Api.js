/**
 * mt5Api.js
 * ---------
 * API client for the Trade Screenshot Analysis service.
 * The Python FastAPI service runs on port 8000, proxied via /mt5 in Vite dev.
 * All requests include the JWT so the service can isolate data per user.
 */
import axios from 'axios';

// In production: route through the Express backend (VITE_API_URL already set in Vercel).
// In dev: Vite proxies /mt5 → localhost:8000 directly.
const BASE =
  import.meta.env.VITE_MT5_API_URL ||
  (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/mt5` : '/mt5');

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
 * Delete all stored screenshot-imported trades and analysis for the logged-in user.
 * @returns {Promise<{success, message, deleted}>}
 */
export async function deleteScreenshotReport() {
  const response = await client.delete('/screenshot-report');
  return response.data;
}

/**
 * Delete a single screenshot-imported trade by its DB row ID.
 * @param {number} tradeId
 * @returns {Promise<{success, message}>}
 */
export async function deleteScreenshotTrade(tradeId) {
  const response = await client.delete(`/screenshot-trade/${tradeId}`);

  /**
   * Fetch all upload sessions (batches) for the logged-in user.
   * @returns {Promise<{success, batches: Array<{upload_batch, trade_count, uploaded_at, symbols}>}>}
   */
  export async function getScreenshotBatches() {
    const response = await client.get('/screenshot-batches');
    return response.data;
  }

  /**
   * Delete all trades belonging to a specific upload session.
   * @param {string|null} batchId — UUID string or null for legacy trades
   * @returns {Promise<{success, message, deleted}>}
   */
  export async function deleteScreenshotBatch(batchId) {
    const response = await client.delete(`/screenshot-batch/${batchId ?? 'null'}`);
    return response.data;
  }
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
