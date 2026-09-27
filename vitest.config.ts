import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Monorepo workspaces: keep a single React/context instance even for
    // modules physically located under apps/* (overlay files). Without this,
    // vitest can resolve a second copy of react for apps/* files, which breaks
    // the shared AppContext across the shell/overlay boundary.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'apps/**/*.test.{ts,tsx}',
      // Os pacotes de domínio/aplicação são TypeScript puro e têm testes ao
      // lado do código (SPEC-005: invariantes de `AcademicTerm`). Sem esta
      // entrada eles existiam mas nunca rodavam no gate.
      'packages/**/*.test.{ts,tsx}',
    ],
    css: false,
  },
});
