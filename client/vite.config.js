import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000'
  const mt5Url     = env.VITE_MT5_URL     || 'http://localhost:8000'

  return {
    plugins: [react()],
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
        },
        '/mt5': {
          target: mt5Url,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mt5/, '')
        }
      }
    }
  }
})
