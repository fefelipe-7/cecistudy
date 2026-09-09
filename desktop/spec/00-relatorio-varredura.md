# Relatório de Varredura — Recursos Desktop do cecistudy

> Autor: agente de pesquisa (file search specialist).
> Escopo: levantamento de todos os recursos desktop JÁ implementados no código e dos itens
> ainda compartilhados com mobile que impedem (ou dificultam) a separação de interface.
> Caminho absoluto deste relatório:
> `/home/felipe/develop/projects/cecistudy/desktop/spec/00-relatorio-varredura.md`

Fontes consultadas (código real + docs de planejamento):
- `src/shells/*`, `src/desktop/**`, `apps/desktop/**`, `apps/mobile/**`, `src/context/**`, `src/lib/**`
- `desktop/LAYOUT-SPEC.md`, `desktop/cecistudy-desktop-shell.json`, `desktop/split-mobile.md`
- `desktop/context-desktop/separacao-interface/*.md` (00–07 + PLANO-IMPLEMENTACAO)
- `desktop/context-desktop/Especificação do módulo de TCC do cecistudy.md`
- `desktop/context-desktop/Especificação do Studio de Marketing e Posicionamento do cecistudy.md`
- `desktop/context-desktop/Especificação incremental do Calendário do cecistudy (1).md`
- `desktop/context-desktop/Blueprint arquitetural do cecistudy.md`
- `desktop/context-desktop/Arquitetura técnica-alvo do cecistudy.md`
- `desktop/context-desktop/cecistudy — contexto geral e guia de implementação do app desktop.md`
- `.github/scripts/check-boundaries.mjs`

---

# 1. Plano de Features Desktop (por módulo)

Cada módulo traz: (a) **Intenção nos docs**, (b) **Estado atual no código**,
(c) **Propostas de features desktop-only que queremos adicionar**.

## 1.1 Sidebar & navegação

**Intenção (docs):**
- `desktop/LAYOUT-SPEC.md` §2.1 + `cecistudy-desktop-shell.json` (`shell.sidebar`):
  sidebar fixa esquerda, 256px (`width`), colapsável para `w-10`, com `WorkspaceSwitcher`
  no topo, navegação primária (home / faculdade / estudos / biblioteca), aceleradores
  secundários (inbox, grafo) e `command palette` via busca.
- `separacao-interface/02-fronteiras-e-contratos.md`: desktop = workspace, painéis,
  master-detail, documentos abertos, grafo — NÃO tabs/bottom-nav.

**Estado atual (código):**
- `src/desktop/components/DesktopSidebar.tsx` (285 linhas) — implementação REAL. Usa
  `useDesktopApp()` (de `@/context/desktopApp`), renderiza `WorkspaceSwitcher`, itens de
  navegação primária, `RecentProjects`, `InboxButton`, `GraphButton`, `CommandPaletteButton`.
- `src/desktop/components/WorkspaceSwitcher.tsx` — seletor de workspace (estado desktop).
- `apps/desktop/src/app/main.tsx` monta `DesktopAppShell` → `DesktopSidebar`.
- ⚠️ **Stub obsoleto**: `src/components/DesktopSidebar.tsx` (103 linhas) é um placeholder
  legado. Ele é importado por `src/shells/MobileAppShell.tsx:13` como
  `ResponsiveDesktopSidebar` e renderizado em `lg` (linhas 110–118) com props
  `{activeTab, onChangeTab, onOpenWizard, onOpenTaskExamWizard, onOpenCompose}` — ou seja,
  o preview web em telas largas mostra uma sidebar VELHA e diferente da shell Tauri.

**Propostas desktop-only:**
- Sidebar com ordenação/agrupamento por workspace e projetos fixos.
- Indicador de "painéis abertos" (graph/calendar) com toggle de estado no app.
- Badges de contagem por aba (ex.: provas da semana, tarefas pendentes) vindos de projeções.
- Colapso animado persistido em `DesktopSessionState`.
- Atalhos de teclado `⌘1…⌘4` já descritos no LAYOUT-SPEC §4 — ligar à navegação.

## 1.2 Topbar

