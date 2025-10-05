import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cluster': {
        target: 'https://pmb-clusterign-mf45tqic4-rodrygoleus-projects.vercel.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
