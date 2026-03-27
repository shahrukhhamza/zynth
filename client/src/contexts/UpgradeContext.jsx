import { createContext, useContext, useState, useCallback } from 'react';
import PlanGateModal from '../components/PlanGateModal';

const UpgradeContext = createContext(null);

/**
 * Wrap the authenticated app shell with <UpgradeProvider>.
 * Any component can then call openUpgradeModal() to show the upgrade prompt.
 */
export function UpgradeProvider({ children }) {
  const [modal, setModal] = useState(null);

  /**
   * openUpgradeModal({ reason, feature, requiredPlan })
   *   reason       — short sentence explaining why the gate fired
   *   feature      — optional feature key from planFeatures.js
   *   requiredPlan — 'pro' | 'elite'  (default: 'pro')
   */
  const openUpgradeModal = useCallback(({
    reason      = 'Upgrade your plan to access this feature.',
    feature     = null,
    requiredPlan = 'pro',
  } = {}) => {
    setModal({ reason, feature, requiredPlan });
  }, []);

  const closeUpgradeModal = useCallback(() => setModal(null), []);

  return (
    <UpgradeContext.Provider value={{ openUpgradeModal }}>
      {children}
      {modal && (
        <PlanGateModal
          reason={modal.reason}
          feature={modal.feature}
          requiredPlan={modal.requiredPlan}
          onClose={closeUpgradeModal}
        />
      )}
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error('useUpgrade must be used inside <UpgradeProvider>');
  return ctx;
}
