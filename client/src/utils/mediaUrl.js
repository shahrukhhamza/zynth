import { API_URL } from '../config/api';
import { getAuthToken } from './authStorage';

/**
 * Fetch a protected upload (e.g. a payment proof) with the user's JWT and return a blob: URL
 * that <img> / window.open can use. Returns null when the file cannot be loaded.
 */
export async function fetchProtectedMediaUrl(pathOrUrl) {
  const url = resolveMediaUrl(pathOrUrl);
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
}

export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null;

  if (/^(https?:)?\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith('/')) {
    return `${API_URL}${pathOrUrl}`;
  }

  return `${API_URL}/${pathOrUrl}`;
}
