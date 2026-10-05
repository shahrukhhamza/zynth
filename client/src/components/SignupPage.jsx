import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPublicStats } from '../utils/publicStats';
import {
  AuthLayout, AuthHeading, Field, PasswordField, StrengthMeter, Checkbox, FormAlert, SubmitButton, PromoMeter, shake,
} from './auth/AuthKit';
import GoogleButton from './auth/GoogleButton';
import CodeEntry from './auth/CodeEntry';

export default function SignupPage({ onSwitchToLogin, onBack, onSignupSuccess }) {
  const { register, loginWithGoogle, verifySignup, resendSignupCode } = useAuth();
  const theme = useTheme();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [promoLimit, setPromoLimit] = useState(100);
  const [consent, setConsent] = useState({ terms: false, risk: false });
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirm: '' });
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(null); // set once the server has emailed a verification code
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    getPublicStats()
      .then((d) => {
        if (typeof d?.promoSpotsLeft === 'number') setSpotsLeft(d.promoSpotsLeft);
        if (typeof d?.promoLimit === 'number') setPromoLimit(d.promoLimit);
      })
      .catch(() => {});
  }, []);

  async function handleGoogle(credential) {
    setError('');
    try {
      await loginWithGoogle(credential);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    }
  }

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const fail = () => setShakeKey((k) => k + 1);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({ name: '', email: '', password: '', confirm: '' });
    if (form.password !== form.confirm) { setFieldErrors((fe) => ({ ...fe, confirm: 'Passwords do not match.' })); fail(); return; }
    if (form.password.length < 8) { setFieldErrors((fe) => ({ ...fe, password: 'Password must be at least 8 characters.' })); fail(); return; }
    if (!consent.terms || !consent.risk) { setError('Please accept both agreements below to create your account.'); fail(); return; }
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password, terms_accepted: true });
      if (res.verification) {
        setPending(res.verification);
        return;
      }
      onSignupSuccess?.();
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      if (msg.toLowerCase().includes('email')) setFieldErrors((fe) => ({ ...fe, email: msg }));
      fail();
    } finally {
      setLoading(false);
    }
  }

  if (pending && !success) {
    return (
      <AuthLayout onBack={() => setPending(null)} backLabel="Back">
        <CodeEntry
          title="Verify your email"
          email={pending.email}
          expiresInMinutes={pending.expiresInMinutes}
          resendAfter={pending.resendAfter}
          devCode={pending.devCode}
          submitLabel="Verify and create account"
          onSubmit={async (code) => {
            await verifySignup({ email: pending.email, code });
            onSignupSuccess?.();
            setSuccess(true);
          }}
          onResend={() => resendSignupCode(pending.email)}
          onChangeEmail={() => setPending(null)}
          onFatal={(c) => { if (c === 'NO_PENDING') setPending(null); }}
        />
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg,#CA8A04,#FBBF24)', boxShadow: '0 0 50px rgba(202,138,4,0.45)' }}
          >
            <CheckCircle2 size={38} color="#1a1203" />
          </motion.div>
          <h1 className="m-0 text-[30px] font-bold" style={{ color: theme.text }}>You&apos;re in.</h1>
          <p className="m-0 mt-2 text-[14.5px]" style={{ color: theme.textMuted }}>Taking you to your dashboard…</p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onBack={onBack} tabs={{ active: 'signup', onLogin: onSwitchToLogin, onSignup: () => {} }}>
      <AuthHeading
        title="Create your account"
        subtitle="Start journaling in under a minute. No credit card needed."
      />

      <PromoMeter spotsLeft={spotsLeft} limit={promoLimit} />

      <FormAlert>{error}</FormAlert>

      <GoogleButton onCredential={handleGoogle} text="signup_with" />

      <motion.form key={shakeKey} onSubmit={handleSubmit} animate={shakeKey ? shake : undefined} noValidate>
        <Field id="su-name" label="Full name" icon={User} type="text" autoComplete="name" required placeholder="Jane Smith" value={form.name} onChange={(e) => setField('name', e.target.value)} error={fieldErrors.name} />
        <Field id="su-email" label="Email" icon={Mail} type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={(e) => setField('email', e.target.value)} error={fieldErrors.email} />
        <PasswordField id="su-pass" label="Password" icon={Lock} autoComplete="new-password" required placeholder="At least 8 characters" value={form.password} onChange={(e) => setField('password', e.target.value)} show={showPass} onToggle={() => setShowPass((v) => !v)} error={fieldErrors.password} />
        <StrengthMeter password={form.password} />
        <PasswordField id="su-confirm" label="Confirm password" icon={Lock} autoComplete="new-password" required placeholder="Re-enter password" value={form.confirm} onChange={(e) => setField('confirm', e.target.value)} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} error={fieldErrors.confirm} />

        <div className="mb-6 mt-1 flex flex-col gap-3">
          <Checkbox checked={consent.terms} onChange={(v) => setConsent((c) => ({ ...c, terms: v }))}>
            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: theme.text }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: theme.text }}>Privacy Policy</a>
          </Checkbox>
          <Checkbox checked={consent.risk} onChange={(v) => setConsent((c) => ({ ...c, risk: v }))}>
            I understand trading involves risk and accept sole responsibility for my trades
          </Checkbox>
        </div>

        <SubmitButton loading={loading}>Create account {!loading && <ArrowRight size={17} />}</SubmitButton>
      </motion.form>

    </AuthLayout>
  );
}
