import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, Zap, ShieldCheck, Sparkles, Globe, Landmark,
  Smartphone, Upload, Loader2, CheckCircle, ChevronDown,
  ArrowLeft, Crown, Rocket,
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
    price: 9,
    badge: 'Most Popular',
    accent: '#22c55e',
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
    price: 19,
    badge: 'Best Value',
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

const PAYMENT_METHODS = {
  international: {
    key: 'international',
    label: 'International',
    Icon: Globe,
    methods: [
      {
        key: 'citibank',
        name: 'Citibank Wire',
        details: [
          { label: 'Bank',           value: 'Citibank' },
          { label: 'Account Name',   value: 'Shahrukh Hamza' },
          { label: 'Account Number', value: '70584510002334445' },
          { label: 'Routing Number', value: '031100209' },
          { label: 'SWIFT / BIC',    value: 'CITIUS33' },
          { label: 'Currency',       value: 'USD' },
        ],
      },
      {
        key: 'payoneer',
        name: 'Payoneer',
        details: [
          { label: 'Payoneer Email', value: 'payments@zynth.app' },
          { label: 'Account Name',  value: 'Zynth Technologies Ltd' },
          { label: 'Currency',      value: 'USD' },
        ],
      },
    ],
  },
  pakistan: {
    key: 'pakistan',
    label: 'Pakistan',
    Icon: Smartphone,
    methods: [
      {
        key: 'jazzcash',
        name: 'JazzCash',
        details: [
          { label: 'Account Holder', value: 'SHAHRUKH HAMZA' },
          { label: 'IBAN',           value: 'PK36JCMA0301923175516692' },
        ],
      },
      {
        key: 'nayapay',
        name: 'NayaPay',
        details: [
          { label: 'Account Holder', value: 'SHAHRUKH HAMZA' },
          { label: 'IBAN',           value: 'PK36JCMA0301923175516692' },
        ],
      },
    ],
  },
};

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function TrustBadges({ theme }) {
  const items = [
    { text: 'Secure payment', Icon: ShieldCheck },
    { text: 'Instant activation', Icon: Zap },
    { text: 'No hidden fees', Icon: Sparkles },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ text, Icon }) => (
        <span
          key={text}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
          style={{
            borderColor: theme.isDark ? 'rgba(59,130,246,0.32)' : 'rgba(59,130,246,0.22)',
            background:   theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
            color:        theme.isDark ? '#bfdbfe' : '#1d4ed8',
          }}
        >
          <Icon size={12} />{text}
        </span>
      ))}
    </div>
  );
}

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
  const [region,       setRegion]       = useState('international');
  const [methodKey,    setMethodKey]    = useState(PAYMENT_METHODS.international.methods[0].key);
  const [proof,        setProof]        = useState(null);
  const [note,         setNote]         = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) { setVisible(true); setStep(1); setStepIn(true); }
    else setVisible(false);
  }, [open]);

  useEffect(() => {
    setSelectedPlan(requiredPlan === 'elite' ? 'elite' : 'pro');
  }, [requiredPlan]);

  useEffect(() => {
    const first = PAYMENT_METHODS[region].methods[0]?.key;
    setMethodKey(first || '');
  }, [region]);

  const currentRegion = PAYMENT_METHODS[region];
  const currentMethod = useMemo(
    () => currentRegion.methods.find(m => m.key === methodKey) || currentRegion.methods[0],
    [currentRegion, methodKey],
  );
  const selected    = PLANS[selectedPlan];
  const amountLabel = `$${selected.price}/month`;

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
    if (!proof) { setError('Please upload payment proof to continue.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('plan',   selectedPlan);
      form.append('method', `${currentRegion.label} — ${currentMethod.name}`);
      form.append('amount', amountLabel);
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
            Payment Submitted 🎉
          </h3>
          <p className="mt-2 text-sm" style={{ color: subtleText }}>
            Your account will be upgraded shortly.
          </p>
          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)' }}
          >
            Continue using Zynth
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
          className="relative w-[95%] max-w-md sm:max-w-xl rounded-2xl p-[1px]"
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

            <div className="px-6 pt-6 pb-7" style={transitionStyle}>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-6 rounded-full" style={{ background: '#3b82f6' }} />
                  <span className="h-1.5 w-2 rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.15)' : '#dbe3ee' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: mutedText }}>Step 1 of 2</span>
              </div>

              <TrustBadges theme={theme} />

              <h2 className="mt-4 text-2xl font-extrabold leading-tight" style={{ color: headingText }}>
                {headline || 'Unlock Full Zynth 🚀'}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: mutedText }}>
                {message || "You've started building your edge. Don't stop now."}
              </p>

              {reason && (
                <div
                  className="mt-4 rounded-xl border px-3 py-2.5 text-xs leading-relaxed"
                  style={{
                    borderColor: theme.isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.3)',
                    background:  theme.isDark ? 'rgba(245,158,11,0.09)' : 'rgba(245,158,11,0.08)',
                    color:       theme.isDark ? '#fcd34d' : '#b45309',
                  }}
                >
                  {reason}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(PLANS).map(plan => {
                  const active   = selectedPlan === plan.id;
                  const PlanIcon = plan.Icon;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className="rounded-2xl border text-left transition-all duration-150"
                      style={{
                        padding:      '20px',
                        borderColor:  active ? plan.accent : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee'),
                        background:   active
                          ? (theme.isDark ? `rgba(${plan.id === 'pro' ? '34,197,94' : '245,158,11'},0.07)` : '#f8fbff')
                          : panelSurface,
                        boxShadow:    active ? `0 0 0 1px ${plan.accent}55, 0 8px 32px ${plan.accent}18` : 'none',
                        transform:    active ? 'translateY(-1px)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
                          style={{
                            borderColor: `${plan.accent}55`,
                            color:       plan.accent,
                            background:  `${plan.accent}15`,
                          }}
                        >
                          {plan.badge}
                        </span>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ background: active ? `${plan.accent}22` : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9') }}
                        >
                          {active
                            ? <Check size={14} color={plan.accent} strokeWidth={2.5} />
                            : <PlanIcon size={14} color={subtleText} />
                          }
                        </div>
                      </div>

                      <div className="mb-1 text-xl font-extrabold" style={{ color: headingText }}>
                        {plan.name}
                      </div>
                      <div className="mb-4 tabular-nums font-semibold" style={{ color: plan.accent, fontSize: '15px' }}>
                        ${plan.price}<span style={{ color: mutedText, fontSize: '12px', fontWeight: 400 }}>/month</span>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: subtleText }}>
                            <Check size={12} color={plan.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={plan.id === 'elite' && f.includes('Unlimited AI') ? { color: headingText, fontWeight: 600 } : {}}>
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => goToStep(2)}
                className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-white inline-flex items-center justify-center gap-2"
                style={{
                  background: selectedPlan === 'elite'
                    ? 'linear-gradient(135deg, #b45309, #f59e0b)'
                    : 'linear-gradient(135deg, #1d4ed8, #06b6d4)',
                  boxShadow: selectedPlan === 'elite'
                    ? '0 8px 24px rgba(245,158,11,0.28)'
                    : '0 8px 24px rgba(14,165,233,0.28)',
                }}
              >
                Continue with {selected.name} — ${selected.price}/mo
              </button>

              <p className="mt-2.5 text-center text-xs" style={{ color: mutedText }}>
                You can switch plans anytime · No contracts
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
        className="relative w-[95%] max-w-md sm:max-w-lg rounded-2xl p-[1px]"
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
                  <ArrowLeft size={12} /> Change plan
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
                className="flex items-center gap-3 rounded-2xl border p-4 mb-5"
                style={{
                  borderColor: `${selected.accent}55`,
                  background:  theme.isDark ? `rgba(${selected.id === 'pro' ? '34,197,94' : '245,158,11'},0.07)` : '#f8fbff',
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: `${selected.accent}22` }}
                >
                  <selected.Icon size={18} color={selected.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: headingText }}>
                    {selected.name} Plan
                  </div>
                  <div className="text-xs" style={{ color: mutedText }}>
                    {amountLabel} — billed monthly
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

              <h2 className="text-lg font-extrabold mb-1" style={{ color: headingText }}>
                Complete your payment
              </h2>
              <p className="text-xs mb-4" style={{ color: mutedText }}>
                Send {amountLabel} using any method below, then upload your receipt.
              </p>

              <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                {Object.values(PAYMENT_METHODS).map(r => {
                  const active = region === r.key;
                  const Icon   = r.Icon;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRegion(r.key)}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold flex-shrink-0 transition-colors"
                      style={{
                        borderColor: active ? '#3b82f6' : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee'),
                        background:  active ? (theme.isDark ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.08)') : panelSurface,
                        color:       active ? '#60a5fa' : subtleText,
                      }}
                    >
                      <Icon size={14} /> {r.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative mb-3">
                <select
                  value={methodKey}
                  onChange={e => setMethodKey(e.target.value)}
                  className="w-full appearance-none rounded-lg border px-4 py-3 pr-9 text-sm font-medium"
                  style={{
                    borderColor:      theme.isDark ? 'rgba(255,255,255,0.12)' : '#dbe3ee',
                    background:       panelSurface,
                    color:            headingText,
                    WebkitAppearance: 'none',
                    MozAppearance:    'none',
                  }}
                >
                  {currentRegion.methods.map(m => (
                    <option key={m.key} value={m.key}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown size={15} color={mutedText} style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }} />
              </div>

              <div
                className="rounded-xl border p-4 mb-4"
                style={{
                  borderColor: theme.isDark ? 'rgba(59,130,246,0.24)' : 'rgba(59,130,246,0.2)',
                  background:  theme.isDark ? 'rgba(15,23,42,0.62)' : '#f8fbff',
                }}
              >
                <div className="mb-2.5 text-sm font-bold" style={{ color: headingText }}>
                  {currentMethod.name}{' '}
                  <span style={{ color: '#60a5fa' }}>· Send {amountLabel}</span>
                </div>
                <div className="space-y-1.5">
                  {currentMethod.details.map(d => (
                    <div
                      key={d.label}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs"
                    >
                      <span className="font-semibold" style={{ color: mutedText }}>{d.label}</span>
                      <span className="inline-flex items-center gap-2 flex-wrap justify-end" style={{ color: headingText }}>
                        {d.value}
                        <button
                          type="button"
                          onClick={() => copyText(d.value)}
                          className="rounded border px-1.5 py-0.5 text-[10px]"
                          style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', color: mutedText }}
                        >
                          Copy
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl border p-3 mb-2"
                style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee', background: panelSurface }}
              >
                <div className="mb-2 text-xs font-semibold" style={{ color: headingText }}>
                  Upload payment screenshot to activate your plan
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
                  placeholder="Reference / transaction note (optional)"
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

            <button
              type="button"
              onClick={submitPayment}
              disabled={submitting || !proof}
              className="w-full rounded-xl py-3 text-sm font-bold text-white inline-flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)',
                boxShadow:  '0 8px 20px rgba(14,165,233,0.24)',
                opacity:    submitting || !proof ? 0.65 : 1,
                cursor:     submitting || !proof ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                : 'Complete Payment'
              }
            </button>

            <div className="mt-2 text-center text-xs" style={{ color: mutedText }}>
              <Landmark size={12} style={{ display: 'inline', marginRight: 4 }} />
              Verification usually takes a few minutes.
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Overlay>
  );
}
