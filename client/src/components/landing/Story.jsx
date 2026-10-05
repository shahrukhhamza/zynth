/**
 * The first two chapters of the landing-page story:
 *   01  The pattern          — the three habits that quietly cost traders money
 *   02  The missing context  — a normal journal vs. a journal that remembers why
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Brain, CalendarClock, ChevronDown, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { Card, Curtain, EASE, Item, Reveal, Section, SectionHeading, Stagger } from './motion';

/* ── Chapter 01 ───────────────────────────────────────────────────────── */
const HABITS = [
  {
    n: '01', icon: Flame, tag: 'After two losses',
    title: 'The revenge trade',
    story: 'Two stops in a row. You double your size to win it back before the session ends.',
    says: 'XAUUSD · Sell · −$120',
    really: 'Frustration, not a setup.',
    catches: 'Zynth reads the sequence of your trades. Oversized entries right after a loss are flagged as a revenge-trade pattern, with the cost shown.',
  },
  {
    n: '02', icon: CalendarClock, tag: 'Five minutes before CPI',
    title: 'The blind entry',
    story: 'You buy gold with total conviction. A high-impact release lands, and the candle does the rest.',
    says: 'XAUUSD · Buy · −$85',
    really: 'A major release you never saw coming.',
    catches: 'Every trade is matched with the economic calendar, so you see which release was minutes away when you clicked.',
  },
  {
    n: '03', icon: Sparkles, tag: 'A clean win',
    title: 'The lucky win',
    story: 'It worked. But you cannot say why, so you cannot repeat it, and next week you cannot avoid the opposite.',
    says: 'XAUUSD · Buy · +$140',
    really: 'Right direction. No plan. No stop-loss.',
    catches: 'The AI scores plan adherence and calls out missing stop-losses, so a win you cannot repeat is labelled as exactly that.',
  },
];

function HabitCard({ h, i }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  return (
    <Curtain delay={i * 0.12} from="bottom" className="h-full">
      <Card
        role="button" tabIndex={0} aria-expanded={open} onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
        className={`h-full cursor-pointer p-7 outline-none transition-shadow duration-300 hover:shadow-[0_24px_50px_-20px_rgba(202,138,4,0.45)] focus-visible:ring-2 focus-visible:ring-[#CA8A04] md:p-8 ${open ? '!border-[#CA8A04]/60' : ''}`}
        inner="flex h-full flex-col"
      >
        <div className="flex items-start justify-between">
          <span className="font-display text-[56px] font-bold leading-none text-transparent transition-all duration-300 [-webkit-text-stroke:1.5px_#CA8A04] group-hover/card:[-webkit-text-fill-color:rgba(202,138,4,0.18)]">{h.n}</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CA8A04]/10 text-[#A16207] transition-all duration-300 group-hover/card:rotate-6 group-hover/card:scale-110 group-hover/card:bg-[#CA8A04] group-hover/card:text-[#1a1203] dark:text-[#FBBF24]"><h.icon size={21} /></span>
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

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden"
              >
                <div className="mt-2 rounded-xl bg-zinc-950 px-4 py-3 text-white dark:bg-[#CA8A04] dark:text-[#1a1203]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FBBF24] dark:text-[#1a1203]/70"><Sparkles size={12} /> How Zynth catches it</div>
                  <p className="m-0 mt-1 text-[13px] leading-relaxed">{h.catches}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#A16207] dark:text-[#FBBF24]">
            {open ? 'Hide' : 'Tap to see how Zynth catches it'}
            <ChevronDown size={14} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </Card>
    </Curtain>
  );
}

export function ChapterPattern() {
  return (
    <Section id="why">
      <SectionHeading
        eyebrow="Chapter 01 · The pattern"
        title={<>You don&apos;t lose to the market. You lose to <span className="text-[#CA8A04]">the same three habits.</span></>}
        subtitle="Every trader has a story behind their results. Most never read it, because a spreadsheet records what you did and never why."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {HABITS.map((h, i) => <HabitCard key={h.n} h={h} i={i} />)}
      </div>
    </Section>
  );
}

/* ── Chapter 02 ───────────────────────────────────────────────────────── */
const CELLS = [['Pair', 'XAUUSD'], ['Side', 'Buy'], ['Entry', '2,034.50'], ['P/L', '−$85.00']];

const CONTEXT = [
  { icon: Flame, tone: 'amber', label: 'Mood', value: 'Frustrated · 2nd loss in a row', why: 'Log how you felt in one tap. Over many trades Zynth shows which moods cost you money.' },
  { icon: CalendarClock, tone: 'rose', label: 'Macro', value: 'CPI released 14 min later · High impact', why: 'Each trade is matched with the economic calendar, so you see what was about to hit.' },
  { icon: Brain, tone: 'violet', label: 'AI flagged', value: 'Revenge-trade pattern', why: 'The AI reads sequence and sizing to flag revenge trading, FOMO and overtrading.' },
  { icon: ShieldAlert, tone: 'rose', label: 'Risk', value: 'No stop-loss set', why: 'Missing stop-losses and oversized positions are called out on the trade itself.' },
  { icon: TrendingUp, tone: 'emerald', label: 'Macro score', value: '+1.8 · mildly bullish for gold', why: 'A live score built from 10 macro indicators shows the backdrop at the moment you entered.' },
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
  const [openChip, setOpenChip] = useState(null);
  return (
    <Section id="context" className="bg-zinc-50/70 dark:bg-white/[0.015]">
      <SectionHeading
        eyebrow="Chapter 02 · The missing piece"
        title={<>Your journal records the trade. <span className="text-[#CA8A04]">Zynth records the context.</span></>}
        subtitle="Same trade, two very different notebooks. One tells you that you lost. The other tells you why, and what to change."
      />

      <div className="mx-auto grid max-w-5xl items-stretch gap-6 lg:grid-cols-2">
        <Reveal>
          <Card tilt={false} className="h-full p-6 md:p-8" inner="flex h-full flex-col">
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
          <Card tilt={false} className="relative h-full border-[#CA8A04]/40 p-6 transition-shadow duration-300 hover:shadow-[0_24px_50px_-20px_rgba(202,138,4,0.45)] md:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(202,138,4,0.18),transparent_65%)]" />
            <div className="relative">
              <div className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#A16207] dark:text-[#FBBF24]">
                <Sparkles size={15} /> The same trade, in Zynth
              </div>
              <div className="mt-6"><TradeRow /></div>
              <Stagger className="mt-3 flex flex-col gap-2" gap={0.14} delay={0.2}>
                {CONTEXT.map((c) => (
                  <Item key={c.label} y={10}>
                    <button
                      type="button" aria-expanded={openChip === c.label}
                      onClick={() => setOpenChip(openChip === c.label ? null : c.label)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA8A04] ${TONES[c.tone]}`}
                    >
                      <c.icon size={16} className="shrink-0" />
                      <span className="w-[74px] shrink-0 text-[10.5px] font-bold uppercase tracking-wider opacity-80">{c.label}</span>
                      <span className="flex-1 text-[13px] font-semibold">{c.value}</span>
                      <ChevronDown size={14} className={`shrink-0 opacity-60 transition-transform duration-300 ${openChip === c.label ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openChip === c.label && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="m-0 overflow-hidden px-3.5 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400"
                        >
                          <span className="block pb-1 pt-2">{c.why}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
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
      <p className="mt-8 text-center text-xs text-zinc-500">Illustrative sample data. Tap any tag to see what it means.</p>
    </Section>
  );
}
