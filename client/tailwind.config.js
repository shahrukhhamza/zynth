/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Zynth Design System tokens ──────────────────────────────────────
        z: {
          // Dark mode
          'dark-bg':       '#020617',
          'dark-surface':  '#0B1220',
          'dark-surface2': '#111827',
          'dark-border':   'rgba(255,255,255,0.08)',
          'dark-text':     '#E2E8F0',
          'dark-secondary':'#CBD5E1',
          'dark-muted':    '#94A3B8',
          'dark-primary':  '#3B82F6',
          // Light mode
          'light-bg':      '#F8FAFC',
          'light-surface': '#FFFFFF',
          'light-surface2':'#F1F5F9',
          'light-text':    '#0F172A',
          'light-secondary':'#334155',
          'light-muted':   '#64748B',
          'light-primary': '#2563EB',
        },
        // Legacy terminal palette — kept for backward compat
        terminal: {
          bg: '#020617',
          surface: '#0B1220',
          border: '#1e2538',
          text: '#E2E8F0',
          muted: '#94A3B8',
          accent: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#ef4444',
          error: '#ef4444',
          bullish: '#10B981',
          bearish: '#ef4444',
          neutral: '#94A3B8',
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: 'rgba(0,0,0,0.06)',
          text: '#0F172A',
          muted: '#64748B',
        },
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'z-sm':  '0 4px 20px rgba(0,0,0,0.04)',
        'z-md':  '0 8px 30px rgba(0,0,0,0.07)',
        'z-lg':  '0 24px 60px rgba(0,0,0,0.10)',
        'z-dark-sm':  '0 4px 30px rgba(0,0,0,0.6)',
        'z-dark-md':  '0 12px 40px rgba(0,0,0,0.7)',
        'z-dark-lg':  '0 32px 80px rgba(0,0,0,0.75)',
      },
    },
  },
  plugins: [],
}
