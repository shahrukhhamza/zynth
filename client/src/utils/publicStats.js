import { API_URL } from '../config/api';

const CACHE_KEY = 'public_stats_cache_v1';
const CACHE_TTL_MS = 60 * 1000;

export async function getPublicStats() {
  const now = Date.now();

  try {
    const cachedRaw = sessionStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached?.expiresAt > now && typeof cached?.data?.totalUsers === 'number') {
        return cached.data;
      }
    }
  } catch {
    // Ignore cache parse/storage issues and fall back to network.
  }

  const response = await fetch(`${API_URL}/api/public-stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch public stats');
  }

  const data = await response.json();

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      expiresAt: now + CACHE_TTL_MS,
    }));
  } catch {
    // Ignore storage failures.
  }

  return data;
}