**Estado atual:**
- `src/desktop/components/DesktopTopbar.tsx` — título de página (`font-display` 22px/600),
  `breadcrumb`, botão de busca, `avatar`. Altura ~`h-11` (44px). Lê `useDesktopApp()`.
- `desktop/cecistudy-desktop-shell.json` (`shell.topBar`) define `height: 44`,
  `titleStyle` (display 22/600), `searchField`.

**Propostas desktop-only:**
- Breadcrumb contextual (ex.: `Faculdade › [curso] › aula 3`).
- Ações de janela (minimize/maximize/close) só em Tauri — já fora do web.
- Toggle de tema/claridade do canvas.
- Botão "novo documento" (quando M4 Documents existir).

## 1.3 Home (desktop)

**Estado atual:**
- `src/desktop/screens/HomeScreen.tsx` — implementação REAL (desktop-only screen).
  Renderiza `quickStats`, `moduleShortcuts` (grid de módulos), `workspaceBanner`.
  Usa `useDesktopApp()`.
- GAP do LAYOUT-SPEC: `G4 recentItems` AINDA NÃO implementado (item 6.4 do plano).

**Propostas desktop-only:**
- `recentItems` (G4): seção de itens recentes (aulas, leituras, notas) lida de
  `app.classes`/`app.readings`/`app.notes` via `useDesktopApp` — sem duplicar estado.
- Widget de "próximos prazos" (visão semanal compacta) na home desktop.
- Atalho rápido para abrir documento/calendário/grafo a partir da home.

## 1.4 Faculdade master-detail

**Estado atual:**
- `src/desktop/components/CourseMasterList.tsx` — lista de disciplinas (master).
- `src/desktop/components/CourseDetailPane.tsx` — painel de detalhe (detail) com abas
  (info/aulas/repertório) e `unifiedDetailTabs`/`rightPane` por curso.
- `src/desktop/layouts/SplitLayout.tsx` — primitiva master-detail (`left`/`right`,
  `rightOpen`, `onCloseRight`). Usado por `DesktopAppShell`.
- `DesktopAppShell.tsx` injeta `desktopFaculdade` (master-detail) no `SlideContent`
  quando `activeTab==='faculdade'` (`ScreenLayers.tsx:270-278`).
- `desktop/cecistudy-desktop-shell.json` (`tabs.faculdade`) descreve o master-detail.

**Propostas desktop-only:**
- Painel direito com comparação de duas disciplinas lado a lado.
- Drag de uma aula do master para o painel de detalhe / para o calendário.
- Vista de grade semanal de aulas por disciplina dentro do pane.

## 1.5 Context Inspector

**Estado atual:**
- `src/desktop/components/ContextInspector.tsx` — implementação REAL. Recebe
  `open`/`onToggle` de `DesktopAppShell.tsx:69` (`inspectorOpen`). Mostra contexto do item
  focado (curso/aula/conceito) e links relacionados. Colapsável para `w-10`.
- `desktop/cecistudy-desktop-shell.json` (`shell.contextInspector`): `collapsible: true`,
  `alwaysSecondary: true`.

**Propostas desktop-only:**
- Inspector reativo a seleção múltipla (ex.: várias aulas selecionadas).
- Painel de "relações" puxando do Grafo de Conhecimento quando M4 existir.
- Ações contextuais (editar, vincular conceito, agendar) direto no inspector.

## 1.6 Command Palette

**Estado atual:**
- `src/desktop/components/CommandPalette.tsx` — implementação REAL. Overlay leve 560px,
  aberto via `⌘K`/`Ctrl+K` ou evento `ceci:open-command-palette`. Hoje só comandos de
  navegação (lista plana). Usa `useDesktopApp()`.
- GAP do LAYOUT-SPEC: `G5` (resultados agrupados Documentos/Eventos/Projetos/Comandos)
  AINDA NÃO implementado.

**Propostas desktop-only:**
- Busca agrupada (G5) indexando documentos/eventos/projetos.
- Ações de criação rápida (novo documento, nova tarefa, novo projeto TCC).
- Histórico de comandos recentes e fuzzy search.

## 1.7 Inbox

