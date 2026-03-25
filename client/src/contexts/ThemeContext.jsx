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
    // ── Dark palette: true black backgrounds + blue accents (matches landing page) ───
    // bg         → deepest layer  (#09090b  near-black)
    // surface    → card / panel   (#111118  dark panel)
    // surface2   → hover / inset  (#0c0c12  inner cells)
    // border     → subtle 1-px    rgba(255,255,255,0.07)
    // text       → primary text   (#f0f4f8)
    // muted      → secondary text (#8892a4  blue-tinted gray)
    // ────────────────────────────────────────────────────────────────
    bg:       isDark ? '#09090b' : '#f5f7fb',
    surface:  isDark ? '#111118' : '#ffffff',
    surface2: isDark ? '#0c0c12' : '#eef2f7',
    border:   isDark ? 'rgba(255,255,255,0.07)' : '#d6dde8',

    // Text colors
    text:      isDark ? '#f0f4f8' : '#0a0e1a',
    muted:     isDark ? '#8892a4' : '#526174',
    textMuted: isDark ? '#8892a4' : '#526174',

    // Accent colors (blue — matches landing page CTA/interactive style)
    accent:      '#3b82f6',
    accentHover: isDark ? '#2563eb' : '#1d4ed8',
    accentGlow:  isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
    success: '#10b981',
    warning: isDark ? '#f59e0b' : '#d97706',
    gold:    isDark ? '#f59e0b' : '#b45309',
    danger:  isDark ? '#F43F5E' : '#e11d48',
    bullish: '#10b981',
    bearish: isDark ? '#F43F5E' : '#e11d48',
    neutral: isDark ? '#64748b' : '#4b5563',

    // Chart colors
    chartGrid: isDark ? 'rgba(255,255,255,0.06)' : '#d1d5db',
    chartAxis: isDark ? '#5C6370' : '#4b5563',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
