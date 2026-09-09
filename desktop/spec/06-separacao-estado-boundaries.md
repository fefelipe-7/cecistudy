# Spec 06 — Separação de Estado e Boundaries (Mobile ↔ Desktop)

> **Módulo:** `desktop/spec/06-separacao-estado-boundaries.md`
> **Status:** proposta (a revisar)
> **Fase alvo:** separação de interface Fase 10.5 → 11
> **Autor:** agente de especificação (spec-driven-development + context-engineering + incremental-implementation + planning-and-task-breakdown + greenfield-architecture-planner)

Esta especificação é o **espinho arquitetural** da separação entre a casca mobile/web e a
casca desktop do cecistudy. Ela NÃO descreve features desktop novas (grafo, calendário,
documents, marketing) — essas têm specs próprias em `desktop/spec/`. O foco aqui é
**desacoplar o estado visual desktop do estado compartilhado** e **cerrar as fronteiras**
de importação entre `src/shells/ScreenLayers.tsx` (compartilhado) e o código desktop.

---

## 1. Objective (do que estamos construindo e por quê)

Hoje mobile e desktop consomem **exatamente o mesmo objeto de estado** (`AppContextValue`)
através de 4 contextos aninhados que recebem o mesmo `value`. Sinal de isso estar errado:
abrir o Grafo de Conhecimento ou um documento no desktop **mexe no mesmo estado** que
decide a visibilidade da barra inferior e a pilha de navegação do mobile — porque essas
flags (`isKnowledgeGraphOpen`, `isProjectsOpen`, `isInboxOpen`, `openDocuments`,
`activePanels`, `graphViewport`) moram no `AppContext` universal e são lidas também pela
camada compartilhada `ScreenLayers`.

**Objetivo:** criar um `DesktopSessionState` que contém **apenas o estado visual de
sessão do desktop** (painéis abertos, documentos abertos, viewport do grafo, sidebar
colapsada, workspace ativo), mantido vivo **só** dentro de `apps/desktop`, e fazer com
que a camada compartilhada `ScreenLayers` **desconheça** qualquer tela/flag desktop.
Assim as duas cascas evoluem de forma independente e o bundle mobile não puxa chunks nem
estado que não usa.

**Critério de aceite (fonte da verdade — `00-relatorio-varredura.md` §2.1 / §5):**
> abrir 2 documentos + `activePanels=['graph','calendar']` + `graphViewport` no desktop
> **NÃO** altera `navigationStack` / `isBottomNavVisible` / `overlayKey` do mobile, e o
> `SyncPackage` **NÃO** contém `openDocuments` / `graphViewport`.

---

## 2. Inputs revisados

- `desktop/spec/00-relatorio-varredura.md` — Seção 2 inteira (2.1–2.7) + "Resumo de ações".
- `src/context/AppContext.tsx` — trecho 2506–2519 (4 contextos com o MESMO `value`).
- `src/context/appContexts.ts` — 4 contextos: `AppBaseContext`, `DataClientContext`,
  `MobileAppContext`, `DesktopAppContext`.
- `src/context/mobileApp.ts` / `src/context/desktopApp.ts` — facades com tipagem.
- `apps/desktop/src/DesktopAppProvider.tsx` — hoje só injeta `shellExtras`, sem estado próprio.
- `apps/mobile/src/MobileAppProvider.tsx` — tem `useMobileApp()` próprio redundante.
- `src/shells/ScreenLayers.tsx` — `SlideContent` lê flags desktop e pré-carrega chunks desktop.
- `src/desktop/screens/DesktopScreenLayers.tsx` — hoje só repassa `<SlideContent shell="desktop">`.
- `src/shells/MobileAppShell.tsx:13,105,110–118` — importa o stub `DesktopSidebar`.
- `.github/scripts/check-boundaries.mjs` — regras atuais (não cobrem o acoplamento semântico).
- `src/overlays/MobileOverlays.tsx` / `src/overlays/DesktopOverlays.tsx` — quase idênticos.

---

## 3. Assumptions & Non-Goals

**Assumptions (corrigir se errado):**
- A. O `DataClient` (`packages/data`/`packages/domain`) é a fonte única de dados; estado
  de domínio (cursos, tarefas, leituras…) continua no `AppContext` compartilhado — NÃO se
  move para `DesktopSessionState`.
- B. O `SyncPackage` (backup/OTA) é derivado do `AppContext` compartilhado; estado visual
  de desktop não deve entrar nele.
- C. `apps/desktop` e `apps/mobile` são clientes independentes que montam suas próprias
  shells; `src/App.tsx` continua mobile/web-only (sem branch `isDesktop`).
