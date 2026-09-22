# Spec 07 — Separação de Navegação por App (Mobile ↔ Desktop)

> **Módulo:** `desktop/spec/07-separacao-navegacao.md`
> **Status:** em revisão pelo usuário (decisões de §12 fechadas; ADRs confirmados)
> **Fase alvo:** separação de interface Fase 10.5 → (continuidade da Spec 06)
> **Autor:** agente de especificação (spec-driven-development + context-engineering + incremental-implementation + planning-and-task-breakdown + greenfield-architecture-planner)
> **Decisão do usuário:** **dividir a navegação por app**, dando a cada casca (mobile e
> desktop) a **posse do seu próprio estado de navegação/UI**, sobre um **motor de
> navegação compartilhado e puro** em `packages/`. (Contrasta com a Spec 06, que **mantinha**
> a `navigationStack` compartilhada no `AppContext`.)

---

## 1. Objective (do que estamos construindo e por quê)

A Spec 06 resolveu a primeira metade da separação: o estado **visual de sessão desktop**
(`DesktopSessionState`) saiu do `AppContextValue`, e os 4 contextos deixaram de carregar o
mesmo objeto (`DesktopAppContext` é aumentado). **Já implementado** — ver `src/context/appContexts.ts`
e `apps/desktop/src/DesktopAppProvider.tsx`.

O que **continua compartilhado e é o próximo alvo**: toda a **camada de navegação e de UI de
tela auxiliar** dentro do `AppContextValue` ($`navigationStack`, `activeTab`, `slideKey`,
`overlayKey`, `isNotesScreenOpen`, `isQuizPlayOpen`, `isTempleScreenOpen`, `subTabFaculdade`,
modais/filtros, `toast`, `headerConfig`…). Hoje mobile e desktop leem o **mesmo** valor de
navegação através de `useMobileApp()`/`useDesktopApp()` (que compartilham `AppContextValue`).

**Problema concreto:** o `DesktopAppShell` (ver `rtk grep` do §5.1) consome `app.activeTab`,
`app.isNotesScreenOpen`, `app.isQuizPlayOpen`, `app.overlayKey`, `app.subTabFaculdade`…
ou seja, o **desktop navega pelas mesmas telas empilhadas** que o mobile, porque a pilha vive
no contexto universal. Se o mobile abrir uma nota ou um quiz, isso **não pode** afetar o
desktop — e vice-versa — num fim honesto.

**Objetivo:** dar a cada casca a **posse da sua própria pilha de navegação e do seu próprio
estado de UI de tela auxiliar**, extraindo o **motor de navegação** (funções puras: derivar
`activeTab`, `currentScreen`, `isXOpen`, `slideKey`/`overlayKey`, aplicar push/pop, espelhar
hash) para uma **lib compartilhada em `packages/`** — sem React, testável, idêntica para as
duas cascas. Assim cada app evolui sua navegação de forma independente, e o bundle de um não
carrega o estado/views do outro.

**Critérios de aceite (fonte da verdade — comportamento observável):**
> 1. Abrir uma nota/quizz/templo no **desktop** NÃO altera a pilha/telas do **mobile**: duas
>    cascas montadas lado a lado (no mesmo processo, ex. teste) navegam de forma **independente**.
> 2. Nenhum campo do `DesktopSessionState` (`isKnowledgeGraphOpen`, `activePanels`,
>    `graphViewport`…) aparece no estado de navegação mobile, nem no `SyncPackage`.
> 3. O `DataClient`/sync/backup continua **shared** e com os testes existentes verdes a cada etapa.
> 4. O hash `location.hash` continua a espelhar a pilha **da casca ativa** (mobile na web,
>    desktop na shell Tauri); nunca o "mirror" de uma vira fonte para a outra.

---

## 2. Inputs revisados

- `desktop/spec/06-separacao-estado-boundaries.md` — arquétipo e onde este spec **avança**.
- `desktop/spec/00-relatorio-varredura.md` — §2.1/§2.7 (contrato de fronteira) e "Resumo de ações".
- `src/context/appContexts.ts` — `AppBaseContext`/`DataClientContext`/`MobileAppContext` (mesmo
  `AppContextValue`) + `DesktopAppContext` (aumentado). **Estado atual — já pós-Spec 06.**
- `src/context/AppContext.tsx` — `AppBaseProvider` (2387 linhas); ~40+ campos de navegação/UI
  no `AppContextValue`; derivação `currentScreen`/`isXOpen` (linhas 661–685+).
- `src/lib/routing.ts` — `parseRoute`/`routeToStack`/`stackToHash`/`DEFAULT_SUB_TAB` (motor de
  espelhamento hash, hoje puro e no `src/lib`).
- `src/lib/quizStack.ts` — funções puras de pilha do quiz (padrão a seguir: lógica pura testada).
- `src/context/mobileApp.ts` / `src/context/desktopApp.ts` — facades `useMobileApp`/`useDesktopApp`.
- `src/shells/ScreenLayers.tsx` — `SlideContent`/`OverlayContent`/`preloadScreenChunks` (cola
  compartilhada que resolve views por `useMobileApp`).
- `src/desktop/screens/DesktopScreenLayers.tsx` — resolve grafo/projetos/inbox + forks desktop,
  delegando o resto ao `SlideContent` compartilhado.
