# 03 — Plano Incremental (10 Etapas)

> Como sair de "um bundle, um AppContext, um ScreenLayers" para "dois apps, um domínio"
> **sem quebrar o app em nenhuma etapa**. Cada etapa tem entrada, ação, saída e
> verificação (`npm run lint` + `npm run test` + `npm run build` verdes).

A ordem respeita `split-mobile.md:173` e `PLANO-IMPLEMENTACAO.md:203`, mas adaptada
ao código real. Nenhuma etapa apaga o app atual.

---

## Etapa 0 — Congelar e travar (sem mover código)

**Objetivo:** impedir que a separação piore antes de começar.

| | |
|---|---|
| **Entrada** | `AppContext` com novas features sendo adicionadas; `ScreenLayers` compartilhado |
| **Ação** | 1) Declarar `AppContext` como **facade em modo leitura** para features novas: novas regras de negócio **devem** nascer em `src/core/domain` ou `src/core/application/use-cases`, não em `AppContext.tsx`. 2) Adicionar teste/script de fronteira que falha se `apps/mobile` importar de `apps/desktop` e vice-versa (mesmo que as pastas ainda não existam, o teste já documenta a regra). 3) Congelar `SCHEMA_VERSION` até a Etapa 2. |
| **Saída** | `AGENTS.md` + `.context/backlog.md` atualizados com a regra; `vitest` com 1 teste de import proibido (ainda verde, pois não há violação). |
| **Verificação** | `npm run lint` + `test` + `build` verdes; `git diff` não mostra novas regras em `AppContext`. |
| **Risco se pular** | Editor/Grafo/TCC construídos dentro do monolito viram dívida irreversível. |

---

## Etapa 1 — Criar os pacotes compartilhados (só pastas + re-export)

**Objetivo:** dar endereço explícito ao que já é compartilhado, sem mover lógica.

| | |
|---|---|
| **Entrada** | `src/core/domain`, `src/core/application`, `src/lib/sync`, `src/data` espalhados |
| **Ação** | Criar `packages/domain`, `packages/application`, `packages/data`, `packages/sync`, `packages/contracts`, `packages/design-tokens` — inicialmente como **re-export** dos módulos existentes (`export * from '../../../src/core/domain'`). Nenhuma view muda. O `package.json` raiz vira `workspaces: ["packages/*"]` (npm workspaces, sem Turborepo ainda). |
| **Saída** | `packages/*` existem e compilam; `src/` continua sendo a fonte da verdade por 1–2 etapas. |
| **Verificação** | `tsc --noEmit` verde; `npm run build` ainda gera `dist/` único (sem mudança visual). |
| **Nota** | Se a equipe preferir não criar `packages/` físico neste momento, use `src/core/*` como "pacote lógico" e trave por `eslint` de fronteira — o efeito é o mesmo. |

---

## Etapa 2 — Mover domínio puro para `packages/domain`

**Objetivo:** o domínio deixar de conhecer React/Capacitor/Tauri.

| | |
|---|---|
| **Entrada** | `src/core/domain/**` já puro; `src/types.ts` ainda mistura domínio + UI |
| **Ação** | 1) Mover `src/core/domain/**` → `packages/domain/src/**`. 2) Extrair de `src/types.ts` apenas as entidades de domínio (`Workspace`, `Document`, `Block`, `Relation`, `Project`, etc.) para `packages/domain`. `NavScreen`, `DesktopSessionState`, `DynamicHeaderConfig`, `ManagedItem` **permanecem** em `src/types.ts` (serão quebrados na Etapa 8). 3) `packages/domain` compila sem `dom`, sem `react`, sem `@capacitor/*`, sem `__TAURI__`. |
| **Saída** | `packages/domain` é importável por `src/` e futuros `apps/*`; `src/types.ts` ainda existe mas já não é a única fonte de domínio. |
| **Verificação** | `npm run lint` verde; `vitest` de invariantes (`createProject` limite 5, `RelationKind` semântica→Inbox) verdes; `packages/domain` com `tsc --noEmit --skipLibCheck` sem erros. |
| **Rollback** | Re-export temporário (`src/core/domain/index.ts` → `packages/domain`) até estabilizar. |

---

## Etapa 3 — Mover dados para `packages/data`

**Objetivo:** um `DataClient` estável que os dois apps possam usar sem `useApp()`.

| | |
|---|---|
| **Entrada** | `src/data/schema.ts`, `src/lib/persistentData.ts`, `src/lib/exportImport.ts`, `src/lib/db/**`, `src/lib/storage.ts`, `usePersistentState`/`useSqliteState`/`useStampedState` em `AppContext` |
| **Ação** | 1) Mover schema, migrações, `buildBackupData`, `readDatabaseFromState`, `backupDataSchema`, `exportImport`, `USER_COLLECTION_KEYS` para `packages/data`. 2) Extrair `DataClient` (interface) com `repositories` + `backup/restore` + `sync adapter`. 3) `AppContext` vira **adapter fino** que chama `DataClient` (mantém `useApp()` para views legadas). Bump `SCHEMA_VERSION` 12→13 **só aqui**, quando `workspaceId` já estiver em todas as entidades sincronizáveis. |
| **Saída** | `packages/data` compila; `AppContext` continua servindo views, mas já não é dono do schema. |
| **Verificação** | `src/lib/__tests__/exportImport.test.ts` (round-trip, backup schema 6→13, payload inválido) verde; backup/restore manual validado; `npm run build` verde. |

