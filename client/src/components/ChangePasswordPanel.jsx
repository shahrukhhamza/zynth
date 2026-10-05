/**
 * ChangePasswordPanel — "Change Password" inside the profile modal, using the same emailed-code flow as
 * the password-reset page: send a 6-digit code to the account's email, verify it, then set a new password.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Key, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import OtpInput from './auth/OtpInput';

const post = (path, body) => axios.post(`${API_URL}/api/auth/${path}`, body).then((r) => r.data);
const messageOf = (err, fallback) => err?.response?.data?.error || fallback;

export default function ChangePasswordPanel({ email }) {
  const theme = useTheme();
  const [step, setStep] = useState('idle'); // idle | sending | code | password | saving | done
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step !== 'done') return undefined;
    const t = setTimeout(() => { setStep('idle'); setPassword(''); setConfirm(''); setCode(''); }, 3500);
    return () => clearTimeout(t);
  }, [step]);

  const reset = () => { setStep('idle'); setError(''); setCode(''); setPassword(''); setConfirm(''); };

  async function sendCode() {
    setError(''); setStep('sending');
    try {
      const data = await post('forgot-password', { email });
      setDevCode(data.devCode ?? null);
      setResendIn(data.resendAfter ?? 60);
      setCode('');
      setStep('code');
    } catch (err) {
      setError(messageOf(err, 'Could not send the code. Please try again.'));
      setStep('idle');
    }
  }

  async function verify(value) {
    setError('');
    try {
      const data = await post('reset-password/verify', { email, code: value });
      setResetToken(data.resetToken);
      setStep('password');
    } catch (err) {
      setError(messageOf(err, 'That code did not work.'));
      setCode('');
    }
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setStep('saving');
    try {
      await post('reset-password', { email, resetToken, newPassword: password });
      setStep('done');
    } catch (err) {
      setError(messageOf(err, 'Failed to update password.'));
      setStep(err?.response?.data?.code === 'NO_PENDING' ? 'idle' : 'password');
    }
  }

  const field = {
    background: theme.surface2, borderColor: theme.border, color: theme.text,
  };
  const inputCls = 'h-11 w-full rounded-xl border px-3.5 text-[13.5px] outline-none transition-all focus:border-[#CA8A04] focus:ring-4 focus:ring-[#CA8A04]/15';

  if (step === 'idle' || step === 'sending') {
    return (
      <div>
        <button
          onClick={sendCode} disabled={step === 'sending'}
          className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition-all hover:opacity-80"
          style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}`, color: theme.text }}
        >
          {step === 'sending' ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: theme.muted }} /> : <Key className="h-4 w-4 shrink-0" style={{ color: theme.muted }} />}
          {step === 'sending' ? 'Sending code…' : 'Change Password'}
        </button>
        {error && <p className="m-0 mt-2 text-[12.5px]" style={{ color: '#f43f5e' }}>{error}</p>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4" style={{ background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)', borderColor: theme.border }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: theme.text }}><Key className="h-4 w-4" style={{ color: '#CA8A04' }} /> Change password</span>
        {step !== 'done' && <button onClick={reset} className="border-0 bg-transparent p-0 text-[12px]" style={{ color: theme.textMuted }}>Cancel</button>}
      </div>

      {step === 'code' && (
        <>
          <p className="m-0 mb-3 text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>We emailed a 6-digit code to <strong style={{ color: theme.text }}>{email}</strong>.</p>
          <OtpInput value={code} onChange={setCode} onComplete={verify} error={!!error} />
          {devCode && <p className="m-0 mt-3 text-center text-[12px]" style={{ color: theme.textMuted }}>Development mode, your code is <strong style={{ color: theme.text }}>{devCode}</strong></p>}
          <div className="mt-3 text-center text-[12.5px]" style={{ color: theme.textMuted }}>
            {resendIn > 0 ? `Resend in ${resendIn}s` : <button onClick={sendCode} className="border-0 bg-transparent p-0 font-bold text-[#A16207] hover:underline dark:text-[#FBBF24]">Resend code</button>}
          </div>
        </>
      )}

      {(step === 'password' || step === 'saving') && (
        <form onSubmit={save} className="flex flex-col gap-2.5">
          <input type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={field} />
          <input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} style={field} />
          <button
            type="submit" disabled={step === 'saving'}
            className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl text-[12.5px] font-bold uppercase tracking-[0.06em] text-[#1a1203] disabled:opacity-70"
            style={{ background: 'linear-gradient(180deg,#E0A010,#C98A06)', boxShadow: '0 3px 0 #8a5a05' }}
          >
            {step === 'saving' && <Loader2 size={15} className="animate-spin" />} Update password
          </button>
        </form>
      )}

      {step === 'done' && (
        <p className="m-0 flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#10b981' }}><CheckCircle2 size={17} /> Password updated.</p>
      )}

      <AnimatePresence>
        {error && step !== 'done' && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="m-0 mt-3 text-[12.5px]" style={{ color: '#f43f5e' }}>{error}</motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
