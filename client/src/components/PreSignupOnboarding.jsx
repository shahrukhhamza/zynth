/**
 * PreSignupOnboarding
 *
 * 3-step modal overlay shown when visitor clicks "Analyze My Trades" on the
 * landing page — BEFORE creating an account.
 *
 * Step 1 – "What do you trade?"
 * Step 2 – "What's your biggest trading problem?"
 * Step 3 – Personalised hook → triggers signup
 *
 * Answers are stored in sessionStorage so they can be read after signup to
 * personalise the first-run experience.
 *
 * Props:
 *   onContinueToSignup  — () => void   called when user taps the signup CTA
 *   onClose             — () => void   called when modal is dismissed
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, ChevronLeft,
  Bitcoin, BarChart2, TrendingUp, Globe,
  Flame, Brain, Shuffle, HelpCircle, Sparkles,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';

// ── Data ─────────────────────────────────────────────────────────────────────

const MARKETS = [
  { id: 'forex',   label: 'Forex',         icon: Globe,     desc: 'EUR/USD, GBP/USD, USD/JPY…' },
  { id: 'gold',    label: 'Gold (XAU/USD)', icon: TrendingUp, desc: 'Safe-haven commodity trades' },
  { id: 'crypto',  label: 'Crypto',         icon: Bitcoin,   desc: 'BTC, ETH, SOL and more' },
  { id: 'indices', label: 'Indices',        icon: BarChart2,  desc: 'SPX, NAS100, DAX…' },
];

const PROBLEMS = [
  { id: 'streaks',    label: 'Losing streaks',       icon: Flame,     desc: 'Consecutive losses wipe my gains' },
  { id: 'emotional',  label: 'Emotional trading',     icon: Brain,     desc: 'FOMO entries & revenge trades' },
  { id: 'strategy',   label: 'Inconsistent strategy', icon: Shuffle,   desc: 'I keep switching setups' },
  { id: 'unknown',    label: "Don't know what works",  icon: HelpCircle, desc: 'Hard to see patterns in my trades' },
];

// ── Personalised hook copy ────────────────────────────────────────────────────

function getHookCopy(market, problem) {
  const marketLabel = MARKETS.find(m => m.id === market)?.label ?? 'your market';
  const hooksByProblem = {
    streaks:   { title: "We can find the pattern behind your losing streaks.", body: `Zynth cross-references your ${marketLabel} trades with macro data to pinpoint *when* and *why* your drawdowns happen.` },
    emotional: { title: "We've seen your pattern \u2014 it starts with one bad trade.", body: "Zynth detects FOMO entries and revenge trades automatically and shows you exactly what triggers them." },
    strategy:  { title: "You keep switching because you don't know what's working.", body: `Zynth scores every ${marketLabel} strategy you've tried against macro conditions so you can double down on what actually works.` },
    unknown:   { title: "Your edge is buried in data you've never analysed.", body: `Zynth extracts patterns from your ${marketLabel} trade history and tells you your strongest setups, worst sessions, and best times to trade.` },
  };
  return hooksByProblem[problem] ?? {
    title: `Your ${marketLabel} trades hold more data than you think.`,
    body:  "Zynth turns your trade history into a personalised improvement plan.",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OptionCard({ label, desc, icon: Icon, selected, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 group"
      style={{
        background: selected
          ? theme.accentGlow
          : theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        borderColor: selected ? theme.accent : theme.border,
        boxShadow: selected ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: selected
              ? 'rgba(59,130,246,0.2)'
              : theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            color: selected ? theme.accent : theme.muted,
          }}
        >
          <Icon size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold"
            style={{ color: selected ? theme.text : theme.text }}
          >
            {label}
          </p>
          {desc && (
            <p className="text-[12px] mt-0.5" style={{ color: theme.muted }}>
              {desc}
            </p>
          )}
        </div>
        <div
          className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors"
          style={{
            borderColor: selected ? theme.accent : theme.border,
            background: selected ? theme.accent : 'transparent',
          }}
        />
      </div>
    </button>
  );
}

// ── Slide animation variants ──────────────────────────────────────────────────

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

// ── Main component ────────────────────────────────────────────────────────────

export default function PreSignupOnboarding({ onContinueToSignup, onClose }) {
  const theme = useTheme();
  const [step, setStep] = useState(1);          // 1 | 2 | 3
  const [direction, setDirection] = useState(1); // slide direction
  const [market, setMarket] = useState('');
  const [problem, setProblem] = useState('');

  function advance() {
    setDirection(1);
    setStep(s => s + 1);
  }
  function back() {
    setDirection(-1);
    setStep(s => s - 1);
  }

  function handleSignupCTA() {
    // Persist answers so WelcomeScreen / personalization can read them
    try {
      sessionStorage.setItem('zynth_pre_market', market);
      sessionStorage.setItem('zynth_pre_problem', problem);
    } catch {}
    onContinueToSignup?.();
  }

  const hook = step === 3 ? getHookCopy(market, problem) : null;
  const canAdvanceStep1 = !!market;
  const canAdvanceStep2 = !!problem;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 500,
          borderRadius: 20,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.isDark
            ? '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 32px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <BrandMark size={26} />
            <span className="text-[13px] font-bold" style={{ color: theme.accent }}>Zynth</span>
          </div>

          {/* Progress pips */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="rounded-full transition-all duration-400"
                style={{
                  width: step === n ? 20 : 6,
                  height: 6,
                  background: n <= step
                    ? theme.accent
                    : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: theme.muted,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
          >
            <X size={14} />
          </button>
        </div>

        {/* Thin progress bar */}
        <div
          style={{
            height: 2,
            background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(step / 3) * 100}%`,
              background: 'linear-gradient(90deg,#1d4ed8,#06b6d4)',
            }}
          />
        </div>

        {/* ── Step content with slide animation ── */}
        <div className="overflow-hidden" style={{ minHeight: 360 }}>
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="px-6 py-6"
              >
                <p
                  className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2"
                  style={{ color: theme.accent }}
                >
                  Step 1 of 3
                </p>
                <h2
                  className="text-[22px] font-extrabold mb-1 leading-snug"
                  style={{ color: theme.text }}
                >
                  What do you trade?
                </h2>
                <p className="text-[13px] mb-5" style={{ color: theme.muted }}>
                  We'll personalise your experience around your market.
                </p>
                <div className="space-y-2.5">
                  {MARKETS.map(m => (
                    <OptionCard
                      key={m.id}
                      label={m.label}
                      desc={m.desc}
                      icon={m.icon}
                      selected={market === m.id}
                      onClick={() => setMarket(m.id)}
                      theme={theme}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="px-6 py-6"
              >
                <p
                  className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2"
                  style={{ color: theme.accent }}
                >
                  Step 2 of 3
                </p>
                <h2
                  className="text-[22px] font-extrabold mb-1 leading-snug"
                  style={{ color: theme.text }}
                >
                  What's your biggest problem?
                </h2>
                <p className="text-[13px] mb-5" style={{ color: theme.muted }}>
                  Be honest — this is what Zynth is built to fix.
                </p>
                <div className="space-y-2.5">
                  {PROBLEMS.map(p => (
                    <OptionCard
                      key={p.id}
                      label={p.label}
                      desc={p.desc}
                      icon={p.icon}
                      selected={problem === p.id}
                      onClick={() => setProblem(p.id)}
                      theme={theme}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && hook && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="px-6 py-8 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.12))',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  <Sparkles size={26} style={{ color: theme.accent }} />
                </div>

                <p
                  className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3"
                  style={{ color: theme.accent }}
                >
                  Your personalised analysis
                </p>

                <h2
                  className="text-[21px] font-extrabold leading-snug mb-4"
                  style={{ color: theme.text }}
                >
                  {hook.title}
                </h2>

                <p
                  className="text-[14px] leading-relaxed mb-8 max-w-sm mx-auto"
                  style={{ color: theme.muted }}
                >
                  {hook.body}
                </p>

                {/* Inline stats teaser */}
                <div
                  className="flex items-center justify-center gap-6 py-4 px-5 rounded-2xl border mb-8 text-center"
                  style={{
                    background: theme.isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.04)',
                    borderColor: 'rgba(59,130,246,0.15)',
                  }}
                >
                  {[
                    { val: '68%', label: 'losses are emotional' },
                    { val: '3×', label: 'more profitable w/ journal' },
                    { val: '23%', label: 'avg win-rate boost' },
                  ].map(({ val, label }) => (
                    <div key={label}>
                      <div
                        className="text-[20px] font-extrabold leading-none mb-1 bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                        }}
                      >
                        {val}
                      </div>
                      <div className="text-[11px]" style={{ color: theme.muted }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer buttons ── */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-t"
          style={{ borderColor: theme.border }}
        >
          {step > 1 && (
            <button
              onClick={back}
              className="flex items-center gap-1 text-[13px] font-medium px-3 py-2.5 rounded-xl transition-colors"
              style={{ color: theme.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
              onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}

          <div className="flex-1" />

          {step === 1 && (
            <button
              onClick={advance}
              disabled={!canAdvanceStep1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all"
              style={{
                background: canAdvanceStep1
                  ? 'linear-gradient(135deg,#1d4ed8,#0284c7)'
                  : theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                color: canAdvanceStep1 ? '#fff' : theme.muted,
                boxShadow: canAdvanceStep1 ? '0 4px 16px rgba(59,130,246,0.28)' : 'none',
                cursor: canAdvanceStep1 ? 'pointer' : 'not-allowed',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={advance}
              disabled={!canAdvanceStep2}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-all"
              style={{
                background: canAdvanceStep2
                  ? 'linear-gradient(135deg,#1d4ed8,#0284c7)'
                  : theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                color: canAdvanceStep2 ? '#fff' : theme.muted,
                boxShadow: canAdvanceStep2 ? '0 4px 16px rgba(59,130,246,0.28)' : 'none',
                cursor: canAdvanceStep2 ? 'pointer' : 'not-allowed',
              }}
            >
              Show My Analysis <ArrowRight size={16} />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSignupCTA}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-bold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
                boxShadow: '0 4px 20px rgba(59,130,246,0.40)',
              }}
            >
              Create Free Account <ArrowRight size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