**Estado atual:**
- `src/desktop/components/InboxScreen.tsx` — implementação REAL (desktop-only screen).
  Aberto via `app.isInboxOpen` (flag desktop) no `SlideContent` (`ScreenLayers.tsx:162-165`).
  Lista de sugestões/itens de conhecimento.
- `desktop/cecistudy-desktop-shell.json` (`shell.inbox`): painel central, `emptyState`.

**Propostas desktop-only:**
- Inbox de conhecimento com triagem (aceitar/arquivar/vincular a projeto ou documento).
- Filtros por tipo (conceito/autor/técnica/leitura) e por workspace.
- Ações em lote.

## 1.8 Knowledge Graph

**Estado atual:**
- `src/desktop/components/KnowledgeGraphScreen.tsx` — implementação REAL (desktop-only
  screen). Aberto via `app.isKnowledgeGraphOpen` (`ScreenLayers.tsx:154-157`). Grafo
  interativo (canvas/SVG) de conceitos/autores/técnicas.
- `desktop/cecistudy-desktop-shell.json` (`modules.graph`): viewport, nós, arestas.

**Propostas desktop-only:**
- Viewport persistido em `DesktopSessionState.graphViewport` (`{x,y,zoom}`).
- Seleção de nó → sincroniza com `ContextInspector`.
- Filtros por domínio (12 domínios do templo) e por curso.
- Modo "foco" (destacar vizinhança) e minimapa.

## 1.9 Projects / TCC

**Estado atual:**
- `src/desktop/components/ProjectsScreen.tsx` — implementação REAL (desktop-only screen).
  Aberto via `app.isProjectsOpen` (`ScreenLayers.tsx:158-161`).
- `PLANO-IMPLEMENTACAO.md` F8 (linha 219): gestão de `projects`/`outputs` JÁ no
  `AppContext` (stamp `workspaceId`), `createProject` (invariante de 5 ativos),
  `updateProject`, `createOutput`/`updateOutput`/`deleteOutput`. `ProjectsView` (Modal)
  na `DesktopSidebar`: criar projeto, badge "X de 5 ativos", lista, saídas.
  **Falta**: editor de blocos paginado + citações ABNT + export DOCX (ver §1.15).

**Propostas desktop-only:**
- Árvore acadêmica livre (capítulos/subcapítulos) por projeto.
- Editor visual paginado (M4) acoplado ao projeto.
- Citações/referências ABNT e versões do documento.

## 1.10 Study corner (desktop)

**Estado atual:**
- O tab `estudos` desktop renderiza a view MOBILE compartilhada `EstudosView`
  (`ScreenLayers.tsx:280` → `app.isTccScreenOpen ? <TccView/> : <EstudosView/>`).
- Telas de foco (`StudyFocusScreen`, `StudyRevisarScreen`, `StudyLeiturasScreen`,
  `StudyHistoricoScreen`) são ramos de `app.focusedStudyScreen` (`ScreenLayers.tsx:197-202`),
  também compartilhados com mobile.
- NÃO há um "study corner" desktop específico (sem master-detail de sessões, sem
  biblioteca de flashcards em painel).

**Propostas desktop-only:**
- Painel de sessões de foco com histórico em coluna lateral.
- Multitarefa: timer + leitura + flashcards em painéis lado a lado.
- Editor de baralho de flashcards com drag/reorder.

## 1.11 Perfil (desktop)

**Estado atual:**
- Renderiza a view MOBILE `PerfilView` (`activeTab==='perfil'` no `SlideContent`).
- `DesktopAppProvider` injeta `shellExtras.updateSection = DesktopUpdateSection`
  (`apps/desktop/src/DesktopAppProvider.tsx`), e `PerfilView` o usa para mostrar a seção
  de atualização do app (Tauri updater) — ou seja, Perfil é COMPARTILHADO com extra desktop.
- `src/desktop/components/DesktopUpdateSection.tsx` — seção de updater (Tauri), usa
  `src/lib/desktop.ts`.

**Propostas desktop-only:**
- Seção "Sessão desktop" (workspace ativo, painéis abertos, reset de sessão).
- Preferências de densidade/layout persistidas em `DesktopSessionState`.
- Atalhos de teclado listados na tela de ajuda.

