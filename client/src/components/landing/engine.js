/**
 * Motion engine for the landing page: GSAP + ScrollTrigger + SplitText, with Lenis providing
 * inertial smooth scrolling. Everything here is a no-op (or falls back to native behaviour)
 * when the user prefers reduced motion.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenisInstance = null;

/** Starts smooth scrolling. Returns a cleanup function. */
export function startSmoothScroll() {
  if (prefersReducedMotion()) return () => {};

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
  });
  lenisInstance = lenis;

  // Keep ScrollTrigger in lock-step with Lenis' virtual scroll position.
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenisInstance = null;
    gsap.ticker.lagSmoothing(500, 33);
  };
}

/** Smoothly scrolls to a selector / element / pixel offset (native fallback without Lenis). */
export function scrollToTarget(target, { offset = -90, duration = 1.5 } = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset, duration, easing: (t) => 1 - (1 - t) ** 4 });
    return;
  }
  if (typeof target === 'number') { window.scrollTo({ top: target, behavior: 'smooth' }); return; }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Freezes / releases page scrolling (mobile menu). */
export function setScrollLocked(locked) {
  if (lenisInstance) (locked ? lenisInstance.stop() : lenisInstance.start());
  document.body.style.overflow = locked ? 'hidden' : '';
}

/** Runs `fn` once web fonts are ready so text splitting measures the final glyph widths. */
export function whenFontsReady(fn) {
  const run = () => requestAnimationFrame(fn);
  if (document.fonts?.ready) document.fonts.ready.then(run); else run();
}
