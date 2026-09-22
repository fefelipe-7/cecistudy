# Spec: Módulos Greenfield Desktop do cecistudy

> Documento de especificação para os módulos desktop **ainda não construídos** (greenfield).
> Caminho canônico: `desktop/spec/05-modulos-greenfield.md`.
> Autoria: agente de especificação (spec-driven-development + greenfield-architecture-planner).
> Idioma: pt-BR. Tom: técnico-acolhedor, voz cecistudy ♡ onde aplicável.

---

## 0. Resumo executivo

Cinco módulos desktop-only serão construídos do zero, todos vivendo na camada desktop
(`src/desktop/**` e `apps/desktop/**`) e **nunca** importados pela casca mobile
(`ScreenLayers`, `MobileAppShell`, `MobileOverlays`, `src/components/views/*`). São eles:

| id do módulo | Nome | Resumo |
|---|---|---|
| `M-CAL` | Calendário semanal | grade semanal com drag-and-drop/resize; painel `calendar`; sync com `tasks`/`exams`/`sessions`. |
| `M-MKT` | Marketing Studio | editor de conteúdo por canal (variantes), calendário editorial, métricas, ligação a TCC. |
| `M-DOC` | Documents & Blocks (M4) | modelo canônico de documento; editor paginado; blocos; `openDocuments[]`/`tabsDocumentos`. |
| `M-LIB` | Biblioteca desktop | master-detail catálogo + leitor (SplitLayout); estante por workspace; anexos via `BlobProvider`. |
| `M-DOCX` | Exportação DOCX / ABNT | engine import/export DOCX com round-trip e comparação; bibliografia ABNT. |

Estes módulos são o "sumo" da separação de interface: a mobile continua com tabs/bottom-nav;
a desktop usa painéis, master-detail, documentos abertos e grafo. Nenhuma linha destes módulos
pode entrar no bundle mobile.

---

## 1. Inputs revisados

- `desktop/spec/00-relatorio-varredura.md` §1.15 (1.15.1–1.15.5).
- `desktop/context-desktop/Especificação incremental do Calendário do cecistudy (1).md`.
- `desktop/context-desktop/Especificação do Studio de Marketing e Posicionamento do cecistudy.md`.
- `desktop/context-desktop/Especificação do módulo de TCC do cecistudy.md` (§7–§14, §20–§22).
- `desktop/context-desktop/Blueprint arquitetural do cecistudy.md` e `Arquitetura técnica-alvo do cecistudy.md`.
- `apps/desktop/src/session/types.ts` (`DesktopSessionState`), `packages/domain/src/core/ports/blobs.ts` (`BlobProvider`).
- `.github/scripts/check-boundaries.mjs` (regras de fronteira mobile/desktop/packages).

## 2. Suposições e não-objetivos

**Suposições:**
1. A casca desktop Tauri (`apps/desktop`) e os componentes `src/desktop/**` já existem como base
   (sidebar, topbar, `SplitLayout`, `DesktopScreenLayers`, `useDesktopApp()`).
2. `DesktopSessionState` é a fonte de estado visual desktop (já contém `openDocuments[]`,
   `activePanels[]`, `selectedGraphNodeId`, `graphViewport`). Estes módulos a **estendem**.
3. Dados de domínio compartilhados (`tasks`, `exams`, `sessions`, `courses`, `books`,
   `tcc`, `references`) vivem em `packages/*` + `AppContext` (facade). Os módulos desktop leem/escrevem
   via casos de uso em `packages/application`, **não** tocando em estado de view mobile.
4. `BlobProvider` (`packages/domain`) é o port para anexos/exportações binárias (PDF/DOCX/imagem).

**Não-objetivos (desta spec):**
- Google Calendar bidirecional (M-CAL fase avançada; fora do MVP desta spec — ver §12).
- Publicação real em redes sociais (M-MKT mantém fallback manual; APIs ficam para fase futura).
- Editor de blocos para mobile (estritamente desktop).

---

## 3. Alinhamento de contexto (greenfield-architecture-planner)

