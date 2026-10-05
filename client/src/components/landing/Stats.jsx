/**
 * Stats — ring-progress counters. Every figure is a verifiable product fact (macro indicators
 * scored, behavioural traits profiled, asset classes covered), not marketing numbers.
 */
import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from './engine';
import { Reveal, Section, SectionHeading } from './motion';
import { DataSources } from './visuals';

const STATS = [
  { value: 10, label: 'Macro indicators scored', pct: 0.84 },
  { value: 8, label: 'Behavioural traits profiled', pct: 0.7 },
  { value: 10, prefix: '<', suffix: 's', label: 'To log a trade in quick mode', pct: 0.35 },
  { value: 4, label: 'Asset classes covered', pct: 0.5 },
];

const R = 54; const CIRC = 2 * Math.PI * R;

function Stat({ value, prefix = '', suffix = '', label, pct }) {
  const root = useRef(null);
  const num = useRef(null);
  const ring = useRef(null);

  useLayoutEffect(() => {
    const final = `${prefix}${value}${suffix}`;
    if (prefersReducedMotion()) {
      num.current.textContent = final;
      ring.current.style.strokeDashoffset = String(CIRC * (1 - pct));
      return undefined;
    }
    const ctx = gsap.context(() => {
      const st = { trigger: root.current, start: 'top 88%', once: true };
      const obj = { v: 0 };
      gsap.to(obj, { v: value, duration: 2.2, ease: 'power3.out', scrollTrigger: st, onUpdate: () => { num.current.textContent = `${prefix}${Math.round(obj.v)}${suffix}`; } });
      gsap.fromTo(ring.current, { strokeDashoffset: CIRC }, { strokeDashoffset: CIRC * (1 - pct), duration: 2.2, ease: 'power3.out', scrollTrigger: st });
      gsap.fromTo(root.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: st });
    }, root);
    return () => ctx.revert();
  }, [value, prefix, suffix, pct]);

  return (
    <div ref={root} className="group/stat flex cursor-default flex-col items-center text-center">
      <div className="relative h-[150px] w-[150px] transition-transform duration-300 group-hover/stat:scale-105 md:h-[170px] md:w-[170px]">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={R} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="6" />
          <circle ref={ring} cx="64" cy="64" r={R} fill="none" stroke="#CA8A04" strokeWidth="6" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span ref={num} className="font-display text-4xl font-bold tracking-tight text-zinc-950 dark:text-white md:text-5xl">{prefix}0{suffix}</span>
        </div>
      </div>
      <p className="mt-5 max-w-[190px] text-sm font-medium leading-snug text-zinc-600 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export default function Stats() {
  return (
    <Section id="foundation" className="!pb-16">
      <SectionHeading
        eyebrow="Chapter 04 · Under the hood"
        title={<>Built on real data, <span className="text-[#CA8A04]">not hunches.</span></>}
        subtitle="Every score in Zynth traces back to a published source or to your own trades. No black boxes, no invented numbers."
      />
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {STATS.map((s) => <Stat key={s.label} {...s} />)}
      </div>
      <Reveal><DataSources /></Reveal>
    </Section>
  );
}
