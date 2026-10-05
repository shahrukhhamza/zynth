import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Lock, Mail } from 'lucide-react';
import { API_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { AuthHeading, AuthLayout, Field, FormAlert, PasswordField, StrengthMeter, SubmitButton } from './auth/AuthKit';
import CodeEntry from './auth/CodeEntry';

const post = (path, body) => axios.post(`${API_URL}/api/auth/${path}`, body).then((r) => r.data);
const messageOf = (err, fallback) => err?.response?.data?.error || fallback;

/**
 * Password reset in three steps, like every professional site:
 *   1. enter your email   2. enter the 6-digit code we emailed   3. choose a new password
 */
export default function ForgotPasswordPage({ onBack }) {
  const theme = useTheme();
  const [step, setStep] = useState('email'); // email | code | password | done
  const [email, setEmail] = useState('');
  const [meta, setMeta] = useState({ resendAfter: 60, expiresInMinutes: 10, devCode: null });
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // After a successful reset, return to sign-in
  useEffect(() => {
    if (step !== 'done') return undefined;
    const t = setTimeout(() => { window.history.replaceState({}, '', '/'); onBack(); }, 2600);
    return () => clearTimeout(t);
  }, [step, onBack]);

  async function requestCode(e) {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await post('forgot-password', { email: email.trim() });
      setMeta({ resendAfter: data.resendAfter ?? 60, expiresInMinutes: data.expiresInMinutes ?? 10, devCode: data.devCode ?? null });
      setStep('code');
    } catch (err) {
      setError(messageOf(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function setNewPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await post('reset-password', { email: email.trim(), resetToken, newPassword: password });
      setStep('done');
    } catch (err) {
      const msg = messageOf(err, 'Failed to reset password. Please try again.');
      if (err?.response?.data?.code === 'NO_PENDING') { setStep('email'); setPassword(''); setConfirm(''); }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const backToEmail = () => { setStep('email'); setError(''); };

  /* ── step 2: the code ── */
  if (step === 'code') {
    return (
      <AuthLayout onBack={backToEmail} backLabel="Back">
        <CodeEntry
          title="Enter your code"
          email={email.trim()}
          expiresInMinutes={meta.expiresInMinutes}
          resendAfter={meta.resendAfter}
          devCode={meta.devCode}
          submitLabel="Verify code"
          onSubmit={async (code) => {
            const data = await post('reset-password/verify', { email: email.trim(), code });
            setResetToken(data.resetToken);
            setStep('password');
          }}
          onResend={() => post('forgot-password', { email: email.trim() })}
          onChangeEmail={backToEmail}
          onFatal={() => { /* the error text is already shown; the user can resend */ }}
        />
      </AuthLayout>
    );
  }

  /* ── step 4: done ── */
  if (step === 'done') {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', boxShadow: '0 0 50px rgba(16,185,129,0.4)' }}
          >
            <CheckCircle2 size={38} color="#fff" />
          </motion.div>
          <h1 className="m-0 text-[28px] font-bold" style={{ color: theme.text }}>Password updated</h1>
          <p className="m-0 mt-2 text-[14.5px]" style={{ color: theme.textMuted }}>Taking you to sign in…</p>
        </motion.div>
      </AuthLayout>
    );
  }

  /* ── step 3: new password ── */
  if (step === 'password') {
    return (
      <AuthLayout>
        <AuthHeading title="Choose a new password" subtitle="Your code is verified. Use at least 8 characters. A mix of letters, numbers and symbols is strongest." />
        <FormAlert>{error}</FormAlert>
        <form onSubmit={setNewPassword} noValidate>
          <PasswordField id="fp-pass" label="New password" icon={Lock} autoComplete="new-password" required placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} show={showPass} onToggle={() => setShowPass((v) => !v)} />
          <StrengthMeter password={password} />
          <PasswordField id="fp-conf" label="Confirm password" icon={Lock} autoComplete="new-password" required placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} show={showConf} onToggle={() => setShowConf((v) => !v)} />
          <div className="mt-6"><SubmitButton loading={loading}>Update password {!loading && <ArrowRight size={17} />}</SubmitButton></div>
        </form>
      </AuthLayout>
    );
  }

  /* ── step 1: email ── */
  return (
    <AuthLayout onBack={onBack} backLabel="Back to sign in">
      <AuthHeading title="Reset your password" subtitle="Enter the email you signed up with and we will send you a 6-digit code." />
      <FormAlert>{error}</FormAlert>
      <form onSubmit={requestCode} noValidate>
        <Field id="fp-email" label="Email" icon={Mail} type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="mt-6"><SubmitButton loading={loading}>Send code {!loading && <ArrowRight size={17} />}</SubmitButton></div>
      </form>
    </AuthLayout>
  );
}
