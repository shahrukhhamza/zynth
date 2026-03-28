import { createContext, useContext, useState, useCallback } from 'react';
import UpgradeModal from '../components/UpgradeModal';

const UpgradeContext = createContext(null);

/**
 * Wrap the authenticated app shell with <UpgradeProvider>.
 * Any component can then call openUpgradeModal() to show the upgrade prompt.
 */
export function UpgradeProvider({ children }) {
  const [modal, setModal] = useState(null);

  /**
   * openUpgradeModal({ reason, feature, requiredPlan, billingCycle, headline, message })
   *   reason       — short sentence explaining why the gate fired
   *   feature      — optional feature key from planFeatures.js
   *   requiredPlan — 'pro' | 'elite'  (default: 'pro')
   *   billingCycle — 'monthly' | 'annual' (default: 'monthly')
   *   headline     — optional: override modal headline copy
   *   message      — optional: override modal subtitle copy
   */
  const openUpgradeModal = useCallback(({
    reason       = 'Upgrade your plan to access this feature.',
    feature      = null,
    requiredPlan = 'pro',
    billingCycle = 'monthly',
    headline     = null,
    message      = null,
  } = {}) => {
    setModal({ reason, feature, requiredPlan, billingCycle, headline, message });
  }, []);

  const closeUpgradeModal = useCallback(() => setModal(null), []);

  return (
    <UpgradeContext.Provider value={{ openUpgradeModal }}>
      {children}
      {modal && (
        <UpgradeModal
          open
          reason={modal.reason}
          requiredPlan={modal.requiredPlan}
          billingCycle={modal.billingCycle}
          headline={modal.headline}
          message={modal.message}
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
