/**
 * WelcomeScreen
 *
 * Shown ONCE immediately after a new user signs up — before the main dashboard.
 * Reads pre-signup onboarding answers from sessionStorage to personalise copy.
 *
 * Props:
 *   onAddFirstTrade  — () => void   navigate to journal tab
 *   onSkip           — () => void   go straight to dashboard
 *   userName         — string       user's display name
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, BookOpen, ArrowRight, Brain, Shuffle, HelpCircle, Flame, Crown, ScanSearch, Radar, CalendarClock, FileText,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PROMO_HEADLINE, PROMO_MESSAGE } from './PromoBanner';
import { sphereDataUri } from './ui/orbSvg';

const EASE = [0.22, 1, 0.36, 1];

// ── Personalisation helpers ───────────────────────────────────────────────────

const PROBLEM_COPY = {
  streaks: {
    label: 'Losing Streaks',
    icon: Flame,
    headline: "Let's find out what's behind your losing streaks.",
    color: '#ef4444',
  },
  emotional: {
    label: 'Emotional Trading',
    icon: Brain,
    headline: "You struggle with emotional trading, so let's fix that.",
    color: '#f59e0b',
  },
  strategy: {
    label: 'Inconsistent Strategy',
    icon: Shuffle,
    headline: "Your strategy isn't broken. You just don't know what's working.",
    color: '#CA8A04',
  },
  unknown: {
    label: 'Finding Your Edge',
    icon: HelpCircle,
    headline: "Your best trades hold a pattern you've never seen.",
    color: '#8b5cf6',
  },
};

const MARKET_COPY = {
  gold:    { label: 'Gold (XAU/USD)', tip: 'Macro conditions like CPI and NFP move gold the most. We track all of them.' },
  forex:   { label: 'Forex',          tip: 'Session timing (London/New York overlap) is critical. We overlay it on every trade.' },
  crypto:  { label: 'Crypto',         tip: 'We track BTC, ETH and major alts with live market data.' },
  indices: { label: 'Indices',        tip: 'GDP, earnings seasons and rate decisions drive indices. We score them all.' },
};

const UNLOCKS = [
  { icon: ScanSearch, title: 'AI review of every trade', text: 'Instant feedback the moment you log a trade.' },
  { icon: Radar, title: 'Behaviour detection', text: 'FOMO, revenge trades and overtrading, flagged automatically.' },
  { icon: CalendarClock, title: 'Macro surprise scores', text: 'How each major USD event actually moved the market.' },
  { icon: FileText, title: 'Weekly AI reports', text: 'A plain-English summary of what to repeat and what to stop.' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeScreen({ onAddFirstTrade, onSkip, userName = 'Trader' }) {
  const theme = useTheme();
  const { user } = useAuth();
  const orb = useMemo(() => sphereDataUri(26), []);

  // Read pre-signup answers
  const preMarket = sessionStorage.getItem('zynth_pre_market') || '';
  const preProblem = sessionStorage.getItem('zynth_pre_problem') || '';
  const problemData = PROBLEM_COPY[preProblem] || null;
  const marketData = MARKET_COPY[preMarket] || null;
  const ProblemIcon = problemData?.icon ?? Sparkles;
  const firstName = (userName || 'Trader').split(' ')[0] || 'Trader';

  const rise = (i) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease: EASE, delay: 0.1 + i * 0.09 },
  });

  return (
    <div className="fixed inset-0 z-[9980] overflow-y-auto" style={{ background: theme.bg }}>
      <div aria-hidden="true" className="app-ambient pointer-events-none absolute inset-0" />
      <motion.img
        src={orb} alt="" aria-hidden="true" draggable={false}
        className="pointer-events-none absolute left-1/2 top-[-380px] w-[760px] max-w-none select-none"
        style={{
          x: "-50%",
          opacity: theme.isDark ? 0.4 : 0.26,
          maskImage: 'radial-gradient(closest-side, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 60%, transparent 100%)',
        }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: theme.isDark ? 0.4 : 0.26, scale: 1, y: [0, -12, 0] }}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.4, ease: EASE }, y: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-[640px] flex-col justify-center px-5 py-14">
        <motion.div {...rise(0)} className="mb-5 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em]"
            style={{ borderColor: 'rgba(202,138,4,0.35)', background: 'rgba(202,138,4,0.1)', color: theme.isDark ? '#FBBF24' : '#A16207' }}
          >
            <Sparkles size={13} /> Account created
          </span>
        </motion.div>

        <motion.div {...rise(1)} className="text-center">
          <h1 className="font-display m-0 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[48px]" style={{ color: theme.text }}>
            Welcome to Zynth, <span className="text-[#CA8A04]">{firstName}.</span>
          </h1>
          <p className="mx-auto m-0 mt-3 max-w-[480px] text-[16px] leading-relaxed" style={{ color: theme.isDark ? '#a1a1aa' : theme.textMuted }}>
            {problemData ? problemData.headline : "Let's analyse your trading behaviour."}
          </p>
        </motion.div>

        {user?.promo_elite && (
          <motion.div
            {...rise(2)}
            className="mt-7 flex items-center gap-4 rounded-2xl border px-5 py-4"
            style={{ background: 'rgba(202,138,4,0.1)', borderColor: 'rgba(202,138,4,0.35)' }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#CA8A04] text-[#1a1203]"><Crown size={20} /></span>
            <span>
              <span className="block text-[15px] font-bold" style={{ color: theme.isDark ? '#FBBF24' : '#8a5a05' }}>{PROMO_HEADLINE}</span>
              <span className="block text-[13px] leading-snug" style={{ color: theme.textMuted }}>{PROMO_MESSAGE}</span>
            </span>
          </motion.div>
        )}

        {(problemData || marketData) && (
          <motion.div {...rise(3)} className="mt-4 flex flex-col gap-3">
            {problemData && (
              <div className="inline-flex items-center gap-2 self-center rounded-full border px-4 py-1.5" style={{ background: `${problemData.color}14`, borderColor: `${problemData.color}40` }}>
                <ProblemIcon size={14} style={{ color: problemData.color }} />
                <span className="text-[12.5px] font-semibold" style={{ color: problemData.color }}>Focus: {problemData.label}</span>
              </div>
            )}
            {marketData && (
              <p className="m-0 text-center text-[13.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                <strong style={{ color: theme.text }}>Trading {marketData.label}?</strong> {marketData.tip}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          {...rise(4)}
          className="mt-8 overflow-hidden rounded-[20px] border"
          style={{ background: theme.surface, borderColor: theme.border, boxShadow: theme.shadow }}
        >
          <div className="border-b px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ borderColor: theme.border, color: theme.textMuted }}>
            What you unlock today
          </div>
          <ul className="m-0 grid list-none gap-px p-0 sm:grid-cols-2" style={{ background: theme.border }}>
            {UNLOCKS.map((u) => (
              <li key={u.title} className="flex items-start gap-3.5 p-5" style={{ background: theme.surface }}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ background: 'rgba(202,138,4,0.1)', borderColor: 'rgba(202,138,4,0.25)', color: '#CA8A04' }}>
                  <u.icon size={18} />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold" style={{ color: theme.text }}>{u.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: theme.textMuted }}>{u.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...rise(5)} className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={onAddFirstTrade}
            className="group relative flex h-[56px] w-full max-w-[360px] select-none items-center justify-center gap-2.5 overflow-hidden rounded-xl text-[14px] font-bold uppercase tracking-[0.06em] text-[#1a1203] transition-all duration-150 hover:translate-y-[1px] active:translate-y-[3px]"
            style={{ background: 'linear-gradient(180deg,#E0A010,#C98A06)', boxShadow: '0 4px 0 #8a5a05, 0 18px 34px -10px rgba(202,138,4,0.7)' }}
          >
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/40 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
            <BookOpen size={18} className="relative" />
            <span className="relative">Add my first trade</span>
            <ArrowRight size={17} className="relative transition-transform group-hover:translate-x-1" />
          </button>
          <button onClick={onSkip} className="border-0 bg-transparent text-[13.5px] font-medium transition-colors hover:underline" style={{ color: theme.textMuted }}>
            Explore the dashboard first
          </button>
        </motion.div>
      </div>
    </div>
  );
}
