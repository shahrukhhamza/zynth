import { API_URL } from '../config/api';

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
