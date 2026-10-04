/**
 * HowItWorks — on desktop the three steps are a pinned stack: as you scroll, each card slides up
 * over the previous one (which recedes). On smaller screens they are simply stacked vertically.
 */
import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, AlertTriangle } from 'lucide-react';
import { gsap, prefersReducedMotion } from './engine';
import { EASE, Section, SectionHeading, Typewriter } from './motion';

/* ── step visuals ─────────────────────────────────────────────────────── */
function LogVisual() {
  return (
    <div className="w-full max-w-[360px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#17171b]">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quick mode</div>
      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
        <Typewriter text="XAUUSD" speed={90} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-[#CA8A04] py-2.5 text-center text-xs font-bold text-[#1a1203]">BUY</div>
        <div className="rounded-xl bg-zinc-100 py-2.5 text-center text-xs font-bold text-zinc-500 dark:bg-white/[0.06]">SELL</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-white/10"><div className="text-[10px] text-zinc-500">Entry</div><div className="font-semibold text-zinc-900 dark:text-white">2,034.50</div></div>
        <div className="rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-white/10"><div className="text-[10px] text-zinc-500">P / L</div><div className="font-semibold text-emerald-600 dark:text-emerald-400">+45.50</div></div>
      </div>
      <motion.div
        animate={{ boxShadow: ['0 0 0 0 rgba(202,138,4,0.5)', '0 0 0 14px rgba(202,138,4,0)'] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="mt-4 rounded-xl bg-gradient-to-b from-[#E0A010] to-[#C98A06] py-3 text-center text-xs font-bold uppercase tracking-wider text-[#1a1203]"
      >
        Log trade
      </motion.div>
    </div>
  );
}

function AiVisual() {
  const rows = [
    { t: 'Psychology score', v: '82 / 100', w: '82%', tone: 'gold' },
    { t: 'Plan adherence', v: 'High', w: '90%', tone: 'green' },
    { t: 'Risk discipline', v: 'Stop-loss missing', w: '34%', tone: 'red' },
  ];
  const bar = { gold: 'bg-[#CA8A04]', green: 'bg-emerald-500', red: 'bg-rose-500' };
  return (
    <div className="w-full max-w-[380px] space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#17171b]">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AI analysis</div>
      {rows.map((r, i) => (
        <div key={r.t}>
          <div className="mb-1.5 flex justify-between text-xs"><span className="text-zinc-600 dark:text-zinc-400">{r.t}</span><span className="font-semibold text-zinc-900 dark:text-white">{r.v}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <motion.div className={`h-full rounded-full ${bar[r.tone]}`} initial={{ width: 0 }} whileInView={{ width: r.w }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE, delay: 0.3 + i * 0.15 }} />
          </div>
        </div>
      ))}
      <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>Revenge-trade pattern: 3 entries within 2 hours of a loss.</span>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-[#CA8A04]/30 bg-[#CA8A04]/10 p-3 text-xs text-[#8a5a05] dark:text-[#FBBF24]">
        <Check size={15} className="mt-0.5 shrink-0" />
        <span>Macro backdrop: CPI released 2h before this entry.</span>
      </div>
    </div>
  );
}

function ReportVisual() {
  const bars = [38, 52, 44, 68, 60, 82, 74];
  return (
    <div className="w-full max-w-[380px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#17171b]">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Weekly coaching report</div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Grade B+</span>
      </div>
      <div className="mt-5 flex h-28 items-end gap-2.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-[#A16207] to-[#FBBF24]"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.08 }}
          />
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
        <span className="font-bold text-zinc-950 dark:text-white">Your rule for next week: </span>
        wait two hours after a stop-out before the next entry.
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Log a trade in seconds',
    desc: 'Quick mode needs only the pair, direction, entry and result. Add emotions, reasoning and a screenshot when you want the full picture.',
    tags: ['Quick mode', 'Emotions', 'Screenshots'],
    visual: <LogVisual />,
  },
  {
    n: '02',
    title: 'AI reads your behaviour',
    desc: 'Zynth scores your psychology, flags patterns like revenge trading, and overlays the macro events that were live when you pulled the trigger.',
    tags: ['Psychology score', 'Pattern detection', 'Macro context'],
    visual: <AiVisual />,
  },
  {
    n: '03',
    title: 'Improve with evidence',
    desc: 'Weekly coaching reports, your Trading DNA and a pre-trade checklist turn insights into rules you can actually follow.',
    tags: ['Coaching reports', 'Trading DNA', 'Checklist'],
    visual: <ReportVisual />,
  },
];

function StepCard({ step, onCta }) {
  return (
    <div
      data-hiw-card
      className="relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#121215] md:p-10 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12"
      style={{ transformOrigin: 'center top' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 bg-[radial-gradient(circle,rgba(202,138,4,0.14),transparent_65%)]" />
      <div className="relative">
        <div
          className="font-display text-[88px] font-bold leading-none tracking-tighter text-transparent md:text-[120px]"
          style={{ WebkitTextStroke: '1.5px rgba(202,138,4,0.7)' }}
        >
          {step.n}
        </div>
        <h3 className="font-display mt-2 text-3xl font-bold uppercase leading-[1.02] tracking-tight text-zinc-950 dark:text-white md:text-5xl">{step.title}</h3>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{step.desc}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {step.tags.map((t) => (
            <span key={t} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-white/[0.07] dark:text-zinc-300">#{t.replace(/\s+/g, '')}</span>
          ))}
        </div>
        <button
          onClick={onCta}
          aria-label="Get started"
          className="group mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-all duration-300 hover:bg-[#CA8A04] hover:text-[#1a1203] dark:bg-white/[0.08] dark:text-white"
        >
          <ArrowUpRight size={22} className="transition-transform duration-300 group-hover:rotate-45" />
        </button>
      </div>
      <div className="relative flex justify-center lg:justify-end">{step.visual}</div>
    </div>
  );
}

export default function HowItWorks({ onGetStarted }) {
  const section = useRef(null);
  const stack = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (min-height: 740px)', () => {
      const cards = gsap.utils.toArray('[data-hiw-card]', stack.current);
      gsap.set(cards.slice(1), { yPercent: 108 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.85 * (cards.length - 1)}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      cards.forEach((card, i) => {
        if (i === 0) return;
        tl.to(card, { yPercent: 0, duration: 1 }, i - 1);
        tl.to(cards[i - 1], { scale: 0.93, opacity: 0.45, duration: 1 }, i - 1);
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={section} id="how-it-works" className="relative bg-zinc-50/70 dark:bg-white/[0.015]">
      <Section className="!pb-16 lg:!pb-10 lg:!pt-28">
        <SectionHeading compact eyebrow="How it works" title="From log to improvement in three steps" />
        {/* desktop: fixed-height stage the cards stack inside; mobile: normal flow */}
        <div ref={stack} className="relative flex flex-col gap-6 lg:block lg:h-[clamp(430px,calc(100vh-390px),540px)]">
          {STEPS.map((s) => (
            <div key={s.n} className="lg:absolute lg:inset-0">
              <StepCard step={s} onCta={() => onGetStarted()} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
