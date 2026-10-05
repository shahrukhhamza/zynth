/**
 * ProductTour — guided walkthrough shown to new users (and replayable any time).
 *
 * A dimmed overlay with a spotlight cut-out around the real UI element being explained, an animated
 * pointing hand that glides to it and taps, and a card that says what the section is for.
 * Targets are found through `data-tour="..."` attributes, so the tour keeps working when layouts change;
 * steps whose target is not on screen (e.g. the sidebar on a phone) are skipped automatically.
 *
 * Events:  `zynth:navigate` {view}  – used to move between pages while touring
 * Storage: `zynth_tour_done` – set when the tour is finished or skipped
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, Loader2, Pointer, Rocket, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { sphereDataUri } from './ui/orbSvg';

const EASE = [0.22, 1, 0.36, 1];
const PAD = 8;          // breathing room around the highlighted element
const CARD_W = 356;
const MARGIN = 16;

export const TOUR_DONE_KEY = 'zynth_tour_done';

/* ── steps ───────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: 'welcome', center: true, hero: true,
    title: 'Welcome to Zynth',
    body: 'Take a one-minute tour. We will point at each part of the app and tell you what it is for, so you know exactly where to go.',
  },
  {
    id: 'new-entry', target: 'new-entry', placement: 'right', group: 'Start here',
    title: 'Log a trade in seconds',
    body: 'This is the button you will use most. Click it, enter the pair, direction and result, and Zynth does the rest: AI review, behaviour flags and macro context.',
  },
  {
    id: 'dash-nav', target: 'nav-data', view: 'data', placement: 'right', group: 'Dashboard',
    title: 'Your home base',
    body: 'The Dashboard summarises everything: how you are performing, what the market is doing and what to do next.',
  },
  {
    id: 'dash-stats', target: 'dash-stats', view: 'data', placement: 'bottom', group: 'Dashboard',
    title: 'Your numbers at a glance',
    body: 'Net P&L, win rate, profit factor and your best session. They update the moment you log a trade.',
  },
  {
    id: 'dash-equity', target: 'dash-equity', view: 'data', placement: 'top', group: 'Dashboard',
    title: 'Equity curve and macro snapshot',
    body: 'Watch your account grow (or dip) over time, next to a live read on the macro backdrop and the next big event.',
  },
  {
    id: 'journal-nav', target: 'nav-journal', placement: 'right', group: 'Trade Journal',
    title: 'The Trade Journal',
    body: 'Every trade you take lives here, with notes, screenshots and an AI review attached.',
  },
  {
    id: 'journal-tabs', target: 'journal-tabs', view: 'journal', placement: 'bottom', group: 'Trade Journal',
    title: 'Six views, one journal',
    body: 'Log Trade to add one. History to browse them. Performance for charts. Trade Coach for AI feedback. Macro Correlation and Trading DNA reveal the patterns you cannot see yourself.',
  },
  {
    id: 'insights-nav', target: 'nav-intelligence', placement: 'right', group: 'AI Insights',
    title: 'AI Insights',
    body: 'A plain-English read on gold and the major pairs, built from CPI, jobs, rates and more.',
  },
  {
    id: 'insights-verdict', target: 'insights-verdict', view: 'intelligence', placement: 'bottom', group: 'AI Insights',
    title: 'The verdict',
    body: 'The gauge shows which way the macro data leans. On the right, a clear action: Wait, No Trade or Look for setups, and why.',
  },
  {
    id: 'insights-markets', target: 'insights-markets', view: 'intelligence', placement: 'top', group: 'AI Insights',
    title: 'Pick a market',
    body: 'Tap Gold, EUR/USD, Oil and others to see exactly why each one is moving. Scroll down for every indicator and its weight.',
  },
  {
    id: 'calendar-nav', target: 'nav-calendar', placement: 'right', group: 'Markets',
    title: 'Economic Calendar',
    body: 'See when the big releases land, so you are never surprised by a spike mid-trade.',
  },
  {
    id: 'tools-nav', target: 'nav-calculator/profit', placement: 'right', group: 'Tools',
    title: 'Calculators',
    body: 'Profit Calculator for P&L and pips. Risk Planner to size every position before you enter.',
  },
  {
    id: 'search', target: 'search', placement: 'bottom', group: 'Shortcuts',
    title: 'Jump anywhere',
    body: 'Press Ctrl K (or Cmd K) to search pages and actions from anywhere in the app.',
    tip: 'Ctrl K',
  },
  {
    id: 'profile', target: 'profile', placement: 'bottom', group: 'Account',
    title: 'Your account',
    body: 'Edit your profile, switch plan, change settings or sign out. Your plan badge lives here too.',
  },
  {
    id: 'help', target: 'nav-help', placement: 'right', group: 'Help',
    title: 'Stuck? Start here',
    body: 'Guides, FAQs and support. You can replay this tour from the Help page whenever you like.',
  },
  {
    id: 'done', center: true, hero: true, last: true,
    title: 'You are all set',
    body: 'Start by logging your first trade. The more you log, the smarter your insights get.',
  },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */
