# cecistudy Desktop — Análise do Estado Atual

> Documento 1 de 4. Baseado na análise integral de `desktop/` (docs de contexto, specs,
> roadmap, código de shell `src-tauri`, `apps/desktop`, `packages/*`, `src/desktop/*`).
> Objetivo: consolidar "onde estamos de verdade", antes de decidir "para onde ir".

---

## 1. O que é o cecistudy

Produto pessoal da Ceci (estudante/recém-formada em Psicologia): organizador acadêmico
que cobre disciplinas, aulas, provas, leituras, estudos (flashcards/quiz/revisão),
estágio, TCC e, na visão-alvo, também Base de Conhecimento (grafo), Calendário unificado
e um Studio de Marketing/posicionamento profissional.

Hoje é um único código React que roda em três plataformas:

| Plataforma | Empacotador | Papel |
|---|---|---|
| Web/PWA | Vite build direto (`dist/`) | Preview e instalação PWA |
| Mobile (Android/iOS) | Capacitor | Captura rápida, agenda, consulta |
| Desktop (Win/Mac/Linux) | **Tauri 2** | Hoje: shell fino sobre o mesmo bundle. Alvo: workspace de produção |

## 2. Stack técnico real (confirmado no código, não só nos docs)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion.
- **Desktop nativo:** Tauri 2 (Rust) — `src-tauri/` com plugins `notification`, `updater`,
  `process`, `window-state`. `Cargo.toml` não tem dependências além desses plugins — ou
  seja, **nenhuma lógica de domínio roda em Rust hoje**, é puramente shell de janela.
- **Auto-update:** Tauri updater assinado (minisign), manifesto publicado via GitHub
  Releases (`latest.json`), chave privada fora do git.
- **Build desktop:** `tauri.conf.json` aponta `frontendDist` para `../../apps/desktop/dist`
  — ou seja, já existe um **entrypoint Vite próprio para desktop** (`apps/desktop/`),
  separado do `apps/mobile/`. Isso já é uma evolução em relação ao "carrega o dist da raiz"
  descrito nos documentos de visão mais antigos.
- **Monorepo em pacotes:** o repositório já foi parcialmente modularizado:
  - `packages/domain` — entidades de domínio puras (Workspace, Document, Block, Relation,
    Suggestion, AssociationPolicy, CalendarEvent, Responsibility, Project, Output,
    AcademicNode, Reference, ContentBase, ChannelVariant, LearningState, `ids.ts`,
    `capabilities.ts`).
  - `packages/application` — casos de uso (use-cases) como funções puras.
  - `packages/contracts` — serialização (`SyncManifest`/`SyncPackage`).
  - `packages/data` — schema, migrações, export/import, backup.
  - `packages/sync` — `stamp.ts`, `merge.ts`, `engine.ts`, `provider.ts`, `pairing.ts`,
    `transport-bridge.ts`.
  - `packages/design-tokens` — tokens de design compartilhados.
  - `src/core/*` re-exporta esses pacotes (barrel de compatibilidade — regra do `AGENTS.md`
    do projeto é não duplicar lógica ali).
- **Persistência:** SQLite nativo (`useSqliteState`) + `localStorage`/`@capacitor/preferences`
  conforme plataforma, com `SCHEMA_VERSION` versionado e migrações consecutivas (na v11→12
  foi adicionado `workspaceId`). Export/import com validação Zod e restauração atômica.
- **Sync:** camada de dados já pronta — `SyncIndex`, stamps por registro, tombstones, merge
  LWW determinístico, preview de alterações. **Falta o transporte real**: `transport-bridge.ts`
  é um stub; `SyncScreen.tsx` existe na UI mas não fala com nenhum provider de verdade ainda.

## 3. O que já existe hoje na superfície desktop (não é greenfield)

Isto é o ponto mais importante para não retrabalhar: **a superfície desktop já está
amplamente implementada e testada** (confirmado por `desktop/context-desktop/REBUILD-DESKTOP-CAPABILITY-MAP.md`
e pelo relatório de varredura `desktop/spec/00-relatorio-varredura.md`, ambos datados de
2026-08/09, mais recentes que os documentos de visão "greenfield" da Manus AI).

