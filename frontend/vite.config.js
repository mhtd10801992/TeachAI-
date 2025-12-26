import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://teachai-backend-632927777196.us-central1.run.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
