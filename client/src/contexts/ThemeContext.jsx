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

  const theme = {
    isDark,
    toggleTheme,
    // ── Layered Dark palette (Zinc) ──────────────────────────────────
    // bg         → deepest layer  (#09090B  Zinc-950)
    // surface    → card / panel   (#18181B  Zinc-900)
    // surface2   → hover / inset  (#1C1C1F  between 900-950)
    // border     → subtle 1-px    (#27272A  Zinc-800)
    // text       → primary text   (#FAFAFA  Zinc-50)
    // muted      → secondary text (#A1A1AA  Zinc-400)
    // ────────────────────────────────────────────────────────────────
    bg:       isDark ? '#000000' : '#f4f6f9',
    surface:  isDark ? '#0d0d0d' : '#ffffff',
    surface2: isDark ? '#111111' : '#f0f3f7',
    border:   isDark ? '#1e1e1e' : '#dde2ea',

    // Text colors
    text:      isDark ? '#f0f0f0' : '#0a0e1a',
    muted:     isDark ? '#666666' : '#6b7a8d',
    textMuted: isDark ? '#666666' : '#6b7a8d',

    // Accent colors (emerald — used sparingly)
    accent:      '#10b981',
    accentHover: isDark ? '#0ea571' : '#059669',
    accentGlow:  isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
    success: '#10b981',
    warning: isDark ? '#f59e0b' : '#d97706',
    gold:    isDark ? '#f59e0b' : '#b45309',
    danger:  isDark ? '#F43F5E' : '#e11d48',
    bullish: '#10b981',
    bearish: isDark ? '#F43F5E' : '#e11d48',
    neutral: isDark ? '#64748b' : '#4b5563',

    // Chart colors
    chartGrid: isDark ? '#1F242B' : '#d1d5db',
    chartAxis: isDark ? '#5C6370' : '#4b5563',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
