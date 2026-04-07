/**
 * PaymentOptionsModal — manual hybrid payment UI.
 *
 * Props:
 *   plan     — 'pro' | 'elite'  (pre-selected; user can switch inside modal)
 *   onClose  — dismiss handler
 *
 * Usage (e.g. from PricingPage or UpgradeContext):
 *   <PaymentOptionsModal plan="pro" onClose={() => setOpen(false)} />
 */
import { useState, useEffect, useRef } from 'react';
import {
  X, Globe, Smartphone, Upload, CheckCircle, ChevronDown, Loader2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN, getPlanDisplay } from '../config/pricingPlans';
import ErrorBar from './ErrorBar';

// ── Payment detail configurations ────────────────────────────────────────────
// Edit these constants to match your actual account details.
const PAYMENT_METHODS = {
  international: {
    label:    '🌍 International',
    icon:     Globe,
    subtitle: 'USD bank transfer',
    options: [
      {
        name: 'International Payment (USD Bank Transfer)',
        details: [
          { label: 'Bank',            value: 'Citibank' },
          { label: 'Account Holder',  value: 'Shahrukh Hamza' },
          { label: 'Account Number',  value: '70584510002334445' },
          { label: 'Routing Number (ABA)', value: '031100209' },
          { label: 'SWIFT / BIC',     value: 'CITIUS33' },
          { label: 'Account Type',    value: 'Checking' },
        ],
        note: 'For US transfers use Routing Number (ACH). For international wire use SWIFT code. Payments are verified within 1-2 hours.',
      },
    ],
  },
  pakistan: {
    label:    '🇵🇰 Pakistan',
    icon:     Smartphone,
    subtitle: 'JazzCash · Bank',
    options: [
      {
        name: 'JazzCash',
        details: [
          { label: 'Account Holder', value: 'SHAHRUKH HAMZA' },
          { label: 'IBAN',           value: 'PK36JCMA0301923175516692' },
        ],
        note: 'Send via JazzCash app/bank transfer using the IBAN above. Screenshot required.',
      },
      {
        name: 'Local Bank Transfer',
        details: [
          { label: 'Bank',           value: 'Meezan Bank' },
          { label: 'Account Title',  value: 'Zynth Technologies' },
          { label: 'IBAN',           value: 'PK36MEZN0001234567890123' },
          { label: 'Branch Code',    value: '0001' },
        ],
        note: 'Include your email in the payment remarks/reference.',
      },
    ],
  },
};

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value, theme }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 0', borderBottom: `1px solid ${theme.border}`,
    }}>
      <span style={{ fontSize: 12, color: theme.muted, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{value}</span>
        <button
          onClick={copy}
          title="Copy"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? '#10B981' : theme.muted, fontSize: 10, padding: '1px 4px',
            borderRadius: 4, transition: 'color 0.2s',
          }}
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PaymentOptionsModal({ plan: initialPlan = DEFAULT_SELECTED_PLAN, billingCycle: initialBillingCycle = DEFAULT_BILLING_CYCLE, onClose }) {
  const theme       = useTheme();
  const { token, user } = useAuth();

  const [region,      setRegion]      = useState('international');  // 'international' | 'pakistan'
  const [optionIdx,   setOptionIdx]   = useState(0);               // which sub-option
  const [selectedPlan, setPlan]       = useState(initialPlan);
  const [billingCycle, setBillingCycle] = useState(initialBillingCycle);
  const [file,        setFile]        = useState(null);
  const [note,        setNote]        = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState(null);
  const fileRef = useRef(null);

  // Reset option index when region changes
  useEffect(() => { setOptionIdx(0); }, [region]);

  // Keyboard dismiss
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const currentRegion = PAYMENT_METHODS[region];
  const currentOption = currentRegion.options[optionIdx];
  const displayPrice  = getPlanDisplay(selectedPlan, billingCycle);
  const price         = displayPrice.label;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please upload payment proof');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('userId', String(user?.id ?? '')); // extra metadata for traceability
      form.append('plan',   selectedPlan);
      form.append('billingCycle', billingCycle);
      form.append('method', `${currentRegion.label} — ${currentOption.name}`);
      form.append('amount', price);
      form.append('proofFileName', file.name);
      if (note.trim()) form.append('note', note.trim());
      form.append('proof', file);

      const r = await fetch(`${API_URL}/api/payments/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Submission failed.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const card    = theme.isDark ? '#0d1424' : '#ffffff';
  const surface = theme.isDark ? '#0b0b0f' : '#f8fafc';

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: card, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#10b981,#CA8A04)' }} />
          <div style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={28} color="#10B981" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>Payment Submitted 🎉</div>
            <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6 }}>
              We've received your payment proof.<br />
              Your account will be upgraded shortly.
            </div>
            <div style={{ fontSize: 12, color: theme.muted, padding: '8px 16px', borderRadius: 8, background: surface, border: `1px solid ${theme.border}` }}>
              Verification usually takes a few minutes.
            </div>
            <button
              onClick={onClose}
              style={{ marginTop: 8, padding: '10px 28px', borderRadius: 10, background: '#10B981', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: 'min(520px, 95vw)',
          maxHeight: '90vh',
          background: card,
          borderRadius: 20,
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          marginBlock: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Gradient bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#CA8A04,#EAB308,#FBBF24)' }} />

        {/* Header */}
        <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>Complete Your Upgrade 🚀</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>Secure your premium access in under 1 minute</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted, padding: 4, display: 'flex', alignItems: 'center' }}>
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', minHeight: 0 }}>

          {/* Trust chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Secure payment', 'Trusted by early users', 'No hidden charges'].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: theme.isDark ? '#FBBF24' : '#854D0E',
                  background: theme.isDark ? 'rgba(202,138,4,0.14)' : 'rgba(202,138,4,0.08)',
                  border: `1px solid ${theme.isDark ? 'rgba(202,138,4,0.28)' : 'rgba(202,138,4,0.22)'}`,
                  padding: '5px 9px',
                  borderRadius: 999,
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          <PricingPlanSelector
            context="upgrade"
            mode="compact"
            title="Pick your paid plan"
            subtitle="The same Elite-first pricing system is used here too, so your selection and billing stay consistent through checkout."
            selectedPlan={selectedPlan}
            onSelectPlan={setPlan}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            showPrimaryAction={false}
          />

          {/* Region selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted, display: 'block', marginBottom: 7 }}>
              Payment Region
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(PAYMENT_METHODS).map(([key, m]) => {
                const Icon = m.icon;
                const active = region === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRegion(key)}
                    style={{
                      flex: '1 1 calc(50% - 5px)', minWidth: '140px', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${active ? '#CA8A04' : theme.border}`,
                      background: active ? 'rgba(202,138,4,0.08)' : surface,
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={15} color={active ? '#CA8A04' : theme.muted} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#CA8A04' : theme.text }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: theme.muted }}>{m.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-method selector (if multiple) */}
          {currentRegion.options.length > 1 && (
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted, display: 'block', marginBottom: 7 }}>
                Payment Method
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={optionIdx}
                  onChange={e => setOptionIdx(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '9px 34px 9px 12px', borderRadius: 9,
                    border: `1px solid ${theme.border}`, background: surface,
                    color: theme.text, fontSize: 13, fontWeight: 600,
                    appearance: 'none', cursor: 'pointer',
                  }}
                >
                  {currentRegion.options.map((o, i) => (
                    <option key={i} value={i}>{o.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} color={theme.muted} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          )}

          {/* Payment details */}
          <div style={{ borderRadius: 12, background: surface, border: `1px solid ${theme.border}`, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 10 }}>
              {currentOption.name} — Send <span style={{ color: '#CA8A04' }}>{price}</span>
            </div>
            {currentOption.details.map(d => (
              <DetailRow key={d.label} label={d.label} value={d.value} theme={theme} />
            ))}
            {currentOption.note && (
              <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 7, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11.5, color: '#fbbf24', lineHeight: 1.5 }}>
                ⚠ {currentOption.note}
              </div>
            )}
          </div>

          <p style={{ fontSize: 14, color: theme.muted, textAlign: 'center', marginTop: -4 }}>
            Having trouble with payment? Reach out at getzynth@gmail.com — we&apos;ll help you get access quickly.
          </p>

          {/* Note field */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted, display: 'block', marginBottom: 7 }}>
              Note <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Transaction ID or any reference..."
              maxLength={500}
              rows={2}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9,
                border: `1px solid ${theme.border}`, background: surface,
                color: theme.text, fontSize: 13, resize: 'vertical', lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action area */}
          <div style={{
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            background: theme.isDark ? 'rgba(2,6,23,0.4)' : '#f8fafc',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'sticky',
            bottom: -1,
            zIndex: 3,
            boxShadow: theme.isDark ? '0 -10px 30px rgba(2,6,23,0.45)' : '0 -8px 24px rgba(15,23,42,0.08)',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                Upload payment screenshot to activate your plan
              </div>
              <div style={{ fontSize: 11, color: theme.muted }}>
                Verification usually takes a few minutes
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                borderRadius: 10,
                border: `2px dashed ${file ? '#10B981' : theme.border}`,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(16,185,129,0.04)' : surface,
                transition: 'all 0.2s',
              }}
            >
              <Upload size={18} color={file ? '#10B981' : theme.muted} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12.5, color: file ? '#10B981' : theme.muted, fontWeight: file ? 600 : 400 }}>
                {file ? file.name : 'Click to upload screenshot'}
              </div>
              {!file && <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>JPEG, PNG, WebP up to 5 MB</div>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0] ?? null)}
            />

            {file && (
              <div style={{
                fontSize: 12,
                color: '#10B981',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.22)',
                borderRadius: 8,
                padding: '7px 10px',
                fontWeight: 700,
              }}>
                Payment proof attached ✅
              </div>
            )}

            {/* Error */}
            {error && <ErrorBar message={error} />}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,#CA8A04,#EAB308,#FBBF24)',
                boxShadow: '0 10px 28px rgba(14,165,233,0.32)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: submitting ? 0.75 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Submitting...</>
                : 'Submit Payment'
              }
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: surface,
                color: theme.text,
                fontWeight: 700,
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
