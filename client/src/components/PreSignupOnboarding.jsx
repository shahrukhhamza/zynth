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
  X, ArrowRight, ChevronLeft, Check,
  Bitcoin, BarChart2, TrendingUp, Globe,
  Flame, Brain, Shuffle, HelpCircle, Sparkles, Bot,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';
import { IconContainer } from './ui';

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
      className="w-full text-left rounded-2xl border transition-all duration-200 group relative overflow-hidden"
      style={{
        padding: '12px 16px',
        background: selected
          ? theme.isDark
            ? 'linear-gradient(135deg, rgba(29,78,216,0.25) 0%, rgba(6,182,212,0.12) 100%)'
            : 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(14,165,233,0.04) 100%)'
          : theme.isDark ? 'rgba(255,255,255,0.025)' : '#ffffff',
        borderColor: selected
          ? theme.isDark ? 'rgba(59,130,246,0.6)' : 'rgba(37,99,235,0.55)'
          : theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        boxShadow: selected
          ? theme.isDark
            ? '0 0 0 1px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 0 0 3px rgba(37,99,235,0.12), 0 4px 16px rgba(37,99,235,0.1)'
          : theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = theme.isDark ? 'rgba(59,130,246,0.35)' : 'rgba(37,99,235,0.3)';
          e.currentTarget.style.boxShadow = theme.isDark
            ? '0 2px 12px rgba(59,130,246,0.1)'
            : '0 2px 12px rgba(37,99,235,0.08), 0 1px 3px rgba(0,0,0,0.05)';
          e.currentTarget.style.background = theme.isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.025)';
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
          e.currentTarget.style.boxShadow = theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)';
          e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.025)' : '#ffffff';
        }
      }}
    >
      <div className="flex items-center gap-3.5">
        {/* Icon container */}
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            background: selected
              ? theme.isDark
                ? 'linear-gradient(135deg, rgba(29,78,216,0.5), rgba(6,182,212,0.3))'
                : 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(14,165,233,0.1))'
              : theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: selected
              ? `1px solid ${theme.isDark ? 'rgba(59,130,246,0.4)' : 'rgba(37,99,235,0.3)'}`
              : `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: selected ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
          }}
        >
          <Icon
            size={18}
            style={{ color: selected ? (theme.isDark ? '#93c5fd' : '#1d4ed8') : theme.muted }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold leading-tight transition-colors duration-150"
            style={{ color: selected ? (theme.isDark ? '#f1f5f9' : '#0f172a') : theme.text }}
          >
            {label}
          </p>
          {desc && (
            <p className="text-[12px] mt-0.5 leading-snug" style={{ color: theme.muted }}>
              {desc}
            </p>
          )}
        </div>

        {/* Radio indicator */}
        <div
          className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: selected
              ? theme.isDark ? '#3b82f6' : '#2563eb'
              : theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)',
            background: selected
              ? 'linear-gradient(135deg, #1d4ed8, #0284c7)'
              : 'transparent',
            boxShadow: selected ? '0 0 8px rgba(59,130,246,0.45)' : 'none',
          }}
        >
          {selected && <Check size={10} color="#fff" strokeWidth={3} />}
        </div>
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
        background: theme.isDark ? 'rgba(0,0,0,0.82)' : 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 500,
          borderRadius: 24,
          background: theme.isDark
            ? 'linear-gradient(160deg, #0d1629 0%, #0b1220 50%, #080f1c 100%)'
            : '#ffffff',
          border: theme.isDark
            ? '1px solid rgba(255,255,255,0.09)'
            : '1px solid rgba(0,0,0,0.07)',
          boxShadow: theme.isDark
            ? '0 0 0 1px rgba(59,130,246,0.07), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(59,130,246,0.08)'
            : '0 0 0 1px rgba(0,0,0,0.04), 0 32px 80px rgba(15,23,42,0.2), 0 8px 32px rgba(15,23,42,0.08)',
        }}
      >
        {/* Top ambient glow strip */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 1,
            background: theme.isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 40%, rgba(6,182,212,0.5) 60%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.35) 40%, rgba(14,165,233,0.3) 60%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 80,
            background: theme.isDark
              ? 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 100%)'
              : 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(37,99,235,0.05) 0%, transparent 100%)',
          }}
        />

        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <span className="text-[13px] font-extrabold tracking-tight" style={{ color: theme.accent }}>Zynth</span>
          </div>

          {/* AI init label */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
               style={{
                 background: theme.isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)',
                 border: `1px solid ${theme.isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.15)'}`,
               }}>
            <Bot size={11} style={{ color: theme.accent }} />
            <span className="text-[10px] font-semibold" style={{ color: theme.isDark ? '#93c5fd' : '#1d4ed8' }}>
              Initializing trading profile
            </span>
            <span className="flex gap-[3px] items-center">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: theme.accent,
                    animation: `dotPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
                  }}
                />
              ))}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              color: theme.muted,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar + step label */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2.5">
            {/* Step pips */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: step === n ? 22 : 6,
                    height: 6,
                    background: n <= step
                      ? 'linear-gradient(90deg, #1d4ed8, #0284c7)'
                      : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    boxShadow: n === step ? '0 0 8px rgba(59,130,246,0.55)' : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: theme.muted }}>
              Step {step} of 3
              {step === 1 && ' — Setting up your trading profile'}
              {step === 2 && ' — Identifying your challenge'}
              {step === 3 && ' — Generating your analysis'}
            </span>
          </div>
          {/* Track */}
          <div
            style={{
              height: 2,
              background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(step / 3) * 100}%`,
                background: 'linear-gradient(90deg, #1d4ed8, #0284c7)',
                boxShadow: '0 0 8px rgba(59,130,246,0.4)',
              }}
            />
          </div>
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
                className="px-6 py-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase"
                    style={{ color: theme.accent }}
                  >
                    Market Selection
                  </span>
                  <div className="flex-1 h-px" style={{ background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                </div>
                <h2
                  className="text-[22px] font-extrabold mb-1.5 leading-snug"
                  style={{ color: theme.text }}
                >
                  What do you trade?
                </h2>
                <p className="text-[13px] mb-5" style={{ color: theme.muted }}>
                  We'll personalise your experience around your market.
                </p>
                <div className="space-y-2">
                  {MARKETS.map(m => (
                    <OptionCard
                      key={m.id}
                      label={m.label}
                      desc={m.desc}
                      icon={m.icon}
                      selected={market === m.id}
                      onClick={() => { setMarket(m.id); setTimeout(advance, 320); }}
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
                className="px-6 py-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase"
                    style={{ color: theme.accent }}
                  >
                    Pattern Detection
                  </span>
                  <div className="flex-1 h-px" style={{ background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                </div>
                <h2
                  className="text-[22px] font-extrabold mb-1.5 leading-snug"
                  style={{ color: theme.text }}
                >
                  What's your biggest challenge?
                </h2>
                <p className="text-[13px] mb-5" style={{ color: theme.muted }}>
                  Be honest — this is exactly what Zynth is built to fix.
                </p>
                <div className="space-y-2">
                  {PROBLEMS.map(p => (
                    <OptionCard
                      key={p.id}
                      label={p.label}
                      desc={p.desc}
                      icon={p.icon}
                      selected={problem === p.id}
                      onClick={() => { setProblem(p.id); setTimeout(advance, 320); }}
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
                className="px-6 py-6"
              >
                {/* Icon + badge */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: theme.isDark
                        ? 'linear-gradient(135deg, rgba(29,78,216,0.35), rgba(2,132,199,0.2))'
                        : 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.08))',
                      border: `1px solid ${theme.isDark ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.2)'}`,
                      boxShadow: theme.isDark ? '0 0 20px rgba(59,130,246,0.15)' : 'none',
                    }}
                  >
                    <Sparkles size={22} style={{ color: theme.accent }} />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase mb-0.5" style={{ color: theme.accent }}>
                      Your personalised analysis
                    </p>
                    <p className="text-[12px]" style={{ color: theme.muted }}>Ready based on your answers</p>
                  </div>
                </div>

                {/* Hook content card */}
                <div
                  className="rounded-2xl p-5 mb-4"
                  style={{
                    background: theme.isDark
                      ? 'rgba(255,255,255,0.025)'
                      : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <h2
                    className="text-[18px] font-extrabold leading-snug mb-3"
                    style={{ color: theme.text }}
                  >
                    {hook.title}
                  </h2>
                  <p
                    className="text-[13.5px] leading-relaxed"
                    style={{ color: theme.muted }}
                  >
                    {hook.body}
                  </p>
                </div>

                {/* Stats row */}
                <div
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { val: '68%', label: 'losses are emotional' },
                    { val: '3×', label: 'more profitable w/ journal' },
                    { val: '23%', label: 'avg win-rate boost' },
                  ].map(({ val, label }) => (
                    <div
                      key={label}
                      className="text-center rounded-xl py-3 px-2"
                      style={{
                        background: theme.isDark ? 'rgba(59,130,246,0.07)' : 'rgba(37,99,235,0.05)',
                        border: `1px solid ${theme.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.12)'}`,
                      }}
                    >
                      <div
                        className="text-[20px] font-extrabold leading-none mb-1"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                      >
                        {val}
                      </div>
                      <div className="text-[10px] leading-snug" style={{ color: theme.muted }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4"
          style={{
            borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
            background: theme.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
          }}
        >
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2.5 rounded-xl border transition-all duration-150"
                style={{
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: theme.muted,
                  background: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; }}
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}

            <div className="flex-1" />

            {(step === 1 || step === 2) && (
              <button
                onClick={advance}
                disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200"
                style={{
                  background: (step === 1 ? canAdvanceStep1 : canAdvanceStep2)
                    ? 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)'
                    : theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: (step === 1 ? canAdvanceStep1 : canAdvanceStep2) ? '#ffffff' : theme.muted,
                  boxShadow: (step === 1 ? canAdvanceStep1 : canAdvanceStep2)
                    ? '0 4px 18px rgba(29,78,216,0.38), 0 1px 4px rgba(0,0,0,0.15)'
                    : 'none',
                  cursor: (step === 1 ? canAdvanceStep1 : canAdvanceStep2) ? 'pointer' : 'not-allowed',
                  opacity: (step === 1 ? canAdvanceStep1 : canAdvanceStep2) ? 1 : 0.55,
                }}
                onMouseEnter={e => {
                  if (step === 1 ? canAdvanceStep1 : canAdvanceStep2) {
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,78,216,0.52), 0 2px 6px rgba(0,0,0,0.18)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (step === 1 ? canAdvanceStep1 : canAdvanceStep2) {
                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(29,78,216,0.38), 0 1px 4px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = '';
                  }
                }}
              >
                Continue Analysis <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSignupCTA}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                  boxShadow: '0 4px 20px rgba(29,78,216,0.42), 0 1px 4px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 32px rgba(29,78,216,0.56), 0 2px 8px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,78,216,0.42), 0 1px 4px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = ''; }}
              >
                Create Free Account <ArrowRight size={16} />
              </button>
            )}
          </div>
          {/* Step skip hint */}
          {step < 3 && (
            <p className="text-center mt-3 text-[11px]" style={{ color: theme.isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.6)' }}>
              You can always update this later in your profile
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
