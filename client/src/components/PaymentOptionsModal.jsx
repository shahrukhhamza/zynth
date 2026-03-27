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

// ── Payment detail configurations ────────────────────────────────────────────
// Edit these constants to match your actual account details.
const PAYMENT_METHODS = {
  international: {
    label:    '🌍 International',
    icon:     Globe,
    subtitle: 'USD / GBP bank transfer',
    options: [
      {
        name: 'Citibank Wire Transfer',
        details: [
          { label: 'Account Name',    value: 'Zynth Technologies Ltd' },
          { label: 'Account Number',  value: '70584510002334445' },
          { label: 'SWIFT / BIC',     value: 'CITIUS33' },
          { label: 'Routing Number',  value: '031100209' },
          { label: 'Bank',            value: 'Citibank' },
          { label: 'Currency',        value: 'USD' },
        ],
        note: 'Include your registered email in the payment reference/memo field.',
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
        note: 'Send via JazzCash app → Send Money → JazzCash Number. Screenshot required.',
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

const PLAN_PRICES = { pro: '$9', elite: '$19' };
const PLAN_LABELS = { pro: 'Pro', elite: 'Elite' };

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
export default function PaymentOptionsModal({ plan: initialPlan = 'pro', onClose }) {
  const theme       = useTheme();
  const { token } = useAuth();

  const [region,      setRegion]      = useState('international');  // 'international' | 'pakistan'
  const [optionIdx,   setOptionIdx]   = useState(0);               // which sub-option
  const [selectedPlan, setPlan]       = useState(initialPlan);
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
  const price         = PLAN_PRICES[selectedPlan] ?? PLAN_PRICES.pro;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append('plan',   selectedPlan);
      form.append('method', `${currentRegion.label} — ${currentOption.name}`);
      form.append('amount', price + '/month');
      if (note.trim()) form.append('note', note.trim());
      if (file)        form.append('proof', file);

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
  const surface = theme.isDark ? '#111827' : '#f8fafc';

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: card, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#10b981,#3b82f6)' }} />
          <div style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={28} color="#10B981" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>Payment submitted!</div>
            <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6 }}>
              Payment submitted successfully 🎉<br />
              Your account will be upgraded shortly.
            </div>
            <div style={{ fontSize: 12, color: theme.muted, padding: '8px 16px', borderRadius: 8, background: surface, border: `1px solid ${theme.border}` }}>
              Instant activation after verification (usually within minutes).
            </div>
            <button
              onClick={onClose}
              style={{ marginTop: 8, padding: '10px 28px', borderRadius: 10, background: '#10B981', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Done
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
        style={{ width: '100%', maxWidth: 520, background: card, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', marginBlock: 'auto' }}
      >
        {/* Gradient bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#1d4ed8,#3b82f6,#06b6d4)' }} />

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

        <form onSubmit={handleSubmit} style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Trust chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Secure payment', 'Trusted by early users', 'No hidden charges'].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: theme.isDark ? '#93c5fd' : '#1d4ed8',
                  background: theme.isDark ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.08)',
                  border: `1px solid ${theme.isDark ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.22)'}`,
                  padding: '5px 9px',
                  borderRadius: 999,
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Plan selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted, display: 'block', marginBottom: 7 }}>
              Select Plan
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['pro', 'elite'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selectedPlan === p ? '#3b82f6' : theme.border}`,
                    background: selectedPlan === p ? 'rgba(59,130,246,0.08)' : surface,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlan === p ? '#3b82f6' : theme.text }}>{PLAN_LABELS[p]}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: selectedPlan === p ? '#3b82f6' : theme.text, lineHeight: 1.2 }}>{PLAN_PRICES[p]}<span style={{ fontSize: 11, fontWeight: 400, color: theme.muted }}>/mo</span></div>
                </button>
              ))}
            </div>
          </div>

          {/* Region selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted, display: 'block', marginBottom: 7 }}>
              Payment Region
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(PAYMENT_METHODS).map(([key, m]) => {
                const Icon = m.icon;
                const active = region === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRegion(key)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${active ? '#3b82f6' : theme.border}`,
                      background: active ? 'rgba(59,130,246,0.08)' : surface,
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={15} color={active ? '#3b82f6' : theme.muted} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#3b82f6' : theme.text }}>{m.label}</div>
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
              {currentOption.name} — Send <span style={{ color: '#3b82f6' }}>{price}/month</span>
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

          {/* File upload */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.muted, display: 'block', marginBottom: 7 }}>
              Payment Screenshot <span style={{ fontWeight: 400, color: theme.muted, textTransform: 'none' }}>(required)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                borderRadius: 10, border: `2px dashed ${file ? '#10B981' : theme.border}`,
                padding: '16px', textAlign: 'center', cursor: 'pointer',
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
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !file}
            style={{
              padding: '12px', borderRadius: 10, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (submitting || !file) ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {submitting
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Submitting…</>
              : `Submit Payment for ${PLAN_LABELS[selectedPlan]}`
            }
          </button>

        </form>
      </div>
    </div>
  );
}
