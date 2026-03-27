/**
 * useAISoftTrigger — fires a one-time warning toast when the user has
 * exactly 1 AI analysis remaining.
 *
 * Rules:
 *   - Triggers only once per browser session (sessionStorage flag)
 *   - Only fires when aiRemaining === 1
 *   - Uses the existing toast.warning() so no extra UI is needed
 *   - Unlimited plans (Infinity) are silently ignored
 *
 * Usage — call inside any dashboard or analysis component:
 *   useAISoftTrigger();
 */
import { useEffect, useRef } from 'react';
import { usePlan } from './usePlan';
import { useToast } from '../contexts/ToastContext';

const SESSION_FLAG = 'zynth_ai_soft_trigger_shown';

export function useAISoftTrigger() {
  const { aiRemaining, isAdmin } = usePlan();
  const { toast } = useToast();
  const firedRef = useRef(false);

  useEffect(() => {
    // Skip for admins and unlimited plans
    if (isAdmin || aiRemaining === Infinity) return;
    // Only fire at exactly 1 remaining
    if (aiRemaining !== 1) return;
    // Deduplicate within the session
    if (firedRef.current) return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;

    firedRef.current = true;
    sessionStorage.setItem(SESSION_FLAG, '1');

    toast.warning(
      'You have 1 AI analysis left. Upgrade to avoid interruption.',
      6000,
    );
  }, [aiRemaining, isAdmin, toast]);
}
