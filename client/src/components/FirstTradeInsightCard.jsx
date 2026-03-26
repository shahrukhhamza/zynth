/**
 * FirstTradeInsightCard
 *
 * Shown immediately after a user logs their first trade.
 * Uses mock AI data to create an instant "wow moment" and demonstrate
 * the value of Zynth's AI analysis before any real analysis is available.
 *
 * Props:
 *   trade         — object | null  the trade just logged (optional, for context)
 *   onDismiss     — () => void
 *   onUpgrade     — () => void     navigate to upgrade / open UpgradeModal
 *   isDemoMode    — boolean        true = use mock data (default)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, TrendingDown, Clock, Repeat2,
  AlertTriangle, ArrowRight, Zap, ChevronDown, ChevronUp, Lock,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { IconContainer } from './ui';

// ── Mock insights data ────────────────────────────────────────────────────────

const MOCK_INSIGHTS = [
  {
    id: 'revenge',
    severity: 'high',
    icon: Repeat2,
    variant: 'red',
    color: '#ef4444',
    colorBg: 'rgba(239,68,68,0.1)',
    title: 'Possible revenge trading pattern',
    detail: 'This trade was entered within 22 minutes of your last loss — a common trigger for impulsive entries. Traders who enter within 30 min of a loss have a 41% lower win rate.',
    locked: false,
  },
  {
    id: 'session',
    severity: 'medium',
    icon: Clock,
    variant: 'amber',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.1)',
    title: 'Your win rate drops in the New York session',
    detail: 'Based on your trade history, your London session win rate is 68% vs 44% in New York. Consider focusing your active trading hours.',
    locked: true,
  },
  {
    id: 'rr',
    severity: 'medium',
    icon: TrendingDown,
    variant: 'amber',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.1)',
    title: 'Inconsistent risk-to-reward ratio',
    detail: 'Your last 5 trades show R:R ratios ranging from 0.8 to 3.2. A consistent 1.5:1 minimum would significantly improve your expectancy over time.',
    locked: true,
  },
  {
    id: 'fomo',
    severity: 'low',
    icon: AlertTriangle,
    variant: 'blue',
    color: '#3b82f6',
    colorBg: 'rgba(59,130,246,0.1)',
    title: 'Strong setup — but entry timing was late',
    detail: 'The macro environment was favorable when you entered (CPI beat + DXY weakness). The setup was solid, but entering after the first 30-min candle close would have improved your risk profile.',
    locked: true,
  },
];

// ── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const MAP = {
    high:   { label: 'High Priority', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    medium: { label: 'Review',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    low:    { label: 'Positive',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  };
  const s = MAP[severity] ?? MAP.low;
  return (
    <span
      className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Single insight row ────────────────────────────────────────────────────────

function InsightRow({ insight, isOpen, onToggle, onUpgrade, theme }) {
  const Icon = insight.icon;
  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: isOpen
          ? `${insight.color}30`
          : theme.border,
        background: isOpen
          ? (theme.isDark ? 'rgba(255,255,255,0.02)' : insight.colorBg)
          : theme.isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
      }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={insight.locked ? onUpgrade : onToggle}
        style={{ cursor: 'pointer' }}
      >
        <IconContainer icon={Icon} variant={insight.variant} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold leading-snug" style={{ color: theme.text }}>
              {insight.title}
            </span>
            <SeverityBadge severity={insight.severity} />
          </div>
        </div>
        {insight.locked ? (
          <div className="flex items-center gap-1 shrink-0">
            <Lock size={12} style={{ color: theme.muted }} />
            <span className="text-[11px] font-medium" style={{ color: theme.muted }}>Pro</span>
          </div>
        ) : (
          isOpen
            ? <ChevronUp size={15} style={{ color: theme.muted }} className="shrink-0" />
            : <ChevronDown size={15} style={{ color: theme.muted }} className="shrink-0" />
        )}
      </button>

      {/* Detail */}
      <AnimatePresence>
        {isOpen && !insight.locked && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <div
              className="px-4 pb-4 text-[13px] leading-relaxed pt-1 border-t"
              style={{ color: theme.muted, borderColor: theme.border }}
            >
              {insight.detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FirstTradeInsightCard({ trade, onDismiss, onUpgrade }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [openId, setOpenId] = useState('revenge'); // first one open by default
  const [dismissed, setDismissed] = useState(false);

  const isPro = user?.plan === 'pro' || user?.plan === 'elite';

  function handleDismiss() {
    setDismissed(true);
    setTimeout(() => onDismiss?.(), 300);
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border overflow-hidden"
          style={{
            background: theme.isDark ? '#141414' : '#ffffff',
            borderColor: 'rgba(59,130,246,0.25)',
            boxShadow: theme.isDark
              ? '0 0 0 1px rgba(59,130,246,0.1), 0 8px 32px rgba(0,0,0,0.4)'
              : '0 4px 24px rgba(59,130,246,0.12)',
          }}
        >
          {/* Blue top strip */}
          <div
            className="h-[3px]"
            style={{ background: 'linear-gradient(90deg,#1d4ed8,#3b82f6,#06b6d4)' }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(6,182,212,0.1))',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <Sparkles size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p className="text-[13px] font-bold" style={{ color: theme.text }}>
                  AI Trade Analysis
                </p>
                <p className="text-[11px]" style={{ color: theme.muted }}>
                  {MOCK_INSIGHTS.length} insights found · Demo preview
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                color: theme.muted,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
              onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
            >
              <X size={13} />
            </button>
          </div>

          {/* Insights list */}
          <div className="px-5 pb-4 space-y-2">
            {MOCK_INSIGHTS.map(insight => (
              <InsightRow
                key={insight.id}
                insight={insight}
                isOpen={openId === insight.id}
                onToggle={() => setOpenId(openId === insight.id ? null : insight.id)}
                onUpgrade={onUpgrade}
                theme={theme}
              />
            ))}
          </div>

          {/* Upgrade CTA (for free users) */}
          {!isPro && (
            <div
              className="mx-5 mb-5 rounded-xl px-4 py-4 border"
              style={{
                background: theme.isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.04)',
                borderColor: 'rgba(59,130,246,0.15)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: theme.text }}>
                    Unlock all 4 insights
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: theme.muted }}>
                    Pro includes unlimited AI analysis on every trade.
                  </p>
                </div>
                <button
                  onClick={onUpgrade}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shrink-0 transition-all hover:scale-[1.03]"
                  style={{
                    background: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
                    boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                  }}
                >
                  <Zap size={13} />
                  Upgrade
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