| Área | Implementado (arquivo) | Observação |
|---|---|---|
| Shell | `src/shells/DesktopAppShell.tsx`, `apps/desktop/src/app/main.tsx` | Entrypoint próprio do desktop já existe |
| Sidebar | `src/desktop/components/DesktopSidebar.tsx` (285 linhas) | Real, usa `useDesktopApp()` |
| Topbar | `src/desktop/components/DesktopTopbar.tsx` | Breadcrumb, busca, avatar |
| Home | `src/desktop/screens/HomeScreen.tsx` | `quickStats`, `moduleShortcuts`, `workspaceBanner` — falta `recentItems` (G4) |
| Master-detail Faculdade | `CourseMasterList.tsx` + `CourseDetailPane.tsx` + `SplitLayout.tsx` | Completo |
| Context Inspector | `src/desktop/components/ContextInspector.tsx` | Colapsável, mostra item focado |
| Command Palette | `src/desktop/components/CommandPalette.tsx` | ⌘K, overlay 560px |
| Workspace Switcher | `src/desktop/components/WorkspaceSwitcher.tsx` | Persistido no `AppContext` |
| Calendário | `src/desktop/components/calendar/*` (13 arquivos) | **Completo**: semana com drag/resize/snap 30min, mês, agenda, dia, camadas faculdade/tcc/estudos/gcal |
| Knowledge Graph | `src/desktop/components/KnowledgeGraphScreen.tsx` | SVG real: nós = entidades, arestas = relações aceitas |
| Inbox | `src/desktop/components/InboxScreen.tsx` | Curadoria de sugestões |
| Projetos/TCC | `src/desktop/components/ProjectsScreen.tsx` | Criar projeto (limite 5 ativos), saídas por projeto |
| Sessão | `apps/desktop/src/session/types.ts` (`DesktopSessionState`) + `DesktopAppProvider` | Persistida via `usePersistentState` |
| Testes | `desktopShell.test.tsx`, `WorkspaceSwitcher.test.tsx`, `InboxScreen.test.tsx`, `desktopSession.test.tsx`, `desktop-mobile-isolation.test.ts` | **Gate: 500 testes verdes, lint limpo** (na data da auditoria) |

**Não existe ainda (greenfield real):** editor de documentos paginado (Documents & Blocks,
F5), Marketing Studio (F9, zero ocorrências no código), indexador de busca dedicado
(usa `GlobalSearchModal` genérico por ora), transporte de sync real (F10), engines
avançadas de contexto/aprendizagem (F11).

## 4. Estado de execução por fase (checklist real, não aspiracional)

`PLANO-IMPLEMENTACAO.md` reconcilia a visão da Manus AI com o código auditado em 2026-08.
Sequência: `F0 → F1 → F2 → F3 → F4 → F5(A) → F6(B,C) → F7(D) → F8(E,F) → F9(G) → F10(H,I) → F11 → F12`.

| Fase | O que entrega | Status |
|---|---|---|
| F0 — Proteção e contratos | Backup/restauração validados, testes de migração | ✅ concluída |
| F1 — Domain Core sem React | `packages/domain` tipos puros + invariantes (limite 5 projetos, matriz de capacidades) | ✅ concluída |
| F2 — Ports, Repositories & Use Cases | `packages/application`, `packages/contracts`, adapters | ✅ concluída |
| F3 — Workspaces + `workspaceId` + sessão | Migração 11→12 idempotente, `DesktopSessionState` | ✅ concluída |
| F4 — Shells próprios + capability matrix | `DesktopAppShell` separado, `CommandPalette`, matriz de capacidades | ✅ base existente (faltam `StatusBar` e `ContextInspector` completos) |
| F5 — Documents & Blocks | Editor básico, Workspace→Document→salvar→reabrir | ⬜ **pendente (greenfield)** |
| F6 — Busca local + Relations + Graph + Inbox | `KnowledgeGraphView`, `KnowledgeInbox`, `AssociationPolicy` | ✅ concluída (busca dedicada ainda não, usa índice genérico) |
| F7 — Calendário como domínio | Event/Responsibility/PlanningBlock separados, Google Calendar bidirecional | ⬜ **pendente como domínio** (a UI de calendário já existe e é rica, mas ainda sobre o modelo antigo de Task/Exam, não sobre as novas entidades temporais) |
| F8 — TCC & Projetos + editor + DOCX | Projeto/Saída completos, editor paginado, ABNT, export DOCX | 🟡 em andamento — Slice 1 (gestão de projeto/saída) feito; **falta o editor de blocos (depende de F5) + citações + DOCX** |
| F9 — Marketing Studio | `PositioningProfile` → `ContentBase` → `ChannelVariant` → `Publication` | ⬜ **pendente (greenfield, 0 ocorrências)** |
| F10 — Sync Protocol + Providers | `SyncPackage` versionado, `GitHubProvider`, `P2PProvider`, `BlobProvider`, criptografia | ⬜ pendente (transporte é stub) |
| F11 — Engines avançadas | Context Engine, `.cectx`, LearningState multidimensional | ⬜ pendente |
| F12 — Remoção do legado | `AppContext` vira apenas facade de sessão | ⬜ pendente |

