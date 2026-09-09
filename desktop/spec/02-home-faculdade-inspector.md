# Spec: Home, Faculdade Master-Detail, Context Inspector & Command Palette (Desktop)

> Módulo desktop do cecistudy — evolução das telas compartilhadas para experiências
> desktop-only (workspace, master-detail, painéis, busca agrupada). Esta spec é a fonte
> da verdade entre a separação de interface mobile↔desktop e as quatro features pedidas.
> Caminho: `desktop/spec/02-home-faculdade-inspector.md`.

Este documento segue o fluxo **spec-driven-development** (problema → objetivos → UX desktop
proposta → componentes/arquivos → `DesktopSessionState` → tokens → critérios de aceite →
"como remover a parte mobile compartilhada"). Os princípios de **composition patterns**
(compound components, estado elevado a provider, sem boolean-prop proliferation), de
**frontend-design** (calor só em Home/feedback; zonas de produção Notion-like) e de
**ui-ux-pro-max** (acessibilidade, foco visível, reduced-motion) foram aplicados nas decisões.

---

## 0. Capability map (escopo)

| Module id | Responsibility | Depends on |
|---|---|---|
| home-desktop | Home desktop com `recentItems` (G4), prazos e atalhos | desktop-session, data-client |
| faculdade-master-detail | Painel direito comparando 2 disciplinas, drag de aula, grade semanal | desktop-session, data-client |
| context-inspector | Inspector reativo a seleção múltipla + relações do grafo + ações | desktop-session, knowledge-graph (futuro) |
| command-palette | Busca agrupada (G5) + criação rápida + histórico + fuzzy | desktop-session, data-client |
| screenlayers-fork | `ScreenLayers` compartilhado desconhece flags desktop; resolver telas desktop em `DesktopScreenLayers` | boundary-rules |

Build order: `screenlayers-fork` → `home-desktop` → `faculdade-master-detail` →
`context-inspector` → `command-palette`.

Dependência de boundary (`.github/scripts/check-boundaries.mjs`):
- `ERR_NO_NATIVE_DESKTOP`: `src/desktop/**` / `apps/desktop/**` **nunca** importam
  estaticamente `src/shells/*`, `src/components/views/**`, `apps/mobile/**`.
- `ERR_NO_PLATFORM_IN_SHARED`: `src/shells/ScreenLayers.tsx`, `src/components`, `src/overlays/*`
  **nunca** brancham por plataforma (`isDesktop`/`isMobile`/`Capacitor.isNativePlatform`/`__TAURI__`).
- Import **dinâmico** (`import()`) é permitido — é o mecanismo usado hoje para
  `KnowledgeGraphScreen`/`ProjectsScreen`/`InboxScreen`.

---

## 1. Objetivo geral

Transformar quatro superfícies desktop que hoje são (a) fork incompleto da view mobile
ou (b) camada compartilhada com acoplamento semântico ao desktop, em componentes
desktop-only bem definidos, **sem** duplicar estado de domínio e **sem** violar o
`check-boundaries.mjs`. O estado de domínio continua no `AppContext` universal (lido via
`useDesktopApp()`); o estado **visual** exclusivo do desktop (painéis abertos, seleção,
viewport, atalhos) vive em `DesktopSessionState`.

---

## 2. Precondições / assumções

ASSUMPTIONS I'M MAKING:
1. O `AppContext` universal continua sendo a fonte de dados (não criamos repositories novos aqui).
2. `useDesktopApp()` é a facade correta para ler estado no desktop (já retorna `AppContextValue`).
3. Telas desktop-only (`KnowledgeGraphScreen`, `ProjectsScreen`, `InboxScreen`, `HomeScreen`)
   são exclusivas da casca Tauri e NUNCA devem ser importadas estaticamente por `ScreenLayers`.
4. `src/desktop/styles/desktop-tokens.css` (`--ds-*`) é a única fonte de tokens desktop.
5. O JSON `desktop/cecistudy-desktop-shell.json` é o contrato de layout (hardConstraints: rosa
   nunca é fundo de painel, teto radius 20px, sem paper-texture, sem liquid-glass, sem bounce
   tátil, shadow-xl proibido, tokens só em `desktop-tokens.css`).
