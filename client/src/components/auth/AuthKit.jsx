/**
 * Auth UI kit — layout + form controls shared by Login, Signup, Forgot and Reset password pages.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, Check, Crown, Eye, EyeOff, Loader2, Moon, Sun, Brain, LineChart, ShieldCheck,
} from 'lucide-react';
import { BrandMark } from '../BrandLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { getPublicStats } from '../../utils/publicStats';
import { sphereDataUri } from '../ui/orbSvg';

const EASE = [0.22, 1, 0.36, 1];

/* ── Brand panel (always dark: it is the "stage" next to the form) ───────── */
function BrandPanel() {
  const orb = useMemo(() => sphereDataUri(26), []);
  const [promo, setPromo] = useState(null);
  useEffect(() => {
    getPublicStats()
      .then((d) => { if (d?.promoActive && typeof d.promoSpotsLeft === 'number' && d.promoSpotsLeft > 0) setPromo(d); })
      .catch(() => {});
  }, []);

  const points = [
    { icon: Brain, title: 'AI that reads your behaviour', text: 'Psychology scores, revenge-trade detection and weekly coaching.' },
    { icon: LineChart, title: 'Macro context on every trade', text: 'See what CPI, payrolls and rates were doing when you clicked.' },
    { icon: ShieldCheck, title: 'Private by design', text: 'Your journal is encrypted in transit and never sold.' },
  ];

  return (
    <aside className="relative hidden overflow-hidden bg-[#0b0b0f] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(202,138,4,0.28),transparent)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 30% 20%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 30% 20%, black 20%, transparent 75%)',
        }}
      />
      <motion.img
        src={orb} alt="" draggable={false} aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -right-44 w-[460px] select-none xl:-bottom-60 xl:-right-36 xl:w-[520px]"
        initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
        transition={{ opacity: { duration: 1 }, scale: { duration: 1.2, ease: EASE }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,rgba(11,11,15,0.85)_20%,transparent_70%)]" />

      <div className="relative flex items-center gap-2.5">
        <BrandMark size={32} />
        <span className="font-display text-[22px] font-bold tracking-tight">Zynth</span>
      </div>

      <div className="relative max-w-[480px]">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="font-display m-0 text-[44px] font-bold uppercase leading-[0.98] tracking-[-0.03em] xl:text-[56px]"
        >
          Trade with <span className="text-[#CA8A04]">context,</span> not guesswork.
        </motion.h2>
        <ul className="m-0 mt-9 flex list-none flex-col gap-5 p-0">
          {points.map((p, i) => (
            <motion.li
              key={p.title}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.35 + i * 0.12 }}
              className="flex items-start gap-4"
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#CA8A04]/30 bg-[#CA8A04]/10 text-[#FBBF24]"><p.icon size={18} /></span>
              <span>
                <span className="block text-[15px] font-semibold">{p.title}</span>
                <span className="block text-[13.5px] leading-relaxed text-zinc-400">{p.text}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="relative">
        {promo ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
            className="inline-flex max-w-[440px] items-center gap-3.5 rounded-2xl border border-[#CA8A04]/35 bg-[#CA8A04]/10 px-4 py-3.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CA8A04] text-[#1a1203]"><Crown size={19} /></span>
            <span>
              <span className="block text-[14px] font-bold text-[#FBBF24]">Launch offer: Elite is free</span>
              <span className="block text-[12.5px] text-zinc-300">{promo.promoSpotsLeft} of {promo.promoLimit ?? 100} early-user spots left</span>
            </span>
          </motion.div>
        ) : (
          <p className="m-0 text-[12.5px] text-zinc-500">An analytics and journaling tool. Not investment advice.</p>
        )}
      </div>
    </aside>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
export function AuthLayout({ children, onBack, backLabel = 'Back to home' }) {
  const theme = useTheme();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.08fr_1fr]" style={{ background: theme.bg }}>
      <BrandPanel />
      <main className="relative flex min-h-screen flex-col overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 app-ambient" />
        <div className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          {onBack ? (
            <button onClick={onBack} className="group flex items-center gap-2 rounded-lg border-0 bg-transparent text-[13px] font-medium transition-colors" style={{ color: theme.textMuted }}>
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> {backLabel}
            </button>
          ) : <span />}
          <button
            onClick={theme.toggleTheme}
            aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:border-[#CA8A04]/50"
            style={{ borderColor: theme.border, color: theme.textMuted, background: theme.surface }}
          >
            {theme.isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <BrandMark size={30} />
              <span className="font-display text-[21px] font-bold tracking-tight" style={{ color: theme.text }}>Zynth</span>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }) {
  const theme = useTheme();
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-7">
      <h1 className="m-0 text-[32px] font-bold leading-tight tracking-tight" style={{ color: theme.text }}>{title}</h1>
      {subtitle && <p className="m-0 mt-2 text-[14.5px] leading-relaxed" style={{ color: theme.textMuted }}>{subtitle}</p>}
    </motion.div>
  );
}

