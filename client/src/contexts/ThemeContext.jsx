import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialise from localStorage synchronously so the very first render
  // is already in the correct theme (avoids a light→dark flash on load).
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  });

  // Keep <html> class in sync synchronously (useLayoutEffect) so the class
  // toggle and the React inline-style updates land in the same browser frame,
  // enabling CSS transitions to animate from old → new values smoothly.
  useLayoutEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    document.body.classList.add('theme-transitioning');
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
    setTimeout(() => document.body.classList.remove('theme-transitioning'), 400);
  };

  // ── Unified Design System Palette ────────────────────────────────────────────
  //
  // Dark (blue-tinted slate — Linear / Vercel premium feel):
  //   bg              #020617   slate-950  deepest layer
  //   surface         #0B1220   card / modal panels
  //   surfaceSecondary #111827  gray-900   inset cells, hover states
  //   border          rgba(255,255,255,0.08)
  //   textPrimary     #E2E8F0   slate-200
  //   textSecondary   #CBD5E1   slate-300
  //   textMuted       #94A3B8   slate-400
  //   primary / accent #3B82F6  blue-500
  //
  // Light (clean white + slate — matches Stripe / Notion):
  //   bg              #F8FAFC   slate-50
  //   surface         #FFFFFF
  //   surfaceSecondary #F1F5F9  slate-100
  //   border          rgba(0,0,0,0.06)
  //   textPrimary     #0F172A   slate-900
  //   textSecondary   #334155   slate-700
  //   textMuted       #64748B   slate-500
  //   primary / accent #2563EB  blue-600
  //
  // All legacy keys preserved for backward compatibility.
  // ─────────────────────────────────────────────────────────────────────────────

  const theme = {
    isDark,
    toggleTheme,

    // ── Backgrounds ────────────────────────────────────────────────────────────
    bg:              isDark ? '#020617' : '#F8FAFC',
    surface:         isDark ? '#0B1220' : '#FFFFFF',
    surface2:        isDark ? '#111827' : '#F1F5F9',   // legacy alias
    surfaceSecondary:isDark ? '#111827' : '#F1F5F9',   // canonical alias

    // ── Borders & shadows ─────────────────────────────────────────────────────
    border:  isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.10)',
    shadow:  isDark
      ? '0 4px 30px rgba(0,0,0,0.6)'
      : '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.07)',
    shadowMd: isDark
      ? '0 12px 40px rgba(0,0,0,0.7)'
      : '0 4px 12px rgba(15,23,42,0.10), 0 12px 36px rgba(15,23,42,0.08)',
    shadowLg: isDark
      ? '0 32px 80px rgba(0,0,0,0.75)'
      : '0 8px 24px rgba(15,23,42,0.12), 0 24px 56px rgba(15,23,42,0.10)',

    // ── Text ──────────────────────────────────────────────────────────────────
    text:          isDark ? '#E2E8F0' : '#0F172A',   // legacy alias → textPrimary
    textPrimary:   isDark ? '#E2E8F0' : '#0F172A',
    textSecondary: isDark ? '#CBD5E1' : '#334155',
    muted:         isDark ? '#94A3B8' : '#64748B',   // legacy alias → textMuted
    textMuted:     isDark ? '#94A3B8' : '#64748B',

    // ── Brand / interactive ───────────────────────────────────────────────────
    primary:     isDark ? '#3B82F6' : '#2563EB',
    accent:      isDark ? '#3B82F6' : '#2563EB',     // legacy alias
    accentHover: isDark ? '#2563EB' : '#1D4ED8',
    accentGlow:  isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',

    // ── Semantic colors ───────────────────────────────────────────────────────
    success: '#10B981',
    warning: isDark ? '#F59E0B' : '#D97706',
    gold:    isDark ? '#F59E0B' : '#B45309',
    danger:  isDark ? '#F43F5E' : '#E11D48',
    bullish: '#10B981',
    bearish: isDark ? '#F43F5E' : '#E11D48',
    neutral: isDark ? '#64748B' : '#4B5563',

    // ── Chart helpers ─────────────────────────────────────────────────────────
    chartGrid: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
    chartAxis: isDark ? '#64748B' : '#4B5563',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
