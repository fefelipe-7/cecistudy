# 02 — Fronteiras e Contratos

> O que **deve** ser compartilhado (contrato estável) vs. o que **deve** ser separado
> (experiência, navegação, plataforma). Fronteira = o que um `import` pode ou não atravessar.

## 1. Mapa de dependências alvo

```
cecistudy/
├── apps/
│   ├── mobile/                         # cliente mobile (Capacitor)
│   │   ├── src/
│   │   │   ├── app/main.tsx            # entrypoint próprio
│   │   │   ├── navigation/             # NavScreen mobile, tabs, stack compacto
│   │   │   ├── screens/                # Home, Faculdade, Estudos, Biblioteca, Perfil
│   │   │   ├── components/             # BottomNav, FAB, sheets, quick capture
│   │   │   └── platform/               # Capacitor, haptics, notifications
│   │   ├── vite.config.ts
│   │   └── package.json                # build/test independentes
│   │
│   └── desktop/                        # cliente desktop (Tauri)
│       ├── src/
│       │   ├── app/main.tsx            # entrypoint próprio
│       │   ├── navigation/             # DesktopSessionState, workspace, panels
│       │   ├── screens/                # Workspace, Document, Graph, Projects, Calendar, Marketing
│       │   ├── components/             # Sidebar, Topbar, SplitLayout, CommandPalette
│       │   └── platform/               # Tauri bridge, window-state, updater
│       ├── vite.config.ts
│       ├── src-tauri/                  # hoje em desktop/src-tauri → migra para cá
│       └── package.json
│
├── packages/
│   ├── domain/                         # entidades + invariantes puras
│   ├── application/                    # casos de uso / comandos
│   ├── data/                           # schema, migrações, repositories, backup/restore
│   ├── sync/                           # SyncPackage, merge, conflitos, providers (interface)
│   ├── contracts/                      # DTOs, schemas versionados, compatibilidade
│   └── design-tokens/                  # tokens semânticos (cores, tipografia, radius)
│
├── package.json                        # workspace (npm workspaces) — orquestra, não renderiza UI
└── turbo.json                          # opcional — builds independentes
```

> **Transição gradual:** não é preciso virar monorepo no commit 1. A fronteira pode
> começar como `src/core/domain` + `src/core/application` + `apps/desktop|mobile`
> dentro do mesmo Vite, desde que **os imports sejam travados** (ver `04-guardrails`).
> O `package.json` raiz pode orquestrar `npm run dev:mobile` / `dev:desktop` até a
> extração completa.

## 2. O que é compartilhado (pacotes)

| Pacote | Deve conter | NÃO deve conter | Hoje em |
|---|---|---|---|
| `domain` | `Workspace`, `Document`, `Block`, `Relation`, `Suggestion`, `AssociationPolicy`, `CalendarEvent`, `Responsibility`, `PlanningBlock`, `Occurrence`, `ExecutionRecord`, `Project`, `Output`, `AcademicNode`, `Reference`, `Citation`, `PositioningProfile`, `ContentIdea`, `ContentBase`, `ChannelVariant`, `LearningState`, `ids.ts`, `capabilities.ts`, invariantes (ex.: 5 projetos ativos) | React, hooks, `NavScreen`, `DesktopSessionState`, Tailwind, `window`, Capacitor, Tauri | `src/core/domain/**` |
| `application` | Casos de uso: `createWorkspace`, `createDocument`, `createRelation`, `acceptSuggestion`, `planResponsibility`, `createProject`, `createOutput`, `exportDocx`, `startSync` — cada um valida, persiste via porta e emite evento | Componentes, modais, layout, `useApp()` | `src/core/application/use-cases/**` |
| `data` | Schema (`SCHEMA_VERSION`, `MIGRATIONS`), `repositories`, `backup/restore` (`exportImport.ts`, `persistentData.ts`), drivers (`storage.ts`, `useSqliteState`, `useStampedState`), `USER_COLLECTION_KEYS`, `SyncIndex` | `DesktopSessionState`, `MobileNavigationState`, `overlayKey`, cor de componente | `src/data/**`, `src/lib/db/**`, `src/lib/{storage,exportImport,persistentData}.ts` |
| `sync` | `SyncManifest`, `SyncPackage`, `merge`, tombstones, hashes, `inspectRemote`, `checkRevision`, `createPackage`, `preview`, providers (interfaces) | `SyncScreen.tsx`, QR UI, toasts | `src/lib/sync/**`, `src/core/serialization.ts`, `src/components/sync/**` (só interfaces ficam) |
| `contracts` | Schemas versionados (Zod), DTOs de sync, compat entre `schemaVersion`/`protocolVersion`/`appVersion` | Props de componente (`CourseCardProps`) | `src/lib/backupSchema.ts`, `src/core/serialization.ts` |
| `design-tokens` | `@theme` (`src/index.css`), cores semânticas (`ceci-*`, `surface-*`), tipografia, radius, sombras | `Sidebar` desktop, `BottomNav`, `Panel` concreto, `CourseDetailPane` | `src/index.css` |

Regra de ouro do compartilhado:

