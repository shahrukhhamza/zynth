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

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, BookOpen, ArrowRight, TrendingUp, Brain,
  Shuffle, HelpCircle, Flame, Check,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// ── Personalisation helpers ───────────────────────────────────────────────────

const PROBLEM_COPY = {
  streaks: {
    label: 'Losing Streaks',
    icon: Flame,
    headline: 'Let\'s find out what\'s behind your losing streaks.',
    desc: 'We\'ll analyse your trades and pinpoint the exact patterns causing them.',
    color: '#ef4444',
    colorBg: 'rgba(239,68,68,0.1)',
  },
  emotional: {
    label: 'Emotional Trading',
    icon: Brain,
    headline: 'You struggle with emotional trading — let\'s fix that.',
    desc: 'Zynth automatically flags FOMO entries, revenge trades, and overtrading sessions.',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.1)',
  },
  strategy: {
    label: 'Inconsistent Strategy',
    icon: Shuffle,
    headline: 'Your strategy isn\'t broken — you just don\'t know what\'s working.',
    desc: 'Zynth scores every setup you\'ve traded so you can double down on your edge.',
    color: '#CA8A04',
    colorBg: 'rgba(202,138,4,0.1)',
  },
  unknown: {
    label: 'Finding Your Edge',
    icon: HelpCircle,
    headline: "Your best trades hold a pattern you've never seen.",
    desc: 'Zynth extracts winning patterns from your trade history and shows you your real edge.',
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.1)',
  },
};

const MARKET_COPY = {
  gold:    { label: 'Gold (XAU/USD)', tip: 'Macro conditions like CPI and NFP move gold the most — we track all of them.' },
  forex:   { label: 'Forex',          tip: 'Session timing (London/New York overlap) is critical — we overlay it on every trade.' },
  crypto:  { label: 'Crypto',         tip: 'We track BTC, ETH and major alts with live WebSocket data.' },
  indices: { label: 'Indices',        tip: 'GDP, earnings seasons, and rate decisions drive indices — we score them all.' },
};

// ── What to expect checklist ──────────────────────────────────────────────────

const WHAT_TO_EXPECT = [
  { text: 'AI analysis on every trade you add' },
  { text: 'Behavioral pattern detection (FOMO, revenge, overtrading)' },
  { text: 'Macro surprise scores for every major USD event' },
  { text: 'Weekly performance reports powered by Gemini AI' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeScreen({ onAddFirstTrade, onSkip, userName = 'Trader' }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  // Read pre-signup answers
  const preMarket  = sessionStorage.getItem('zynth_pre_market') || '';
  const preProblem = sessionStorage.getItem('zynth_pre_problem') || '';

  const problemData = PROBLEM_COPY[preProblem] || null;
  const marketData  = MARKET_COPY[preMarket] || null;
  const ProblemIcon = problemData?.icon ?? Sparkles;

  const firstName = userName.split(' ')[0] || 'Trader';

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9980] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: theme.isDark ? '#0a0a0a' : '#f4f6f9',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl py-10"
      >
        {/* Top glow orb */}
        <div
          className="absolute top-0 left-1/2 -tranzinc-x-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(202,138,4,0.08) 0%, transparent 70%)',
          }}
        />

        {/* ── Sparkle icon ── */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,rgba(202,138,4,0.18),rgba(6,182,212,0.12))',
              border: '1px solid rgba(202,138,4,0.25)',
              boxShadow: '0 0 40px rgba(202,138,4,0.2)',
            }}
          >
            <Sparkles size={30} style={{ color: '#CA8A04' }} />
          </motion.div>
        </div>

        {/* ── Headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="text-center mb-2"
        >
          <h1
            className="text-[32px] md:text-[38px] font-extrabold tracking-tight leading-tight"
            style={{ color: theme.text }}
          >
            Welcome to Zynth, {firstName}.
          </h1>
          <p className="text-[16px] mt-2 font-medium" style={{ color: theme.muted }}>
            {problemData
              ? problemData.headline
              : "Let's analyse your trading behaviour."}
          </p>
        </motion.div>

        {/* ── Personalised problem badge ── */}
        {problemData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-5 mb-6"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border"
              style={{
                background: problemData.colorBg,
                borderColor: `${problemData.color}30`,
              }}
            >
              <ProblemIcon size={14} style={{ color: problemData.color }} />
              <span className="text-[13px] font-semibold" style={{ color: problemData.color }}>
                Focus: {problemData.label}
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Market tip ── */}
        {marketData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mx-auto max-w-md mb-6"
          >
            <div
              className="px-4 py-3 rounded-xl border text-center"
              style={{
                background: theme.isDark ? 'rgba(202,138,4,0.05)' : 'rgba(202,138,4,0.04)',
                borderColor: 'rgba(202,138,4,0.15)',
              }}
            >
              <p className="text-[13px]" style={{ color: theme.muted }}>
                <span className="font-semibold" style={{ color: theme.text }}>
                  Trading {marketData.label}?
                </span>{' '}
                {marketData.tip}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── What to expect ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mx-auto max-w-md mb-8"
        >
          <div
            className="rounded-2xl border p-5"
            style={{
              background: theme.isDark ? '#141414' : '#ffffff',
              borderColor: theme.border,
              boxShadow: theme.isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.05)',
            }}
          >
            <p
              className="text-[11px] font-bold tracking-[0.16em] uppercase mb-4"
              style={{ color: theme.muted }}
            >
              What you unlock today
            </p>
            <div className="space-y-3">
              {WHAT_TO_EXPECT.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.42 + i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-px"
                    style={{ background: 'rgba(202,138,4,0.12)', border: '1px solid rgba(202,138,4,0.2)' }}
                  >
                    <Check size={10} style={{ color: '#CA8A04' }} />
                  </div>
                  <p className="text-[13px] leading-snug" style={{ color: theme.text }}>
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col items-center gap-3"
        >
          <button
            onClick={onAddFirstTrade}
            className="group relative overflow-hidden inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold text-white transition-all hover:scale-[1.03]"
            style={{
              background: 'linear-gradient(135deg,#CA8A04 0%,#EAB308 100%)',
              boxShadow: '0 6px 28px rgba(202,138,4,0.40)',
            }}
          >
            <BookOpen size={18} />
            <span className="relative z-10 flex items-center gap-2">
              Add My First Trade
              <ArrowRight size={16} className="group-hover:tranzinc-x-1 transition-transform" />
            </span>
            {/* shimmer */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmerBtn 3s linear infinite',
              }}
            />
          </button>

          <button
            onClick={onSkip}
            className="text-[13px] transition-colors"
            style={{ color: theme.muted }}
            onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
          >
            Explore dashboard first →
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
