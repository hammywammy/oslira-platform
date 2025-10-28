import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  base: '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/www/index.html'),
        about: resolve(__dirname, 'src/pages/www/about.html'),
        contact: resolve(__dirname, 'src/pages/www/contact.html'),
        privacy: resolve(__dirname, 'src/pages/www/privacy.html'),
        terms: resolve(__dirname, 'src/pages/www/terms.html'),
      }
    }
  }
});