/* ── Controls ────────────────────────────────────────────────────────────── */
export function Field({ label, icon: Icon, error, right, trailing, id, className = '', ...input }) {
  const theme = useTheme();
  return (
    <div className={`mb-4 ${className}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold" style={{ color: theme.text }}>{label}</label>
        {right}
      </div>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />}
        <input
          id={id}
          {...input}
          aria-invalid={!!error}
          className="h-12 w-full rounded-xl border text-[14.5px] outline-none transition-all placeholder:text-zinc-400 focus:border-[#CA8A04] focus:ring-4 focus:ring-[#CA8A04]/15"
          style={{
            background: theme.surface, color: theme.text, paddingLeft: Icon ? 40 : 14, paddingRight: trailing ? 46 : 14,
            borderColor: error ? '#f43f5e' : theme.border, boxShadow: theme.isDark ? 'none' : '0 1px 2px rgba(24,24,27,0.04)',
          }}
        />
        {trailing}
      </div>
      <AnimatePresence>
        {error && error.trim() && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="m-0 mt-1.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: '#f43f5e' }}>
            <AlertCircle size={13} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PasswordField({ show, onToggle, ...props }) {
  const theme = useTheme();
  return (
    <Field
      {...props}
      type={show ? 'text' : 'password'}
      trailing={(
        <button
          type="button" onClick={onToggle} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: theme.textMuted }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    />
  );
}

export function StrengthMeter({ password }) {
  const theme = useTheme();
  const checks = [password.length >= 8, /[0-9]/.test(password), /[A-Z]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const meta = [
    { label: '', color: theme.border }, { label: 'Weak', color: '#f43f5e' }, { label: 'Fair', color: '#f97316' },
    { label: 'Good', color: '#eab308' }, { label: 'Strong', color: '#10b981' },
  ][password ? score : 0];
  const hints = ['8+ characters', 'A number', 'A capital letter', 'A symbol'];
  return (
    <AnimatePresence>
      {password && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="-mt-1 mb-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.span key={i} className="h-1.5 flex-1 rounded-full" animate={{ background: i < score ? meta.color : theme.border }} transition={{ duration: 0.3 }} />
              ))}
            </div>
            <span className="w-12 text-right text-[12px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {hints.map((h, i) => (
              <span key={h} className="flex items-center gap-1 text-[11.5px]" style={{ color: checks[i] ? '#10b981' : theme.textMuted }}>
                <Check size={12} style={{ opacity: checks[i] ? 1 : 0.35 }} /> {h}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Checkbox({ checked, onChange, children }) {
  const theme = useTheme();
  return (
    <label className="group flex cursor-pointer items-start gap-3 text-[13px] leading-snug" style={{ color: theme.textMuted }}>
      <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-all" style={{ borderColor: checked ? '#CA8A04' : theme.border, background: checked ? '#CA8A04' : theme.surface }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        <AnimatePresence>{checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}><Check size={12} strokeWidth={3.4} className="text-[#1a1203]" /></motion.span>}</AnimatePresence>
      </span>
      <span>{children}</span>
    </label>
  );
}

export function FormAlert({ children, tone = 'error', action }) {
  const colors = tone === 'error' ? { c: '#f43f5e', bg: 'rgba(244,63,94,0.10)', bd: 'rgba(244,63,94,0.30)' } : { c: '#CA8A04', bg: 'rgba(202,138,4,0.10)', bd: 'rgba(202,138,4,0.30)' };
  return (
    <AnimatePresence>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          role="alert" className="mb-5 overflow-hidden rounded-xl border" style={{ background: colors.bg, borderColor: colors.bd }}
        >
          <div className="flex items-start gap-2.5 px-3.5 py-3 text-[13px] leading-snug" style={{ color: colors.c }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>{children}{action}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SubmitButton({ loading, children, ...rest }) {
  return (
    <button
      type="submit" disabled={loading} {...rest}
      className="group relative flex h-[52px] w-full select-none items-center justify-center gap-2 overflow-hidden rounded-xl text-[14px] font-bold uppercase tracking-[0.06em] text-[#1a1203] transition-all duration-150 hover:translate-y-[1px] active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-70"
      style={{ background: 'linear-gradient(180deg,#E0A010,#C98A06)', boxShadow: '0 4px 0 #8a5a05, 0 16px 30px -10px rgba(202,138,4,0.7)' }}
    >
      <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/40 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      <span className="relative flex items-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : null}{children}</span>
    </button>
  );
}

export function SwitchLine({ children, action, onClick }) {
  const theme = useTheme();
  return (
    <p className="m-0 mt-6 text-center text-[14px]" style={{ color: theme.textMuted }}>
      {children}{' '}
      <button type="button" onClick={onClick} className="border-0 bg-transparent p-0 text-[14px] font-bold text-[#A16207] underline-offset-4 hover:underline dark:text-[#FBBF24]">{action}</button>
    </p>
  );
}

/** Pops a failed form (used by all auth forms) */
export const shake = { x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.45 } };
