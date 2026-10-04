/**
 * Motion helpers for the signed-in app (framer-motion only, no GSAP — keeps the app bundle small).
 * All of them respect prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1];

/** Page-level entrance: children fade and rise one after another. */
export function Stagger({ children, className = '', style, gap = 0.06, delay = 0, as = 'div' }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      style={style}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </Comp>
  );
}

export function Rise({ children, className = '', style, y = 18, ...rest }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to `value` when it first becomes visible. `format` renders the running number. */
export function CountUp({ value, format, duration = 1.2, className = '', style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) { setN(value); return undefined; }
    const controls = animate(0, value, { duration, ease: EASE, onUpdate: setN });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return <span ref={ref} className={className} style={style}>{format ? format(n) : Math.round(n)}</span>;
}
