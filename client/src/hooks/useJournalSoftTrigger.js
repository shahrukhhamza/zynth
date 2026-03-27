/**
 * useJournalSoftTrigger — fires a one-time warning toast when the user has
 * exactly 1 trade journal entry remaining on their current plan.
 *
 * Rules:
 *   - Triggers only once per browser session (sessionStorage flag)
 *   - Only fires when journalRemaining === 1
 *   - Uses the existing toast.warning() so no extra UI is needed
 *   - Unlimited plans (Infinity) are silently ignored
 *
 * Usage — call inside the Journal page or main dashboard:
 *   useJournalSoftTrigger();
 */
import { useEffect, useRef } from 'react';
import { usePlan } from './usePlan';
import { useToast } from '../contexts/ToastContext';

const SESSION_FLAG = 'zynth_journal_soft_trigger_shown';

export function useJournalSoftTrigger() {
  const { journalRemaining, isAdmin } = usePlan();
  const { toast } = useToast();
  const firedRef = useRef(false);

  useEffect(() => {
    // Skip for admins and unlimited plans
    if (isAdmin || journalRemaining === Infinity) return;
    // Only fire at exactly 1 remaining
    if (journalRemaining !== 1) return;
    // Deduplicate within the session
    if (firedRef.current) return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;

    firedRef.current = true;
    sessionStorage.setItem(SESSION_FLAG, '1');

    toast.warning(
      'Last free trade remaining. Upgrade for unlimited tracking.',
      6000,
    );
  }, [journalRemaining, isAdmin, toast]);
}
