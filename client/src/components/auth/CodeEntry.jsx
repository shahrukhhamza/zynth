/**
 * CodeEntry — the "we emailed you a 6-digit code" step, shared by sign-up verification and password reset.
 *
 * The parent supplies the two network actions; this component owns the code, the error text, the busy
 * state and the resend countdown.
 *   onSubmit(code)  → Promise; reject (axios error or Error) to show a message
 *   onResend()      → Promise<{ resendAfter?: number, devCode?: string }>
 */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MailCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import OtpInput from './OtpInput';
import { AuthHeading, FormAlert, SubmitButton } from './AuthKit';

const messageOf = (err, fallback) => err?.response?.data?.error || err?.message || fallback;

export default function CodeEntry({
  title = 'Check your email',
  email,
  expiresInMinutes = 10,
  submitLabel = 'Verify',
  resendAfter = 60,
  devCode = null,
  onSubmit,
  onResend,
  onChangeEmail,
  changeEmailLabel = 'Use a different email',
  onFatal,
}) {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(resendAfter);
  const [hint, setHint] = useState(devCode);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const submit = useCallback(async (value) => {
    if (busy || value.length !== 6) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await onSubmit(value);
    } catch (err) {
      setError(messageOf(err, 'That did not work. Please try again.'));
      setShakeKey((k) => k + 1);
      setCode('');
      const c = err?.response?.data?.code;
      if (c === 'NO_PENDING' || c === 'CODE_EXPIRED' || c === 'TOO_MANY_ATTEMPTS') onFatal?.(c);
    } finally {
      setBusy(false);
    }
  }, [busy, onSubmit, onFatal]);

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      const r = await onResend();
      setResendIn(r?.resendAfter ?? 60);
      if (r?.devCode) setHint(r.devCode);
      setNotice('A new code is on its way.');
      setCode('');
    } catch (err) {
      const wait = err?.response?.data?.retryAfter;
      if (wait) setResendIn(wait);
      setError(messageOf(err, 'Could not resend the code.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{ background: 'rgba(202,138,4,0.12)', borderColor: 'rgba(202,138,4,0.35)', color: '#CA8A04' }}
      >
        <MailCheck size={26} />
      </motion.div>

      <AuthHeading
        title={title}
        subtitle={<>We sent a 6-digit code to <strong style={{ color: theme.text }}>{email}</strong>. It expires in {expiresInMinutes} minutes.</>}
      />

      <FormAlert>{error}</FormAlert>
      <FormAlert tone="info">{notice}</FormAlert>

      <div key={shakeKey} className="mb-6">
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={busy} error={!!error} />
      </div>

      {hint && (
        <p className="m-0 mb-4 rounded-xl border px-3.5 py-2.5 text-center text-[12.5px]" style={{ borderColor: 'rgba(202,138,4,0.35)', background: 'rgba(202,138,4,0.08)', color: theme.textMuted }}>
          Development mode: no email provider is configured, so your code is <strong style={{ color: theme.text, letterSpacing: 2 }}>{hint}</strong>
        </p>
      )}

      <SubmitButton type="button" loading={busy} disabled={busy || code.length !== 6} onClick={() => submit(code)}>
        {submitLabel} {!busy && <ArrowRight size={17} />}
      </SubmitButton>

      <div className="mt-6 flex flex-col items-center gap-2 text-[13.5px]" style={{ color: theme.textMuted }}>
        <span>
          Didn&apos;t get it?{' '}
          {resendIn > 0 ? (
            <span className="tabular-nums">Resend in {resendIn}s</span>
          ) : (
            <button type="button" onClick={resend} disabled={busy} className="border-0 bg-transparent p-0 font-bold text-[#A16207] underline-offset-4 hover:underline disabled:opacity-60 dark:text-[#FBBF24]">
              Resend code
            </button>
          )}
        </span>
        <span className="text-[12.5px]">Check your spam folder if it does not arrive within a minute.</span>
        {onChangeEmail && (
          <button type="button" onClick={onChangeEmail} className="mt-1 border-0 bg-transparent p-0 text-[13px] font-semibold underline-offset-4 hover:underline" style={{ color: theme.text }}>
            {changeEmailLabel}
          </button>
        )}
      </div>
    </div>
  );
}