> Nenhum pacote compartilhado importa React de cliente, `src/shells/*`, `src/desktop/*`,
> `@capacitor/*` ou `window.__TAURI__`.

## 3. O que é separado (cada app dono do seu)

| Responsabilidade | Mobile (`apps/mobile`) | Desktop (`apps/desktop`) |
|---|---|---|
| Entrada | `apps/mobile/src/app/main.tsx` | `apps/desktop/src/app/main.tsx` |
| Navegação | Stack compacto, tabs, push/pop leve | Workspace, painéis, master-detail, documentos abertos, grafo |
| Provider | `MobileAppProvider` | `DesktopAppProvider` |
| Estado de sessão | `MobileSessionState` (tab, filtros, quick actions) | `DesktopSessionState` (`types.ts:597` → migra para `apps/desktop`) |
| Shell | `MobileShell` (`HeaderNav` + `BottomNav` + `SlideScreen`) | `DesktopShell` (`Sidebar` + `Topbar` + `SplitLayout` + `StatusBar`) |
| Busca | Busca compacta contextual | Command palette global (`⌘K` rico, filtros por workspace, Graph) |
| Criação | Wizards curtos, captura rápida | Compose, editor paginado, painéis, fluxos longos |
| Calendário | Agenda do dia, ações rápidas | Grade semanal, drag/resize, inspector persistente |
| TCC | Consulta, pendências, ações pontuais | Árvore, editor paginado, referências ABNT, versões, export DOCX |
| Notificações | Capacitor `local-notifications` | Timer JS (`src/lib/notifications.ts` branch desktop) / Tauri notification |
| Persistência | Driver Capacitor/SQLite (`userDb.ts` branch nativo) | Driver Tauri/store desktop (ou `localStorage` no preview) |
| Build | `apps/mobile` → web + `android`/`ios` (Capacitor) | `apps/desktop` → `src-tauri/target/bundle` (Tauri) |

O ponto mais sensível: **`DesktopSessionState` não deve permanecer em `src/types.ts`**.
Ele é estado visual do desktop (`openDocuments`, `activePanels`, `selectedGraphNodeId`,
`graphViewport`). O mesmo vale para `NavScreen` — cada cliente terá seu tipo de navegação;
o compartilhado guarda só `workspaceId` e IDs de entidade.

## 4. Dados: o que sincroniza vs. o que fica local

| Tipo de dado | Compartilhado? | Estratégia |
|---|---:|---|
| Projeto, Output, Document, Block, Reference, Citation | Sim | Mesmo modelo, schema, migrações e `SyncPackage` |
| Tarefa, Evento, Responsabilidade, ExecutionRecord | Sim | Mesmo domínio; cada cliente projeta diferente |
| Workspace, relações, `Suggestion`, `AssociationPolicy` | Sim | Mesmo domínio, escopo por `workspaceId` |
| Estado de sync (manifest, revision, tombstones, hashes) | Sim (parcial) | Compartilhado; estado visual da tela não |
| Navegação atual (`navigationStack`, `NavScreen`) | Não | Cada cliente tem a sua |
| Painéis abertos, viewport do grafo, `openDocuments` | Não | `DesktopSessionState` — só desktop, não sincroniza |
| Tab selecionada, filtros compactos, `targetId` | Não | `MobileSessionState` — só mobile |
| Preferências de aparência | Preferencialmente não | Tokens comuns, preferências locais |

A sincronização troca **dados de domínio + metadados de sync**. Nunca `navigationStack`
ou `overlayKey`.

## 5. Contratos existentes a preservar

- `SCHEMA_VERSION` (hoje 12) e `MIGRATIONS` (`src/data/schema.ts`) — bump só quando o **domínio** muda, não quando a UI muda.
- `emptyDatabase()` / `buildBackupData()` / `readDatabaseFromState()` (`src/lib/persistentData.ts`) — backup exclui catálogos estáticos (`approaches`, `questions`).
- `backupDataSchema` (Zod, `src/lib/backupSchema.ts`) — validação com `.passthrough()` para campos legados.
- `SyncIndex` (`src/lib/sync/stamp.ts`) — `stamps`/`records`/`tombstones`, merge LWW determinístico (`src/lib/sync/merge.ts`).
- `DEFAULT_WORKSPACE_ID = "ws-academico"` (`src/data/schema.ts`) — migração 11→12 idempotente.

Quebrar qualquer um desses contratos sem bump versionado quebra restore e sync.

## 6. Design tokens (fronteira visual)

Tokens (`src/index.css` `@theme`) são compartilhados; **componentes concretos não**.

- Compartilhado: `--color-ceci-*`, `--color-surface-*`, `--color-border-*`, `--font-*`, `--radius-*`, `--shadow-*`, classes `.journal-card`, `.paper-texture`.
- Separado: `DesktopSidebar` (sidebar branca + `bg-surface-rose` ativo), `Panel` (`desktop/components/ui/Panel`), `BottomNavBar`, `FAB`, `CourseMasterList`, `CourseDetailPane`.

Regra visual: `apps/desktop` pode usar `bg-surface-muted` + `Panel`; `apps/mobile` usa `journal-card` + `max-w-md`. Nenhum dos dois cria hex novo — só tokens.