## 1.12 Settings / Updater

**Estado atual:**
- `DesktopUpdateSection.tsx` — updater Tauri (`src/lib/desktop.ts`
  `checkForUpdates`/`applyUpdate`/`reloadApp`). Só existe no desktop.
- Configurações gerais vivem dentro de `PerfilView` (compartilhado).

**Propostas desktop-only:**
- Janela de preferências dedicada (fora do Perfil mobile) com abas
  (geral / aparência / atalhos / sync / updater).
- Controle de auto-update e canal (stable/beta) ligado ao Tauri updater.

## 1.13 Installer / onboarding

**Estado atual:**
- `DesktopAppShell.tsx:71-73` renderiza `OnboardingScreen` (compartilhado com mobile)
  quando `!onboarding.completed`. Não há installer desktop próprio.
- `apps/desktop` é empacotado via Tauri (CI `release-desktop.yml`).

**Propostas desktop-only:**
- Onboarding desktop-aware: escolha de workspace inicial, layout padrão (sidebar
  colapsada?), import de banco.
- Tela de boas-vindas citando recursos exclusivos (grafo, documentos, calendário).

## 1.14 Layout / tokens

**Estado atual:**
- `src/desktop/styles/desktop-tokens.css` — tokens desktop-only (`--ds-*`), importado
  ESTATICAMENTE por `apps/desktop/src/app/main.tsx:25` (só entra no bundle desktop; web
  não o inclui — isolamento OK).
- `SplitLayout.tsx` — primitiva master-detail.
- `desktop/LAYOUT-SPEC.md` §3 GAP table (G1–G14) lista divergências conhecidas do código
  vs spec JSON, ex.: canvas cream em vez de branco (G1), titleBar 26px em vez de 22px (G2),
  radius 28px acima do teto 20px (G6), `shadow-xl` proibido (G7), `backdrop-blur` (G8),
  faltam `recentItems` (G4) e agrupamento do palette (G5), `tabsDocumentos` (G12) futuro.
- `desktop/cecistudy-desktop-shell.json` — `hardConstraints`: rosa nunca é fundo de
  painel, teto radius 20px, sem paper-texture, sem liquid-glass, sem bounce tátil,
  tokens só em `desktop-tokens.css`, boundary rule (import dinâmico), reuso de matiz.

**Propostas desktop-only:**
- Conformar G1–G14 (plano §6.1–6.6 do LAYOUT-SPEC).
- Tokens de densidade (compact/comfortable) e de contraste entre zonas.
- Tema "Notion-like" para zonas de produção (editor/grafo/calendário) mantendo calor
  só em Home/feedback.

## 1.15 Módulos AINDA NÃO construídos (greenfield desktop)

Estes estão nos docs/planejamento mas NÃO há código correspondente hoje. São os grandes
alvos de features desktop-only novas:

### 1.15.1 Calendário semanal
- **Doc:** `Especificação incremental do Calendário do cecistudy (1).md`,
  `Blueprint arquitetural` (linha 537 "Calendário semanal completo"),
  `Arquitetura técnica-alvo` (linha 389 "Calendário semanal com arrastar e redimensionar").
- **Intenção:** calendário semanal com drag-and-drop e resize de eventos; painel
  `activePanels=['calendar']` (estado desktop, `DesktopSessionState`), NÃO tab.
- **Features propostas:** criar/mover/redimensionar eventos; visualizar aulas, provas,
  sessões e responsabilidades; sincronia com `tasks`/`exams`/`sessions`; vista de semana
  e dia; mini-mapa de semana no inspector.

### 1.15.2 Marketing Studio
- **Doc:** `Especificação do Studio de Marketing e Posicionamento do cecistudy.md`,
  `Blueprint` (linha 539), `PLANO-IMPLEMENTACAO.md` F9 (linha 220, `MarketingStudio=0`,
  pendente).
- **Intenção:** estúdio de posicionamento/marketing pessoal (conteúdo, canais, publicações,
  métricas). Totalmente greenfield.
- **Features propostas:** editor de conteúdo por canal (variantes), calendário de
  publicações, snapshots de métricas, ligação a projetos TCC como "produto".