6. `DesktopSessionState` será agregado pelo `DesktopAppProvider` (em `src/desktop/context` ou
   `apps/desktop`), e seu tipo mora em código desktop (não em `packages/*`).

→ Corrija agora ou prossigo com estas.

---

## 3. screenlayers-fork (desacoplamento da camada compartilhada)

### 3.1 Problema
`src/shells/ScreenLayers.tsx` (camada compartilhada mobile+desktop) hoje:
- importa `useMobileApp` e faz branch em flags **desktop-only** `isKnowledgeGraphOpen`
  / `isProjectsOpen` / `isInboxOpen` (linhas 154–165) — acoplamento semântico proibido por
  `ERR_NO_PLATFORM_IN_SHARED` (não pego pelo script pois é flag, não import estático, mas é
  exatamente o que a separação quer eliminar).
- `preloadScreenChunks()` pré-carrega também os chunks desktop (linhas 109–111), fazendo o
  web/mobile buscar chunks que não usa.

### 3.2 Objetivo
`ScreenLayers` (compartilhado) **desconhece** telas/flags desktop. A resolução de
Inbox/Graph/Projects/documents passa para `src/desktop/screens/DesktopScreenLayers.tsx`.
O preload é separado por casca.

### 3.3 UX proposta
Nenhuma mudança visual direta; é refatoração estrutural. O comportamento de tela permanece.

### 3.4 Componentes / arquivos a criar ou mudar

**Mudar — `src/shells/ScreenLayers.tsx`:**
- Remover as linhas 154–165 (`app.isKnowledgeGraphOpen ? … : app.isProjectsOpen ? … : app.isInboxOpen ? …`).
- Remover os `loadKnowledgeGraphScreen` / `loadProjectsScreen` / `loadInboxScreen` (linhas 42–44)
  e as `const KnowledgeGraphScreen/ProjectsScreen/InboxScreen = lazy(...)`.
- Remover esses três do `SCREEN_CHUNK_LOADERS` (linhas 109–111).
- `SlideContent` perde os props `desktopFaculdade`/`desktopHome`? Não — esses são
  desktop-only mas injetados pela própria `DesktopSlideContent` (que já passa `shell="desktop"`).
  Manter os props, pois são nós React (não flags de plataforma). O ponto crítico é só a leitura
  de `app.isKnowledgeGraphOpen` etc., que sai.
- `preloadScreenChunks()` (web/mobile) fica com os chunks mobile apenas.

**Mudar — `src/desktop/screens/DesktopScreenLayers.tsx`:**
- Adicionar resolução das telas desktop-only DENTRO da camada desktop (usando os mesmos
  `import()` dinâmicos, permitidos pela boundary):
  ```ts
  const KnowledgeGraphScreen = lazy(() => import('../components/KnowledgeGraphScreen'));
  const ProjectsScreen = lazy(() => import('../components/ProjectsScreen'));
  const InboxScreen = lazy(() => import('../components/InboxScreen'));
  ```
- Implementar um `DesktopAuxScreens` que renderiza Graph/Projects/Inbox por cima do
  `SlideContent` quando o estado correspondente de `DesktopSessionState` estiver aberto.
- `preloadDesktopScreenChunks()` passa a pré-carregar Graph/Projects/Inbox **e** o
  master-detail da faculdade (já faz hoje).

**Mudar — `src/shells/DesktopAppShell.tsx`:**
- Onde hoje o `SlideContent` é o único conteúdo, passar a montar:
  `<DesktopAuxScreens />` (telas desktop sobrepostas) envolvendo `<DesktopSlideContent />`.

### 3.5 `DesktopSessionState` (campos desta feature)
```ts
// src/desktop/state/desktopSession.ts
export interface DesktopSessionState {
  // … (ver seção 4 para o todo)
  isKnowledgeGraphOpen: boolean;
  isProjectsOpen: boolean;
  isInboxOpen: boolean;
  // documentos/calendário serão adicionados em fases futuras
}
```

### 3.6 Tokens
Nenhum token novo. Reuso de `--ds-surface-canvas`, `--ds-elevation-md`, `--ds-border-default`.