---

## Etapa 4 — Mover sync para `packages/sync` + `packages/contracts`

**Objetivo:** protocolo independente das telas de pareamento.

| | |
|---|---|
| **Entrada** | `src/lib/sync/**`, `src/core/serialization.ts`, `SyncIndex` em `AppContext` |
| **Ação** | 1) Mover `stamp.ts`/`merge.ts`/`transport-bridge.ts`/`pairing.ts` → `packages/sync`. 2) `src/core/serialization.ts` (`SyncManifest`/`SyncPackage`) → `packages/contracts` (Zod, versionado). 3) `SyncScreen.tsx` permanece em `src/components/sync/` por enquanto — só a **interface** do provider migra. |
| **Saída** | Protocolo (`SyncPackage` com `schemaVersion`, `protocolVersion`, `revision`, `parentRevision`, `workspaceScope`, tombstones, hashes, `encryptionMetadata`) desacoplado da UI. |
| **Verificação** | Testes de merge (LWW, tombstone vs. vivo, revisão remota mais nova, conflito em campos distintos) verdes; `packages/sync` sem import de `react`/`capacitor`. |

---

## Etapa 5 — Criar `apps/mobile` (entrypoint próprio, sem mudar comportamento)

**Objetivo:** o mobile ganha build próprio.

| | |
|---|---|
| **Entrada** | `src/App.tsx` único; `MobileAppShell` em `src/shells/` |
| **Ação** | 1) Criar `apps/mobile/src/app/main.tsx` (novo entrypoint), `apps/mobile/vite.config.ts` (aponta para `packages/*`), `apps/mobile/package.json`. 2) Copiar `MobileAppShell`, `Mobile` `navigation/`, `screens/*`, `components/*` para `apps/mobile/src/` — inicialmente como **cópia** (não mover ainda). 3) `apps/mobile` importa `domain`/`data`/`sync` via `packages/*`, nunca via `apps/desktop`. |
| **Saída** | `npm run build --workspace=apps/mobile` gera `apps/mobile/dist`; `npm run build` na raiz ainda funciona (compat). Visual idêntico. |
| **Verificação** | `apps/mobile` abre em `npm run dev --workspace=apps/mobile` (Capacitor `cap sync` continua na raiz até migração completa); testes de `routing.ts` (`parseRoute`/`routeToStack`) verdes no workspace mobile. |

---

## Etapa 6 — Criar `apps/desktop` (entrypoint próprio, sem `ScreenLayers` compartilhado)

**Objetivo:** o desktop deixa de depender de `ScreenLayers`/`GlobalOverlays` universais.

| | |
|---|---|
| **Entrada** | `DesktopAppShell` em `src/shells/`; `ScreenLayers.tsx` compartilhado; `desktop/src-tauri` com `frontendDist: ../../dist` |
| **Ação** | 1) Criar `apps/desktop/src/app/main.tsx`, `vite.config.ts`, `package.json`. 2) Mover `src/desktop/**` (`Sidebar`, `Topbar`, `layouts/SplitLayout`, `ui/Panel`, `KnowledgeGraphScreen`, `ProjectsScreen`, `InboxScreen`) → `apps/desktop/src/`. 3) `apps/desktop` cria seu próprio `DesktopScreenLayers` (sem importar `SlideContent` mobile) e seu próprio `DesktopOverlays` (CommandPalette rico, `Panel`, `StatusBar`). 4) `apps/desktop/src-tauri/tauri.conf.json` passa a apontar para `apps/desktop/dist`. |
| **Saída** | Duplicação temporária de `ScreenLayers`/`GlobalOverlays` — proposital. Cada app edita o seu sem afetar o outro. |
| **Verificação** | `apps/desktop` abre via `cd apps/desktop && npm run dev` (com `devUrl` próprio) ou `?platform=desktop`; `hasTabBase`/`overlayKey` do desktop não afetam mobile. `npm run build` dos dois workspaces verdes. |

---

## Etapa 7 — Duplicar/adaptar busca, Quick Add, edição e toasts

**Objetivo:** remover a ponte acidental mais usada.

| | |
|---|---|
| **Entrada** | `GlobalOverlays.tsx` universal com `⌘K` |
| **Ação** | 1) `apps/mobile` mantém `QuickAddModal` + `GlobalSearchModal` compactos. 2) `apps/desktop` cria `CommandPalette` (evolução do `⌘K`), `DesktopQuickAdd` (compose + editor), toasts/status próprios. 3) Ambos consomem o mesmo `DataClient`/`use-cases`, mas com handlers de navegação distintos: `mobileNavigation.openProjectSummary(id)` vs `desktopWorkspace.openProjectWorkspace(id)` (ver `split-mobile.md:141`). |
| **Saída** | Nenhum overlay é compartilhado; `src/shells/GlobalOverlays.tsx` pode ser removido. |
| **Verificação** | Abrir `⌘K` no desktop não abre modal mobile; `QuickAdd` desktop não renderiza no mobile. Testes de `headerConfig` (`buildHeaderConfig`) verdes em ambos. |

