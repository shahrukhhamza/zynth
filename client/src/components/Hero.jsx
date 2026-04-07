import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Bot, Globe, TrendingUp, BarChart2, Wallet } from 'lucide-react';
import { motion, animate, useMotionValue, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
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

// ─── Floating Badge ──────────────────────────────────────────────────────────
function FloatingBadge({ label, icon, top, left, right, bottom, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-full select-none"
      style={{
        top, left, right, bottom,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        color: '#a1a1aa',
        fontSize: 13,
        fontWeight: 500,
        zIndex: 5,
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-2"
      >
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        {label}
      </motion.div>
    </motion.div>
  );
}

// ─── Markets Card (left) ─────────────────────────────────────────────────────
function MarketsCard() {
  const assets = [
    { symbol: 'EUR/USD', price: '1.0847', change: '+0.24%', color: '#22c55e', icon: '💱' },
    { symbol: 'GBP/USD', price: '1.2695', change: '-0.08%', color: '#ef4444', icon: '📊' },
    { symbol: 'SPX500', price: '5,234.18', change: '+1.2%', color: '#22c55e', icon: '📈' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -40, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.35, ease: 'easeOut' } }}
      className="rounded-2xl overflow-hidden group/card"
      style={{
        background: 'rgba(17,17,21,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        width: 220,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,100,0,0.25)'; e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.6), 0 0 30px rgba(202,138,4,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'; }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>Markets</span>
        <span style={{ fontSize: 11, color: '#FF5500', fontWeight: 600, cursor: 'pointer' }}>See All</span>
      </div>
      {assets.map((a, i) => (
        <div
          key={a.symbol}
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
        >
          <span style={{ fontSize: 16 }}>{a.icon}</span>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>{a.symbol}</div>
            <div style={{ fontSize: 10, color: '#52525b' }}>Market</div>
          </div>
          <div className="text-right">
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5' }}>{a.price}</div>
            <div style={{ fontSize: 10, color: a.color, fontWeight: 500 }}>{a.change}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Balance Card (center) ───────────────────────────────────────────────────
function BalanceCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.35, ease: 'easeOut' } }}
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(17,17,21,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        width: 280,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,100,0,0.3)'; e.currentTarget.style.boxShadow = '0 35px 90px rgba(0,0,0,0.7), 0 0 40px rgba(202,138,4,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)'; }}
    >
      {/* Top nav */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span style={{ color: '#52525b', fontSize: 16 }}>☰</span>
        <div className="flex items-center gap-3">
          <span style={{ color: '#52525b', fontSize: 14 }}>🏠</span>
          <span style={{ color: '#52525b', fontSize: 14 }}>🔍</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 pb-3">
        {['Home', 'Leverage', 'Earn', 'NFT'].map((tab, i) => (
          <span
            key={tab}
            className="px-3 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: i === 0 ? 'rgba(255,85,0,0.15)' : 'transparent',
              color: i === 0 ? '#FBBF24' : '#52525b',
              border: i === 0 ? '1px solid rgba(255,85,0,0.25)' : '1px solid transparent',
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Balance */}
      <div className="px-5 pb-4">
        <div style={{ fontSize: 28, fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.03em' }}>
          $15,4<span style={{ color: '#71717a' }}>,75</span> <span style={{ fontSize: 12, color: '#52525b', fontWeight: 500 }}>USD</span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: '#52525b' }}>Total Balance</div>
      </div>

      {/* Mini chart */}
      <div className="px-5 pb-3">
        <svg viewBox="0 0 240 50" className="w-full" style={{ height: 50 }}>
          <path
            d="M0,40 C20,35 40,42 60,30 C80,18 100,25 120,20 C140,15 160,22 180,12 C200,8 220,18 240,15"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />
          <motion.path
            d="M0,40 C20,35 40,42 60,30 C80,18 100,25 120,20 C140,15 160,22 180,12 C200,8 220,18 240,15"
            fill="none"
            stroke="url(#chartGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f4f4f5" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="240" cy="15" r="3"
            fill="#f4f4f5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.8, duration: 0.4 }}
          />
        </svg>
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between px-5 pb-4">
        <span style={{ fontSize: 11, color: '#52525b' }}>~$432.49</span>
        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>[+12%]</span>
      </div>
    </motion.div>
  );
}

// ─── Exchange Card (right) ───────────────────────────────────────────────────
function ExchangeCard() {
  const pairs = [
    { symbol: 'NAS100', arrow: '↗', price: '18,245.60', high: '18,410', color: '#22c55e' },
    { symbol: 'XAUUSD', arrow: '↘', price: '2,347.85', high: '2,431', color: '#ef4444' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.35, ease: 'easeOut' } }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(17,17,21,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        width: 230,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,100,0,0.25)'; e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.6), 0 0 30px rgba(202,138,4,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'; }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>Trade Exchange</span>
        <span style={{ color: '#52525b', fontSize: 14 }}>⋮</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {['USD/ETH', 'Forex', '24 hrs'].map((tab, i) => (
          <span
            key={tab}
            className="px-2.5 py-1 rounded text-[10px] font-medium"
            style={{
              background: i === 0 ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: i === 0 ? '#f4f4f5' : '#52525b',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {pairs.map((p, i) => (
        <div
          key={p.symbol}
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <span style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.arrow}</span>
          <div className="flex-1">
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>{p.symbol} →</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f4f4f5' }}>{p.price}</div>
          </div>
          <div className="text-right">
            <div style={{ fontSize: 10, color: '#52525b' }}>Peak</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa' }}>{p.high}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero({ spotsLeft, onGetStarted, onSignIn }) {
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const parallaxOrbY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const smoothParallaxY = useSpring(parallaxY, { stiffness: 100, damping: 30 });
  const smoothOrbY = useSpring(parallaxOrbY, { stiffness: 80, damping: 25 });

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ padding: '80px 24px 60px' }}>

      {/* ── Premium CSS Animations ── */}
      <style>{`
        @keyframes hero-shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { box-shadow: 0 4px 28px rgba(202,138,4,0.4), 0 0 0 0 rgba(255,100,0,0.3); }
          50% { box-shadow: 0 8px 40px rgba(202,138,4,0.55), 0 0 0 8px rgba(255,100,0,0); }
        }
        @keyframes hero-orb-breathe {
          0%, 100% { opacity: 0.14; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.2; transform: translateX(-50%) scale(1.05); }
        }
        @keyframes hero-grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        @keyframes hero-float-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* ── Layer 1: Base radial gradients ── */}
      {isDark && (
        <motion.div className="absolute inset-0 pointer-events-none" style={{
          y: smoothParallaxY,
          background:
            'radial-gradient(circle at 50% 15%, rgba(255,80,0,0.18) 0%, transparent 45%),' +
            'radial-gradient(circle at 50% 10%, rgba(255,60,0,0.12) 0%, transparent 55%),' +
            'radial-gradient(circle at 80% 20%, rgba(255,110,0,0.06) 0%, transparent 40%),' +
            'radial-gradient(circle at 20% 25%, rgba(180,50,0,0.05) 0%, transparent 38%)',
        }} />
      )}

      {/* ── Layer 2: Large centered orange orb (breathing + parallax) ── */}
      {isDark && (
        <>
          <motion.div className="absolute pointer-events-none" style={{
            top: '-25%', left: '50%', transform: 'translateX(-50%)',
            width: '80vw', height: '80vh', maxWidth: 900,
            background: 'radial-gradient(circle, rgba(255,70,0,0.14) 0%, rgba(255,50,0,0.08) 30%, rgba(200,40,0,0.03) 55%, transparent 70%)',
            filter: 'blur(40px)',
            y: smoothOrbY,
            scale: parallaxScale,
            animation: 'hero-orb-breathe 6s ease-in-out infinite',
          }} />
          <motion.div className="absolute pointer-events-none" style={{
            top: '-30%', left: '50%', transform: 'translateX(-50%)',
            width: '100vw', height: '90vh', maxWidth: 1200,
            background: 'radial-gradient(circle, transparent 35%, rgba(255,60,0,0.04) 45%, transparent 60%)',
            filter: 'blur(30px)',
            y: smoothOrbY,
          }} />
        </>
      )}

      {/* ── Layer 3: Fine grid texture (subtle scroll) ── */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{
        y: useTransform(scrollYProgress, [0, 1], [0, 60]),
        backgroundImage: isDark
          ? 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: isDark
          ? 'radial-gradient(ellipse 70% 70% at 50% 10%, rgba(0,0,0,0.5) 0%, transparent 70%)'
          : undefined,
        WebkitMaskImage: isDark
          ? 'radial-gradient(ellipse 70% 70% at 50% 10%, rgba(0,0,0,0.5) 0%, transparent 70%)'
          : undefined,
      }} />
      {isDark && (
        <div className="absolute inset-0 pointer-events-none" style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }} />
      )}

      {/* ── Layer 5: Vignette ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDark
          ? 'radial-gradient(ellipse 90% 90% at 50% 10%, transparent 30%, rgba(11,11,15,0.7) 70%, rgba(11,11,15,0.97) 100%)'
          : 'radial-gradient(ellipse 90% 55% at 50% -10%, transparent 45%, #f8fafc 85%)',
      }} />

      {/* ── Floating Badges ── */}
      {isDark && (
        <>
          <FloatingBadge label="Smart Journal" icon="📊" top="18%" left="8%" delay={0.4} />
          <FloatingBadge label="AI Analysis" icon="🔗" top="42%" left="5%" delay={0.55} />
          <FloatingBadge label="Risk Alerts" icon="⚡" top="15%" right="10%" delay={0.5} />
          <FloatingBadge label="Trade Score" icon="💎" top="38%" right="6%" delay={0.6} />
        </>
      )}

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >

        {/* ── Centered Hero Text ── */}
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge above headline */}
          <motion.div {...fadeUp(0.02)} className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold"
              style={{
                background: isDark ? 'rgba(202,138,4,0.08)' : 'rgba(202,138,4,0.06)',
                border: `1px solid ${isDark ? 'rgba(202,138,4,0.2)' : 'rgba(202,138,4,0.15)'}`,
                color: isDark ? '#FBBF24' : '#854D0E',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              AI-Powered Trading Analytics Platform
            </span>
          </motion.div>

          <motion.div {...fadeUp(0.07)}>
            <h1 style={{
              fontSize: 'clamp(38px, 6vw, 72px)',
              fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.04em',
              color: isDark ? '#f4f4f5' : '#09090b',
              marginBottom: 0,
            }}>
              Trade Smarter with
            </h1>
            <h1 style={{
              fontSize: 'clamp(38px, 6vw, 72px)',
              fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.04em',
              marginBottom: 24,
              backgroundImage: isDark
                ? 'linear-gradient(90deg, #CA8A04 0%, #FBBF24 25%, #FFB366 50%, #FBBF24 75%, #CA8A04 100%)'
                : 'linear-gradient(135deg, #CA8A04 0%, #FBBF24 100%)',
              backgroundSize: isDark ? '200% auto' : '100% auto',
              animation: isDark ? 'hero-shimmer 4s ease-in-out infinite' : 'none',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              AI-Powered Insights
            </h1>
          </motion.div>

          <motion.p {...fadeUp(0.14)} style={{
            fontSize: 17, lineHeight: 1.68,
            color: isDark ? '#71717a' : '#52525b',
            maxWidth: 520, margin: '0 auto 36px',
          }}>
            Track performance, analyze strategies, and improve every trade with Zynth — your AI-powered trading companion.
          </motion.p>

          {/* CTA */}
          <motion.div {...fadeUp(0.2)} className="flex items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onGetStarted()}
              className="group inline-flex items-center gap-2.5"
              style={{
                padding: '16px 32px', borderRadius: 50,
                background: 'linear-gradient(135deg, #CA8A04 0%, #FBBF24 100%)',
                color: '#ffffff',
                fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                animation: isDark ? 'hero-glow-pulse 2.5s ease-in-out infinite' : 'none',
                boxShadow: '0 4px 28px rgba(202,138,4,0.4), 0 0 0 1px rgba(255,120,0,0.15)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
              }}
            >
              Get Started
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:tranzinc-x-0.5" />
            </button>
          </motion.div>
        </div>

        {/* ── Three Preview Cards Row ── */}
        {isDark && (
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-center gap-5 flex-wrap lg:flex-nowrap px-4"
          >
            <div className="hidden md:block" style={{ marginTop: 40, animation: 'hero-float-gentle 5s ease-in-out infinite' }}>
              <MarketsCard />
            </div>
            <div style={{ marginTop: 0, animation: 'hero-float-gentle 6s ease-in-out infinite 0.5s' }}>
              <BalanceCard />
            </div>
            <div className="hidden md:block" style={{ marginTop: 40, animation: 'hero-float-gentle 5.5s ease-in-out infinite 1s' }}>
              <ExchangeCard />
            </div>
          </motion.div>
        )}

        {/* Light mode fallback */}
        {!isDark && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto mt-4"
          >
            <div className="rounded-2xl p-6 border text-center" style={{
              background: '#ffffff',
              borderColor: 'rgba(0,0,0,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            }}>
              <div className="flex justify-center gap-8 mb-4">
                {[
                  { label: 'Win Rate', value: '67%' },
                  { label: 'Net P&L', value: '+$2,847' },
                  { label: 'Score', value: '81/100' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#09090b' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#a1a1aa' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Trust Bar ── */}
        {isDark && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mt-20"
          >
            <p className="text-[13px] mb-6" style={{ color: '#52525b' }}>
              Simplifying Trading Workflows For <strong style={{ color: '#a1a1aa' }}>2,500+ Organizations</strong>
            </p>
            <div className="flex items-center justify-center gap-10 flex-wrap opacity-30">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ fontSize: 14, color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.05em' }}>
                  ✦ Logoipsum
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Stats Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 overflow-hidden"
          style={{
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
            borderRadius: 20,
            background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
            backdropFilter: isDark ? 'blur(16px)' : 'none',
            transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          }}
          onMouseEnter={e => { if (isDark) { e.currentTarget.style.borderColor = 'rgba(255,100,0,0.15)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(202,138,4,0.06)'; } }}
          onMouseLeave={e => { if (isDark) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          {[
            { to: 2400,  suffix: '+',    label: 'Active traders' },
            { to: 98000, suffix: '+',    label: 'Trades logged' },
            { to: 81,    suffix: '/100', label: 'Avg. consistency score' },
            { to: 60,    suffix: 's',    label: 'Avg. setup time' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '24px 28px',
              borderRight: i < 3 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` : 'none',
            }}>
              <div style={{
                fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em',
                backgroundImage: isDark ? 'linear-gradient(135deg, #EAB308, #FBBF24)' : undefined,
                WebkitBackgroundClip: isDark ? 'text' : undefined,
                WebkitTextFillColor: isDark ? 'transparent' : undefined,
                color: isDark ? undefined : '#09090b', lineHeight: 1, marginBottom: 7,
              }}>
                <Counter to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#52525b' : '#a1a1aa' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
