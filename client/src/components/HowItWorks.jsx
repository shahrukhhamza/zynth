import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { BookOpen, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const STEPS = [
  {
    number: '01',
    icon: BookOpen,
    title: 'Log your activities',
    desc: 'Log every decision and activity in seconds. The more you capture, the sharper your insights become.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI analyzes your patterns',
    desc: 'Our AI identifies behavioral tendencies, recurring cycles, and the hidden patterns influencing your outcomes.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Get actionable insights',
    desc: 'Follow clear, personalized recommendations and build lasting consistency across everything you do.',
  },
];

export default function HowItWorks({ onGetStarted }) {
  const { isDark } = useTheme();

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <p
            className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
          >
            How It Works
          </p>
          <h2
            className="font-bold tracking-tight leading-[1.08] mb-4"
            style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              color: isDark ? '#f4f4f5' : '#18181b',
              letterSpacing: '-0.03em',
            }}
          >
            From log to improvement
          </h2>
          <p
            className="text-[16px] max-w-xl mx-auto leading-relaxed"
            style={{ color: isDark ? '#71717a' : '#52525b' }}
          >
            Three steps that turn your activity data into a performance edge.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-7 border h-full transition-all duration-300 hover:-translate-y-1"
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
                    <Icon size={18} style={{ color: isDark ? '#a1a1aa' : '#52525b' }} />
                  </div>

                  <span
                    className="text-[11px] font-bold tracking-[0.15em] block mb-3"
                    style={{ color: isDark ? '#3f3f46' : '#d4d4d8' }}
                  >
                    {step.number}
                  </span>

                  <h3
                    className="text-[16px] font-semibold mb-2.5"
                    style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-[14px] leading-relaxed"
                    style={{ color: isDark ? '#52525b' : '#71717a' }}
                  >
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.35} className="flex justify-center mt-10">
          <button
            onClick={() => onGetStarted()}
            className="inline-flex items-center gap-2 text-[14px] font-medium transition-colors group"
            style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
            onMouseEnter={e => { e.currentTarget.style.color = isDark ? '#f4f4f5' : '#18181b'; }}
            onMouseLeave={e => { e.currentTarget.style.color = isDark ? '#52525b' : '#a1a1aa'; }}
          >
            Get started free
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
