/**
 * Ticker — a heavy gold marquee band. It drifts on its own, then accelerates (and reverses)
 * with the page's scroll velocity and direction.
 */
import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './engine';

const ITEMS = [
  'AI trade journal', 'Macro intelligence', 'Trading DNA', 'Economic calendar',
  'Pre-trade checklist', 'Risk planner', 'Live markets',
];

function Asterisk() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 animate-[spin_9s_linear_infinite] md:h-9 md:w-9" aria-hidden="true">
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Ticker() {
  const track = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const tween = gsap.to(track.current, { xPercent: -50, ease: 'none', duration: 34, repeat: -1 });
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const dir = self.direction;
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 260, 7);
          gsap.to(tween, {
            timeScale: dir * boost,
            duration: 0.25,
            overwrite: true,
            onComplete: () => gsap.to(tween, { timeScale: dir, duration: 1.2, ease: 'power2.out' }),
          });
        },
      });
    }, track);
    return () => ctx.revert();
  }, []);

  const row = [...ITEMS, ...ITEMS];
  return (
    <section aria-label="Product highlights" className="relative z-10 -my-1 overflow-hidden">
      <div className="-rotate-[1.2deg] scale-x-[1.03] bg-gradient-to-b from-[#E0A010] to-[#C98A06] py-4 text-[#1a1203] shadow-[0_20px_60px_-20px_rgba(202,138,4,0.6)] md:py-5">
        <div ref={track} className="flex w-max items-center gap-8 pr-8 md:gap-12 md:pr-12">
          {[0, 1].map((dup) => row.slice(0, ITEMS.length).map((t, i) => (
            <div key={`${dup}-${i}`} className="flex shrink-0 items-center gap-8 md:gap-12" aria-hidden={dup === 1}>
              <span className="font-display whitespace-nowrap text-2xl font-bold uppercase tracking-tight md:text-4xl">{t}</span>
              <Asterisk />
            </div>
          )))}
        </div>
      </div>
    </section>
  );
}
