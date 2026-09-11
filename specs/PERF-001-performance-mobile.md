# PERF-001 — Otimização de Performance Mobile

> Auditoria completa de performance do app buildado (Capacitor Android/iOS).
> Consolidado de 5 análises especializadas usando skills: vercel-react-best-practices,
> vercel-composition-patterns, react-ui, design-system, web-design-guidelines,
> frontend-design + análise mobile/Capacitor.
>
> **Data:** 2026-09-10
> **Skills aplicadas:** vercel-react-best-practices (70 rules), vercel-composition-patterns,
> react-ui, design-system, web-design-guidelines, frontend-design
> **Gate de validação:** `npm run lint` + `npm run test` + `npm run build` verdes

---

## Status de implementação (2026-09-11)

> Acompanhamento operacional vive em **`tasks/perf-plan.md`** (checkboxes por tarefa).
> Resumo por fase — implementado no commit `28ec55e` (gate: lint 0 erros, 575 testes, build,
> check-boundaries ✓):

| Fase | Itens | Feitos | Faltam |
|------|-------|--------|--------|
| [A. Contexto](#fase-a--estabilização-do-contexto-e-re-renders) | 8 | A.2, A.3, A.5 | A.1 (value useMemo), A.4 (`React.memo` views), A.6 (BottomNav), A.7 (split values), A.8 (derived useMemo) |
| [B. Bundle](#fase-b--bundle-e-loading) | 10 | B.2, B.5, B.6, B.9 | B.1 (JSON 5MB), B.3, B.4, B.7, B.8, B.10 |
| [C. Visual Perf & CSS](#fase-c--visual-perf-e-css) | 9 | C.1, C.2, C.3, C.4, C.9 | C.5, C.6, C.7, C.8 |
| [D. Runtime & Dados](#fase-d--runtime-e-data) | 8 | D.3 | D.1, D.2, D.4, D.5, D.6, D.7, D.8 |
| [E. Capacitor & Nativo](#fase-e--capacitor-e-nativo) | 8 | E.6 | E.1–E.5, E.7, E.8 |

> Os marcadores `⬛` nos itens são indicadores de severidade da auditoria, **não** status de
> implementação. Consulte `tasks/perf-plan.md` para o que está concluído vs. pendente.

---

## Índice

| Fase | Escopo | Itens | Impacto |
|------|--------|-------|---------|
| [Fase A](#fase-a--estabilização-do-contexto-e-re-renders) | Re-renders & Contexto | 8 itens | CRITICAL |
| [Fase B](#fase-b--bundle-e-loading) | Bundle & Carregamento | 10 itens | CRITICAL/HIGH |
| [Fase C](#fase-c--visual-perf-e-css) | Visual Perf & CSS | 9 itens | MEDIUM/HIGH |
| [Fase D](#fase-d--runtime-e-data) | Runtime JS & Dados | 8 itens | MEDIUM |
| [Fase E](#fase-e--capacitor-e-native) | Capacitor & Nativo | 8 itens | MEDIUM/LOW |

**Total: 43 itens** · 3 CRITICAL · 7 HIGH · 20 MEDIUM · 13 LOW

---

## Fase A — Estabilização do Contexto e Re-renders

> **Impacto: CRITICAL** — O causador raiz de cascata de re-renders no app inteiro.
> Nenhuma otimização de bundle ou CSS terá efeito perceptível enquanto o contexto
> re-renderizar toda view a cada mudança de estado.

### A.1 — Context value instável no MobileAppProvider ⬛

**Regra:** `rerender-dependencies` + `architecture-compound-components`
**Arquivo:** `apps/mobile/src/MobileAppProvider.tsx:29-35`
**Problema:** `buildAppContextValue()` retorna um novo objeto literal a cada render.
O mesmo value é espalhado em 3 providers (`AppBaseContext`, `DataClientContext`,
`MobileAppContext`). Todo consumidor re-renderiza a cada render do provider.
**Correção:**
```tsx
const value = useMemo(
  () => buildAppContextValue(data, shared, nav),
  [data, shared, nav]
);
```
Os valores `data`, `shared`, `nav` também devem ser estáveis (ver A.2, A.3).

### A.2 — `useSharedAppValue` retorna objeto instável ⬛

**Regra:** `rerender-dependencies`
**Arquivo:** `src/context/sharedAppValue.ts:366-383`
**Problema:** Retorna novo objeto literal a cada render. Handlers (`updateReminder`,
`setGcalEnabled`) e computações (`streakStats`, `currentWeekProgress`) não são
memoizados.
**Correção:**
```tsx
const value = useMemo(() => ({
  data, currentWorkspaceId, streakStats, currentWeekProgress, ...
}), [data, currentWorkspaceId, streakData.activeDays, ...]);

const updateReminder = useCallback((settings) => { ... }, [courses]);
const setGcalEnabled = useCallback(async (on) => { ... }, []);
```

### A.3 — `useDataClient` retorna 70+ campos sem memoização ⬛

**Regra:** `rerender-dependencies`
**Arquivo:** `src/context/DataClientProvider.tsx:640-757`
**Problema:** O hook retorna um objeto literal com 70+ campos. Qualquer mudança
de estado cria nova referência → todos os consumidores re-renderizam.
**Correção:** Memoizar o return do hook com `useMemo` OU dividir em sub-contextos
por grupo de entidades (ex.: `CoursesContext`, `TasksContext`, `StudyContext`).

### A.4 — Views sem `React.memo` ⬛

**Regra:** `rerender-memo`
**Arquivos:** `HomeView.tsx`, `FaculdadeView.tsx`, `EstudosView.tsx`,
`BibliotecaView.tsx`, `PerfilView.tsx`
**Problema:** Nenhuma das 5 views principais usa `React.memo`. consomem
`useMobileApp()` → re-renderizam a cada mudança de qualquer contexto.
**Correção:** Envolver exports com `React.memo`:
```tsx
export const HomeView = React.memo(function HomeView() { ... });
```
> **NOTA:** Só efetivo APÓS estabilizar os values do contexto (A.1–A.3).
> Caso contrário, `shallowEqual` sempre encontra diferenças.

### A.5 — Streak computado sem memoização ⬛

**Regra:** `rerender-derived-state`
**Arquivo:** `src/context/sharedAppValue.ts:122-124`
**Problema:** `computeStreak()` e `getWeekProgress()` rodam a cada render.
`todayKey = toDateKey(new Date())` gera string nova a cada render.
**Correção:**
```tsx
const todayKey = useMemo(() => toDateKey(new Date()), []);
const streakStats = useMemo(
  () => computeStreak(streakData.activeDays, todayKey),
  [streakData.activeDays, todayKey]
);
```

### A.6 — `BottomNav` com arrays inline derrotam memo ⬛

**Regra:** `rerender-no-inline-components` + `rerender-memo-with-default-value`
**Arquivo:** `src/components/BottomNav.tsx:22-57`
**Problema:** `tabs` e `menuOptions` são recriados a cada render. `menuOptions`
contém JSX inline e handlers arrow inline.
**Correção:** `useMemo` nos arrays + `useCallback` nos handlers + extrair ícones
para componentes de nível superior (não JSX inline).

### A.7 — Triple-context com mesmo value ⬛

**Regra:** `state-decouple-implementation`
**Arquivo:** `apps/mobile/src/MobileAppProvider.tsx:31-35`
**Problema:** O mesmo `value` alimenta 3 contextos. Um consumidor de dados puros
também re-renderiza quando a navegação muda (e vice-versa).
**Correção:** Dividir em values separados por contexto:
```tsx
const dataValue = useMemo(() => extractDataFields(value), [...]);
const navValue = useMemo(() => extractNavFields(value), [...]);
```

### A.8 — Derived data sem useMemo nas views ⬛

**Regra:** `rerender-derived-state`
**Arquivos:** `FaculdadeView.tsx:56-68`, `EstudosView.tsx:44-68`
**Problema:** `pendingExams`, `pendingTasks`, `todayFocusMinutes`,
`readingInProgress` etc. são computados inline sem `useMemo`.
**Correção:** Envolver cada computação em `useMemo` com deps apropriadas.

---

## Fase B — Bundle & Loading

> **Impacto: CRITICAL/HIGH** — Tamanho do bundle e trabalho no boot影响am
> directamente o tempo de carregamento e TTI no mobile.

### B.1 — 5 MB de JSON de questões importado estaticamente ⬛

**Regra:** `bundle-conditional`
**Arquivo:** `src/data/bancoQuestoes.ts:5`
**Problema:** `cecistudy_banco_3004_questoes.json` (5 MB) é importado via `import`
estático. O JSON não pode ser tree-shaken pelo Vite. É avaliado em todo page load
mesmo que o usuário nunca abra o quiz.
**Correção:** Trocar para `import()` dinâmico OU `fetch()` + `JSON.parse()`:
```ts
export async function loadBancoQuestoes(): Promise<StudyQuestion[]> {
  const raw = await import('./questions/cecistudy_banco_3004_questoes.json', { with: { type: 'json' } });
  return raw.default.map(mapToStudyQuestion);
}
```

### B.2 — Triple sistema de prefetch ⬛

**Regra:** `bundle-dynamic-imports` + `js-request-idle-callback`
**Arquivos:** `src/lib/prefetchViews.ts:10-45`, `src/shells/SharedScreenLayers.tsx:109-121`,
`src/main.tsx:17,21`
**Problema:** Três mecanismos independentes de chunk warming:
1. `prefetchViewChunks()` em `main.tsx` (idle, 3s timeout)
2. `preloadScreenChunks()` em `App.tsx` useEffect (idle, 1.5s)
3. `scheduleIdlePrefetch()` em `bootPreload.ts` (idle, 4s)

Ambos `prefetchViewChunks` e `preloadScreenChunks` importam os **mesmos módulos**.
**Correção:** Remover `prefetchViewChunks.ts` inteiramente. `preloadScreenChunks()`
em `SharedScreenLayers.tsx` já cobre tudo.

### B.3 — Modais eagerly importados no root bundle ⬛

**Regra:** `bundle-dynamic-imports`
**Arquivo:** `src/overlays/OverlaysContent.tsx:7-14`
**Problema:** `QuickAddModal`, `GlobalSearchModal`, `EditCourseModal` etc. são
importados estaticamente. São exibidos só por interação do usuário, mas o código
está no caminho crítico do boot.
**Correção:** `React.lazy` em cada modal:
```tsx
const QuickAddModal = lazy(() => import('@/components/QuickAddModal'));
```

### B.4 — Biblioteca: mega-chunk com 20+ imports ⬛

**Regra:** `bundle-dynamic-imports`
**Arquivo:** `src/components/views/BibliotecaView.tsx:59-83`
**Problema:** `BibliotecaView` importa 20+ sub-componentes estaticamente incluindo
`ConceptsScreen`, `AuthorsScreen`, `TechniquesScreen`, `ComparisonsScreen` etc.
O chunk da biblioteca (~149 KB gzip) é carregado na 1ª visita mesmo que o usuário
só veja a aba principal.
**Correção:** Lazy-load dos sub-screens do templo:
```tsx
const ConceptsScreen = lazy(() => import('../library/temple/ConceptsScreen'));
const AuthorsScreen = lazy(() => import('../library/temple/AuthorsScreen'));
```

### B.5 — Approaches (1.1 MB) carregados no boot ⬛

**Regra:** `bundle-conditional`
**Arquivo:** `src/lib/bootPreload.ts:87,168`
**Problema:** `ensureApproaches()` roda no pipeline de boot, puxando ~1.1 MB de
dados. Os dados só são usados na aba biblioteca/famílias.
**Correção:** Remover `ensureApproaches` do `planBootSteps`. Carregar sob demanda
quando `FamiliesView` ou `ApproachDetailView` abrir.

### B.6 — Books (431 KB JSON) carregados no boot ⬛

**Regra:** `bundle-conditional`
**Arquivo:** `src/lib/bootPreload.ts:91-98`
**Problema:** `import('../data/books')` puxa 3 JSONs (431 KB) + `curateLibrary()`
no boot, mesmo que o usuário fique no Home.
**Correção:** Remover `books` do `planBootSteps` (web). No nativo, manter.

### B.7 — `zod` (30 KB gz) sempre no bundle ⬛

**Regra:** `bundle-defer-third-party`
**Arquivo:** `package.json:71`, `src/lib/backupSchema.ts`, `src/lib/exportImport.ts`
**Problema:** `zod` é usado só em backup/importação (<0.1% das sessões), mas
fica no bundle production.
**Correção:** Dynamic import:
```ts
async function getZod() {
  return await import('zod');
}
```

### B.8 — Sem config manual de chunks no Vite ⬛

**Regra:** `bundle-analyzable-paths`
**Arquivo:** `vite.config.ts`
**Problema:** Sem `manualChunks`, o Vite usa defaults que podem criar chunks
subótimos para módulos grandes.
**Correção:** Adicionar:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-motion': ['framer-motion'],
      }
    }
  }
}
```

### B.9 — `canvas-confetti` eagerly carregado ⬛

**Regra:** `js-request-idle-callback`
**Arquivo:** `src/lib/celebrate.ts:1`
**Problema:** `canvas-confetti` (15 KB gz) importado no topo, mas usado só em
5 momentos específicos (celebração de tarefa, leitura, pomodoro).
**Correção:** Lazy load:
```ts
const { default: confetti } = await import('canvas-confetti');
```

### B.10 — `sql.js` (700 KB WASM) em dependencies ⬛

**Regra:** `bundle-defer-third-party`
**Arquivo:** `package.json:35`
**Problema:** `sql.js` é usado só em testes/scripts, mas está em `dependencies`
(pode ser incluído no bundle production).
**Correção:** Mover para `devDependencies`. Verificar que `dist/` não muda de tamanho.

---

## Fase C — Visual Perf & CSS

> **Impacto: MEDIUM/HIGH** — Otimizações visuais que afetam frame rate no scroll
> e animações no mobile.

### C.1 — `backdrop-filter: blur(24px)` em navs sempre visíveis ⬛

**Regra:** Visual perf — compositing on mobile
**Arquivos:** `src/index.css:405-413` (`.liquid-glass-nav`), `:435-436` (`.liquid-glass-fab`)
**Problema:** `blur(24px) saturate(140%)` no HeaderNav e BottomNav, que estão
sempre visíveis. Cada frame de scroll requer re-blur dos pixels mudados.
Em Android mid-range causa frame drops.
**Correção:** Reduzir para `blur(12px)` ou substituir por fundo semi-transparente
sólido (`bg-surface-rose/90`) nas navs. Manter blur só em modais/sheets.

### C.2 — 51 instâncias de `transition-all` ⬛

**Regra:** Web Interface Guidelines — "Never transition: all"
**Arquivos:** 25+ arquivos, 51 ocorrências
**Problema:** `transition-all` força o browser a checar TODAS as propriedades CSS
em cada mudança. A maioria só precisa de `color`, `border-color`, `transform`.
**Correção:** Substituir por propriedades explícitas:
```diff
- transition-all
+ transition-colors duration-200
```

### C.3 — Touch targets abaixo de 44px ⬛

**Regra:** WCAG 2.5.8 Target Size
**Arquivos:**
- `src/components/ui/button.tsx:26` — `size.icon` é `h-10 w-10` (40px)
- `src/components/ui/bottom-nav-bar.tsx:54` — `min-h-[40px]`
- `src/components/ui/floating-action-menu.tsx:35` — FAB `w-10 h-10` (40px)
**Problema:** Abaixo do mínimo de 44px para touch targets.
**Correção:** Todos devem ser `h-11 w-11` / `min-h-[44px]` / `min-w-[44px]`.

### C.4 — Focus ring removido sem substituição ⬛

**Regra:** Web Interface Guidelines
**Arquivo:** `src/components/ui/bottom-nav-bar.tsx:56`
**Problema:** `focus-visible:ring-0` remove o focus ring sem alternativa.
Usuários de teclado não conseguem ver qual item está focado.
**Correção:** `focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2`

### C.5 — `content-visibility: auto` existe mas não é usado ⬛

**Regra:** Rendering performance — long lists
**Arquivo:** `src/index.css:355-358` (`.cv-shelf` definido), BibliotecaView
**Problema:** A classe `.cv-shelf` com `content-visibility: auto` existe mas
nenhum componente a importa. A BibliotecaView renderiza 150+ livros, 150+ artigos,
225 conceitos, 700 autores sem virtualização.
**Correção:** Aplicar `.cv-shelf` nas seções longas da BibliotecaView.

### C.6 — `touch-action` e `overscroll-behavior` ausentes ⬛

**Regra:** Touch interaction
**Arquivos:** `index.html:18`, `src/index.css`, `src/components/ui/Modal.tsx`
**Problema:** Sem `touch-action: manipulation` no body (delay de double-tap zoom).
Sem `overscroll-behavior: contain` nos modais (scroll leakage para body).
**Correção:**
```css
body { touch-action: manipulation; }
.modal-overlay { overscroll-behavior: contain; }
```

### C.7 — `body::before` com gradientes fixed cria compositor layer ⬛

**Regra:** Visual perf
**Arquivo:** `src/index.css:197-206`
**Problema:** `body::before` com `position: fixed; inset: 0; z-index: -1` e dois
`radial-gradient` força o compositor a blendar um pseudo-elemento full-screen
em cada frame de scroll.
**Correção:** Adicionar `will-change: transform` OU substituir por `<div>` estático
com `transform: translateZ(0)`.

### C.8 — Button tokens são shadcn defaults, não cecistudy ⬛

**Regra:** Design system — token compliance
**Arquivo:** `src/components/ui/button.tsx:8,12-20`
**Problema:** Variantes usam `bg-primary`, `text-primary-foreground` (shadcn),
não os tokens do cecistudy (`ceci-brand`, `ceci-primary`).
**Correção:** Remapear variantes para tokens cecistudy.

### C.9 — `.touch-target` definido 2x (primeiro é dead code) ⬛

**Regra:** CSS redundancy
**Arquivo:** `src/index.css:210-215` + `:345-351`
**Problema:** Primeira definição é gateada por `@media (hover:hover)` mas a
segunda (não gateada) sobrescreve. O primeiro é dead code.
**Correção:** Remover a primeira definição (linhas 210-215).

---

## Fase D — Runtime JS & Dados

> **Impacto: MEDIUM** — Micro-otimizações de JS runtime que reduzem trabalho
> por render e alocações de memória.

### D.1 — `savedBookIds.includes()` em hot paths (O(n)→O(1)) ⬛

**Regra:** `js-set-map-lookups`
**Arquivos:** `useLibraryFilters.ts` (12+ ocorrências), `ExploreShelves.tsx`,
`ExploreSections.tsx`, `MixedCollectionBlock.tsx`
**Problema:** `savedBookIds` é `string[]` e `.includes()` é chamado dezenas de
vezes por render com 400+ livros. O(n×m) por filter call.
**Correção:**
```ts
const savedBookIdSet = useMemo(() => new Set(savedBookIds), [savedBookIds]);
// Usar savedBookIdSet.has(id) em todos os 12+ call sites
```

### D.2 — Sub-filters da biblioteca não memoizados ⬛

**Regra:** `js-combine-iterations`
**Arquivo:** `src/components/views/biblioteca/useLibraryFilters.ts:281-288`
**Problema:** 4 `.filter()` separados sobre `filteredCollections` rodam a cada
render, mesmo sem mudança nos dados.
**Correção:** Memoizar com `useMemo` OU construir em passada única via `reduce`.

### D.3 — `JSON.stringify` a cada mudança de estado (sem debounce) ⬛

**Regra:** `client-localstorage-schema`
**Arquivo:** `src/lib/usePersistentState.ts:50-53`
**Problema:** O effect `[key, state]` serializa e escreve a cada mudança. Para
arrays grandes (`courses`, `tasks`), `JSON.stringify` leva 5-15ms. No nativo,
cada `Preferences.set()` é uma bridge call async.
**Correção:**
```ts
useEffect(() => {
  if (!hydratedRef.current) return;
  const id = setTimeout(() => storage.set(key, JSON.stringify(state)), 200);
  return () => clearTimeout(id);
}, [key, state]);
```

### D.4 — Search `.toLowerCase()` spam ⬛

**Regra:** `js-cache-property-access`
**Arquivo:** `src/components/GlobalSearchModal.tsx:57-131`
**Problema:** Para cada entidade (~225 conceitos, ~139 autores, ~97 abordagens),
cada campo faz `.toLowerCase()` inline. Resultado: 500+ alocações de string
por keystroke.
**Correção:** Pré-computar índices lowercase uma vez OU pelo menos reduzir
as chamadas redundantes.

### D.5 — `computeStreak` cria 3 Sets separados do mesmo array ⬛

**Regra:** `js-cache-property-access`
**Arquivo:** `src/lib/streak.ts:91,167,196`
**Problema:** `computeStreak`, `getWeekProgress`, `getRecentWeeks` cada um
cria `new Set(activeDays)` independentemente.
**Correção:** Aceitar um Set pré-construído como parâmetro.

### D.6 — `stickerConditionFor` usa Array.find O(n²) ⬛

**Regra:** `js-index-maps`
**Arquivo:** `src/data/stickerCatalog.ts:388`, `src/lib/stickers.ts:115-128`
**Problema:** Para cada sticker, faz `Array.find()` no catálogo de 30 itens.
**Correção:** Exportar `Map<string, condition>` e usar `.get()`.

### D.7 — `canvas-confetti` eagerly carregado (já listado em B.9) ⬛

Ver B.9.

### D.8 — Quiz filter com `Array.includes()` em loop de 3000+ itens ⬛

**Regra:** `js-set-map-lookups`
**Arquivo:** `src/lib/quizLogic.ts:9-14`
**Problema:** `filterQuestions` verifica `config.areas.includes(q.area)` para
cada uma de ~3000 questões.
**Correção:** Converter arrays de filtro para `Set` antes do loop:
```ts
const areaSet = new Set(config.areas);
// areaSet.has(q.area)
```

---

## Fase E — Capacitor & Nativo

> **Impacto: MEDIUM/LOW** — Específico do Capacitor/WebView que afeta boot,
> scroll e gestos.

### E.1 — Legacy import lê 20+ collections sequencialmente ⬛

**Regra:** Boot performance
**Arquivo:** `src/lib/db/legacyImport.ts:50-93`
**Problema:** `importLegacyCollections` faz 20+ queries SQLite + 20+ Preferences
reads sequenciais no boot. Cada bridge call: ~15-25ms.
**Correção:** Após 1º import, query `SELECT COUNT(*) FROM legacy_import_map`
uma vez. Se == count conhecido, pular todo o loop.

### E.2 — Notifications agendadas sequencialmente (N× bridge calls) ⬛

**Regra:** Capacitor plugin batching
**Arquivo:** `src/lib/notifications.ts:148-178`
**Problema:** `syncClassReminders` agenda cada notificação individualmente
com `await`. 15 classes = 15 bridge calls (300-600ms).
**Correção:** Usar batch scheduling:
```ts
LocalNotifications.schedule({ notifications: [...] });
```

### E.3 — `BootSplash` com `setInterval(120ms)` ⬛

**Regra:** Boot performance
**Arquivo:** `src/components/ui/BootSplash.tsx:75-85`
**Problema:** Polling a cada 120ms durante 1.6-7s de splash.
**Correção:** Substituir por `setTimeout` encadeado OU `requestAnimationFrame`.

### E.4 — `shouldIgnoreTarget` faz `getComputedStyle` em pointer event ⬛

**Regra:** Forced synchronous layout
**Arquivo:** `src/lib/swipe.ts:33-34`
**Problema:** Walk de 6 ancestros com `getComputedStyle()` em cada `pointerdown`.
**Correção:** Cache via `WeakMap<Element, boolean>` com TTL de 500ms.

### E.5 — Fontes (700 KB) como requests separados ⬛

**Regra:** Font loading
**Arquivo:** `src/main.tsx:3-14`
**Problema:** 13 arquivos de fonte como imports CSS separados. FOUT em devices
mais lentos.
**Correção:** Reduzir pesos (DM Serif 400 só, JetBrains Mono 400 só, Plus Jakarta
só 500/700). Usar `font-display: optional` para serif/mono.

### E.6 — Splash screen color mismatch ⬛

**Regra:** Capacitor UX
**Arquivos:** `capacitor.config.ts:24-27`, `src/components/ui/BootSplash.tsx:111`
**Problema:** Capacitor splash `#FFFFFF` vs BootSplash `#fef6eb` → flash de cor.
**Correção:** Alinhar `backgroundColor` no `capacitor.config.ts` para `#FEF6EB`.

### E.7 — `prefersReducedMotion()` redundante com MotionConfig ⬛

**Regra:** Code duplication
**Arquivo:** `src/lib/motion.ts:31-33`
**Problema:** `App.tsx` já usa `<MotionConfig reducedMotion="user">`. As checks
manuais em `screenVariants` são redundantes.
**Correção:** Remover checks manuais de `prefersReducedMotion()` em `motion.ts`.

### E.8 — `touch-pan-y` pode conflitar com edge swipe-back ⬛

**Regra:** WebView touch
**Arquivo:** `index.html:18`
**Problema:** `touch-pan-y` no body pode suprimir eventos horizontais em
certos Android WebViews, fazendo o edge swipe-back falhar silenciosamente.
**Correção:** Testar em devices Android de baixa. Se falhar, usar
`touch-action: pan-y` só em containers scrolláveis.

---

## Priorização de Execução

### Quick Wins (1 dia, alto ROI)
1. **B.2** — Remover `prefetchViewChunks` duplicado (1 arquivo delete)
2. **B.9** — Lazy-load `canvas-confetti` (3 linhas)
3. **D.1** — `savedBookIds` → `Set` (1 useMemo + 12 replace)
4. **C.3** — Touch targets 40→44px (3 arquivos, 3 linhas cada)
5. **C.4** — Focus ring no BottomNav (1 linha)
6. **C.9** — Remover `.touch-target` dead code (6 linhas)
7. **E.6** — Alinhar cor do splash (1 linha)

### Alto Impacto (3-5 dias)
1. **A.1-A.3** — Estabilizar context value chain (3-4 dias)
2. **B.1** — JSON de questões → dynamic import (0.5 dia)
3. **C.1** — Reduzir backdrop-filter blur (0.5 dia)
4. **C.2** — Migrar `transition-all` → explícitos (1-2 dias)
5. **D.3** — Debounce writes no usePersistentState (0.5 dia)

### Médio Impacto (5-8 dias)
1. **A.4** — `React.memo` nas 5 views (0.5 dia, depende de A.1-A.3)
2. **B.3-B.4** — Lazy-load de modais e sub-screens (1-2 dias)
3. **B.5-B.6** — Remover approaches/books do boot (0.5 dia cada)
4. **E.1** — Batch legacy import (0.5 dia)
5. **E.2** — Batch notification scheduling (0.5 dia)

### Baixo Impacto / Futuro
- Itens restantes das Fases D e E
- `content-visibility` em long lists
- `sql.js` → devDependencies
- `qrcode`/`trystero` lazy loading

---

## Métricas de Sucesso

| Métrica | Antes (estimado) | Meta |
|---------|------------------|------|
| TTI (Time to Interactive) | ~3-5s (low-end) | <2s |
| Bundle size (main chunk) | ~800 KB gzip | <400 KB gzip |
| Re-renders por task toggle | ~8 views | 1-2 views |
| Frames dropped (scroll) | perceptível | imperceptível |
| Bridge calls por toggle | 1 (write) | 1 (debounced) |
| Boot prefetch chunks | 23 | 3-5 |

---

## Regras de Skill Aplicadas

| Skill | Regras aplicadas |
|-------|-----------------|
| vercel-react-best-practices | `bundle-*` (6), `async-*` (3), `rerender-*` (14), `js-*` (14), `rendering-*` (3), `client-*` (4) |
| vercel-composition-patterns | `architecture-*` (2), `state-*` (3), `patterns-*` (1) |
| react-ui | Component architecture, state management, accessibility |
| design-system | Token compliance, component tokens |
| web-design-guidelines | Touch targets, focus states, transition-all, content-visibility |
| frontend-design | Motion restraint, visual hierarchy |
| Mobile/Capacitor | Boot perf, bridge batching, WebView touch, font loading |