- `src/shells/MobileAppShell.tsx` / `src/shells/DesktopAppShell.tsx` — moldura/composição das cascas.
- `src/overlays/SharedOverlays.tsx` — **único** consumidor residual de `useApp()` (linhas 3, 88).
- `apps/mobile/src/MobileAppProvider.tsx` / `apps/desktop/src/DesktopAppProvider.tsx` — providers/cascas.
- `apps/desktop/src/session/types.ts` + `desktopSessionState.tsx` — `DesktopSessionState` (dono desktop).
- `.github/scripts/check-boundaries.mjs` — contrato de fronteira (gate obrigatório do PR; hoje `OK`).

---

## 3. Assumptions & Non-Goals

**Assumptions (corrigir se errado):**
- A. **Dados/domínio continuam shared** via `DataClient` (`packages/domain`/`packages/data`):
  cursos, tarefas, provas, leituras… **não** se movem para nenhum provider de app. O que se
  divide aqui é **só navegação/UI de sessão**.
- B. **Sync/backup continua shared** e é o **maior gatilho de regressão**: em cada etapa, os
  testes de `exportImport`/`persistentData`/`sync` precisam ficar verdes. Nada de navegação
  entra no `SyncPackage`.
- C. **Mobile é o "default"**: o motor de navegação é idêntico; o mobile continua com o mesmo
  comportamento que hoje (pilha com tabs base + telas auxiliares). Só muda **onde o estado vive**.
- D. **Desktop reaproveita o mesmo motor** mas com **estado próprio**; as telas auxiliares que o
  desktop hoje renderiza via `SlideContent` (nota/quiz/templo/study/sync) passam a ser resolvidas
  pela pilha **desktop**, não pela mobile.
- E. Import **dinâmico** (`import()`) atravessa a fronteira (vira chunk separado); **estático**
  não. Regra da Spec 06/check-boundaries mantida.
- F. `src/App.tsx` (web) continua **mobile-first**, sem branch `isDesktop` (Spec 06 §3-C).

**Non-Goals (fora desta spec):**
- Criar features desktop novas (calendar, documents, marketing, biblioteca master-detail) — specs próprias.
- Persistir `DesktopSessionState` no `SyncPackage`/backup.
- **Proibir** o desktop de renderizar telas auxiliares compartilhadas (nota/quiz/templo) — ele
  **deve continuar** podendo; só passa a fazê-lo com a própria pilha.
- Remover o master-detail já existente da faculdade (é o modelo a seguir).

---

## 4. Architecture Drivers (ordenados por peso)

1. **Independência de evolução** — mobile e desktop podem adicionar telas/fluxos de navegação
   sem coordenar nomes de flags nem inflar o bundle um do outro. (mais alto)
2. **Backup/sync intactos** — qualquer fatia preserva o contrato de dados; testes de
   backup/restore/sync verdes (driver de "baixo risco" aqui é crítico e por isso vira peso 2).
3. **Testabilidade do gate** — `check-boundaries.mjs` pega regressão de acoplamento; novos
   helpers de navegação puros são testáveis por unidade.
4. **Simplicidade / baixo risco** — dividir em fatias incrementais que mantêm **cada** casca
   funcionando isoladamente (fim feliz: as duas navegam por conta própria, mas nunca ao mesmo
   tempo quebram).
5. **Convenção existente** — respeitar `appContexts.ts`, facades `useMobileApp`/`useDesktopApp`
   e o padrão `quizStack.ts` (lógica pura testada fora do componente).

> **Nota de peso:** aqui o driver 2 (backup/sync) sobe ao topo por decisão expressa do usuário
> ("proteger backup/sync explicitamente"). É a maior superfície de regressão da separação.

---

## 5. Current State (grounding — o que está errado hoje)

### 5.1 O desktop consome a navegação mobile (acoplamento real)
`DesktopAppShell.tsx` lê de `app.*` (via `useDesktopApp()`, que herda `AppContextValue`):
`activeTab`, `subTabFaculdade`, `isNotesScreenOpen`, `isTempleScreenOpen`, `isFamiliesScreenOpen`,
`focusedFamilyId`, `focusedApproachId`, `focusedComparisonSlug`, `isStreakScreenOpen`,
`isInternshipDiaryOpen`, `isTccScreenOpen`, `isStickersScreenOpen`, `isSyncScreenOpen`,
`isQuizCategoryOpen`, `isQuizGroupDetailOpen`, `isQuizLoadingOpen`, `isQuizPlayOpen`,
`isQuizResultOpen`, `isQuickAddOpen`, `isSearchOpen`, `isEditCourseOpen`, `isEditTccOpen`,
`overlayKey`, `focusedCourse` (e handlers `handleNavigate`/`handleSystemBack`).
→ Ou seja, o **desktop hoje não tem pilha própria**: ele navega pela pilha do tronco, que é a
mesma do mobile/web.

### 5.2 AppContextValue carrega ~40+ campos de navegação/UI (a mover)
Confirmados por `rtk grep` no `AppContext.tsx`: `navigationStack`, `activeTab`, `slideKey`,
`overlayKey`, `navDirection`, `screenKey`, `focusedCourse(Id)`, `isBottomNavVisible`,
`subTabFaculdade`, `subTabBiblioteca`, `isNotesScreenOpen`, `isTempleScreenOpen`,
`focusedTempleSection`, `isFamiliesScreenOpen`, `focusedFamilyId`, `focusedApproachId`,
`focusedComparisonSlug`, `isStreakScreenOpen`, `isInternshipDiaryOpen`, `isTccScreenOpen`,
`isStickersScreenOpen`, `isSyncScreenOpen`, `isCompose*(Screen|Details)Open`, `isWizardOpen`,
`isQuickAddOpen`, `isSearchOpen`, `isEditCourseOpen`, `isEditTccOpen`, `isNoteDetailOpen`,
`isDetailPromptOpen`, `managedItem`, `toast`, `headerConfig`, `currentQuizPlayState`,
`isQuiz*Open`, `onboarding`. Estes são o **subconjunto que será possuído por cada casca**
(ver §8: o que sai do shared para o per-app).

