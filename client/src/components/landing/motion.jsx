/**
 * Shared motion + layout primitives for the public landing page.
 * Everything respects prefers-reduced-motion (MotionConfig at the page root + useReducedMotion).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';
import { gsap, prefersReducedMotion } from './engine';
import SplitHeading from './SplitHeading';

export const EASE = [0.22, 1, 0.36, 1];

/** Fade + rise when the element scrolls into view (once). */
export function Reveal({ children, delay = 0, y = 24, className = '', as = 'div', ...rest }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Stagger container + item pair for grids and lists. */
export function Stagger({ children, className = '', gap = 0.08, delay = 0, ...rest }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className = '', y = 24, ...rest }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Counts from 0 to `value` once the element is visible. */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', duration = 1.6, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) { setDisplay(value); return undefined; }
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

/** Types `text` out character by character once visible. */
export function Typewriter({ text, speed = 22, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (!inView || reduce) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [inView, text, speed, reduce]);

  return (
    <span ref={ref} className={className}>
      {text.slice(0, n)}
      {n < text.length && <span className="inline-block w-[2px] h-[1em] align-[-2px] ml-0.5 bg-current animate-pulse" />}
    </span>
  );
}

/** Small uppercase label above section headings, with a pulsing marker. */
export function Eyebrow({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.2em] text-[#A16207] dark:text-[#EAB308] ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-[3px] bg-[#CA8A04] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rotate-45 rounded-[2px] bg-[#CA8A04]" />
      </span>
      {children}
    </span>
  );
}

export function GoldText({ children, className = '' }) {
  return (
    <span className={`bg-gradient-to-r from-[#A16207] via-[#CA8A04] to-[#EAB308] bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

export function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`relative scroll-mt-20 py-20 md:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', compact = false }) {
  return (
    <div className={`${compact ? 'mb-8 md:mb-8' : 'mb-14 md:mb-20'} ${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
      <SplitHeading
        as="h2"
        className={`font-display mt-6 font-bold uppercase leading-[1] tracking-[-0.02em] text-zinc-950 dark:text-white ${compact ? 'text-[34px] sm:text-5xl md:text-5xl lg:text-[52px]' : 'text-[34px] sm:text-5xl md:text-[64px]'}`}
      >
        {title}
      </SplitHeading>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}

/** Primary (gold) and secondary buttons: a solid pressed-depth edge, hover sheen and press response. */
export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }) {
  const sizes = { md: 'h-11 px-5 text-[13px]', lg: 'h-[54px] px-8 text-sm' };
  const base = `group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-bold uppercase tracking-[0.06em] transition-[transform,box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA8A04] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0b0b0f] ${sizes[size]}`;
  const styles = variant === 'primary'
    ? 'bg-gradient-to-b from-[#E0A010] to-[#C98A06] text-[#1a1203] shadow-[0_4px_0_#8a5a05,0_16px_30px_-10px_rgba(202,138,4,0.75)] hover:translate-y-[1px] hover:shadow-[0_3px_0_#8a5a05,0_18px_34px_-10px_rgba(202,138,4,0.9)] active:translate-y-[4px] active:shadow-[0_0_0_#8a5a05,0_8px_16px_-8px_rgba(202,138,4,0.6)]'
    : 'border border-zinc-300 bg-white/70 text-zinc-900 shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:translate-y-[1px] hover:border-zinc-400 hover:shadow-[0_3px_0_rgba(0,0,0,0.08)] active:translate-y-[4px] active:shadow-none dark:border-white/15 dark:bg-white/[0.05] dark:text-white dark:shadow-[0_4px_0_rgba(255,255,255,0.06)] dark:hover:border-white/30';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {variant === 'primary' && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/40 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/**
 * Surface card with a cursor-following gold spotlight and a subtle 3D tilt (fine pointers only).
 */
export function Card({ children, className = '', inner = '', hover = true, tilt = true, ...rest }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || !hover || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (tilt && !prefersReducedMotion()) {
      gsap.to(el, {
        rotateY: ((x / r.width) - 0.5) * 6,
        rotateX: (0.5 - (y / r.height)) * 6,
        y: -4, duration: 0.5, ease: 'power3.out', transformPerspective: 900,
      });
    }
  };
  const onLeave = () => {
    if (!ref.current || !hover) return;
    gsap.to(ref.current, { rotateX: 0, rotateY: 0, y: 0, duration: 0.7, ease: 'power3.out' });
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group/card relative overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_30px_-14px_rgba(0,0,0,0.14)] transition-colors dark:border-white/[0.08] dark:bg-[#121215] dark:shadow-none ${hover ? 'hover:border-[#CA8A04]/45' : ''} ${className}`}
      {...rest}
    >
      {hover && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: 'radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(202,138,4,0.16), transparent 62%)' }}
        />
      )}
      <div className={`relative ${inner}`}>{children}</div>
    </div>
  );
}

/**
 * Curtain — wipes its child into view with a clip-path reveal while the content glides in from
 * the opposite direction (the "reveal" technique used on premium agency sites).
 */
export function Curtain({ children, className = '', delay = 0, from = 'left' }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    const hidden = from === 'bottom' ? 'inset(100% 0% 0% 0% round 22px)' : 'inset(0% 100% 0% 0% round 22px)';
    const ctx = gsap.context(() => {
      const trigger = { trigger: el, start: 'top 90%', once: true };
      gsap.fromTo(el, { clipPath: hidden }, {
        clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.35, ease: 'power4.inOut', delay, scrollTrigger: trigger,
        onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
      });
      gsap.fromTo(el.firstElementChild, {
        xPercent: from === 'bottom' ? 0 : -12, yPercent: from === 'bottom' ? 12 : 0,
      }, {
        xPercent: 0, yPercent: 0, duration: 1.5, ease: 'power4.out', delay, scrollTrigger: trigger,
      });
    }, el);
    return () => ctx.revert();
  }, [delay, from]);

  return <div ref={ref} className={className}>{children}</div>;
}
