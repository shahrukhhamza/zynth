import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Landmark,
  Smartphone, Upload, Loader2, CheckCircle,
  Crown, Rocket, CheckCircle2, Lock, Shield, CreditCard, RotateCcw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN, PKR_PRICES, getPaidPlan, getPlanDisplay } from '../config/pricingPlans';
import ErrorBar from './ErrorBar';

const PAYMENT_OPTIONS = [
  {
    key: 'jazzcash',
    name: 'JazzCash',
    Icon: Smartphone,
    details: [
      { label: 'Account Title', value: 'Shahrukh Hamza' },
      { label: 'IBAN', value: 'PK36JCMA0301923175516692' },
    ],
  },
];

const PAYMENT_OPTIONS_BY_REGION = {
  PK: PAYMENT_OPTIONS,
  INTL: [
    {
      key: 'bank-wire-usd',
      name: 'International Payment (USD Bank Transfer)',
      Icon: Landmark,
      details: [
        { label: 'Bank', value: 'Citibank' },
        { label: 'Account Holder', value: 'Shahrukh Hamza' },
        { label: 'Account Number', value: '70584510002334445' },
        { label: 'Routing Number (ABA)', value: '031100209' },
        { label: 'SWIFT Code', value: 'CITIUS33' },
        { label: 'Account Type', value: 'Checking' },
      ],
    },
  ],
};

const PLAN_SUMMARY_ICONS = {
  pro: Rocket,
  elite: Crown,
};

/* ─── Main component ────────────────────────────────────────────────────────── */

/**
 * UpgradeModal — 2-step SaaS conversion flow
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   requiredPlan  — 'pro' | 'elite'
 *   reason        — optional context text from gate trigger
 *   headline      — optional header override (step 1)
 *   message       — optional subheader override (step 1)
 */
