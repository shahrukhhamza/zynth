/**
 * useUpgradeIntelligence — behavioral upgrade intelligence hook.
 *
 * Handles all smart upgrade-timing logic in one place.
 *
 * SIGNALS (consumed by App.jsx to call openUpgradeModal):
 *   shouldAutoOpen          — true when a return-user should see the modal
 *   shouldAiSessionTrigger  — true after 2 AI uses in one session (soft prompt)
 *   shouldTradeSessionTrigger — true after 3 trades in one session (soft prompt)
 *
 * DATA (consumed by PlanGateModal and UpgradeNudgeBanner):
 *   personalizedHeadline    — modal headline based on user profile
 *   personalizedMessage     — modal subtext based on user profile
 *   suggestedPlan           — 'pro' | 'elite'
 *   urgencyLevel            — 'none' | 'warning' | 'critical'
 *   nearLimit               — bool shorthand for urgencyLevel !== 'none'
 *   upgradeMetadata         — micro-conversion data to merge into track() calls
 *
 * RULES:
 *   - All triggers fire at most once per session (sessionStorage dedup)
 *   - Return trigger only fires on a fresh session after a previous limit hit
 *   - Nothing fires for admin or paid users
 *   - No network calls — all logic is local
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlan } from './usePlan';

// ── sessionStorage / localStorage helpers ─────────────────────────────────────
const ss = {
  get:  (k, d = '0') => { try { return sessionStorage.getItem(k) ?? d; } catch { return d; } },
  set:  (k, v)       => { try { sessionStorage.setItem(k, String(v));   } catch {} },
  has:  (k)          => { try { return sessionStorage.getItem(k) !== null; } catch { return false; } },
};
const ls = {
  get:  (k, d = null) => { try { return localStorage.getItem(k) ?? d;   } catch { return d; } },
  set:  (k, v)        => { try { localStorage.setItem(k, String(v));     } catch {} },
};

// ── storage key constants ─────────────────────────────────────────────────────
const SK = {
  SESSION_AI:            'zynth_si_ai',          // sessionStorage: AI uses this session
  SESSION_TRADES:        'zynth_si_trades',       // sessionStorage: trades this session
  SESSION_START:         'zynth_si_start',        // sessionStorage: epoch ms at session open
  AI2_TRIGGER_SHOWN:     'zynth_si_ai2_shown',    // sessionStorage: AI-2 soft trigger fired
  TRADE3_TRIGGER_SHOWN:  'zynth_si_trade3_shown', // sessionStorage: trade-3 soft trigger fired
  RETURN_TRIGGER_SHOWN:  'zynth_si_return',       // sessionStorage: return trigger fired
};
const LK = {
  LIMIT_HIT_TS:   'zynth_limit_ts',   // localStorage: epoch ms when free user first hit a limit
  SESSION_COUNT:  'zynth_sess_n',     // localStorage: total session count (micro-conversion)
};

// ── personalized copy ─────────────────────────────────────────────────────────
const COPY = {
  ai_heavy: {
    headline: 'Unlock unlimited AI insights',
    message:  "You're actively using AI analysis — don't let limits slow your trading edge.",
  },
  journal_heavy: {
    headline: 'Go unlimited on journaling',
    message:  "You're building a strong trading record. Remove limits and track every trade.",
  },
  mixed: {
    headline: "You're outgrowing the free tier",
    message:  "You're using AI and logging trades regularly. Upgrade to remove all limits.",
  },
  new: {
    headline: "You've reached your limit",
    message:  'Upgrade to continue improving your trading performance.',
  },
};

// Return-user trigger delay (ms) — feels natural, not jarring
const RETURN_TRIGGER_DELAY_MS = 6_000;
// Minimum age for LIMIT_HIT_TS before we consider it a "previous session" hit
const MIN_PREV_SESSION_AGE_MS = 60_000;

export function useUpgradeIntelligence() {
  const {
    isFree,
    isAdmin,
    aiLifetimeUsed,
    aiMonthlyUsed,
    aiRemaining,
    aiLimitReached,
    journalCount,
    journalLimitReached,
  } = usePlan();

  // ── Session AI-use counter ─────────────────────────────────────────────────
  const [sessionAiCount, setSessionAiCount] = useState(
    () => parseInt(ss.get(SK.SESSION_AI), 10) || 0,
  );
  const prevAiTotalRef = useRef(aiLifetimeUsed + aiMonthlyUsed);

  useEffect(() => {
    const current = aiLifetimeUsed + aiMonthlyUsed;
    const delta = current - prevAiTotalRef.current;
    if (delta > 0) {
      setSessionAiCount(prev => {
        const next = prev + delta;
        ss.set(SK.SESSION_AI, next);
        return next;
      });
      prevAiTotalRef.current = current;
    }
  }, [aiLifetimeUsed, aiMonthlyUsed]);

  // ── Session trade counter ──────────────────────────────────────────────────
  const [sessionTradeCount, setSessionTradeCount] = useState(
    () => parseInt(ss.get(SK.SESSION_TRADES), 10) || 0,
  );
  const prevJournalRef = useRef(journalCount);

  useEffect(() => {
    const delta = journalCount - prevJournalRef.current;
    if (delta > 0) {
      setSessionTradeCount(prev => {
        const next = prev + delta;
        ss.set(SK.SESSION_TRADES, next);
        return next;
      });
      prevJournalRef.current = journalCount;
    }
  }, [journalCount]);

  // ── Session start timestamp + cumulative session count ────────────────────
  useEffect(() => {
    if (!ss.has(SK.SESSION_START)) {
      ss.set(SK.SESSION_START, Date.now());
      const n = parseInt(ls.get(LK.SESSION_COUNT, '0'), 10);
      ls.set(LK.SESSION_COUNT, n + 1);
    }
  }, []);

  // ── Persist limit-hit timestamp (localStorage — survives tab close) ────────
  useEffect(() => {
    if ((aiLimitReached || journalLimitReached) && !ls.get(LK.LIMIT_HIT_TS)) {
      ls.set(LK.LIMIT_HIT_TS, Date.now());
    }
  }, [aiLimitReached, journalLimitReached]);

  // ── User profile classification ────────────────────────────────────────────
  let userProfile = 'new';
  if (sessionAiCount >= 2 && sessionTradeCount >= 2) userProfile = 'mixed';
  else if (sessionAiCount >= 2)   userProfile = 'ai_heavy';
  else if (sessionTradeCount >= 3) userProfile = 'journal_heavy';

  const copy = COPY[userProfile] ?? COPY.new;

  // ── Plan auto-suggestion ───────────────────────────────────────────────────
  // Heavy AI users get nudged toward Elite (unlimited analysis).
  // Everyone else defaults to Pro (lower friction, higher conversion).
  const suggestedPlan =
    (sessionAiCount >= 3 || aiLifetimeUsed >= 2) && isFree ? 'elite' : 'pro';

  // ── Urgency level ──────────────────────────────────────────────────────────
  let urgencyLevel = 'none';
  if (aiLimitReached || journalLimitReached) urgencyLevel = 'critical';
  else if (aiRemaining === 1)                urgencyLevel = 'warning';
  const nearLimit = urgencyLevel !== 'none';

  // ── Return-user trigger ────────────────────────────────────────────────────
  // Fires once when the user comes back to a fresh session after previously
  // hitting a limit. Shows modal ~6 s after page load.
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  const returnTimerRef = useRef(null);

  useEffect(() => {
    if (!isFree || isAdmin) return;
    if (ss.has(SK.RETURN_TRIGGER_SHOWN)) return;

    const ts = ls.get(LK.LIMIT_HIT_TS);
    if (!ts) return;

    const age = Date.now() - parseInt(ts, 10);
    if (age < MIN_PREV_SESSION_AGE_MS) return; // same session — don't double-fire

    returnTimerRef.current = setTimeout(() => {
      if (!ss.has(SK.RETURN_TRIGGER_SHOWN)) {
        ss.set(SK.RETURN_TRIGGER_SHOWN, '1');
        setShouldAutoOpen(true);
      }
    }, RETURN_TRIGGER_DELAY_MS);

    return () => clearTimeout(returnTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const clearAutoOpen = useCallback(() => setShouldAutoOpen(false), []);

  // ── AI-2 session trigger (2 AI uses in one session, soft prompt) ───────────
  const ai2ShownRef = useRef(ss.has(SK.AI2_TRIGGER_SHOWN));
  const [shouldAiSessionTrigger, setShouldAiSessionTrigger] = useState(false);

  useEffect(() => {
    if (!isFree || isAdmin || aiLimitReached) return;
    if (sessionAiCount < 2) return;
    if (ai2ShownRef.current) return;
    ai2ShownRef.current = true;
    ss.set(SK.AI2_TRIGGER_SHOWN, '1');
    setShouldAiSessionTrigger(true);
  }, [sessionAiCount, isFree, isAdmin, aiLimitReached]);

  const clearAiSessionTrigger = useCallback(() => setShouldAiSessionTrigger(false), []);

  // ── Trade-3 session trigger (3 trades in one session, soft prompt) ─────────
  const trade3ShownRef = useRef(ss.has(SK.TRADE3_TRIGGER_SHOWN));
  const [shouldTradeSessionTrigger, setShouldTradeSessionTrigger] = useState(false);

  useEffect(() => {
    if (!isFree || isAdmin) return;
    if (sessionTradeCount < 3) return;
    if (trade3ShownRef.current) return;
    trade3ShownRef.current = true;
    ss.set(SK.TRADE3_TRIGGER_SHOWN, '1');
    setShouldTradeSessionTrigger(true);
  }, [sessionTradeCount, isFree, isAdmin]);

  const clearTradeSessionTrigger = useCallback(() => setShouldTradeSessionTrigger(false), []);

  // ── Micro-conversion metadata ──────────────────────────────────────────────
  // Merged into track('upgrade_clicked', ...) for richer funnel data.
  const upgradeMetadata = {
    sessions_before:    parseInt(ls.get(LK.SESSION_COUNT, '1'), 10),
    time_in_session_s:  Math.round(
      (Date.now() - parseInt(ss.get(SK.SESSION_START, String(Date.now())), 10)) / 1000,
    ),
    profile: userProfile,
  };

  return {
    // Session counters
    sessionAiCount,
    sessionTradeCount,
    userProfile,

    // Personalized copy
    personalizedHeadline: copy.headline,
    personalizedMessage:  copy.message,
    suggestedPlan,

    // Urgency
    nearLimit,
    urgencyLevel,

    // Auto-trigger signals
    shouldAutoOpen,
    clearAutoOpen,
    autoOpenReason: "Welcome back — you've previously hit your plan limit.",

    shouldAiSessionTrigger,
    clearAiSessionTrigger,

    shouldTradeSessionTrigger,
    clearTradeSessionTrigger,

    // Micro-conversion data (merge into track calls)
    upgradeMetadata,
  };
}