### 5.3 A derivação `currentScreen`/`isXOpen` é pura, mas mora no componente
As linhas 661–685+ de `AppContext.tsx` derivam `currentScreen`, `isStreakScreenOpen`,
`isTempleScreenOpen`, `focusedFamilyId`… **diretamente do `navigationStack`** — lógica pura
que **deveria** estar numa lib (padrão: `src/lib/quizStack.ts` já prova que isso é testável).
Isso é o **candidato natural** a virar o motor compartilhado.

### 5.4 `ScreenLayers` é a cola que resolve views por `useMobileApp`
`SlideContent`/`OverlayContent`/`preloadScreenChunks` leem `useMobileApp()` e resolvem as telas
empilhadas. O `DesktopScreenLayers` delega ao `SlideContent` compartilhado para tudo exceto
grafo/projetos/inbox/master-detail. **Este é o ponto de costura** onde a pilha "por app" entra:
cada shell passa a resolver a partir da **sua** pilha.

### 5.5 `SharedOverlays` ainda usa `useApp()` (eco direto do AppContext)
`src/overlays/SharedOverlays.tsx` (linhas 3, 88) é o **último** consumidor de `useApp()` do
`AppBaseProvider`. Quando a navegação/sessão sair do `AppContext`, este consumo precisa ser
re-roteado para o provider da casca (ou para os dados, conforme o caso).

### 5.6 `AppContext` continua sendo o "dono universal"
`AppBaseProvider` (2387 linhas) define `useApp()` (2380–2383) e todos os 4 contextos da camada
(agora com valor shareado para Base/DataClient/Mobile). É o arquivo que concentra navegação+
dados+UI+quiz. **O fim:** remover `useApp`/`AppProvider` universal e deixar cada casca com seu
provider; `AppContext` morre (ou vira `DataClientProvider` + engine helpers puros).

---

## 6. Target Architecture

### 6.1 Motor de navegação compartilhado e puro → `packages/navigation`

Uma lib **sem React** (respeita a regra: `packages/*` jamais importa `react`/`@capacitor/*`/
`__TAURI__`) com as funções puras de navegação e derivação de tela. Serve **igualmente** mobile
e desktop; cada casca cria **sua própria instância de estado** consumindo essas funções.

Conteúdo proposto (nome provisório `packages/navigation`; ver ADR-07-1):

```ts
// packages/navigation/src/types.ts
export type NavTab = 'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil';
export type SubTabFaculdade = 'disciplinas' | 'calendario' | 'estagio';
export type SubTabBiblioteca = 'materiais' | 'autores' | 'conceitos' | 'abordagens' | 'mapa';
export type StudyScreen = 'focus' | 'revisar' | 'leituras' | 'historico';
export type NavScreen = /* junta os kinds: tab / course / notes / temple / templeSection /
   families / family / approach / comparison / streak / internshipDiary / tcc / stickers /
   sync / quiz-category / quiz-group-detail / quiz-loading / quiz-play / quiz-result /
   compose / composeDetails / noteDetail / noteTransform / study /**/;

export interface DerivedScreen {
  stack: NavScreen[];
  currentScreen: NavScreen;
  activeTab: NavTab;
  focusedCourseId: string | null;
  focusedFamilyId: string | null;
  focusedTempleSection: TempleSection | null;
  focusedApproachId: string | null;
  focusedComparisonSlug: string | null;
  isBottomNavVisible: boolean;
  slideKey: string;
  overlayKey: string;
  navDirection: 0 | 1 | -1;
  // + um bool por tela auxiliar (isNotesScreenOpen, isTempleScreenOpen, isQuizPlayOpen, …)
}
```

```ts
// packages/navigation/src/derive.ts  (função pura)
export function deriveScreen(stack: NavScreen[], navDirection: 0 | 1 | -1): DerivedScreen;
```

```ts
// packages/navigation/src/stack.ts  (funções puras de push/pop/transform)
export function stackAfterNavigate(stack: NavScreen[], tab: NavTab, subTab: string, targetId?: string): NavScreen[];
export function stackAfterOpenCourse(stack: NavScreen[], courseId: string): NavScreen[];
export function stackAfterOpenAux(stack: NavScreen[], kind: AuxKind, payload: unknown): NavScreen[];
export function stackAfterGoBack(stack: NavScreen[]): NavScreen[];  // + canGoBack
// ... reutiliza/absorve src/lib/quizStack.ts (stackAfterOpenQuiz* etc.)
```

```ts
// packages/navigation/src/hash.ts  (espelhamento do location.hash — só a string)
export function parseRoute(hash: string): Route;
export function routeToStack(route: Route): NavScreen[];
export function stackToHash(stack: NavScreen[], subTab?: string): string;
export function syncHash(stack: NavScreen[], subTab: string): void;  // escreve apenas (sem ler volta)
```

**Regras absolutas:**
- `packages/navigation` **não** importa React, Capacitor, Tauri nem `AppContext`.
- É o **único** lugar que conhece `NavScreen`/`DerivedScreen`/derivação de tela.
- `NavTab`/`SubTab*`/`NavScreen` **migram** de `src/types/navigation.ts` para cá (re-export
  compat em `src/types/navigation.ts` durante a transição — ver §9).
