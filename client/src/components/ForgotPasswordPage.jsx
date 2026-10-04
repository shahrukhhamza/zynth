import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, MailCheck, ArrowRight } from 'lucide-react';
import { API_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { AuthLayout, AuthHeading, Field, FormAlert, SubmitButton } from './auth/AuthKit';

export default function ForgotPasswordPage({ onBack }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout onBack={onBack} backLabel="Back to sign in">
      {success ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border" style={{ background: 'rgba(202,138,4,0.12)', borderColor: 'rgba(202,138,4,0.35)', color: '#CA8A04' }}>
            <MailCheck size={36} />
          </div>
          <h1 className="m-0 text-[28px] font-bold" style={{ color: theme.text }}>Check your inbox</h1>
          <p className="m-0 mt-2.5 text-[14.5px] leading-relaxed" style={{ color: theme.textMuted }}>
            If an account exists for <strong style={{ color: theme.text }}>{email}</strong>, a reset link is on its way. It expires in 1 hour.
          </p>
          <button onClick={onBack} className="mt-7 border-0 bg-transparent text-[14px] font-bold text-[#A16207] hover:underline dark:text-[#FBBF24]">Back to sign in</button>
        </motion.div>
      ) : (
        <>
          <AuthHeading title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new one." />
          <FormAlert>{error}</FormAlert>
          <form onSubmit={handleSubmit} noValidate>
            <Field id="fp-email" label="Email" icon={Mail} type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="mt-6"><SubmitButton loading={loading}>Send reset link {!loading && <ArrowRight size={17} />}</SubmitButton></div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