### 3.7 Critérios de aceite
- `node .github/scripts/check-boundaries.mjs` passa sem violação.
- `ScreenLayers.tsx` não referencia `isKnowledgeGraphOpen`/`isProjectsOpen`/`isInboxOpen`.
- Abertura de Grafo/Projetos/Inbox continua funcionando na casca Tauri.
- `preloadScreenChunks()` (web/mobile) não inclui chunks `KnowledgeGraph`/`Projects`/`Inbox`.

### 3.8 Como remover / tirar a parte mobile compartilhada
- O acoplamento atual é **semântico** (flags lidas dentro do arquivo compartilhado), não import
  estático. Extrair a leitura dessas flags para `DesktopScreenLayers` (que é código `src/desktop`,
  permitido importar dinamicamente as telas desktop). `ScreenLayers` volta a ser puramente
  mobile/base. Telas desktop nunca são referenciadas por `ScreenLayers`.

---

## 4. Estado desktop: `DesktopSessionState` (consolidado)

Todas as quatro features escrevem neste estado. Tipo canônico (morando em `src/desktop/state/desktopSession.ts`,
importado pelo `DesktopAppProvider` de `apps/desktop`):

```ts
export interface DesktopSessionState {
  // ---- shell / painéis ----
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  isKnowledgeGraphOpen: boolean;
  isProjectsOpen: boolean;
  isInboxOpen: boolean;
  // activePanels: Array<'graph' | 'calendar' | 'documents'>; // fases futuras

  // ---- home ----
  recentItemsLimit: number; // default 6

  // ---- faculdade master-detail ----
  selectedCourseIds: string[];   // 0 = nada; 1 = master; 2 = comparação lado a lado
  compareCourseId: string | null;
  faculdadeRightPane: 'detail' | 'compare' | 'weekly' | 'calendar';
  draggedClassId: string | null; // durante DnD de aula

  // ---- context inspector ----
  inspectorSelection: InspectorSelection[]; // seleção múltipla
  inspectorRelationsOpen: boolean;

  // ---- command palette ----
  commandHistory: string[]; // ids de comandos executados (LRI)
  fuzzyThreshold: number;   // 0..1, default 0.4
}

export type InspectorSelection =
  | { kind: 'course'; id: string }
  | { kind: 'class'; id: string; courseId: string }
  | { kind: 'concept'; id: string }
  | { kind: 'author'; id: string }
  | { kind: 'technique'; id: string };
```

Regra de ouro (critério de aceite do relatório §2.1): abrir 2 documentos + `activePanels`
+ `graphViewport` no desktop **NÃO** deve alterar `navigationStack`/`isBottomNavVisible`/
`overlayKey` do mobile, e o `SyncPackage` **NÃO** contém `DesktopSessionState`.

---

## 5. home-desktop (G4 `recentItems`)

### 5.1 Problema
`HomeScreen.tsx` já existe e já deriva `recentItems` de `app.classes`/`app.looseNotes`
(boa base). Faltam: (a) incluir **leituras** (`app.readings`) e **notas de aula** de forma
unificada; (b) widget "próximos prazos" (visão semanal compacta); (c) atalhos rápidos para
abrir Documento / Calendário / Grafo diretamente da home.

### 5.2 Objetivo
Home desktop calorosa (único lugar com Plus Jakarta Sans no desktop) que traz, além dos
`quickStats`, uma seção `recentItems` (G4) lida de `app.classes`/`app.readings`/`app.notes`
via `useDesktopApp` — **sem duplicar estado** — + prazos + atalhos para documento/calendário/grafo.

### 5.3 UX proposta
- `recentItems`: grid de cards (aula / leitura / nota), ordenados por data desc, topo `recentItemsLimit`.
  Cada card abre o item (ex.: aula → `openCourseDetail` + scroll na lista; leitura → biblioteca).
- `Próximos prazos`: mini-lista de 7 dias (seg→dom) com bolinhas para provas/tarefas/leituras
  com dueDate na semana; ocupa a largura de 1 coluna ao lado dos stats.
- `Atalhos`: os `moduleShortcuts` existentes ganham entradas "Documento" (abre `activePanels`
  documents — fase futura, por ora `showToast`), "Grafo" (`openKnowledgeGraph`) e mantêm
  "Calendário" (`setSubTabFaculdade('calendario')`).