- D. Import **dinâmico** (`import()`) é permitido através da fronteira (vira chunk separado);
  só import **estático** viola a regra de bundle.

**Non-Goals (fora desta spec):**
- Criar features novas (calendário, documents, marketing, biblioteca desktop master-detail).
- Persistir `DesktopSessionState` em `SyncPackage`/backup (fica em `usePersistentState`
  desktop-only, sem cruzar a fronteira de sync).
- Remover o master-detail já existente da faculdade (ele é o modelo a seguir).

---

## 4. Architecture Drivers (ordenados por peso)

1. **Independência de evolução** — desktop e mobile precisam adicionar telas/painéis sem
   se coordenar nem inflar o bundle um do outro. (mais alto)
2. **Tamanho de bundle** — mobile não deve pré-carregar KnowledgeGraph/Projects/Inbox.
3. **Testabilidade do gate** — `check-boundaries.mjs` precisa pegar regressões de acoplamento.
4. **Simplicidade / baixo risco** — separar em fatias incrementais que mantêm mobile funcionando.
5. **Convenção existente** — respeitar `appContexts.ts` (4 contextos) e o padrão de facade
   `useMobileApp`/`useDesktopApp`.

---

## 5. Current State (grounding — o que está errado hoje)

### 5.1 Os 4 contextos carregam o MESMO valor (`AppContext.tsx:2506–2514`)
```tsx
<AppBaseContext.Provider value={value}>
  <DataClientContext.Provider value={value}>
    <MobileAppContext.Provider value={value}>
      <DesktopAppContext.Provider value={value}>{children}</DesktopAppContext.Provider>
```
`useMobileApp()` e `useDesktopApp()` devolvem o **mesmo** `AppContextValue`. Não há split
real de estado: flags desktop (`isKnowledgeGraphOpen`, …) estão dentro de `value`.

### 5.2 `ScreenLayers` é o motor do desktop (`ScreenLayers.tsx:149–165, 270–307`)
`SlideContent` lê `useMobileApp()` e faz **branch em flags desktop-only**:
`app.isKnowledgeGraphOpen` / `app.isProjectsOpen` / `app.isInboxOpen` (linhas 154–165) e
injeta `desktopHome`/`desktopFaculdade` quando `shell==='desktop'`. A camada compartilhada,
portanto, conhece o desktop.

### 5.3 `preloadScreenChunks()` puxa chunks desktop no mobile (`ScreenLayers.tsx:109–111`)
`SCREEN_CHUNK_LOADERS` inclui `loadKnowledgeGraphScreen`, `loadProjectsScreen`,
`loadInboxScreen` — o web/mobile pré-carrega o que não usa.

### 5.4 `MobileAppShell` importa o stub legado (`MobileAppShell.tsx:13, 110–118`)
```tsx
import { DesktopSidebar } from '../components/DesktopSidebar';
...
<DesktopSidebarMemo activeTab={...} onChangeTab={...} onOpenWizard={...} onOpenTaskExamWizard={...} onOpenCompose={...} />
```
O arquivo `src/components/DesktopSidebar.tsx` (103 linhas) é um **stub obsoleto**; a
sidebar desktop real é `src/desktop/components/DesktopSidebar.tsx`. O "preview web largo"
mostra uma sidebar diferente da shell Tauri.

### 5.5 Ponte Tauri em código compartilhado (`src/lib/desktop.ts`)
Importada por `DesktopUpdateSection.tsx` e `notifications.ts` de forma que o bundle web
pode puxá-la. Deve morar em `apps/desktop`.

### 5.6 `apps/mobile` tem `useMobileApp()` redundante
`apps/mobile/src/MobileAppProvider.tsx:18` reexporta `useMobileApp()` que só retorna
`useApp()`. Todos os ~100+ usos reais importam de `@/context/mobileApp`.

### 5.7 Gate não cobre os dois gaps semânticos
`check-boundaries.mjs` pega só import **estático** (regra `ERR_NO_NATIVE_*`). Ele NÃO pega:
(a) flags desktop dentro de `ScreenLayers`, nem (b) os 4 contextos com valor idêntico.

---

## 6. Target Architecture

### 6.1 Estado — `DesktopSessionState` (dono: `apps/desktop/DesktopAppProvider`)

O estado visual de sessão do desktop vive **apenas** dentro do `DesktopAppProvider`, e é
mesclado no valor exposto pelo `DesktopAppContext` (não no `AppBaseContext`/`MobileAppContext`).
Forma concreta (TypeScript):

