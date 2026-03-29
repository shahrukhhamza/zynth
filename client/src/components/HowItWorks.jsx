import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { BookOpen, Brain, TrendingUp, ArrowRight } from 'lucide-react';
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

const STEPS = [
  {
    number: '01',
    icon: BookOpen,
    title: 'Log your trades',
    desc: 'Log every trade in seconds.',
    accent: 'from-blue-500/20 to-blue-500/5',
    border: 'rgba(59,130,246,0.20)',
    iconColor: 'text-blue-400',
    numberColor: 'text-blue-500/30',
  },
  {
    number: '02',
    icon: Brain,
    title: 'Zynth analyzes your behavior',
    desc: 'It spots the patterns hurting your results.',
    accent: 'from-violet-500/20 to-violet-500/5',
    border: 'rgba(139,92,246,0.20)',
    iconColor: 'text-violet-400',
    numberColor: 'text-violet-500/30',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Fix your mistakes and improve',
    desc: 'Follow clear insights and trade with more consistency.',
    accent: 'from-emerald-500/20 to-emerald-500/5',
    border: 'rgba(16,185,129,0.20)',
    iconColor: 'text-emerald-400',
    numberColor: 'text-emerald-500/30',
  },
];

export default function HowItWorks({ onGetStarted }) {
  const { isDark } = useTheme();

  return (
    <section
      className="py-24 px-6 relative overflow-hidden transition-colors duration-300"
      style={{ background: isDark ? 'transparent' : '#f8fafc' }}
    >
      {/* Subtle background glow */}
      {!isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 100% 160% at 50% 50%, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.01) 62%, transparent 82%)' }}
        />
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section label */}
        <Reveal className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
            style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.22)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400">HOW IT WORKS</span>
          </div>
          <h2
            className={`text-[38px] md:text-[48px] font-extrabold tracking-tight mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            From Trade Log to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">
              Real Improvement
            </span>
          </h2>
          <p className={`text-[16px] max-w-xl mx-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Three simple steps that turn your trading history into a performance edge.
          </p>
        </Reveal>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden md:block absolute top-[52px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-[2px] pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(16,185,129,0.15) 100%)'
                : 'linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.12) 100%)',
            }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={i * 0.13}>
                <div
                  className="relative rounded-2xl p-7 border h-full transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: isDark ? '#0f172a' : '#ffffff',
                    borderColor: step.border,
                    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
                  }}
                >
                  {/* Step number watermark */}
                  <span
                    className={`absolute top-4 right-5 text-[48px] font-black leading-none select-none pointer-events-none ${step.numberColor}`}
                  >
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${step.accent} border`}
                    style={{ borderColor: step.border }}
                  >
                    <Icon size={26} className={step.iconColor} />
                  </div>

                  <h3
                    className={`text-[20px] font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    {step.title}
                  </h3>
                  <p className={`text-[14px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA row */}
        <Reveal delay={0.4} className="flex justify-center mt-12">
          <button
            onClick={() => onGetStarted()}
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Analyze My Trades
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
