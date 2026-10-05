import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Mail } from 'lucide-react';
import { BrandMark } from '../BrandLogo';
import { getPlanMonthlyLabel } from '../../config/pricingPlans';
import { Button, EASE, Reveal, Section, SectionHeading } from './motion';
import Orb from './Orb';
import SplitHeading from './SplitHeading';
import { gsap, prefersReducedMotion } from './engine';
import { scrollToId } from './Nav';

function buildFaqs(promoOn) {
  return [
    {
      q: 'What is Zynth?',
      a: 'Zynth is an AI-powered trade journal and macro-intelligence workspace. You log your trades, and Zynth analyses your behaviour, scores your psychology and shows what the market was doing around each trade. It is an analytics tool — not a broker, and it does not give investment advice.',
    },
    ...(promoOn ? [{
      q: 'Is the Elite plan really free?',
      a: 'Yes. The first 100 accounts get every Elite feature at no charge as part of our launch offer. You are never billed automatically — paid plans only activate after you submit a payment yourself.',
    }] : []),
    {
      q: 'Is my data safe?',
      a: 'Your data is encrypted in transit and stored securely. Your journal is private to your account, and we never sell your personal data.',
    },
    {
      q: 'What can I do on the Free plan?',
      a: 'The Free plan needs no credit card and includes 5 journal entries, 2 AI trade analyses, the core analytics dashboard and the profit and risk calculators.',
    },
    {
      q: 'What does the AI analysis include?',
      a: 'It reads your entries, emotions and execution to score your psychology, flag patterns such as revenge trading or missing stop-losses, and suggest concrete improvements. Higher plans add weekly coaching reports and your Trading DNA profile.',
    },
    {
      q: 'Which markets does it cover?',
      a: 'You can journal any instrument. Charts and live prices cover gold, major forex pairs, crypto and the main US indices, and the macro engine focuses on US economic data that moves them.',
    },
    {
      q: 'How much do the paid plans cost?',
      a: `Pro is ${getPlanMonthlyLabel('pro')} and Elite is ${getPlanMonthlyLabel('elite')}, with an annual option that gives you two months free. You can pay with USDT (TRC20) or JazzCash.`,
    },
  ];
}

function FaqItem({ q, a, open, onToggle, index }) {
  return (
    <Reveal delay={index * 0.04} y={14}>
      <div className={`overflow-hidden rounded-2xl border transition-colors ${open ? 'border-[#CA8A04]/40 bg-white shadow-sm dark:bg-white/[0.04]' : 'border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.02]'}`}>
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <span className="text-[15px] font-semibold text-zinc-950 dark:text-white md:text-base">{q}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: EASE }} className="shrink-0 text-[#CA8A04]">
            <ChevronDown size={20} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <p className="px-6 pb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export function Faq({ promo }) {
  const promoOn = promo.active && (promo.spotsLeft == null || promo.spotsLeft > 0);
  const faqs = buildFaqs(promoOn);
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq" className="bg-zinc-50/70 dark:bg-white/[0.015]">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((f, i) => (
          <FaqItem key={f.q} index={i} {...f} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>
    </Section>
  );
}

export function FinalCta({ onGetStarted, promo }) {
  const promoOn = promo.active && (promo.spotsLeft == null || promo.spotsLeft > 0);
  return (
    <Section>
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-[#CA8A04]/30 bg-zinc-950 px-6 py-16 text-center md:px-16 md:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(202,138,4,0.35),transparent)]" />
          <Orb size={300} depth={0.6} float={10} ribCount={20} className="-left-24 -bottom-24 opacity-90 md:-left-12 md:-bottom-16" />
          <Orb size={220} depth={0.9} float={8} ribCount={18} className="-right-16 -top-16 opacity-90 md:-right-6 md:-top-10" />
          <div className="relative">
            <SplitHeading
              as="h2"
              className="font-display mx-auto max-w-4xl text-[38px] font-bold uppercase leading-[0.98] tracking-[-0.025em] text-white md:text-[76px]"
              style={{ textWrap: 'balance' }}
            >
              Your next trade deserves <span className="text-[#FBBF24]">context.</span>
            </SplitHeading>
            <p className="mx-auto mt-6 max-w-xl text-base text-zinc-400 md:text-lg">
              {promoOn
                ? 'Join now and get the full Elite plan free as one of our first 100 users.'
                : 'Start journaling free and see what your trades have been trying to tell you.'}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => onGetStarted()} className="w-full sm:w-auto">
                {promoOn ? 'Claim free Elite access' : 'Get started free'} <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => scrollToId('pricing')} className="w-full !border-white/20 !bg-white/[0.06] !text-white sm:w-auto">
                View pricing
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Why Zynth', id: 'why' },
      { label: 'How it works', id: 'how-it-works' },
      { label: 'Pricing', id: 'pricing' },
      { label: 'FAQ', id: 'faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Service Policy', href: '/service-policy' },
      { label: 'Our Services', href: '/services' },
    ],
  },
];

/** Oversized wordmark that rises into place as the footer scrolls into view. */
function Wordmark() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { yPercent: 45, opacity: 0.2 }, {
        yPercent: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.8 },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <div className="select-none overflow-hidden" aria-hidden="true">
      <div
        ref={ref}
        className="font-display text-center text-[27vw] font-bold uppercase leading-[0.8] tracking-[-0.05em] md:text-[21vw]"
        style={{ backgroundImage: 'linear-gradient(to bottom, rgba(202,138,4,0.55), rgba(202,138,4,0.02) 85%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
      >
        Zynth
      </div>
    </div>
  );
}

export function Footer() {
  const linkCls = 'text-sm text-zinc-600 transition-colors hover:text-[#A16207] dark:text-zinc-400 dark:hover:text-[#FBBF24]';
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-white/[0.07] dark:bg-[#0b0b0f]">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <span className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">Zynth</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              The AI trade journal with built-in macro intelligence. Intelligence behind every trade.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href
                      ? <a href={l.href} className={linkCls}>{l.label}</a>
                      : <button onClick={() => scrollToId(l.id)} className={linkCls}>{l.label}</button>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Contact</h4>
            <a href="mailto:support@zynth.com" className={`${linkCls} inline-flex items-center gap-2`}>
              <Mail size={15} /> support@zynth.com
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 dark:border-white/[0.07]">
          <p className="text-xs leading-relaxed text-zinc-500">
            Zynth is a journaling and analytics tool. It is not a broker, does not execute trades and does not provide
            investment, financial or trading advice. Trading leveraged products carries a high risk of loss; past
            performance does not guarantee future results. Example figures shown on this page are illustrative.
          </p>
          <p className="mt-4 text-xs text-zinc-500">&copy; {new Date().getFullYear()} Zynth. All rights reserved.</p>
        </div>
      </div>
      <Wordmark />
    </footer>
  );
}
