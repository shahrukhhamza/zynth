import { useEffect, useState } from 'react';
import { Zap, X, Check, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { PLANS_CONFIG, FEATURE_LABELS } from '../config/planFeatures';
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

  const targetPlan = PLANS_CONFIG[requiredPlan] ?? PLANS_CONFIG.pro;
  const higherPlan = requiredPlan === 'pro' ? PLANS_CONFIG.elite : null;

  const highlightFeatures = {
    pro: [
      'Unlimited trade journaling',
      'AI-powered insights (up to 50/month)',
      'Advanced performance analytics',
      'Behavioral insights to fix mistakes',
      'Real-time market data',
      'Full economic calendar',
    ],
    elite: [
      'Everything in Pro, plus:',
      'Unlimited AI analyses',
      'AI trading reports',
      'Trading DNA profile',
      'Strategy optimization insights',
      'Priority support (4-hr response)',
    ],
  };

  const featureLabel = feature ? FEATURE_LABELS[feature] : null;
  const card = isDark ? '#141414' : '#ffffff';
  const blue = '#3b82f6';

  // Open payment modal in-place without navigation.
  function openPayment(plan) {
    const source = feature
      ? (/ai/i.test(feature) ? 'ai_limit' : feature)
      : (reason?.toLowerCase().includes('journal') ? 'journal_limit' : 'ai_limit');
    track('upgrade_clicked', { requiredPlan, feature: feature ?? 'unknown', source, plan, ...upgradeMetadata });
    setPaymentPlan(plan);
  }

  return (
    <>
    {paymentPlan && (
      <PaymentOptionsModal
        plan={paymentPlan}
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
            ? '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(59,130,246,0.1)'
            : '0 24px 60px rgba(15,23,42,0.16)',
        }}
      >
        {/* Blue gradient top strip */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #06b6d4)' }} />

        {/* Header row */}
        <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(37,99,235,0.28)',
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
              <strong style={{ color: text }}>{featureLabel}</strong> requires the {targetPlan.name} plan.
            </p>
          )}
        </div>

        {/* Feature checklist */}
        <div style={{ padding: '16px 22px' }}>
          <p style={{ color: muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
            Included in {targetPlan.name}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(highlightFeatures[requiredPlan] || []).map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={10} color={blue} />
                </div>
                <span style={{ color: text, fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA + price */}
        <div style={{ margin: '0 22px 16px', padding: '14px 16px', borderRadius: 12, background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ color: text, fontWeight: 800, fontSize: 24 }}>${targetPlan.price}</span>
            <span style={{ color: muted, fontSize: 13 }}>/month</span>
          </div>
          <button
            type="button"
            onClick={() => openPayment(requiredPlan)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 9,
              background: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(59,130,246,0.32)',
              border: 'none', cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            Unlock {targetPlan.name} <ArrowRight size={13} />
          </button>
        </div>

        {/* Elite upsell row (only when targeting Pro) */}
        {higherPlan && (
          <div style={{ margin: '0 22px 16px', padding: '9px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: muted, fontSize: 13 }}>
              Need unlimited AI?&nbsp;
              <strong style={{ color: text }}>Elite is ${higherPlan.price}/mo</strong>
            </span>
            <button
              type="button"
              onClick={() => openPayment('elite')}
              style={{ color: blue, fontSize: 13, fontWeight: 700, background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              See Elite <ArrowRight size={12} />
            </button>
          </div>
        )}

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
