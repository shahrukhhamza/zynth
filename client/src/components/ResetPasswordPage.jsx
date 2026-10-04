import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { API_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { AuthLayout, AuthHeading, PasswordField, StrengthMeter, FormAlert, SubmitButton } from './auth/AuthKit';

export default function ResetPasswordPage({ onBack }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const theme = useTheme();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!token) return setError('Invalid reset link. Please request a new one.');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: password });
      setSuccess(true);
      // Back to the login screen shortly after, with the token cleared from the URL
      setTimeout(() => {
        window.history.replaceState({}, '', '/');
        onBack();
      }, 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout onBack={onBack} backLabel="Back to sign in">
      {success ? (
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }} className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', boxShadow: '0 0 50px rgba(16,185,129,0.4)' }}>
            <CheckCircle2 size={38} color="#fff" />
          </motion.div>
          <h1 className="m-0 text-[28px] font-bold" style={{ color: theme.text }}>Password updated</h1>
          <p className="m-0 mt-2 text-[14.5px]" style={{ color: theme.textMuted }}>Taking you to sign in…</p>
        </motion.div>
      ) : (
        <>
          <AuthHeading title="Choose a new password" subtitle="Use at least 8 characters. A mix of letters, numbers and symbols is strongest." />
          <FormAlert>{error}</FormAlert>
          <form onSubmit={handleSubmit} noValidate>
            <PasswordField id="rp-pass" label="New password" icon={Lock} autoComplete="new-password" required placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} show={showPass} onToggle={() => setShowPass((v) => !v)} />
            <StrengthMeter password={password} />
            <PasswordField id="rp-conf" label="Confirm password" icon={Lock} autoComplete="new-password" required placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} show={showConf} onToggle={() => setShowConf((v) => !v)} />
            <div className="mt-6"><SubmitButton loading={loading}>Update password {!loading && <ArrowRight size={17} />}</SubmitButton></div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
