# Plano de Implementação: PERF-001 — Performance Mobile

> Execution plan for `specs/PERF-001-performance-mobile.md`. Follows incremental
> implementation: implement → verify → next slice. Never overwrote the MOD/SEP refactoring
> plan (`tasks/plan.md` + `tasks/todo.md`).

## Status (2026-09-11)

- **Fase 1 (Quick Wins):** 7/7 — `1.3` concluído (Set no boundary da biblioteca).
- **Fase 2 (Alto Impacto):** 5/5 — `2.4` concluído (banco de questões já era dynamic import nos
  3 pontos: `bootPreload.ensureQuestions`, `navigationEngine.ensureQuestionsLoaded`,
  `quizGroups`; sem import estático em `src/`).
- **Fase 3 (Contexto & Re-renders):** concluída — sub-contextos no ar + 5 views convertidas + BottomNav estável + **3.4** memo nas views.
- **Último gate:** lint 0 erros + 575 testes + build + check-boundaries ✓ (após 3.4/1.3/B)
- **Fase B do spec (Bundle & Loading):** **todas as correções aplicadas** — `B.3` modais lazy,
  `B.4` sub-telas da biblioteca lazy, `B.7` zod lazy (chunk `backupSchema`), `B.8` manualChunks
  no Vite, `B.9` confetti lazy (já implementado), `B.10` sql.js → devDependencies.

### Resultado do Bundle (Fase B)
- **Boot (entry `index-*.js`):** 823,571 → **257,647 bytes raw**; **gzip 344,60 → ~78 kB** (−66%).
- Chunks agora lazy fora do boot: `backupSchema` (zod, 94.7 kB / 27.2 gz), `BibliotecaView`
  (77.7 kB), `ManageDataModal` (19.75), `ComparisonRouteView` (24.46), `NotesScreen` (10.4),
  `WizardRouter` (54.8), `EstudosView`/`HomeView`/`PerfilView`/`FaculdadeView` (views por aba),
  vendors (`vendor-react` 223.6 / `vendor-motion` 139.0 / `vendor-icons` 45.1).
- Pesados restantes (lazy sob demanda): `bancoQuestoes` 4.6 MB, `authors` 2.2 MB,
  `comparisons` 2.1 MB, `psicoterapiaApproaches` 1.1 MB, domínios do templo 0.1–0.5 MB.

### Detalhe da Fase B implementada (Bundle & Loading)
- **B.3 — modais lazy** (`src/overlays/OverlaysContent.tsx`): QuickAddModal, GlobalSearchModal,
  EditCourseModal, EditTccModal, ManageDataModal e OtaUpdateModal viraram `lazy()` com chunk
  próprio; fragment envolvido em `<Suspense fallback={null}>`. `Modal`/`Toast` seguem eager.
  Modais continuam sempre montados (animação de abrir/fechar preservada).
- **B.4 — sub-telas da biblioteca lazy** (`BibliotecaView.tsx`): NotesScreen, TempleScreen,
  ConceptsScreen, AuthorsScreen, TechniquesScreen, FamiliesView, FamilyDetailView,
  ApproachDetailView e ComparisonRouteView passaram a `lazy()`; `ComparisonRouteView` extraído
  p/ `views/biblioteca/ComparisonRouteView.tsx`; cada branch de `mode` em `<Suspense>` com
  fallback `TempleLoading`/`null`. A grade de `'library'` (modo padrão) fica no chunk da view.
- **B.7 — zod lazy**: `packages/data/src/exportImport.ts` troca o import estático do
  `backupSchema` pelo `import('./backupSchema')` memoizado; `importAppDatabase` virou async
  (únicos consumidores já eram caminhos assíncronos). Ripple: `SyncEngine.parseBackup` agora
  `Promise<...>` (`packages/sync/src/engine.ts`, awaits em `pullAndMerge`),
  `DataClientProvider` (`importData` fire-and-forget, `applyMerged` async, `parseBackup` async)
  e testes (`exportImport.test`/`dataClient.test`/`engine.test`).
  Resultado: zod sai do boot (não aparece mais `invalid_type` no entry) → chunk `backupSchema`.
- **B.8 — manualChunks por FABRICAÇÃO**: forma-função no `vite.config.ts`
  (`vendor-react` node_modules/react+scheduler, `vendor-motion` framer-motion,
  `vendor-icons` lucide-react). A forma-objeto só capturava re-exports raiz (vendor-react 8 kB);
  a função captura o runtime (223 kB).

### Detalhe da Fase 3 implementada (sub-contextos impactando re-renders)
- **Estabilização do `set` (`useStampedState`)**: `syncIndexRef` espelha o `syncIndex` em
  render-time; `set` virou `useCallback([rawSet, key, setSyncIndex])` — identidade estável
  entre escritas (pré-requisito dos memos por domínio).
- **4 slices coarse em `DataClientProvider`**: `domainCourses`/`domainStudy`/
  `domainKnowledge`/`domainApp` + contextos/hooks `useDataClientCourses/Study/Knowledge/App`
  (dados brutos por domínio; memoizados por `useMemo` com deps do conjunto).
- **`dataActions` por domínio**: handlers em `useCallback` + grupos `courses`/`study`/
  `knowledge`/`app` memoizados (`DataActionGroups`); `useDataActions` expõe os dois shapes.
