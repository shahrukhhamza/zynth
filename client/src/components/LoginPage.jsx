import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthLayout, AuthHeading, Field, PasswordField, FormAlert, SubmitButton, SwitchLine, shake } from './auth/AuthKit';

// Google sign-in stays hidden until VITE_ENABLE_GOOGLE_SIGNIN=true. Enable it only after the site's
// origin is added to "Authorized JavaScript origins" of the OAuth client in Google Cloud Console.
const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === 'true';
const GOOGLE_CLIENT_ID = GOOGLE_ENABLED ? (import.meta.env.VITE_GOOGLE_CLIENT_ID || '') : '';

export default function LoginPage({ onSwitchToSignup, onBack, onForgotPassword }) {
  const { login, loginWithGoogle } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleOnlyError, setIsGoogleOnlyError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);
  const initializedRef = useRef(false);

  /* ── Google (hidden unless enabled) ── */
  const handleGoogleCredential = useCallback(async (response) => {
    setError('');
    setIsGoogleOnlyError(false);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    const initGoogle = () => {
      if (initializedRef.current) return true;
      if (!window.google?.accounts?.id) return false;
      initializedRef.current = true;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false, cancel_on_tap_outside: true });
      return true;
    };
    if (initGoogle()) return undefined;
    const interval = setInterval(() => { if (initGoogle()) clearInterval(interval); }, 100);
    return () => clearInterval(interval);
  }, [handleGoogleCredential]);

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;
    setGoogleLoading(true);
    window.google.accounts.id.prompt((n) => { if (n.isNotDisplayed() || n.isSkippedMoment()) setGoogleLoading(false); });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'GOOGLE_ONLY_ACCOUNT') {
        setIsGoogleOnlyError(true);
        setError(data.error);
      } else {
        setIsGoogleOnlyError(false);
        const msg = data?.error || 'Login failed. Please check your credentials.';
        setError(msg);
        setFieldErrors({ email: ' ', password: msg });
      }
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout onBack={onBack}>
      <AuthHeading title="Welcome back" subtitle="Sign in to continue to your dashboard." />

      <FormAlert tone={isGoogleOnlyError ? 'info' : 'error'}>{error}</FormAlert>

      {GOOGLE_ENABLED && (
        <>
          <button
            type="button" onClick={handleGoogleClick} disabled={googleLoading || !GOOGLE_CLIENT_ID}
            className="mb-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-[14px] font-semibold transition-colors hover:border-[#CA8A04]/50 disabled:opacity-60"
            style={{ background: theme.surface, borderColor: theme.border, color: theme.text }}
          >
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>
          <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
            <span className="h-px flex-1" style={{ background: theme.border }} />or<span className="h-px flex-1" style={{ background: theme.border }} />
          </div>
        </>
      )}

      <motion.form key={shakeKey} onSubmit={handleSubmit} animate={shakeKey ? shake : undefined} noValidate>
        <Field id="li-email" label="Email" icon={Mail} type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
        <PasswordField
          id="li-pass" label="Password" icon={Lock} autoComplete="current-password" required placeholder="Enter your password"
          value={password} onChange={(e) => setPassword(e.target.value)} show={showPass} onToggle={() => setShowPass((v) => !v)} error={fieldErrors.password}
          right={<button type="button" onClick={onForgotPassword} className="border-0 bg-transparent p-0 text-[12.5px] font-semibold text-[#A16207] hover:underline dark:text-[#FBBF24]">Forgot password?</button>}
        />
        <div className="mt-6">
          <SubmitButton loading={loading}>Sign in {!loading && <ArrowRight size={17} />}</SubmitButton>
        </div>
      </motion.form>

      <SwitchLine action="Create one free" onClick={onSwitchToSignup}>New to Zynth?</SwitchLine>
    </AuthLayout>
  );
}
