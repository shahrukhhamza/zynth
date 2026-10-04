/**
 * Orb — a glossy, ribbed gold sphere drawn in SVG (curved latitude ribs, studio lighting,
 * cool rim light), animated with a gentle float, scroll parallax and pointer follow.
 */
import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './engine';
import { sphereDataUri } from '../ui/orbSvg';

function Orb({ size = 320, className = '', depth = 1, float = 14, ribCount = 26 }) {
  const src = useMemo(() => sphereDataUri(ribCount), [ribCount]);
  const outer = useRef(null);
  const inner = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      // 1. idle float + slow spin of the lighting (rotating the whole sphere subtly)
      gsap.to(inner.current, { y: float, rotation: 6 * depth, duration: 4.5 + depth, ease: 'sine.inOut', yoyo: true, repeat: -1 });

      // 2. scroll parallax (further orbs move more)
      gsap.to(outer.current, {
        yPercent: -34 * depth,
        ease: 'none',
        scrollTrigger: { trigger: outer.current.closest('section') || document.body, start: 'top top', end: 'bottom top', scrub: 0.8 },
      });

      // 3. pointer follow
      const xTo = gsap.quickTo(outer.current, 'x', { duration: 1.2, ease: 'power3.out' });
      const yTo = gsap.quickTo(outer.current, 'y', { duration: 1.2, ease: 'power3.out' });
      const move = (e) => {
        xTo(((e.clientX / window.innerWidth) - 0.5) * -40 * depth);
        yTo(((e.clientY / window.innerHeight) - 0.5) * -30 * depth);
      };
      window.addEventListener('pointermove', move, { passive: true });
      return () => window.removeEventListener('pointermove', move);
    }, outer);
    return () => { ctx.revert(); ScrollTrigger.refresh(); };
  }, [depth, float]);

  return (
    <div ref={outer} aria-hidden="true" className={`pointer-events-none absolute will-change-transform ${className}`} style={{ width: size, height: size }}>
      <img ref={inner} src={src} alt="" draggable={false} decoding="async" className="h-full w-full select-none will-change-transform" />
    </div>
  );
}

export default memo(Orb);
