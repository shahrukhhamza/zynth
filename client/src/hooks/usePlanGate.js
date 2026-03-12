import { useAuth } from '../contexts/AuthContext';

/**
 * Returns current user's plan capabilities and try counts.
 *
 * isPro           — plan === 'pro'
 * isElite         — plan === 'elite'
 * isAdmin         — is_admin === 1
 * isFree          — plan === 'free' (or unset)
 * aiTriesLeft     — 3 - ai_analysis_tries  (min 0)
 * screenshotTriesLeft — 2 - screenshot_tries (min 0)
 * canUseAI        — isPro || isElite || isAdmin || aiTriesLeft > 0
 * canUseScreenshot — isPro || isElite || isAdmin || screenshotTriesLeft > 0
 * plan            — raw plan string
 */
export function usePlanGate() {
  const { user } = useAuth();

  const plan     = user?.plan ?? 'free';
  const isAdmin  = (user?.is_admin ?? 0) === 1;
  const isPro    = plan === 'pro';
  const isElite  = plan === 'elite';
  const isFree   = !isPro && !isElite && !isAdmin;

  const aiTriesLeft = Math.max(0, 3 - (user?.ai_analysis_tries ?? 0));
  const screenshotTriesLeft = Math.max(0, 2 - (user?.screenshot_tries ?? 0));

  const canUseAI         = isPro || isElite || isAdmin || aiTriesLeft > 0;
  const canUseScreenshot = isPro || isElite || isAdmin || screenshotTriesLeft > 0;

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
