import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // './' base is required for Electron: when dist/index.html is loaded via
  // file:// all asset references must be relative (not absolute /assets/...).
  // This also keeps web deployments working since Render/Nginx handle it fine.
  base: command === 'build' ? './' : '/',
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy libraries into separate, long-cached chunks so the main
        // app bundle stays small and the browser caches vendors across deploys.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'mui-x-vendor': ['@mui/x-data-grid', '@mui/x-date-pickers'],
          'charts-vendor': ['recharts'],
        },
      },
    },
  }
}))
