import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { stripLegacyFontFormats } from './scripts/vite-plugin-strip-woff.mjs';
import { manualChunks } from './scripts/vite-manual-chunks.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss(), stripLegacyFontFormats()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
