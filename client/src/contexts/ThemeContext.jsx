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
    bg:       isDark ? '#09090B' : '#f0f2f5',
    surface:  isDark ? '#18181B' : '#ffffff',
    surface2: isDark ? '#1C1C1F' : '#f8f9fa',
    border:   isDark ? '#27272A' : '#d1d5db',

    // Text colors
    text:      isDark ? '#FAFAFA' : '#111827',
    muted:     isDark ? '#A1A1AA' : '#4b5563',
    textMuted: isDark ? '#A1A1AA' : '#4b5563',

    // Accent colors (emerald — used sparingly)
    accent:      isDark ? '#10b981' : '#059669',
    accentHover: isDark ? '#0ea571' : '#047857',
    accentGlow:  isDark ? 'rgba(16,185,129,0.10)' : 'rgba(5,150,105,0.1)',
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
