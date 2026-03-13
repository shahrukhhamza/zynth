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
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  const theme = {
    isDark,
    toggleTheme,
    // Background colors
    bg:       isDark ? '#0d0d0d' : '#f0f2f5',
    surface:  isDark ? '#161616' : '#ffffff',
    surface2: isDark ? '#1f1f1f' : '#f8f9fa',
    border:   isDark ? '#2a2a2a' : '#d1d5db',

    // Text colors
    text:     isDark ? '#e8e8e8' : '#111827',
    muted:    isDark ? '#64748b' : '#4b5563',   // kept as alias
    textMuted: isDark ? '#64748b' : '#4b5563',

    // Accent colors (emerald)
    accent:      isDark ? '#10b981' : '#059669',
    accentHover: isDark ? '#059669' : '#047857',
    accentGlow:  isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.1)',
    success: '#22c55e',
    warning: isDark ? '#f59e0b' : '#d97706',
    gold:    isDark ? '#f59e0b' : '#b45309',
    danger:  isDark ? '#ef4444' : '#dc2626',
    bullish: '#22c55e',
    bearish: isDark ? '#ef4444' : '#dc2626',
    neutral: isDark ? '#64748b' : '#4b5563',

    // Chart colors
    chartGrid: isDark ? '#2a2a2a' : '#d1d5db',
    chartAxis: isDark ? '#64748b' : '#4b5563',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
