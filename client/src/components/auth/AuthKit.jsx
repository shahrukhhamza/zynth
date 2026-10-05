/**
 * Auth UI kit — layout + form controls shared by Login, Signup, Forgot and Reset password pages.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, Brain, Check, Crown, Eye, EyeOff, Fingerprint, Loader2, Lock, Moon, Rocket, ShieldCheck, Sun, TrendingUp,
} from 'lucide-react';
import { BrandMark } from '../BrandLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { getPublicStats } from '../../utils/publicStats';
import { sphereDataUri } from '../ui/orbSvg';
import { Ring } from '../ui/Widgets';

const EASE = [0.22, 1, 0.36, 1];

/* ── Brand panel (always dark: it is the "stage" next to the form) ───────── */
function Chip({ icon: Icon, tint, label, value, delay, float, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }} transition={{ duration: float, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 }}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#17171b]/90 px-4 py-3 shadow-[0_20px_44px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${tint}26`, color: tint }}><Icon size={17} /></span>
        <span>
          <span className="block text-[10.5px] font-medium text-zinc-400">{label}</span>
          <span className="block text-[13px] font-semibold text-white">{value}</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

function PreviewScene({ mx, my }) {
  const sx = useSpring(mx, { stiffness: 70, damping: 18 });
  const sy = useSpring(my, { stiffness: 70, damping: 18 });
  const mainX = useTransform(sx, (v) => v * 14); const mainY = useTransform(sy, (v) => v * 10);
  const aX = useTransform(sx, (v) => v * -28); const aY = useTransform(sy, (v) => v * -18);
  const bX = useTransform(sx, (v) => v * 24); const bY = useTransform(sy, (v) => v * 16);
  const cX = useTransform(sx, (v) => v * -18); const cY = useTransform(sy, (v) => v * 20);

  const flags = [['#f43f5e', 'Revenge trade flagged'], ['#f43f5e', 'No stop-loss set'], ['#10b981', 'Followed trading plan']];

  return (
    <div className="relative mx-auto h-[372px] w-full max-w-[470px]">
      <motion.div style={{ x: mainX, y: mainY }} className="absolute inset-x-6 top-14">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 14 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.25 }}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          style={{ transformPerspective: 900 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-zinc-400">AI trade analysis</span>
            <span className="rounded-full bg-[#CA8A04]/20 px-2.5 py-1 text-[10.5px] font-bold text-[#FBBF24]">XAUUSD · Buy</span>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <Ring value={76} size={92} stroke={9} color="#CA8A04">
              <span className="flex flex-col items-center leading-none text-white"><span className="text-[24px] font-bold">76</span><span className="mt-1 text-[8.5px] font-bold uppercase tracking-wider text-zinc-400">Score</span></span>
            </Ring>
            <div className="flex-1 space-y-2">
              {flags.map(([c, t], i) => (
                <motion.div
                  key={t} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.9 + i * 0.15 }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold" style={{ background: `${c}1f`, color: c === '#10b981' ? '#6ee7b7' : '#fda4af' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{t}
                </motion.div>
              ))}
            </div>
          </div>
          <p className="m-0 mt-4 border-t border-white/10 pt-3 text-[12px] leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-200">Insight:</span> your win rate is 74% after the London open.
          </p>
        </motion.div>
      </motion.div>

      <motion.div style={{ x: aX, y: aY }} className="absolute right-0 top-0"><div className="relative h-0 w-0"><Chip icon={TrendingUp} tint="#10b981" label="Macro score" value="+1.8 · Mildly bullish" delay={1.2} float={5} className="right-0 top-0 w-max" /></div></motion.div>
      <motion.div style={{ x: bX, y: bY }} className="absolute bottom-3 left-0"><div className="relative h-0 w-0"><Chip icon={Brain} tint="#a78bfa" label="AI flagged" value="Revenge-trade pattern" delay={1.5} float={6} className="bottom-0 left-0 w-max" /></div></motion.div>
      <motion.div style={{ x: cX, y: cY }} className="absolute bottom-0 right-0"><div className="relative h-0 w-0"><Chip icon={Fingerprint} tint="#FBBF24" label="Trading DNA" value="The Sniper" delay={1.8} float={7} className="bottom-0 right-0 w-max" /></div></motion.div>
    </div>
  );
}