Wireframe (ASCII):
```
┌──────────────────────────────────────────────┐
│ bom dia, ceci ☀️                              │
│ resumo do dia — 2 eventos e 3 tarefas        │
├───────────────┬──────────────┬───────────────┤
│ tarefas 3     │ provas 2     │ ofensiva 12   │  ← quickStats
├───────────────┴──────────────┴───────────────┤
│ próximos prazos (seg ✦ ter ✦ qua ···)        │  ← widget semanal compacto
├──────────────────────────────────────────────┤
│ recentes  (aulas · leituras · notas)         │  ← G4
│ [aula] [leitura] [nota] [aula] …             │
├──────────────────────────────────────────────┤
│ módulos   [conhecimento][calendário][grafo]…  │
└──────────────────────────────────────────────┘
```

### 5.4 Componentes / arquivos
- **Mudar** `src/desktop/screens/HomeScreen.tsx`:
  - `recentItems` (useMemo) passa a iterar também `app.readings` (id `r-`, kind `leitura`,
    subtitle = curso ou "leitura") e unificar com classes/notas. Tipo `RecentItemKind` ganha `'leitura'`.
  - Novo componente `React.memo` `NextDeadlinesWidget` (fora do render) — lê `app.tasks`/
    `app.exams`/`app.readings` com `dueDate` na semana corrente.
  - `moduleShortcuts` ganha item "Grafo de conhecimento" → `app.openKnowledgeGraph()` e
    "Documento" → `app.openDocuments?.()` (fallback `showToast` até M4 existir).
  - Cards de `recentItems` recebem `onClick` para navegar até o item.
- **Criar** `src/desktop/components/NextDeadlinesWidget.tsx` (widget semanal compacto, memoizado).
- NENUM estado de domínio novo — tudo derivado de `useDesktopApp()`.

### 5.5 `DesktopSessionState` (desta feature)
`só` `recentItemsLimit` (default 6). O resto é derivado.

### 5.6 Tokens
Reuso: `--ds-surface-inspector`, `--ds-accent-subtle`, `--ds-accent-strong`, `--ds-border-subtle`,
`--ds-domain-*`, `--ds-status-warning`. Nada de rosa de fundo (hardConstraint).

### 5.7 Critérios de aceite
- `recentItems` lista aulas **e** leituras **e** notas, sem estado duplicado.
- Clicar num item recente navega para o contexto correto.
- Widget de prazos mostra eventos da semana corrente com pelo menos 1 dueDate.
- Atalho "Grafo" abre o Knowledge Graph; "Calendário" vai para a sub-tab calendário.
- `npm run lint` + `npm run test` verdes.

### 5.8 Como remover / tirar a parte mobile compartilhada
A Home desktop **já é** um fork (`HomeScreen` exclusivo, montado via `desktopHome` em
`DesktopSlideContent`). Não há view `HomeView` mobile sendo reusada aqui — manter assim.
Se no futuro a `HomeView` mobile ganhar `recentItems`, a lógica de derivação deve ser extraída
para um helper em `src/lib` (compartilhado) e consumida por ambas, sem copiar estado.

---

## 6. faculdade-master-detail

### 6.1 Problema
`desktopFaculdade` já é injetado via `DesktopScreenLayers` → `SplitLayout` (`CourseMasterList`
+ `CourseDetailPane`). Faltam as propostas desktop-only: (a) painel direito comparando duas
disciplinas; (b) drag de aula do master para o detalhe / calendário; (c) grade semanal de aulas
dentro do pane.

### 6.2 Objetivo
Master-detail da faculdade onde o painel direito é alternável entre **detalhe**, **comparação
(2 disciplinas)** e **grade semanal**, com DnD de aulas.

### 6.3 UX proposta
- `CourseMasterList` (master, esquerda): lista de disciplinas; `selectedCourseIds` controla
  seleção (1 ⇒ detalhe; 2 ⇒ comparação). Checkboxes de comparação.