### 1.15.3 Documents & Blocks editor (M4)
- **Doc:** `PLANO-IMPLEMENTACAO.md` F5 (linha 121), `Blueprint` M4 (linha 591),
  `Arquitetura técnica-alvo` (linha 163 `openDocuments[]`, linha 179 Documents/Blocks).
- **Intenção:** modelo interno canônico de documento; editor paginado próximo ao Word;
  blocos (parágrafo, título, tabela, imagem, citação, código/LaTeX); `openDocuments[]`
  e `activePanels` em `DesktopSessionState`.
- **Features propostas:** editor visual paginado, árvore de blocos, versionamento,
  `tabsDocumentos` (LAYOUT-SPEC G12, 36px no topo do canvas), drag entre documentos.

### 1.15.4 Biblioteca desktop
- **Estado:** o tab `biblioteca` desktop usa a MESMA view mobile `BibliotecaView`
  (`ScreenLayers.tsx` `activeTab==='biblioteca'`). Não há biblioteca desktop com
  master-detail (catálogo à esquerda, leitura/reader à direita) nem gestão de acervo.
- **Features propostas:** painel de catálogo + leitor em SplitLayout; estante por
  workspace; gestor de anexos (PDFs/imagens/DOCX) via `BlobProvider`.

### 1.15.5 Exportação DOCX / ABNT (TCC)
- **Doc:** `Especificação do módulo de TCC do cecistudy.md` (§9 DOCX, § perfis ABNT),
  `Blueprint` (linha 352 DOCX prioritário, linha 374 ABNT inicial),
  `PLANO-IMPLEMENTACAO.md` F8 (linha 219: falta citações ABNT + export DOCX),
  `cecistudy — contexto geral...md` §14 (linhas 694–910).
- **Intenção:** DOCX como primeiro formato de import/export com round-trip e comparação
  (versão candidata, nunca sobrescreve silenciosamente); perfil ABNT inicial; bibliografia
  estruturada; citações.
- **Features propostas:** engine de export/import DOCX; geração de bibliografia ABNT;
  comparação de versões; PDF opcional; LaTeX/Markdown como modos secundários.

---

# 2. Itens ainda compartilhados com mobile que precisam mudar

Esta seção é o coração da separação de interface. Lista o que hoje é COMPARTILHADO e
precisa ser desacoplado/duplicado/movido para que desktop e mobile evoluam independentes.

## 2.1 Os 4 contextos aninhados carregam o MESMO valor

- `src/context/AppContext.tsx:2517` `AppProvider` e `:2521` `useApp(): AppContextValue`.
- `src/context/appContexts.ts` define 4 contextos:
  `AppBaseContext`, `DataClientContext`, `MobileAppContext`, `DesktopAppContext`.
- Em `AppContext.tsx` (trecho ~2507–2513), o `AppBaseProvider` faz
  `provider value={value}` para OS QUATRO contextos com o MESMO objeto `value`
  (a `AppContextValue` universal). Ou seja: **mobile e desktop hoje consomem exatamente
  o mesmo estado/handlers** — não há split real de estado.
- `apps/desktop/src/DesktopAppProvider.tsx:19` faz `const mobile = useMobileApp();`
  (lê `MobileAppContext`) e só ADICIONA `shellExtras: { updateSection: DesktopUpdateSection }`,
  re-provendo `MobileAppContext` E `DesktopAppContext` com o mesmo `augmented`. Não cria
  estado desktop próprio.
- `src/context/desktopApp.ts` `useDesktopApp()` e `src/context/mobileApp.ts`
  `useMobileApp()` retornam o mesmo `AppContextValue` (apenas com tipagem de facade).

**O que mudar (alvo da separação, ver `separacao-interface/03-plano-incremental.md:126`):**
- `packages/data/DataClient` (repositories + sync adapter) — fonte única de dados.
- `apps/mobile/MobileAppProvider` → `MobileNavigationState`, quick actions, projeções
  compactas (apenas mobile).
