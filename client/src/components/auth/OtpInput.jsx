/**
 * OtpInput — six single-digit boxes behaving like one field: typing advances, backspace steps back,
 * arrow keys navigate, and pasting (or an OS "from messages" autofill) fills every box at once.
 */
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const LENGTH = 6;

export default function OtpInput({ value, onChange, onComplete, disabled = false, error = false, autoFocus = true }) {
  const theme = useTheme();
  const refs = useRef([]);
  const focusBox = (i) => { const el = refs.current[Math.max(0, Math.min(LENGTH - 1, i))]; el?.focus(); el?.select?.(); };

  useEffect(() => { if (autoFocus) focusBox(0); }, [autoFocus]);

  const commit = (next, focusAt) => {
    const clean = next.replace(/\D/g, '').slice(0, LENGTH);
    onChange(clean);
    if (focusAt != null) focusBox(Math.min(focusAt, clean.length < LENGTH ? clean.length : LENGTH - 1));
    if (clean.length === LENGTH && clean !== value) onComplete?.(clean);
  };

  const onInput = (i, e) => {
    const typed = e.target.value.replace(/\D/g, '');
    if (!typed) { commit(value.slice(0, i) + value.slice(i + 1), i); return; }
    // one digit replaces the box; several digits (paste / autofill) flow into the following boxes
    const next = value.slice(0, i) + typed + value.slice(i + 1);
    commit(next, i + typed.length);
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) commit(value.slice(0, i) + value.slice(i + 1), i);
      else if (i > 0) commit(value.slice(0, i - 1) + value.slice(i), i - 1);
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusBox(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusBox(i + 1); }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    commit(text, text.length);
  };

  return (
    <motion.div
      role="group" aria-label="6-digit verification code"
      animate={error ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
      className="flex justify-center gap-2 sm:gap-2.5"
    >
      {Array.from({ length: LENGTH }, (_, i) => {
        const filled = !!value[i];
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={value[i] || ''}
            onChange={(e) => onInput(i, e)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            disabled={disabled}
            maxLength={LENGTH}
            className="h-[56px] min-w-0 max-w-[54px] flex-1 rounded-xl border-2 text-center text-[24px] font-bold outline-none transition-all duration-150 focus:border-[#CA8A04] focus:ring-4 focus:ring-[#CA8A04]/20 disabled:opacity-60"
            style={{
              background: filled ? (theme.isDark ? 'rgba(202,138,4,0.12)' : '#fbf6e9') : theme.surface,
              color: theme.text,
              borderColor: error ? '#f43f5e' : filled ? 'rgba(202,138,4,0.7)' : theme.border,
              caretColor: '#CA8A04',
            }}
          />
        );
      })}
    </motion.div>
  );
}
