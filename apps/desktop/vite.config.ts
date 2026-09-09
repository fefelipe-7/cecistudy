import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * Build próprio do cliente desktop (Fase 6 da separação interface).
 *
 * Reusa o código compartilhado em `src/` via alias `@` → raiz `src`, e os
 * pacotes canônicos em `packages/*`. A casca mobile e seus módulos dedicados
 * não são importados por este workspace (ver `.github/scripts/check-boundaries.mjs`).
 *
 * `root` é este diretório (`apps/desktop`): o entrypoint é `index.html` aqui,
 * e o bundle sai em `apps/desktop/dist`, consumido pelo `desktop/src-tauri`
 * (`frontendDist` aponta para `../../apps/desktop/dist`).
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
