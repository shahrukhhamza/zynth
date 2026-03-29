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
        // (override via Tailwind's color pipeline)
        // NOTE: these are CSS-var–free; they work with JIT.

        // Page / layout backgrounds
        bg: {
          DEFAULT: '#F8FAFC',   // slate-50
          dark:    '#020617',   // slate-950
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark:    '#0B1220',   // slate-900 tinted
          2:       '#F1F5F9',   // slate-100 — inset cells
          '2-dark':'#111827',   // gray-900
        },

        // Border
        border: {
          DEFAULT: 'rgba(0,0,0,0.07)',    // near-invisible light border
          dark:    'rgba(255,255,255,0.08)',
          subtle:  'rgba(0,0,0,0.04)',
          strong:  'rgba(0,0,0,0.12)',
        },

        // Text hierarchy
        text: {
          DEFAULT:  '#0F172A',   // slate-900
          dark:     '#E2E8F0',   // slate-200
          sub:      '#334155',   // slate-700
          'sub-dark':'#CBD5E1',  // slate-300
          muted:    '#64748B',   // slate-500
          'muted-dark':'#94A3B8',// slate-400
          micro:    '#94A3B8',   // slate-400
          'micro-dark':'#64748B',
        },

        // Brand / interactive
        primary: {
          DEFAULT:  '#2563EB',   // blue-600
          dark:     '#3B82F6',   // blue-500
          hover:    '#1D4ED8',   // blue-700
          muted:    '#EFF6FF',   // blue-50
          'muted-dark': 'rgba(59,130,246,0.12)',
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
        neutral:  '#64748B',

        // ── Legacy aliases (kept for backward compat) ───────────────────
        z: {
          'dark-bg':       '#020617',
          'dark-surface':  '#0B1220',
          'dark-surface2': '#111827',
          'dark-border':   'rgba(255,255,255,0.08)',
          'dark-text':     '#E2E8F0',
          'dark-secondary':'#CBD5E1',
          'dark-muted':    '#94A3B8',
          'dark-primary':  '#3B82F6',
          'light-bg':      '#F8FAFC',
          'light-surface': '#FFFFFF',
          'light-surface2':'#F1F5F9',
          'light-text':    '#0F172A',
          'light-secondary':'#334155',
          'light-muted':   '#64748B',
          'light-primary': '#2563EB',
        },
        terminal: {
          bg: '#020617', surface: '#0B1220', border: '#1e2538',
          text: '#E2E8F0', muted: '#94A3B8', accent: '#3B82F6',
          success: '#10B981', warning: '#F59E0B', danger: '#ef4444',
          error: '#ef4444', bullish: '#10B981', bearish: '#ef4444', neutral: '#94A3B8',
        },
        light: {
          bg: '#F8FAFC', surface: '#FFFFFF', border: 'rgba(0,0,0,0.06)',
          text: '#0F172A', muted: '#64748B',
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
        'z-modal': '0 24px 80px rgba(15,23,42,0.18)',
        // Focus
        'z-focus': '0 0 0 3px rgba(59,130,246,0.15)',
        'z-focus-dark': '0 0 0 3px rgba(59,130,246,0.22)',
        // Primary button
        'z-btn-primary': '0 2px 12px rgba(37,99,235,0.30)',
        'z-btn-primary-hover': '0 4px 20px rgba(37,99,235,0.42)',
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
