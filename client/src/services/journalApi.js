import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: `${API_URL}/api/journal`,
  timeout: 45000,
});

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Trades ────────────────────────────────────────────────────────────────────
export async function listTrades(page = 0, limit = 50) {
  const { data } = await api.get('/trades', { params: { page, limit } });
  // Server returns { success, data: trades[], total, page, limit }
  return { trades: data.data || [], total: data.total || 0 };
}

export async function createTrade(formData) {
  // Do NOT pass explicit Content-Type — axios auto-sets multipart/form-data+boundary
  const { data } = await api.post('/trades', formData);
  return data.data;
}

export async function updateTrade(id, formData) {
  const { data } = await api.put(`/trades/${id}`, formData);
  return data.data;
}

export async function deleteTrade(id) {
  const { data } = await api.delete(`/trades/${id}`);
  return data;
}

export async function analyzeTrade(id) {
  const { data } = await api.post(`/trades/${id}/analyze`);
  // Server returns { success, data: analysisObject }
  return data.data;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const { data } = await api.get('/analytics');
  // Server returns { success, data: metricsObject }
  return data.data;
}

// ── Reports ───────────────────────────────────────────────────────────────────
export async function generateReport(type = 'custom') {
  const { data } = await api.post('/reports', { type });
  // Server returns { success, data: { id, report_type, report_data, ... } }
  return data.data;
}

export async function listReports() {
  const { data } = await api.get('/reports');
  // Server returns { success, data: reports[] }
  return data.data || [];
}
