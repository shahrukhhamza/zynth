import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, Zap, ShieldCheck, Sparkles, Globe, Landmark,
  Smartphone, Upload, Loader2, CheckCircle, ChevronDown,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

const PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    badge: 'Most Popular',
    accent: '#22c55e',
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
    features: [
      'Everything in Pro',
      'Unlimited AI insights',
      'Premium strategy breakdowns',
      'Priority support and early access',
    ],
  },
};

const PAYMENT_METHODS = {
  international: {
    key: 'international',
    label: '🌍 International',
    Icon: Globe,
    methods: [
      {
        key: 'citibank',
        name: 'Citibank Wire',
        details: [
          { label: 'Bank', value: 'Citibank' },
          { label: 'Account Name', value: 'Zynth Technologies Ltd' },
          { label: 'Account Number', value: '70584510002334445' },
          { label: 'Routing Number', value: '031100209' },
          { label: 'SWIFT / BIC', value: 'CITIUS33' },
          { label: 'Currency', value: 'USD' },
        ],
      },
      {
        key: 'payoneer',
        name: 'Payoneer',
        details: [
          { label: 'Payoneer Email', value: 'payments@zynth.app' },
          { label: 'Account Name', value: 'Zynth Technologies Ltd' },
          { label: 'Currency', value: 'USD' },
        ],
      },
    ],
  },
  pakistan: {
    key: 'pakistan',
    label: '🇵🇰 Pakistan',
    Icon: Smartphone,
    methods: [
      {
        key: 'jazzcash',
        name: 'JazzCash',
        details: [
          { label: 'Account Holder', value: 'SHAHRUKH HAMZA' },
          { label: 'IBAN', value: 'PK36JCMA0301923175516692' },
        ],
      },
      {
        key: 'nayapay',
        name: 'NayaPay',
        details: [
          { label: 'Account Holder', value: 'SHAHRUKH HAMZA' },
          { label: 'IBAN', value: 'PK36JCMA0301923175516692' },
        ],
      },
    ],
  },
};

/**
 * UpgradeModal
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   requiredPlan  — 'pro' | 'elite'
 *   reason        — optional context text from gate trigger
 *   headline      — optional header override
 *   message       — optional subheader override
 */
