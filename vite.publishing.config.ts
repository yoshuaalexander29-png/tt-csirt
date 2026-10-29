import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/publishing/',
  root: path.resolve(__dirname, 'apps/publishing'),
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ttcsirt/canonical-types': path.resolve(__dirname, './packages/canonical-types/src'),
      '@ttcsirt/publishing-api': path.resolve(__dirname, './services/publishing-api/src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: [path.resolve(__dirname, 'node_modules')],
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    outDir: path.resolve(__dirname, 'dist-publishing'),
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
});