- **`navigationEngine` memoizado**: `NavigationValue` via `useMemo` (~130 deps) — estável
  para mudanças de tasks/sessions/streak (ainda muda em courses/flashcards/tcc/questions).
- **Bundles por domínio nas cascas** (`shellNavContexts.ts`): cada contexto de ações
  (`Courses/Study/Knowledge/App`) agrega o grupo + helpers ESTÁVEIS do domínio
  (ex.: `toggleSaveBook`/`updateReadingProgress`/`showToast`); `NavValueContext` expõe a
  navegação. Providers montados em `MobileAppProvider` (mobile) e `DesktopAppProvider`
  (desktop) via `useMemo` — sem nova leaf no `DataClientValue`.
- **Piloto convertido**: `BibliotecaView` consome `useDataClientKnowledge` +
  `useDataClientCourses` + `useKnowledgeActions` + `useNavValue` (sem `useMobileApp`) —
  re-renderiza só com mudanças de knowledge/courses/nav.

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
- [x] **1.3** `savedBookIds` array → `Set` nos hot paths da biblioteca
  
  - `BibliotecaView` deriva `savedSet = useMemo(() => new Set(savedBookIds), [savedBookIds])` no
    boundary; filtros (`useLibraryFilters`), shelves (`ExploreShelves`/`ExploreSections`/
    `LibraryModals`) e blocos (`InlineCollectionBlock`/`MixedCollectionBlock`) passam a consumir
    `Set<string>` + `.has()` (O(1)). Persistência continua `string[]` (schema intacto).
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
- [x] **2.4** JSON de questões (5MB) → dynamic import
  
  - Verificado: `bancoQuestoes` (chunk de 4.6MB, lazy) já é import dinâmico em
    `bootPreload.ensureQuestions`, `navigationEngine.ensureQuestionsLoaded` e `quizGroups`;
    nenhum import estático em `src/`. Único follow-up pendente: o `import(..., { with: { type: 'json' } })`
    poderia fatiar o JSON em domínios, mas o chunk já é carregado sob demanda na abertura do quiz.
- [x] **2.5** Remover `ensureApproaches`/`books` do boot preload

### Checkpoint 2
- [x] `npm run lint` + `npm run test` + `npm run build` verdes

### Fase 3 — Contexto & Re-renders (alto risco)
- [x] **3.1** Memoizar return de `useSharedAppValue`
- [x] **3.2** Memoizar return de `useDataClient` — implementado via **sub-contextos** (`shellNavContexts.ts`), a alternativa do spec A.3
- [x] → **3.2a** Estabilizar `set` do `useStampedState` (`syncIndexRef`)
- [x] → **3.2b** Slices coarse de dados por domínio (`useDataClient<Domain>`)
- [x] → **3.2c** Grupos de ações por domínio (`dataActions` → `DataActionGroups`)
- [x] → **3.2d** Bundle ações+helpers por domínio (`CoursesActions/StudyActions/KnowledgeActions/AppActions`)
- [x] → **3.2e** `NavValueContext` (nav memoizada em `navigationEngine`)
- [x] → **3.2f** Providers nas cascas mobile+desktop; `BibliotecaView` convertida (piloto)
- [x] → **3.2g** Convertidas as 5 views pesadas: Home, Faculdade, Estudos, Perfil (Biblioteca no piloto)
  
  - filhos de alta frequência: `home/rows` (TaskRow/ExamRow), `home/AttentionSection`, `CourseDetailView`
  - `PerfilView`: `shellExtras` isolado num leaf (`ShellExtrasSection`) p/ não depender do valor agregado
- [~] **3.3** Memoizar `buildAppContextValue` — **superseded**: views pesadas bypassam o valor
  agregado via sub-contextos (o valor agregado continua mudando com `data`, mas não é mais o
  caminho quente das views convertidas)
- [x] **3.4** `React.memo` nas 5 views principais
  
  - Views já eram `lazy()` (chunk próprio); agora `memo(lazy(loadX))` em `SharedScreenLayers` —
    pai re-renderiza por domínio que a view não assina e o memo corta o re-render (props das
    views são estáveis: `mode`/`familyId`/`course`/etc.). Cobre mobile e desktop (desktop reusa os mesmos loaders).
- [x] **3.5** Derivar streak/weekProgress com useMemo
- [x] **3.6** `BottomNav` com arrays/ícones estáveis + handlers memoizados
  
  - `TABS` + ícones do menu FAB hoisted ao módulo; `menuOptions` via `useMemo`
  - Shell passa `activeTab`/`handleNavigate`/`openWizard`/`openTaskExamWizard`/`openCompose`
    do `NavValueContext` → `BottomNavMemo` re-renderiza só quando a navegação muda

### Checkpoint 3
- [x] `npm run lint` + `npm run test` + `npm run build` + `check-boundaries` verdes
  (571+ testes; 575 após etapa de views)

### Checkpoint 4 (Fase B completa)
- [x] `npm run lint` + `npm run test` (575) + `npm run build` (boot gzip ~78 kB) +
  `check-boundaries` verdes — zod fora do entry (confirmado por ausência de
  `invalid_type` no boot e chunk `backupSchema` separado)

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