- Testes unitários de TODAS as funções puras (padrão `quizStack.test.ts`).

### 6.2 Estado de navegação por app → cada casca possui a sua

Cada provider de casca cria e mantém sua própria pilha + UI de sessão, usando o motor:

```ts
// apps/mobile/src/mobileNavigation.ts  (dono: MobileAppProvider)
// - usePersistentState('mobileNav_stack', [])     → pilha própria
// - usePersistentState('mobileNav_subTabs', …)    → subTabFaculdade/Biblioteca
// - useState para slideKey/overlayKey/navDirection (transitórios)
// - derived = deriveScreen(stack, navDirection)   → isNotesOpen, slideKey, activeTab…
// - handlers: navigate/openCourse/openAux/goBack via stack.ts + syncHash
```

```ts
// apps/desktop/src/desktopNavigation.ts  (dono: DesktopAppProvider)
// Mesma forma, com a pilha DESKTOP. Além disso mescla DesktopSessionState (já existe).
// ==========================================================
// apps/desktop/src/DesktopAppProvider.tsx (linha do fim)
const mobileLike = useDesktopNavigation();        // pilha desktop + deriveScreen
const session = useDesktopSession();              // já existe (spec 06)
const augmented = { ...mobileLike, ...session, panelHandlers };
```

> **Importante:** o desktop **reusa o mesmo motor** (`deriveScreen`/`stack.ts`/`hash.ts`), então
> as telas auxiliares (nota/quiz/templo/study/sync) que ele renderiza hoje continuam resolvendo
> da **pilha desktop** com o **mesmo comportamento**. Ele só ganha a **posse** do estado.

### 6.3 Resolução de views por shell (remove o costura de `ScreenLayers`)

- `MobileAppShell` resolve as views **a partir da pilha mobile** (`useMobileApp()`), inlining a
  lógica que hoje vive em `ScreenLayers.tsx` (tabs base + telas auxiliares), sem `shell`/desktop.
- `DesktopAppShell` resolve as views **a partir da pilha desktop** (`useDesktopApp()`): grafo/
  projetos/inbox + forks desktop + telas auxiliares (via pilha desktop).
- `src/shells/ScreenLayers.tsx` (a cola compartilhada) é **removido** (ou reduzido a helpers
  comuns falando só com `packages/navigation`); cada shell tem sua própria resolução.
- `preloadScreenChunks` → cada shell pré-carrega os seus chunks (mobile pré-carrega só shared;
  desktop pré-carrega shared + desktop).

### 6.4 Overlays por app (substitui `SharedOverlays`)

`SharedOverlays.tsx` deixa de consumir `useApp()`. Cada casca monta os seus overlays no seu
provider/shell:
- **Mobile:** `MobileOverlays` (QuickAdd/Search/EditCourse/EditTcc/Toast) lendo da pilha mobile.
- **Desktop:** `DesktopOverlays` lendo da pilha desktop + sessão desktop.
A moldura (fullscreen vs janela central) fica na shell (como hoje). Elimina o `useApp()` residual.

### 6.5 Fim do `AppContext` universal

- `src/context/AppContext.tsx` **deixa de existir como "dono universal"**. O que sobra de dados/
  domínio vira `DataClientProvider` (ver §6.6); o que é navegação/UI vira lib + providers por app;
  `useApp` é removido.
- `AppBaseContext`/`MobileAppContext`/`DesktopAppContext` (em `appContexts.ts`) são redefinidos:
  `MobileAppContext` = `DataClientValue & MobileNavValue`; `DesktopAppContext` = `DataClientValue &
  DesktopNavValue & DesktopSessionState & panelHandlers`.

### 6.6 `DataClient` shared (dados + sync + backup) → provider raiz de ambos

Server para **raiz** compartilhada que **só lida com dados/domínio/sync/backup** (NÃO com
navegação). Ambos os apps a envolvem com o seu provider de navegação:

```tsx
// apps/mobile/src/MobileAppProvider.tsx (fim)
<DataClientProvider>
  <MobileNavProvider> {/* pilha + UI mobile */}
    {children}
  </MobileNavProvider>
</DataClientProvider>
```

```tsx
// apps/desktop/src/DesktopAppProvider.tsx (fim)
<DataClientProvider>
  <DesktopNavProvider> {/* pilha desktop + sessão + painéis */}
    {children}
  </DesktopNavProvider>
</DataClientProvider>
```

---

## 7. UI Architecture (composição após a mudança)

```
DataClientProvider (shared: dados + sync + backup)          ← packages/domain|data|sync
├── MobileAppProvider
│   ├── MobileNavProvider (pilha mobile + UI + quiz)        ← usa packages/navigation
│   │   └── MobileAppShell → resolve views via useMobileApp()
│   │       └── MobileOverlays (QuickAdd/Search/EditCourse/EditTcc/Toast)
└── DesktopAppProvider
    ├── DesktopNavProvider (pilha desktop + DesktopSessionState + painéis) ← usa packages/navigation
    │   └── DesktopAppShell → resolve views via useDesktopApp()
    │       └── DesktopOverlays (mesmos overlays, lendo pilha desktop)
```

- `packages/navigation` = único lugar com `NavScreen`/derivação/hash (sem React).
- `DataClient` = único lugar com entidades/sync/backup.
- Nenhum provider de app importa o provider do outro; cada um consome `DataClient` + `navigation`.