- Painel direito (`faculdadeRightPane` em `DesktopSessionState`):
  - `detail`: `CourseDetailPane` (já existe) com abas info/aulas/repertório.
  - `compare`: `CourseComparePane` — duas colunas lado a lado (curso A vs curso B) com
    progresso, carga, próximas avaliações, cor de domínio.
  - `weekly`: `CourseWeeklyGrid` — grade 7×N de aulas da disciplina em foco (ou de todas,
    filtrado por `selectedCourseIds[0]`).
- Drag de aula: em `CourseMasterList` (ou na aba "aulas" do detail), arrastar um `ClassNote`
  para (i) o pane de detalhe (reabre a aula) ou (ii) a zona "calendário" (cria evento via
  `app.addCalendarEventFromClass`). `draggedClassId` em `DesktopSessionState` durante o arraste.

### 6.4 Componentes / arquivos
- **Mudar** `src/desktop/screens/DesktopScreenLayers.tsx`: `buildDesktopFaculdade` passa a
  escolher o `detail` do `SplitLayout` conforme `app.desktopSession.faculdadeRightPane`
  (detail/compare/weekly). Mantém `DetailPaneFade` para crossfade.
- **Mudar** `src/desktop/components/CourseMasterList.tsx`:
  - passa a aceitar `selectedCourseIds`, `onToggleSelect`, `onDragClass` (props, sem boolean).
  - checkbox de comparação (compound: `<CourseMasterList.Selection/>`).
- **Criar** `src/desktop/components/CourseComparePane.tsx` (compare 2 cursos).
- **Criar** `src/desktop/components/CourseWeeklyGrid.tsx` (grade semanal de aulas).
- **Mudar** `src/desktop/components/CourseDetailPane.tsx`: zona "soltar aula" (`onDropClass`)
  + botões de alternância de `faculdadeRightPane` (detail/compare/weekly) no header do pane.
- **Mudar** `src/desktop/layouts/SplitLayout.tsx`: aceitar `rightOpen`/`onCloseRight` já
  existentes; adicionar `masterWidth` responsivo e `onDrop` opcional para DnD.
- Estado de domínio (criar evento de calendário) via `app.addCalendarEventFromClass(classId)`
  — handler a ser adicionado no `AppContext` (universal, reuso mobile).

### 6.5 `DesktopSessionState` (desta feature)
`selectedCourseIds`, `compareCourseId`, `faculdadeRightPane`, `draggedClassId`.

### 6.6 Tokens
`--ds-surface-inspector` (pane), `--ds-border-default`, `--ds-elevation-xs`, `--ds-domain-*`
(cor de cada disciplina na comparação), `--ds-accent-subtle` (botões de alternância ativa).
Sem rosa de fundo.

### 6.7 Critérios de aceite
- Selecionar 2 disciplinas alterna o pane para `compare` automaticamente.
- `CourseWeeklyGrid` renderiza aulas nos dias corretos da `schedule` da disciplina.
- Arrastar uma aula para o pane de detalhe a abre; arrastar para a zona calendário cria evento.
- Nenhuma view mobile (`FaculdadeView`) é importada estaticamente por código desktop.
- `npm run lint` + `npm run test` verdes; `check-boundaries.mjs` ok.

### 6.8 Como remover / tirar a parte mobile compartilhada
O fork já existe (`desktopFaculdade` injetado). Para garantir separação: a `FaculdadeView`
mobile NUNCA deve ser importada por `src/desktop/**`. O `SlideContent` compartilhado, quando
`activeTab==='faculdade'`, usa `desktopFaculdade` se presente, senão `<FaculdadeView/>` (mobile).
A lógica de comparação/grade/drag vive inteiramente em `src/desktop/**` e lê dados via
`useDesktopApp()` (sem copiar estado). Se a `FaculdadeView` mobile quiser reusar a `CourseWeeklyGrid`,
esta deve subir para `src/components` (compartilhado) — mas por ora é desktop-only.

---

## 7. context-inspector

### 7.1 Problema
`ContextInspector.tsx` hoje mostra só o `focusedCourse` OU resumo do dia (seleção única
implícita). Faltam: (a) reatividade a **seleção múltipla** (`inspectorSelection`); (b) painel
de "relações" puxando do Grafo de Conhecimento (quando M4 existir); (c) ações contextuais
(editar, vincular conceito, agendar) direto no inspector.

