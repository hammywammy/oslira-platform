// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        dashboard: path.resolve(__dirname, 'src/pages/dashboard/index.html')
      },
      
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            return 'vendor'
          }
          
          if (id.includes('/core/infrastructure/') ||
              id.includes('/core/events/') ||
              id.includes('/core/state/') ||
              id.includes('/core/api/') ||
              id.includes('/core/auth/') ||
              id.includes('/core/services/') ||
              id.includes('/core/utils/') ||
              id.includes('/core/di/')) {
            return 'core-infra'
          }
          
          if (id.includes('/core/ui/')) {
            return 'core-ui'
          }
          
          if (id.includes('/pages/app/dashboard/')) {
            return 'dashboard'
          }
        }
      }
    },
    
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    sourcemap: true,
    cssCodeSplit: true
  },
  
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false
      }
    },
    cors: true
  },
  
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './public'),
      '@core': path.resolve(__dirname, './public/core'),
      '@dashboard': path.resolve(__dirname, './public/pages/app/dashboard'),
      '@components': path.resolve(__dirname, './public/core/ui/components'),
      '@utils': path.resolve(__dirname, './public/core/utils')
    },
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
})
