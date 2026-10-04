/**
 * SplitHeading — scroll-triggered text reveal powered by GSAP SplitText.
 *   variant "chars": every character flips up in 3D with a springy overshoot (headlines)
 *   variant "lines": each line rises out of a mask (paragraphs / sub-headlines)
 * The text stays fully visible and static for reduced-motion users.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, SplitText, prefersReducedMotion, whenFontsReady } from './engine';

export default function SplitHeading({
  as: Tag = 'h2',
  children,
  className = '',
  variant = 'chars',
  delay = 0,
  immediate = false, // play on load instead of when scrolled into view
  start = 'top 88%',
  style,
}) {
  const ref = useRef(null);
  // Hidden until the split is ready, so there is no flash of the unsplit text.
  const [armed] = useState(() => !prefersReducedMotion());

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !armed) return undefined;
    let ctx;
    let split;
    let cancelled = false;

    whenFontsReady(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const trigger = immediate ? undefined : { trigger: el, start, toggleActions: 'play none none none' };

        if (variant === 'lines') {
          split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
          gsap.set(el, { autoAlpha: 1 });
          gsap.fromTo(split.lines, { yPercent: 110 }, {
            yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay, scrollTrigger: trigger,
          });
        } else {
          split = new SplitText(el, { type: 'words,chars', wordsClass: 'split-word', charsClass: 'split-char' });
          gsap.set(el, { autoAlpha: 1, perspective: 600 });
          // fromTo (explicit end values): a plain from() re-reads the *hidden* state as its end value
          // whenever ScrollTrigger.refresh() runs, which would leave the text invisible forever.
          gsap.fromTo(split.chars, {
            opacity: 0, yPercent: 70, rotateX: -80, transformOrigin: '50% 100% -30px',
          }, {
            opacity: 1, yPercent: 0, rotateX: 0, transformOrigin: '50% 100% -30px',
            duration: 0.95,
            ease: 'back.out(1.7)',
            stagger: { each: 0.018, from: 'start' },
            delay,
            scrollTrigger: trigger,
          });
        }
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
      split?.revert();
    };
  }, [armed, variant, delay, immediate, start]);

  return (
    <Tag ref={ref} className={`${className} ${armed ? 'invisible' : ''}`} style={style}>
      {children}
    </Tag>
  );
}
