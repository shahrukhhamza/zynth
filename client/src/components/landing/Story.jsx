/**
 * The first two chapters of the landing-page story:
 *   01  The pattern          — the three habits that quietly cost traders money
 *   02  The missing context  — a normal journal vs. a journal that remembers why
 */
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Brain, CalendarClock, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { Card, Curtain, EASE, Item, Reveal, Section, SectionHeading, Stagger } from './motion';

/* ── Chapter 01 ───────────────────────────────────────────────────────── */
const HABITS = [
  {
    n: '01', icon: Flame, tag: 'After two losses',
    title: 'The revenge trade',
    story: 'Two stops in a row. You double your size to win it back before the session ends.',
    says: 'XAUUSD · Sell · −$120',
    really: 'Frustration, not a setup.',
  },
  {
    n: '02', icon: CalendarClock, tag: 'Five minutes before CPI',
    title: 'The blind entry',
    story: 'You buy gold with total conviction. A high-impact release lands, and the candle does the rest.',
    says: 'XAUUSD · Buy · −$85',
    really: 'A major release you never saw coming.',
  },
  {
    n: '03', icon: Sparkles, tag: 'A clean win',
    title: 'The lucky win',
    story: 'It worked. But you cannot say why, so you cannot repeat it, and next week you cannot avoid the opposite.',
    says: 'XAUUSD · Buy · +$140',
    really: 'Right direction. No plan. No stop-loss.',
  },
];

export function ChapterPattern() {
  return (
    <Section id="why">
      <SectionHeading
        eyebrow="Chapter 01 · The pattern"
        title={<>You don&apos;t lose to the market. You lose to <span className="text-[#CA8A04]">the same three habits.</span></>}
        subtitle="Every trader has a story behind their results. Most never read it, because a spreadsheet records what you did and never why."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {HABITS.map((h, i) => (
          <Curtain key={h.n} delay={i * 0.12} from="bottom" className="h-full">
            <Card className="h-full p-7 md:p-8" inner="flex h-full flex-col">
              <div className="flex items-start justify-between">
                <span className="font-display text-[56px] font-bold leading-none text-transparent [-webkit-text-stroke:1.5px_#CA8A04]">{h.n}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CA8A04]/10 text-[#A16207] dark:text-[#FBBF24]"><h.icon size={21} /></span>
              </div>
              <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{h.tag}</div>
              <h3 className="font-display mt-2 text-[26px] font-bold uppercase leading-tight tracking-tight text-zinc-950 dark:text-white">{h.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{h.story}</p>

              <div className="mt-auto pt-7">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Your journal says</div>
                  <div className="mt-1 font-mono text-[13px] text-zinc-700 dark:text-zinc-300">{h.says}</div>
                </div>
                <div className="mt-2 rounded-xl border border-[#CA8A04]/30 bg-[#CA8A04]/[0.07] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A16207] dark:text-[#FBBF24]">What was really happening</div>
                  <div className="mt-1 text-[14px] font-semibold text-zinc-900 dark:text-white">{h.really}</div>
                </div>
              </div>
            </Card>
          </Curtain>
        ))}
      </div>
    </Section>
  );
}

/* ── Chapter 02 ───────────────────────────────────────────────────────── */
const CELLS = [['Pair', 'XAUUSD'], ['Side', 'Buy'], ['Entry', '2,034.50'], ['P/L', '−$85.00']];

const CONTEXT = [
  { icon: Flame, tone: 'amber', label: 'Mood', value: 'Frustrated · 2nd loss in a row' },
  { icon: CalendarClock, tone: 'rose', label: 'Macro', value: 'CPI released 14 min later · High impact' },
  { icon: Brain, tone: 'violet', label: 'AI flagged', value: 'Revenge-trade pattern' },
  { icon: ShieldAlert, tone: 'rose', label: 'Risk', value: 'No stop-loss set' },
  { icon: TrendingUp, tone: 'emerald', label: 'Macro score', value: '+1.8 · mildly bullish for gold' },
];

const TONES = {
  amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  violet: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  emerald: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
};

function TradeRow({ dim = false }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CELLS.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">{k}</div>
          <div className={`mt-0.5 font-mono text-[12.5px] font-semibold ${dim ? 'text-zinc-700 dark:text-zinc-300' : k === 'P/L' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function ChapterContext() {
  return (
    <Section id="context" className="bg-zinc-50/70 dark:bg-white/[0.015]">
      <SectionHeading
        eyebrow="Chapter 02 · The missing piece"
        title={<>Your journal records the trade. <span className="text-[#CA8A04]">Zynth records the context.</span></>}
        subtitle="Same trade, two very different notebooks. One tells you that you lost. The other tells you why, and what to change."
      />

      <div className="mx-auto grid max-w-5xl items-stretch gap-6 lg:grid-cols-2">
        <Reveal>
          <Card hover={false} tilt={false} className="h-full p-6 md:p-8" inner="flex h-full flex-col">
            <div className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              <BookOpen size={15} /> A normal journal
            </div>
            <div className="mt-6"><TradeRow dim /></div>
            <p className="mt-6 text-[15px] leading-relaxed text-zinc-500">
              Four numbers and nothing else. A month later you cannot tell a bad trade from bad luck, so every review ends with &ldquo;be more disciplined.&rdquo;
            </p>
            <div className="mt-auto flex items-center gap-2 pt-6 text-[13px] font-medium text-zinc-400">
              <AlertTriangle size={15} /> No reason. No market context. No lesson.
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card hover={false} tilt={false} className="relative h-full border-[#CA8A04]/40 p-6 md:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(202,138,4,0.18),transparent_65%)]" />
            <div className="relative">
              <div className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#A16207] dark:text-[#FBBF24]">
                <Sparkles size={15} /> The same trade, in Zynth
              </div>
              <div className="mt-6"><TradeRow /></div>
              <Stagger className="mt-3 flex flex-col gap-2" gap={0.14} delay={0.2}>
                {CONTEXT.map((c) => (
                  <Item key={c.label} y={10}>
                    <div className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${TONES[c.tone]}`}>
                      <c.icon size={16} className="shrink-0" />
                      <span className="w-[74px] shrink-0 text-[10.5px] font-bold uppercase tracking-wider opacity-80">{c.label}</span>
                      <span className="text-[13px] font-semibold">{c.value}</span>
                    </div>
                  </Item>
                ))}
              </Stagger>
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE, delay: 1.1 }}
                className="mt-5 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400"
              >
                Now the lesson is obvious: it wasn&apos;t the setup. It was the mood and the calendar.
              </motion.p>
            </div>
          </Card>
        </Reveal>
      </div>
      <p className="mt-8 text-center text-xs text-zinc-500">Illustrative sample data.</p>
    </Section>
  );
}
