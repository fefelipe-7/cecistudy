# Plano de Implementação — cecistudy desktop (visão de produto + re-arquitetura)

> Plano mestre, incremental e reversível, para evoluir o cecistudy de "app mobile com shell desktop"
> para uma **plataforma pessoal local-first** com domínio compartilhado e duas experiências distintas
> (mobile = captura/consulta · desktop = workspace de produção).
>
> Baseado em `desktop/context-desktop/*.md` (visão Manus AI) reconciliado com o estado atual do
> `src/` (auditado em 2026-08). Gatilho de verificação de cada fase: `npm run lint` + `npm run test`
> + `npm run build` verdes (conforme `AGENTS.md`).

---

## 1. Visão-alvo (resumo)

Domínio compartilhado servido por duas experiências:

- **Mobile:** captura rápida, agenda compacta, consulta, ações pontuais.
- **Desktop:** workspace persistente, painéis, Graph, editor acadêmico paginado, calendário
  semanal, TCC/Projetos, Studio de Marketing, busca global, restauração de sessão.

Camadas (de fora p/ dentro):

```
Experience (shells/panels/command palette)
  → Application Core (use-cases / commands)
    → Domain Core (entidades, regras, relações, proveniência)
      → Local Store (SQLite por dispositivo + migrações)
        → Engines (search, graph, context, learning, sync)
          → Providers (GitHub / P2P / Blob / Google Calendar / redes sociais)
```

Regras não negociáveis: **propriedade clara** de cada entidade, **proveniência** das relações,
**reversibilidade** da migração, **substituibilidade** de infraestrutura (GitHub nunca é o
fundamento do domínio).

## 2. O que já existe (NÃO refazer)

- **Desktop shell MVP:** `src/shells/DesktopAppShell.tsx`, `src/desktop/components/*`
  (Sidebar, Topbar, CourseMasterList, CourseDetailPane, `ui/Panel`, `StatusBadge`, `TagPill`),
  `src/desktop/layouts/SplitLayout.tsx`. Detecção `isDesktop` (`src/lib/platform.ts`),
  ponte `src/lib/desktop.ts`. Escolha de shell por plataforma em `src/App.tsx:18`.
- **Persistência tri-modal:** `src/lib/storage.ts`, `useSqliteState.ts`, `useStampedState.ts`
  (SQLite nativo + `SyncIndex`),   `persistentData.ts`, `exportImport.ts` (Zod + migrações,
  `SCHEMA_VERSION=12` — bump feito na Fase 3 ao adicionar `workspaceId`).
- **Sync (camada de dados pronta):** `src/lib/sync/{stamp,merge}.ts` (LWW determinístico,
  tombstones, preview), `transport-bridge.ts` (stub de transporte), `pairing.ts`, `scanQr.ts`,
  `src/components/sync/SyncScreen.tsx`. Falta o **transporte** e o **protocolo versionado**.
- **Roteamento por pilha:** `navigationStack` + `src/lib/routing.ts`.
- **Domain Core (F0–F3 — feito):** `src/core/domain/*` (entities puras: Workspace, Document,
  Block, Relation, Suggestion, AssociationPolicy, CalendarEvent, Responsibility, Project, Output,
  AcademicNode, Reference, ContentBase, ChannelVariant, LearningState + `ids.ts` + `capabilities.ts`)
  e `src/core/application/use-cases/*` (funções puras testadas). `workspaceId` adicionado a todas
  as entidades sincronizáveis + migração 11→12 (idempotente) + `DesktopSessionState` persistido.
  **Falta:** consumir esse núcleo nas UIs/shells (hoje as views ainda usam `AppContext` direto) e o
  **transporte** de sync (protocolo versionado).
- **Não existe ainda (greenfield real):** Grafo de Conhecimento visual (F6/F7), Studio de Marketing
  (F9), TCC/Projetos desktop como módulo de produção (F8), Calendário como domínio (F7), Indexador de
  busca local (F6). `KnowledgeGraph*`, `MarketingStudio`, `WorkspaceSwitcher` = 0 ocororrências no `src/`.

## 3. Guardrails

- `AppContext` **não recebe novas regras de negócio**; vira facade temporária de sessão/compat.
  Fluxos novos passam por use-cases.
- Migração **incremental e reversível**; IDs estáveis; backup/restauração validados antes de mover dados.
- Design system `cecistudy` (tokens semânticos, sem hex), voz pt-BRd, gates de lint/test/build.

---

## 4. Plano por fases

