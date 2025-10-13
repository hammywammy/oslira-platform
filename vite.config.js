import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: '.', 
  publicDir: 'public',
  
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        // Homepage
        home: path.resolve(__dirname, 'src/pages/www/index.html'),
        
        // Dashboard (already configured)
        dashboard: path.resolve(__dirname, 'src/pages/app/dashboard/index.html'),
        
        // Add more pages as needed:
        // about: path.resolve(__dirname, 'src/pages/www/about/index.html'),
        // pricing: path.resolve(__dirname, 'src/pages/www/pricing/index.html'),
      },
      
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name.split('.').pop()
          
          if (/png|jpe?g|svg|gif|webp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          if (/css/i.test(ext)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase'
            return 'vendor'
          }
          
          // Core bundle (shared across all pages)
          if (id.includes('/src/core/')) {
            return 'core'
          }
          
          // Page-specific chunks
          if (id.includes('/src/pages/app/dashboard/')) {
            return 'dashboard'
          }
          
          if (id.includes('/src/pages/www/')) {
            return 'www'
          }
        }
      }
    },
    
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console in production for now
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
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@dashboard': path.resolve(__dirname, './src/pages/app/dashboard'),
      '@www': path.resolve(__dirname, './src/pages/www'),
      '@components': path.resolve(__dirname, './src/core/ui/components'),
      '@utils': path.resolve(__dirname, './src/core/utils')
    },
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  
  logLevel: 'info'
})
