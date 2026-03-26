/**
 * TradingScore
 *
 * Compact dashboard widget showing the user's Trading Score (0–100).
 * Score is calculated client-side from journal analytics passed via props,
 * or shown as a demo value for new users with no trades.
 *
 * Props:
 *   analytics   — object | null  { winRate, profitFactor, tradeCount, avgRR, … }
 *   onUpgrade   — () => void     open upgrade modal
 *   className   — string (optional)
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Lock, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// ── Score calculation ─────────────────────────────────────────────────────────

/**
 * Derive a 0-100 score from available analytics.
 *
 * Dimensions (each 0-33):
 *   1. Consistency   — based on tradeCount (more trades = more signal)
 *   2. Win Rate      — 50% = 16 pts, 70% = 33 pts
 *   3. Risk Mgmt     — based on avgRR and profitFactor
 */
function calcScore(analytics) {
  if (!analytics || analytics.tradeCount == null) return null;

  const { winRate = 0, profitFactor = 0, tradeCount = 0, avgRR = 0 } = analytics;

  // Consistency: capped at 33 @ 30+ trades
  const consistency = Math.min(33, Math.round((tradeCount / 30) * 33));

  // Win Rate: 0% = 0, 50% = 16, 70%+ = 33
  const wrNorm = Math.min(1, Math.max(0, (winRate - 30) / 40)); // 30-70% range
  const winScore = Math.round(wrNorm * 33);

  // Risk Management: profitFactor 1.5+ is great; avgRR 1.5+ is great
  const pfScore = Math.min(16, Math.round((Math.min(profitFactor, 2.5) / 2.5) * 16));
  const rrScore = Math.min(17, Math.round((Math.min(avgRR, 2) / 2) * 17));
  const riskScore = pfScore + rrScore;

  return Math.min(100, consistency + winScore + riskScore);
}

// ── Score tier helper ─────────────────────────────────────────────────────────

function getTier(score) {
  if (score === null) return { label: 'No data yet', color: '#4b5563', hint: 'Add trades to generate your score' };
  if (score < 30)  return { label: 'Needs Work',    color: '#ef4444', hint: 'Focus on risk management first' };
  if (score < 50)  return { label: 'Developing',    color: '#f59e0b', hint: 'You\'re building the right habits' };
  if (score < 70)  return { label: 'Improving',     color: '#3b82f6', hint: 'Improve to 75+ to become consistent' };
  if (score < 85)  return { label: 'Consistent',    color: '#10b981', hint: 'Solid. Push for elite-level discipline' };
  return           { label: 'Elite',              color: '#8b5cf6', hint: 'Exceptional consistency and execution' };
}

// ── Arc SVG ───────────────────────────────────────────────────────────────────

function ScoreArc({ score, color }) {
  const radius = 44;
  const circumference = Math.PI * radius; // half-circle
  const progress = score !== null ? (score / 100) * circumference : 0;

  return (
    <svg viewBox="0 0 100 56" className="w-full max-w-[130px]" aria-hidden="true">
      {/* Track */}
      <path
        d="M 8,50 A 44,44 0 0,1 92,50"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d="M 8,50 A 44,44 0 0,1 92,50"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={circumference - progress}
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.2,0.64,1)',
          filter: `drop-shadow(0 0 6px ${color}55)`,
        }}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TradingScore({ analytics, onUpgrade, className = '' }) {
  const theme = useTheme();
  const { user } = useAuth();

  const isPro = user?.plan === 'pro' || user?.plan === 'elite';

  // Demo score for non-pro / no-data users
  const demoScore = 62;
  const rawScore  = useMemo(() => calcScore(analytics), [analytics]);
  const score     = isPro ? rawScore : (rawScore ?? demoScore);
  const tier      = getTier(score);
  const isDemo    = !isPro || rawScore === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{
        background: theme.isDark ? '#141414' : '#ffffff',
        borderColor: theme.border,
        boxShadow: theme.isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-2"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.18)' }}
          >
            <TrendingUp size={14} style={{ color: '#3b82f6' }} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: theme.text }}>
            Trading Score
          </span>
        </div>
        {isDemo && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            DEMO
          </span>
        )}
      </div>

      {/* Score arc + number */}
      <div className="flex flex-col items-center px-5 pt-2 pb-1">
        <div className="relative w-full max-w-[130px]">
          <ScoreArc score={score} color={tier.color} />
          {/* Score number in centre of arc */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-0">
            <span
              className="text-[32px] font-extrabold leading-none"
              style={{ color: tier.color }}
            >
              {score !== null ? score : '–'}
            </span>
            <span className="text-[11px] font-medium mt-0.5" style={{ color: theme.muted }}>
              / 100
            </span>
          </div>
        </div>

        {/* Tier label */}
        <div className="mt-3 text-center">
          <span
            className="text-[13px] font-bold"
            style={{ color: tier.color }}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {/* Improvement hint */}
      <div className="px-5 pb-4 pt-2">
        <p
          className="text-[12px] text-center leading-snug mb-4"
          style={{ color: theme.muted }}
        >
          {tier.hint}
        </p>

        {/* Dimension bars */}
        <div className="space-y-2">
          {[
            { label: 'Consistency',  pct: analytics ? Math.min(100, (analytics.tradeCount / 30) * 100) : 42 },
            { label: 'Win Rate',     pct: analytics ? (analytics.winRate ?? 0)                          : 65 },
            { label: 'Risk Mgmt',    pct: analytics ? Math.min(100, ((analytics.profitFactor ?? 0) / 2.5) * 100) : 58 },
          ].map(({ label, pct }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px]" style={{ color: theme.muted }}>{label}</span>
                <span className="text-[11px] font-semibold" style={{ color: theme.text }}>
                  {Math.round(pct)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  style={{ background: tier.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pro lock CTA */}
        {!isPro && (
          <button
            onClick={onUpgrade}
            className="mt-4 w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border transition-all hover:-translate-y-0.5"
            style={{
              background: theme.isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)',
              borderColor: 'rgba(59,130,246,0.18)',
            }}
          >
            <div className="flex items-center gap-2">
              <Lock size={12} style={{ color: '#3b82f6' }} />
              <span className="text-[12px] font-medium" style={{ color: theme.text }}>
                Get your real score
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#3b82f6' }}>
              Upgrade <ArrowRight size={11} />
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
}
