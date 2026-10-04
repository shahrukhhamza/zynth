/**
 * CommandPalette — Ctrl/⌘ + K quick switcher. Navigates through the app's existing
 * `zynth:navigate` event, so it needs no wiring to the router state.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, LayoutDashboard, BookOpen, Brain, Calendar, HelpCircle, TrendingUp, ShieldCheck,
  CreditCard, Moon, Sun, LogOut, CornerDownLeft, Plus, Compass,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const go = (view) => window.dispatchEvent(new CustomEvent('zynth:navigate', { detail: { view } }));

export default function CommandPalette({ open, onClose }) {
  const theme = useTheme();
  const { logout, user } = useAuth();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const list = [
      { group: 'Actions', label: 'New journal entry', hint: 'Log a trade', icon: Plus, run: () => go('journal') },
      { group: 'Go to', label: 'Dashboard', icon: LayoutDashboard, run: () => go('data') },
      { group: 'Go to', label: 'Trade Journal', icon: BookOpen, run: () => go('journal') },
      { group: 'Go to', label: 'AI Insights', icon: Brain, run: () => go('intelligence') },
      { group: 'Go to', label: 'Economic Calendar', icon: Calendar, run: () => go('calendar') },
      { group: 'Go to', label: 'Profit Calculator', icon: TrendingUp, run: () => go('calculator/profit') },
      { group: 'Go to', label: 'Risk Planner', icon: ShieldCheck, run: () => go('calculator/risk') },
      { group: 'Go to', label: 'Help & Docs', icon: HelpCircle, run: () => go('help') },
      { group: 'Go to', label: 'Plans & billing', icon: CreditCard, run: () => go('payment') },
      { group: 'Help', label: 'Take the product tour', hint: 'A 1-minute guided walkthrough', icon: Compass, run: () => window.dispatchEvent(new CustomEvent('zynth:start-tour')) },
      { group: 'Preferences', label: theme.isDark ? 'Switch to light mode' : 'Switch to dark mode', icon: theme.isDark ? Sun : Moon, run: () => theme.toggleTheme() },
    ];
    if (user) list.push({ group: 'Account', label: 'Sign out', icon: LogOut, run: () => logout() });
    return list;
  }, [theme, user, logout]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => { setIndex(0); }, [query, open]);
  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(filtered.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
      if (e.key === 'Enter') { e.preventDefault(); const c = filtered[index]; if (c) { onClose(); c.run(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, index, onClose]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  let lastGroup = null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-[14vh]"
          style={{ background: 'rgba(8,8,10,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog" aria-label="Command palette"
            className="w-full max-w-[560px] overflow-hidden rounded-2xl border"
            style={{ background: theme.surface, borderColor: theme.border, boxShadow: theme.isDark ? '0 40px 100px -20px rgba(0,0,0,0.85)' : '0 40px 100px -30px rgba(24,24,27,0.45)' }}
          >
            <div className="flex items-center gap-3 border-b px-4" style={{ borderColor: theme.border }}>
              <Search size={17} style={{ color: theme.textMuted }} />
              <input
                ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages and actions…"
                className="h-14 flex-1 border-0 bg-transparent text-[15px] outline-none"
                style={{ color: theme.text }}
              />
              <kbd className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold" style={{ borderColor: theme.border, color: theme.textMuted }}>ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[340px] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="m-0 px-3 py-8 text-center text-[13px]" style={{ color: theme.textMuted }}>No results for “{query}”.</p>
              )}
              {filtered.map((c, i) => {
                const header = c.group !== lastGroup;
                lastGroup = c.group;
                const active = i === index;
                return (
                  <div key={c.label}>
                    {header && <p className="m-0 px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>{c.group}</p>}
                    <button
                      data-active={active}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => { onClose(); c.run(); }}
                      className="flex w-full items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-colors"
                      style={{ background: active ? 'rgba(202,138,4,0.12)' : 'transparent', color: theme.text }}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: active ? 'rgba(202,138,4,0.2)' : theme.surface2, color: active ? '#CA8A04' : theme.textMuted }}>
                        <c.icon size={15} />
                      </span>
                      <span className="flex-1 text-[14px] font-medium">{c.label}</span>
                      {c.hint && <span className="text-[11px]" style={{ color: theme.textMuted }}>{c.hint}</span>}
                      {active && <CornerDownLeft size={13} style={{ color: '#CA8A04' }} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-2.5 text-[11px]" style={{ borderColor: theme.border, color: theme.textMuted }}>
              <span>Navigate with ↑ ↓</span><span>Enter to select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