### Fase 0 — Proteção e contratos (M0)
**Objetivo:** garantir que qualquer mudança futura é restaurável.
- Auditar `src/lib/exportImport.ts`: round-trip do backup v2, validação Zod (`backupDataSchema`),
  aplicação de migrações e restauração atômica.
- Auditar `src/lib/persistentData.ts` (`buildBackupData` exclui catálogos `approaches`/`questions`;
  `resetDatabase`) e `src/data/schema.ts` (`SCHEMA_VERSION=11`, `MIGRATIONS`).
- Ampliar `src/lib/__tests__/exportImport.test.ts`: round-trip, reset, backup antigo (schema 6→11),
  payload inválido, coleção malformada, passthrough de campos legados.
- `SCHEMA_VERSION` sobe 11→**12** **somente** quando a Fase 2 introduzir entidades novas (não antes).
- **Verificação:** lint + test + build verdes; relatório de itens migrados/ignorados.

### Fase 1 — Domain Core independente de React (M1)
**Objetivo:** contratos de domínio sem dependência de UI.
- `src/core/domain/{workspace,knowledge,calendar,projects,marketing,studies,relations}/` com
  interfaces TS puras: Workspace, Document, Block, Concept, Relation, Suggestion, AssociationPolicy,
  CalendarEvent, Responsibility, PlanningBlock, Occurrence, ExecutionRecord, RecurrenceRule, Subtask,
  Project, Output, AcademicNode, Reference, Citation, PositioningProfile, ContentIdea, ContentBase,
  ChannelVariant, Publication, MetricSnapshot, StrategicInsight, LearningState.
- `src/core/domain/ids.ts`: gerador de IDs estável (prefixo por entidade, sem `Date.now()` solto).
- Nenhuma import de React / `AppContext` / localStorage / Capacitor / Tauri.
- **Verificação:** `tsc` limpo; testes de invariantes puros (ex.: limite de 5 projetos ativos).

### Fase 2 — Ports, Repositories & Use Cases (M1)
**Objetivo:** fronteira Application Core.
- `src/core/ports/{repositories,sync,blobs,integrations}.ts`.
- `src/core/application/use-cases/*`: createWorkspace, createDocument, createRelation,
  createCalendarEvent, planResponsibility, recordExecution, createProject, configureAcademicTree,
  createOutput, insertCitation, exportDocx, importDocxCandidate, createContentBase,
  approvePublication, startSync, restoreBackup…
- `src/core/serialization/` (tipos de payload).
- `AppContext` ganha **adapters** que chamam os use-cases; API legada (`useApp()`) continua servindo
  as views atuais. Bump `SCHEMA_VERSION` 11→12 aqui.
- **Verificação:** use-cases testados sem React; `AppContext` continua servindo as views.

### Fase 3 — Workspaces + workspaceId + sessão (M2)
**Objetivo:** isolamento de contexto.
- `workspaceId` em todas as entidades sincronizáveis (direta/indiretamente).
- Workspace "Acadêmico" padrão; migração idempotente que re-etiqueta dados atuais.
- `DesktopSessionState` (`lastWorkspaceId`, `openDocuments[]`, `activePanels[]`,
  `selectedGraphNodeId?`, `graphViewport?`, `activeModule`, `layoutState`) via `usePersistentState`.
- **Verificação:** migração idempotente testada; reabrir desktop restaura último workspace.

### Fase 4 — Shells próprios + matriz de capacidades (M3)
**Objetivo:** desktop deixar de ser "mobile grande".
- Reforçar separação `DesktopAppShell` vs `MobileAppShell` (já por `isDesktop` em `App.tsx:18`).
- Adicionar `CommandPalette` (⌘K evolui de busca p/ palette), `StatusBar`
  (indexação/sync/provider), `ContextInspector` (placeholder).
- `PlatformCapability` matrix em `src/core/domain/capabilities.ts` (elimina `if (isDesktop)` espalhado).
- **Verificação:** desktop e mobile abrem sem quebrar; capability matrix coberta por teste.

### Fase 5 — Base de Conhecimento: Documents & Blocks (M4 / Marco C)
**Objetivo:** fatia vertical **Workspace → Document → salvar → reabrir**.
- Store de Document/Block (SQLite via `useSqliteState` estendido ou repo novo).
- Editor básico (Markdown-first como fonte autoral; bloco = unidade atômica).
- Migrar `looseNotes`, `ClassNote`, `MaterialItem` para Document/Block preservando `legacySourceId`.
- **Verificação:** criar documento num workspace e reabrir (fatia A).