```ts
// apps/desktop/src/desktopSessionState.ts

export type DesktopPanelId = 'graph' | 'calendar' | 'inspector' | 'documents' | 'inbox' | 'projects';

export interface GraphViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface OpenDocumentRef {
  id: string;            // id do documento (quando M4 existir); padrão: projeto/tcc
  kind: 'tcc' | 'document' | 'note';
  title: string;
  projectId?: string;
}

export interface DesktopSessionState {
  // workspace / layout
  lastWorkspaceId: string | null;
  sidebarCollapsed: boolean;
  // painéis flutuantes (não são tabs)
  activePanels: DesktopPanelId[];
  // telas desktop dedicadas (resolvidas DENTRO da shell desktop, não na compartilhada)
  isKnowledgeGraphOpen: boolean;
  isProjectsOpen: boolean;
  isInboxOpen: boolean;
  // grafo
  selectedGraphNodeId: string | null;
  graphViewport: GraphViewport;
  // documents (M4)
  openDocuments: OpenDocumentRef[];
  selectedDocumentId: string | null;
  // inspector de contexto
  inspectorOpen: boolean;
  // command palette (desktop-only overlay leve)
  isCommandPaletteOpen: boolean;
}
```

**Regras absolutas:**
- `DesktopSessionState` **NÃO** é parte de `AppContextValue` nem do `SyncPackage`.
- Nenhum campo acima aparece em `src/context/AppContext.tsx` nem em `packages/*`.
- O estado é mantido via `usePersistentState('desktopSession', emptyDesktopSession)`
  **dentro** de `apps/desktop` (não cruza para o app mobile).
- Telas desktop (`KnowledgeGraphScreen`, `ProjectsScreen`, `InboxScreen`,
  `ContextInspector`, `CommandPalette`, futuras `CalendarScreen`/`DocumentsScreen`) leem
  esses campos do **facade `useDesktopApp()` aumentado**, nunca de `useMobileApp()`.

### 6.2 Como os 4 contextos deixam de ter o mesmo valor

`AppBaseProvider` continua fornecendo o estado **compartilhado** (dados + navegação) para
`AppBaseContext`, `DataClientContext` e `MobileAppContext` (estes três com o mesmo `base`):

```tsx
// src/context/AppContext.tsx (após a mudança)
<AppBaseContext.Provider value={base}>
  <DataClientContext.Provider value={base}>
    <MobileAppContext.Provider value={base}>{children}</MobileAppContext.Provider>
```
> `DesktopAppContext` **NÃO** é mais preenchido aqui. Ele é preenchido só por
> `apps/desktop/src/DesktopAppProvider.tsx` com o valor **aumentado**
> `{ ...base, ...desktopSession, shellExtras }`.

`apps/desktop/src/DesktopAppProvider.tsx` vira o dono real do estado desktop:
```tsx
function DesktopExtras({ children }: { children: React.ReactNode }) {
  const base = useMobileApp();                       // base compartilhado (MobileAppContext)
  const session = useDesktopSession();               // estado visual desktop (ver 6.1)
  const augmented = { ...base, ...session, shellExtras: desktopShellExtras };
  // shellExtras.updateSection continua (PerfilView desktop)
  return (
    <DesktopAppContext.Provider value={augmented}>{children}</DesktopAppContext.Provider>
  );
}
```
Resultado: `MobileAppContext` e `DesktopAppContext` carregam valores **diferentes**
(`DesktopAppContext` inclui `desktopSession` + `shellExtras`). O gap "4 contextos com
mesmo valor" deixa de existir para a distinção mobile/desktop.

> `apps/mobile/src/MobileAppProvider.tsx` **remove** o `useMobileApp()` local e passa a
> repassar o `MobileAppContext` (ou simplesmente usa `AppProvider` + facade
> `@/context/mobileApp`). Ver Tarefa F1.

### 6.3 Renderização — `ScreenLayers` compartilhado desconhece o desktop

`src/shells/ScreenLayers.tsx` (`SlideContent`/`OverlayContent`):
- **Remove** as branches desktop (`app.isKnowledgeGraphOpen` / `app.isProjectsOpen` /
  `app.isInboxOpen` nas linhas 154–165) e o parâmetro `shell`.
- Deixa de importar `loadKnowledgeGraphScreen`/`loadProjectsScreen`/`loadInboxScreen`.
- Passa a renderizar **só** o que é compartilhado: tabs base + telas auxiliares de 1º nível
  (curso, notas, templo, streak, sync, quiz, study, compose, wizards, detalhes de nota).
- `preloadScreenChunks()` passa a cobrir **só** os chunks compartilhados (mobile/web).

A resolução das telas desktop vai para `src/desktop/screens/DesktopScreenLayers.tsx`, que
passa a ser o dono de um `DesktopSlideContent` próprio (não mais um repasse de
`<SlideContent shell="desktop">`):