| Dimensão | Evidência | Impacto na arquitetura |
|---|---|---|
| Workspace | `check-boundaries.mjs`: mobile nunca importa desktop estaticamente; `import()` dinâmico permitido. | Todos os 5 módulos são carregados via `import()` a partir de `DesktopScreenLayers`/`DesktopAppShell` → chunk isolado. |
| Workspace | `apps/desktop/src/session/types.ts` define `DesktopSessionState`. | Estado visual desktop vive só aqui; mobile nem conhece estes campos. |
| Organização | `packages/*` não podem importar `react`/`@capacitor`/`__TAURI__`. | Lógica de domínio pura (projeção de calendário, modelo de documento, engine DOCX, regras ABNT) vai para `packages/domain`/`packages/application`; a casca em `src/desktop` só faz binding de UI. |
| Projeto | Design tokens desktop = prefixo `--ds-*` (`src/desktop/styles/desktop-tokens.css`). | Tokens de cada módulo seguem `--ds-*`, sem hex raw (regra do design system). |
| Pessoal | app é de uso individual (Ceci); sem multi-tenant. | Sem auth/roles; estado de sessão é só da usuária. |

---

## 4. Mapa de capacidades (Phase 0 — capa de módulos)

| Module id | Responsabilidade | Depende de |
|---|---|---|
| `M-DOC` | Modelo canônico de documento + blocos (base de M-DOCX e de partes de M-LIB/M-MKT) | `packages/domain` (BlobProvider) |
| `M-DOCX` | Engine DOCX/ABNT (import/export/round-trip) | `M-DOC` |
| `M-CAL` | Calendário semanal desktop + sync de eventos | `packages/application` (tasks/exams/sessions) |
| `M-LIB` | Biblioteca desktop master-detail + leitor + anexos | `M-DOC` (leitor paginado), `BlobProvider` |
| `M-MKT` | Studio de marketing multicanal | `M-DOC` (conteúdo-base), `M-CAL` (camada editorial) |

**Ordem de build sugerida:** `M-DOC` → `M-DOCX` → `M-CAL` → `M-LIB` → `M-MKT`.
`M-DOC` é a fundação (modelo de documento reutilizado por leitor, marketing e TCC).

---

## 5. Princípios de arquitetura (bounded contexts + fluxo de dados)

- **Contextos limitados:** `Calendar`, `Marketing`, `Documents`, `Library`, `Export`. Cada um
  possui seus use-cases em `packages/application` e suas UIs em `src/desktop`.
- **Dono do conteúdo vs dono do tempo:** Calendário é dono do **tempo**; a origem
  (`Faculdade`, `Estudos`, `TCC`) é dona do **conteúdo**. Editar no calendário despacha comando
  ao módulo de origem via `packages/application` — nunca duplica estado.
- **Zero vazamento para mobile:** imports destes módulos só ocorrem dentro da árvore
  `src/desktop/**` + `apps/desktop/**`. O ponto de entrada mobile (`ScreenLayers`) **não** os
  referencia nem estática nem dinamicamente (a mobile não tem estes recursos).
- **Carregamento dinâmico:** `DesktopScreenLayers`/`DesktopAppShell` fazem
  `const CalendarScreen = lazy(() => import('@/desktop/screens/CalendarScreen'))`
  (ou `import()` direto) → chunks separados, fora do bundle mobile.
- **Estado visual = `DesktopSessionState`:** posição de painéis, documentos abertos, viewport
  do grafo, camadas do calendário etc. Persistido via `usePersistentState('session', …)` já existente.

---

# Módulos

---

## M-CAL — Calendário semanal

### Problema
O app tem aulas/provas/tarefas/sessões espalhados por `Faculdade`, `Estudos` e `TCC`, mas não há
uma **vista temporal unificada** no desktop onde a Ceci veja a distribuição da semana e reorganize
compromissos arrastando. O mobile tem só agenda compacta; o desktop precisa de grade semanal com
drag-and-drop/resize e painel contextual persistente (`activePanels=['calendar']`).

### Objetivos
- Grade semanal (dias × horários) com drag-and-drop e resize de eventos.
- Vistas semana / dia (e gancho para mês/agenda depois).
- Sync bidirecional com `tasks`, `exams`, `sessions` (e, no futuro, `tcc`/`internship`) via use-cases.
- Mini-mapa de semana no inspector; camadas visuais por origem (Faculdade/TCC/Estudos/Google).
- Painel contextual permanece aberto enquanto se navega pela semana (não é tab).

