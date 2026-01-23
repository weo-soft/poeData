import { defineConfig } from 'vite';
import { resolve } from 'path';
import { calculationsPlugin } from './vite-plugin-calculations.js';

export default defineConfig({
  root: '.',
  base: '/', // Use root base for custom domain
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true
  },
  plugins: [
    calculationsPlugin()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '*.config.js'
      ]
    }
  }
});