export default function UpgradeModal({
  open,
  onClose,
  requiredPlan = 'pro',
  reason = null,
  headline = null,
  message = null,
}) {
  const theme = useTheme();
  const { token } = useAuth();
  const [visible, setVisible] = useState(Boolean(open));
  const [selectedPlan, setSelectedPlan] = useState(requiredPlan === 'elite' ? 'elite' : 'pro');
  const [region, setRegion] = useState('international');
  const [methodKey, setMethodKey] = useState(PAYMENT_METHODS.international.methods[0].key);
  const [proof, setProof] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) setVisible(true);
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
  const selected = PLANS[selectedPlan];
  const amountLabel = `$${selected.price}/month`;

  if (!visible) return null;

  const headingText = theme.isDark ? '#f8fafc' : '#0f172a';
  const mutedText = theme.isDark ? '#9ca3af' : '#64748b';
  const subtleText = theme.isDark ? '#94a3b8' : '#526174';
  const panelSurface = theme.isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';

  async function submitPayment(e) {
    e.preventDefault();
    if (!proof) {
      setError('Please upload payment proof to continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('plan', selectedPlan);
      form.append('method', `${currentRegion.label} — ${currentMethod.name}`);
      form.append('amount', amountLabel);
      form.append('note', note.trim());
      form.append('proof', proof);

      const res = await fetch(`${API_URL}/api/payments/submit`, {
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
    setError(null);
    setProof(null);
    setNote('');
    onClose?.();
  }

  function copyText(v) {
    navigator.clipboard?.writeText(v);
  }

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{
            background: theme.isDark ? 'rgba(8,12,20,0.95)' : '#ffffff',
            borderColor: theme.isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.2)',
            boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
          }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle size={30} color="#22c55e" />
          </div>
          <h3 className="text-2xl font-extrabold" style={{ color: headingText }}>Payment Submitted 🎉</h3>
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
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl p-[1px]"
        style={{
          maxHeight: '92vh',
          background: 'linear-gradient(140deg, rgba(59,130,246,0.65), rgba(6,182,212,0.55), rgba(245,158,11,0.5))',
          boxShadow: '0 36px 110px rgba(0,0,0,0.82)',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: theme.isDark
              ? 'linear-gradient(180deg, rgba(8,12,20,0.98), rgba(6,9,16,0.98))'
              : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(92vh - 2px)',
          }}
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

          <form onSubmit={submitPayment} className="px-6 py-6" style={{ overflowY: 'auto', minHeight: 0 }}>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              {[
                { text: 'Secure payment', Icon: ShieldCheck },
                { text: 'Instant activation', Icon: Zap },
                { text: 'No hidden fees', Icon: Sparkles },
              ].map(({ text, Icon }) => (
                <span key={text} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
                  style={{
                    borderColor: theme.isDark ? 'rgba(59,130,246,0.32)' : 'rgba(59,130,246,0.22)',
                    background: theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
                    color: theme.isDark ? '#bfdbfe' : '#1d4ed8',
                  }}>
                  <Icon size={12} />{text}
                </span>
              ))}
            </div>

            <h2 className="mt-4 text-2xl font-extrabold" style={{ color: headingText }}>
              {headline || 'Upgrade Your Trading Edge 🚀'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: mutedText }}>
              {message || 'Unlock AI-powered insights and go pro in seconds'}
            </p>

            {reason && (
              <div className="mt-4 rounded-xl border px-3 py-2 text-xs"
                style={{
                  borderColor: theme.isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.3)',
                  background: theme.isDark ? 'rgba(245,158,11,0.09)' : 'rgba(245,158,11,0.08)',
                  color: theme.isDark ? '#fcd34d' : '#b45309',
                }}>
                {reason}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.values(PLANS).map(plan => {
                const active = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className="rounded-xl border p-4 text-left transition-all"
                    style={{
                      borderColor: active ? plan.accent : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee'),
                      background: active
                        ? (theme.isDark ? 'rgba(15,23,42,0.92)' : '#f8fbff')
                        : panelSurface,
                      boxShadow: plan.id === 'elite' && active ? '0 0 24px rgba(245,158,11,0.22)' : 'none',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          borderColor: `${plan.accent}66`,
                          color: plan.accent,
                          background: `${plan.accent}1a`,
                        }}>
                        {plan.badge}
                      </span>
                      {active && <Check size={15} color={plan.accent} />}
                    </div>
                    <div className="text-lg font-bold" style={{ color: headingText }}>
                      {plan.name} (${plan.price}/month)
                    </div>
                    <ul className="mt-2 space-y-1 text-xs" style={{ color: subtleText }}>
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-1.5"><Check size={12} color={plan.accent} />{f}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {Object.values(PAYMENT_METHODS).map(r => {
                const active = region === r.key;
                const Icon = r.Icon;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRegion(r.key)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: active ? '#3b82f6' : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee'),
                      background: active ? (theme.isDark ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.08)') : panelSurface,
                      color: active ? '#60a5fa' : subtleText,
                    }}
                  >
                    <Icon size={14} /> {r.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 relative">
              <select
                value={methodKey}
                onChange={e => setMethodKey(e.target.value)}
                className="w-full appearance-none rounded-xl border px-3 py-2.5 pr-9 text-sm"
                style={{
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : '#dbe3ee',
                  background: panelSurface,
                  color: headingText,
                }}
              >
                {currentRegion.methods.map(m => (
                  <option key={m.key} value={m.key}>{m.name}</option>
                ))}
              </select>
              <ChevronDown size={15} color={mutedText} style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }} />
            </div>

            <div className="mt-3 rounded-xl border p-4"
              style={{
                borderColor: theme.isDark ? 'rgba(59,130,246,0.24)' : 'rgba(59,130,246,0.2)',
                background: theme.isDark ? 'rgba(15,23,42,0.62)' : '#f8fbff',
              }}>
              <div className="mb-2 text-sm font-bold" style={{ color: headingText }}>
                {currentMethod.name} • <span style={{ color: '#60a5fa' }}>Send {amountLabel}</span>
              </div>
              <div className="space-y-1.5">
                {currentMethod.details.map(d => (
                  <div key={d.label} className="flex items-center justify-between gap-2 text-xs">
                    <span style={{ color: mutedText }}>{d.label}</span>
                    <span className="inline-flex items-center gap-2" style={{ color: headingText }}>
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

            <div className="mt-4 rounded-xl border p-3"
              style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#dbe3ee', background: panelSurface }}>
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
                  {proof ? proof.name : 'Upload payment proof screenshot'}
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
                  background: theme.isDark ? 'rgba(2,6,23,0.6)' : '#ffffff',
                  color: headingText,
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              className="mt-4 rounded-xl border p-3"
              style={{
                position: 'sticky',
                bottom: -1,
                zIndex: 2,
                borderColor: theme.isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.2)',
                background: theme.isDark ? 'rgba(8,12,20,0.95)' : '#ffffff',
                boxShadow: theme.isDark ? '0 -12px 28px rgba(2,6,23,0.45)' : '0 -10px 22px rgba(15,23,42,0.08)',
              }}
            >
              {error && (
                <div className="mb-2 rounded-lg border px-3 py-2 text-xs"
                  style={{ borderColor: 'rgba(239,68,68,0.32)', background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="rounded-lg py-2 px-4 text-xs font-semibold flex-shrink-0"
                  style={{
                    minWidth: '80px',
                    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.12)' : '#dbe3ee'}`,
                    background: panelSurface,
                    color: headingText,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !proof}
                  className="flex-1 rounded-lg py-2.5 px-4 text-sm font-bold text-white inline-flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)',
                    boxShadow: '0 8px 20px rgba(14,165,233,0.24)',
                    opacity: submitting || !proof ? 0.65 : 1,
                    cursor: submitting || !proof ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Submitting</span>
                    : 'Complete Payment'
                  }
                </button>
              </div>

              <div className="mt-2 text-center text-xs" style={{ color: mutedText }}>
                <Landmark size={12} style={{ display: 'inline', marginRight: 4 }} />
                Verification usually takes a few minutes.
              </div>
            </div>
          </form>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
