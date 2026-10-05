/**
 * Chapter 03 — "A day with Zynth". The product is introduced as a day in a trader's life
 * (before the open, in the trade, after the close) instead of a list of features.
 */
import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { BarChart3, Brain, Calculator, CalendarDays, Camera, Check, Crosshair, Fingerprint, Globe2, ListChecks, Newspaper, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { Card, Curtain, EASE, Reveal, Section, SectionHeading } from './motion';
import { CalendarVisual, DnaRadar, MacroGauge, ScoreRing, SparkVisual } from './visuals';

function Panel({ label, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#CA8A04]/45 hover:bg-white hover:shadow-[0_18px_36px_-18px_rgba(202,138,4,0.45)] dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] ${className}`}>
      {label && <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>}
      {children}
    </div>
  );
}

function QuickLogVisual() {
  return (
    <div className="space-y-2.5 text-xs">
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-medium text-zinc-800 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-200">XAUUSD</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#CA8A04] py-2 text-center text-[11px] font-bold text-[#1a1203]">BUY</div>
        <div className="rounded-lg bg-zinc-200/70 py-2 text-center text-[11px] font-bold text-zinc-500 dark:bg-white/[0.06]">SELL</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[['Entry', '2,034.50'], ['P / L', '+45.50']].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">{k}</div>
            <div className="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-white">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisVisual() {
  const flags = [['rose', 'Revenge trade flagged'], ['rose', 'No stop-loss on 3 trades'], ['emerald', 'Followed plan on 5']];
  const tone = { rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-300', emerald: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' };
  return (
    <div className="flex flex-col items-center gap-4">
      <ScoreRing value={76} />
      <div className="w-full space-y-1.5">
        {flags.map(([t, label]) => <div key={label} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${tone[t]}`}>{label}</div>)}
      </div>
    </div>
  );
}

function RiskVisual() {
  const rows = [['Risk per trade', '1.0%'], ['Stop distance', '18 pips'], ['Position size', '0.42 lots']];
  return (
    <div className="space-y-2 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <span className="text-zinc-500">{k}</span>
          <span className="font-mono font-semibold text-zinc-900 dark:text-white">{v}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/12 px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">
        <Check size={14} /> Checklist passed · stop-loss set
      </div>
    </div>
  );
}

const MOMENTS = [
  {
    key: 'open', icon: Sunrise, time: 'Before the open', title: 'Read the room',
    story: 'You open Zynth with your coffee. The macro score leans mildly bullish for gold, but payrolls land at 13:30. You already know what kind of day this is, before you place anything.',
    points: [[Brain, 'AI macro read on gold and the majors'], [CalendarDays, 'Economic calendar for high-impact releases'], [Newspaper, 'A daily macro brief']],
    visuals: (
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel label="Macro score"><MacroGauge /></Panel>
        <Panel label="Today on the calendar"><CalendarVisual /></Panel>
      </div>
    ),
  },
  {
    key: 'trade', icon: Crosshair, time: 'In the trade', title: 'Size it. Log it. Move on.',
    story: 'A setup appears. The risk planner has already sized the position, and the checklist asks the question you would have skipped. Logging it takes ten seconds: pair, direction, entry.',
    points: [[Calculator, 'Position-size and risk calculators'], [ListChecks, 'Pre-trade checklist'], [Camera, 'Screenshots and notes when you want the full picture']],
    visuals: (
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel label="Risk planner"><RiskVisual /></Panel>
        <Panel label="Quick log · under 10 s"><QuickLogVisual /></Panel>
      </div>
    ),
  },
  {
    key: 'close', icon: Sunset, time: 'After the close', title: 'Learn what it meant',
    story: 'That evening Zynth has read every entry. It flags the revenge trade, the missing stop-loss and the way your win rate drops after 2 pm. Your Trading DNA updates, and you know what to change tomorrow.',
    points: [[Sparkles, 'AI trade analysis and weekly coaching'], [BarChart3, 'Performance analytics'], [Fingerprint, 'Your Trading DNA, eight traits in one profile']],
    visuals: (
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel label="AI trade analysis"><AnalysisVisual /></Panel>
        <Panel label="Trading DNA"><DnaRadar /></Panel>
      </div>
    ),
  },
];

const EXTRAS = [[Globe2, 'Live market ticker'], [BarChart3, 'Gold, forex, crypto and index charts'], [Sparkles, 'Light and dark themes']];

export default function Day() {
  const track = useRef(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ['start 70%', 'end 60%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="Chapter 03 · Meet Zynth"
        title={<>One day. Three moments. <span className="text-[#CA8A04]">Zero guesswork.</span></>}
        subtitle="Zynth is not another dashboard to check. It is a companion for the three moments that decide whether a trading day is repeatable."
      />

      <div ref={track} className="relative mx-auto max-w-[1080px]">
        {/* the timeline: a track with a gold line that fills as you read */}
        <div aria-hidden="true" className="absolute bottom-6 left-[43px] top-6 hidden w-[2px] rounded-full bg-zinc-200 dark:bg-white/10 md:block">
          <motion.div className="h-full w-full origin-top rounded-full bg-gradient-to-b from-[#CA8A04] to-[#FBBF24]" style={{ scaleY: fill }} />
        </div>

        <ol className="m-0 flex list-none flex-col gap-8 p-0 md:gap-10">
          {MOMENTS.map((m) => (
            <li key={m.key} className="relative grid gap-5 md:grid-cols-[88px_1fr] md:gap-8">
              <div className="relative hidden md:block">
                <Reveal y={10}>
                  <span className="relative z-10 mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 transition-transform duration-300 hover:scale-110 hover:rotate-6 border-[#fafaf9] bg-gradient-to-b from-[#E0A010] to-[#C98A06] text-[#1a1203] shadow-[0_8px_24px_-8px_rgba(202,138,4,0.8)] dark:border-[#0b0b0f]">
                    <m.icon size={32} />
                  </span>
                </Reveal>
              </div>

              <Curtain from="bottom">
                <Card tilt={false} className="p-6 transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(202,138,4,0.5)] md:p-9">
                  <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#CA8A04]/35 bg-[#CA8A04]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a5a05] dark:text-[#FBBF24]">
                        <m.icon size={13} className="md:hidden" /> {m.time}
                      </span>
                      <h3 className="font-display mt-4 text-[30px] font-bold uppercase leading-[1.02] tracking-tight text-zinc-950 dark:text-white md:text-[38px]">{m.title}</h3>
                      <p className="mt-4 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{m.story}</p>
                      <ul className="m-0 mt-5 flex list-none flex-col gap-2.5 p-0">
                        {m.points.map(([Icon, text]) => (
                          <li key={text} className="group/li flex cursor-default items-center gap-3 text-[14px] font-medium text-zinc-800 transition-transform duration-200 hover:translate-x-1 dark:text-zinc-200">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#CA8A04]/10 text-[#A16207] transition-colors duration-200 group-hover/li:bg-[#CA8A04] group-hover/li:text-[#1a1203] dark:text-[#FBBF24]"><Icon size={15} /></span>
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>{m.visuals}</div>
                  </div>
                </Card>
              </Curtain>
            </li>
          ))}
        </ol>
      </div>

      <Reveal delay={0.1} className="mt-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="m-0 text-[15px] text-zinc-600 dark:text-zinc-400">Plus the details that make it a daily habit:</p>
          <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-2.5 p-0">
            {EXTRAS.map(([Icon, label]) => (
              <li key={label} className="inline-flex cursor-default items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CA8A04]/50 hover:text-zinc-950 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:text-white">
                <Icon size={15} className="text-[#CA8A04]" />{label}
              </li>
            ))}
          </ul>
          <div className="mt-2 w-full max-w-md"><Panel label="Live markets"><SparkVisual /></Panel></div>
        </div>
      </Reveal>
    </Section>
  );
}