function BrandPanel() {
  const orb = useMemo(() => sphereDataUri(26), []);
  const [promo, setPromo] = useState(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  useEffect(() => {
    getPublicStats()
      .then((d) => { if (d?.promoActive && typeof d.promoSpotsLeft === 'number' && d.promoSpotsLeft > 0) setPromo(d); })
      .catch(() => {});
  }, []);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const limit = promo?.promoLimit ?? 100;
  const claimed = promo ? Math.max(0, limit - promo.promoSpotsLeft) : 0;

  return (
    <aside
      onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}
      className="relative hidden overflow-hidden bg-[#0b0b0f] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_20%_0%,rgba(202,138,4,0.3),transparent)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 40% 30%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 40% 30%, black 20%, transparent 75%)',
        }}
      />
      <motion.img
        src={orb} alt="" draggable={false} aria-hidden="true"
        className="pointer-events-none absolute -bottom-72 -right-56 w-[560px] select-none opacity-60"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.6, scale: 1, y: [0, -14, 0] }}
        transition={{ opacity: { duration: 1 }, scale: { duration: 1.2, ease: EASE }, y: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
      />

      <div className="relative flex items-center gap-2.5">
        <BrandMark size={34} />
        <span className="font-display text-[23px] font-bold tracking-tight">Zynth</span>
      </div>

      <div className="relative">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="font-display m-0 max-w-[520px] text-[40px] font-bold uppercase leading-[0.98] tracking-[-0.03em] xl:text-[50px]"
        >
          Trade with <span className="text-[#CA8A04]">context,</span> not guesswork.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
          className="m-0 mt-4 max-w-[430px] text-[15px] leading-relaxed text-zinc-400"
        >
          Journal every trade, see the macro backdrop behind it, and let AI find the pattern you keep missing.
        </motion.p>
        <div className="mt-8"><PreviewScene mx={mx} my={my} /></div>
        <p className="m-0 mt-4 text-center text-[11px] text-zinc-500">Illustrative sample data</p>
      </div>

      <div className="relative">
        {promo ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-[460px] rounded-2xl border border-[#CA8A04]/35 bg-[#CA8A04]/10 px-4 py-3.5"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CA8A04] text-[#1a1203]"><Crown size={19} /></span>
              <span className="flex-1">
                <span className="block text-[14px] font-bold text-[#FBBF24]">Launch offer: Elite is free</span>
                <span className="block text-[12.5px] text-zinc-300">{claimed} of {limit} early-user spots claimed</span>
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-[#FBBF24]" initial={{ width: 0 }} animate={{ width: `${Math.max(3, (claimed / limit) * 100)}%` }} transition={{ duration: 1.2, ease: EASE, delay: 1 }} />
            </div>
          </motion.div>
        ) : (
          <p className="m-0 text-[12.5px] text-zinc-500">An analytics and journaling tool. Not investment advice.</p>
        )}
      </div>
    </aside>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
function AuthTabs({ active, onLogin, onSignup }) {
  const theme = useTheme();
  const items = [['login', 'Sign in', onLogin], ['signup', 'Create account', onSignup]];
  return (
    <div role="tablist" className="relative mb-8 grid grid-cols-2 gap-1 rounded-2xl border p-1" style={{ background: theme.surface2, borderColor: theme.border }}>
      {items.map(([key, label, onClick]) => {
        const on = key === active;
        return (
          <button
            key={key} role="tab" aria-selected={on} type="button" onClick={on ? undefined : onClick}
            className="relative h-11 rounded-xl border-0 bg-transparent text-[13.5px] font-semibold transition-colors"
            style={{ color: on ? theme.text : theme.textMuted, cursor: on ? 'default' : 'pointer' }}
          >
            {on && (
              <motion.span
                layoutId="auth-tab-pill" className="absolute inset-0 rounded-xl"
                style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? '0 6px 16px -8px rgba(0,0,0,0.7)' : '0 2px 4px rgba(24,24,27,0.06), 0 8px 18px -10px rgba(24,24,27,0.25)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TrustRow() {
  const theme = useTheme();
  const items = [[Lock, 'Encrypted in transit'], [ShieldCheck, 'No card required'], [Rocket, 'Ready in a minute']];
  return (
    <ul className="m-0 mt-6 flex list-none flex-wrap items-center justify-center gap-x-5 gap-y-2 p-0">
      {items.map(([Icon, t]) => (
        <li key={t} className="flex items-center gap-1.5 text-[12px]" style={{ color: theme.textMuted }}>
          <Icon size={13} style={{ color: '#CA8A04' }} /> {t}
        </li>
      ))}
    </ul>
  );
}

export function AuthLayout({ children, onBack, backLabel = 'Back to home', tabs }) {
  const theme = useTheme();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.08fr_1fr]" style={{ background: theme.bg }}>
      <BrandPanel />
      <main className="relative flex min-h-screen flex-col overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 app-ambient" />
        <div className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          {onBack ? (
            <button onClick={onBack} className="group flex items-center gap-2 rounded-lg border-0 bg-transparent text-[13px] font-medium transition-colors hover:opacity-80" style={{ color: theme.textMuted }}>
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
          <motion.div
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}
            className="w-full max-w-[470px]"
          >
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <BrandMark size={30} />
              <span className="font-display text-[21px] font-bold tracking-tight" style={{ color: theme.text }}>Zynth</span>
            </div>
            <div
              className="rounded-[28px] border p-6 sm:p-9"
              style={{
                background: theme.surface, borderColor: theme.border,
                boxShadow: theme.isDark ? '0 40px 90px -40px rgba(0,0,0,0.9)' : '0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 70px -34px rgba(24,24,27,0.28), 0 2px 6px rgba(24,24,27,0.04)',
              }}
            >
              {tabs && <AuthTabs active={tabs.active} onLogin={tabs.onLogin} onSignup={tabs.onSignup} />}
              {children}
            </div>
            {tabs && <TrustRow />}
          </motion.div>
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
      spellCheck={false} autoCapitalize="none" autoCorrect="off"
      {...props}
      type={show ? 'text' : 'password'}
      trailing={(
        <button
          type="button" tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}
          onMouseDown={(e) => e.preventDefault()} // keep focus (and the caret) in the field instead of stealing it
          onClick={() => {
            const y = window.scrollY;
            onToggle();
            requestAnimationFrame(() => { if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y); });
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: theme.textMuted }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    />
  );
}

/**
 * Always rendered (grey until the user types), so its height never changes while typing.
 * An expanding/collapsing meter pushed the fields below it down and back up on the first keystroke.
 */
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
    <div className="-mt-1 mb-4" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.span key={i} className="h-1.5 flex-1 rounded-full" animate={{ background: password && i < score ? meta.color : theme.border }} transition={{ duration: 0.3 }} />
          ))}
        </div>
        <span className="h-[18px] w-12 text-right text-[12px] font-bold leading-[18px]" style={{ color: meta.color }}>{meta.label || ' '}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {hints.map((h, i) => (
          <span key={h} className="flex items-center gap-1 text-[11.5px] transition-colors" style={{ color: password && checks[i] ? '#10b981' : theme.textMuted }}>
            <Check size={12} style={{ opacity: password && checks[i] ? 1 : 0.35 }} /> {h}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Checkbox({ checked, onChange, children }) {
  const theme = useTheme();
  const idle = theme.isDark ? 'rgba(255,255,255,0.45)' : '#8a8a93';
  return (
    <label className="group flex cursor-pointer items-start gap-3 text-[13px] leading-snug" style={{ color: theme.textMuted }}>
      <span
        className="relative mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all duration-150 group-hover:border-[#CA8A04] focus-within:ring-4 focus-within:ring-[#CA8A04]/25"
        style={{
          borderColor: checked ? '#CA8A04' : idle,
          background: checked ? '#CA8A04' : (theme.isDark ? 'rgba(255,255,255,0.06)' : theme.surface2),
          boxShadow: checked ? 'none' : 'inset 0 1px 2px rgba(24,24,27,0.08)',
        }}
      >
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        <AnimatePresence>{checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}><Check size={13} strokeWidth={3.6} className="text-[#1a1203]" /></motion.span>}</AnimatePresence>
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

/** "N of 100 early-user spots claimed" with a progress bar (real numbers from the public stats endpoint). */
export function PromoMeter({ spotsLeft, limit = 100 }) {
  const theme = useTheme();
  if (typeof spotsLeft !== 'number' || spotsLeft <= 0) return null;
  const claimed = Math.max(0, limit - spotsLeft);
  return (
    <div className="mb-6 rounded-2xl border px-4 py-3.5" style={{ background: 'rgba(202,138,4,0.08)', borderColor: 'rgba(202,138,4,0.3)' }}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13px] font-bold" style={{ color: theme.isDark ? '#FBBF24' : '#8a5a05' }}><Crown size={15} /> Elite is free for early users</span>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: theme.textMuted }}>{claimed} / {limit}</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(24,24,27,0.08)' }}>
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-[#FBBF24]" initial={{ width: 0 }} animate={{ width: `${Math.max(3, (claimed / limit) * 100)}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.3 }} />
      </div>
    </div>
  );
}
