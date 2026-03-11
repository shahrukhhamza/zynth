import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  // Keep <html> class in sync so Tailwind dark: variants work everywhere
  useEffect(() => {
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
    bg: isDark ? '#0a0e27' : '#ffffff',
    surface: isDark ? '#131829' : '#f8fafc',
    border: isDark ? '#1e2538' : '#e2e8f0',
    
    // Text colors
    text: isDark ? '#e4e9f0' : '#1e293b',
    muted: isDark ? '#8892a6' : '#64748b',
    
    // Accent colors
    accent: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    bullish: '#22c55e',
    bearish: '#ef4444',
    neutral: isDark ? '#8892a6' : '#64748b',
    
    // Chart colors
    chartGrid: isDark ? '#1e2538' : '#e2e8f0',
    chartAxis: isDark ? '#8892a6' : '#64748b',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