- `apps/desktop/DesktopAppProvider` → `DesktopSessionState`
  (`lastWorkspaceId`, `openDocuments[]`, `activePanels[]`, `selectedGraphNodeId`,
  `graphViewport`, etc. — estado VISUAL que NÃO sincroniza, ver `02-fronteiras-e-contratos.md:84,97`).
- Estado que hoje está no `AppContext` universal e deveria ser DESKTOP-SPECIFIC:
  painéis abertos, viewport do grafo, `openDocuments`, estado visual de Inbox/Graph/Projects,
  e (quando existirem) calendário, documents, marketing.
- Critério de aceite (`separacao-interface/05-criterios-de-aceite.md:13`): abrir 2 documentos
  + `activePanels=['graph','calendar']` + `graphViewport` no desktop NÃO deve alterar
  `navigationStack`/`isBottomNavVisible`/`overlayKey` do mobile, e o `SyncPackage` NÃO deve
  conter `openDocuments`/`graphViewport`.

## 2.2 `ScreenLayers` (camada compartilhada) ainda é o motor do desktop

- `src/shells/ScreenLayers.tsx:2` importa `useMobileApp` de `@/context/mobileApp`.
- `:149` e `:321` (`SlideContent` e `OverlayContent`) LEEM `useMobileApp()` — ou seja,
  o desktop renderiza através do HOOK MOBILE na camada compartilhada.
- `SlideContent` faz branch em flags DESKTOP-ONLY diretamente no arquivo compartilhado:
  - `:154-165` `app.isKnowledgeGraphOpen` / `app.isProjectsOpen` / `app.isInboxOpen`
    (telas desktop) — acoplamento semântico da camada compartilhada com o desktop.
  - `:197-202` `app.focusedStudyScreen` (telas de estudo, compartilhadas).
  - `:270-307` injeta `desktopHome`/`desktopFaculdade` quando `shell==='desktop'`
    (`DesktopScreenLayers` passa `shell="desktop"`).
- `OverlayContent` (`:320-347`) é 100% compartilhado (QuickAdd, Search, EditCourse, etc.).

**O que mudar:**
- Extrair a lógica de renderização desktop para `src/desktop/screens/DesktopScreenLayers.tsx`
  (que hoje só repassa `<SlideContent shell="desktop" .../>` e `<OverlayContent/>` em
  `DesktopOverlayContent` — ver `src/desktop/screens/DesktopScreenLayers.tsx:77,86`).
- A camada compartilhada `ScreenLayers` deve desconhecer flags desktop (`isKnowledgeGraphOpen`,
  `isProjectsOpen`, `isInboxOpen`); essas telas devem ser resolvidas DENTRO da shell desktop.
- `preloadScreenChunks()` em `ScreenLayers` hoje pré-carrega também os chunks desktop
  (KnowledgeGraph/Projects/Inbox) — o web/mobile acaba buscando chunks que não usa.
  Separar o preload por shell.

## 2.3 `check-boundaries.mjs` — o que ele PROÍBE e o que ele NÃO pega

Arquivo: `.github/scripts/check-boundaries.mjs`. Regras (função `checkBoundaries`, ~linha 70):
- `ERR_NO_NATIVE_DESKTOP`: **desktop NUNCA importa estaticamente mobile**
  (`src/desktop/**`, `apps/desktop/**` → `apps/mobile/**`, `src/shells/MobileAppShell.tsx`,
  `src/shells/ScreenLayers.tsx`, `src/components/views/**`mobile, etc.).
- `ERR_NO_NATIVE_MOBILE`: **mobile NUNCA importa estaticamente desktop**
  (`apps/mobile/**`, `src/shells/MobileAppShell.tsx`, `src/shells/ScreenLayers.tsx` →
  `src/desktop/**`, `apps/desktop/**`).
- `ERR_NO_REACT_IN_PACKAGES`: `packages/*` NUNCA importa `react` (nem `@capacitor/*`,
  `__TAURI__`).
- `ERR_NO_PLATFORM_IN_SHARED`: UI compartilhada (`src/components`, `src/shells/ScreenLayers.tsx`,
  `src/overlays/*`) NUNCA brancha por plataforma (`isDesktop`/`isMobile`/`Capacitor.isNativePlatform`/`__TAURI__`).