```tsx
// src/desktop/screens/DesktopScreenLayers.tsx (alvo)
export const DesktopSlideContent: React.FC = () => {
  const app = useDesktopApp();                       // já traz desktopSession
  if (app.isKnowledgeGraphOpen) return <KnowledgeGraphScreen />;
  if (app.isProjectsOpen)     return <ProjectsScreen />;
  if (app.isInboxOpen)        return <InboxScreen />;
  // caso contrário: SlideContent compartilhado (tabs base) com os forks desktop
  return (
    <SlideContent
      desktopHome={<HomeScreen />}
      desktopFaculdade={buildDesktopFaculdade(app)}
    />
  );
};
```
- `preloadDesktopScreenChunks()` (já existente neste arquivo) cobre
  KnowledgeGraph/Projects/Inbox/HomeScreen/master-detail — **só** a casca desktop o chama.

> `DesktopScreenLayers` é importado **estaticamente só** por `src/shells/DesktopAppShell.tsx`
> (que está na lista proibida de importar mobile, mas aqui é o sentido inverso: desktop
> importa a camada compartilhada `ScreenLayers` — permitido pois `ScreenLayers` não importa
> desktop de volta; fronteira de import estático desktop→mobile é o que é proibido, ver 6.5).

### 6.4 Boundary rules (exatas, auditáveis)

| ID | Regra | Onde aplicada | Detectado por |
|---|---|---|---|
| B1 | UI compartilhada **não** brancha por plataforma (`isDesktop` / `isMobile` / `Capacitor.isNativePlatform` / `__TAURI__` / `window.__TAURI__`) | `src/components`, `src/shells/ScreenLayers.tsx`, `src/overlays/*` | `check-boundaries.mjs` (já existe) |
| B2 | `src/shells/ScreenLayers.tsx` **não** referencia flags desktop (`isKnowledgeGraphOpen`, `isProjectsOpen`, `isInboxOpen`) nem importa `src/desktop/**`/`apps/desktop/**` (nem dinâmico) | `src/shells/ScreenLayers.tsx` | `check-boundaries.mjs` (NOVO — ver 6.6) |
| B3 | `src/desktop/**` e `apps/desktop/**` **não** importam estaticamente UI mobile (`src/components/views/*`, `BottomNav`, `EdgeSwipeBack`, `useMobileApp`, `MobileAppShell`, `MobileOverlays`, `src/App.tsx`, `apps/mobile`) | `apps/desktop`, `src/desktop`, `DesktopAppShell`, `DesktopOverlays` | `check-boundaries.mjs` (já existe) |
| B4 | `apps/mobile/**`, `src/App.tsx`, `MobileAppShell`, `ScreenLayers`, `MobileOverlays` **não** importam estaticamente `src/desktop`, `apps/desktop`, `desktopApp`, `desktop-tokens` | mobile-side | `check-boundaries.mjs` (já existe) |
| B5 | Ponte Tauri (`desktop.ts`) vive **só** em `apps/desktop/lib/desktop.ts` (ou import dinâmico a partir de `apps/desktop`); código compartilhado (`src/lib/notifications.ts`, `DesktopUpdateSection`) não a importa estaticamente | `src/lib`, `src/desktop/components` | `check-boundaries.mjs` (NOVO — proibir `src/lib/desktop` / `from '.../lib/desktop'`) |
| B6 | Estado visual desktop (`DesktopSessionState`) **não** aparece em `AppContextValue` nem em `SyncPackage` | `src/context/AppContext.tsx`, `src/lib/persistentData.ts` | revisão manual + teste de shape do backup (ver Tarefa S2) |
| B7 | `MobileAppContext` e `DesktopAppContext` **não** recebem o mesmo objeto aumentado (desktop inclui `desktopSession`) | `AppContext.tsx`, `DesktopAppProvider.tsx` | `check-boundaries.mjs` (NOVO — ver 6.6) |

### 6.5 Overlays — unificar `DesktopOverlays`/`MobileOverlays`

`src/overlays/MobileOverlays.tsx` e `src/overlays/DesktopOverlays.tsx` são quase idênticos
(montam `QuickAddModal`, `GlobalSearchModal`, `EditCourseModal`, `EditTccModal`, `Toast`).
**Ação:** mover a fonte única para `src/overlays/SharedOverlays.tsx` (camada compartilhada,
**sem** branch de plataforma — respeita B1) e fazer com que ambas as shells importem dela.
A moldura (fullscreen no mobile, janela central no desktop) continua sendo decisão da shell
(`MobileAppShell`/`DesktopAppShell`), não do overlay. Os dois arquivos antigos são deletados.

