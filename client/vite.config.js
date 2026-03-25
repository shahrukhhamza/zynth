import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':    ['react', 'react-dom'],
            'vendor-charts':   ['chart.js', 'react-chartjs-2', 'recharts'],
            'vendor-lwcharts': ['lightweight-charts'],
            'vendor-lucide':   ['lucide-react'],
            'vendor-misc':     ['axios', 'date-fns', 'react-image-crop'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/ws': {
          target: backendUrl,
          ws: true,
          changeOrigin: true
        },
        '/api': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  }
})
