import { useEffect, useState } from 'react';
import { Zap, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { FEATURE_LABELS } from '../config/planFeatures';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN } from '../config/pricingPlans';
import { track } from '../services/track';
import { useUpgradeIntelligence } from '../hooks/useUpgradeIntelligence';
import PaymentOptionsModal from './PaymentOptionsModal';

/**
 * PlanGateModal
 * Shown when a user hits any plan limit or tries to access a gated feature.
 *
 * Props:
 *   reason       — "You've used all 2 free AI analyses."
 *   feature      — optional feature key from planFeatures.js
 *   requiredPlan — 'pro' | 'elite'
 *   onClose      — dismiss handler
 */
export default function PlanGateModal({ reason, feature, requiredPlan = 'pro', onClose, headline, message }) {
  const { isDark, text, muted } = useTheme();
  const { upgradeMetadata } = useUpgradeIntelligence();
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [billingCycle, setBillingCycle] = useState(DEFAULT_BILLING_CYCLE);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Track modal impression once per session (deduped by plan+feature)
  useEffect(() => {
    const sessionKey = `zynth_modal_tracked_${requiredPlan}_${feature ?? 'x'}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
    const source = feature
      ? (/ai/i.test(feature) ? 'ai_limit' : feature)
      : (reason?.toLowerCase().includes('journal') ? 'journal_limit' : 'ai_limit');
    track('upgrade_modal_opened', { requiredPlan, feature: feature ?? 'unknown', source });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featureLabel = feature ? FEATURE_LABELS[feature] : null;
  const pricingContext = /ai|analysis|insight/i.test(feature || '')
    ? 'ai'
    : /journal/i.test(feature || '')
      ? 'journal'
      : 'upgrade';
  const card = isDark ? '#141414' : '#ffffff';

  // Open payment modal in-place without navigation.
  function openPayment(plan) {
    const source = feature
      ? (/ai/i.test(feature) ? 'ai_limit' : feature)
      : (reason?.toLowerCase().includes('journal') ? 'journal_limit' : 'ai_limit');
    track('upgrade_clicked', { requiredPlan, feature: feature ?? 'unknown', source, plan, billingCycle, ...upgradeMetadata });
    setPaymentPlan(plan);
  }

  return (
    <>
    {paymentPlan && (
      <PaymentOptionsModal
        plan={paymentPlan}
        billingCycle={billingCycle}
        onClose={() => {
          setPaymentPlan(null);
          onClose();
        }}
      />
    )}
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 500,
          background: card,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}`,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(202,138,4,0.1)'
            : '0 24px 60px rgba(15,23,42,0.16)',
        }}
      >
        {/* Blue gradient top strip */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #CA8A04, #EAB308, #FBBF24)' }} />

        {/* Header row */}
        <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #CA8A04, #EAB308)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(161,98,7,0.28)',
            }}>
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: text, fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
                {headline ?? "You've reached your limit"}
              </div>
              <div style={{ color: muted, fontSize: 13, marginTop: 3 }}>
                {message ?? 'Upgrade to continue improving your trading performance'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2 }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Reason callout */}
        <div style={{ margin: '14px 22px 0', padding: '11px 14px', borderRadius: 10, background: isDark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <p style={{ color: isDark ? '#fca5a5' : '#dc2626', fontSize: 14, fontWeight: 600, margin: 0 }}>{reason}</p>
          {featureLabel && (
            <p style={{ color: muted, fontSize: 13, margin: '4px 0 0' }}>
              <strong style={{ color: text }}>{featureLabel}</strong> requires at least the {requiredPlan === 'elite' ? 'Elite' : 'Pro'} plan.
            </p>
          )}
        </div>

        <div style={{ padding: '16px 22px' }}>
          <PricingPlanSelector
            context={pricingContext}
            mode="compact"
            title="Unlock the plan that removes this limit"
            subtitle="The same Elite-first pricing system is used here, so your upgrade choice matches the rest of the app."
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            onPrimaryAction={(plan) => openPayment(plan)}
            experimentVariant="plan-gate-v1"
            onTrack={(event, payload) => track('pricing_selector_event', {
              event,
              ...payload,
              source: 'plan_gate_modal',
              requiredPlan,
            })}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '0 22px 18px', textAlign: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 13 }}>
            Maybe later
          </button>
          <p style={{ color: isDark ? '#374151' : '#94a3b8', fontSize: 11, margin: '6px 0 0' }}>
            7-day money-back guarantee &bull; Cancel anytime
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