### 6.6 Cobertura do gate — extensão de `check-boundaries.mjs`

Adicionar ao script (mantendo o formato atual de `checks`):

- **(a) flags desktop em `ScreenLayers`** — novo `check` com `targets: ['src/shells/ScreenLayers.tsx']`
  e `forbiddenContent: ['isKnowledgeGraphOpen','isProjectsOpen','isInboxOpen','from \'../desktop','../desktop/components/KnowledgeGraphScreen','../desktop/components/ProjectsScreen','../desktop/components/InboxScreen']`.
- **(b) 4 contextos com valor idêntico** — novo `check` que lê `src/context/AppContext.tsx`
  e falha se encontrar `DesktopAppContext.Provider value={value}` **e** não existir nenhum
  provider desktop que mescle `desktopSession` (heurística: procurar `DesktopAppContext.Provider value={` com spread/objeto diferente de `value` em `apps/desktop/src/DesktopAppProvider.tsx`). Se a heurística for frágil, **documentar como aceitação manual** no item 6.7 e manter o teste de shape de backup (Tarefa S2) como guarda funcional.
- **(c) ponte Tauri** — estender o `check` "shared UI não deve branchar por plataforma" ou
  adicionar `forbiddenSpecifiers: ['src/lib/desktop','/lib/desktop']` ao `targets: ['src/lib','src/desktop/components']`.

### 6.7 Gaps aceitos como verificação manual (se a heurística do item 6.6b for frágil)
- A distinção exata de "objeto aumentado" é validada por teste de componente/integração:
  montar `DesktopAppProvider`, abrir grafo, e afirmar que `useMobileApp()` (lido num
  componente filho mobile mock) **não** tem `isKnowledgeGraphOpen` alterado. (Ver Tarefa S2.)
- O `SyncPackage` não conter `openDocuments`/`graphViewport` é validado por teste de
  `buildBackupPayload`/`readDatabaseFromState` (estende `src/lib/__tests__/exportImport.test.ts`).

---

## 7. UI Architecture (composição das cascas após a mudança)

```
AppProvider (base compartilhado)
├── MobileAppContext ──► apps/mobile  → MobileAppShell → SlideContent (sem desktop) + SharedOverlays
│                       (web)         → MobileAppShell (sem stub DesktopSidebar)
└── DesktopAppContext ─► apps/desktop → DesktopAppProvider (base + DesktopSessionState + shellExtras)
                                      → DesktopAppShell → DesktopSlideContent (resolve grafo/projetos/inbox)
                                                       → SharedOverlays (moldura central)
```

- `SlideContent`/`OverlayContent` continuam sendo a "cola" das telas compartilhadas; perdem
  qualquer noção de `shell` e de desktop.
- `DesktopScreenLayers` vira o orquestrador desktop (telas dedicadas + forks `desktopHome`/
  `desktopFaculdade`), chamado só por `DesktopAppShell`.

---

## 8. Data Model (o que sai do `AppContextValue`)

Remover de `AppContextValue` (e de `src/context/AppContext.tsx`):
`isKnowledgeGraphOpen`, `isProjectsOpen`, `isInboxOpen`, `openDocuments`, `activePanels`,
`graphViewport`, `selectedGraphNodeId`, `sidebarCollapsed`, `lastWorkspaceId`,
`inspectorOpen`, `isCommandPaletteOpen`.

Eles passam a viver em `DesktopSessionState` (6.1), expostos mesclados no `DesktopAppContext`.
Os handlers correspondentes (`openKnowledgeGraph`, `closeKnowledgeGraph`, `togglePanel`,
`setGraphViewport`, `openDocument`, `closeDocument`, …) também migram para o
`DesktopAppProvider` (ou para um `useDesktopSession` que os cria), e NÃO para o `AppContext`.

> Estados que **permanecem** no `AppContext` compartilhado: `navigationStack`, `activeTab`,
> `isBottomNavVisible`, `overlayKey`, `focusedCourse`, `isNotesScreenOpen`, `isComposeScreenOpen`,
> `isWizardOpen`, dados de domínio, `shellExtras` (este último é aumentado só no desktop — ok,
> pois é uma extensão de UI, não estado de navegação).

---

## 9. Implementation Plan (incremental — planning-and-task-breakdown)

Princípio: cada fatia deixa o sistema **compilável e com os testes verdes**. Mobile nunca
quebra entre fatias. Ordem bottom-up (estado → render → boundary → gate).