function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 4 && r.height > 4 && r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight;
}

/** First on-screen element with this tour id (the sidebar is rendered twice: a drawer for phones and the desktop one). */
const query = (id) => [...document.querySelectorAll(`[data-tour="${id}"]`)].find(isVisible) ?? null;

const currentView = () => window.location.pathname.replace(/^\//, '') || 'data';

function measure(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
}

/** Choose where the card sits relative to the highlighted box, keeping it fully on screen and off the target. */
function placeCard(rect, size, preferred) {
  const vw = window.innerWidth; const vh = window.innerHeight;
  const gap = 18;
  const w = size.w || CARD_W; const h = size.h || 220;
  const clampX = (x) => Math.min(Math.max(x, MARGIN), Math.max(MARGIN, vw - w - MARGIN));
  const clampY = (y) => Math.min(Math.max(y, MARGIN), Math.max(MARGIN, vh - h - MARGIN));
  // Along the side axis the card is centred on the target, then slid back on screen if it would overflow
  const spots = {
    right: { x: rect.x + rect.w + gap, y: clampY(rect.y + rect.h / 2 - h / 2) },
    left: { x: rect.x - w - gap, y: clampY(rect.y + rect.h / 2 - h / 2) },
    bottom: { x: clampX(rect.x + rect.w / 2 - w / 2), y: rect.y + rect.h + gap },
    top: { x: clampX(rect.x + rect.w / 2 - w / 2), y: rect.y - h - gap },
  };
  const opposite = { right: 'left', left: 'right', top: 'bottom', bottom: 'top' }[preferred];
  const order = [preferred, opposite, 'bottom', 'top', 'right', 'left'].filter(Boolean);
  const fits = (p) => p.x >= MARGIN && p.y >= MARGIN && p.x + w <= vw - MARGIN && p.y + h <= vh - MARGIN;
  for (const key of order) {
    if (fits(spots[key])) return { ...spots[key], side: key };
  }
  // Nothing fits cleanly (the target is huge, or the window is small): take the spot that covers the least of it
  const overlap = (p) => Math.max(0, Math.min(p.x + w, rect.x + rect.w) - Math.max(p.x, rect.x)) * Math.max(0, Math.min(p.y + h, rect.y + rect.h) - Math.max(p.y, rect.y));
  let best = null;
  for (const key of order) {
    const p = { x: clampX(spots[key].x), y: clampY(spots[key].y) };
    const o = overlap(p);
    if (!best || o < best.o) best = { ...p, o, side: 'dock' };
  }
  return best;
}

/* ── component ───────────────────────────────────────────────────────────── */
export default function ProductTour({ onClose }) {
  const theme = useTheme();
  const reduce = useReducedMotion();
  const orb = useMemo(() => sphereDataUri(26), []);

  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [rect, setRect] = useState(null);       // highlighted box in viewport px
  const [seeking, setSeeking] = useState(false);
  const [size, setSize] = useState({ w: CARD_W, h: 240 });
  const [hand, setHand] = useState(null);       // where the hand's fingertip rests
  const cardRef = useRef(null);
  const targetRef = useRef(null);
  const step = STEPS[idx];

  /* finish / skip */
  const finish = useCallback((completed) => {
    try { localStorage.setItem(TOUR_DONE_KEY, '1'); localStorage.removeItem('zynth_tour_pending'); } catch { /* ignore */ }
    // Finishing lands the user on the journal, ready to log a first trade; skipping leaves them where they are
    if (completed === true && currentView() !== 'journal') {
      window.dispatchEvent(new CustomEvent('zynth:navigate', { detail: { view: 'journal' } }));
    }
    onClose?.(completed === true);
  }, [onClose]);

  const go = useCallback((next, d) => {
    if (next < 0) return;
    if (next >= STEPS.length) { finish(true); return; }
    setDir(d); setIdx(next);
  }, [finish]);

  /* locate the target for the current step (navigating first if the step lives on another page) */
  useEffect(() => {
    targetRef.current = null;
    setRect(null);
    if (step.center) { setSeeking(false); return undefined; }

    let cancelled = false;
    let timer = null;
    const startedAt = Date.now();
    setSeeking(true);

    if (step.view && currentView() !== step.view) {
      window.dispatchEvent(new CustomEvent('zynth:navigate', { detail: { view: step.view } }));
    }

    const seek = () => {
      if (cancelled) return;
      const el = query(step.target);
      if (el && isVisible(el)) {
        targetRef.current = el;
        // page-level targets may be below the fold; header and sidebar are fixed so they never scroll
        if (step.view || /^(dash|journal|insights)/.test(step.target)) {
          el.scrollIntoView({ block: el.getBoundingClientRect().height > window.innerHeight * 0.6 ? 'start' : 'center', behavior: reduce ? 'auto' : 'smooth' });
        }
        // give smooth-scroll / entrance animations a moment before the first measurement
        timer = setTimeout(() => { if (!cancelled) { setRect(measure(el)); setSeeking(false); } }, step.view ? 450 : 60);
        return;
      }
      // page content may still be loading (give it time); sidebar and header items are always rendered, so a hidden one is hidden for good
      if (Date.now() - startedAt > (step.view ? 12000 : 300)) {
        // The target never appeared (hidden on this screen size, or the page failed to load): move on
        if (!cancelled) go(idx + (dir >= 0 ? 1 : -1), dir);
        return;
      }
      timer = setTimeout(seek, 120);
    };
    seek();
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  /* keep the spotlight glued to the element while the layout moves (scrolling, resizing, animations) */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = targetRef.current;
      if (el && document.contains(el)) {
        const next = measure(el);
        setRect((prev) => (prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 && Math.abs(prev.w - next.w) < 0.5 && Math.abs(prev.h - next.h) < 0.5 ? prev : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* measure the card so it can be placed without overflowing */
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize((s) => (Math.abs(s.w - r.width) < 1 && Math.abs(s.h - r.height) < 1 ? s : { w: r.width, h: r.height }));
  });

  /* the hand rests slightly inside the lower-right of the target, as if about to click it */
  useEffect(() => {
    if (!rect) { setHand(null); return; }
    // Wide items (sidebar rows, stat strips) get the hand at their empty right end so it never covers the label;
    // small items (icon buttons) get it just inside the lower right.
    const wide = rect.w > 160;
    const x = wide ? rect.x + rect.w - Math.min(46, rect.w * 0.18) : rect.x + rect.w * 0.68;
    const y = rect.y + rect.h * (wide ? 0.72 : 0.7);
    setHand({ x: Math.max(24, Math.min(window.innerWidth - 60, x)), y: Math.max(8, y) });
  }, [rect]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(idx + 1, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, -1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, go, finish]);

  /* lock page scroll behind the overlay */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── layout of the card ── */
  const centered = step.center || (!rect && seeking) || !rect;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardW = Math.min(step.hero ? 440 : CARD_W, vw - MARGIN * 2);
  const pos = centered
    ? { x: (vw - cardW) / 2, y: Math.max(MARGIN, (vh - size.h) / 2), side: 'center' }
    : placeCard(rect, { w: cardW, h: size.h }, step.placement || 'bottom');

  const total = STEPS.length;
  const tourNumber = idx; // welcome counts as 0
  const progress = idx / (total - 1);
  const gold = '#CA8A04';

  return (
    <div className="fixed inset-0 z-[10050]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* dimmer with a spotlight hole */}
      <svg className="absolute inset-0 h-full w-full" width="100%" height="100%" aria-hidden="true" onClick={(e) => e.stopPropagation()}>
        <defs>
          <mask id="tour-hole">
            <rect width="100%" height="100%" fill="#fff" />
            {rect && !step.center && (
              <motion.rect
                rx="16" fill="#000"
                initial={false}
                animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 30, mass: 0.8 }}
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={theme.isDark ? 'rgba(4,4,8,0.74)' : 'rgba(18,14,6,0.6)'} mask="url(#tour-hole)" />
      </svg>

      {/* soft gold glow ring around the target */}
      {rect && !step.center && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl"
          initial={false}
          animate={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 30, mass: 0.8 }}
          style={{ border: `2px solid ${gold}`, boxShadow: `0 0 0 4px rgba(202,138,4,0.22), 0 0 36px rgba(202,138,4,0.55)` }}
        >
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-2xl"
              style={{ border: `2px solid ${gold}` }}
              animate={{ scale: [1, 1.12], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.div>
      )}

      {/* the pointing hand */}
      {hand && !step.center && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0"
          initial={{ x: hand.x + 60, y: hand.y + 90, opacity: 0, scale: 0.8 }}
          animate={{ x: hand.x - 15, y: hand.y - 4, opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 130, damping: 17, mass: 0.9, delay: 0.15 }}
        >
          {/* tap ripple, centred on the fingertip */}
          {!reduce && (
            <motion.span
              className="absolute rounded-full"
              style={{ left: 15 - 17, top: 4 - 17, width: 34, height: 34, border: `2px solid ${gold}` }}
              animate={{ scale: [0.4, 1.7], opacity: [0.9, 0] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut', delay: 1 }}
            />
          )}
          <motion.div
            style={{ transformOrigin: '15px 4px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))' }}
            animate={reduce ? undefined : { rotate: [0, -4, 0], scale: [1, 0.88, 1], y: [0, 3, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
          >
            <Pointer size={46} strokeWidth={1.7} color="#1a1203" fill="#FFFFFF" style={{ display: 'block' }} />
          </motion.div>
        </motion.div>
      )}

      {/* tooltip card */}
      <AnimatePresence mode="wait" initial>
        <motion.div
          key={step.id}
          ref={cardRef}
          initial={{ opacity: 0, y: dir * 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="absolute left-0 top-0 overflow-hidden rounded-[22px] border"
          style={{
            width: cardW, transform: undefined, translate: `${Math.round(pos.x)}px ${Math.round(pos.y)}px`,
            background: theme.surface, borderColor: theme.isDark ? 'rgba(202,138,4,0.35)' : theme.border,
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(202,138,4,0.12)',
            transition: reduce ? 'none' : 'translate 0.5s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {step.hero && (
            <div className="relative overflow-hidden px-6 pb-2 pt-7 text-center">
              <img src={orb} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute left-1/2 top-[-150px] w-[360px] max-w-none -translate-x-1/2 select-none opacity-40" style={{ maskImage: 'radial-gradient(closest-side,#000 55%,transparent 100%)', WebkitMaskImage: 'radial-gradient(closest-side,#000 55%,transparent 100%)' }} />
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ background: 'rgba(202,138,4,0.16)', borderColor: 'rgba(202,138,4,0.4)', color: gold, boxShadow: '0 0 40px rgba(202,138,4,0.3)' }}>
                {step.last ? <Rocket size={26} /> : <Compass size={26} />}
              </span>
            </div>
          )}

          <div className={`px-6 ${step.hero ? 'pb-2 pt-3 text-center' : 'pb-2 pt-5'}`}>
            {!step.hero && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.isDark ? '#FBBF24' : '#A16207' }}>{step.group}</span>
                <span className="text-[11.5px] font-medium tabular-nums" style={{ color: theme.textMuted }}>{tourNumber} / {total - 2}</span>
              </div>
            )}
            <h2 className={`font-display m-0 font-bold tracking-tight ${step.hero ? 'text-[26px]' : 'text-[19px]'}`} style={{ color: theme.text }}>{step.title}</h2>
            <p className={`m-0 mt-2 leading-relaxed ${step.hero ? 'text-[14.5px]' : 'text-[13.5px]'}`} style={{ color: theme.textMuted }}>{step.body}</p>
            {step.tip && (
              <kbd className="mt-3 inline-block rounded-lg border px-2.5 py-1 text-[12px] font-semibold" style={{ borderColor: theme.border, background: theme.surface2, color: theme.text }}>{step.tip}</kbd>
            )}
            {seeking && !step.center && (
              <p className="m-0 mt-3 flex items-center gap-2 text-[12.5px]" style={{ color: theme.textMuted }}><Loader2 size={14} className="animate-spin" /> Getting this ready…</p>
            )}
          </div>

          {/* progress */}
          <div className="mx-6 mt-3 h-1 overflow-hidden rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,27,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#CA8A04,#FBBF24)' }} initial={false} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
          </div>

          <div className="flex items-center justify-between gap-3 px-6 pb-5 pt-4">
            {step.last ? <span /> : (
              <button type="button" onClick={() => finish(false)} className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-[12.5px] font-medium transition-colors hover:underline" style={{ color: theme.textMuted }}>
                <X size={13} /> {idx === 0 ? 'Not now' : 'Skip tour'}
              </button>
            )}
            <div className="flex items-center gap-2.5">
              {idx > 0 && !step.last && (
                <button
                  type="button" onClick={() => go(idx - 1, -1)} aria-label="Previous step"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:border-[#CA8A04]/60"
                  style={{ borderColor: theme.border, background: theme.surface, color: theme.textMuted }}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <button
                type="button" onClick={() => go(idx + 1, 1)} autoFocus
                className="group relative flex h-11 items-center gap-2 overflow-hidden rounded-xl px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-[#1a1203] transition-all duration-150 hover:translate-y-[1px] active:translate-y-[3px]"
                style={{ background: 'linear-gradient(180deg,#E0A010,#C98A06)', boxShadow: '0 3px 0 #8a5a05, 0 12px 22px -10px rgba(202,138,4,0.7)' }}
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/40 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
                <span className="relative">{idx === 0 ? 'Start the tour' : step.last ? 'Log my first trade' : 'Next'}</span>
                <ArrowRight size={15} className="relative transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
