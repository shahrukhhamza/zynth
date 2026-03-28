import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, Sparkles, Landmark,
  Smartphone, Upload, Loader2, CheckCircle,
  Crown, Rocket,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import ErrorBar from './ErrorBar';

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Recommended',
    accent: '#2563eb',
    Icon: Rocket,
    features: [
      'Unlimited journal entries',
      'AI insights up to 50 / month',
      'Advanced analytics dashboard',
      'Live economic intelligence',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    badge: 'Power Users',
    accent: '#f59e0b',
    Icon: Crown,
    features: [
      'Everything in Pro',
      'Unlimited AI insights — no cap',
      'Premium strategy breakdowns',
      'Priority support & early access',
    ],
  },
};

const USD_PRICES = {
  monthly: { pro: 9, elite: 19 },
  annual: { pro: 90, elite: 190 },
};

const PKR_BY_PLAN = {
  monthly: { pro: 2500, elite: 5300 },
  annual: { pro: 25000, elite: 53000 },
};

const PAYMENT_OPTIONS = [
  {
    key: 'jazzcash',
    name: 'JazzCash',
    Icon: Smartphone,
    details: [
      { label: 'Account Title', value: 'Shahrukh Hamza' },
      { label: 'Mobile Number', value: '03019231755' },
      { label: 'CNIC', value: '35202-1234567-8' },
    ],
  },
];