### 7.2 Objetivo
Inspector secundário (320px, colapsável) que reflete a seleção atual da tela (1 ou N itens) e
oferece ações contextuais + um painel de relações (grafo) sob demanda.

### 7.3 UX proposta
- `inspectorSelection` vazio ⇒ comportamento atual (resumo do dia / focusedCourse).
- 1 item ⇒ ficha do item (curso/aula/conceito/autor/técnica) com suas relações.
- N itens ⇒ "N selecionados" + ações em lote (ex.: agendar todas, vincular conceito comum).
- Botão "relações" abre `inspectorRelationsOpen` → lista de nós relacionados (do grafo;
  enquanto M4 não existe, deriva de `app.concepts`/`app.authors` por `conceptIds` das aulas).
- Ações contextuais (botões `ActionButton`): `editar` (abre `EditCourseModal`/`Edit…`),
  `vincular conceito` (abre picker), `agendar` (abre `QuickAdd` pré-tipo evento).

### 7.4 Componentes / arquivos
- **Mudar** `src/desktop/components/ContextInspector.tsx`:
  - Assinatura vira `{ open, onToggle, selection, onAction }` (selection vem do provider,
    não lida internamente) — respeitando composition (provider eleva estado).
  - Renderiza `InspectorSingle` / `InspectorMulti` / `InspectorEmpty` (compound interno).
  - `InspectorRelations` (subcomponente) lê relações de `app.concepts`/`app.authors`.
  - Barra de ações contextuais (`editar`/`vincular`/`agendar`) por item.
- **Criar** `src/desktop/components/InspectorActions.tsx` (compound: `InspectorActions.Edit`,
  `.LinkConcept`, `.Schedule`) — sem boolean props.
- **Mudar** `src/shells/DesktopAppShell.tsx`: `ContextInspector` recebe
  `selection={app.desktopSession.inspectorSelection}` e `onAction={...}` do provider.
- Estado de seleção: componentes de tela (CourseMasterList, futuro grafo) chamam
  `app.setInspectorSelection(...)`.

### 7.5 `DesktopSessionState` (desta feature)
`inspectorSelection: InspectorSelection[]`, `inspectorRelationsOpen: boolean`.

### 7.6 Tokens
`--ds-surface-inspector`, `--ds-border-default`, `--ds-border-subtle`, `--ds-accent-subtle`,
`--ds-accent-strong`, `--ds-text-secondary`, `--ds-elevation-xs`. Sem rosa de fundo.

### 7.7 Critérios de aceite
- Selecionar 2 aulas na master list atualiza o inspector para modo multi (N selecionados).
- Botão "relações" lista ao menos os conceitos vinculados às aulas selecionadas.
- Ação "editar" abre o modal de edição correspondente; "agendar" abre QuickAdd com tipo evento.
- Inspector colapsa para `w-10` e expande sem perder seleção.
- `check-boundaries.mjs` ok; `npm run lint` + `npm run test` verdes.

### 7.8 Como remover / tirar a parte mobile compartilhada
`ContextInspector` já é exclusivo desktop (`src/desktop/**`), montado só por `DesktopAppShell`.
Não há equivalente mobile. A fonte de `inspectorSelection` é `DesktopSessionState` (desktop),
nunca o `navigationStack` mobile. Manter assim: nenhum import estático de mobile.

---

## 8. command-palette (G5 busca agrupada)

### 8.1 Problema
`CommandPalette.tsx` hoje só tem comandos de navegação (lista plana agrupada por domínio).
Faltam G5: busca agrupada indexando **Documentos / Eventos / Projetos / Comandos**, ações de
criação rápida, histórico de comandos e fuzzy search.

### 8.2 Objetivo
Palette (⌘K) que indexa entidades do domínio (documentos, eventos de calendário, projetos TCC)
além de comandos puros, com fuzzy match e histórico de execução.

### 8.3 UX proposta
- Quatro grupos: `Documentos` (quando M4 existir → `app.openDocuments`/títulos), `Eventos`
  (provas/tarefas/leituras com dueDate — abre a tela), `Projetos` (projetos TCC ativos →
  `openProjects`), `Comandos` (navegação/criação).
- Ações de criação rápida no topo: "Novo documento", "Nova tarefa", "Novo projeto TCC"
  (chamam `app.openQuickAdd()` / `app.openProjects()` / futuro `app.newDocument()`).
