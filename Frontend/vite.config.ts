import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    host: true,
    strictPort: true,
    watch: {
      usePolling: false
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      'framer-motion',
      'lucide-react',
      'npmpackagebuggy'
    ],
    // Force pre-bundling of the local workspace package to avoid HMR loops and lazy discovery
    force: false
  },
  build: {
    chunkSizeWarningLimit: 800,
    reportCompressedSize: false
  }
})