## 5. Uma decisão recente que muda a leitura do roadmap

Em **2026-09-01** foi tomada uma decisão de escopo registrada em
`REBUILD-DESKTOP-CAPABILITY-MAP.md`: em vez de reescrever a arquitetura (que já está no
caminho certo — packages/domain, application, contracts, sessão, testes), o próximo ciclo
de trabalho é um **refino visual da superfície de apresentação já existente**:

> "vamos focar em reconstruir apenas o visual, sem quebrar o app inteiro em si."

Regra de ouro dessa fase: **nenhum arquivo de domínio, use-case ou estado é modificado.**
Cada tela redesenhada consome as mesmas props/hooks (`useDesktopApp()`, `useDesktopSession()`,
`useApp()`, `src/lib/schedule.ts`) — só muda JSX/estilo/composição visual.

Direção visual aprovada: **"refino do Notion-like atual"** — manter a estética
clean/calorosa-fluída já definida em `cecistudy-desktop-shell.json`, sem identidade nova,
sem serifa editorial, sem dark mode; o rosa de marca fica restrito a Home/feedback e nunca
vira fundo de painel.

Status de execução dessa reconstrução visual (por módulo, em `desktop/spec/`):

| Módulo | Spec | Status |
|---|---|---|
| `shell` (sidebar/topbar/statusbar/overlays) | `SPEC-VISUAL-01-shell.md` | ✅ implementado — aguarda revisão manual/aprovação |
| `navegacao` (transições entre telas) | idem, Task 8 | ✅ implementado junto do shell |
| `faculdade` (master-detail) | `SPEC-VISUAL-02-faculdade.md` | ✅ implementado — aguarda aprovação |
| `calendario` | — | pendente |
| `conhecimento` (grafo) | — | pendente |
| `marketing` | — | pendente (bloqueado por F9 não existir ainda) |
| `projetos` | — | pendente |
| `inbox` | — | pendente |

## 6. Gaps e riscos técnicos identificados na varredura de código

1. **Sidebar duplicada/obsoleta.** `src/components/DesktopSidebar.tsx` (103 linhas) é um
   stub legado ainda importado por `src/shells/MobileAppShell.tsx` como
   `ResponsiveDesktopSidebar`, renderizado em telas largas do preview web (`lg:`). Isso
   significa que **o preview web em tela larga mostra uma sidebar diferente e mais antiga**
   da que roda de fato no app Tauri — risco de confusão/design divergente.
2. **Contextos duplicados.** 4 contextos de React carregam o mesmo valor
   (`AppContext.tsx:2506–2514`), sinal de que a separação mobile/desktop de estado ainda
   não está limpa na raiz.
3. **`ScreenLayers` é o motor de navegação tanto do desktop quanto do mobile** — acoplamento
   que dificulta evoluir um sem afetar o outro; inclui `preloadScreenChunks()` puxando
   chunks desktop mesmo no bundle mobile (peso extra desnecessário no mobile).
4. **Ponte Tauri (`src/lib/desktop.ts`) vive em código compartilhado**, não isolada em
   `apps/desktop`.
5. **`apps/mobile` tem um `useMobileApp()` redundante** com o padrão de `useDesktopApp()`.
6. **Gate de CI (`check-boundaries.mjs`) não cobre ainda todos os gaps semânticos** acima —
   ou seja, é possível reintroduzir acoplamento sem o CI reclamar.
7. **Editor acadêmico/DOCX é o maior risco técnico do projeto inteiro** (reconhecido nos
   próprios docs de visão): não existe hoje nenhuma implementação, e é o componente mais
   complexo tecnicamente (paginação visual, round-trip DOCX com fidelidade, ABNT).
8. **Marketing Studio é 100% greenfield** — nenhuma entidade, nenhuma tela.
9. **Sync real (transporte) é o segundo maior risco**: toda a camada de merge/stamps/
   tombstones existe e é testada, mas não há um provider funcional (GitHub ou P2P) ligando
   dois dispositivos de verdade hoje.

## 7. Leitura consolidada

O desktop do cecistudy **não é um projeto do zero**. É um projeto de arquitetura limpa já
bem encaminhado (domínio, aplicação, contratos, sessão e boa parte da apresentação),
interrompido em pontos específicos e conhecidos (editor de documentos, calendário como
domínio próprio, marketing, sync real). O trabalho imediato aprovado é de **refino visual**
sobre essa base — não reescrita — seguido da conclusão das fases greenfield pendentes
(F5, F7 como domínio, F9, F10).