---

## 8. Data Model (o que sai do `AppContextValue` → per-app; o que fica shared)

**Per-app (móvel para `MobileNavValue`/`DesktopNavValue`, via `packages/navigation` + estado da casca):**
- Pilha e derivados: `navigationStack`, `activeTab`, `currentScreen` (derivado), `focusedCourse(Id)`,
  `isBottomNavVisible`, `slideKey`, `overlayKey`, `navDirection`, `screenKey`.
- Sub-tabs: `subTabFaculdade`, `subTabBiblioteca`.
- Telas auxiliares empilhadas (flags derivadas da pilha): `isNotesScreenOpen`, `isNoteDetailOpen`,
  `isTempleScreenOpen`, `focusedTempleSection`, `isFamiliesScreenOpen`, `focusedFamilyId`,
  `focusedApproachId`, `focusedComparisonSlug`, `isStreakScreenOpen`, `isInternshipDiaryOpen`,
  `isTccScreenOpen`, `isStickersScreenOpen`, `isSyncScreenOpen`, composições (`isCompose*`).
- Quiz: `isQuiz*Open`, `currentQuizPlayState`.
- Modais/UI de sessão: `isWizardOpen`, `isQuickAddOpen`, `isSearchOpen`, `isEditCourseOpen`,
  `isEditTccOpen`, `isDetailPromptOpen`, `managedItem`, `toast`, `headerConfig`.
- Handlers correspondentes (open/close/navigate/goBack/setActiveTab/openQuiz…).

**Shared (ficam no `DataClient`, NÃO se movem):**
- Todas as entidades de domínio (profile, courses, tasks, exams, readings, flashcards, concepts,
  authors, approaches, materials, internship, tcc, stickers, sessions, questions, techniques,
  quizSessions, savedBookIds, readingProgress, reminders, gcal, workspaces…).
- Sync/backup/onboarding/ciclo de vida: `dataClient`, `getSyncPayloadJson`, `applySyncedDatabase`,
  `syncNow`, `githubSyncConfig`, `exportData`, `importData`, `resetApp`, `completeOnboarding`.
- CRUD handlers de domínio (handleAdd/Toggle/Delete…X — operam via `dataClient`).

> **Limite critério:** nenhum campo de navegação/UI aparece no `SyncPackage`/backup (regra B6 da
> Spec 06). Os testes existentes de `exportImport`/`persistentData` garantem isso — **devem
> continuar verdes** a cada etapa (driver 2).

---

## 9. Implementation Plan (incremental — planning-and-task-breakdown)

Princípio: cada fatia deixa **as duas cascas** compiláveis e com testes verdes. Ordem bottom-up
(lib → estado por app → resolução → gate). **Backup/sync verdes a cada fatia** (rodar
`npm run test -- src/lib/__tests__/exportImport.test.ts` + sync tests em cada checkpoint).

### Phase 0 — Preparação (sem risco)
- **[x] T0 — Extrair `packages/navigation` vazio + mover tipos:** criar `packages/navigation` com
  `types.ts` (NavTab/SubTab*/NavScreen migrados de `src/types/navigation.ts`), `derive.ts`,
  `stack.ts` (absorve `src/lib/quizStack.ts`), `hash.ts` (move `src/lib/routing.ts`). Re-export
  compat em `src/types/navigation.ts` e `src/lib/routing.ts` (apontam para o pacote) para não
  quebrar imports.
  - Aceite: `npm run test` (routing/quizStack continuam passando via re-export); boundary OK.
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `packages/navigation/**` (novo), `src/types/navigation.ts` (re-export),
    `src/lib/routing.ts`/`src/lib/quizStack.ts` (re-export), `tsconfig`/`vite` se preciso.
  - *Executado:* `packages/navigation` (types/derive/stack/hash) + re-exports compat;
    ver T6 para o gate da declaração exclusiva.
- **[x] Checkpoint P0:** routing/quizStack verdes, boundary OK, backup tests verdes.

### Phase 1 — `DataClientProvider` shared (extrai dados/sync/backup do AppContext)
- **[x] T1 — Criar `src/context/DataClientProvider.tsx`** com todo o estado de dados + handlers de
  domínio + sync/backup/onboarding extraídos de `AppContext.tsx` (mecânico: mover os `useState`/
  `usePersistentState` de dados e os CRUD). Expõe `useDataClient()`.
  - Aceite: `useDataClient()` devolve dados+sync sem navegação; `exportData`/`importData`/
    `applySyncedDatabase`/`resetApp` funcionam por ele (testes de exportImport verdes).
  - Verify: `npm run lint` + `npm run test -- src/lib/__tests__/exportImport.test.ts` + build.
  - Files: `src/context/DataClientProvider.tsx` (novo), `src/context/AppContext.tsx` (reduz),
    `src/context/appContexts.ts` (tipo).
- **[x] Checkpoint P1:** backup/sync tests verdes; app ainda compila (navegação ainda no AppContext).

### Phase 2 — Estado de navegação por app (mobile primeiro, depois desktop)
- **[x] T2 — `MobileNavProvider`:** criar `apps/mobile/src/mobileNavigation.ts` com pipa própria
  (`usePersistentState` da pilha/subtabs + `useState` de slideKey/overlayKey/navDirection +
  `deriveScreen`). `MobileAppProvider` passa a usar `MobileAppContext = DataClientValue & MobileNavValue`
  em vez de herdar tudo do AppContext. Telas/resolução mobile passam a ler `useMobileApp()` que
  agora vem do navev provider.
  - Aceite: mobile navega normalmente (tabs, nota, quiz, templo) usando a pipa própria; `useApp()`
    não é mais consumido pelo mobile.
  - Verify: `npm run lint` + `npm run test` + build mobile/web.