### Phase 0 — Preparação (sem risco de quebrar mobile)
- **T0 — Deletar stub `src/components/DesktopSidebar.tsx`** e remover seu import/render de
  `MobileAppShell.tsx` (linhas 13, 22, 110–118). O preview web largo passa a usar só
  BottomNav/FAB; a sidebar desktop real existe só na shell Tauri.
  - Aceite: `MobileAppShell.tsx` não importa `DesktopSidebar`; build web ok.
  - Verify: `npm run lint` + `npm run test` + `npm run build`.
  - Files: `src/shells/MobileAppShell.tsx`, `src/components/DesktopSidebar.tsx` (delete).
- **T1 — Remover `useMobileApp` redundante de `apps/mobile`** (`MobileAppProvider.tsx:18`).
  O provider mobile passa a usar `AppProvider` + facade `@/context/mobileApp`.
  - Aceite: `apps/mobile` não define `useMobileApp` próprio; `grep -rn "from '../MobileAppProvider'"`
    não acha uso do hook locale.
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `apps/mobile/src/MobileAppProvider.tsx`.

### Phase 1 — Ponte Tauri para `apps/desktop` (fecha B5)
- **T2 — Mover `src/lib/desktop.ts` → `apps/desktop/lib/desktop.ts`** e ajustar imports:
  `src/desktop/components/DesktopUpdateSection.tsx` importa de `apps/desktop/lib/desktop.ts`;
  `src/lib/notifications.ts` troca o import estático por **import dinâmico** (`import('@/…')`
  ou, melhor, recebe a ponte via `shellExtras`/injeção) para não puxar Tauri no web.
  - Aceite: `grep -rn "from '.*src/lib/desktop'"` retorna vazio; `check-boundaries` passa.
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `src/lib/desktop.ts` (move), `src/desktop/components/DesktopUpdateSection.tsx`,
    `src/lib/notifications.ts`.
- **Checkpoint P1:** `check-boundaries.mjs` OK + testes verdes + build limpo.

### Phase 2 — Criar `DesktopSessionState` (fecha 6.1/6.2/B6/B7)
- **T3 — Criar `apps/desktop/src/desktopSessionState.ts`** com a interface de 6.1 + `emptyDesktopSession()` + `useDesktopSession()` (hook `usePersistentState`).
  - Aceite: arquivo existe; `DesktopSessionState` não importa `react` de forma proibida
    (ele é app code, não `packages/*` — ok).
  - Verify: `npm run lint` + `npm run test`.
  - Files: `apps/desktop/src/desktopSessionState.ts` (novo).
- **T4 — Retirar flags desktop de `AppContextValue`** (`src/context/AppContext.tsx`):
  remover os campos e seus handlers do `value` base; parar de preencher `DesktopAppContext`
  aqui (só `AppBase`/`DataClient`/`Mobile`).
  - Aceite: `grep -n "isKnowledgeGraphOpen\|openDocuments\|graphViewport" src/context/AppContext.tsx`
    não acha definição no `value`; tipos de `AppContextValue` não os contêm.
  - Verify: `npm run lint` + `npm run test` (telas desktop vão quebrar temporariamente —
    segurar com T5 antes do commit, ou fazer T4+T5 juntos).
  - Files: `src/context/AppContext.tsx`.
- **T5 — `DesktopAppProvider` injeta `DesktopSessionState` + handlers** no `DesktopAppContext`:
  `augmented = { ...base, ...session, shellExtras }`; criar handlers `openKnowledgeGraph` etc.
  que atualizam o `useDesktopSession`. Telas desktop (`KnowledgeGraphScreen`, `ProjectsScreen`,
  `InboxScreen`) passam a ler `app.isKnowledgeGraphOpen` do facade aumentado.
  - Aceite: desktop abre/fecha grafo/projetos/inbox; `useMobileApp()` (filho mobile mock) não
    vê essas flags.
  - Verify: `npm run lint` + `npm run test` + `npm run build`.
  - Files: `apps/desktop/src/DesktopAppProvider.tsx`, telas desktop citadas.
- **Checkpoint P2:** critério de aceite parcial — abrir grafo no desktop não altera
  `navigationStack`/`isBottomNavVisible` do mobile (validado por T2 de teste em S2).

