import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  base: '/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/www/index.html'),
        dashboard: resolve(__dirname, 'src/pages/app/dashboard/index.html'),
        onboarding: resolve(__dirname, 'src/pages/app/onboarding/index.html'),
      }
    }
  }
});