- **[x] T3 — `DesktopNavProvider`:** `apps/desktop/src/desktopNavigation.ts` com pipa desktop +
  `DesktopSessionState` + painéis. `DesktopAppContext = DataClientValue & DesktopNavValue &
  DesktopSessionState & panelHandlers`. `DesktopScreenLayers`/`DesktopAppShell` passam a ler a
  pilha **desktop** (não mais a mobile) para resolver nota/quiz/templo/study/sync.
  - Aceite: desktop abre/comarca notas, quiz, templo usando a pipa própria; e grafo/projetos/
    inbox (sessão). Independente do mobile.
  - Verify: `npm run lint` + `npm run test` + `npm run build --workspace=apps/desktop` +
    `node .github/scripts/check-boundaries.mjs`.
  - **Risco alto (T2+T3 juntos ou juntar com T4)** — as telas auxiliares "shared" deixam de ser
    resolvidas pelo `SlideContent` do tronco; segurar T2/T3/T4 numa única fatia verde é
    preferível (mesma regra da Spec 06 T4/T5).
- **[x] Checkpoint P2:** backup/sync verdes; duas cascas independentes num teste de montagem.

### Phase 3 — Resolução por shell (remove `ScreenLayers` como cola do tronco)
- **[x] T4 — Inline de resolução:**
  - `MobileAppShell` resolve views pela pilha mobile (move a lógica de `ScreenLayers` p/ mobile).
  - `DesktopAppShell` resolve pela pilha desktop (move a lógica de `DesktopScreenLayers` +
    telas auxiliares p/ desktop).
  - `src/shells/ScreenLayers.tsx` **removido** (ou reduzido a helpers comuns sobre `packages/navigation`).
  - `preloadScreenChunks` dividido: mobile pré-carrega shared; desktop pré-carrega shared+desktop.
  - Aceite: `grep` não acha `ScreenLayers` importado por `src/App.tsx`/shells; boundary OK.
  - Verify: `npm run lint` + `npm run test` + `npm run build` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `MobileAppShell.tsx`, `DesktopAppShell.tsx`, `desktop/screens/DesktopScreenLayers.tsx`,
    `src/shells/ScreenLayers.tsx` (remover), `src/App.tsx`.
- **[x] Checkpoint P3:** `check-boundaries` OK; build mobile+desktop; backup/sync verdes.

### Phase 4 — Overlays por app (remove `useApp()` residual)
- **[x] T5 — `MobileOverlays`/`DesktopOverlays` re-criados:** substituem `SharedOverlays`; cada um lê
  o provider da sua casca (mobile lê MobileAppContext; desktop lê DesktopAppContext). Remover
  `useApp()` (linhas 3, 88) de qualquer overlay.
  - *Executado:* `src/overlays/OverlaysContent.tsx` (agnóstico de plataforma, recebe `AppContextValue`
    via props) + `MobileOverlays.tsx`/`DesktopOverlays.tsx` (wrappers `useMobileApp()`/`useDesktopApp()`).
    `SharedOverlays.tsx` removido; entrypoints `src/App.tsx`, `apps/mobile/src/app/main.tsx` e
    `apps/desktop/src/app/main.tsx` montam os overlays da própria casca. `navigationRegression.test.tsx`
    migrado para `MobileAppProvider`/`useMobileApp()`. Checks 3/4/10 do `check-boundaries.mjs` e o
    teste `desktop-mobile-isolation.test.ts` atualizados para os novos arquivos.
  - Aceite: `grep -rn "useApp()" src/` retorna vazio; modais (QuickAdd/Search/EditCourse/EditTcc/
    Toast) funcionam nas duas cascas.
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `src/overlays/SharedOverlays.tsx` (remover), `MobileOverlays.tsx`/`DesktopOverlays.tsx`
    (novo), shells.
- **[x] Checkpoint P4:** `useApp`/`AppProvider`/`AppContext` universal removidos; `dist` compila.
  `AppContext.tsx` ficou só tipos/`buildAppContextValue` (`AppContextValue`, `ShellExtras`); o
  provider universal (`AppBaseProvider`/`AppProvider`/`useApp`) foi removido — cada casca usa o
  próprio provider sobre o `DataClientProvider` shared.