### Arquitetura (arquivos a criar)
Camada de UI (desktop-only):
- `src/desktop/screens/CalendarScreen.tsx` — tela raiz do calendário (registrada no `DesktopScreenLayers` via `activeModule='calendario'`).
- `src/desktop/components/calendar/CalendarWeekGrid.tsx` — grade semanal (dias × horários, faixa dia-inteiro).
- `src/desktop/components/calendar/CalendarDayView.tsx` — vista diária.
- `src/desktop/components/calendar/CalendarEventBlock.tsx` — bloco de evento (arrastável/redimensionável).
- `src/desktop/components/calendar/CalendarMiniMap.tsx` — mini-mapa da semana no inspector.
- `src/desktop/components/calendar/CalendarInspector.tsx` — painel contextual (detalhes, etapas, vínculo, planejado×real, conflitos).
- `src/desktop/components/calendar/CalendarLayerToggle.tsx` — controle de camadas visuais.
- `src/desktop/lib/calendar/useCalendarDrag.ts` — hook de drag/resize (pointer events, snap a grid).
- `src/desktop/lib/calendar/useCalendarProjection.ts` — lê `tasks`/`exams`/`sessions` e projeta em `CalendarEvent[]`.

Domínio/aplicação (em `packages/*`, sem react):
- `packages/application/src/calendar/projectEvents.ts` — projeção domínio→eventos de calendário.
- `packages/application/src/calendar/moveEvent.ts` — use-case: mover/redimensionar despacha ao dono da origem (ex.: `updateExam`, `rescheduleTask`) — **não** duplica.
- `packages/domain/src/calendar/types.ts` — `CalendarEvent`, `CalendarLayer`, `EventLevel` (obrigatório/importante/recomendado/opcional), `PlanningVsReality`.

### Estado desktop em `DesktopSessionState` (extensões propostas)
```ts
// adicionar a DesktopSessionState (apps/desktop/src/session/types.ts):
calendarView?: 'week' | 'day' | 'month' | 'agenda';
calendarAnchorDate?: string;          // YYYY-MM-DD do foco atual
calendarLayers?: string[];            // camadas ativas: ['faculdade','estudos','tcc']
calendarInspectorEventId?: string | null;
calendarMiniMapOpen?: boolean;
calendarConflictIds?: string[];       // eventos em conflito (sinalização, não bloqueio)
```
`activePanels` recebe `'calendar'` quando o painel está aberto.

### Tokens (`src/desktop/styles/desktop-tokens.css`)
```css
--ds-calendar-grid-line: var(--color-ceci-border-subtle);
--ds-calendar-grid-line-strong: var(--color-ceci-border-default);
--ds-calendar-now-line: var(--color-ceci-brand);
--ds-calendar-event-faculdade: var(--color-ceci-academic);
--ds-calendar-event-estudos: var(--color-ceci-brand);
--ds-calendar-event-tcc: var(--color-green-700);
--ds-calendar-event-google: var(--color-beige-500);
--ds-calendar-allday-bar: var(--color-surface-subtle);
--ds-calendar-minimap-bg: var(--color-surface-muted);
--ds-inspector-bg: var(--color-surface-default);
```

### Critérios de aceitação
- [ ] A grade semanal renderiza aulas (recorrentes), provas, sessões e tarefas com prazo em suas posições temporais.
- [ ] Arrastar um evento para outro horário/dia persiste a mudança na entidade de origem (`exam`/`task`/`session`) — confirmado em `packages/application`.
- [ ] Redimensionar a borda de um evento altera duração e reflete no dado de origem.
- [ ] Alternar para vista de dia mantém o anchor date e o mini-mapa.
- [ ] `activePanels` contém `'calendar'` enquanto o painel está aberto; some ao fechar.
- [ ] Camadas visuais podem ser ligadas/desligadas; conflitos de sobreposição são sinalizados mas não impedem.
- [ ] O inspector mostra planejado × real e o vínculo com a origem (ex.: "prova de cálculo II").
- [ ] `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` verdes.

### Como NÃO poluir o mobile
- `CalendarScreen` é importado **só** por `src/desktop/screens/DesktopScreenLayers.tsx` via `lazy(() => import(...))`.
- Nenhum componente em `src/components/views/*`, `src/shells/ScreenLayers.tsx` ou `MobileOverlays` referencia `calendar/`.
- A projeção `projectEvents` e o use-case `moveEvent` vivem em `packages/application` (sem react), então a mobile pode, no futuro, consumir os mesmos dados sem herdar a UI de grade.
- Drag/resize usa pointer events e `supportsEdgeSwipe`/iOS edge-swipe ficam fora deste módulo (sem conflito com `EdgeSwipeBack`).