---

## Etapa 8 — Quebrar `AppContext` em dois providers

**Objetivo:** o domínio é compartilhado; o estado de UI/navegação não.

| | |
|---|---|
| **Entrada** | `src/context/AppContext.tsx` ~1880 linhas |
| **Ação** | 1) Extrair três responsabilidades (ver `split-mobile.md:115`): `packages/data/DataClient` (repositories + sync adapter), `apps/mobile/MobileAppProvider` (`MobileNavigationState`, quick actions, projeções compactas), `apps/desktop/DesktopAppProvider` (`DesktopSessionState`, `openDocuments`, `activePanels`, `graphViewport`). 2) Cada provider usa o mesmo `DataClient`; nenhum importa o outro. 3) `src/context/AppContext.tsx` vira **facade de compatibilidade** por 1–2 releases (re-exporta `useApp()` legado) até as views migrarem. |
| **Saída** | `DesktopSessionState` sai de `src/types.ts` → `apps/desktop/src/session/types.ts`; `NavScreen` mobile → `apps/mobile/src/navigation/types.ts`. `src/types.ts` guarda só entidades de domínio canônicas. |
| **Verificação** | Views legadas ainda funcionam via facade; views novas usam `useMobileApp()` / `useDesktopApp()`; `vitest` de `quizStack.ts` e `headerConfig.ts` verdes em ambos. |

---

## Etapa 9 — Dois builds independentes, sem `isDesktop` no entrypoint

**Objetivo:** cada app já nasce sabendo qual experiência executa.

| | |
|---|---|
| **Entrada** | `src/App.tsx` ainda com `const Shell = isDesktop ? ...` |
| **Ação** | 1) `apps/mobile/src/app/main.tsx` renderiza `MobileAppShell` direto. 2) `apps/desktop/src/app/main.tsx` renderiza `DesktopAppShell` direto. 3) Remover `isDesktop` do entrypoint (mantém só em `platform.ts` para `?platform=desktop` preview). 4) `turbo.json` (opcional) com `build:mobile` / `build:desktop` independentes. |
| **Saída** | `npm run build --workspace=apps/mobile` não toca em `apps/desktop/dist` e vice-versa. `desktop/src-tauri` builda só `apps/desktop/dist`. |
| **Verificação** | Alterar `apps/desktop/src/components/DesktopSidebar.tsx` e rodar `npm run test --workspace=apps/mobile` — nenhum teste desktop roda; `git diff` de `apps/desktop` não invalida cache de `apps/mobile` no CI. |

---

## Etapa 10 — Remover gradualmente `src/shells/ScreenLayers.tsx` e o `AppContext` universal

**Objetivo:** apagar as pontes acidentais.

| | |
|---|---|
| **Entrada** | Facade `AppContext` ainda existe; `src/shells/` ainda existe |
| **Ação** | 1) Migrar cada view (`HomeView`, `FaculdadeView`, etc.) para consumir `useMobileApp()` ou `useDesktopApp()` + `DataClient` — uma view por PR. 2) Quando `ScreenLayers` não for mais importado por ninguém, removê-lo. 3) Quando a facade não for mais importada, remover `src/context/AppContext.tsx`. 4) `src/` passa a conter só `packages/*` + `apps/*` (ou é removido, se virar monorepo puro). |
| **Saída** | Não há import cruzado `apps/mobile ↔ apps/desktop`; `packages/*` compila sem `react`/`capacitor`/`tauri`. |
| **Verificação** | Script de verificação de imports (ver `04-guardrails`) falha o CI se encontrar `from 'apps/desktop'` em `apps/mobile`; `npm run lint` + `test` + `build` verdes nos três workspaces. |

---

## Ordem visual

```
Etapa 0 (congelar) ──► 1 (pastas) ──► 2 (domain) ──► 3 (data) ──► 4 (sync/contracts)
        │
        └─► 5 (apps/mobile entrypoint) ──► 6 (apps/desktop entrypoint)
                │
                └─► 7 (overlays próprios) ──► 8 (quebrar AppContext)
                        │
                        └─► 9 (builds independentes) ──► 10 (remover pontes)
```

> **Regra de ouro:** nenhuma etapa muda o visual do app. A 1ª mudança visual
> desktop (editor paginado, calendário semanal, Marketing Studio) só entra **depois**
> da Etapa 8, quando já há `DesktopAppProvider` e `DesktopSessionState` próprios.

## O que fazer com o TCC / Marketing / Calendário já planejados

- `Project`/`Output`/`AcademicNode`/`Document`/`Block`/`Reference` ficam em `packages/domain` (já em `src/core/domain`).
- Tela de produção acadêmica fica **exclusivamente** em `apps/desktop` (ver `split-mobile.md:191`).
- O mobile recebe depois uma **projeção de consulta** (`canView: true`, `canEdit: false`, `projection: compact` na `CapabilityMatrix`), sem importar o editor desktop.
