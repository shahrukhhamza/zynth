/**
 * usePlan — primary hook for plan state, feature gates, and usage limits.
 * Supersedes usePlanGate.js (which now re-exports from this for backward compat).
 */
import { useAuth } from '../contexts/AuthContext';
import { PLANS_CONFIG, planHasFeature, getRequiredPlanForFeature } from '../config/planFeatures';

export function usePlan() {
  const { user } = useAuth();

  const rawPlan  = String(user?.plan ?? 'free').trim().toLowerCase();
  const plan     = ['free', 'pro', 'elite'].includes(rawPlan) ? rawPlan : 'free';
  const isAdmin  = Number(user?.is_admin ?? 0) === 1;
  const isPro    = plan === 'pro';
  const isElite  = plan === 'elite';
  const isFree   = !isPro && !isElite && !isAdmin;
  const planConfig = PLANS_CONFIG[plan] ?? PLANS_CONFIG.free;

  // ── AI usage ──────────────────────────────────────────────────────────────
  const aiLifetimeUsed  = user?.ai_analysis_tries ?? 0;
  const aiMonthlyUsed   = user?.ai_monthly_count  ?? 0;

  let aiRemaining;
  if (isAdmin || isElite) {
    aiRemaining = Infinity;
  } else if (isPro) {
    aiRemaining = Math.max(0, 50 - aiMonthlyUsed);
  } else {
    aiRemaining = Math.max(0, 2 - aiLifetimeUsed);
  }

  const canUseAI        = isAdmin || isElite ? true : aiRemaining > 0;
  const aiLimitReached  = !canUseAI;

  // ── Journal usage ─────────────────────────────────────────────────────────
  const journalCount     = user?.journal_count ?? 0;
  const maxJournal       = isAdmin || isPro || isElite ? Infinity : planConfig.maxJournalEntries;
  const journalRemaining = maxJournal === Infinity ? Infinity : Math.max(0, maxJournal - journalCount);
  const canAddJournal    = isAdmin || isPro || isElite ? true : journalCount < maxJournal;
  const journalLimitReached = !canAddJournal;

  // ── Feature access ────────────────────────────────────────────────────────
  /**
   * hasFeature(key) — returns true if the current user's plan includes the feature.
   * Admins always get true.
   */
  const hasFeature = (featureKey) => {
    if (isAdmin) return true;
    return planHasFeature(plan, featureKey);
  };

  /**
   * requiredPlanFor(key) — returns 'pro' or 'elite' string for a gated feature.
   */
  const requiredPlanFor = (featureKey) => getRequiredPlanForFeature(featureKey);

  // ── Upgrade path ──────────────────────────────────────────────────────────
  const suggestedUpgrade = isAdmin ? null : isFree ? 'pro' : isPro ? 'elite' : null;

  return {
    // Plan identity
    plan,
    isPro,
    isElite,
    isFree,
    isAdmin,
    planConfig,

    // AI
    aiRemaining,
    aiLifetimeUsed,
    aiMonthlyUsed,
    canUseAI,
    aiLimitReached,

    // Journal
    journalCount,
    maxJournal,
    journalRemaining,
    canAddJournal,
    journalLimitReached,

    // Feature gates
    hasFeature,
    requiredPlanFor,

    // Upgrade
    suggestedUpgrade,

    // Backward compat aliases
    aiTriesLeft: aiRemaining,
    canUseAI,
  };
}
