import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useInView, useScroll, AnimatePresence } from 'framer-motion';
import {
  BarChart2, BookOpen, Shield, Zap, Brain,
  AlertCircle, Check, ArrowRight, Menu, X,
  Bot, Star, Info, Sun, Moon, TrendingUp, BookMarked, LineChart,
  ChevronDown, Lock,
} from 'lucide-react';
import { getPublicStats } from '../utils/publicStats';
import Hero from './Hero';
import AIInsightsSection from './AIInsightsSection';
import HowItWorks from './HowItWorks';
import { BrandMark } from './BrandLogo';
import { useTheme } from '../contexts/ThemeContext';
import { DEFAULT_BILLING_CYCLE, getPlanDisplay, getPlanMonthlyLabel } from '../config/pricingPlans';
import SocialProofToast from './SocialProofToast';

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '', direction = 'up' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  const offsets = { up: { y: 24 }, down: { y: -24 }, left: { x: -24 }, right: { x: 24 } };
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ text, isDark }) {
  return (
    <p
      className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4"
      style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
    >
      {text}
    </p>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
function ProblemSection({ isDark }) {
  const problems = [
    {
      Icon: AlertCircle,
      color: isDark ? '#f87171' : '#ef4444',
      title: 'Emotional Trading',
      desc: 'Fear, greed, and revenge trades silently destroy your edge. Without tracking, you never see the pattern developing in real time.',
    },
    {
      Icon: BookMarked,
      color: isDark ? '#71717a' : '#52525b',
      title: 'No Tracking System',
      desc: "Spreadsheets are clunky and abandoned. If you don't log it, you can't improve it. You're flying blind every session.",
    },
    {
      Icon: LineChart,
      color: isDark ? '#71717a' : '#52525b',
      title: 'Zero Feedback Loop',
      desc: "No one tells you what you're doing wrong. You repeat the same costly mistakes across different market conditions, indefinitely.",
    },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <SectionLabel text="The Problem" isDark={isDark} />
          <h2
            className="font-bold tracking-tight leading-[1.08]"
            style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              color: isDark ? '#f4f4f5' : '#09090b',
              letterSpacing: '-0.03em',
            }}
          >
            Why most traders stay stuck
          </h2>
          <p
            className="mt-4 text-[16px] max-w-md mx-auto leading-relaxed"
            style={{ color: isDark ? '#71717a' : '#52525b' }}
          >
            Inconsistency isn't bad luck — it's untracked behavior.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} direction={['left', 'up', 'right'][i]}>
              <div
                className="rounded-2xl p-7 h-full border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: isDark ? '#111113' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                  boxShadow: isDark
                    ? '0 1px 0 rgba(255,255,255,0.04) inset'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <p.Icon size={18} style={{ color: p.color }} />
                </div>

                <h3
                  className="text-[16px] font-semibold mb-2.5"
                  style={{ color: isDark ? '#f4f4f5' : '#09090b' }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: isDark ? '#52525b' : '#71717a' }}
                >
                  {p.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Grid ────────────────────────────────────────────────────────────
function FeaturesGrid({ isDark, onGetStarted }) {
  const features = [
    {
      Icon: BookOpen,
      color: isDark ? '#60a5fa' : '#2563eb',
      title: 'Smart Trade Journal',
      desc: 'Log every trade with entry, exit, emotion, and context in seconds. Never miss a detail that matters.',
    },
    {
      Icon: Bot,
      color: isDark ? '#a78bfa' : '#7c3aed',
      title: 'AI Behavioral Analysis',
      desc: 'Deep AI-powered breakdowns of your patterns, cognitive biases, and recurring blind spots.',
    },
    {
      Icon: BarChart2,
      color: isDark ? '#94a3b8' : '#334155',
      title: 'Performance Dashboard',
      desc: 'Visualize win rate, P&L, consistency score, and 20+ metrics in one unified view.',
    },
    {
      Icon: Brain,
      color: isDark ? '#94a3b8' : '#334155',
      title: 'Context Awareness',
      desc: 'Understand market conditions at the time of each trade. Know when your edge actually works.',
    },
    {
      Icon: TrendingUp,
      color: isDark ? '#34d399' : '#059669',
      title: 'Progress Tracking',
      desc: "Weekly and monthly performance reports to see exactly how far you've come.",
    },
    {
      Icon: Lock,
      color: isDark ? '#94a3b8' : '#334155',
      title: 'Bank-Grade Security',
      desc: 'TLS 1.3 encryption end-to-end. Your trading data is private. Always.',
    },
  ];

  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <SectionLabel text="Features" isDark={isDark} />
          <h2
            className="font-bold tracking-tight leading-[1.08]"
            style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              color: isDark ? '#f4f4f5' : '#09090b',
              letterSpacing: '-0.03em',
            }}
          >
            Everything you need to improve
          </h2>
          <p
            className="mt-4 text-[16px] max-w-md mx-auto leading-relaxed"
            style={{ color: isDark ? '#71717a' : '#52525b' }}
          >
            Built for traders who are serious about performance.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div
                className="rounded-2xl p-7 h-full border transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: isDark ? '#111113' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <f.Icon size={18} style={{ color: f.color }} />
                </div>

                <h3
                  className="text-[15px] font-semibold mb-2"
                  style={{ color: isDark ? '#f4f4f5' : '#09090b' }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-[13.5px] leading-relaxed"
                  style={{ color: isDark ? '#52525b' : '#71717a' }}
                >
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I kept attributing poor outcomes to external factors. After logging about a month of activity, the AI flagged that I was acting impulsively during high-pressure periods. That one insight changed how I approach decisions entirely.",
    name: 'Daniel O.',
    role: 'Independent analyst, strategy consultant',
    avatarColor: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
    stars: 5,
  },
  {
    quote: "Some periods just felt completely off. The context awareness scoring helped me realize I was making decisions against the broader trend without recognizing it. I've been far more deliberate since using Zynth.",
    name: 'Priya R.',
    role: 'Business operations lead, performance coach',
    avatarColor: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    stars: 5,
  },
  {
    quote: "Honestly didn't expect much from another analytics tool. But having the activity log, AI feedback, and data dashboard in one place meant I actually started reviewing my decisions instead of moving on.",
    name: 'James F.',
    role: 'Entrepreneur, part-time advisor',
    avatarColor: 'linear-gradient(135deg,#0f766e,#06b6d4)',
    stars: 5,
  },
  {
    quote: "I used to think I had a clear approach. Turns out I had a collection of habits — some good and some not. The pattern analysis made that unmistakably clear within the first two weeks.",
    name: 'Tom B.',
    role: 'Operations manager, decision-maker',
    avatarColor: 'linear-gradient(135deg,#b45309,#f59e0b)',
    stars: 5,
  },
  {
    quote: "The contextual data integration is what sold me. I used to miss important signals. Now I can see the full picture before committing to a decision. It's changed how I prepare completely.",
    name: 'Leila M.',
    role: 'Research analyst, data-driven professional',
    avatarColor: 'linear-gradient(135deg,#be185d,#ec4899)',
    stars: 5,
  },
  {
    quote: "I was tracking everything in a spreadsheet before. This is a completely different experience. The AI feedback doesn't just describe what happened — it asks the kind of questions I should be asking myself.",
    name: 'Chris A.',
    role: 'Strategic planner, productivity enthusiast',
    avatarColor: 'linear-gradient(135deg,#166534,#22c55e)',
    stars: 5,
  },
];

