import { useAuth } from '../contexts/AuthContext';

/**
 * Returns current user's plan capabilities and try counts.
 *
 * isPro           — plan === 'pro'
 * isElite         — plan === 'elite'
 * isAdmin         — is_admin === 1
 * isFree          — plan === 'free' (or unset)
 * aiTriesLeft     — free: 3 total · pro: 50/month · elite/admin: 999 (unlimited)
 * screenshotTriesLeft — free: 2 total · pro: 35/month · elite/admin: 999
 * canUseAI        — true when tries remain or plan is unlimited
 * canUseScreenshot — true when tries remain or plan is unlimited
 * plan            — raw plan string
 */
export function usePlanGate() {
  const { user } = useAuth();

  const plan     = user?.plan ?? 'free';
  const isAdmin  = (user?.is_admin ?? 0) === 1;
  const isPro    = plan === 'pro';
  const isElite  = plan === 'elite';
  const isFree   = !isPro && !isElite && !isAdmin;

  const aiTries        = user?.ai_analysis_tries ?? 0;
  const screenshotTries = user?.screenshot_tries ?? 0;

  const aiTriesLeft = isElite || isAdmin
    ? 999
    : isPro
      ? Math.max(0, 50 - aiTries)
      : Math.max(0, 3 - aiTries);

  const screenshotTriesLeft = isElite || isAdmin
    ? 999
    : isPro
      ? Math.max(0, 35 - screenshotTries)
      : Math.max(0, 2 - screenshotTries);

  const canUseAI         = aiTriesLeft > 0;
  const canUseScreenshot = screenshotTriesLeft > 0;

  return {
    isPro,
    isElite,
    isAdmin,
    isFree,
    aiTriesLeft,
    screenshotTriesLeft,
    canUseAI,
    canUseScreenshot,
    plan,
  };
}
