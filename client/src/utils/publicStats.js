import { API_URL } from '../config/api';

const CACHE_KEY = 'public_stats_cache_v1';
const CACHE_TTL_MS = 60 * 1000;

// In-flight deduplication: all callers share the same pending request.
let _inflight = null;

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

  if (_inflight) return _inflight;

  _inflight = fetch(`${API_URL}/api/public-stats`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch public stats');
      return res.json();
    })
    .then(data => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          expiresAt: Date.now() + CACHE_TTL_MS,
        }));
      } catch {
        // Ignore storage failures.
      }
      return data;
    })
    .finally(() => { _inflight = null; });

  return _inflight;
}