- Fuzzy search: `fuzzyThreshold` em `DesktopSessionState`; score simples (substring + distância)
  sobre label + hint + tipo.
- Histórico: `commandHistory` (ids) sobe ao executar; entradas recentes ganham badge e
  aparecem primeiro quando query vazia.
- Atalho ⌘K abre; Esc fecha; ↑/↓ navega; Enter executa.

### 8.4 Componentes / arquivos
- **Mudar** `src/desktop/components/CommandPalette.tsx`:
  - `Command` ganha `group: 'documentos'|'eventos'|'projetos'|'comandos'` e `entityId?`.
  - `useMemo` `commands` passa a montar listas de Eventos (de `app.exams`/`app.tasks`/
    `app.readings` com dueDate) e Projetos (de `app.projects`), além de Comandos e
    Documentos (placeholder até M4).
  - `filtered` usa fuzzy (`fuzzyMatch(query, cmd)`) em `src/desktop/lib/fuzzy.ts` (criar).
  - `groups` ordenados `['comandos','documentos','eventos','projetos']`; histórico injetado
    no topo quando query vazia.
  - Ao `run()`, `app.pushCommandHistory(cmd.id)`.
- **Criar** `src/desktop/lib/fuzzy.ts` (função pura `fuzzyMatch`, testável — ver testes).
- **Mudar** `src/context/desktopApp.ts` (ou o `DesktopAppProvider`): agregar
  `pushCommandHistory(id)`, `commandHistory`, `fuzzyThreshold` de `DesktopSessionState`.
- Nenhuma mudança em `ScreenLayers` (palette é overlay desktop, montado por `DesktopAppShell`).

### 8.5 `DesktopSessionState` (desta feature)
`commandHistory: string[]`, `fuzzyThreshold: number`.

### 8.6 Tokens
`--ds-elevation-md`, `--ds-border-default`, `--ds-border-subtle`, `--ds-accent-subtle`,
`--ds-accent-strong`, `--ds-text-secondary`, `--ds-text-tertiary` (placeholder). Sem rosa.

### 8.7 Critérios de aceite
- Digitar "prova" lista Eventos com "prova" no título no grupo `Eventos`.
- "Novo projeto TCC" aparece em `Comandos` e abre `openProjects`.
- Executar um comando empurra seu id em `commandHistory`; reabrir com query vazia mostra o
  histórico primeiro.
- Fuzzy match pega "calend" → "Calendário".
- `npm run test` cobre `fuzzy.ts`; `npm run lint` verde; `check-boundaries.mjs` ok.

### 8.8 Como remover / tirar a parte mobile compartilhada
`CommandPalette` é exclusivo desktop (montado só por `DesktopAppShell`, nunca por
`ScreenLayers`/`MobileAppShell`). Dados vêm de `useDesktopApp()` (mesmo `AppContext` universal),
sem duplicar estado. Nada de mobile importado.

---

## 9. Estrutura de arquivos (resumo)

```
src/desktop/
  state/desktopSession.ts            (NOVO) tipo + initial DesktopSessionState
  lib/fuzzy.ts                      (NOVO) fuzzyMatch puro
  screens/
    DesktopScreenLayers.tsx         (MUDA) resolve Graph/Projects/Inbox + master-detail
    HomeScreen.tsx                  (MUDA) recentItems + prazos + atalhos
  components/
    CourseMasterList.tsx            (MUDA) seleção/compare + drag de aula
    CourseDetailPane.tsx            (MUDA) drop zone + alternância de pane
    CourseComparePane.tsx           (NOVO) comparação 2 disciplinas
    CourseWeeklyGrid.tsx            (NOVO) grade semanal de aulas
    ContextInspector.tsx            (MUDA) seleção múltipla + relações + ações
    InspectorActions.tsx            (NOVO) compound de ações contextuais
    NextDeadlinesWidget.tsx         (NOVO) prazos semanais
    CommandPalette.tsx              (MUDA) G5 agrupada + histórico + fuzzy
  layouts/SplitLayout.tsx           (MUDA) drop opcional + masterWidth
src/shells/
  ScreenLayers.tsx                  (MUDA) remove flags desktop + chunks desktop do preload
  DesktopAppShell.tsx               (MUDA) injeta DesktopAuxScreens + selection no inspector
apps/desktop/src/
  DesktopAppProvider.tsx            (MUDA) agrega DesktopSessionState + pushCommandHistory
```

