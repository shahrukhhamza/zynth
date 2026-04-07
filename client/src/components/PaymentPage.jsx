import { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Zap, Copy, Check, AlertTriangle, Upload, X, CheckCircle2,
  ChevronDown, ChevronUp, Lock, Sparkles, CreditCard, Clock, RefreshCw, PartyPopper,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getAuthToken } from '../utils/authStorage';

// ── Config ─────────────────────────────────────────────────────────────────
const CRYPTO_WALLET = 'TCEqCUYM7D3z7G1LZGoQ2su6vwdWZgMgF6';
const JAZZCASH_NUMBER = '03001234567';                         // ← replace with real number

const PLANS = [
  {
    id: 'pro-monthly',
    label: 'Pro Monthly',
    plan: 'pro',
    billingCycle: 'monthly',
    price: 8.90,
    tag: null,
  },
  {
    id: 'pro-annual',
    label: 'Pro Annual',
    plan: 'pro',
    billingCycle: 'annual',
    price: 17.90,
    tag: 'Best Value',
  },
];

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

// ── QR Code canvas component (client-side, no external requests) ──────────
function QRCanvas({ data, size = 110 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !data) return;
    QRCode.toCanvas(canvasRef.current, data, {
      width:  size,
      margin: 1,
      color:  { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(() => {/* silent */});
  }, [data, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block', borderRadius: 4 }} />;
}

function TrustBadge({ icon: Icon, text, theme }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#10b981' }} />
      <span className="text-[12px] font-medium" style={{ color: theme.muted }}>{text}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PaymentPage({ onBack }) {
  const theme = useTheme();
  const { user } = useAuth();
  const isDark = theme.isDark;

  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [activeMethod, setActiveMethod] = useState('crypto'); // 'crypto' | 'jazzcash'

  // Crypto state
  const [txid, setTxid] = useState('');
  const [txidCopied, setTxidCopied] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [cryptoStatus, setCryptoStatus] = useState(null); // null | 'submitting' | 'success' | 'error'
  const [cryptoMsg, setCryptoMsg] = useState('');
  const [cryptoFile, setCryptoFile] = useState(null);
  const cryptoFileRef = useRef(null);

  // JazzCash state
  const [jcFile, setJcFile] = useState(null);
  const [jcNote, setJcNote] = useState('');
  const [jcStatus, setJcStatus] = useState(null);
  const [jcMsg, setJcMsg] = useState('');
  const fileRef = useRef(null);

  // ── Payment status tracking (polls server after submission) ──────────────
  // serverStatus: null | 'pending' | 'verified' | 'rejected'
  const [submitted, setSubmitted]       = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [pollLoading, setPollLoading]   = useState(false);
  const [lastChecked, setLastChecked]   = useState(null);
  const pollRef = useRef(null);

  // Fetch the latest payment status from the server
  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    setPollLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/payment/status/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const status = data.latest?.status ?? null;
      setServerStatus(status);
      setLastChecked(new Date());
      // Stop polling once a final state is reached
      if (status === 'verified' || status === 'rejected') {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch { /* silent — poll will retry */ }
    finally { setPollLoading(false); }
  }, [user?.id]);

  // Start polling when payment is submitted; clear on unmount
  useEffect(() => {
    if (!submitted) return;
    fetchStatus(); // immediate first check
    pollRef.current = setInterval(fetchStatus, 10_000);
    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [submitted, fetchStatus]);

  // ── style tokens ────────────────────────────────────────────────────────
  // bg matches the rest of the app (same class used by normal pages)
  const card    = 'var(--z-card)';
  const border  = 'var(--z-border)';
  const inputBg = 'var(--z-input)';
  const shadow  = isDark
    ? '0 2px 4px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.3)'
    : '0 2px 4px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.06)';

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  const copyText = async (text, setter) => {
    try { await navigator.clipboard.writeText(text); } catch { /* fallback */ }
    setter(true);
    setTimeout(() => setter(false), 1800);
  };

  // ── Crypto: submit TXID + screenshot ─────────────────────────────────────
  const submitCrypto = async () => {
    if (!txid.trim()) { setCryptoMsg('Please enter your Transaction ID (TXID).'); setCryptoStatus('error'); return; }
    if (!cryptoFile) { setCryptoMsg('Payment proof is required.'); setCryptoStatus('error'); return; }
    setCryptoStatus('submitting');
    setCryptoMsg('');
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append('plan', selectedPlan.plan);
      fd.append('billingCycle', selectedPlan.billingCycle);
      fd.append('method', 'USDT TRC20');
      fd.append('amount', `$${selectedPlan.price}`);
      fd.append('note', txid.trim());
      fd.append('proof', cryptoFile);
      await api.post('/payments/submit', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setCryptoStatus('success');
      setCryptoMsg('');
      setSubmitted(true); // ← start polling
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Submission failed. Please try again.';
      setCryptoMsg(msg);
      setCryptoStatus('error');
    }
  };

  // ── JazzCash: upload screenshot ───────────────────────────────────────────
  const submitJazzCash = async () => {
    if (!jcFile) { setJcMsg('Please attach a payment screenshot.'); setJcStatus('error'); return; }
    setJcStatus('submitting');
    setJcMsg('');
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append('plan', selectedPlan.plan);
      fd.append('billingCycle', selectedPlan.billingCycle);
      fd.append('method', 'JazzCash');
      fd.append('amount', `$${selectedPlan.price}`);
      fd.append('note', jcNote.trim() || '');
      fd.append('proof', jcFile);
      await api.post('/payments/submit', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setJcStatus('success');
      setJcMsg('');
      setSubmitted(true); // ← start polling
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Submission failed. Please try again.';
      setJcMsg(msg);
      setJcStatus('error');
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setJcFile(f);
    setJcMsg('');
    setJcStatus(null);
  };

  const removeFile = () => {
    setJcFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // Once payment is verified, replace everything with the success screen
  if (serverStatus === 'verified') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--z-modal)' }}>
        <div className="max-w-2xl mx-auto">
          <SuccessScreen plan={selectedPlan} onBack={onBack} theme={theme} isDark={isDark} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--z-modal)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        {onBack && (
          <button onClick={onBack}
            className="mb-6 text-xs font-medium flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--z-muted)' }}>
            ← Back
          </button>
        )}

        {/* ─── Payment Status Tracker (shown after submission as a modal) ── */}
        {submitted && (
          <PaymentStatusTracker
            status={serverStatus}
            loading={pollLoading && serverStatus === null}
            lastChecked={lastChecked}
            onRefresh={fetchStatus}
            pollLoading={pollLoading}
            plan={selectedPlan}
            theme={theme}
            isDark={isDark}
          />
        )}

        {/* ─── Card wrapper — gradient border matching UpgradeModal ─── */}
        <div className="rounded-2xl p-[1px]" style={{
          background: 'linear-gradient(140deg, rgba(99,102,241,0.7), rgba(139,92,246,0.55), rgba(202,138,4,0.5))',
          boxShadow:  '0 40px 120px rgba(0,0,0,0.7), 0 0 64px rgba(99,102,241,0.12)',
        }}>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--z-modal)' }}>

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="text-center pt-8 pb-6 px-6">
          {/* Icon — matches modal's badge style */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
              border: '1px solid rgba(99,102,241,0.35)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
            }}>
            <Sparkles className="w-6 h-6" style={{ color: '#a5b4fc' }} />
          </div>

          {/* Badge pill */}
          <div className="flex justify-center mb-3">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full tracking-widest"
              style={{ background: 'var(--z-badge-bg)', color: 'var(--z-badge-text)', border: '1px solid var(--z-badge-bdr)' }}>
              UPGRADE TO PRO
            </span>
          </div>

          <h1 className="text-[26px] font-extrabold leading-tight mb-2"
            style={{
              background: 'var(--z-h-grad)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            Upgrade to Zynth Pro
          </h1>
          <p className="text-sm" style={{ color: 'var(--z-muted)' }}>
            Unlock full access — cancel anytime
          </p>
        </div>

        <div className="px-6 pb-8 space-y-5">

        {/* ─── Plan Selector ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--z-muted)' }}>
            Choose your plan
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((p) => {
              const active = selectedPlan.id === p.id;
              return (
                <div key={p.id} onClick={() => setSelectedPlan(p)}
                  className="relative cursor-pointer rounded-2xl transition-all"
                  style={{
                    padding: '1px',
                    background: active
                      ? 'linear-gradient(135deg, #CA8A04, #8b5cf6, #a78bfa)'
                      : 'var(--z-border)',
                    boxShadow: active
                      ? '0 0 28px rgba(99,102,241,0.35)'
                      : 'none',
                  }}>
                  {p.tag && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white z-10"
                      style={{ background: 'linear-gradient(130deg,#10b981,#059669)' }}>
                      {p.tag}
                    </span>
                  )}
                  <div className="rounded-[15px] p-4"
                    style={{ background: active ? 'var(--z-inner)' : 'var(--z-surface)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: active ? 'var(--z-badge-text)' : 'var(--z-muted)' }}>{p.label}</p>
                    <p className="text-2xl font-extrabold tracking-tight"
                      style={{ color: 'var(--z-text)' }}>
                      <span className="text-sm font-semibold align-top mt-1 mr-0.5">$</span>
                      {p.price.toFixed(2)}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--z-muted)' }}>
                      {p.billingCycle === 'monthly' ? 'per month' : 'per year'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Method Tabs — pill toggle matching modal's billing toggle ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--z-muted)' }}>
            Payment method
          </p>
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)' }}>
            {[
              { id: 'crypto',   label: 'Crypto (USDT TRC20)', rec: true },
              { id: 'jazzcash', label: 'JazzCash',            rec: false },
            ].map((m) => (
              <button key={m.id} onClick={() => setActiveMethod(m.id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeMethod === m.id ? 'var(--z-badge-bg)' : 'transparent',
                  color:      activeMethod === m.id ? 'var(--z-soft-purple)' : 'var(--z-muted)',
                  border:     `1px solid ${activeMethod === m.id ? 'var(--z-badge-bdr)' : 'transparent'}`,
                  boxShadow:  activeMethod === m.id ? '0 2px 8px rgba(99,102,241,0.15)' : 'none',
                }}>
                {m.label}
                {m.rec && activeMethod === m.id && <span className="ml-1 opacity-70">★</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Crypto Panel ──────────────────────────────────────────── */}
        {activeMethod === 'crypto' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--z-inner)', border: '1px solid rgba(99,102,241,0.3)' }}>

            {/* Header strip */}
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: 'var(--z-plan-hdr-bg)', borderBottom: '1px solid var(--z-badge-bdr)' }}>
              <CreditCard className="w-4 h-4" style={{ color: 'var(--z-badge-text)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--z-text)' }}>Pay with Crypto</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{ background: 'var(--z-badge-bg)', color: 'var(--z-badge-text)', border: '1px solid var(--z-badge-bdr)' }}>USDT · TRC20</span>
            </div>

            <div className="p-5 space-y-5">

              {/* QR + details row */}
              <div className="flex gap-5 items-start">

                {/* QR Code */}
                <div className="shrink-0">
                  <div className="rounded-xl overflow-hidden border p-1.5"
                    style={{ borderColor: border, background: '#fff', width: 116, height: 116, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QRCanvas data={CRYPTO_WALLET} size={104} />
                  </div>
                  <p className="text-[10px] mt-1.5 text-center" style={{ color: theme.muted }}>Scan to pay</p>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  {/* Amount */}
                  <div className="rounded-lg p-3"
                    style={{ background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#10b981' }}>Amount to Send</p>
                    <p className="text-xl font-extrabold" style={{ color: '#10b981' }}>
                      ${selectedPlan.price.toFixed(2)} <span className="text-sm font-semibold opacity-70">USDT</span>
                    </p>
                  </div>

                  {/* Network */}
                  <div className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: inputBg, border: `1px solid ${border}` }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>Network</span>
                    <span className="text-sm font-bold" style={{ color: theme.text }}>TRC20 (TRON)</span>
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Wallet Address</p>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                  style={{ background: inputBg, borderColor: border }}>
                  <code className="flex-1 text-[12px] font-mono break-all" style={{ color: theme.text, wordBreak: 'break-all' }}>
                    {CRYPTO_WALLET}
                  </code>
                  <button onClick={() => copyText(CRYPTO_WALLET, setWalletCopied)}
                    className="shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ background: walletCopied ? 'rgba(16,185,129,0.12)' : 'var(--z-close-bg)', color: walletCopied ? '#10b981' : theme.muted }}>
                    {walletCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* TXID Input */}
              {!submitted && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>
                    Transaction ID (TXID)
                  </label>
                  <input
                    type="text"
                    value={txid}
                    onChange={(e) => { setTxid(e.target.value); setCryptoMsg(''); setCryptoStatus(null); }}
                    placeholder="Paste your TXID here after sending…"
                    disabled={submitted}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/25 disabled:opacity-50"
                    style={{ background: inputBg, borderColor: border, color: theme.text, fontFamily: 'monospace' }}
                  />
                </div>
              )}

              {/* Screenshot Upload */}
              {!submitted && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>
                    Payment Screenshot <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={cryptoFileRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => { setCryptoFile(e.target.files?.[0] ?? null); setCryptoMsg(''); setCryptoStatus(null); }}
                  />
                  {cryptoFile ? (
                    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                      style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.3)' }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: theme.text }}>{cryptoFile.name}</span>
                      <button onClick={() => { setCryptoFile(null); if (cryptoFileRef.current) cryptoFileRef.current.value = ''; }}
                        className="shrink-0 p-1 rounded-lg transition-colors"
                        style={{ color: theme.muted, background: 'var(--z-close-bg)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => cryptoFileRef.current?.click()}
                      className="w-full rounded-xl border-2 border-dashed px-4 py-4 flex flex-col items-center gap-2 transition-all hover:border-yellow-500/50 hover:bg-yellow-500/5"
                      style={{ borderColor: border, background: inputBg }}>
                      <Upload className="w-5 h-5" style={{ color: '#CA8A04' }} />
                      <span className="text-sm font-semibold" style={{ color: theme.text }}>Upload Screenshot</span>
                      <span className="text-[11px]" style={{ color: theme.muted }}>PNG, JPG or PDF</span>
                    </button>
                  )}
                </div>
              )}

              {/* Status message */}
              {cryptoMsg && (
                <StatusBanner status={cryptoStatus} msg={cryptoMsg} theme={theme} isDark={isDark} />
              )}

              {/* Submit button */}
              {!submitted && (
                <button onClick={submitCrypto} disabled={cryptoStatus === 'submitting'}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  style={{
                    background: 'linear-gradient(135deg, #CA8A04, #EAB308)',
                    boxShadow: '0 4px 14px rgba(202,138,4,0.3)',
                  }}>
                  {cryptoStatus === 'submitting'
                    ? <><Spinner /> Submitting…</>
                    : <><Zap className="w-4 h-4" /> Submit Payment</>
                  }
                </button>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
                <p className="text-[11px] leading-relaxed" style={{ color: '#f59e0b' }}>
                  Crypto payments are <strong>final and non-refundable</strong>. Send the exact amount on the TRC20 network only. Sending on wrong network results in permanent loss.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── JazzCash Panel ────────────────────────────────────────── */}
        {activeMethod === 'jazzcash' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--z-inner)', border: '1px solid var(--z-badge-bdr)' }}>

            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: 'var(--z-plan-hdr-bg)', borderBottom: '1px solid var(--z-badge-bdr)' }}>
              <CreditCard className="w-4 h-4" style={{ color: 'var(--z-muted)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--z-text)' }}>Pay with JazzCash</span>
            </div>

            <div className="p-5 space-y-5">

              {/* Account number & instructions */}
              <div className="rounded-xl border p-4 space-y-3"
                style={{ background: 'var(--z-surface)', borderColor: 'var(--z-border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: theme.muted }}>JazzCash Account</p>
                    <p className="text-lg font-extrabold tracking-tight" style={{ color: theme.text }}>{JAZZCASH_NUMBER}</p>
                  </div>
                  <button onClick={() => copyText(JAZZCASH_NUMBER, setTxidCopied)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: txidCopied ? 'rgba(16,185,129,0.12)' : 'var(--z-close-bg)', color: txidCopied ? '#10b981' : theme.muted }}>
                    {txidCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {txidCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="pt-3 border-t space-y-1.5" style={{ borderColor: border }}>
                  <p className="text-[11px] font-semibold" style={{ color: theme.muted }}>How to pay:</p>
                  {[
                    `Open JazzCash and send exactly $${selectedPlan.price.toFixed(2)} (PKR equivalent)`,
                    `Send to the number above`,
                    'Take a screenshot of the confirmation screen',
                    'Upload it below and click Submit',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 shrink-0 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
                        style={{ background: isDark ? 'rgba(202,138,4,0.15)' : 'rgba(202,138,4,0.1)', color: '#CA8A04' }}>
                        {i + 1}
                      </span>
                      <p className="text-[12px]" style={{ color: theme.muted }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Screenshot upload + note — hidden after submit */}
              {!submitted && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>
                      Payment Screenshot <span className="text-red-400">*</span>
                    </label>
                    {jcFile ? (
                      <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                        style={{ background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.25)' }}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                        <span className="flex-1 text-[13px] truncate" style={{ color: theme.text }}>{jcFile.name}</span>
                        <span className="text-[11px] shrink-0" style={{ color: theme.muted }}>
                          {(jcFile.size / 1024).toFixed(0)} KB
                        </span>
                        <button onClick={removeFile} className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity" style={{ color: theme.muted }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors hover:border-yellow-500/40"
                        style={{ borderColor: border, background: inputBg }}>
                        <Upload className="w-6 h-6" style={{ color: theme.muted }} />
                        <span className="text-sm" style={{ color: theme.muted }}>Click to upload screenshot</span>
                        <span className="text-[11px]" style={{ color: isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)' }}>JPG, PNG, WebP — max 5 MB</span>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>

                  {/* Optional note */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>
                      Transaction Reference <span className="opacity-50">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={jcNote}
                      onChange={(e) => setJcNote(e.target.value)}
                      placeholder="e.g. TXN-82347628..."
                      className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/25"
                      style={{ background: inputBg, borderColor: border, color: theme.text }}
                    />
                  </div>
                </>
              )}

              {/* Status message */}
              {jcMsg && <StatusBanner status={jcStatus} msg={jcMsg} theme={theme} isDark={isDark} />}

              {/* Submit button */}
              {!submitted && (
                <button onClick={submitJazzCash} disabled={jcStatus === 'submitting'}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  style={{ background: 'linear-gradient(135deg, #CA8A04, #EAB308)', boxShadow: '0 4px 14px rgba(202,138,4,0.3)' }}>
                  {jcStatus === 'submitting'
                    ? <><Spinner /> Submitting…</>
                    : <><Upload className="w-4 h-4" /> Submit Payment</>
                  }
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Trust Indicators ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 pb-1">
          <TrustBadge icon={Lock}   text="Secure payment"                       theme={theme} />
          <TrustBadge icon={Zap}    text="Instant activation after verification" theme={theme} />
          <TrustBadge icon={Shield} text="256-bit encrypted submission"          theme={theme} />
        </div>

        {/* Bottom note */}
        <p className="text-center text-[11px] pb-2" style={{ color: 'var(--z-muted)', opacity: 0.6 }}>
          By completing payment you agree to our Terms of Service.
          Manual verification may take 1–12 hours.
        </p>

        </div>{/* end px-6 content */}
        </div>{/* end inner modal card */}
        </div>{/* end gradient border wrapper */}

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBanner({ status, msg, theme, isDark }) {
  if (!msg) return null;
  const isSuccess = status === 'success';
  const isError   = status === 'error';
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
      style={{
        background: isSuccess
          ? 'rgba(16,185,129,0.09)'
          : isError
          ? 'rgba(239,68,68,0.09)'
          : 'rgba(202,138,4,0.09)',
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.25)' : isError ? 'rgba(239,68,68,0.25)' : 'rgba(202,138,4,0.25)'}`,
      }}>
      {isSuccess
        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#10b981' }} />
        : isError
        ? <X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
        : <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#CA8A04' }} />
      }
      <p className="text-[13px] leading-relaxed"
        style={{ color: isSuccess ? '#10b981' : isError ? '#ef4444' : '#CA8A04' }}>
        {msg}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}

// ── PaymentStatusTracker ───────────────────────────────────────────────────
// Renders as a fixed full-screen modal overlay after payment submission.
function PaymentStatusTracker({ status, loading, lastChecked, onRefresh, pollLoading, plan, theme, isDark }) {
  const steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'pending',   label: 'Verifying' },
    { key: 'verified',  label: 'Activated' },
  ];
  const stepIndex = status === 'verified' ? 2 : status === 'pending' ? 1 : 0;
  const planName  = plan?.plan === 'elite' ? 'Elite' : 'Pro';

  const fmtTime = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const isRejected = status === 'rejected';

  // Colour palette per status
  const accent = isRejected ? '#f87171' : '#10b981';
  const accentBg = isRejected
    ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)')
    : (isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)');
  const accentBorder = isRejected ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)';

  // Card background adapts to theme
  const cardBg    = 'var(--z-card)';
  const cardBorder = 'var(--z-border)';
  const overlayBg  = isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.45)';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: overlayBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 460,
          borderRadius: 20,
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark
            ? '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 32px 80px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* ── Coloured top accent bar ── */}
        <div style={{ height: 4, background: isRejected
          ? 'linear-gradient(90deg,#ef4444,#f87171)'
          : 'linear-gradient(90deg,#10b981,#34d399)' }} />

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Animated icon circle */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {isRejected
                ? <X size={18} color="#f87171" />
                : <CheckCircle2 size={18} color="#10b981" style={{ animation: 'pulse-green 2s ease-in-out infinite' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: accent, lineHeight: 1.2 }}>
                {isRejected ? 'Payment Not Verified' : '🎉 Payment Received!'}
              </p>
              <p style={{ fontSize: 11, color: isDark ? 'rgba(148,163,184,0.7)' : '#94a3b8', marginTop: 2 }}>
                {isRejected ? 'Action required' : `Zynth ${planName} · Verification in progress`}
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={pollLoading}
            title="Refresh status"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: isDark ? 'rgba(148,163,184,0.8)' : '#64748b',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              opacity: pollLoading ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <RefreshCw size={11} style={{ animation: pollLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ── Step pipeline ── */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
          {steps.map((s, i) => {
            const done   = i < stepIndex;
            const active = i === stepIndex;
            const dotColor = done ? '#10b981' : active ? (isRejected ? '#ef4444' : '#CA8A04') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
            const labelColor = (done || active) ? accent : (isDark ? 'rgba(148,163,184,0.5)' : '#94a3b8');
            return (
              <div key={s.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: dotColor,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    boxShadow: active && !isRejected ? '0 0 0 4px rgba(202,138,4,0.2)' : undefined,
                    transition: 'all 0.3s',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, marginTop: 6, color: labelColor }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginBottom: 16, marginLeft: 4, marginRight: 4, borderRadius: 2,
                    background: done ? '#10b981' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'),
                    transition: 'background 0.4s',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '0 24px' }} />

        {/* ── Message body ── */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isRejected ? (
            <p style={{ fontSize: 13, color: isDark ? 'rgba(148,163,184,0.85)' : '#475569', lineHeight: 1.6 }}>
              Your payment could not be verified. Please contact support with your TXID or screenshot.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#161618', lineHeight: 1.6 }}>
                Your transaction has been submitted and is currently being verified.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: isDark ? 'rgba(251,191,36,0.09)' : 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.25)',
              }}>
                <span style={{ fontSize: 15 }}>⏳</span>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                  Verification usually takes 1–5 minutes.
                </p>
              </div>
              <p style={{ fontSize: 13, color: isDark ? 'rgba(148,163,184,0.85)' : '#475569', lineHeight: 1.6 }}>
                Once confirmed, your <strong style={{ color: isDark ? '#e2e8f0' : '#161618' }}>Zynth {planName}</strong> access will be activated automatically.
              </p>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>📌</span>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171', margin: 0, lineHeight: 1.5 }}>
                  Please do not refresh or close this page.
                </p>
              </div>
              <p style={{ fontSize: 12, color: isDark ? 'rgba(148,163,184,0.6)' : '#94a3b8', lineHeight: 1.5 }}>
                If activation is delayed, contact support with your Transaction ID (TXID).
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: accent }}>
                Thank you for choosing Zynth 🚀
              </p>
            </>
          )}

          {/* Last checked */}
          {lastChecked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <RefreshCw size={9} color={isDark ? 'rgba(148,163,184,0.4)' : '#94a3b8'} />
              <span style={{ fontSize: 10, color: isDark ? 'rgba(148,163,184,0.4)' : '#94a3b8' }}>
                Last checked: {fmtTime(lastChecked)} · auto-refreshes every 10s
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-green { 0%,100% { opacity:1; } 50% { opacity:0.65; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── SuccessScreen ──────────────────────────────────────────────────────────
// Full-panel success state shown once payment is verified.
function SuccessScreen({ plan, onBack, theme, isDark }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      {/* Animated checkmark ring */}
      <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 28 }}>
        {/* Outer pulse ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)',
          animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
        }} />
        {/* Inner circle */}
        <div style={{
          position: 'relative', width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 8px 30px rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
      </div>

      <style>{`@keyframes ping { 75%,100% { transform: scale(1.8); opacity: 0; } }`}</style>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
        Payment Successful! 🎉
      </h2>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>
        Access Unlocked
      </p>
      <p style={{ fontSize: 13, color: theme.muted, maxWidth: 360, lineHeight: 1.6, marginBottom: 32 }}>
        Your <strong style={{ color: theme.text }}>{plan.label}</strong> subscription is now active.
        Refresh the page to see your upgraded features.
      </p>

      {/* Feature bullets */}
      <div
        className="w-full max-w-sm rounded-2xl border text-left divide-y"
        style={{
          background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
          borderColor: 'rgba(16,185,129,0.2)',
          divideColor: 'rgba(16,185,129,0.1)',
          marginBottom: 32,
        }}
      >
        {[
          { icon: '🤖', text: 'Unlimited AI trade analysis' },
          { icon: '📊', text: 'Full macro intelligence suite' },
          { icon: '📈', text: 'Advanced charting & levels' },
          { icon: '🔔', text: 'Real-time economic alerts' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 px-4 py-3">
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 13, color: theme.text }}>{text}</span>
            <Check className="w-4 h-4 ml-auto shrink-0" style={{ color: '#10b981' }} />
          </div>
        ))}
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full max-w-sm h-12 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)', marginBottom: 12 }}
      >
        Refresh to Activate Features
      </button>

      {onBack && (
        <button onClick={onBack}
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: theme.muted }}>
          ← Go back
        </button>
      )}
    </div>
  );
}
