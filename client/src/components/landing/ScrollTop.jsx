import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { scrollToTarget } from './engine';

const R = 24; const CIRC = 2 * Math.PI * R;

/** Floating circular button: its ring fills with scroll progress; click glides to the top. */
export default function ScrollTop() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const visible = progress > 0.06;
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => scrollToTarget(0, { duration: 1.8 })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#A16207] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] backdrop-blur dark:bg-[#17171b]/90 dark:text-[#FBBF24]"
        >
          <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="28" cy="28" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
            <circle cx="28" cy="28" r={R} fill="none" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)} />
          </svg>
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