export default function UpgradeModal({
  open,
  onClose,
  requiredPlan = 'pro',
  billingCycle = DEFAULT_BILLING_CYCLE,
  reason = null,
  headline = null,
  message = null,
}) {
  const theme  = useTheme();
  const { token } = useAuth();

  const [visible,      setVisible]      = useState(Boolean(open));
  const [step,         setStep]         = useState(1);
  const [stepIn,       setStepIn]       = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [activeBillingCycle, setActiveBillingCycle] = useState(billingCycle ?? DEFAULT_BILLING_CYCLE);
  const [paymentRegion, setPaymentRegion] = useState('PK');
  const [methodKey,    setMethodKey]    = useState(PAYMENT_OPTIONS[0].key);
  const [requiredPkr,  setRequiredPkr]  = useState(PKR_PRICES[billingCycle]?.[requiredPlan === 'elite' ? 'elite' : 'pro'] ?? PKR_PRICES.monthly.pro);
  const [proof,        setProof]        = useState(null);
  const [note,         setNote]         = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setStep(1);
      setStepIn(true);
      setSelectedPlan(DEFAULT_SELECTED_PLAN);
      setActiveBillingCycle(billingCycle ?? DEFAULT_BILLING_CYCLE);
      setPaymentRegion('PK');
      setRequiredPkr(PKR_PRICES[billingCycle ?? DEFAULT_BILLING_CYCLE]?.[DEFAULT_SELECTED_PLAN] ?? PKR_PRICES.monthly.pro);
      setMethodKey(PAYMENT_OPTIONS[0].key);
    }
    else setVisible(false);
  }, [billingCycle, open, requiredPlan]);

  useEffect(() => {
    setRequiredPkr(PKR_PRICES[activeBillingCycle]?.[selectedPlan] || PKR_PRICES.monthly.pro);
  }, [activeBillingCycle, selectedPlan]);

  useEffect(() => {
    const defaultMethod = PAYMENT_OPTIONS_BY_REGION[paymentRegion]?.[0]?.key || '';
    setMethodKey(defaultMethod);
  }, [paymentRegion]);

  // Disable body scroll while modal is open
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const currentRegionMethods = PAYMENT_OPTIONS_BY_REGION[paymentRegion] || PAYMENT_OPTIONS_BY_REGION.PK;
  const currentMethod = useMemo(
    () => currentRegionMethods.find(option => option.key === methodKey) || currentRegionMethods[0],
    [currentRegionMethods, methodKey],
  );
  const selected = selectedPlan ? getPaidPlan(selectedPlan) : null;
  const SelectedPlanIcon = selected ? (PLAN_SUMMARY_ICONS[selected.id] ?? Rocket) : Rocket;
  const selectedDisplay = selectedPlan ? getPlanDisplay(selectedPlan, activeBillingCycle) : null;
  const amountLabel = selectedDisplay?.label ?? '';
  const amountPkrLabel = `PKR ${requiredPkr.toLocaleString()}`;
  const isPakistanPayment = paymentRegion === 'PK';
  const annualHelper = selectedDisplay?.helperText ?? null;

  if (!visible) return null;

  const headingText  = theme.isDark ? '#f8fafc' : '#0f172a';
  const mutedText    = theme.isDark ? '#9ca3af' : '#64748b';
  const subtleText   = theme.isDark ? '#94a3b8' : '#526174';
  const panelSurface = theme.isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const modalBg      = theme.isDark
    ? 'linear-gradient(180deg, rgba(8,12,20,0.98), rgba(6,9,16,0.98))'
    : '#ffffff';

  function goToStep(n) {
    setStepIn(false);
    setTimeout(() => { setStep(n); setStepIn(true); }, 160);
  }

  async function submitPayment(e) {
    e.preventDefault();
    if (!selectedPlan || !selected) { setError('Please select a plan first.'); return; }
    if (!proof) { setError('Please upload payment proof to continue.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('plan',   selectedPlan);
      form.append('billingCycle', activeBillingCycle);
      form.append('paymentRegion', paymentRegion);
      form.append('method', currentMethod.name);
      form.append('amount', isPakistanPayment ? amountPkrLabel : amountLabel);
      form.append('amountUsd', amountLabel);
      form.append('amountPkr', isPakistanPayment ? amountPkrLabel : 'N/A');
      form.append('note',   note.trim());
      form.append('proof',  proof);

      const res  = await fetch(`${API_URL}/api/payments/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit payment.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setVisible(false);
    setSubmitted(false);
    setSubmitting(false);
    setStep(1);
    setStepIn(true);
    setError(null);
    setProof(null);
    setNote('');
    onClose?.();
  }

  function copyText(v) { navigator.clipboard?.writeText(v); }

  const Overlay = ({ children }) => (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background:           'rgba(0,0,0,0.88)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 55% at 50% 40%, rgba(99,102,241,0.13) 0%, transparent 68%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 48%, rgba(0,0,0,0.5) 100%)' }} />
      {children}
    </div>
  );

  if (submitted) {
    return (
      <Overlay>
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{
            background:   theme.isDark ? 'rgba(8,12,20,0.97)' : '#ffffff',
            borderColor:  theme.isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.2)',
            boxShadow:    '0 30px 90px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(16,185,129,0.15)' }}
          >
            <CheckCircle size={30} color="#22c55e" />
          </div>
          <h3 className="text-2xl font-extrabold" style={{ color: headingText }}>
            You&apos;re Almost Upgraded
          </h3>
          <p className="mt-2 text-sm" style={{ color: subtleText }}>
            We received your payment proof. Your plan will be activated after quick verification.
          </p>
          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)' }}
          >
            Back to Dashboard
          </button>
        </div>
      </Overlay>
    );
  }

  const transitionStyle = {
    opacity:    stepIn ? 1 : 0,
    transform:  stepIn ? 'translateY(0)' : 'translateY(6px)',
    transition: 'opacity 0.16s ease, transform 0.16s ease',
  };

  /* ══ STEP 1 — Premium Conversion Modal ══ */
  if (step === 1) {
    const eliteDisp = getPlanDisplay('elite', activeBillingCycle);
    const proDisp   = getPlanDisplay('pro',   activeBillingCycle);
    const progressPct = 60;
    const checklist = [
      { done: true,  text: 'Initial patterns detected' },
      { done: true,  text: 'First insights generated' },
      { done: false, text: 'Advanced insights locked' },
      { done: false, text: 'Full analysis locked' },
    ];
    const eliteFeatures = ['Unlimited insights', 'Deep behavioral analysis', 'Full performance reports'];

    return (
      <Overlay>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="relative w-[95%] max-w-3xl rounded-2xl p-[1px]"
          style={{
            background: 'linear-gradient(140deg, rgba(99,102,241,0.7), rgba(139,92,246,0.55), rgba(59,130,246,0.5))',
            boxShadow:  '0 40px 120px rgba(0,0,0,0.9), 0 0 64px rgba(99,102,241,0.16)',
            maxHeight:  'min(92vh, 100%)',
          }}
        >
          <div
            className="relative rounded-2xl"
            style={{
              background:  'linear-gradient(155deg, #0a0c14 0%, #0d1020 60%, #09090f 100%)',
              maxHeight:   'calc(92vh - 2px)',
              overflowY:   'auto',
            }}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseOut={e =>  { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* ── LEFT: Progress + Emotion ── */}
              <div
                className="flex flex-col gap-6 p-7 sm:p-8"
                style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
              >
                {/* Badge */}
                <span
                  className="self-start text-[11px] font-bold px-3 py-1 rounded-full tracking-widest"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color:      '#a5b4fc',
                    border:     '1px solid rgba(99,102,241,0.32)',
                  }}
                >
                  ANALYSIS IN PROGRESS
                </span>

                {/* Headline */}
                <div>
                  <h2
                    className="font-extrabold leading-tight"
                    style={{
                      fontSize:   28,
                      background: 'linear-gradient(135deg, #f8fafc 30%, #c4b5fd 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {headline || "You\u2019re closer than you think."}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed font-medium" style={{ color: '#cbd5e1' }}>
                    {message || "You\u2019ve already uncovered early patterns. The real insights start after this point."}
                  </p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Analysis Progress</span>
                    <span className="text-xs font-bold" style={{ color: '#c4b5fd' }}>{progressPct}% complete</span>
                  </div>
                  <div className="relative h-[7px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.3, ease: 'easeOut', delay: 0.15 }}
                      style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    />
                    <motion.div
                      style={{
                        position: 'absolute', top: 0, bottom: 0, width: 44,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                        filter: 'blur(1px)',
                      }}
                      initial={{ left: '-15%', opacity: 0 }}
                      animate={{ left: `${progressPct + 6}%`, opacity: [0, 1, 0] }}
                      transition={{ duration: 0.9, ease: 'easeInOut', delay: 1.55 }}
                    />
                  </div>
                  <motion.p
                    className="text-xs mt-1.5 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                    style={{ color: '#818cf8' }}
                  >
                    You&apos;re ahead of most users at this stage
                  </motion.p>
                </div>

                {/* Checklist */}
                <div className="flex flex-col gap-2.5">
                  {checklist.map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.09, duration: 0.3 }}
                    >
                      {item.done
                        ? <CheckCircle2 size={15} style={{ color: '#34d399', flexShrink: 0 }} />
                        : <Lock size={13} style={{ color: '#374151', flexShrink: 0 }} />
                      }
                      <span
                        className="text-sm font-medium flex-1"
                        style={{ color: item.done ? '#f1f5f9' : '#4b5563', opacity: item.done ? 1 : 0.5 }}
                      >
                        {item.text}
                      </span>
                      {!item.done && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.28)', flexShrink: 0 }}
                        >
                          Elite
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Loss statement */}
                <div
                  className="rounded-xl p-4 mt-auto"
                  style={{
                    background: 'rgba(251,191,36,0.06)',
                    border:     '1px solid rgba(251,191,36,0.18)',
                  }}
                >
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: '#fde68a' }}>
                    ⚡ Stopping here means missing the insights that actually improve outcomes.
                  </p>
                </div>
              </div>

              {/* ── RIGHT: Plans + CTA ── */}
              <div className="flex flex-col gap-4 p-7 sm:p-8">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: '#6b7280' }}
                >
                  Choose your plan
                </p>

                {/* Elite plan */}
                <motion.div
                  onClick={() => setSelectedPlan('elite')}
                  className="cursor-pointer rounded-2xl"
                  whileHover={{ scale: 1.016 }}
                  whileTap={{ scale: 0.99 }}
                  animate={selectedPlan === 'elite'
                    ? { boxShadow: ['0 0 26px rgba(99,102,241,0.22)', '0 0 50px rgba(139,92,246,0.46)', '0 0 26px rgba(99,102,241,0.22)'] }
                    : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
                  }
                  transition={selectedPlan === 'elite'
                    ? { boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.14 } }
                    : { scale: { duration: 0.14 } }
                  }
                  style={{
                    padding:    '1px',
                    background: selectedPlan === 'elite'
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)'
                      : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <div
                    className="rounded-[15px] p-4"
                    style={{
                      background: selectedPlan === 'elite'
                        ? 'linear-gradient(160deg, #0f1120, #0c0e1c)'
                        : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <motion.span
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.35)', display: 'inline-block' }}
                      >
                        ☆ Recommended
                      </motion.span>
                      <Crown size={14} style={{ color: '#a78bfa', marginTop: 2, flexShrink: 0 }} />
                    </div>
                    <h3 className="text-base font-bold mb-0.5" style={{ color: '#f8fafc' }}>Continue without limits</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-lg font-extrabold" style={{ color: '#e2e8f0' }}>{eliteDisp.amountDisplay}</span>
                      <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{eliteDisp.suffix}</span>
                    </div>
                    <p className="text-xs font-medium mb-3" style={{ color: '#6366f1' }}>Most users upgrade at this stage</p>
                    <div className="flex flex-col gap-2">
                      {eliteFeatures.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                          <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Pro plan */}
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className="cursor-pointer rounded-xl p-4 transition-all duration-200"
                  style={{
                    background: selectedPlan === 'pro' ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.025)',
                    border:     `1px solid ${selectedPlan === 'pro' ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    boxShadow:  selectedPlan === 'pro' ? '0 0 18px rgba(37,99,235,0.12)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Rocket size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: '#d1d5db' }}>Build consistency over time</h3>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: '#6b7280' }}>Pro · {proDisp.label}</p>
                      </div>
                    </div>
                    {selectedPlan === 'pro' && (
                      <CheckCircle2 size={15} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    )}
                  </div>
                </div>

                {/* Billing cycle toggle */}
                <div className="flex items-center gap-2 self-center">
                  {['monthly', 'annual'].map(cycle => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setActiveBillingCycle(cycle)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-150"
                      style={{
                        background: activeBillingCycle === cycle ? 'rgba(99,102,241,0.18)' : 'transparent',
                        color:      activeBillingCycle === cycle ? '#c4b5fd' : '#6b7280',
                        border:     `1px solid ${activeBillingCycle === cycle ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {cycle === 'annual' ? 'Annual (save 17%)' : 'Monthly'}
                    </button>
                  ))}
                </div>

                {/* CTA */}
                <div>
                  <motion.button
                    onClick={() => goToStep(2)}
                    className="w-full rounded-xl py-4 text-base font-bold text-white relative overflow-hidden"
                    style={{
                      background:    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow:     '0 0 28px rgba(99,102,241,0.35), 0 4px 14px rgba(0,0,0,0.4)',
                      letterSpacing: '0.01em',
                    }}
                    whileHover={{
                      y:         -2,
                      boxShadow: '0 0 52px rgba(99,102,241,0.65), 0 14px 32px rgba(0,0,0,0.5)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.span
                      aria-hidden
                      style={{
                        position: 'absolute', top: 0, bottom: 0, width: 56,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                        pointerEvents: 'none',
                      }}
                      animate={{ left: ['-20%', '130%'] }}
                      transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.5 }}
                    />
                    <span className="relative z-10">Continue My Analysis →</span>
                  </motion.button>
                  <p className="text-center text-xs font-medium mt-2" style={{ color: '#6b7280' }}>Takes less than 30 seconds</p>
                </div>

                {/* Social proof */}
                <p className="text-center text-xs font-medium" style={{ color: '#6b7280' }}>
                  <span style={{ color: '#818cf8', fontWeight: 700 }}>2,000+</span> users unlocked deeper insights after this step
                </p>

                {/* Trust */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Shield size={10} style={{ color: '#4b5563', flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: '#6b7280' }}>No commitment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={10} style={{ color: '#4b5563', flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield size={10} style={{ color: '#4b5563', flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Secure checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes cta-shimmer { 0% { left: -20%; } 100% { left: 130%; } }
        `}</style>
      </Overlay>
    );
  }


  /* ══ STEP 2 — Payment ══ */
  return (
    <Overlay>
      <div style={{
        position: 'relative',
        width: '95%',
        maxWidth: 500,
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        background: '#0d1120',
        border: '1px solid rgba(99,102,241,0.45)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
        overflow: 'hidden',
      }}>

        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.08)', color: '#9ca3af',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#f8fafc'; }}
          onMouseOut={e =>  { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          <X size={14} />
        </button>

        <div style={{ flex: '1 1 0%', overflowY: 'auto', padding: '24px 20px 8px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button type="button" onClick={() => goToStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseOver={e => { e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#9ca3af'; }}
            >&#8592; Change Plan</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
              <span style={{ width: 24, height: 6, borderRadius: 3, background: '#6366f1', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Step 2 of 2</span>
            </div>
          </div>

          <div style={{ borderRadius: 14, marginBottom: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 12px' }}>
              <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected.accent + '25', border: '1px solid ' + selected.accent + '50' }}>
                <SelectedPlanIcon size={15} color={selected.accent} />
              </div>
              <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280' }}>Plan selected</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{selected.name}</div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid ' + selected.accent + '60', color: selected.accent, background: selected.accent + '20', whiteSpace: 'nowrap' }}>{selected.badge}</div>
            </div>
            <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(99,102,241,0.18)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginBottom: 3 }}>Total due</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, background: 'linear-gradient(90deg, #f1f5f9, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{isPakistanPayment ? amountPkrLabel : amountLabel}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{activeBillingCycle === 'annual' ? 'billed annually' : 'billed monthly'} &middot; Instant access after verification</div>
            </div>
            {isPakistanPayment && (
              <div style={{ padding: '9px 16px', background: 'rgba(251,191,36,0.09)', borderTop: '1px solid rgba(251,191,36,0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fde68a' }}>&#9888; Send the exact amount above. Plan activates after verification.</div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
            {[{ key: 'INTL', label: 'International' }, { key: 'PK', label: 'Pakistan' }].map(r => (
              <button key={r.key} type="button"
                onClick={() => { setPaymentRegion(r.key); const m = PAYMENT_OPTIONS_BY_REGION[r.key] || []; if (m.length > 0) setMethodKey(m[0].key); }}
                style={{ padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: paymentRegion === r.key ? 'rgba(99,102,241,0.25)' : 'transparent', color: paymentRegion === r.key ? '#c4b5fd' : '#6b7280', outline: paymentRegion === r.key ? '1px solid rgba(99,102,241,0.4)' : 'none' }}
              >{r.label}</button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 8 }}>Choose Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {currentRegionMethods.map((option, idx) => {
                const active = option.key === methodKey;
                const Icon = option.Icon;
                return (
                  <button key={option.key} type="button" onClick={() => setMethodKey(option.key)}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 11, cursor: 'pointer', textAlign: 'left', background: active ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.04)', border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {idx === 0 && (<span style={{ position: 'absolute', top: -8, left: 12, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }}>Recommended</span>)}
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)' }}>
                      <Icon size={14} color={active ? '#a5b4fc' : '#6b7280'} />
                    </div>
                    <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#f1f5f9' : '#d1d5db' }}>{option.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{paymentRegion === 'INTL' ? 'USD wire transfer' : 'Local mobile transfer'}</div>
                    </div>
                    {active && (<div style={{ flexShrink: 0, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.3)', border: '1px solid #6366f1' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a5b4fc' }} /></div>)}
                  </button>
                );
              })}
            </div>
          </div>

          {currentMethod && (
            <div style={{ borderRadius: 14, marginBottom: 12, border: '1px solid rgba(99,102,241,0.3)', background: '#111527' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.12)', borderRadius: '14px 14px 0 0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{currentMethod.name}</div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginTop: 2 }}>Bank transfer details</div>
              </div>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.08)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginBottom: 2 }}>Amount to send</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>{isPakistanPayment ? amountPkrLabel : amountLabel}</div>
              </div>
              {currentMethod.details.map((d, i) => (
                <div key={d.label} style={{ padding: '12px 16px', borderBottom: i < currentMethod.details.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: 8 }}>{d.value}</div>
                  <button type="button" onClick={() => copyText(d.value)}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 7, cursor: 'pointer', background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.35)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
                  >Copy</button>
                </div>
              ))}
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', borderRadius: '0 0 14px 14px', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{paymentRegion === 'PK' ? 'Send exactly ' + amountPkrLabel + '. Plan activates after verification.' : 'US: Routing Number (ACH). International: SWIFT. Verified within 1-2 hours.'}</div>
              </div>
            </div>
          )}

          <div style={{ borderRadius: 14, marginBottom: 4, border: '1px solid rgba(255,255,255,0.12)', background: '#111527' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', borderRadius: '14px 14px 0 0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Confirm Payment</div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div onClick={() => fileRef.current && fileRef.current.click()}
                style={{ cursor: 'pointer', borderRadius: 10, textAlign: 'center', padding: '20px 16px', border: proof ? '2px dashed #34d399' : '2px dashed rgba(99,102,241,0.45)', background: proof ? 'rgba(52,211,153,0.07)' : 'rgba(99,102,241,0.06)' }}
                onMouseOver={e => { if (!proof) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)'; }}
                onMouseOut={e => { if (!proof) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'; }}
              >
                <Upload size={18} color={proof ? '#34d399' : '#6366f1'} style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: proof ? '#34d399' : '#a5b4fc', wordBreak: 'break-all' }}>{proof ? proof.name : 'Upload payment screenshot'}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{proof ? 'Tap to replace' : 'PNG, JPG, or WebP - click to browse'}</div>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={e => setProof(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Transaction reference or note (optional)" rows={2}
                style={{ width: '100%', borderRadius: 9, padding: '9px 12px', fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </div>

        </div>

        <div style={{ flexShrink: 0, padding: '14px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(9,9,20,0.98)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <ErrorBar message={error} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Shield size={12} color="#6366f1" /><span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Secure payment</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CreditCard size={12} color="#6366f1" /><span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Trusted processing</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><RotateCcw size={12} color="#6366f1" /><span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Refund guarantee</span></div>
          </div>
          <button type="button" onClick={submitPayment} disabled={submitting || !proof}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: submitting || !proof ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: submitting || !proof ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: submitting || !proof ? 'none' : '0 0 24px rgba(99,102,241,0.4)', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting&hellip;</> : 'Complete Secure Payment \u2192'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', margin: 0 }}>
            Need help? <a href="mailto:getzynth@gmail.com" style={{ color: '#818cf8', textDecoration: 'none' }}>getzynth@gmail.com</a> &mdash; we respond fast.
          </p>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Overlay>
  );
}