### Phase 5 — Gate estendido + testes funcionais de independência
- **[x] T6 — Estender `check-boundaries.mjs`:**
  - (a) **negativo:** proibir import estático `packages/navigation` em shell/overlays? — **não**:
    shells/overlays **devem** usar a lib; a regra é que **só** `packages/navigation` conhece
    `NavScreen`/derivação (proibir declará-los fora).
  - (b) **positivo:** `packages/navigation` não importa `react`/`@capacitor/*`/`__TAURI__`
    (regra de `packages/*` já existente cobre).
  - (c) **independência:** falhar se `MobileNavProvider` importar estado desktop ou vice-versa
    (extender regras B3/B4 da Spec 06 para `apps/mobile/*mobileNavigation*` ⇄ `apps/desktop/*`).
  - Aceite: estado violado propositalmente falha; estado final passa.
  - Verify: `node .github/scripts/check-boundaries.mjs` (OK).
  - **Execução (2026-09):** adicionados 3 checks novos no fim das rules:
    (1) `packages/navigation toca em UI/plataforma` (forbidden: react/@capacitor/__TAURI__);
    (2) `tipos de navegação declarados fora de packages/navigation` (forbiddenContent:
    `export type NavTab =` / `SubTabFaculdade` / `SubTabBiblioteca` / `NavScreen` / `StudyScreen`
    em `src`+`apps`);
    (3) `independência dos motores mobile/desktop` (forbiddenSpecifiers: `desktopSessionState`/
    `apps/desktop`/`apps/mobile`/`DesktopAppProvider`/`MobileAppProvider` nos arquivos de motor
    `apps/mobile/src/mobileNavigation.ts`, `apps/desktop/src/desktopNavigation.ts`,
    `src/context/navigationEngine.ts`). Regras 1/2 (mobile⇄desktop) ganharam `excludeTests: true`
    (testes importam providers cruzados p/ validar — mesmo espírito da regra 3 `src/lib`).
    `desktop-mobile-isolation.test.ts` espelha o `excludeTests` (`__tests__` são isentos).
    Aceite validado: import proposital de react em `packages/navigation/src/types.ts` → fail;
    restaurado → OK.
- **[x] T7 — Testes funcionais:**
  - `apps/desktop/src/__tests__/nav-independence.test.tsx`: montar `DesktopAppProvider` +
    `MobileAppProvider` lado a lado (providers aninhados sobre o mesmo `DataClient`), abrir uma
    nota no desktop via pilha desktop e afirmar que `useMobileApp()` (filho mobile mock) **não**
    muda `isNotesScreenOpen`/`activeTab`.
  - Estender `src/lib/__tests__/exportImport.test.ts`: `buildBackupPayload` não contém campos de
    navegação (já cobre desktop; estender para `nav*`).
  - Aceite: testes novos verdes.
  - Verify: `npm run test -- apps/desktop/src/__tests__/nav-independence.test.tsx` +
    `npm run test -- src/lib/__tests__/exportImport.test.ts`.
  - **Execução (2026-09):** teste novo com 2 casos — abrir nota no desktop (base canônica
    `biblioteca`) não muda a pilha mobile (mantém `home`, `isNotesScreenOpen=false`); fechar nota
    volta o desktop à base `biblioteca` e o mobile permanece intacto. `exportImport.test.ts`
    ganhou caso que rejeita `navigationStack`/`activeTab`/`subTabFaculdade`/`subTabEstudos`/
    `subTabBiblioteca`/`focusedStudyScreen` e nenhuma chave com prefixo `nav`. 67 files / 540
    testes verdes. (Nota: `vitest.config.ts` `include` estendido para `apps/**/*.test.{ts,tsx}` —
    antes `desktopSession.test.tsx` e testes em `apps/` não rodavam no gate.)
- **[x] Checkpoint Final:** `npm run lint` + `npm run test` (todos) + `npm run build` + boundary OK.

### Ordem de execução resumida
```
T0 → T1 → (T2 → T3 → T4 em conjunto) → T5 → T6 → T7
```
T2/T3/T4 devem ser entregues juntas (as telas auxiliares "shared" deixam de ser resolvidas pelo
`SlideContent` do tronco nesse intervalo). T0/T1/T5/T6/T7 são mais independentes.

---

## 10. Success Criteria (como saberemos que está pronto)

- [x] Uma nota/quizz/templo aberto no **desktop** (pilha desktop) **não** altera a pilha/telas do
      **mobile** (pilha mobile) num teste de duas cascas lado a lado.
- [x] `useApp()`/`AppProvider`/`AppContext` universal **removidos**; `grep -rn "useApp()" src/` vazio.
- [x] `src/shells/ScreenLayers.tsx` **removido** (substituído por `SharedScreenLayers.tsx`, sem
      branch de plataforma — check do boundary); cada shell resolve views pela **sua** pilha
      (`MobileAppShell`/`DesktopAppShell`).
- [x] `packages/navigation` é o único que conhece `NavScreen`/derivação; não importa react/Capacitor/Tauri.
- [/] `DataClientProvider` shared; dados/sync/backup intactos e com testes verdes. (provider
      compartilhado já é a raiz das duas cascas — validação via T7/appProviders.test.)
- [x] Nenhum campo de navegação/UI no `SyncPackage`/backup (testes de `exportImport` verdes).
- [x] `DesktopScreenLayers`/`DesktopAppShell` resolvem pela pilha desktop; `DesktopSessionState`
      continua fora do `SyncPackage`.
- [x] `SharedOverlays` substituído por overlays por app; sem `useApp()` residual.
- [x] `check-boundaries.mjs` pega (c) independência mobile⇄desktop; estado final `OK`.
- [x] `npm run lint` + `npm run test` + `npm run build` + `node .github/scripts/check-boundaries.mjs`
      verdes. (gate T7 verde: 67 files / 540 testes.)

---

## 11. Risks and Mitigations

