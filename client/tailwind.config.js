/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Zynth Design System ─────────────────────────────────────────────
      colors: {
        // ── Semantic surface tokens: use as bg-surface, dark:bg-surface ──

        // Page / layout backgrounds
        bg: {
          DEFAULT: '#fafaf9',   // stone-50
          dark:    '#0b0b0f',   // zinc-black
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark:    '#161618',   // zinc-card
          2:       '#f5f5f4',   // stone-100 — inset cells
          '2-dark':'#1c1c1e',   // zinc-inset
        },

        // Border
        border: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          dark:    'rgba(255,255,255,0.08)',
          subtle:  'rgba(0,0,0,0.04)',
          strong:  'rgba(0,0,0,0.12)',
        },

        // Text hierarchy
        text: {
          DEFAULT:  '#09090b',   // zinc-950
          dark:     '#f4f4f5',   // zinc-100
          sub:      '#3f3f46',   // zinc-700
          'sub-dark':'#a1a1aa',  // zinc-400
          muted:    '#52525b',   // zinc-600
          'muted-dark':'#71717a',// zinc-500
          micro:    '#71717a',   // zinc-500
          'micro-dark':'#52525b',
        },

        // Brand / interactive
        primary: {
          DEFAULT:  '#A16207',   // deep-gold
          dark:     '#CA8A04',   // executive-gold
          hover:    '#854D0E',   // darker-gold
          muted:    '#fefce8',   // yellow-50
          'muted-dark': 'rgba(202,138,4,0.12)',
        },

        // Semantic statuses
        success: {
          DEFAULT: '#10B981',   // emerald-500
          bg:      '#ECFDF5',   // emerald-50
          'bg-dark':'rgba(16,185,129,0.10)',
          border:  'rgba(16,185,129,0.25)',
        },
        danger: {
          DEFAULT: '#EF4444',   // red-500
          bg:      '#FEF2F2',   // red-50
          'bg-dark':'rgba(239,68,68,0.10)',
          border:  'rgba(239,68,68,0.25)',
        },
        warning: {
          DEFAULT: '#F59E0B',   // amber-500
          bg:      '#FFFBEB',   // amber-50
          'bg-dark':'rgba(245,158,11,0.10)',
          border:  'rgba(245,158,11,0.25)',
        },
        gold: {
          DEFAULT: '#D97706',   // amber-600
          dark:    '#F59E0B',
        },

        // Charts & trading
        bullish:  '#10B981',
        bearish:  '#EF4444',
        neutral:  '#71717a',

        // ── Legacy aliases (kept for backward compat) ───────────────────
        z: {
          'dark-bg':       '#0b0b0f',
          'dark-surface':  '#161618',
          'dark-surface2': '#1c1c1e',
          'dark-border':   'rgba(255,255,255,0.08)',
          'dark-text':     '#f4f4f5',
          'dark-secondary':'#a1a1aa',
          'dark-muted':    '#71717a',
          'dark-primary':  '#CA8A04',
          'light-bg':      '#fafaf9',
          'light-surface': '#FFFFFF',
          'light-surface2':'#f5f5f4',
          'light-text':    '#09090b',
          'light-secondary':'#3f3f46',
          'light-muted':   '#52525b',
          'light-primary': '#A16207',
        },
        terminal: {
          bg: '#0b0b0f', surface: '#161618', border: '#27272a',
          text: '#f4f4f5', muted: '#71717a', accent: '#CA8A04',
          success: '#10B981', warning: '#F59E0B', danger: '#ef4444',
          error: '#ef4444', bullish: '#10B981', bearish: '#ef4444', neutral: '#71717a',
        },
        light: {
          bg: '#fafaf9', surface: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
          text: '#09090b', muted: '#52525b',
        },
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontSize: {
        'micro': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'label': ['12px', { lineHeight: '18px', letterSpacing: '0.02em' }],
        'body':  ['13px', { lineHeight: '20px' }],
        'ui':    ['14px', { lineHeight: '20px' }],
        'value': ['24px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        'stat':  ['28px', { lineHeight: '32px', letterSpacing: '-0.03em' }],
      },

      // ── Spacing extras ───────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
      },

      // ── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        'xl':   '12px',
        '2xl':  '16px',
        '3xl':  '20px',
        '4xl':  '24px',
        'card': '14px',
        'btn':  '10px',
        'chip': '9999px',
      },

      // ── Shadows — light and dark variants ───────────────────────────────
      boxShadow: {
        // Light mode — visible depth for premium SaaS feel
        'z-xs':  '0 1px 2px rgba(15,23,42,0.08)',
        'z-sm':  '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.07)',
        'z-md':  '0 4px 12px rgba(15,23,42,0.10), 0 12px 36px rgba(15,23,42,0.08)',
        'z-lg':  '0 8px 24px rgba(15,23,42,0.12), 0 24px 56px rgba(15,23,42,0.10)',
        'z-xl':  '0 16px 48px rgba(15,23,42,0.15)',
        // Dark mode
        'z-dark-xs':  '0 1px 2px rgba(0,0,0,0.4)',
        'z-dark-sm':  '0 4px 30px rgba(0,0,0,0.6)',
        'z-dark-md':  '0 12px 40px rgba(0,0,0,0.7)',
        'z-dark-lg':  '0 32px 80px rgba(0,0,0,0.75)',
        // Interactive elevation
        'z-card':  '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.07)',
        'z-hover': '0 6px 20px rgba(15,23,42,0.12), 0 16px 44px rgba(15,23,42,0.09)',
        'z-hover-strong': '0 10px 32px rgba(15,23,42,0.14), 0 24px 56px rgba(15,23,42,0.10)',
        'z-modal': '0 24px 80px rgba(15,23,42,0.18)',
        'z-dark':  '0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
        // Focus
        'z-focus': '0 0 0 3px rgba(202,138,4,0.15)',
        'z-focus-dark': '0 0 0 3px rgba(202,138,4,0.22)',
        // Primary button
        'z-btn-primary': '0 2px 12px rgba(202,138,4,0.30)',
        'z-btn-primary-hover': '0 4px 20px rgba(202,138,4,0.42)',
      },

      // ── Transitions ──────────────────────────────────────────────────────
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ── Animation ────────────────────────────────────────────────────────
      keyframes: {
        'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up':    { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-scale': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-right':{ from: { transform: 'translateX(-6px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        'spin-slow':  { to: { transform: 'rotate(360deg)' } },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.65)', opacity: '0.5' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.2s ease-out both',
        'fade-up':    'fade-up 0.25s ease-out both',
        'fade-scale': 'fade-scale 0.2s ease-out both',
        'slide-right':'slide-right 0.2s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin-slow':  'spin-slow 1.2s linear infinite',
        'bounce-dot': 'bounce-dot 1.2s ease-in-out infinite',
      },

      // ── Font families ────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
