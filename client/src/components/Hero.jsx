import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Bot, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const BENEFITS = [
  'Catch emotional mistakes before they cost you real money',
  'See which setups actually perform across market conditions',
  'Build consistency with AI feedback after every trade',
];

const DASHBOARD_STATS = [
  { label: 'Win Rate', value: '68%', tone: 'positive' },
  { label: 'Net P&L', value: '+$4,820', tone: 'positive' },
  { label: 'Risk Score', value: '82/100', tone: 'accent' },
  { label: 'Avg R:R', value: '1 : 2.3', tone: 'neutral' },
];

const STATS = [
  { label: 'Active Traders', target: 2400, format: (n) => n.toLocaleString() + '+' },
  { label: 'Trades Logged', target: 98, format: (n) => n + 'k+' },
  { label: 'Avg Setup Time', target: null, static: '< 60s' },
];

function useCountUp(target, duration, inView) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!inView || target === null) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, target, duration]);
  return count;
}

function AnimatedStat({ stat, index, isDark }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count = useCountUp(stat.target, 1200 + index * 100, inView);
  const display = stat.static ?? stat.format(count);

  return (
    <motion.div
      ref={ref}
      key={stat.label}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.1, ease: 'easeOut' }}
      className={[
        index > 0 ? 'border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6' : 'sm:pr-6',
      ].join(' ')}
      style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.09)' }}
    >
      <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: isDark ? '#9ca3af' : '#64748b' }}>{stat.label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50">{display}</p>
    </motion.div>
  );
}

const RECENT_TRADES = [
  { pair: 'XAU/USD', side: 'BUY', pnl: '+$420', status: 'win' },
  { pair: 'EUR/USD', side: 'SELL', pnl: '+$190', status: 'win' },
  { pair: 'BTC/USDT', side: 'BUY', pnl: '-$85', status: 'loss' },
];

function FloatingChip({ icon: Icon, text, delay = 0, isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)'}`,
        background: isDark ? 'rgba(24,24,27,0.82)' : 'rgba(255,255,255,0.94)',
        color: isDark ? '#d4d4d8' : '#334155',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Icon size={13} className={isDark ? 'text-amber-300' : 'text-amber-600'} />
      {text}
    </motion.div>
  );
}