Detalhes técnicos:
- Detecção de import estático via regex (linhas ~29–37: `from ['"](...)(['"])`).
  **Import DINÂMICO (`import()`) é permitido** — é assim que `ScreenLayers` carrega
  `KnowledgeGraphScreen`/`ProjectsScreen`/`InboxScreen` (linhas 42–44 do ScreenLayers).
  Portanto o script NÃO pega o acoplamento semântico do item 2.2 (flags desktop na camada
  compartilhada), só import estático.

**Violações/quase-violações atuais:**
1. `src/shells/MobileAppShell.tsx:13` importa `DesktopSidebar` (stub) de
   `src/components/DesktopSidebar.tsx` — esse arquivo NÃO está em `src/desktop/**`, então o
   script não o bloqueia, mas é um acoplamento mobile→desktop por engano (ver 2.6).
2. `ScreenLayers` referencia flags desktop (`isKnowledgeGraphOpen` etc.) — não é import
   estático, então passa no gate, mas é exatamente o que a separação quer eliminar.
3. O script não valida que os 4 contextos carregam o mesmo valor (item 2.1) — gap de
   cobertura a sinalizar.

## 2.4 `components/views/*` e `components/*` importados pelas DUAS shells

- `src/shells/DesktopAppShell.tsx` e `src/shells/MobileAppShell.tsx` ambos consomem a camada
  `ScreenLayers`, que por sua vez monta as views MOBILE:
  `HomeView`, `FaculdadeView`, `EstudosView`, `BibliotecaView`, `PerfilView`,
  `CourseDetailView`, `TccView`, `StudyFocusScreen`, `StudyRevisarScreen`,
  `StudyLeiturasScreen`, `StudyHistoricoScreen`, etc. (via lazy `import()`).
- `src/overlays/DesktopOverlays.tsx` e `src/overlays/MobileOverlays.tsx` são QUASE
  idênticos (ambos montam `QuickAddModal`, `GlobalSearchModal`, `EditCourseModal`,
  `EditTccModal`, `Toast`, etc.) — duplicação, não fork intencional.
- Telas desktop-only (`KnowledgeGraphScreen`, `ProjectsScreen`, `InboxScreen`,
  `HomeScreen` desktop) são referenciadas só a partir do `ScreenLayers`/DesktopScreenLayers,
  mas as views mobile são o "motor" de faculdade/estudos/biblioteca/perfil no desktop.

**O que mudar:**
- Fork explícito das views que o desktop quer especializar (Faculdade→master-detail já é
  fork via `desktopFaculdade`; Estudos/Biblioteca/Perfil ainda são a view mobile inteira).
- Unificar `DesktopOverlays`/`MobileOverlays` em uma fonte única OU mover overlays para a
  camada compartilhada sem branch de plataforma (respeitando `ERR_NO_PLATFORM_IN_SHARED`).
- Telas desktop-only devem ser importadas SÓ por `apps/desktop`/`src/desktop`, nunca por
  `ScreenLayers` compartilhado (eliminar item 2.2).

## 2.5 `src/App.tsx` + preview web `?platform=desktop` (obsoleto a resolver)

- `src/App.tsx` hoje é MOBILE-ONLY (após Fase 9 do backlog geral): não faz mais branch
  `isDesktop` nem `?platform=desktop`. O preview desktop via `?platform=desktop` foi removido.
- PORÉM `src/shells/MobileAppShell.tsx` ainda renderiza, no breakpoint `lg`, a sidebar
  desktop STUB (`src/components/DesktopSidebar.tsx`) — ou seja, o "preview web largo" mostra
  uma sidebar legada/diferente da shell Tauri real. Isso é o resíduo obsoleto a remover.
- `MobileAppShell.tsx:105` também envolve `EdgeSwipeBack` com `!isDesktop` (correto para
  mobile), mas o ramo `lg` da sidebar stub contradiz a separação.

**O que mudar:**
- Remover a importação e o render de `src/components/DesktopSidebar.tsx` (stub) de
  `MobileAppShell.tsx` (linhas 13 e 110–118). O preview web largo deve continuar usando a
  shell mobile (BottomNav/FAB), e a sidebar desktop real só existe na shell Tauri
  (`apps/desktop` → `DesktopAppShell` → `src/desktop/components/DesktopSidebar.tsx`).
