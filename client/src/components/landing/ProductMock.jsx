/**
 * ProductMock — an illustrative, animated rendering of the Zynth journal dashboard.
 * All numbers are sample data (the hero labels it as such); nothing here is fetched.
 */
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Activity, BookOpen, Brain, CalendarDays, LayoutDashboard, LineChart, Sparkles, TrendingUp } from 'lucide-react';
import { BrandMark } from '../BrandLogo';
import { CountUp, EASE, Typewriter } from './motion';

// Smooth line through the points (Catmull-Rom → cubic Bézier)
function smoothPath(points) {
  if (points.length < 2) return '';
  const p = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = p(i - 1); const [x1, y1] = p(i); const [x2, y2] = p(i + 1); const [x3, y3] = p(i + 2);
    const c1x = x1 + (x2 - x0) / 6; const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6; const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2} ${y2}`;
  }
  return d;
}

const W = 600; const H = 190;
const SERIES = [8, 14, 11, 22, 19, 31, 27, 38, 34, 49, 44, 41, 58, 66, 61, 78, 84, 80, 96];
const POINTS = SERIES.map((v, i) => [Math.round((i / (SERIES.length - 1)) * W), Math.round(H - 14 - (v / 100) * (H - 40))]);
const LINE = smoothPath(POINTS);
const AREA = `${LINE} L ${W} ${H} L 0 ${H} Z`;

function EquityChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const last = POINTS[POINTS.length - 1];
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="zm-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#CA8A04" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="zm-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A16207" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 6" />
      ))}
      <motion.path
        d={AREA}
        fill="url(#zm-area)"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: reduce ? 0 : 0.9 }}
      />
      <motion.path
        d={LINE}
        fill="none"
        stroke="url(#zm-line)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.8, ease: EASE, delay: 0.2 }}
      />
      <motion.g
        initial={{ opacity: 0, scale: 0.4 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: reduce ? 0 : 1.8, type: 'spring', stiffness: 260, damping: 14 }}
        style={{ transformOrigin: `${last[0]}px ${last[1]}px`, transformBox: 'fill-box' }}
      >
        <circle cx={last[0]} cy={last[1]} r="9" fill="#FBBF24" opacity="0.25" />
        <circle cx={last[0]} cy={last[1]} r="4.5" fill="#FBBF24" stroke="#fff" strokeWidth="1.5" />
      </motion.g>
    </svg>
  );
}

const TRADES = [
  { pair: 'XAU/USD', side: 'BUY', pnl: '+$420.50', win: true, tag: 'Disciplined entry' },
  { pair: 'EUR/USD', side: 'SELL', pnl: '-$118.00', win: false, tag: 'Early exit' },
  { pair: 'GBP/JPY', side: 'BUY', pnl: '+$265.20', win: true, tag: 'Followed plan' },
];

function StatCard({ label, children, delay, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={`rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-white/[0.07] dark:bg-white/[0.03] md:p-4 ${className}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white md:text-2xl">{children}</div>
    </motion.div>
  );
}

export default function ProductMock() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#0f0f12] dark:shadow-[0_40px_120px_-30px_rgba(202,138,4,0.28)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate text-[11px] font-medium text-zinc-500">Zynth · Trade Journal</span>
      </div>

      <div className="flex">
        {/* mini sidebar */}
        <div className="hidden w-14 shrink-0 flex-col items-center gap-4 border-r border-zinc-200 bg-zinc-50/60 py-4 dark:border-white/[0.07] dark:bg-white/[0.015] md:flex">
          <BrandMark size={24} />
          {[LayoutDashboard, BookOpen, Brain, CalendarDays, LineChart].map((Icon, i) => (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 1 ? 'bg-[#CA8A04] text-white' : 'text-zinc-400'}`}
            >
              <Icon size={16} />
            </div>
          ))}
        </div>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 md:p-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4">
            <StatCard label="Net P&L" delay={0.05}>
              <span className="text-emerald-600 dark:text-emerald-400"><CountUp value={4812.4} decimals={2} prefix="+$" /></span>
            </StatCard>
            <StatCard label="Win rate" delay={0.15}><CountUp value={68} suffix="%" /></StatCard>
            <StatCard label="Profit factor" delay={0.25} className="hidden sm:block"><CountUp value={2.14} decimals={2} /></StatCard>
          </div>

          <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-5 md:gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-white/[0.07] dark:bg-white/[0.02] md:col-span-3 md:p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Equity curve</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={12} /> +18.4%
                </span>
              </div>
              <div className="h-[130px] text-zinc-900 dark:text-white md:h-[170px]"><EquityChart /></div>
            </div>

            <div className="rounded-xl border border-[#CA8A04]/30 bg-gradient-to-br from-[#CA8A04]/10 to-transparent p-3 md:col-span-2 md:p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#A16207] dark:text-[#EAB308]">
                <Sparkles size={14} /> AI insight
              </div>
              <p className="min-h-[88px] text-[12px] leading-relaxed text-zinc-700 dark:text-zinc-300 md:min-h-[112px] md:text-[13px]">
                <Typewriter
                  speed={18}
                  text="Your win rate climbs to 74% when you wait for the London open. Entries within 2 hours of a loss average -$96 — pause after a stop-out."
                />
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Patience 82', 'Discipline 91'].map((c) => (
                  <span key={c} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">{c}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-white/[0.06] dark:border-white/[0.07] md:mt-4">
            {TRADES.map((t, i) => (
              <motion.div
                key={t.pair}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-3 bg-white px-3 py-2.5 text-xs dark:bg-transparent md:px-4"
              >
                <Activity size={14} className="text-zinc-400" />
                <span className="w-16 font-semibold text-zinc-900 dark:text-white md:w-20">{t.pair}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.side === 'BUY' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}>{t.side}</span>
                <span className="hidden flex-1 truncate text-zinc-500 sm:block">{t.tag}</span>
                <span className="ml-auto" />
                <span className={`font-semibold ${t.win ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{t.pnl}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