### Phase 3 — `ScreenLayers` desacoplado (fecha 6.3/B2)
- **T6 — `ScreenLayers` perde branch desktop + param `shell`** (linhas 149, 154–165, 270–307):
  remover `isKnowledgeGraphOpen/isProjectsOpen/isInboxOpen` e o `if shell==='desktop'`;
  remover os 3 `load*Screen` desktop de `SCREEN_CHUNK_LOADERS`.
  - Aceite: `src/shells/ScreenLayers.tsx` não referencia flags desktop nem importa `src/desktop`.
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `src/shells/ScreenLayers.tsx`.
- **T7 — `DesktopScreenLayers` vira orquestrador desktop** (resolve grafo/projetos/inbox +
  forks `desktopHome`/`desktopFaculdade`); `preloadDesktopScreenChunks()` cobre os chunks
  desktop; `preloadScreenChunks()` cobre só compartilhados.
  - Aceite: mobile não pré-carrega KnowledgeGraph/Projects/Inbox (verificável por inspeção de
    `SCREEN_CHUNK_LOADERS` em cada arquivo).
  - Verify: `npm run lint` + `npm run test` + `npm run build`.
  - Files: `src/desktop/screens/DesktopScreenLayers.tsx`, `src/shells/ScreenLayers.tsx`.
- **Checkpoint P3:** `check-boundaries` pega B2; build mobile ok.

