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
  ssr: {
    noExternal: [
      /^@exodus\/bytes/,
      'html-encoding-sniffer',
      'jsdom',
      /^whatwg-url/,
      /^webidl-conversions/
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },
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

