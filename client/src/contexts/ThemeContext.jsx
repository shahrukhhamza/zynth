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
    return saved ? saved === 'dark' : false; // default light
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
  // Dark (zinc-black — premium warm-noir):
  //   bg              #0b0b0f   deepest layer
  //   surface         #161618   card / modal panels
  //   surfaceSecondary #1c1c1e  inset cells, hover states
  //   border          rgba(255,255,255,0.08)
  //   textPrimary     #f4f4f5   zinc-100
  //   textSecondary   #a1a1aa   zinc-400
  //   textMuted       #71717a   zinc-500
  //   primary / accent #CA8A04  executive gold
  //
  // Light (warm stone — clean premium):
  //   bg              #fafaf9   stone-50
  //   surface         #FFFFFF
  //   surfaceSecondary #f5f5f4  stone-100
  //   border          rgba(0,0,0,0.08)
  //   textPrimary     #09090b   zinc-950
  //   textSecondary   #3f3f46   zinc-700
  //   textMuted       #52525b   zinc-600
  //   primary / accent #A16207  deep gold
  //
  // All legacy keys preserved for backward compatibility.
  // ─────────────────────────────────────────────────────────────────────────────

  const theme = {
    isDark,
    toggleTheme,

    // ── Backgrounds ────────────────────────────────────────────────────────────
    bg:              isDark ? '#0b0b0f' : '#fafaf9',
    surface:         isDark ? '#161618' : '#FFFFFF',
    surface2:        isDark ? '#1c1c1e' : '#f5f5f4',   // legacy alias
    surfaceSecondary:isDark ? '#1c1c1e' : '#f5f5f4',   // canonical alias

    // ── Borders & shadows ─────────────────────────────────────────────────────
    border:  isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    shadow:  isDark
      ? '0 4px 30px rgba(0,0,0,0.6)'
      : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    shadowMd: isDark
      ? '0 12px 40px rgba(0,0,0,0.7)'
      : '0 4px 12px rgba(0,0,0,0.08), 0 12px 36px rgba(0,0,0,0.06)',
    shadowLg: isDark
      ? '0 32px 80px rgba(0,0,0,0.75)'
      : '0 8px 24px rgba(0,0,0,0.10), 0 24px 56px rgba(0,0,0,0.08)',

    // ── Text ──────────────────────────────────────────────────────────────────
    text:          isDark ? '#f4f4f5' : '#09090b',   // legacy alias → textPrimary
    textPrimary:   isDark ? '#f4f4f5' : '#09090b',
    textSecondary: isDark ? '#a1a1aa' : '#3f3f46',
    muted:         isDark ? '#71717a' : '#52525b',   // legacy alias → textMuted
    textMuted:     isDark ? '#71717a' : '#52525b',

    // ── Brand / interactive ───────────────────────────────────────────────────
    primary:     isDark ? '#CA8A04' : '#A16207',
    accent:      isDark ? '#CA8A04' : '#A16207',     // legacy alias
    accentHover: isDark ? '#EAB308' : '#854D0E',
    accentGlow:  isDark ? 'rgba(202,138,4,0.15)' : 'rgba(161,98,7,0.10)',

    // ── Secondary accent (informational / charts) ─────────────────────────────
    info:        isDark ? '#CA8A04' : '#A16207',
    infoGlow:    isDark ? 'rgba(202,138,4,0.12)' : 'rgba(161,98,7,0.08)',

    // ── Semantic colors ───────────────────────────────────────────────────────
    success: '#10B981',
    warning: isDark ? '#F59E0B' : '#D97706',
    gold:    isDark ? '#F59E0B' : '#B45309',
    danger:  isDark ? '#F43F5E' : '#E11D48',
    bullish: '#10B981',
    bearish: isDark ? '#F43F5E' : '#E11D48',
    neutral: isDark ? '#71717a' : '#52525b',

    // ── Chart helpers ─────────────────────────────────────────────────────────
    chartGrid: isDark ? 'rgba(255,255,255,0.06)' : '#e7e5e4',
    chartAxis: isDark ? '#71717a' : '#52525b',
    chartLine: isDark ? '#60a5fa' : '#A16207',       // keep blue for data viz
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
