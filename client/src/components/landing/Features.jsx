import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { BarChart3, BookOpen, Brain, CalendarDays, Globe2, ListChecks, Calculator, Camera, Newspaper, Fingerprint } from 'lucide-react';
import { Card, CountUp, Curtain, EASE, Item, Section, SectionHeading, Stagger, Reveal } from './motion';

/* ── Data sources ─────────────────────────────────────────────────────── */
const SOURCES = ['FRED', 'U.S. Bureau of Labor Statistics', 'U.S. Bureau of Economic Analysis', 'Finnhub', 'Polygon.io', 'Twelve Data', 'Google Gemini'];

export function DataSources() {
  return (
    <div className="mx-auto mt-20 max-w-4xl text-center">
      <Reveal>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Built on institutional-grade data</p>
      </Reveal>
      <Stagger className="mt-6 flex flex-wrap items-center justify-center gap-3" gap={0.07}>
        {SOURCES.map((src) => (
          <Item key={src} y={16}>
            <span className="inline-block rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CA8A04]/50 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-white">
              {src}
            </span>
          </Item>
        ))}
      </Stagger>
    </div>
  );
}

/* ── Mini visuals ─────────────────────────────────────────────────────── */
function ScoreRing({ value = 82 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const r = 34; const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="7" />
        <motion.circle
          cx="42" cy="42" r={r} fill="none" stroke="#CA8A04" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c * (1 - value / 100) } : {}}
          transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-zinc-950 dark:text-white"><CountUp value={value} /></span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Score</span>
      </div>
    </div>
  );
}

function JournalVisual() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <ScoreRing />
      <div className="min-w-0 flex-1 space-y-2.5">
        {[
          ['Emotional state', 'Calm', 'emerald'],
          ['Entry quality', 'Followed plan', 'emerald'],
          ['Macro backdrop', 'Neutral · no events', 'emerald'],
          ['Risk', 'Stop-loss missing', 'rose'],
        ].map(([k, v, tone], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.25 + i * 0.12 }}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-white/[0.07] dark:bg-white/[0.03]"
          >
            <span className="text-zinc-500">{k}</span>
            <span className={`font-semibold ${tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{v}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MacroGauge() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const angle = 28; // degrees right of centre (mildly bullish)
  return (
    <div ref={ref} className="mx-auto w-full max-w-[220px]">
      <svg viewBox="0 0 200 118" className="w-full">
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth="14" strokeLinecap="round" />
        <motion.g
          initial={{ rotate: -80 }}
          animate={inView ? { rotate: angle } : {}}
          transition={{ type: 'spring', stiffness: 60, damping: 11, delay: 0.3 }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <line x1="100" y1="100" x2="100" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="7" fill="#CA8A04" />
        </motion.g>
      </svg>
      <div className="-mt-1 text-center">
        <div className="text-2xl font-semibold text-zinc-950 dark:text-white"><CountUp value={1.8} decimals={1} prefix="+" /></div>
        <div className="text-xs text-zinc-500">Mildly bullish for gold</div>
      </div>
    </div>
  );
}

function DnaRadar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const vals = [0.85, 0.6, 0.9, 0.55, 0.75, 0.7, 0.8, 0.5];
  const cx = 100; const cy = 100; const R = 70;
  const pt = (i, k) => {
    const a = (Math.PI * 2 * i) / vals.length - Math.PI / 2;
    return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k];
  };
  const poly = (k) => vals.map((v, i) => pt(i, v * k).join(',')).join(' ');
  return (
    <svg ref={ref} viewBox="0 0 200 200" className="mx-auto w-full max-w-[200px]">
      {[0.33, 0.66, 1].map((g) => (
        <polygon key={g} points={vals.map((_, i) => pt(i, g).join(',')).join(' ')} fill="none" stroke="currentColor" strokeOpacity="0.12" />
      ))}
      {vals.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="currentColor" strokeOpacity="0.1" />)}
      <motion.polygon
        points={poly(1)}
        fill="rgba(202,138,4,0.28)"
        stroke="#CA8A04"
        strokeWidth="2"
        initial={{ opacity: 0, scale: reduce ? 1 : 0.2 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
        style={{ transformOrigin: '100px 100px' }}
      />
      {vals.map((v, i) => <circle key={i} cx={pt(i, v)[0]} cy={pt(i, v)[1]} r="3.5" fill="#FBBF24" />)}
    </svg>
  );
}

function CalendarVisual() {
  const rows = [
    ['Non-Farm Payrolls', 'High'], ['CPI (YoY)', 'High'], ['FOMC Rate Decision', 'High'], ['Retail Sales', 'Medium'],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([name, impact], i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: EASE }}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-white/[0.07] dark:bg-white/[0.03]"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${impact === 'High' ? 'bg-rose-500' : 'bg-amber-400'}`} />
          <span className="flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">{name}</span>
          <span className="text-[10px] font-semibold uppercase text-zinc-500">{impact}</span>
        </motion.div>
      ))}
    </div>
  );
}

function SparkVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const items = [
    ['XAU/USD', 'M0,28 C8,22 14,26 22,18 S36,20 44,10 S58,14 66,4', true],
    ['EUR/USD', 'M0,6 C8,10 14,8 22,16 S36,14 44,22 S58,20 66,28', false],
    ['BTC/USD', 'M0,24 C8,26 14,16 22,18 S36,8 44,12 S58,6 66,8', true],
  ];
  return (
    <div ref={ref} className="space-y-2.5">
      {items.map(([sym, d, up], i) => (
        <div key={sym} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.03]">
          <span className="w-16 text-xs font-semibold text-zinc-800 dark:text-zinc-200">{sym}</span>
          <svg viewBox="0 0 66 32" className="h-7 flex-1" preserveAspectRatio="none">
            <motion.path
              d={d} fill="none" stroke={up ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.2, ease: EASE, delay: 0.2 + i * 0.15 }}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ── Bento ────────────────────────────────────────────────────────────── */
function Tile({ icon: Icon, title, desc, children, className = '', delay = 0, from = 'left' }) {
  return (
    <Curtain className={className} delay={delay} from={from}>
      <Card className="flex h-full flex-col p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CA8A04]/10 text-[#A16207] dark:text-[#FBBF24]">
            <Icon size={21} />
          </span>
          <h3 className="font-display text-xl font-bold uppercase tracking-tight text-zinc-950 dark:text-white">{title}</h3>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{desc}</p>
        <div className="mt-auto text-zinc-900 dark:text-white">{children}</div>
      </Card>
    </Curtain>
  );
}

const EXTRAS = [
  [ListChecks, 'Pre-trade checklist'], [Calculator, 'Position & risk calculators'], [Camera, 'Screenshot attachments'],
  [Newspaper, 'Daily macro brief'], [BarChart3, 'Performance analytics'], [Globe2, 'Live market ticker'],
];

export default function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Features"
        title={<>Everything you need to trade with an <span className="text-[#CA8A04]">edge you can prove</span></>}
        subtitle="One workspace that connects what you did, how you felt, and what the market was doing — so every review is based on evidence."
      />
      <div className="grid gap-5 md:grid-cols-3">
        <Tile
          className="md:col-span-2"
          icon={BookOpen}
          title="AI trade journal"
          desc="Log a trade in seconds. Zynth reads your entries, emotions and execution to score your psychology and call out the habits costing you money."
        >
          <JournalVisual />
        </Tile>
        <Tile delay={0.12} icon={Brain} title="Macro intelligence" desc="A live macro surprise score built from CPI, payrolls, rates and more, so you know the backdrop before you click.">
          <MacroGauge />
        </Tile>
        <Tile from="bottom" icon={Fingerprint} title="Trading DNA" desc="Eight behavioural traits distilled into one profile — patience, discipline, risk, emotional control and more.">
          <DnaRadar />
        </Tile>
        <Tile from="bottom" delay={0.12} icon={CalendarDays} title="Economic calendar" desc="High-impact releases at a glance, tied back to the trades you took around them.">
          <CalendarVisual />
        </Tile>
        <Tile from="bottom" delay={0.24} icon={Globe2} title="Markets & charts" desc="Gold, forex, crypto and index charts with live prices, right next to your journal.">
          <SparkVisual />
        </Tile>
      </div>

      <Reveal delay={0.1} className="mt-8">
        <ul className="flex flex-wrap items-center justify-center gap-2.5">
          {EXTRAS.map(([Icon, label]) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:border-[#CA8A04]/50 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:text-white"
            >
              <Icon size={15} className="text-[#CA8A04]" />{label}
            </li>
          ))}
        </ul>
      </Reveal>
      <DataSources />
    </Section>
  );
}
