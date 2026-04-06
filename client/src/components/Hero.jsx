import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Bot, Globe } from 'lucide-react';
import { motion, animate, useMotionValue, useInView } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ from = 0, to, duration = 2, suffix = '', prefix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(from);
  const [display, setDisplay] = useState(from.toString());

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString()),
    });
    return controls.stop;
  }, [inView, to, duration, count]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ─── Product Preview ─────────────────────────────────────────────────────────
function ProductPreview({ isDark }) {
  const [visibleInsights, setVisibleInsights] = useState(1);
  const allInsights = [
    { type: 'warn',    msg: 'Revenge trade pattern — 3× avg size',  val: '−$420' },
    { type: 'success', msg: 'Peak window confirmed: 9:30–10:15am',  val: '+67% WR' },
    { type: 'warn',    msg: 'Overtrading after loss detected',       val: '+38% freq' },
  ];

  useEffect(() => {
    if (visibleInsights >= allInsights.length) return;
    const t = setTimeout(() => setVisibleInsights(v => v + 1), 1600);
    return () => clearTimeout(t);
  }, [visibleInsights, allInsights.length]);

  const BARS = [42, 65, 38, 78, 55, 90, 71];

  return (
    <div
      className="rounded-2xl overflow-hidden select-none"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: isDark
          ? '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 28px 60px -16px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* Browser chrome */}
      <div style={{
        background: '#111113',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 5.5 }}>
          {['#ff5f57', '#ffbd2e', '#28ca41'].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6, padding: '3px 10px',
          color: 'rgba(148,163,184,0.35)', fontSize: 10, fontFamily: 'monospace',
        }}>
          <Globe size={8} />
          app.zynth.codes
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[
          { label: 'WIN RATE', value: '67%',     delta: '+4% wk' },
          { label: 'NET P&L',  value: '+$2,847', delta: 'this mo.' },
          { label: 'SCORE',    value: '81/100',  delta: '+14 pts' },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '14px 16px',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.3)', letterSpacing: '0.1em', fontFamily: 'monospace', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f4f4f5', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#22c55e', marginTop: 3, fontFamily: 'monospace' }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', fontFamily: 'monospace', letterSpacing: '0.09em' }}>7D PERFORMANCE</span>
          <span style={{ fontSize: 10, color: '#22c55e', fontFamily: 'monospace', fontWeight: 600 }}>+12.4%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
          {BARS.map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: 2,
              background: i === 5 ? '#2563eb' : 'rgba(255,255,255,0.07)',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: 5 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'rgba(148,163,184,0.2)', fontFamily: 'monospace' }}>{d}</span>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Bot size={10} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>AI BEHAVIORAL INSIGHTS</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.7)' }} />
            <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'monospace' }}>LIVE</span>
          </div>
        </div>
        {allInsights.slice(0, visibleInsights).map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6, marginBottom: i < allInsights.length - 1 ? 5 : 0,
              background: ins.type === 'success' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${ins.type === 'success' ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)'}`,
            }}
          >
            <span style={{ color: ins.type === 'success' ? '#22c55e' : '#f87171', fontSize: 10, flexShrink: 0, fontFamily: 'monospace' }}>
              {ins.type === 'success' ? '✓' : '!'}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.55)', flex: 1, fontFamily: 'monospace' }}>{ins.msg}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: ins.type === 'success' ? '#22c55e' : '#f87171', fontFamily: 'monospace', flexShrink: 0 }}>{ins.val}</span>
          </motion.div>
        ))}
        {visibleInsights < allInsights.length && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
            <span style={{ color: 'rgba(148,163,184,0.25)', fontFamily: 'monospace', fontSize: 10 }}>$</span>
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{ width: 7, height: 13, background: 'rgba(59,130,246,0.45)', borderRadius: 1 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero({ spotsLeft, onGetStarted, onSignIn }) {
  const { isDark } = useTheme();

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  });

  const AVATARS = [
    { initial: 'D', bg: '#1d4ed8' }, { initial: 'P', bg: '#6d28d9' },
    { initial: 'J', bg: '#0f766e' }, { initial: 'T', bg: '#b45309' },
    { initial: 'L', bg: '#be185d' },
  ];

  return (
    <section className="relative overflow-hidden" style={{ padding: '108px 24px 120px' }}>

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: isDark
          ? 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.028) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />
      {/* Vignette over grid edges */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDark
          ? 'radial-gradient(ellipse 90% 55% at 50% -10%, transparent 45%, #09090b 85%)'
          : 'radial-gradient(ellipse 90% 55% at 50% -10%, transparent 45%, #f8fafc 85%)',
      }} />
      {/* Single focused glow */}
      <div className="absolute pointer-events-none" style={{
        top: '-5%', left: '20%', width: '65vw', height: '55vh',
        background: isDark
          ? 'radial-gradient(ellipse, rgba(37,99,235,0.055) 0%, transparent 65%)'
          : 'radial-gradient(ellipse, rgba(37,99,235,0.065) 0%, transparent 65%)',
        filter: 'blur(60px)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* ── Left ── */}
          <div>
            {/* Status pill */}
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full mb-8"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'}`,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22c55e', display: 'inline-block', flexShrink: 0,
                boxShadow: '0 0 6px rgba(34,197,94,0.7)',
              }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: isDark ? '#71717a' : '#52525b' }}>
                AI-Powered Trading Analytics
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div {...fadeUp(0.07)}>
              <h1 style={{
                fontSize: 'clamp(40px, 5.5vw, 66px)',
                fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.04em',
                color: isDark ? '#f4f4f5' : '#09090b', marginBottom: 0,
              }}>
                The AI trading
              </h1>
              <h1 style={{
                fontSize: 'clamp(40px, 5.5vw, 66px)',
                fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.04em',
                marginBottom: 28,
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #f4f4f5 0%, #52525b 100%)'
                  : 'linear-gradient(135deg, #09090b 0%, #71717a 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                journal that thinks.
              </h1>
            </motion.div>

            {/* Subtext */}
            <motion.p {...fadeUp(0.14)} style={{
              fontSize: 17, lineHeight: 1.68,
              color: isDark ? '#71717a' : '#52525b',
              maxWidth: 440, marginBottom: 38,
            }}>
              Log your trades, get AI behavioral analysis, and understand exactly what patterns are costing you — then systematically fix them.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.2)} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 38 }}>
              <button
                onClick={() => onGetStarted()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px', borderRadius: 11,
                  background: isDark ? '#f4f4f5' : '#09090b',
                  color: isDark ? '#09090b' : '#f4f4f5',
                  fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                  boxShadow: isDark ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 18px rgba(0,0,0,0.22)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 8px 28px rgba(255,255,255,0.15)' : '0 8px 26px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 18px rgba(0,0,0,0.22)';
                }}
              >
                Start for free
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '12px 20px', borderRadius: 11, background: 'transparent',
                  color: isDark ? '#a1a1aa' : '#71717a', fontSize: 14, fontWeight: 500,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)'}`,
                  cursor: 'pointer', transition: 'color 0.18s, border-color 0.18s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = isDark ? '#f4f4f5' : '#09090b';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = isDark ? '#a1a1aa' : '#71717a';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)';
                }}
              >
                See how it works
              </button>
            </motion.div>

            {/* Social proof row */}
            <motion.div {...fadeUp(0.27)} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {AVATARS.map((a, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: a.bg,
                    border: `2px solid ${isDark ? '#09090b' : '#ffffff'}`,
                    marginLeft: i > 0 ? -8 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    zIndex: AVATARS.length - i, position: 'relative',
                  }}>
                    {a.initial}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12.5, color: isDark ? '#52525b' : '#a1a1aa' }}>
                Joined by <strong style={{ color: isDark ? '#a1a1aa' : '#52525b', fontWeight: 600 }}>2,400+ traders</strong>
              </span>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>·</span>
              <span style={{ fontSize: 12.5, color: '#f59e0b' }}>★★★★★</span>
              <span style={{ fontSize: 12.5, color: isDark ? '#52525b' : '#a1a1aa' }}>4.9 avg rating</span>
            </motion.div>
          </div>

          {/* ── Right – Product Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductPreview isDark={isDark} />
          </motion.div>
        </div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            marginTop: 80,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            borderRadius: 16, overflow: 'hidden',
          }}
        >
          {[
            { to: 2400,  suffix: '+',    label: 'Active traders' },
            { to: 98000, suffix: '+',    label: 'Trades logged' },
            { to: 81,    suffix: '/100', label: 'Avg. consistency score' },
            { to: 60,    suffix: 's',    label: 'Avg. setup time' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '24px 28px',
              background: isDark ? '#111113' : '#fafafa',
              borderRight: i < 3 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none',
            }}>
              <div style={{
                fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em',
                color: isDark ? '#f4f4f5' : '#09090b', lineHeight: 1, marginBottom: 7,
              }}>
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#52525b' : '#a1a1aa' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
