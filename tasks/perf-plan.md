# Plano de Implementação: PERF-001 — Performance Mobile

> Execution plan for `specs/PERF-001-performance-mobile.md`. Follows incremental
> implementation: implement → verify → next slice. Never overwrote the MOD/SEP refactoring
> plan (`tasks/plan.md` + `tasks/todo.md`).

## Status (2026-09-11)

- **Fase 1 (Quick Wins):** 6/7 — falta `1.3` (savedBookIds → Set).
- **Fase 2 (Alto Impacto):** 4/5 — falta `2.4` (JSON de questões → dynamic import).
- **Fase 3 (Contexto & Re-renders):** 3/6 — feitos `3.1`, `3.2` (sub-contextos, alternativa do
  spec A.3) e `3.5`; faltam `3.3`, `3.4`, `3.6`.
- **Último gate:** commit `28ec55e` — lint 0 erros + 575 testes + build + check-boundaries ✓.

## Architecture Decisions
- **Quick wins primeiro**: mudanças pequenas de alto ROI com risco mínimo.
- **Contexto por último**: a estabilização do context value chain (Fase A) é a mudança de
  maior risco e maior impacto — deixada para uma fase própria após os quick wins
  estabilizarem o terreno.
- **Não tocar** no plano de refatoração MOD/SEP existente (Fase C pendente lá).

## Task List

### Fase 1 — Quick Wins
- [x] **1.1** Remover `prefetchViewChunks` duplicado (`main.tsx` não precisa; `preloadScreenChunks` cobre)
- [x] **1.2** Lazy-load `canvas-confetti` (`celebrate.ts` → `await import`)
- [ ] **1.3** `savedBookIds` array → `Set` nos hot paths da biblioteca
- [x] **1.4** Touch targets 40px → 44px (button icon, bottom-nav, FAB)
- [x] **1.5** Focus ring no BottomNav (`focus-visible:ring-0` → ring custom)
- [x] **1.6** Remover `.touch-target` duplicado (dead code no CSS)
- [x] **1.7** Alinhar cor do splash (capacitor.config vs BootSplash)

### Checkpoint 1
- [x] `npm run lint` + `npm run test` verdes

### Fase 2 — Alto Impacto
- [x] **2.1** Debounce writes no `usePersistentState` (200ms + flush)
- [x] **2.2** Reduzir `backdrop-filter: blur(24px)` → `blur(16px)` no liquid-glass-nav
- [x] **2.3** `transition-all` → propriedades explícitas (51 instâncias em 25+ arquivos)
- [ ] **2.4** JSON de questões (5MB) → dynamic import (via `import(..., { with: { type: 'json' } })`)
- [x] **2.5** Remover `ensureApproaches`/`books` do boot preload

### Checkpoint 2
- [x] `npm run lint` + `npm run test` + `npm run build` verdes

### Fase 3 — Contexto & Re-renders (alto risco)
- [x] **3.1** Memoizar return de `useSharedAppValue`
- [x] **3.2** Memoizar return de `useDataClient` — implementado via **sub-contextos** (`shellNavContexts.ts`), a alternativa do spec A.3
- [ ] **3.3** Memoizar `buildAppContextValue` no `MobileAppProvider`
- [ ] **3.4** `React.memo` nas 5 views principais (após estabilizar context)
- [x] **3.5** Derivar streak/weekProgress com useMemo
- [ ] **3.6** `BottomNav` com arrays/ícones estáveis + handlers memoizados

### Checkpoint 3
- [ ] `npm run lint` + `npm run test` + `npm run build` + `check-boundaries` verdes
  (verdes no commit `28ec55e`, mas Fase 3 ainda incompleta)

## Risks & Mitigations
| Risco | Impacto | Mitigação |
|---|---|---|
| Remover prefetch quebra preload de chunks | Médio | `preloadScreenChunks` já cobre os mesmos módulos; testar 1ª navegação |
| Set vs array em savedBookIds (persistência) | Baixo | Converter apenas no boundary useMemo; persistência continua string[] JSON |
| Dynamic import de JSON muda shape | Alto | Manter `.map(mapToStudyQuestion)`; validar com testes existentes do quiz |
| Debounce pode perder último write | Médio | Flush no unmount + flush no `visibilitychange`/`pagehide` |
| Memo de context quebra re-render condicional | Alto | Testar manualmente cadastro/toggle de task; reverter item isolado se quebrar |

## Open Questions
- O `requestIdleCallback` no `preloadScreenChunks` (timeout 3000) é suficiente para os 3
  primeiros chunks (Home/Faculdade/Estudos)? Considerar reduzir o conjunto pré-carregado.
- `transition-all` → explícitos: batch por arquivo ou por padrão em massa via script?