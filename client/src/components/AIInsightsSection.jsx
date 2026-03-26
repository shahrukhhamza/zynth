/**
 * AIInsightsSection
 *
 * Shows 4 realistic AI-generated insight cards to demonstrate the product's
 * analytical depth. Designed to be placed directly below the Hero.
 * Matches the existing dark premium design system.
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, TrendingDown, Clock, TrendingUp, Bot, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { IconContainer } from './ui';

const INSIGHTS = [
  {
    id: 1,
    icon: AlertTriangle,
    variant: 'red',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.18)',
    glow: 'rgba(239,68,68,0.15)',
    badge: 'HIGH RISK',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239,68,68,0.1)',
    headline: 'Position sizing increases after losses',
    detail: 'After 2 consecutive losing trades, your average position size increased by 40%. This pattern was detected on 8 separate occasions this month.',
    stat: '+40% avg size',
    statLabel: 'after drawdown',
  },
  {
    id: 2,
    icon: TrendingDown,
    variant: 'amber',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.18)',
    glow: 'rgba(245,158,11,0.12)',
    badge: 'PATTERN',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245,158,11,0.1)',
    headline: 'Win rate drops in New York session',
    detail: 'Your New York session win rate is 34% vs 71% during London. You are consistently over-trading during high-volatility US open hours.',
    stat: '34% NY vs 71% LN',
    statLabel: 'session win rate',
  },
  {
    id: 3,
    icon: Clock,
    variant: 'purple',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.18)',
    glow: 'rgba(139,92,246,0.12)',
    badge: 'REVIEW',
    badgeColor: '#a78bfa',
    badgeBg: 'rgba(139,92,246,0.1)',
    headline: 'Exiting winning trades too early',
    detail: "Your average reward-to-risk on winners is 1.2R — your targets are set at 2R. You're capturing only 60% of your planned upside on profitable trades.",
    stat: 'Avg 1.2R captured',
    statLabel: 'target was 2.0R',
  },
  {
    id: 4,
    icon: TrendingUp,
    variant: 'green',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.18)',
    glow: 'rgba(16,185,129,0.12)',
    badge: 'STRENGTH',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16,185,129,0.1)',
    headline: 'London session is your edge',
    detail: 'You have a consistent +18% P&L improvement during the London session (07:00–12:00 GMT). This is your optimal trading window — protect it.',
    stat: '+18% P&L',
    statLabel: 'London session',
  },
];

function InsightCard({ insight, index, isDark }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  const Icon = insight.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.015 }}
      className="group relative rounded-2xl border overflow-hidden cursor-default"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${insight.bg} 0%, rgba(255,255,255,0.01) 100%)`
          : `linear-gradient(135deg, ${insight.bg} 0%, rgba(255,255,255,0.6) 100%)`,
        borderColor: insight.border,
        boxShadow: isDark
          ? `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${insight.border}`
          : `0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px ${insight.border}`,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px ${insight.border}, 0 0 40px ${insight.glow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = isDark
          ? `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${insight.border}`
          : `0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px ${insight.border}`;
      }}
    >
      {/* Subtle corner glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-[40px] opacity-60 pointer-events-none transition-opacity group-hover:opacity-100"
        style={{ background: insight.glow }}
      />

      <div className="relative p-5">
        {/* Top row: icon + badge */}
        <div className="flex items-start justify-between mb-3">
          <IconContainer icon={Icon} variant={insight.variant} size="sm" />
          <span
            className="text-[10px] font-bold tracking-[0.12em] px-2.5 py-1 rounded-full"
            style={{ color: insight.badgeColor, background: insight.badgeBg, border: `1px solid ${insight.border}` }}
          >
            {insight.badge}
          </span>
        </div>

        {/* Headline */}
        <p
          className="text-[14px] font-bold leading-snug mb-2"
          style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
        >
          {insight.headline}
        </p>

        {/* Detail text */}
        <p
          className="text-[12px] leading-relaxed mb-4"
          style={{ color: isDark ? '#6b7280' : '#64748b' }}
        >
          {insight.detail}
        </p>

        {/* Stat chip */}
        <div
          className="inline-flex flex-col px-3 py-2 rounded-xl border"
          style={{ background: insight.bg, borderColor: insight.border }}
        >
          <span className="text-[13px] font-black font-mono" style={{ color: insight.color }}>
            {insight.stat}
          </span>
          <span className="text-[10px] font-medium" style={{ color: isDark ? '#9ca3af' : '#64748b' }}>
            {insight.statLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AIInsightsSection({ onGetStarted }) {
  const { isDark } = useTheme();
  const headerRef = useRef(null);
  const inView = useInView(headerRef, { once: true, margin: '-80px 0px' });

  return (
    <section
      className="relative px-6 py-24 overflow-hidden"
      style={{ background: isDark ? '#030303' : '#f0f4f8' }}
    >
      {/* Background decorative blobs */}
      {isDark && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      <div className="relative max-w-7xl mx-auto">

        {/* Section label */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5"
            style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.2)' }}
          >
            <Bot size={13} style={{ color: '#3b82f6' }} />
            <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400 uppercase">AI Analysis</span>
          </div>

          <h2
            className="text-[36px] md:text-[44px] font-extrabold tracking-tight mb-4 leading-tight"
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
          >
            See what Zynth finds{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              in your trades
            </span>
          </h2>

          <p
            className="text-[16px] max-w-[520px] mx-auto leading-relaxed"
            style={{ color: isDark ? '#6b7280' : '#64748b' }}
          >
            Real insights from real data — specific, actionable, and generated automatically from your trade history.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {INSIGHTS.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} isDark={isDark} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <p
            className="text-[13px] mb-4 font-medium"
            style={{ color: isDark ? '#4b5563' : '#9ca3af' }}
          >
            <Sparkles size={13} className="inline-block mr-1 text-amber-400" />
            These insights are generated automatically the moment you start logging trades.
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14px] font-bold text-white transition-all hover:scale-[1.03]"
            style={{
              background: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
              boxShadow: '0 6px 24px rgba(59,130,246,0.35)',
            }}
          >
            Find My Mistakes
            <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