| Risco | Impacto | Mitigação |
|---|---|---|
| T2/T3/T4 em separado quebram telas auxiliares "shared" (ambas as cascas) | Alto | Entregar T2→T3→T4 numa única fatia verde; não commitar nenhuma sozinha. |
| Regressão de backup/sync ao extrair `DataClientProvider` | **Alto (driver 2)** | T1 mexe só em estado de dados, mantém navegação no AppContext até T2; rodar `exportImport`/sync tests a cada checkpoint. |
| Duplicação/divergência das duas pilhas (mobile vs desktop) | Médio | AMBAS usam `packages/navigation` (mesmo motor puro); só o estado diverge. |
| `location.hash` espelhando pilha errada entre cascas | Médio | Cada casca sincroniza o hash **da própria pilha**; desktop usa hash próprio da shell Tauri, mobile da web; gated por teste. |
| `packages/navigation` importa algo de React por engano | Médio | check-boundaries (regra `packages/*` já existe) + regra específica nova. |
| Bundle mobile passa a puxar estado/views desktop (ou vice-versa) | Médio | Overlays/resolução por shell + regra (c) do gate + inspeção de `preloadScreenChunks`. |

---

## 12. Open Questions (decisões fechadas)

> Todas as questões foram **resolvidas com o usuário** (2026-09-04). Nenhuma segue aberta.

1. **Motor puro → `packages/navigation`** (novo pacote dedicado). ✅ *(ADR-07-1 confirmado.)*
2. **Resolução inline por shell** (remover `ScreenLayers` por completo). ✅ *(ADR-07-4 confirmado.)*
3. **`headerConfig`/`DynamicHeaderConfig` → per-app** (derivado da pilha + sessão; cada casca
   monta o seu header). ✅ *(recomendação aceita)*
4. **`DataClientProvider` shared cobre dados de domínio + sync/backup + onboarding/ciclo de
   vida** (`exportData`/`importData`/`resetApp`/`completeOnboarding`). ✅ *(recomendação aceita)*
5. **Pilhas por app voláteis (em memória)**: navegação e sub-tabs não sobrevivem a reload;
   sub-tabs voláteis voltam ao estado inicial. ✅ *(ADR-07-6 confirmado.)*
3. **`headerConfig`** (DynamicHeaderConfig): é derivável da pilha + `DesktopSessionState`. Manter
   no per-app (recomendado) — confirma? Hoje vive no AppContext e é consumido pelo header de ambas.
4. **`onboarding`/ciclo de vida** (`completeOnboarding`, `resetApp`, `exportData`, `importData`):
   ficam no `DataClient` shared (recomendado — não são navegação). Confirma?
5. **Persistência das pilhas por app:** `usePersistentState` com chaves distintas
   (`mobileNav_stack` / `desktopNav_stack`) ou só em memória? (Recomendado: **em memória** —
   navegação não deve sobreviver a reload de forma divergente; sub-tabs já são voláteis.)

---

## 13. Decision Log (ADRs)

| ID | Decisão | Status | Drivers | Rationale | Consequências |
|---|---|---|---|---|---|
| ADR-07-1 | Motor de navegação puro em `packages/navigation` (novo pacote) | **Confirmed** | 1,3,5 | Um só lugar conhece `NavScreen`/derivação; sem React; testável | Mobile e desktop consomem o mesmo motor; só o estado diverge |
| ADR-07-2 | Cada casca possui **sua própria pilha** (mobile e desktop) | **Confirmed** | 1,2 | Independência de evolução + isolamento de sessão | Duas pilhas; ambas via motor 07-1; hash por casca ativa |
| ADR-07-3 | `DataClientProvider` shared (dados+sync+backup+onboarding) como raiz dos dois apps | **Confirmed** | 2,3 | Centraliza domínio; protege backup/sync | Navegação sai do AppContext; AppContext universal removido |
| ADR-07-4 | `ScreenLayers` removido; resolução de views inline por shell | **Confirmed** | 1,4 | Cada casca resolve as próprias telas; sem cola do tronco | MobileAppShell/DesktopAppShell mais explícitos |
| ADR-07-5 | Overlays por app (Mobile/Desktop) substituem `SharedOverlays`; mata `useApp()` | **Confirmed** | 1,4 | Último `useApp()` residual desaparece | Modais lêem o provider da casca |
| ADR-07-6 | Pilhas por app **em memória** (não persistidas em reload) | **Confirmed** | 2,4 | Navegação não sobrevive reload de forma divergente entre cascas | Sub-tabs voláteis voltam ao estado inicial |

---

## 14. Handoff to Implementation

- **Stack:** React 19 + TS + Vite; `npm run lint` = `tsc --noEmit`; `npm run test` = Vitest;
  gate obrigatório `node .github/scripts/check-boundaries.mjs`.
- **Diretórios:** `packages/navigation` (motor puro novo), `src/context/DataClientProvider.tsx` /
  `AppContext.tsx` (reduz/remove), `apps/mobile/src/mobileNavigation.ts` + `MobileAppProvider.tsx`,
  `apps/desktop/src/desktopNavigation.ts` + `DesktopAppProvider.tsx`, `src/shells/*.tsx` (inline),
  `src/overlays/MobileOverlays.tsx`/`DesktopOverlays.tsx`.
- **Primeira fatia:** T0 (extrair `packages/navigation` + re-export) + T1 (`DataClientProvider`) —
  sem risco, valida o fluxo e protege backup/sync desde o início.
- **Testes a criar:** `apps/desktop/src/__tests__/nav-independence.test.tsx` (duas cascas
  independentes) + testes unitários de `packages/navigation` (derive/stack/hash) + extensão de
  `exportImport` (sem campos de navegação no backup).
- **Decisões a preservar:** ADR-07-1…07-6; `packages/*` jamais importa `react`/`@capacitor/*`/
  `__TAURI__`; `DesktopSessionState` fora do `SyncPackage`; backup/sync verdes em cada etapa.
- **Open:** questões 1–5 de §12.
