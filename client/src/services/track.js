/**
 * track.js — lightweight client-side event tracker.
 *
 * Sends conversion events to the backend event store.
 * Fire-and-forget: errors are suppressed so nothing in the UI ever breaks.
 *
 * Usage:
 *   import { track } from '../services/track';
 *
 *   track('upgrade_modal_opened', { source: 'ai_limit' });
 *   track('upgrade_clicked',      { plan: 'pro' });
 *   track('subscription_started', { plan: 'pro' });
 */
import { API_URL } from '../config/api';
import { getAuthToken } from '../utils/authStorage';

/**
 * @param {string} event    – must be in the server-side ALLOWED_CLIENT_EVENTS list
 * @param {object} metadata – optional flat object with string/number/boolean values
 */
export function track(event, metadata = {}) {
  const token = getAuthToken();
  if (!token || !event) return;

  fetch(`${API_URL}/api/events/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ event, metadata }),
  }).catch(() => {
    // Silent — tracking failures must never surface to users
  });
}
