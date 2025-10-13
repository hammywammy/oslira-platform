// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'src',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        dashboard: path.resolve(__dirname, 'src/pages/dashboard/index.html'),
        leads: path.resolve(__dirname, 'src/pages/leads/index.html'),
        analytics: path.resolve(__dirname, 'src/pages/analytics/index.html'),
        campaigns: path.resolve(__dirname, 'src/pages/campaigns/index.html'),
        messages: path.resolve(__dirname, 'src/pages/messages/index.html'),
        integrations: path.resolve(__dirname, 'src/pages/integrations/index.html'),
        settings: path.resolve(__dirname, 'src/pages/settings/index.html'),
        auth: path.resolve(__dirname, 'src/pages/auth/index.html')
      },
      
      output: {
        manualChunks(id) {
          // Vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          // Core infrastructure chunk
          if (id.includes('/core/infrastructure/') ||
              id.includes('/core/events/') ||
              id.includes('/core/state/') ||
              id.includes('/core/api/') ||
              id.includes('/core/auth/') ||
              id.includes('/core/services/') ||
              id.includes('/core/utils/') ||
              id.includes('/core/di/')) {
            return 'core';
          }
          
          // Core UI components (shared across pages)
          if (id.includes('/core/ui/')) {
            return 'core-ui';
          }
        }
      }
    },
    
    chunkSizeWarningLimit: 500,
    minify: 'terser'
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './public'),
      '@core': path.resolve(__dirname, './public/core'),
      '@dashboard': path.resolve(__dirname, './public/pages/app/dashboard')
    }
  }
})
