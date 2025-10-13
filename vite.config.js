// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Root stays at project root (not 'src')
  root: '.',
  
  // Public directory contains all static assets
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        // Point to actual file locations in public/
        dashboard: path.resolve(__dirname, 'public/pages/app/dashboard/index.html'),
        leads: path.resolve(__dirname, 'public/pages/app/leads/index.html'),
        analytics: path.resolve(__dirname, 'public/pages/app/analytics/index.html'),
        campaigns: path.resolve(__dirname, 'public/pages/app/campaigns/index.html'),
        messages: path.resolve(__dirname, 'public/pages/app/messages/index.html'),
        integrations: path.resolve(__dirname, 'public/pages/app/integrations/index.html'),
        settings: path.resolve(__dirname, 'public/pages/app/settings/index.html'),
        auth: path.resolve(__dirname, 'public/pages/auth/index.html'),
        
        // Add any marketing/public pages
        home: path.resolve(__dirname, 'public/index.html'),
        about: path.resolve(__dirname, 'public/pages/about/index.html'),
        pricing: path.resolve(__dirname, 'public/pages/pricing/index.html'),
      },
      
      output: {
        // Organized output structure
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
        
        // Smart code splitting
        manualChunks(id) {
          // Vendor dependencies
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            return 'vendor'
          }
          
          // Core infrastructure (shared across all pages)
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
          
          // Core UI components (shared layouts, buttons, etc)
          if (id.includes('/core/ui/')) {
            return 'core-ui'
          }
          
          // Dashboard-specific code
          if (id.includes('/pages/app/dashboard/')) {
            return 'dashboard'
          }
          
          // Leads page specific
          if (id.includes('/pages/app/leads/')) {
            return 'leads'
          }
          
          // Analytics page specific
          if (id.includes('/pages/app/analytics/')) {
            return 'analytics'
          }
        }
      }
    },
    
    // Performance optimizations
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.logs in production
        drop_debugger: true
      }
    },
    
    // Source maps for debugging production issues
    sourcemap: true,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Optimize deps
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  
  server: {
    port: 5173,
    strictPort: false,
    host: true,  // Listen on all addresses
    
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:8787',
        changeOrigin: true,
        secure: false
      }
    },
    
    // CORS for development
    cors: true
  },
  
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  
  resolve: {
    alias: {
      // @ points to public/ for consistency with your imports
      '@': path.resolve(__dirname, './public'),
      '@core': path.resolve(__dirname, './public/core'),
      '@dashboard': path.resolve(__dirname, './public/pages/app/dashboard'),
      '@leads': path.resolve(__dirname, './public/pages/app/leads'),
      '@analytics': path.resolve(__dirname, './public/pages/app/analytics'),
      '@components': path.resolve(__dirname, './public/core/ui/components'),
      '@utils': path.resolve(__dirname, './public/core/utils'),
    },
    
    // Ensure proper extension resolution
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
    exclude: []
  },
  
  // Enable esbuild for faster builds
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'preact'`
  }
})