---

## 10. Code style (exemplo concreto)

```tsx
// src/desktop/components/InspectorActions.tsx — compound, sem boolean props
const InspectorActions = {
  Root: ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--ds-border-subtle)' }}>
      {children}
    </div>
  ),
  Edit: ({ onEdit }: { onEdit: () => void }) => (
    <button onClick={onEdit} aria-label="editar" className="rounded-[10px] px-3 py-1.5 text-xs font-semibold"
      style={{ background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }}>editar</button>
  ),
  LinkConcept: ({ onLink }: { onLink: () => void }) => (/* … */),
  Schedule: ({ onSchedule }: { onSchedule: () => void }) => (/* … */),
};
```

Convenções: `cn()` para classes; tokens `--ds-*` (nunca hex raw em classe); `React.memo` para
linhas de lista; subcomponentes definidos fora do render; acessibilidade (`aria-label` em
botões só-ícone, foco visível, `prefers-reduced-motion` respeitado nas animações framer-motion).

---

## 11. Testes (estratégia)

- **Vitest + jsdom** (padrão do projeto, `npm run test`).
- `src/desktop/lib/__tests__/fuzzy.test.ts` — `fuzzyMatch` (substring, distância, threshold).
- `src/desktop/state/__tests__/desktopSession.test.ts` — `initialDesktopSessionState`
  não contém campos de `SyncPackage`; `selectedCourseIds` default `[]`.
- `src/desktop/components/__tests__/CourseComparePane.test.tsx` — renderiza 2 cursos lado a lado.
- `src/desktop/components/__tests__/CommandPalette.test.tsx` — agrupamento G5, histórico,
  criação rápida dispara handler.
- `src/desktop/components/__tests__/ContextInspector.test.tsx` — modo multi com N selecionados.
- `src/shells/__tests__/screenLayers.test.ts` — `ScreenLayers` não referencia flags desktop
  (snapshot/assert de ausência) e `preloadScreenChunks` não inclui chunks desktop.

---

## 12. Boundaries (portão)

- **Always:** rodar `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`
  após qualquer mudança em `src/desktop/**`, `src/shells`, `apps/desktop`.
- **Ask first:** adicionar dependência nova; mudar `AppContextValue` (universal); mexer em
  `SCHEMA_VERSION`; alterar `check-boundaries.mjs`.
- **Never:** importar estaticamente `src/components/views/**` / `src/shells/MobileAppShell.tsx`
  de `src/desktop/**`; colocar estado de domínio em `DesktopSessionState`; usar hex raw em classe;
  fundo rosa em painel desktop; `shadow-xl`; `backdrop-blur` além do permitido.

---

## 13. Success criteria (fechamento)

1. `HomeScreen` mostra `recentItems` unificando aulas/leituras/notas + widget de prazos + atalhos.
2. `faculdade` master-detail alterna detail/compare/weekly com drag de aula funcional.
3. `ContextInspector` reage a seleção múltipla, mostra relações e ações contextuais.
4. `CommandPalette` indexa Documentos/Eventos/Projetos/Comandos com fuzzy + histórico.
5. `ScreenLayers` compartilhado não conhece flags desktop; preload separado por casca.
6. `check-boundaries.mjs` passa; `npm run lint` + `npm run test` verdes; `npm run build` ok.
7. Nenhum estado de domínio duplicado; `DesktopSessionState` não entra no `SyncPackage`.

## 14. Open questions

- O "Documentos" no palette/preload será habilitado só quando M4 (Documents & Blocks) existir;
  por ora é placeholder com `showToast`.
- A sincronia do inspector com seleção do Grafo depende de M4 (Knowledge Graph relações);
  hoje deriva de `conceptIds` das aulas.
- `app.addCalendarEventFromClass` e `app.pushCommandHistory` precisam ser adicionados ao
  `AppContext` universal (reuso mobile) — confirmar assinatura com o dono do contexto.