const PAYMENT_OPTIONS_BY_REGION = {
  PK: PAYMENT_OPTIONS,
  INTL: [
    {
      key: 'bank-wire-usd',
      name: 'Bank Wire (USD)',
      Icon: Landmark,
      details: [
        { label: 'Account Name', value: 'Shahrukh Hamza' },
        { label: 'IBAN (Payoneer)', value: 'GB29NWBK60161331926819' },
        { label: 'SWIFT / BIC', value: 'PAYNGB2L' },
      ],
    },
  ],
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
  billingCycle = 'monthly',
  reason = null,
  headline = null,
  message = null,
}) {
  const theme  = useTheme();
  const { token } = useAuth();

  const [visible,      setVisible]      = useState(Boolean(open));
  const [step,         setStep]         = useState(1);
  const [stepIn,       setStepIn]       = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(requiredPlan === 'elite' ? 'elite' : 'pro');
  const [paymentRegion, setPaymentRegion] = useState('PK');
  const [methodKey,    setMethodKey]    = useState(PAYMENT_OPTIONS[0].key);
  const [requiredPkr,  setRequiredPkr]  = useState(PKR_BY_PLAN[billingCycle]?.[requiredPlan === 'elite' ? 'elite' : 'pro'] ?? PKR_BY_PLAN.monthly.pro);
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
      setSelectedPlan(requiredPlan === 'elite' ? 'elite' : 'pro');
      setPaymentRegion('PK');
      setRequiredPkr(PKR_BY_PLAN[billingCycle]?.[requiredPlan === 'elite' ? 'elite' : 'pro'] ?? PKR_BY_PLAN.monthly.pro);
      setMethodKey(PAYMENT_OPTIONS[0].key);
    }
    else setVisible(false);
  }, [billingCycle, open, requiredPlan]);

  useEffect(() => {
    setRequiredPkr(PKR_BY_PLAN[billingCycle]?.[selectedPlan] || PKR_BY_PLAN.monthly.pro);
  }, [billingCycle, selectedPlan]);

  useEffect(() => {
    const defaultMethod = PAYMENT_OPTIONS_BY_REGION[paymentRegion]?.[0]?.key || '';
    setMethodKey(defaultMethod);
  }, [paymentRegion]);

  const currentRegionMethods = PAYMENT_OPTIONS_BY_REGION[paymentRegion] || PAYMENT_OPTIONS_BY_REGION.PK;
  const currentMethod = useMemo(
    () => currentRegionMethods.find(option => option.key === methodKey) || currentRegionMethods[0],
    [currentRegionMethods, methodKey],
  );
  const selected    = selectedPlan ? PLANS[selectedPlan] : null;
  const selectedUsdAmount = selectedPlan ? (USD_PRICES[billingCycle]?.[selectedPlan] ?? USD_PRICES.monthly.pro) : null;
  const amountLabel = selected ? `$${selectedUsdAmount}/${billingCycle === 'annual' ? 'year' : 'month'}` : '';
  const amountPkrLabel = `PKR ${requiredPkr.toLocaleString()}`;
  const isPakistanPayment = paymentRegion === 'PK';
  const annualHelper = selected && billingCycle === 'annual'
    ? `Equivalent to $${(selectedUsdAmount / 12).toFixed(2)}/mo billed annually`
    : null;

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
      form.append('billingCycle', billingCycle);
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
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
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

  /* ══ STEP 1 — Plan Selection ══ */
  if (step === 1) {
    return (
      <Overlay>
        <div
          className="relative w-[95%] max-w-md sm:max-w-2xl rounded-2xl p-[1px]"
          style={{
            background:  'linear-gradient(140deg, rgba(59,130,246,0.65), rgba(6,182,212,0.55), rgba(245,158,11,0.5))',
            boxShadow:   '0 36px 110px rgba(0,0,0,0.82)',
            maxHeight:   'min(92vh, 100%)',
          }}
        >
          <div
            className="relative rounded-2xl flex flex-col"
            style={{ background: modalBg, maxHeight: 'calc(92vh - 2px)', overflowY: 'auto' }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ background: panelSurface, color: subtleText }}
              onMouseOver={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'; e.currentTarget.style.color = headingText; }}
              onMouseOut={e => { e.currentTarget.style.background = panelSurface; e.currentTarget.style.color = subtleText; }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 sm:px-7 pt-6 pb-8" style={transitionStyle}>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-6 rounded-full" style={{ background: '#3b82f6' }} />
                  <span className="h-1.5 w-2 rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.15)' : '#dbe3ee' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: mutedText }}>Step 1 of 2</span>
              </div>

              <h2 className="text-2xl sm:text-[28px] font-extrabold leading-tight text-gray-900 dark:text-gray-100">
                Unlock Full Zynth
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400 max-w-xl">
                Choose your plan and unlock the full trading operating system.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40">
                  <Sparkles size={12} /> 2,300+ traders upgraded this month
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40">
                  Pricing lock in effect for new members
                </div>
              </div>

              <div className="mt-6 mb-3">
                <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400">
                  Pick your plan
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {Object.values(PLANS).map(plan => {
                  const active   = selectedPlan === plan.id;
                  const PlanIcon = plan.Icon;
                  const isPro    = plan.id === 'pro';
                  const isElite  = plan.id === 'elite';
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ease-out hover:scale-[1.02] ${isPro ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'bg-indigo-50 dark:bg-indigo-900/10 border border-gray-200 dark:border-gray-700 shadow-sm'} ${active ? 'border-blue-500 ring-2 ring-blue-500/30 scale-[1.02]' : ''}`}
                      style={{
                        transformOrigin: 'center',
                      }}
                    >
                      {isPro && (
                        <>
                          <div
                            aria-hidden
                            className="pointer-events-none absolute -top-10 -right-12 h-24 w-28 rounded-full blur-2xl"
                            style={{ background: 'rgba(59,130,246,0.22)' }}
                          />
                          <span className="absolute top-3 right-3 inline-flex items-center rounded-full border border-blue-300/70 dark:border-blue-500/50 bg-white/90 dark:bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-700 dark:text-blue-300">
                            Most Chosen
                          </span>
                        </>
                      )}
                      {isElite && (
                        <span className="absolute top-3 right-3 inline-flex items-center rounded-full border border-indigo-300/70 dark:border-indigo-500/50 bg-white/90 dark:bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-700 dark:text-indigo-300">
                          Used by advanced traders
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
                          style={{
                            borderColor: plan.id === 'pro' ? 'rgba(59,130,246,0.35)' : 'rgba(245,158,11,0.45)',
                            color:       plan.id === 'pro' ? '#1d4ed8' : '#b45309',
                            background:  plan.id === 'pro' ? 'rgba(59,130,246,0.10)' : 'rgba(245,158,11,0.12)',
                          }}
                        >
                          {plan.badge}
                        </span>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ background: active ? '#dbeafe' : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9') }}
                        >
                          {active
                            ? <Check size={14} color="#2563eb" strokeWidth={2.5} />
                            : <PlanIcon size={14} color={subtleText} />
                          }
                        </div>
                      </div>

                      <div className="mb-1 text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        {plan.name} Plan
                      </div>
                      <div className="mb-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {isPro
                          ? 'Best starting point for consistent trading growth'
                          : 'For high-frequency and advanced traders'}
                      </div>
                      <div className="mb-4 tabular-nums font-semibold text-blue-600 dark:text-blue-400" style={{ fontSize: '15px' }}>
                        ${USD_PRICES[billingCycle]?.[plan.id] ?? USD_PRICES.monthly[plan.id]}/{billingCycle === 'annual' ? 'year' : 'month'}
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="-mt-2 mb-4 text-[11px] text-gray-400 dark:text-gray-500">
                          Equivalent to ${((USD_PRICES.annual[plan.id] ?? 0) / 12).toFixed(2)}/mo billed annually
                        </div>
                      )}
                      {isPro && (
                        <>
                          <div className={`${billingCycle === 'annual' ? 'mb-1' : '-mt-2 mb-1'} text-sm text-gray-500 dark:text-gray-400`}>
                            Most traders start here
                          </div>
                          <div className="mb-4 text-[11px] text-gray-400 dark:text-gray-500">
                            No commitment — upgrade anytime
                          </div>
                        </>
                      )}
                      {isElite && (
                        <>
                          <div className={`${billingCycle === 'annual' ? 'mb-1' : '-mt-2 mb-1'} text-sm text-gray-500 dark:text-gray-400`}>
                            {billingCycle === 'annual' ? 'Best value when billed yearly' : 'Only $10 more for unlimited AI'}
                          </div>
                          <div className="mb-4 text-[11px] text-gray-400 dark:text-gray-500">
                            {billingCycle === 'annual' ? 'Save 17% with annual billing' : 'Switch to yearly anytime'}
                          </div>
                        </>
                      )}

                      <ul className="space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            <Check size={12} color={plan.id === 'elite' ? '#f59e0b' : '#2563eb'} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span className={isElite && f.includes('Unlimited AI insights') ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {isElite && (
                        <div className="mt-3 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                          Remove all limits and unlock full power
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                Need unlimited AI? Upgrade to Elite
              </div>

              <button
                type="button"
                onClick={() => goToStep(2)}
                disabled={!selectedPlan}
                className="mt-7 w-full rounded-xl py-3.5 text-sm font-bold text-white inline-flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)',
                  boxShadow: '0 8px 24px rgba(14,165,233,0.28)',
                  opacity: selectedPlan ? 1 : 0.55,
                  cursor: selectedPlan ? 'pointer' : 'not-allowed',
                }}
              >
                {selectedPlan === 'elite' ? 'Continue with Elite →' : 'Continue with Pro →'}
              </button>

              <p className="mt-2.5 text-center text-xs text-gray-500 dark:text-gray-400">
                {selectedPlan === 'elite'
                  ? 'You’re choosing Elite — unlock full trading power'
                  : 'You’re choosing Pro — perfect for getting started'}
              </p>
              <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
                7-day refund guarantee • Cancel anytime
              </p>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Overlay>
    );
  }

  /* ══ STEP 2 — Payment ══ */
  return (
    <Overlay>
      <div
        className="relative w-[95%] max-w-md sm:max-w-xl rounded-2xl p-[1px]"
        style={{
          background: 'linear-gradient(140deg, rgba(59,130,246,0.65), rgba(6,182,212,0.55), rgba(245,158,11,0.5))',
          boxShadow:  '0 36px 110px rgba(0,0,0,0.82)',
          maxHeight:  'min(92vh, 100%)',
        }}
      >
        <div
          className="relative rounded-2xl flex flex-col"
          style={{ background: modalBg, maxHeight: 'calc(92vh - 2px)' }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ background: panelSurface, color: subtleText }}
            onMouseOver={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'; e.currentTarget.style.color = headingText; }}
            onMouseOut={e => { e.currentTarget.style.background = panelSurface; e.currentTarget.style.color = subtleText; }}
          >
            <X className="w-4 h-4" />
          </button>

          <form
            onSubmit={submitPayment}
            className="px-6 pt-6 pb-2"
            style={{ overflowY: 'auto', minHeight: 0 }}
          >
            <div style={transitionStyle}>
              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-colors"
                  style={{
                    color:      subtleText,
                    border:     `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee'}`,
                    background: panelSurface,
                  }}
                  onMouseOver={e => { e.currentTarget.style.color = headingText; }}
                  onMouseOut={e => { e.currentTarget.style.color = subtleText; }}
                >
                  ← Change Plan
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-2 rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.15)' : '#dbe3ee' }} />
                    <span className="h-1.5 w-6 rounded-full" style={{ background: '#3b82f6' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: mutedText }}>Step 2 of 2</span>
                </div>
              </div>

              <div
                className="rounded-2xl border p-5 mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800"
                style={{
                  borderColor: theme.isDark ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.22)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: `${selected.accent}22` }}
                    >
                      <selected.Icon size={18} color={selected.accent} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        You selected: {selected.name} Plan
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {isPakistanPayment ? `${amountLabel} • ≈ ${amountPkrLabel}` : amountLabel}
                      </div>
                      {annualHelper && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          {annualHelper}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      borderColor: `${selected.accent}55`,
                      color:       selected.accent,
                      background:  `${selected.accent}15`,
                    }}
                  >
                    {selected.badge}
                  </span>
                </div>
                {isPakistanPayment ? (
                  <div className="mt-4 rounded-xl border border-amber-300/50 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-900/20 p-3">
                    <div className="text-sm font-bold text-amber-800 dark:text-amber-300">Amount to Pay: {amountPkrLabel}</div>
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      ⚠️ Please send the exact amount. Payments below this will not be accepted.
                    </div>
                    <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-200/80">
                      Final conversion may vary slightly depending on exchange rate.
                    </div>
                    {annualHelper && (
                      <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-200/80">
                        {annualHelper}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-blue-300/50 dark:border-blue-600/40 bg-blue-50 dark:bg-blue-900/20 p-3">
                    <div className="text-sm font-bold text-blue-800 dark:text-blue-300">Amount to Pay: {amountLabel}</div>
                    <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      Send {amountLabel} (USD) using bank transfer.
                    </div>
                    {annualHelper && (
                      <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-200/80">
                        {annualHelper}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 p-1 grid grid-cols-2 gap-1 bg-gray-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setPaymentRegion('INTL')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${paymentRegion === 'INTL' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  International
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentRegion('PK')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${paymentRegion === 'PK' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Pakistan
                </button>
              </div>

              <h3 className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-2">Choose Payment Method</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {currentRegionMethods.map(option => {
                  const active = option.key === methodKey;
                  const Icon = option.Icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setMethodKey(option.key)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.02] ${active ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={15} color={active ? '#2563eb' : subtleText} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{option.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {paymentRegion === 'INTL' ? 'USD transfer and upload proof' : 'Local transfer and upload proof'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <h3 className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-2">Send Payment</h3>
              <p className="text-xs mb-3" style={{ color: mutedText }}>
                {paymentRegion === 'INTL'
                  ? `Send ${amountLabel} (USD) using bank transfer`
                  : `Send ${amountPkrLabel}`}
              </p>

              <div
                className="rounded-2xl border p-5 mb-5 shadow-sm"
                style={{
                  borderColor: theme.isDark ? 'rgba(59,130,246,0.24)' : 'rgba(59,130,246,0.2)',
                  background:  theme.isDark ? 'rgba(15,23,42,0.62)' : '#f8fbff',
                }}
              >
                <div className="mb-3 text-sm font-bold" style={{ color: headingText }}>
                  {currentMethod.name}
                </div>
                <div className="rounded-xl border border-blue-300/40 dark:border-blue-600/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 mb-3 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {paymentRegion === 'INTL'
                    ? `Send ${amountLabel} to the account below`
                    : `Send ${amountPkrLabel} to the account below`}
                </div>
                <div className="space-y-2">
                  {currentMethod.details.map(d => (
                    <div
                      key={d.label}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs rounded-xl border border-gray-200/70 dark:border-gray-700/70 px-3 py-2"
                    >
                      <span className="font-semibold" style={{ color: mutedText }}>{d.label}</span>
                      <span className="inline-flex items-center gap-2 flex-wrap justify-end" style={{ color: headingText }}>
                        {d.value}
                        <button
                          type="button"
                          onClick={() => copyText(d.value)}
                          className="rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors"
                          style={{
                            borderColor: theme.isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.35)',
                            color: '#2563eb',
                            background: theme.isDark ? 'rgba(30,64,175,0.18)' : 'rgba(219,234,254,0.9)',
                          }}
                        >
                          Copy
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                {paymentRegion === 'PK' && (
                  <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                    Only payments equal to {amountPkrLabel} will be approved.
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl border p-4 mb-2"
                style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee', background: panelSurface }}
              >
                <h3 className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-2">Upload Proof</h3>
                <div className="mb-2 text-xs font-semibold" style={{ color: headingText }}>
                  Upload payment proof
                </div>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center"
                  style={{ borderColor: proof ? '#22c55e' : (theme.isDark ? 'rgba(255,255,255,0.16)' : '#cbd5e1') }}
                >
                  <Upload size={16} color={proof ? '#22c55e' : mutedText} style={{ margin: '0 auto 6px' }} />
                  <div className="text-xs" style={{ color: proof ? '#22c55e' : mutedText }}>
                    {proof ? proof.name : 'Click to upload payment proof screenshot'}
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={e => setProof(e.target.files?.[0] || null)}
                />
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Transaction reference (optional)"
                  rows={2}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-xs"
                  style={{
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : '#dbe3ee',
                    background:  theme.isDark ? 'rgba(2,6,23,0.6)' : '#ffffff',
                    color:       headingText,
                    resize:      'vertical',
                  }}
                />
              </div>
            </div>
          </form>

          <div
            className="px-6 py-4 mt-auto"
            style={{
              borderTop:    `1px solid ${theme.isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}`,
              background:   theme.isDark ? 'rgba(8,12,20,0.97)' : '#ffffff',
              boxShadow:    theme.isDark ? '0 -12px 28px rgba(2,6,23,0.45)' : '0 -10px 22px rgba(15,23,42,0.06)',
              borderRadius: '0 0 1rem 1rem',
            }}
          >
            {error && <ErrorBar message={error} className="mb-3" />}

            <div className="mb-3 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-3">
              <span>🔒 Secure checkout</span>
              <span>💳 Powered by Paddle</span>
              <span>🔁 7-day refund guarantee</span>
            </div>

            <button
              type="button"
              onClick={submitPayment}
              disabled={submitting || !proof}
              className="w-full rounded-xl py-3 text-sm font-bold text-white inline-flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)',
                boxShadow:  '0 8px 20px rgba(14,165,233,0.24)',
                opacity:    submitting || !proof ? 0.65 : 1,
                cursor:     submitting || !proof ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                : 'Confirm Payment →'
              }
            </button>

            <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
              Takes less than 1 minute
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Overlay>
  );
}
