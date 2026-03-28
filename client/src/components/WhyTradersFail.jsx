import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { AlertTriangle, Flame, TrendingDown, BarChart2, Check, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-70px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const PAIN_POINTS = [
  {
    icon: TrendingDown,
    pain: "Not tracking mistakes",
    painDesc: "Without a journal, the same losing patterns repeat — costing you money every single month.",
    solution: "Zynth logs every trade with context, emotion, and outcome — so patterns become impossible to ignore.",
    solutionLabel: "Smart Journal",
    accentColor: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.20)',
  },
  {
    icon: Flame,
    pain: "Emotional trading (FOMO & revenge)",
    painDesc: "68% of trading losses are caused by emotional decisions — revenge trades, FOMO entries, and overtrading.",
    solution: "Zynth's behavioral AI detects and flags emotional trading loops before they drain your account.",
    solutionLabel: "Behavioral AI",
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.20)',
  },
  {
    icon: BarChart2,
    pain: "Ignoring macro conditions",
    painDesc: "Trading gold on the day of a major CPI release without knowing it? That's not a strategy — it's a gamble.",
    solution: "Zynth's Macro Surprise Score tracks 10 high-impact US indicators and flags unfavorable market environments.",
    solutionLabel: "Macro Intelligence",
    accentColor: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.20)',
  },
  {
    icon: AlertTriangle,
    pain: "No idea why you're losing",
    painDesc: "You feel like your strategy should work — but the numbers say otherwise. You don't know what to fix.",
    solution: "Zynth's AI generates a personalized breakdown: what's working, what's not, and exactly what to change.",
    solutionLabel: "AI Trade Reports",
    accentColor: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.20)',
  },
];

export default function WhyTradersFail({ onGetStarted }) {
  const { isDark } = useTheme();

  return (
    <section
      className="py-24 px-6 relative overflow-hidden transition-colors duration-300"
      style={{ background: isDark ? 'transparent' : '#f8fafc' }}
    >
      {/* Ambient glow */}
      {!isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 100% 160% at 50% 50%, rgba(239,68,68,0.04) 0%, rgba(239,68,68,0.01) 62%, transparent 82%)' }}
        />
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section label */}
        <Reveal className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
            style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.22)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-bold tracking-[0.18em] text-red-400">WHY TRADERS FAIL</span>
          </div>
          <h2
            className={`text-[38px] md:text-[48px] font-extrabold tracking-tight mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            The Four Mistakes Costing
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
              You Real Money
            </span>
          </h2>
          <p className={`text-[16px] max-w-xl mx-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Most retail traders lose for the same controllable reasons. Here's what they are — and how Zynth fixes each one.
          </p>
        </Reveal>

        {/* Pain/Solution grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {PAIN_POINTS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.pain} delay={i * 0.10}>
                <div
                  className="rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
                  }}
                >
                  {/* Pain block */}
                  <div className="p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }}>
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: item.accentBg, border: `1px solid ${item.accentBorder}` }}
                      >
                        <Icon size={18} style={{ color: item.accentColor }} />
                      </div>
                      <div>
                        <div
                          className="text-[11px] font-bold tracking-[0.15em] uppercase mb-1"
                          style={{ color: item.accentColor }}
                        >
                          The Problem
                        </div>
                        <h3
                          className={`text-[17px] font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                          {item.pain}
                        </h3>
                        <p
                          className={`text-[13px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'}`}
                        >
                          {item.painDesc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Solution block */}
                  <div
                    className="p-6"
                    style={{ background: isDark ? 'rgba(255,255,255,0.01)' : item.accentBg }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: item.accentBg, border: `1px solid ${item.accentBorder}` }}
                      >
                        <Check size={12} style={{ color: item.accentColor }} />
                      </div>
                      <div>
                        <div
                          className="text-[11px] font-bold tracking-[0.12em] uppercase mb-1"
                          style={{ color: item.accentColor, opacity: 0.8 }}
                        >
                          Zynth Solution · {item.solutionLabel}
                        </div>
                        <p
                          className={`text-[13px] leading-relaxed font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {item.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA row */}
        <Reveal delay={0.42} className="mt-14 text-center">
          <button
            onClick={onGetStarted}
            className="group relative overflow-hidden inline-flex items-center gap-2.5 text-[15px] font-semibold text-white px-9 py-4 rounded-2xl hover:scale-[1.03] transition-all"
            style={{
              background: 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 100%)',
              boxShadow: '0 4px 24px rgba(59,130,246,0.32)',
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Fix My Trading Mistakes Now
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmerBtn 3s linear infinite',
              }}
            />
          </button>
          <p className={`text-[12px] mt-3 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
            Free plan · No credit card required
          </p>
        </Reveal>
      </div>
    </section>
  );
}
