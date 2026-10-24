/**
 * Shim de compatibilidade — o sistema de movimento vive em `src/lib/motion/`.
 *
 * Ver `docs/specs/SPEC-007-sistema-unificado-de-transicoes-e-montagem-de-telas.md`.
 *
 * - **Novo código** importa de `./motion` (o diretório), nunca deste arquivo.
 * - Este arquivo **não tem mais nenhum símbolo próprio**: tudo o que ele
 *   exportava ou foi migrado para `src/lib/motion/` ou foi removido por não ter
 *   consumidor. Ele existe só para o `export *` do caminho antigo
 *   (`@/lib/motion`) continuar resolvendo.
 *
 * ⚠️ Por que ele não pode declarar export local nenhum: em ESM, um `export *`
 * ignora os nomes que o próprio módulo já exporta. Com `overlayVariants`
 * declarado aqui, o `MobileAppShell` importava a variante **legada** em vez da
 * canônica de `variants.ts` — dois donos, e o errado ganhando.
 *
 * Histórico do que saiu daqui (Slice D, 2026-10-16):
 * - `overlayVariants` → deletado; o canônico é `motion/variants.ts`.
 * - `sheetVariants`, `headerSwapVariants` → `motion/variants.ts`.
 * - `screenVariants`, `fadeSlide` → deletados; sem consumidor.
 * - `IOS_EASE`, `IOS_EASE_OUT`, `OVERLAY_FADE` → `motion/tokens.ts`.
 * - `iOS_SPRING`, `PUSH_DURATION`, `PUSH_EXIT_DURATION`, `TAB_DURATION` → deletados.
 * - `prefersReducedMotion`, `usePrefersReducedMotion`, `getTransition` →
 *   `motion/reduced.ts` (também quebrava um ciclo de import).
 * - `setNavMotionContext`/`consumeNavMotionContext` → deletados; o contrato
 *   `NavIntent` (`motion/intent.ts`) é o único transporte desde o Slice B.
 */

// Superfície pública única do sistema de movimento (SPEC-007).
export * from './motion/index';