---

## M-MKT — Marketing Studio

### Problema
A Ceci (estudante→recém-formada) precisa organizar posicionamento, produção de conteúdo e
acompanhamento de métricas multicanal — tudo isso **fora** do app mobile (que é só de estudos).
Hoje não existe nada: nem editor de conteúdo-base, nem variantes por canal, nem calendário editorial.

### Objetivos
- `PositioningProfile` editável (identidade, pilares, público, tom, hipóteses) — sugestões entram como rascunho, nunca auto-aplicadas.
- `ContentBase` → variantes por canal (`InstagramVariant`, `TikTokVariant`, `LinkedInVariant`).
- Estados de fluxo editorial: `ideia → selecionado → briefing → rascunho → em_revisao → aprovado → agendado → publicado`.
- Calendário editorial (camada própria) ligado a `M-CAL`.
- `MetricSnapshot` por publicação/canal (automático quando API disponível, manual como fallback).
- Ligação a projetos TCC como "produto" (origem na Base de Conhecimento).

### Arquitetura (arquivos a criar)
- `src/desktop/screens/MarketingScreen.tsx` — tela raiz (`activeModule='marketing'`).
- `src/desktop/components/marketing/PositioningPanel.tsx` — edição do perfil de posicionamento.
- `src/desktop/components/marketing/ContentIdeaBoard.tsx` — fila de ideias.
- `src/desktop/components/marketing/ContentBaseEditor.tsx` — editor do conteúdo-base (reusa `M-DOC`).
- `src/desktop/components/marketing/ChannelVariantEditor.tsx` — variantes Instagram/TikTok/LinkedIn (campos opcionais: legenda, roteiro, cenas, CTA…).
- `src/desktop/components/marketing/EditorialCalendar.tsx` — calendário editorial (nova camada em `M-CAL`).
- `src/desktop/components/marketing/MetricsSnapshot.tsx` — registro/comparativo de métricas.
- `src/desktop/lib/marketing/useMarketingState.ts` — bindings de `DesktopSessionState.marketing*`.
- `packages/domain/src/marketing/types.ts` — `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `Publication`, `MetricSnapshot`, `StrategicInsight`.
- `packages/application/src/marketing/saveVariant.ts`, `pushEditorialLayer.ts` (adiciona à camada do calendário).

### Estado desktop em `DesktopSessionState` (extensões propostas)
```ts
marketingActiveProjectId?: string;     // projeto de marketing / "produto" TCC ligado
marketingActiveChannel?: 'instagram' | 'tiktok' | 'linkedin' | null;
marketingSelectedContentId?: string | null;
marketingEditorialOpen?: boolean;      // camada editorial visível no calendário
```

### Tokens
```css
--ds-mkt-channel-instagram: #E97891;   /* rosa marca como base de UI, canal recebe accent próprio */
--ds-mkt-channel-tiktok: #4A879F;
--ds-mkt-channel-linkedin: #396D82;
--ds-mkt-status-idea: var(--color-beige-500);
--ds-mkt-status-approved: var(--color-green-700);
--ds-mkt-status-published: var(--color-ceci-academic-strong);
--ds-mkt-metric-good: var(--color-green-400);
--ds-mkt-metric-warn: var(--color-yellow-600);
```

### Critérios de aceitação
- [ ] A Ceci cria `PositioningProfile` e edita pilares/público; sugestões ficam como rascunho aguardando aprovação.
- [ ] Um `ContentBase` gera variantes independentes para cada canal; aprovar Instagram não aprova LinkedIn.
- [ ] Fluxo editorial avança por estados; pular etapas é permitido.
- [ ] Itens de produção aparecem como camada no calendário (`M-CAL`) quando `marketingEditorialOpen`.
- [ ] `MetricSnapshot` grava por publicação+canal; fallback manual funciona sem API.
- [ ] Conteúdo pode registrar origem na Base de Conhecimento (vínculo de volta à fonte).
- [ ] `check-boundaries.mjs` verde; módulo ausente do bundle mobile.

### Como NÃO poluir o mobile
- `MarketingScreen` carregado via `import()` só em `DesktopScreenLayers`.
- `packages/domain/src/marketing/types.ts` é puro (sem react) → reutilizável sem arrastar UI.
- Nenhuma referência a `BottomNav`, `FloatingActionMenu` ou views mobile.
- O aviso opcional de "revisão de responsabilidade ligada à Psicologia" é um componente desktop, não bloqueante.

---

## M-DOC — Documents & Blocks editor (M4)

### Problema
O TCC e a produção acadêmica precisam de um **modelo interno canônico de documento** e de um
editor visual paginado próximo ao Word. Hoje o app não tem modelo de documento próprio — só notas
avulsas e o `BibliotecaView`. Este módulo é a fundação reutilizada por `M-LIB` (leitor), `M-MKT`
(conteúdo-base) e TCC.

### Objetivos
- Modelo canônico `DocumentModel` (parágrafo, título, tabela, imagem, citação, código/LaTeX, equação, nota de rodapé, referência cruzada).
- Editor visual **paginado** (páginas, margens, cabeçalho/rodapé, numeração, sumário, quebras).
- `openDocuments[]` + `activePanels` em `DesktopSessionState`; `tabsDocumentos` (LAYOUT-SPEC G12) no topo do canvas.
- Árvore de blocos; versionamento (autosave/histórico/versão nomeada).
- Modos: visual paginado (principal), markdown, latex, pré-visualização.

### Arquitetura (arquivos a criar)
- `src/desktop/screens/DocumentsScreen.tsx` — tela raiz (master-detail de documentos).
- `src/desktop/components/documents/DocumentTabs.tsx` — `tabsDocumentos` (G12, 36px), uma aba por id em `openDocuments`.
- `src/desktop/components/documents/BlockTree.tsx` — árvore de blocos/seções.
- `src/desktop/components/documents/PageCanvas.tsx` — canvas paginado (render de páginas).
- `src/desktop/components/documents/blocks/ParagraphBlock.tsx`, `HeadingBlock.tsx`, `TableBlock.tsx`, `ImageBlock.tsx`, `QuoteBlock.tsx`, `CodeBlock.tsx`, `LatexBlock.tsx`, `FootnoteBlock.tsx`, `CrossRefBlock.tsx`.
- `src/desktop/components/documents/DocumentInspector.tsx` — propriedades de estilo/seção.
- `src/desktop/lib/documents/useDocumentEditor.ts` — binding de `openDocuments`/`activeDocumentId` e comandos de bloco.
- `src/desktop/lib/documents/versioning.ts` — autosave/histórico/versão nomeada (client-side).
- `packages/domain/src/documents/model.ts` — `DocumentModel`, `Block`, `BlockType`, `StyleSpec`.
- `packages/domain/src/documents/serializer.ts` — (de)serialização do modelo interno (JSON canônico).
- `packages/application/src/documents/openDocument.ts`, `saveDocument.ts` (usa `BlobProvider` para binários).

### Estado desktop em `DesktopSessionState` (extensões propostas)
```ts
activeDocumentId?: string | null;      // foco entre os aberto em openDocuments[]
documentEditorMode?: 'visual' | 'markdown' | 'latex' | 'preview';
documentActiveBlockId?: string | null;
documentSplitRatio?: number;           // proporção master/detail do editor
```

### Tokens
```css
--ds-doc-page-bg: var(--color-surface-default);
--ds-doc-page-shadow: var(--shadow-floating);
--ds-doc-page-border: var(--color-ceci-border-default);
--ds-doc-canvas-bg: var(--color-surface-muted);
--ds-doc-tab-active: var(--color-ceci-brand);
--ds-doc-block-hover: var(--color-surface-rose);
--ds-doc-selection: var(--color-ceci-brand-soft);
--ds-doc-latex-bg: var(--color-surface-blue);
```

### Critérios de aceitação
- [ ] Criar documento abre `tabsDocumentos` com o id em `openDocuments`; fechar remove.
- [ ] Editor paginado mostra páginas com margens/cabeçalho/rodapé e numeração.
- [ ] Inserir/editar cada tipo de bloco (parágrafo, título, tabela, imagem, citação, código, LaTeX, nota de rodapé, ref cruzada) persiste no `DocumentModel`.
- [ ] Alternar para modos markdown/latex/pré-visualização mantém o conteúdo do modelo interno.
- [ ] Versionamento: autosave recuperável + histórico + versão nomeada ("enviada ao orientador").
- [ ] `check-boundaries.mjs` verde; nenhum import a partir de `src/components/views/*`.

### Como NÃO poluir o mobile
- `DocumentsScreen` só via `import()` em `DesktopScreenLayers`.
- `DocumentModel`/`serializer` em `packages/domain` (puro) — a mobile pode ler/versionar o mesmo JSON no futuro sem a UI pesada.
- `tabsDocumentos` é elemento de canvas desktop (G12); não existe equivalente mobile.
- Imagens/binários usam `BlobProvider` (port), nunca `localStorage` bruto nem estado de view mobile.

---

## M-LIB — Biblioteca desktop

### Problema
Hoje o tab `biblioteca` desktop renderiza a **mesma** `BibliotecaView` mobile (sem master-detail,
sem leitor próprio, sem gestão de acervo/estante). Falta a experiência desktop: catálogo à
esquerda, leitura/reader à direita (SplitLayout), estante por workspace e gestor de anexos.

### Objetivos
- Master-detail: catálogo (esquerda) + leitor/reader (direita) em `SplitLayout`.
- Estante por workspace (reusa `lastWorkspaceId` de `DesktopSessionState`).
- Gestor de anexos (PDF/imagem/DOCX) via `BlobProvider`.
- Fork consciente da `BibliotecaView`: reusa o **modelo de dados** (`CollectionBook`,
  `Article`, `savedBookIds`, `looseNotes`) mas com UI desktop distinta.

### Arquitetura (arquivos a criar)
- `src/desktop/screens/LibraryScreen.tsx` — tela raiz (`activeTab==='biblioteca'` desktop).
- `src/desktop/components/library/LibraryMaster.tsx` — catálogo (listas/shelves, busca, filtros).
- `src/desktop/components/library/LibraryReader.tsx` — leitor paginado (reusa `M-DOC` `PageCanvas`/blocos para artigos e notas).
- `src/desktop/components/library/WorkspaceShelf.tsx` — estante filtrada por `lastWorkspaceId`.
- `src/desktop/components/library/AttachmentManager.tsx` — gestor de anexos via `BlobProvider`.
- `src/desktop/components/library/BookContextMenu.tsx` — ações desktop (abrir leitor, anexar, favoritar).
- `src/desktop/lib/library/useLibraryDesktop.ts` — bindings (estante, reader aberto).
- `packages/application/src/library/attachFile.ts`, `openReader.ts` (usa `BlobProvider` + `savedBookIds`).

### Estado desktop em `DesktopSessionState` (extensões propostas)
```ts
libraryWorkspaceId?: string;           // estante ativa (default = lastWorkspaceId)
libraryReaderDocId?: string | null;    // doc/artigo/livro aberto no reader
libraryReaderPage?: number;
libraryActiveCollection?: string | null;
libraryAttachmentDrawerOpen?: boolean;
```

### Tokens
```css
--ds-lib-master-bg: var(--color-surface-muted);
--ds-lib-reader-bg: var(--color-surface-default);
--ds-lib-shelf-border: var(--color-ceci-border-default);
--ds-lib-cover-spine: rgba(64,56,58,0.10);
--ds-lib-attachment-bg: var(--color-surface-subtle);
--ds-lib-reader-progress: var(--color-ceci-brand);
```

### Critérios de aceitação
- [ ] Abrir um item do catálogo carrega o reader à direita (SplitLayout `rightOpen=true`).
- [ ] A estante respeita `libraryWorkspaceId`; trocar workspace filtra o acervo.
- [ ] Anexar PDF/imagem/DOCX persiste via `BlobProvider` e aparece no gestor de anexos.
- [ ] `savedBookIds`/`looseNotes` continuam funcionando (modelo compartilhado com mobile).
- [ ] A UI mobile `BibliotecaView` **não** é alterada por este módulo (fork, não mutação).
- [ ] `check-boundaries.mjs` verde.

### Como NÃO poluir o mobile
- `LibraryScreen` desktop só em `DesktopScreenLayers` via `import()`; `BibliotecaView` mobile permanece intocada.
- Reuso de **dados** (`CollectionBook`, `savedBookIds`) ocorre via `packages/*`/`AppContext`, não importando a view mobile.
- O reader desktop reusa `M-DOC` (blocks) — que já é desktop-only; mobile continua com seu `ReaderModeModal`.

---

## M-DOCX — Exportação DOCX / ABNT

### Problema
O TCC e a produção acadêmica exigem saída em DOCX com **alta fidelidade** e round-trip
(abrir no Word, editar, reimportar com comparação). Também é preciso bibliografia ABNT estruturada.
Hoje não existe engine de export/import — só o modelo canônico de `M-DOC`.

### Objetivos
- Engine import/export DOCX conectado ao `DocumentModel` de `M-DOC`.
- Round-trip: DOCX exportado → editado externamente → reimportado como **versão candidata** com comparação detalhada (nunca sobrescreve silenciosamente).
- Bibliografia ABNT inicial (diretas/indiretas, página/localizador, notas de rodapé, lista gerada).
- Comparação de versões (interna × candidata externa).
- LaTeX/Markdown como modos secundários (precedência DOCX).

### Arquitetura (arquivos a criar)
- `src/desktop/components/documents/export/DocxExportDialog.tsx` — diálogo de exportação por saída/perfil.
- `src/desktop/components/documents/export/DocxImportDialog.tsx` — importação + fluxo de comparação.
- `src/desktop/components/documents/export/VersionCompareView.tsx` — diff detalhado (interna × candidata).
- `src/desktop/components/documents/export/AbntBibliography.tsx` — gerador/visualizador ABNT.
- `src/desktop/lib/export/docxEngine.ts` — conversão `DocumentModel` ⇄ DOCX (usa lib DOCX em `packages/domain` sem react).
- `src/desktop/lib/export/abnt.ts` — formatação de referências/citações ABNT.
- `src/desktop/lib/export/compareVersions.ts` — reconciliação de versões.
- `packages/domain/src/export/docx.ts` — core da engine (puro, testável).
- `packages/domain/src/citations/abnt.ts` — regras ABNT (puro).
- `packages/application/src/export/exportDocument.ts`, `importCandidate.ts` (usa `BlobProvider` para o binário).

### Estado desktop em `DesktopSessionState` (extensões propostas)
```ts
docxCompareBaseVersionId?: string | null;  // versão interna base da comparação
docxCandidateVersionId?: string | null;    // versão candidata (reimportada)
abntProfileId?: string;                    // perfil de citação ativo (default 'abnt')
```

### Tokens
```css
--ds-docx-diff-add: var(--color-green-200);
--ds-docx-diff-del: var(--color-red-400);
--ds-docx-diff-add-border: var(--color-green-700);
--ds-docx-diff-del-border: var(--color-red-700);
--ds-abnt-ref-bg: var(--color-surface-subtle);
--ds-export-dialog-border: var(--color-ceci-border-brand);
```

### Critérios de aceitação
- [ ] Exportar `DocumentModel` → DOCX preserva estilos/títulos/tabelas/imagens/notas/sumário (ou marca parcial quando incompatível, sem falhar silenciosamente).
- [ ] Reimportar um DOCX editado cria **versão candidata**; a Ceci vê comparação detalhada e decide aceitar/rejeitar — histórico preservado.
- [ ] Gerar bibliografia ABNT a partir das referências do projeto (diretas/indiretas com localizador).
- [ ] LaTeX/Markdown exportáveis como modos secundários.
- [ ] Engine em `packages/domain` tem testes unitários de round-trip (fiducial mínimo).
- [ ] `check-boundaries.mjs` verde; sem import mobile.

### Como NÃO poluir o mobile
- Diálogos/engine só em `src/desktop/**` via `import()` no editor desktop (`M-DOC`/`DocumentsScreen`).
- Core `packages/domain/src/export/*` e `citations/*` são puros (sem react) → reutilizáveis; a mobile não os importa por padrão.
- Exportações binárias usam `BlobProvider` (port), nunca estado de view mobile.

---

## 6. Roadmap de sequenciamento (roadmap-frameworks)

| Fase | Módulos | Entrega vertical | Gate |
|---|---|---|---|
| **F1 — Fundação** | `M-DOC` | Modelo canônico + editor paginado mínimo + `openDocuments`/`tabsDocumentos`. | lint + test + boundary |
| **F2 — Interop** | `M-DOCX` | Export/import DOCX + ABNT + comparação de versões (atende MVP de TCC §20.5). | + testes de round-trip |
| **F3 — Tempo** | `M-CAL` | Grade semanal drag/resize + sync tasks/exams/sessions + mini-mapa. | + boundary |
| **F4 — Acervo** | `M-LIB` | Master-detail + reader + estante + anexos. | + boundary |
| **F5 — Voz** | `M-MKT` | Positioning + ContentBase + variantes + camada editorial + métricas. | + boundary |

Dependências: `M-DOCX` e `M-LIB` e `M-MKT` consomem `M-DOC`; `M-MKT` consome a camada editorial de `M-CAL`.
Cada fase deixa o app em estado funcional (vertical slice), com checkpoint de lint/test/boundary.

---

## 7. Decision Log (ADR-style)

| ID | Decisão | Status | Drivers | Rationale | Consequências |
|---|---|---|---|---|---|
| ADR-G1 | Estado visual desktop só em `DesktopSessionState` (estendido). | Proposed | boundary, `check-boundaries` | mobile nem conhece estes campos; persistência já existe. | Campos novos precisam de migration leve no `session`. |
| ADR-G2 | Todos os 5 módulos via `import()` dinâmico a partir de `DesktopScreenLayers`. | Proposed | boundary rule 3 | chunk isolado, nunca entra no bundle mobile. | Lazy loading; possível flash — mitigar com skeleton. |
| ADR-G3 | Lógica de domínio pura em `packages/domain`/`packages/application`. | Proposed | packages não podem importar react/capacitor | reuso + testabilidade; mobile pode consumir depois. | Dois lugares de código (packages + src/desktop binding). |
| ADR-G4 | `M-DOC` antes de `M-DOCX`/`M-LIB`/`M-MKT`. | Proposed | dependência de fundação | evita duplicar modelo de documento. | `M-DOCX` fica para F2. |
| ADR-G5 | DOCX tem precedência sobre Markdown/LaTeX. | Proposed | spec TCC §9/§20 | interoperabilidade com Word é o caso real. | Markdown/LaTeX ficam como modos secundários. |
| ADR-G6 | Edição no calendário despacha ao dono da origem (use-case), não duplica. | Proposed | "Calendário dono do tempo" | fonte única de verdade por entidade. | `moveEvent` precisa de use-cases por origem. |

---

## 8. Riscos e open questions

| Risco | Impacto | Mitigação |
|---|---|---|
| Engine de editor paginado (Word-like) é complexa. | Alto | F1 entrega mínimo (blocos + páginas); melhorias após MVP. |
| Conversão DOCX fidelidade total. | Médio | marcar elementos parciais; nunca falhar silenciosamente (spec TCC §9). |
| Vazamento acidental para mobile. | Alto | `check-boundaries.mjs` no CI; code review de imports. |
| Performance de documentos longos. | Médio | paginação virtualizada no `PageCanvas`. |

**Open questions (decisões de implementação, não de produto):**
1. Biblioteca/engine do editor paginado (ADR-G6 em aberto na spec TCC §23.1).
2. Estratégia exata de reconciliação DOCX (diff por bloco vs por XML).
3. Política de fuso horário do calendário (spec Calendário §12.6).
4. Quando introduzir Markdown/LaTeX completos (pós-MVP).
5. Formato de armazenamento de anexos no `BlobProvider` (local vs nuvem).

---

## 9. Handoff para implementação

- Stack: React 19 + TS + Vite (desktop Tauri), tokens `--ds-*`; `packages/domain|application` para lógica pura.
- Diretórios: `src/desktop/screens|components|lib` + `apps/desktop/src/session/types.ts` (estado) + `packages/{domain,application}/src`.
- Contratos a implementar primeiro: `DocumentModel` (M-DOC) → `docx.ts`/`abnt.ts` (M-DOCX) → `projectEvents`/`moveEvent` (M-CAL).
- Comandos: `npm run lint` (`tsc --noEmit`), `npm run test`, `node .github/scripts/check-boundaries.mjs`.
- Primeira fatia vertical: F1 (`M-DOC`) — editor paginado mínimo com `openDocuments[]`/`tabsDocumentos`.
- Nunca editar `src/components/views/*` para estes módulos; mobile e desktop evoluem independentes.