- Eliminar o arquivo `src/components/DesktopSidebar.tsx` (stub) para não haver duas
  implementações de "DesktopSidebar".

## 2.6 `src/lib/platform.ts` (`isDesktop`) e `src/lib/desktop.ts` (ponte Tauri)

- `src/lib/platform.ts:32` `export const isDesktop` (detecta `window.__TAURI_INTERNALS__`),
  usado em vários pontos. `:50` `initPlatformFlags()`.
- `src/lib/desktop.ts` — ponte Tauri (notificações, updater, relaunch) usando
  `window.__TAURI__`. É importado por `DesktopUpdateSection.tsx` e `notifications.ts`.

**O que mudar (regra de boundary + `ERR_NO_PLATFORM_IN_SHARED`):**
- `isDesktop`/`__TAURI__` NÃO devem aparecer em `src/components`, `src/shells/ScreenLayers.tsx`
  ou `src/overlays/*` (hoje `MobileAppShell` usa `isDesktop` no branch da sidebar — item 2.5).
- A ponte Tauri (`src/lib/desktop.ts`) deve morar em `apps/desktop` (ou ser importada só
  dinamicamente a partir de `apps/desktop`), nunca estaticamente de código compartilhado web.
  Hoje `notifications.ts` e `DesktopUpdateSection.tsx` importam `src/lib/desktop.ts` de forma
  que o bundle web pode puxá-lo — mover para `apps/desktop/lib/desktop.ts` ou isolar atrás de
  lazy import.
- `src/lib/platform.ts` pode permanecer em `src/lib`, mas seu uso em UI compartilhada deve
  ser eliminado (a shell desktop já sabe que é desktop por estar em `apps/desktop`).

## 2.7 Duplicata `useMobileApp` em `apps/mobile`

- `apps/mobile/src/MobileAppProvider.tsx:18` exporta seu PRÓPRIO `useMobileApp()` que apenas
  retorna `useApp()`. Todos os ~100+ usos reais importam `useMobileApp` de
  `@/context/mobileApp` (canônico). Ou seja, a versão de `apps/mobile` é morta/redundante.
- **O que mudar:** remover o `useMobileApp` local de `apps/mobile/src/MobileAppProvider.tsx`;
  o provider mobile deve consumir/repassar o facade `@/context/mobileApp` (ou, na separação
  alvo, o `apps/mobile/MobileAppProvider` vira o dono do `MobileAppContext` real — ver 2.1).

---

## Resumo de ações prioritárias (separação)

1. **Estado:** criar `DesktopSessionState` em `apps/desktop/DesktopAppProvider` e parar de
   usar o mesmo valor nos 4 contextos (2.1). Mover flags `isKnowledgeGraphOpen`/
   `isProjectsOpen`/`isInboxOpen`/`openDocuments`/`activePanels`/`graphViewport` para o
   estado desktop.
2. **Renderização:** `ScreenLayers` compartilhado deve desconhecer telas/flags desktop; a
   resolução de Inbox/Graph/Projects/documents vai para `DesktopScreenLayers` (2.2).
3. **Boundary:** remover import estático mobile→desktop do stub `src/components/DesktopSidebar`
   e deletar o arquivo; mover ponte Tauri para `apps/desktop` (2.5, 2.6).
4. **Overlays:** unificar `DesktopOverlays`/`MobileOverlays` ou centralizar em camada
   compartilhada sem branch de plataforma (2.4).
5. **Cobertura do gate:** estender `check-boundaries.mjs` para também detectar (a) flags
   desktop em `ScreenLayers` e (b) os 4 contextos com valor idêntico, ou documentar esses
   gaps como aceitação manual (2.3).
6. **Forks desktop:** Faculdade (feito), Home (feito, falta G4), Estudos/Biblioteca/Perfil
   (ainda view mobile inteira) → planejar forks master-detail quando M4/Library/Calendário
   entrarem (1.10, 1.11, 1.15.4).