### Phase 4 — Overlays unificados (fecha 6.5)
- **T8 — Criar `src/overlays/SharedOverlays.tsx`** com a lógica atual; deletar
  `MobileOverlays.tsx` e `DesktopOverlays.tsx`; ambas as shells importam `SharedOverlays`.
  - Aceite: `grep -rn "MobileOverlays\|DesktopOverlays"` retorna só o import em cada shell;
    sem branch de plataforma no arquivo compartilhado.
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`.
  - Files: `src/overlays/SharedOverlays.tsx` (novo), `MobileOverlays.tsx` (del),
    `DesktopOverlays.tsx` (del), `MobileAppShell.tsx`, `DesktopAppShell.tsx`.
- **Checkpoint P4:** `check-boundaries` OK; testes verdes.

### Phase 5 — Gate estendido (fecha 6.6/B2/B5/B7)
- **T9 — Estender `check-boundaries.mjs`** com os checks (a) flags desktop em `ScreenLayers`,
  (b) 4 contextos com valor idêntico (ou documentar gap manual), (c) ponte Tauri fora de
  `apps/desktop`.
  - Aceite: rodar o script em estado "violado propositalmente" (branch de teste) faz ele falhar;
    no estado final passa.
  - Verify: `node .github/scripts/check-boundaries.mjs` (deve imprimir OK).
  - Files: `.github/scripts/check-boundaries.mjs`.
- **T10 — Testes funcionais de separação** (estende `src/lib/__tests__/exportImport.test.ts`
  e adiciona `apps/desktop/src/__tests__/desktopSession.test.tsx`): afirmar que
  `buildBackupPayload`/`readDatabaseFromState` **não** contêm `openDocuments`/`graphViewport`,
  e que montar `DesktopAppProvider` + abrir grafo não altera um `useMobileApp()` irmão.
  - Aceite: testes novos passam.
  - Verify: `npm run test -- src/lib/__tests__/exportImport.test.ts` +
    `npm run test -- apps/desktop/src/__tests__/desktopSession.test.tsx`.
  - Files: testes citados (novos).
- **Checkpoint Final:** `npm run lint` + `npm run test` (todos) + `npm run build` + `node .github/scripts/check-boundaries.mjs` verdes.

### Ordem de execução resumida
```
T0 → T1 → T2 → (T3 → T4 → T5 em conjunto) → T6 → T7 → T8 → T9 → T10
```
T4/T5 devem ser entregues juntos (telas desktop quebram entre eles). Todas as outras são
independentes e podem ser revertidas isoladamente.

---

## 10. Success Criteria (como saberemos que está pronto)

- [ ] `abrir 2 documentos + activePanels=['graph','calendar'] + graphViewport` no desktop
      **NÃO** altera `navigationStack`/`isBottomNavVisible`/`overlayKey` do mobile.
- [ ] `SyncPackage`/`buildBackupPayload` **NÃO** contém `openDocuments`/`graphViewport`/
      campos de `DesktopSessionState`.
- [ ] `src/shells/ScreenLayers.tsx` não referencia `isKnowledgeGraphOpen`/`isProjectsOpen`/
      `isInboxOpen` nem importa `src/desktop/**`.
- [ ] `MobileAppShell.tsx` não importa `DesktopSidebar`; arquivo stub deletado.
- [ ] Ponte Tauri mora em `apps/desktop/lib/desktop.ts`; `src/lib/notifications.ts` não a
      importa estaticamente.
- [ ] `apps/mobile` não define `useMobileApp` próprio.
- [ ] `MobileAppContext` e `DesktopAppContext` carregam valores distintos (desktop aumentado).
- [ ] Overlays unificados em `SharedOverlays`; sem branch de plataforma.
- [ ] `check-boundaries.mjs` pega (a) flags desktop em `ScreenLayers` e (b) ponte Tauri fora
      de `apps/desktop`; gap (c) 4-contextos documentado e coberto por teste funcional.
- [ ] `npm run lint` + `npm run test` + `npm run build` + `node .github/scripts/check-boundaries.mjs`
      verdes.

---

## 11. Risks and Mitigations

| Risco | Impacto | Mitigação |
|---|---|---|
| T4/T5 entregues separados quebram telas desktop | Alto | Entregar T3→T4→T5 numa única fatia verde; não commitar T4 sozinho. |
| Heurística do gate p/ "4 contextos iguais" é frágil | Médio | Cobrir com teste funcional (T10) + documentar gap manual (6.7). |
| `notifications.ts` precisa de Tauri no desktop mas não no web | Médio | Injeção via `shellExtras` ou import dinâmico resolvido no boot da casca. |
| `preloadScreenChunks` dividido quebra 1ª visita sem skeleton | Baixo | `ViewFallback` já existe; desktop mantém seu próprio preload. |
| Regressão de bundle mobile (puxa chunk desktop) | Médio | `check-boundaries` B2 + inspeção de `SCREEN_CHUNK_LOADERS` em T6/T7. |

---

## 12. Open Questions (precisam de input humano)

1. `shellExtras.updateSection` (PerfilView desktop) deve continuar como aumento de
   `DesktopAppContext`, ou virar prop explícita da `PerfilView`? (Mantido como está hoje
   para não quebrar o Perfil compartilhado — decisão atual: manter.)
2. `inspectorOpen`/`isCommandPaletteOpen` entram em `DesktopSessionState` já nesta fase ou
   só quando suas telas forem construídas? (Recomendação: incluir no tipo agora, usá-los
   quando as telas existirem — evita novo round de mudança de tipo.)
3. Persistência de `DesktopSessionState`: `usePersistentState` local desktop ou
   `@capacitor/preferences`? (Desktop é Tauri/web; usar `usePersistentState` padrão do
   projeto, que já lida com dual — sem novidade.)

---

## 13. Decision Log (ADRs)

| ID | Decisão | Status | Drivers | Rationale | Consequências |
|---|---|---|---|---|---|
| ADR-06-1 | Criar `DesktopSessionState` em `apps/desktop`, mesclado só no `DesktopAppContext` | Proposed | 1,4 | Separa estado visual de navegação; mobile não o carrega | Telas desktop leem facade aumentado; `SyncPackage` limpo |
| ADR-06-2 | `ScreenLayers` perde `shell` e flags desktop; orquestração vai a `DesktopScreenLayers` | Proposed | 1,2 | Bundle mobile não puxa chunks desktop; fronteira clara | DesktopAppShell chama DesktopScreenLayers |
| ADR-06-3 | Deletar stub `src/components/DesktopSidebar.tsx` | Proposed | 4 | Elimina acoplamento mobile→desktop por engano | Preview web largo usa BottomNav/FAB |
| ADR-06-4 | Ponte Tauri mora em `apps/desktop/lib/desktop.ts` | Proposed | 3,5 | `check-boundaries` B5; web não puxa Tauri | notifications precisa de injeção dinâmica |
| ADR-06-5 | Overlays unificados em `src/overlays/SharedOverlays.tsx` | Proposed | 4 | Remove duplicação; sem branch de plataforma | Moldura continua na shell |
| ADR-06-6 | Estender `check-boundaries.mjs` (flags em ScreenLayers + Tauri + 4-contextos) | Proposed | 3 | Gate pega regressões semânticas | Heurística frágil coberta por teste |

---

## 14. Handoff to Implementation

- **Stack:** React 19 + TS + Vite; `npm run lint` = `tsc --noEmit`; `npm run test` = Vitest;
  gate obrigatório `node .github/scripts/check-boundaries.mjs`.
- **Diretórios:** `src/context/*` (estado compartilhado), `apps/desktop/src/*` (estado +
  provider desktop), `src/shells/ScreenLayers.tsx` (cola compartilhada),
  `src/desktop/screens/DesktopScreenLayers.tsx` (orquestrador desktop),
  `src/overlays/SharedOverlays.tsx` (overlays unificados).
- **Primeira fatia:** T0 (deletar stub) + T1 (fork `useMobileApp`) — sem risco, valida o
  fluxo de boundary check.
- **Testes a criar:** `apps/desktop/src/__tests__/desktopSession.test.tsx` (separação de
  estado) e extensão de `src/lib/__tests__/exportImport.test.ts` (SyncPackage sem campos desktop).
- **Decisões a preservar:** ADR-06-1…06-6; `packages/*` jamais importa `react`/`__TAURI__`.
- **Open:** questões 1–3 de §12.