### Fase 6 — Busca local + Relations + Graph + Inbox (Marco C)
**Objetivo:** conhecimento navegável.
- `SearchIndex` local (texto + metadados); busca global consome índice.
- Relações explícitas/determinísticas primeiro; semânticas entram como sugestão no Inbox.
- `Relation`, `Suggestion`, `AssociationPolicy` (persiste bloqueios/recusas).
- Graph view desktop (filtros por módulo/projeto/período/profundidade) + painel contextual.
- **Verificação:** relação explícita aparece no Graph + inspector (fatia C); Inbox aceita/rejeita.

### Fase 7 — Calendário como domínio (Marco D)
**Objetivo:** separar evento/responsabilidade/planejamento/realidade.
- Novas entidades (Event, Responsibility, PlanningBlock, Occurrence, ExecutionRecord, RecurrenceRule,
  Subtask); 4 níveis de compromisso.
- Visão **semanal desktop** (grade, drag/resize, painel contextual, camadas por origem) — reaproveita
  `SplitLayout`/`Panel`. Agenda mobile compacta (ações rápidas).
- Google Calendar bidirecional (origem define edição; conflitos não silenciosos).
- **Verificação:** planejar/registrar na semana (fatia D); migrar Task/Exam → Responsibility/Event.

### Fase 8 — TCC & Projetos + editor acadêmico + DOCX (Marco E)
**Objetivo:** produção acadêmica completa.
- `Project` (limite 5 ativos), `Output`, `AcademicTree` configurável, modelos (TCC/artigo/etc.).
- Editor **visual paginado** (próximo ao Word): páginas, margens, estilos, tabelas, imagens, notas, sumário.
- Biblioteca de referências + citações **ABNT**; export DOCX; import como versão candidata + comparação.
- Migrar `TccData` → Project/Output/AcademicTree/Document.
- **Verificação:** criar projeto + saída + exportar DOCX + round-trip comparado (fatiAs E, F).

### Fase 9 — Marketing Studio (Marco F)
**Objetivo:** posicionamento e produção multicanal.
- `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant` (IG/TikTok/LinkedIn),
  `Publication`, `MetricSnapshot`, `StrategicInsight`.
- Fluxo editorial (ideia→…→publicado); aprovação individual por canal; fallback manual.
- Calendário editorial integrado ao Calendário unificado.
- **Verificação:** adaptar ideia para 3 canais + aprovar (fatia G).

### Fase 10 — Sync Protocol + Providers (Marco G)
**Objetivo:** protocolo próprio versionado.
- `SyncPackage`/`SyncManifest` (schemaVersion, protocolVersion, revision, parentRevision, deviceId,
  workspaceScope, tombstones, contentHashes, encryptionMetadata, integritySignature).
- Engine: inspectRemote, checkRevision (compare-and-swap), createPackage, merge, preview,
  resolveConflict, apply.
- `GitHubProvider` (reusa `SyncIndex`/stamps) + `P2PProvider` (reaproveita `transport-bridge`/
  `pairing`/`scanQr`) + `BlobProvider` + camada de criptografia.
- **Verificação:** dois dispositivos trocam dados sem sobrescrever revisão nova (fatiAs H, I).

### Fase 11 — Engines avançadas (Marco H)
**Objetivo:** inteligência local e aprendizagem.
- Context Engine + `KnowledgePacket` + `.cectx` (contexto compilado p/ IA, off por padrão).
- LearningState multidimensional (definição/explicação/recuperação/aplicação/comparação/problema/criação).
- Relações semânticas como sugestão; análise de impacto entre domínios.
- **Verificação:** sugestão de estudo contextual no Inbox; IA só com autorização.

### Fase 12 — Remoção do legado (M8/M10)
**Objetivo:** `AppContext` deixa de ser dono do domínio.
- Remover listas globais progressivamente; manter `AppContext` como facade de sessão/compatibilidade.
- **Verificação:** testes de migração repetíveis; export/restore fora do provider.

---

## 5. Fatias verticais de entrega

Cada marco entrega uma capacidade utilizável ponta-a-ponta (domínio + persistência + UI + teste):

| Marco | Fatia | Critério de entrega |
|---:|---|---|
| A | Workspace → Document → salvar → reabrir | Ceci cria e retoma um documento num Workspace. |
| B | Document → busca local | Documento encontrado por texto e metadados. |
| C | Document → Relation → Graph | Relação explícita aparece no Graph + inspector. |
| D | Event/Responsibility → semana desktop | Ceci planeja e registra na visão semanal. |
| E | Project → AcademicTree → editor | Ceci cria projeto e escreve saída principal. |
| F | Document → referência → DOCX | Exporta, edita fora, importa e compara versão. |
| G | ContentBase → ChannelVariant | Adapta ideia p/ Instagram, TikTok, LinkedIn. |
| H | SQLite → SyncPackage → provider | Dois dispositivos trocam dados sem sobrescrever revisão. |
| I | Context → KnowledgePacket → IA | IA opera com contexto compilado e autorização. |

