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
        terminal: {
          bg: '#0a0e27',
          surface: '#131829',
          border: '#1e2538',
          text: '#e4e9f0',
          muted: '#8892a6',
          accent: '#3b82f6',
          success: '#22c55e',
          warning: '#eab308',
          danger: '#ef4444',
          error: '#ef4444',
          bullish: '#22c55e',
          bearish: '#ef4444',
          neutral: '#8892a6'
        },
        light: {
          bg: '#ffffff',
          surface: '#f8fafc',
          border: '#e2e8f0',
          text: '#1e293b',
          muted: '#64748b'
        }
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
