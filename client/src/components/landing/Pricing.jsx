import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, Sparkles } from 'lucide-react';
import { getPlanDisplay } from '../../config/pricingPlans';
import { Button, Card, EASE, Item, Section, SectionHeading, Stagger } from './motion';

const FEATURES = {
  free: ['5 journal entries', '2 AI trade analyses', 'Core analytics dashboard', 'Profit & risk calculators'],
  pro: [
    'Unlimited journal entries',
    '50 AI insights every month',
    'Advanced analytics',
    'Full economic calendar & macro intelligence',
    'Real-time market data',
  ],
  elite: [
    'Everything in Pro',
    'Unlimited AI insights',
    'Trading DNA profile',
    'AI coaching & performance reports',
    'Strategy optimisation insights',
    'Priority support',
  ],
};

function PlanFeatures({ items, dark }) {
  return (
    <ul className="mt-7 space-y-3">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-3 text-sm">
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? 'bg-[#CA8A04]/20 text-[#FBBF24]' : 'bg-[#CA8A04]/10 text-[#A16207] dark:text-[#FBBF24]'}`}>
            <Check size={12} strokeWidth={3} />
          </span>
          <span className="text-zinc-700 dark:text-zinc-300">{f}</span>
        </li>
      ))}
    </ul>
  );
}

function Price({ amount, suffix, sub }) {
  return (
    <div className="mt-5">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={amount + suffix}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="flex items-baseline gap-1.5"
        >
          <span className="text-[44px] font-semibold leading-none tracking-tight text-zinc-950 dark:text-white">{amount}</span>
          <span className="text-sm text-zinc-500">{suffix}</span>
        </motion.div>
      </AnimatePresence>
      <div className="mt-1.5 h-5 text-[13px] text-zinc-500">{sub}</div>
    </div>
  );
}

export default function Pricing({ onGetStarted, promo }) {
  const [cycle, setCycle] = useState('monthly');
  const pro = getPlanDisplay('pro', cycle);
  const elite = getPlanDisplay('elite', cycle);
  const promoOn = promo.active && (promo.spotsLeft == null || promo.spotsLeft > 0);

  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple pricing. Serious results."
        subtitle={promoOn
          ? 'Early users get the full Elite plan free. Everyone can start on the Free plan with no credit card.'
          : 'Start free and upgrade when you are ready. Cancel anytime — you are never billed automatically.'}
      />

      <div className="mb-12 flex justify-center">
        <div role="tablist" aria-label="Billing cycle" className="relative inline-flex rounded-full border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
          {['monthly', 'annual'].map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cycle === c}
              onClick={() => setCycle(c)}
              className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${cycle === c ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
              {cycle === c && (
                <motion.span layoutId="billing-pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#D99A0B] to-[#B87A06]" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <span className="capitalize">{c}</span>{' '}
              {c === 'annual' && <span className={`ml-1.5 text-[11px] ${cycle === 'annual' ? 'text-white/85' : 'text-[#A16207] dark:text-[#FBBF24]'}`}>2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      <Stagger className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3" gap={0.12}>
        {/* Free */}
        <Item>
          <Card className="flex h-full flex-col p-7" hover>
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">Free</h3>
            <p className="mt-1 text-sm text-zinc-500">Try the core journal</p>
            <Price amount="$0" suffix="forever" sub="No credit card required" />
            <PlanFeatures items={FEATURES.free} />
            <div className="mt-auto pt-8">
              <Button variant="secondary" className="w-full" onClick={() => onGetStarted({ plan: 'free', billingCycle: 'monthly' })}>
                Start free
              </Button>
            </div>
          </Card>
        </Item>

        {/* Pro */}
        <Item>
          <Card className="flex h-full flex-col p-7" hover>
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">Pro</h3>
            <p className="mt-1 text-sm text-zinc-500">For traders building consistency</p>
            <Price
              amount={pro.amountDisplay}
              suffix={pro.suffix}
              sub={cycle === 'annual' ? `${pro.monthlyEquivalentDisplay}/mo billed yearly` : null}
            />
            <PlanFeatures items={FEATURES.pro} />
            <div className="mt-auto pt-8">
              <Button variant="secondary" className="w-full" onClick={() => onGetStarted({ plan: 'pro', billingCycle: cycle })}>
                Choose Pro
              </Button>
            </div>
          </Card>
        </Item>

        {/* Elite */}
        <Item className="order-first md:order-none">
          <div className="relative h-full overflow-hidden rounded-[24px] p-[2px] shadow-[0_24px_70px_-24px_rgba(202,138,4,0.65)]">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2 animate-[spin_6s_linear_infinite]"
              style={{ background: 'conic-gradient(from 0deg, transparent 0 55%, #FBBF24 75%, #CA8A04 88%, transparent 100%)' }}
            />
            <div className="absolute inset-0 rounded-[24px] bg-[#CA8A04]/25" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white p-7 dark:bg-[#131316]">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 bg-[radial-gradient(circle,rgba(202,138,4,0.22),transparent_65%)]" />
              <div className="relative flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-white"><Crown size={18} className="text-[#CA8A04]" />Elite</h3>
                <span className="rounded-full bg-[#CA8A04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {promoOn ? 'Free for early users' : 'Most powerful'}
                </span>
              </div>
              <p className="relative mt-1 text-sm text-zinc-500">Every feature, no limits</p>
              {promoOn ? (
                <div className="relative mt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[44px] font-semibold leading-none tracking-tight text-zinc-950 dark:text-white">Free</span>
                    <span className="text-sm text-zinc-400 line-through">{elite.label}</span>
                  </div>
                  <div className="mt-1.5 flex h-5 items-center gap-1.5 text-[13px] font-medium text-[#A16207] dark:text-[#FBBF24]">
                    <Sparkles size={13} />
                    {typeof promo.spotsLeft === 'number' ? `${promo.spotsLeft} of ${promo.limit ?? 100} spots left` : 'First 100 users'}
                  </div>
                </div>
              ) : (
                <Price amount={elite.amountDisplay} suffix={elite.suffix} sub={cycle === 'annual' ? `${elite.monthlyEquivalentDisplay}/mo billed yearly` : null} />
              )}
              <div className="relative"><PlanFeatures items={FEATURES.elite} dark /></div>
              <div className="relative mt-auto pt-8">
                <Button className="w-full" onClick={() => onGetStarted({ plan: 'elite', billingCycle: cycle })}>
                  {promoOn ? 'Claim free Elite' : 'Get Elite'}
                </Button>
              </div>
            </div>
          </div>
        </Item>
      </Stagger>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
        className="mt-8 text-center text-sm text-zinc-500"
      >
        Pay with USDT (TRC20) or JazzCash. Plans activate after you submit a payment — nothing is ever charged automatically.
      </motion.p>
    </Section>
  );
}
