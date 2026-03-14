/**
 * geminiCounter.js — shared Gemini API call counter
 *
 * Import bumpGemini(source) in every file that calls generateContent.
 * Logs a summary every 10 calls.
 *
 * Usage:
 *   import { bumpGemini } from '../utils/geminiCounter.js';
 *   bumpGemini('assistant');   // call once per actual HTTP request made
 */

// Resets at server restart (in-memory only).
// Counts are also visible via /api/health?stats=1 if server.js exposes them.
let count = 0;

// Midnight-reset: track which calendar day we started on
let dayStarted = new Date().toDateString();

export function bumpGemini(source = '') {
  // Auto-reset counter at midnight
  const today = new Date().toDateString();
  if (today !== dayStarted) {
    console.log(`📊 [Gemini] Yesterday total: ${count} calls`);
    count = 0;
    dayStarted = today;
  }

  count++;

  // Log immediately on first call, then every 10
  if (count === 1 || count % 10 === 0) {
    console.log(`⚡ [Gemini] Calls today: ${count}${source ? ` — source: ${source}` : ''}`);
  }

  return count;
}

export function getGeminiCount() {
  return count;
}
