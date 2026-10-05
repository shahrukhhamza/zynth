import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthLayout, AuthHeading, Field, PasswordField, FormAlert, SubmitButton, SwitchLine, shake } from './auth/AuthKit';
import GoogleButton from './auth/GoogleButton';

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

  async function handleGoogle(credential) {
    setError('');
    setIsGoogleOnlyError(false);
    try {
      await loginWithGoogle(credential);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.error || 'Google sign-in failed. Please try again.');
    }
  }

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

      <GoogleButton onCredential={handleGoogle} />

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
