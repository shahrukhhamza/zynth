import { useLayoutEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Brain, Check, Crown, ShieldCheck, TrendingUp } from 'lucide-react';
import ProductMock from './ProductMock';
import Orb from './Orb';
import SplitHeading from './SplitHeading';
import { Button, EASE } from './motion';
import { gsap, prefersReducedMotion } from './engine';
import { scrollToId } from './Nav';

function FloatChip({ className, delay = 0, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: reduce ? 0 : [0, -10, 0] }}
      transition={{
        opacity: { delay: 1.6 + delay, duration: 0.6 },
        scale: { delay: 1.6 + delay, duration: 0.6, ease: EASE },
        y: { delay: 2.2 + delay, duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' },
      }}
      className={`absolute hidden rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.3)] dark:border-white/10 dark:bg-[#17171b]/95 lg:block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Hero({ onGetStarted, promo }) {
  const root = useRef(null);
  const mockRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: mockRef, offset: ['start end', 'center 60%'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.93, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 50, 0]);

  // Intro choreography for everything except the headline (which SplitHeading handles)
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-in]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.9 });
    }, root);
    return () => ctx.revert();
  }, []);

  const spotsLabel = promo.active && typeof promo.spotsLeft === 'number' && promo.spotsLeft > 0
    ? `${promo.spotsLeft} spots left`
    : null;

  return (
    <section ref={root} className="landing-grain relative overflow-hidden pb-20 pt-36 md:pb-28 md:pt-44">
      {/* ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(202,138,4,0.22),transparent)]" />
        <div className="absolute -left-56 top-[18%] h-[760px] w-[760px] bg-[radial-gradient(circle,rgba(202,138,4,0.20),transparent_65%)]" />
        <div className="absolute -right-56 top-[40%] h-[780px] w-[780px] bg-[radial-gradient(circle,rgba(14,165,233,0.12),transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-60 dark:opacity-35"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(120,113,108,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,113,108,0.13) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* fades the grid out toward the edges (a cheap gradient instead of a CSS mask) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_28%,transparent_25%,var(--page-bg)_78%)]" />
      </div>

      {/* 3D orbs */}
      <Orb size={420} depth={1.1} className="-left-52 top-16 opacity-25 sm:-left-44 sm:opacity-60 md:-left-28 md:opacity-100 lg:-left-10 lg:top-28" />
      <Orb size={300} depth={0.7} float={10} ribCount={22} className="-right-36 top-[58%] opacity-25 sm:opacity-60 md:-right-20 md:top-[46%] md:opacity-100 lg:right-2 lg:top-[38%]" />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {promo.active && (
            <button
              data-hero-in
              onClick={() => scrollToId('pricing')}
              className="group mx-auto inline-flex max-w-full items-center gap-2.5 whitespace-nowrap rounded-full border border-[#CA8A04]/35 bg-[#CA8A04]/10 py-1.5 pl-2 pr-3.5 text-[12px] font-medium text-[#8a5a05] transition-colors hover:bg-[#CA8A04]/15 dark:text-[#FBBF24] sm:pr-4 sm:text-[13px]"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-[#CA8A04] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Launch offer
              </span>
              <span>First 100 traders get Elite free{spotsLabel && <span className="hidden sm:inline"> · {spotsLabel}</span>}</span>
              <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          <SplitHeading
            as="h1"
            immediate
            delay={0.35}
            className="font-display mt-8 text-[44px] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-7xl md:text-[92px]"
            style={{ textWrap: 'balance' }}
          >
            Trade with <span className="text-[#CA8A04]">context,</span> not guesswork.
          </SplitHeading>

          <p
            data-hero-in
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl"
          >
            Every trader has a story behind their results. Zynth pairs an AI-powered journal with live macro
            intelligence, so you can finally read yours: why you win, why you lose, and what the market was doing.
          </p>

          <div data-hero-in className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={() => onGetStarted()} className="w-full sm:w-auto">
              {promo.active ? 'Claim free Elite access' : 'Start free'} <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => scrollToId('how-it-works')} className="w-full sm:w-auto">
              See how it works
            </Button>
          </div>

          <ul data-hero-in className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-zinc-500">
            {['No credit card required', 'Set up in under a minute', 'Nothing is ever charged automatically'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#CA8A04]" />{t}</li>
            ))}
          </ul>
        </div>

        {/* product mock with scroll-linked tilt */}
        <div ref={mockRef} className="relative mx-auto mt-16 max-w-5xl md:mt-20" style={{ perspective: 1600 }}>
          <motion.div style={{ rotateX, scale, y: lift, transformOrigin: 'center top' }}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: 1.1 }}
            >
              <ProductMock />
            </motion.div>
          </motion.div>

          <FloatChip className="-left-12 top-[52%] xl:-left-24">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><TrendingUp size={18} /></span>
              <div>
                <div className="text-[11px] font-medium text-zinc-500">Macro score</div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">+1.8 · Mildly bullish</div>
              </div>
            </div>
          </FloatChip>
          <FloatChip className="-right-10 top-10 xl:-right-20" delay={0.4}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CA8A04]/15 text-[#A16207] dark:text-[#FBBF24]"><Brain size={18} /></span>
              <div>
                <div className="text-[11px] font-medium text-zinc-500">AI flagged</div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">Revenge-trade pattern</div>
              </div>
            </div>
          </FloatChip>
          <FloatChip className="-right-8 bottom-24 xl:-right-16" delay={0.8}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400"><Crown size={18} /></span>
              <div>
                <div className="text-[11px] font-medium text-zinc-500">Trading DNA</div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">The Sniper</div>
              </div>
            </div>
          </FloatChip>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
            <ShieldCheck size={13} /> Illustrative sample data. Zynth is an analytics tool, not investment advice.
          </p>
        </div>
      </div>
    </section>
  );
}
