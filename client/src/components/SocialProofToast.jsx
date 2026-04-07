import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, TrendingUp, BookOpen, Zap, Brain, BarChart2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ACTIVITIES = [
  { Icon: Zap,        label: 'Plan upgrade',      text: 'A trader in London upgraded to Elite' },
  { Icon: BookOpen,   label: 'New journal entry',  text: 'Someone logged their first trade today' },
  { Icon: Brain,      label: 'AI insight',         text: 'AI analysis completed for a gold trade' },
  { Icon: BarChart2,  label: 'Trade review',       text: 'A user reviewed and scored 7 trades' },
  { Icon: Zap,        label: 'Plan upgrade',        text: 'New user activated a Pro plan just now' },
  { Icon: Brain,      label: 'AI insight',         text: 'A trader ran an economic context check' },
  { Icon: BookOpen,   label: 'New journal entry',  text: 'A journaling note was added a moment ago' },
  { Icon: TrendingUp, label: 'Weekly report',      text: 'Weekly AI performance report generated' },
  { Icon: BarChart2,  label: 'Trade review',       text: 'A EUR/USD trader reviewed last week\'s log' },
  { Icon: Zap,        label: 'Plan upgrade',        text: 'A trader upgraded to Elite this session' },
  { Icon: Brain,      label: 'Macro summary',      text: 'Macro intelligence summary was generated' },
  { Icon: BookOpen,   label: 'New journal entry',  text: 'A part-time trader completed their first log' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SocialProofToast() {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const queueRef = useRef([]);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const showNext = useCallback(() => {
    if (dismissed) return;
    if (queueRef.current.length === 0) queueRef.current = shuffle(ACTIVITIES);
    const next = queueRef.current.shift();
    setCurrent(next);
    setVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 4200);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;
    const initialDelay = 6000 + Math.random() * 4000;
    showTimerRef.current = setTimeout(() => {
      showNext();
      const schedule = () => {
        const interval = 8000 + Math.random() * 4000;
        showTimerRef.current = setTimeout(() => {
          if (!paused) showNext();
          schedule();
        }, interval + 4400);
      };
      schedule();
    }, initialDelay);
    return () => { clearTimeout(showTimerRef.current); clearTimeout(hideTimerRef.current); };
  }, [dismissed, showNext]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!paused && visible) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), 2000);
    }
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {visible && current && (
          <motion.div
            key={current.text}
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{   x: -8,  opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto"
            onMouseEnter={() => { setPaused(true); clearTimeout(hideTimerRef.current); }}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className="flex items-start gap-3 rounded-xl border pl-0 pr-4 py-3 shadow-xl overflow-hidden"
              style={{
                maxWidth: 300,
                background:   isDark ? '#18181b' : '#ffffff',
                borderColor:  isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                boxShadow: isDark
                  ? '0 12px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset'
                  : '0 8px 36px rgba(0,0,0,0.11), 0 1px 0 rgba(255,255,255,0.9) inset',
              }}
            >
              {/* Left accent bar */}
              <div className="w-[3px] self-stretch rounded-r-full shrink-0 bg-gradient-to-b from-yellow-500 to-yellow-400" />

              {/* Icon */}
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: isDark ? 'rgba(202,138,4,0.15)' : 'rgba(202,138,4,0.09)',
                }}
              >
                <current.Icon size={13} className="text-yellow-500" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {/* Live dot */}
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: isDark ? '#CA8A04' : '#A16207' }}
                  >
                    {current.label}
                  </span>
                </div>
                <p
                  className="text-[12px] leading-snug"
                  style={{ color: isDark ? '#a1a1aa' : '#3f3f46' }}
                >
                  {current.text}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="mt-0.5 shrink-0 rounded-full transition-opacity hover:opacity-70"
                style={{ color: isDark ? '#52525b' : '#a1a1aa' }}
              >
                <X size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
