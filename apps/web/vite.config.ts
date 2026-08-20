import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/trpc': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/assets/exercises': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/assets\/exercises/, '/exercises'),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
