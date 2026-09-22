import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * Build próprio do cliente mobile (Fase 5 da separação interface).
 *
 * Reusa o código compartilhado em `src/` via alias `@` → raiz `src`, e os
 * pacotes canônicos em `packages/*` (verificado por `.github/scripts/check-boundaries.mjs`).
 *
 * `root` é este diretório (`apps/mobile`): o entrypoint é `index.html` aqui,
 * e o bundle sai em `apps/mobile/dist`. O build da raiz (`npm run build`) segue
 * independente.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  publicDir: path.resolve(__dirname, '../../public'),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