function MobileDashboardSnapshot({ isDark }) {
  const toneMap = {
    positive: isDark ? '#34d399' : '#059669',
    accent: isDark ? '#fcd34d' : '#b45309',
    neutral: isDark ? '#e4e4e7' : '#0f172a',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.42 }}
      className="mt-6 rounded-2xl p-4 lg:hidden"
      style={{
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.09)'}`,
        background: isDark
          ? 'linear-gradient(180deg, rgba(20,20,23,0.96), rgba(12,12,15,0.98))'
          : 'rgba(255,255,255,0.95)',
        boxShadow: isDark
          ? '0 8px 28px rgba(0,0,0,0.38)'
          : '0 6px 20px rgba(15,23,42,0.08)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: isDark ? '#f4f4f5' : '#0f172a' }}>Performance Overview</p>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            border: `1px solid ${isDark ? 'rgba(16,185,129,0.35)' : 'rgba(5,150,105,0.25)'}`,
            background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)',
            color: isDark ? '#6ee7b7' : '#047857',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DASHBOARD_STATS.map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3"
            style={{
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}`,
              background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.88)',
            }}
          >
            <p className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? '#9ca3af' : '#64748b' }}>{item.label}</p>
            <p className="mt-1 text-base font-bold tracking-tight" style={{ color: toneMap[item.tone] }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div
        className="mt-2.5 flex items-start gap-2 rounded-lg p-2.5"
        style={{
          border: `1px solid ${isDark ? 'rgba(252,211,77,0.15)' : 'rgba(202,138,4,0.15)'}`,
          background: isDark ? 'rgba(251,191,36,0.05)' : 'rgba(254,249,195,0.35)',
        }}
      >
        <Sparkles size={11} className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
        <p className="text-[11px] leading-snug" style={{ color: isDark ? '#d4d4d8' : '#78350f' }}>
          <span className="font-semibold">AI:</span>{' '}You exit winners 38% too early. Best setups cluster Mon 9–11am.
        </p>
      </div>
    </motion.div>
  );
}

function DashboardPreview({ isDark }) {
  const toneMap = {
    positive: isDark ? '#34d399' : '#059669',
    accent: isDark ? '#fcd34d' : '#b45309',
    neutral: isDark ? '#e4e4e7' : '#0f172a',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.2 }}
      className="relative"
    >
      <div
        className="rounded-3xl p-5"
        style={{
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
          background: isDark
            ? 'linear-gradient(180deg, rgba(20,20,23,0.96), rgba(7,7,10,0.98))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
          boxShadow: isDark
            ? '0 16px 42px rgba(0,0,0,0.4)'
            : '0 12px 32px rgba(15,23,42,0.09)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: isDark ? '#f4f4f5' : '#0f172a' }}>Performance Overview</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em]" style={{ color: isDark ? '#6b7280' : '#94a3b8' }}>Last 30 days</p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.35)' : 'rgba(5,150,105,0.25)'}`,
              background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)',
              color: isDark ? '#6ee7b7' : '#047857',
            }}
          >
            Live
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          {DASHBOARD_STATS.map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-3.5"
              style={{
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}`,
                background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.88)',
              }}
            >
              <p className="text-[11px] uppercase tracking-wider" style={{ color: isDark ? '#9ca3af' : '#64748b' }}>{item.label}</p>
              <p className="mt-1.5 text-lg font-bold tracking-tight" style={{ color: toneMap[item.tone] }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-3.5"
          style={{
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}`,
            background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.88)',
          }}
        >
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: isDark ? '#9ca3af' : '#64748b' }}>Recent Trades</p>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: isDark ? '#6ee7b7' : '#047857' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              2W &middot; 1L
            </span>
          </div>
          <div className="space-y-1.5">
            {RECENT_TRADES.map((trade) => (
              <div
                key={`${trade.pair}-${trade.side}`}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: isDark ? 'rgba(0,0,0,0.26)' : 'rgba(241,245,249,0.85)' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${trade.status === 'win' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <p className="text-xs font-medium" style={{ color: isDark ? '#f4f4f5' : '#0f172a' }}>{trade.pair}</p>
                  <span className="text-[10px]" style={{ color: isDark ? '#9ca3af' : '#64748b' }}>{trade.side}</span>
                </div>
                <p className={`text-xs font-semibold ${trade.status === 'win' ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.pnl}</p>
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-start gap-2 rounded-lg p-2.5"
            style={{
              border: `1px solid ${isDark ? 'rgba(252,211,77,0.15)' : 'rgba(202,138,4,0.15)'}`,
              background: isDark ? 'rgba(251,191,36,0.05)' : 'rgba(254,249,195,0.35)',
            }}
          >
            <Sparkles size={11} className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <p className="text-[11px] leading-snug" style={{ color: isDark ? '#d4d4d8' : '#78350f' }}>
              <span className="font-semibold">AI:</span>{' '}You exit winners 38% too early. Best setups cluster Mon 9–11am.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero({ spotsLeft, onGetStarted, onSignIn }) {
  const { isDark } = useTheme();

  return (
    <section className="relative overflow-hidden px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className={isDark
          ? 'absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(202,138,4,0.09),transparent_45%),radial-gradient(circle_at_80%_12%,rgba(234,179,8,0.05),transparent_45%)]'
          : 'absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(202,138,4,0.06),transparent_43%),radial-gradient(circle_at_82%_10%,rgba(234,179,8,0.04),transparent_40%)]'}
        />

      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{
              border: `1px solid ${isDark ? 'rgba(252,211,77,0.35)' : 'rgba(180,83,9,0.24)'}`,
              background: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.14)',
              color: isDark ? '#fde68a' : '#92400e',
            }}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-amber-300' : 'bg-amber-600'}`} />
            AI-Powered Trading Intelligence
          </span>

          <h1 className="max-w-2xl text-[clamp(2rem,5.6vw,4rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-zinc-950 dark:text-zinc-50">
            You are not losing to the market.
            <span className="mt-2 block text-zinc-900 dark:text-zinc-100">
              You are losing to
              <span className={`ml-2 bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500' : 'bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-500'}`}>
                invisible patterns.
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-[17px]">
            Zynth exposes the mistakes hidden inside your trade history, then gives you AI-backed actions to improve execution, risk control, and consistency.
          </p>

          <ul className="mt-7 space-y-2.5">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-200 sm:text-[15px]">
                <Check size={15} className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={onGetStarted}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3.5 text-sm font-bold tracking-wide text-black shadow-[0_8px_24px_rgba(202,138,4,0.28)] transition-all hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(202,138,4,0.34)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
            >
              Reveal My Trading Edge
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            {onSignIn && (
              <button
                onClick={onSignIn}
                className={`w-full text-center sm:w-auto ${isDark
                  ? 'rounded-full border border-zinc-700/70 bg-zinc-900/70 px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-zinc-50'
                  : 'rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900'}`}
              >
                I Already Have an Account
              </button>
            )}
          </div>

          <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            No credit card required
            {typeof spotsLeft === 'number' ? ` · ${Math.max(0, spotsLeft)} onboarding spots left this week` : ''}
          </p>

          <MobileDashboardSnapshot isDark={isDark} />
        </motion.div>

        <div className="hidden lg:block">
          <div className="mb-3 hidden justify-end gap-2 lg:flex">
            <FloatingChip icon={ShieldAlert} text="Risk Alerts" delay={0.3} isDark={isDark} />
            <FloatingChip icon={Bot} text="AI Analysis" delay={0.45} isDark={isDark} />
          </div>
          <DashboardPreview isDark={isDark} />
        </div>
      </div>

      <div className="relative mx-auto mt-8 max-w-7xl">
        <div
          className="grid gap-4 rounded-2xl p-4 sm:grid-cols-3 sm:gap-0 sm:p-5"
          style={{
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.09)'}`,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
          }}
        >
          {STATS.map((stat, i) => (
            <AnimatedStat key={stat.label} stat={stat} index={i} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  );
}
