/**
 * `manualChunks` único dos dois builds (raiz e `apps/mobile`).
 *
 * A regra é uma só: `framer-motion` não pode cair no mesmo chunk do app, senão
 * a F9 da SPEC-M-027 não tem o que medir. Duplicar a lista em dois
 * `vite.config.ts` é como ela divergiria em silêncio.
 */
export function manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('node_modules/react') || id.includes('node_modules/scheduler'))
      return 'vendor-react';
    if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
    if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
  }
  return undefined;
}
