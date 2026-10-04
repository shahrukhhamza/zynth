import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { BrandMark } from '../BrandLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, EASE } from './motion';
import { scrollToTarget, setScrollLocked } from './engine';

const LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

export function scrollToId(id) {
  scrollToTarget(`#${id}`);
}

export default function Nav({ onSignIn, onGetStarted }) {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setScrollLocked(open);
    return () => setScrollLocked(false);
  }, [open]);

  const go = (id) => { setOpen(false); setTimeout(() => scrollToId(id), open ? 250 : 0); };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-10 h-[2px] origin-left bg-gradient-to-r from-[#A16207] via-[#CA8A04] to-[#FBBF24]"
        style={{ scaleX: progress }}
      />
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
        aria-label="Primary"
        className={`mx-auto w-full max-w-[1200px] overflow-hidden rounded-[22px] border transition-all duration-500 ${scrolled || open
          ? 'border-zinc-200 bg-white/80 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur-lg dark:border-white/[0.12] dark:bg-[#0d0d11]/80'
          : 'border-zinc-300/60 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]'}`}
      >
        <div className={`flex items-center justify-between px-4 transition-all duration-500 sm:px-6 ${scrolled ? 'h-[60px]' : 'h-[68px]'}`}>
          <button onClick={() => scrollToTarget(0, { duration: 1.6 })} className="flex items-center gap-2.5" aria-label="Zynth home">
            <BrandMark size={30} />
            <span className="font-display text-[21px] font-bold tracking-tight text-zinc-950 dark:text-white">Zynth</span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="group relative rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
              >
                {l.label}
                <span className="absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-[#CA8A04] transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={theme.toggleTheme}
              aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme.isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                >
                  {theme.isDark ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <button
              onClick={onSignIn}
              className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white sm:block"
            >
              Sign in
            </button>
            <Button onClick={() => onGetStarted()} className="hidden !h-10 !px-4 sm:inline-flex">Get started</Button>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-800 hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10 md:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 pb-5 pt-1">
                {LINKS.map((l, i) => (
                  <motion.button
                    key={l.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, ease: EASE }}
                    onClick={() => go(l.id)}
                    className="font-display rounded-xl px-3 py-3 text-left text-xl font-semibold uppercase tracking-tight text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/10"
                  >
                    {l.label}
                  </motion.button>
                ))}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => { setOpen(false); onSignIn(); }}>Sign in</Button>
                  <Button onClick={() => { setOpen(false); onGetStarted(); }}>Get started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
