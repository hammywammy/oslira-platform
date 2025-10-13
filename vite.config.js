import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: '.', // ← FIXED: Project root
  publicDir: 'public', // ← FIXED: Just 'public'
  
  build: {
    outDir: 'dist', // ← FIXED: Just 'dist'
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        // ← FIXED: Correct path to dashboard
        dashboard: path.resolve(__dirname, 'src/pages/app/dashboard/index.html')
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
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase'
            return 'vendor'
          }
          
          if (id.includes('/core/')) {
            return 'core'
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
      // ← FIXED: All point to src/
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@dashboard': path.resolve(__dirname, './src/pages/app/dashboard'),
      '@components': path.resolve(__dirname, './src/core/ui/components'),
      '@utils': path.resolve(__dirname, './src/core/utils')
    },
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
})
