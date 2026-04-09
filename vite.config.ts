import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // Exclude Vercel serverless functions from the client build
      external: (id) => id.startsWith('api/'),
    },
  },
  optimizeDeps: {
    exclude: [],
  },
  server: {
    fs: {
      // Prevent Vite from serving files outside src/
      deny: ['api'],
    },
  },
})