## 6. Sequenciamento

`F0 → F1 → F2 → F3 → F4 → F5 (A) → F6 (B,C) → F7 (D) → F8 (E,F) → F9 (G) → F10 (H,I) → F11 → F12`

---

## 7. Estado de execução (checklist)

| Fase | Status | Notas |
|---|---|---|
| F0 | ✅ concluída | backup/restauração auditado; testes de migração v5→atual adicionados (445 testes verdes, lint+build OK). `SCHEMA_VERSION` segue 11. |
| F1 | ✅ concluída | `src/core/domain/**` criado (tipos puros: workspace, knowledge, calendar, projects, marketing, capabilities) + invariantes (limite 5 projetos, relação semântica→Inbox, matriz de capacidades). 9 testes verdes, lint OK. Sem dependência de React/UI. |
| F2 | ✅ concluída | `src/core/ports/*` (repositories/sync/blobs/integrations) + `src/core/serialization.ts` (SyncManifest/SyncPackage) + `src/core/application/use-cases/*` (workspace, knowledge, projects, calendar, marketing) como funções puras + 10 testes. Lint + 464 testes + build verdes. `SCHEMA_VERSION` segue 11. Adapter no `AppContext` e bump p/ 12 ficam para sub-passos de integração. |
| F3 | ✅ concluída | `workspaceId` em todas as entidades + migração 11→12 idempotente (testada) + `DesktopSessionState` persistido. UI conectada: `workspaces` persistido no `AppContext`, `switchWorkspace`/`createWorkspace`, `WorkspaceSwitcher` na `DesktopSidebar` e carimbo de `workspaceId=currentWorkspaceId` em todos os handlers de criação. 469 testes + lint + build verdes. |
| F4 | ✅ base existente | Shell desktop já implementado na base de código: `DesktopAppShell`, `DesktopSidebar`, `DesktopTopbar`, `GlobalOverlays`/CommandPalette (⌘K), `SplitLayout`, `Panel`/`StatusBadge`/`TagPill`. `capability matrix` em `src/core/domain/capabilities.ts`. Pendentes menores: `StatusBar` (indexação/sync) e `ContextInspector`. |
| F5 | ⬜ pendente | Documents & Blocks (fatia vertical Workspace→Document→salvar→reabrir) — greenfield. |
| F6 | ✅ concluída | Relations + Inbox + **Graph view**. `relations`/`suggestions`/`associationPolicies` persistidos (stamp `workspaceId`); `addExplicitRelation` (dedupe + política de bloqueio + semântica→Inbox), `createSuggestion`/`acceptSuggestion`/`rejectSuggestion`/`setAssociationPolicy`. `KnowledgeInbox` (curadoria) e `KnowledgeGraphView` (SVG: nós = entidades reais, arestas = relações aceitas, criação de relação pela UI, seleção/destaque de vizinhos) na `DesktopSidebar`. 474 testes + lint + build verdes. *Busca local usa o indexador global existente (`GlobalSearchModal`); indexador dedicado fica como otimização futura.* |
| F7 | ⬜ pendente | Calendário como domínio — greenfield. |
| F8 | 🟡 em andamento | **Slice 1 feito:** gestão de `projects`/`outputs` no `AppContext` (stamp `workspaceId`), `createProject` (invariante de 5 ativos via `createProjectUseCase`), `updateProject`, `createOutput`/`updateOutput`/`deleteOutput`. `ProjectsView` (Modal) na `DesktopSidebar`: criar projeto (título/tipo), badge de limite "X de 5 ativos", lista de projetos com status, e saídas por projeto. 476 testes + lint + build verdes. **Falta:** editor de blocos paginado (depende de F5 Documents & Blocks) + citações ABNT + export DOCX. |
| F9 | ⬜ pendente | Marketing Studio — greenfield (`MarketingStudio`=0). |
| F10 | ⬜ pendente | Sync engine: transporte + protocolo versionado (SyncScreen existe, transporte é stub). |
| F11 | ⬜ pendente | Graph view desktop — greenfield. |
| F12 | ⬜ pendente | Adaptação mobile (modelos de produção) — greenfield. |