function TestimonialsGrid({ isDark }) {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <SectionLabel text="Testimonials" isDark={isDark} />
          <h2
            className="font-bold tracking-tight leading-[1.08]"
            style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              color: isDark ? '#f4f4f5' : '#09090b',
              letterSpacing: '-0.03em',
            }}
          >
            What traders are saying
          </h2>
          <p
            className="mt-4 text-[16px] leading-relaxed"
            style={{ color: isDark ? '#71717a' : '#52525b' }}
          >
            Real results from people who track their performance with Zynth.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.05}>
              <div
                className="rounded-2xl p-7 flex flex-col h-full border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: isDark ? '#111113' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>
                  ))}
                </div>

                <p
                  className="text-[13.5px] leading-relaxed flex-1 mb-6"
                  style={{ color: isDark ? '#71717a' : '#52525b' }}
                >
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                    style={{ background: t.avatarColor }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: isDark ? '#a1a1aa' : '#52525b' }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: isDark ? '#3f3f46' : '#a1a1aa' }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function LandingPricing({ isDark, onGetStarted }) {
  const [cycle, setCycle] = useState(DEFAULT_BILLING_CYCLE);
  const isAnnual = cycle === 'annual';

  const elite = getPlanDisplay('elite', cycle);
  const pro = getPlanDisplay('pro', cycle);

  const eliteFeatures = [
    'Unlimited AI insights — no daily limits',
    'Premium behavioral breakdowns & reports',
    'Advanced analytics dashboard',
    'Context intelligence & awareness scoring',
    'Unlimited activity logs',
    'Priority support & early feature access',
  ];
  const proFeatures = [
    '50 AI insights per month',
    'Advanced analytics dashboard',
    'Context awareness scoring',
    'Unlimited activity logs',
    'Full access to core analytics tools',
  ];

  return (
    <section id="pricing" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '500px',
          background: isDark
            ? 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 60%)'
            : 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <SectionLabel text="Pricing" isDark={isDark} />
          <h2
            className="font-black tracking-tight leading-[1.06] mb-4"
            style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              color: isDark ? '#f4f4f5' : '#18181b',
              letterSpacing: '-0.025em',
            }}
          >
            Simple pricing, serious results
          </h2>
          <p className="text-[16px] leading-relaxed" style={{ color: isDark ? '#71717a' : '#71717a' }}>
            No surprises. No contracts. Cancel anytime.
          </p>
        </Reveal>

        {/* Billing Toggle */}
        <Reveal className="flex items-center justify-center gap-4 mb-12">
          <div
            className="inline-flex rounded-full p-1"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : '#efeeec',
              border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.07)',
            }}
          >
            {['monthly', 'annual'].map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className="relative px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200"
                style={cycle === c
                  ? isDark
                    ? { background: 'rgba(255,255,255,0.12)', color: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
                    : { background: '#ffffff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                  : { color: isDark ? '#71717a' : '#52525b' }
                }
              >
                {c === 'annual' ? 'Annual' : 'Monthly'}
              </button>
            ))}
          </div>
          {isAnnual && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border"
              style={isDark
                ? { background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)', color: '#34d399' }
                : { background: 'rgba(5,150,105,0.07)', borderColor: 'rgba(5,150,105,0.2)', color: '#059669' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              2 months free
            </span>
          )}
        </Reveal>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-5 items-stretch">

          {/* Elite */}
          <Reveal>
            <div
              className="group relative rounded-2xl overflow-hidden flex flex-col h-full border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              style={isDark ? {
                background: 'linear-gradient(160deg, #14111f 0%, #111113 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
              } : {
                background: '#ffffff',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 12px 40px rgba(15,23,42,0.09)',
              }}
            >
              {/* Top glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-100"
                style={{
                  background: isDark
                    ? 'radial-gradient(ellipse 80% 35% at 50% -5%, rgba(168,85,247,0.14) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse 80% 35% at 50% -5%, rgba(167,139,250,0.2) 0%, transparent 70%)',
                }}
              />

              <div className="relative p-8 md:p-9 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] mb-3"
                      style={isDark
                        ? { background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc' }
                        : { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#6d28d9', boxShadow: '0 1px 4px rgba(139,92,246,0.1)' }
                      }
                    >
                      🔥 Most Popular
                    </span>
                    <h3
                      className="text-[22px] font-extrabold tracking-tight"
                      style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                    >
                      Elite
                    </h3>
                    <p className="text-[13px] mt-1.5" style={{ color: isDark ? '#71717a' : '#71717a' }}>
                      For professionals who demand the deepest insights
                    </p>
                  </div>
                  {isAnnual && elite.savingsText && (
                    <span
                      className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg mt-1"
                      style={isDark
                        ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }
                        : { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
                      }
                    >
                      {elite.savingsText}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div
                  className="mb-7 pb-7"
                  style={{ borderBottom: isDark ? '1px solid rgba(139,92,246,0.12)' : '1px solid rgba(139,92,246,0.1)' }}
                >
                  <div className="flex items-end gap-2">
                    {elite.anchoredAmount && elite.anchoredAmount > elite.amount && (
                      <span
                        className="pb-2.5 text-[14px] font-medium line-through"
                        style={{ color: isDark ? '#71717a' : '#52525b' }}
                      >
                        {elite.anchoredAmountDisplay}
                      </span>
                    )}
                    <span
                      className="text-[60px] font-black leading-none tracking-tight"
                      style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                    >
                      {elite.amountDisplay}
                    </span>
                    <div className="pb-2.5">
                      <div className="text-[13px] font-medium" style={{ color: isDark ? '#71717a' : '#52525b' }}>
                        /{isAnnual ? 'year' : 'month'}
                      </div>
                      {isAnnual && elite.dailyEquivalent && (
                        <div className="text-[11px]" style={{ color: isDark ? '#71717a' : '#52525b' }}>
                          {elite.dailyEquivalentDisplay}/day
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onGetStarted?.({ plan: 'elite', billingCycle: cycle })}
                  className="group/btn relative w-full rounded-xl py-[14px] text-[14px] font-bold mb-7 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                      : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    boxShadow: isDark
                      ? '0 6px 28px rgba(139,92,246,0.35)'
                      : '0 6px 24px rgba(124,58,237,0.3)',
                  }}
                >
                  <span
                    className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }}
                  />
                  Get Elite Access
                </button>

                <p
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] mb-4"
                  style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
                >
                  Everything in Pro, plus:
                </p>
                <ul className="space-y-3 flex-1">
                  {eliteFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        className="shrink-0 mt-[1px] w-[18px] h-[18px] rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(139,92,246,0.15)' }}
                      >
                        <Check className="w-[9px] h-[9px]" style={{ color: isDark ? '#c084fc' : '#7c3aed' }} />
                      </span>
                      <span className="text-[13px] leading-snug" style={{ color: isDark ? '#d4d4d8' : '#3f3f46' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Pro */}
          <Reveal delay={0.1}>
            <div
              className="group relative rounded-2xl overflow-hidden flex flex-col h-full border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              style={isDark ? {
                background: '#111113',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
              } : {
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 12px 40px rgba(15,23,42,0.08)',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isDark
                    ? 'radial-gradient(ellipse 80% 35% at 50% -5%, rgba(255,255,255,0.04) 0%, transparent 60%)'
                    : 'radial-gradient(ellipse 80% 35% at 50% -5%, rgba(0,0,0,0.03) 0%, transparent 60%)',
                }}
              />

              <div className="relative p-8 md:p-9 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] mb-3"
                      style={isDark
                        ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#a1a1aa' }
                        : { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: '#3f3f46' }
                      }
                    >
                      ⚡ Great Value
                    </span>
                    <h3
                      className="text-[22px] font-extrabold tracking-tight"
                      style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                    >
                      Pro
                    </h3>
                    <p className="text-[13px] mt-1.5" style={{ color: isDark ? '#71717a' : '#71717a' }}>
                      AI-powered feedback to build lasting consistency
                    </p>
                  </div>
                  {isAnnual && pro.savingsText && (
                    <span
                      className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg mt-1"
                      style={isDark
                        ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }
                        : { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
                      }
                    >
                      {pro.savingsText}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div
                  className="mb-7 pb-7"
                  style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-end gap-2">
                    {pro.anchoredAmount && pro.anchoredAmount > pro.amount && (
                      <span
                        className="pb-2.5 text-[14px] font-medium line-through"
                        style={{ color: isDark ? '#71717a' : '#52525b' }}
                      >
                        {pro.anchoredAmountDisplay}
                      </span>
                    )}
                    <span
                      className="text-[60px] font-black leading-none tracking-tight"
                      style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                    >
                      {pro.amountDisplay}
                    </span>
                    <div className="pb-2.5">
                      <div className="text-[13px] font-medium" style={{ color: isDark ? '#71717a' : '#52525b' }}>
                        /{isAnnual ? 'year' : 'month'}
                      </div>
                      {isAnnual && pro.dailyEquivalent && (
                        <div className="text-[11px]" style={{ color: isDark ? '#71717a' : '#52525b' }}>
                          {pro.dailyEquivalentDisplay}/day
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onGetStarted?.({ plan: 'pro', billingCycle: cycle })}
                  className="group/btn relative w-full rounded-xl py-[14px] text-[14px] font-bold mb-7 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={isDark ? {
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    color: '#e2e8f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  } : {
                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                    color: '#ffffff',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={e => {
                    if (isDark) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (isDark) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                >
                  Get Pro Access
                </button>

                <p
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] mb-4"
                  style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
                >
                  What's included:
                </p>
                <ul className="space-y-3 flex-1">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        className="shrink-0 mt-[1px] w-[18px] h-[18px] rounded-full flex items-center justify-center"
                        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                      >
                        <Check className="w-[9px] h-[9px]" style={{ color: isDark ? '#a1a1aa' : '#27272a' }} />
                      </span>
                      <span className="text-[13px] leading-snug" style={{ color: isDark ? '#71717a' : '#52525b' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Trust signals */}
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {[
            { label: 'Cancel anytime', icon: '✓' },
            { label: 'No hidden fees', icon: '✓' },
            { label: 'Secure checkout', icon: '🔒' },
            { label: 'Instant access', icon: '⚡' },
          ].map((t) => (
            <span
              key={t.label}
              className="flex items-center gap-1.5 text-[12px] font-medium"
              style={{ color: isDark ? '#71717a' : '#52525b' }}
            >
              <span style={{ color: '#34d399' }}>{t.icon}</span>
              {t.label}
            </span>
          ))}
        </Reveal>

        {/* Free plan nudge */}
        <Reveal className="mt-6 text-center">
          <div
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl"
            style={isDark
              ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
              : { background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }
            }
          >
            <span className="text-[13px]" style={{ color: isDark ? '#71717a' : '#52525b' }}>
              Not ready to commit?
            </span>
            <div className="w-px h-3.5" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' }} />
            <button
              onClick={() => onGetStarted?.({ plan: 'free', billingCycle: 'monthly' })}
              className="text-[13px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
            >
              Start Free →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'What is Zynth?', a: 'Zynth is an AI-powered performance analytics platform that helps you understand your behavioral patterns, track activities, and improve your outcomes over time. Zynth is not a financial advisory tool and does not provide investment or trading advice of any kind.' },
  { q: 'Is my data safe?', a: 'Yes. All data is encrypted in transit (TLS 1.3) and stored securely. We never share or sell your personal data to third parties.' },
  { q: 'What is the Context Awareness Score?', a: 'The Context Awareness Score analyzes key data inputs and summarizes external conditions relevant to your logged activities. It helps you understand how surrounding context may have influenced your decisions — without providing financial advice.' },
  { q: 'Is there a free plan?', a: 'Absolutely. The Free plan includes core features with no credit card required: 5 lifetime activity logs, 2 lifetime AI analyses, and access to the core analytics dashboard.' },
  { q: 'What does the AI analysis include?', a: 'Our AI reads your activity logs and identifies behavioral patterns, recurring tendencies, and areas of inconsistency — then delivers personalized improvement suggestions to help you make more deliberate decisions.' },
  { q: 'What data does Zynth work with?', a: 'Zynth works with user-logged activity data and contextual signals. You log what you do, and Zynth surfaces patterns across time, context, and outcome to help you understand what drives your performance.' },
  { q: 'What are the subscription prices?', a: `Pro is ${getPlanMonthlyLabel('pro')} and Elite is ${getPlanMonthlyLabel('elite')}. Both are billed monthly and you can cancel anytime. A free plan is available with no credit card required.` },
];

function FAQSection({ isDark }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section id="faq" className="py-28 px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-16">
          <SectionLabel text="Support" isDark={isDark} />
          <h2
            className="font-black tracking-tight leading-[1.06]"
            style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              color: isDark ? '#f4f4f5' : '#18181b',
              letterSpacing: '-0.025em',
            }}
          >
            Frequently asked{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
                  : 'linear-gradient(135deg, #334155, #64748b)',
              }}
            >
              questions
            </span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4">
          {FAQS.map((faq, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div
                className="rounded-2xl border overflow-hidden transition-all duration-300"
                style={{
                  background: isDark ? '#111113' : '#ffffff',
                  borderColor: openFaq === i
                    ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.14)')
                    : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0,0,0,0.45)'
                    : '0 8px 32px rgba(15,23,42,0.07)',
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ChevronDown
                      className="w-4 h-4 shrink-0"
                      style={{ color: isDark ? '#71717a' : '#52525b' }}
                    />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        className="px-6 pb-5 text-[13.5px] leading-relaxed border-t pt-4"
                        style={{
                          color: isDark ? '#71717a' : '#71717a',
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA({ isDark, onGetStarted }) {
  return (
    <section className="py-28 px-6">
      <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 text-[11px] font-semibold"
          style={{
            background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.08)',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.25)' : 'rgba(37,99,235,0.2)'}`,
            color: isDark ? '#60a5fa' : '#2563eb',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
          Join 2,400+ traders already improving
        </div>

        <h2
          className="font-black tracking-tight leading-[1.06] mb-6"
          style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            letterSpacing: '-0.03em',
            color: isDark ? '#f4f4f5' : '#18181b',
          }}
        >
          Start improving{' '}
          <span style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>today.</span>
        </h2>

        <p
          className="text-[17px] mb-10 leading-relaxed"
          style={{ color: isDark ? '#71717a' : '#71717a', maxWidth: '480px', margin: '0 auto 40px' }}
        >
          Join thousands of traders using Zynth to track, analyze, and fix their trading mistakes with AI.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onGetStarted()}
            className="group relative overflow-hidden inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[16px] font-bold transition-all duration-300 hover:-translate-y-1 active:scale-[0.97]"
            style={{
              background: isDark ? '#f4f4f5' : '#09090b',
              color: isDark ? '#09090b' : '#f4f4f5',
              boxShadow: isDark
                ? '0 4px 20px rgba(255,255,255,0.12)'
                : '0 4px 18px rgba(0,0,0,0.22)',
            }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }}
            />
            Get Started Free
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color: isDark ? '#71717a' : '#52525b',
            }}
          >
            View Pricing
          </button>
        </div>

        <p
          className="mt-5 text-[12px]"
          style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
        >
          No credit card required · Free plan available · Cancel anytime
        </p>
      </Reveal>
    </section>
  );
}

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = ['Features', 'Pricing', 'FAQ'];
const TOTAL_FOUNDING = 100;

// ─── Main LandingPage ─────────────────────────────────────────────────────────
export default function LandingPage({ onSignIn, onGetStarted }) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Scroll progress bar
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    getPublicStats()
      .then(d => { setSpotsLeft(d?.totalUsers != null ? Math.max(0, TOTAL_FOUNDING - d.totalUsers) : 0); })
      .catch(() => { setSpotsLeft(0); });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const SEO_TITLE       = 'Zynth: AI-Powered Performance Analytics & Behavioral Insights';
  const SEO_DESCRIPTION = 'Understand your behavioral patterns, track your activities, and improve your decision-making with AI-powered analytics. Zynth is a professional SaaS analytics platform.';
  const SEO_URL         = 'https://zynth.codes';
  const SEO_IMAGE       = 'https://zynth.codes/og-image.png';

  return (
    <>
      <Helmet>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESCRIPTION} />
        <link rel="canonical" href={SEO_URL} />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content={SEO_URL} />
        <meta property="og:title"       content={SEO_TITLE} />
        <meta property="og:description" content={SEO_DESCRIPTION} />
        <meta property="og:image"       content={SEO_IMAGE} />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:url"         content={SEO_URL} />
        <meta name="twitter:title"       content={SEO_TITLE} />
        <meta name="twitter:description" content={SEO_DESCRIPTION} />
        <meta name="twitter:image"       content={SEO_IMAGE} />
        <meta name="google-site-verification" content="ar5DP4kEm7pNSlXYxO2CBLT0yc1Arr-whW3ymDjeflY" />
      </Helmet>

      <div
        className={`min-h-screen overflow-x-hidden ${isDark ? 'bg-[#09090b] text-white' : 'bg-[#f6f5f3] text-[#18181b]'}`}
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(37,99,235,0.05) 0%, transparent 70%)'
            : undefined,
        }}
      >
        {/* Embedded styles */}
        <style>{`
          html { scroll-behavior: smooth; }

          /* Scrollbar */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'};
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'};
          }

          .nav-link-hover { position: relative; }
          .nav-link-hover::after {
            content: '';
            position: absolute;
            bottom: -4px; left: 0;
            width: 0; height: 1.5px;
            background: currentColor;
            transition: width 0.22s ease;
          }
          .nav-link-hover:hover::after { width: 100%; }

          .btn-shimmer { position: relative; overflow: hidden; }
          .btn-shimmer::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0.05) 50%, transparent 55%);
            transform: translateX(-100%);
            transition: transform 0.65s ease;
            pointer-events: none;
          }
          .btn-shimmer:hover::after { transform: translateX(100%); }

          /* Noise grain on dark mode body */
          ${isDark ? `
          body::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            opacity: 0.02;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            background-size: 180px;
          }
          ` : ''}
        `}</style>

        {/* ── Scroll Progress Bar ── */}
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left"
          style={{
            scaleX: scrollYProgress,
            background: '#3b82f6',
          }}
        />

        {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
        <header
          className="sticky top-0 z-50 border-b transition-all duration-300"
          style={{
            background: scrolled
              ? (isDark ? 'rgba(9,9,11,0.92)' : 'rgba(248,250,252,0.92)')
              : (isDark ? 'rgba(9,9,11,0.6)' : 'rgba(248,250,252,0.6)'),
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
            boxShadow: scrolled
              ? (isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 24px rgba(15,23,42,0.08)')
              : 'none',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5 select-none">
              <BrandMark size={36} />
              <span
                className="text-[20px] font-bold tracking-tight"
                style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
              >
                Zynth
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(l => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  className="nav-link-hover text-[14px] font-medium transition-colors"
                  style={{ color: isDark ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.9)' }}
                  onMouseEnter={e => e.currentTarget.style.color = isDark ? '#f4f4f5' : '#18181b'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.9)'}
                >
                  {l}
                </a>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                }}
                aria-label="Toggle theme"
              >
                {isDark
                  ? <Sun className="w-4 h-4 text-amber-400" />
                  : <Moon className="w-4 h-4 text-indigo-500" />
                }
              </button>

              <button
                onClick={onSignIn}
                className="text-[13px] font-medium px-4 py-2 rounded-lg transition-all duration-200"
                style={{ color: isDark ? 'rgba(148,163,184,0.9)' : 'rgba(71,85,105,0.9)' }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? '#f4f4f5' : '#18181b'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(148,163,184,0.9)' : 'rgba(71,85,105,0.9)'}
              >
                Sign In
              </button>

              <button
                onClick={() => onGetStarted()}
                className="btn-shimmer text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                  color: '#ffffff',
                  boxShadow: isDark
                    ? '0 4px 18px rgba(59,130,246,0.3)'
                    : '0 4px 16px rgba(29,78,216,0.25)',
                }}
              >
                Get Started
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{
                color: isDark ? '#71717a' : '#52525b',
                background: mobileOpen
                  ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                  : 'transparent',
              }}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden border-t overflow-hidden"
                style={{
                  background: isDark ? 'rgba(9,9,11,0.98)' : 'rgba(248,250,252,0.98)',
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
                }}
              >
                <div className="px-6 py-4 space-y-1">
                  {NAV_LINKS.map(l => (
                    <a
                      key={l}
                      href={`#${l.toLowerCase()}`}
                      onClick={() => setMobileOpen(false)}
                      className="block text-[15px] py-2 font-medium transition-colors"
                      style={{ color: isDark ? '#71717a' : '#52525b' }}
                    >
                      {l}
                    </a>
                  ))}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={toggleTheme}
                      className="w-11 h-11 flex items-center justify-center rounded-xl border transition-all shrink-0"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      }}
                    >
                      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); onSignIn(); }}
                      className="flex-1 text-[13px] rounded-xl py-2.5 border font-medium transition-all"
                      style={{
                        color: isDark ? '#71717a' : '#52525b',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
                        background: 'transparent',
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); onGetStarted(); }}
                      className="flex-1 text-[13px] font-semibold rounded-xl py-2.5"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: '#ffffff',
                      }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ══════════════════════════ HERO ══════════════════════════════════ */}
        <Hero spotsLeft={spotsLeft} onGetStarted={onGetStarted} onSignIn={onSignIn} />

        {/* ══════════════════════ PROBLEM ══════════════════════════════════ */}
        <ProblemSection isDark={isDark} />

        {/* ══════════════════ AI INSIGHTS DEMO ════════════════════════════ */}
        <AIInsightsSection onGetStarted={onGetStarted} />

        {/* ══════════════════════ HOW IT WORKS ════════════════════════════ */}
        <HowItWorks onGetStarted={onGetStarted} />

        {/* ════════════════════════ FEATURES ══════════════════════════════ */}
        <FeaturesGrid isDark={isDark} onGetStarted={onGetStarted} />

        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════════ */}
        <TestimonialsGrid isDark={isDark} />

        {/* ═══════════════════════════ PRICING ════════════════════════════ */}
        <LandingPricing isDark={isDark} onGetStarted={onGetStarted} />

        {/* ═══════════════════════════ FAQ ════════════════════════════════ */}
        <FAQSection isDark={isDark} />

        {/* ═══════════════════════ FINAL CTA ══════════════════════════════ */}
        <FinalCTA isDark={isDark} onGetStarted={onGetStarted} />

        {/* ══════════════════ DISCLAIMER ═══════════════════════════════════ */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div
              className="rounded-2xl border p-6 md:p-8"
              style={{
                background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(248,250,252,0.9)',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: isDark ? '#52525b' : '#a1a1aa' }} />
                <p
                  className="text-[11px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
                >
                  Important Disclaimer
                </p>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: isDark ? '#52525b' : '#a1a1aa' }}>
                <strong style={{ color: isDark ? '#4b5563' : '#64748b' }}>
                  Zynth is not a trading platform and does not provide financial, investment, or trading advice of any kind.
                </strong>{' '}
                Zynth is a data analysis and behavioral analytics SaaS tool designed solely to help users evaluate their own logged activities, discover behavioral patterns, and track personal performance over time.
                Any data displayed within the platform is for informational and self-analysis purposes only. Users are solely responsible for their own decisions.
                Past performance data shown within the platform does not guarantee future results. By using Zynth, you acknowledge that it is a personal analytics tool and not a financial service.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════ FOOTER ═════════════════════════════ */}
        <footer
          className="border-t pt-16 pb-10 px-6"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
            background: isDark
              ? 'linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.8) 100%)'
              : 'transparent',
          }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-14">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <BrandMark size={36} />
                <span
                  className="text-[17px] font-bold"
                  style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                >
                  Zynth
                </span>
              </div>
              <p
                className="text-[12px] leading-relaxed mb-5"
                style={{ color: isDark ? 'rgba(52,211,153,0.5)' : '#64748b' }}
              >
                Intelligence Behind Every Decision
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.5)' }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
                >
                  Systems operational
                </span>
              </div>
            </div>

            {/* Product */}
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
              >
                Product
              </p>
              <ul className="space-y-2.5">
                {['Features', 'Pricing', 'FAQ', 'Changelog'].map(item => (
                  <li key={item}>
                    <a
                      href={item === 'Pricing' ? '/pricing' : '#'}
                      className="text-[13px] transition-colors"
                      style={{ color: isDark ? '#71717a' : '#52525b' }}
                      onMouseEnter={e => e.currentTarget.style.color = isDark ? '#f4f4f5' : '#18181b'}
                      onMouseLeave={e => e.currentTarget.style.color = isDark ? '#71717a' : '#52525b'}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
              >
                Legal
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Refund Policy', href: '/refund' },
                  { label: 'Service Policy', href: '/service-policy' },
                  { label: 'Our Services', href: '/services' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[13px] transition-colors"
                      style={{ color: isDark ? '#71717a' : '#52525b' }}
                      onMouseEnter={e => e.currentTarget.style.color = isDark ? '#f4f4f5' : '#18181b'}
                      onMouseLeave={e => e.currentTarget.style.color = isDark ? '#71717a' : '#52525b'}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
                style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
              >
                Connect
              </p>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="mailto:getzynth@gmail.com"
                    className="text-[13px] transition-colors"
                    style={{ color: isDark ? '#71717a' : '#52525b' }}
                    onMouseEnter={e => e.currentTarget.style.color = isDark ? '#f4f4f5' : '#18181b'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? '#71717a' : '#52525b'}
                  >
                    getzynth@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer bottom */}
          <div
            className="max-w-7xl mx-auto border-t pt-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px]" style={{ color: isDark ? '#52525b' : '#a1a1aa' }}>
                © 2026 Zynth. All rights reserved.
              </p>
              <p className="text-[11px]" style={{ color: isDark ? '#2d3748' : '#94a3b8' }}>
                Azeem Town, Sihala Street 2, Islamabad, Pakistan
                {' · '}
                <a href="tel:+923175516692" style={{ color: 'inherit', textDecoration: 'none' }}>+92 317 5516692</a>
                {' · '}
                <a href="mailto:getzynth@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>getzynth@gmail.com</a>
              </p>
            </div>
            <div className="flex flex-wrap gap-5">
              {[
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
                { href: '/refund', label: 'Refund' },
                { href: '/service-policy', label: 'Service Policy' },
                { href: 'mailto:getzynth@gmail.com', label: 'Contact' },
              ].map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="text-[11px] transition-colors"
                  style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
                  onMouseEnter={e => e.currentTarget.style.color = isDark ? '#64748b' : '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? '#52525b' : '#a1a1aa'}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </footer>

        {/* Social proof live toast */}
        <SocialProofToast />
      </div>
    </>
  );
}
