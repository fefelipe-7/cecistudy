# 07 — Estado de Execução

> Acompanhamento fase a fase da separação mobile/desktop.
> **Atualizado após Fase 0 + Fase 1 + Fase 2 + Fase 3 (Ação 1) + Fase 3 Ação 2/3 (DataClient) + Fase 4 + Fase 5 + Fase 6 + Fase 7 + Fase 8 + Fase 9 + Fase 10 (10.0–10.1 concluídos).**

## Última atualização

_ago 2026 — Fase 0 (congelar) + Fase 1 (packages/) + Fase 2 (domínio) + Fase 3 Ação 1 (data layer em packages/data) + **Fase 3 Ação 2/3 (DataClient canônico + wiring em AppContext + 9 testes)** + Fase 4 (sync → packages/sync + packages/contracts) + Fase 5 (`apps/mobile` entrypoint próprio) + Fase 6 (`apps/desktop` entrypoint próprio) + Fase 7 (overlays próprios) + Fase 8 (dois providers: facade + tipo DesktopSessionState) + **Fase 9 (entrypoint sem `isDesktop`; web mobile-first, desktop nativo)** implementadas. **Fase 10 (remover pontes `ScreenLayers`/`AppContext` universal) em progresso incremental (10.0–10.1 concluídos; 10.2–10.6 restantes):**
- **10.0 (preparo):** `npm install` ok; baseline gate — lint 0 · boundary ok · **480 testes** (foram 484 antes de remover código morto) · build raiz/mobile/desktop ok.
- **10.0.1 (código morto):** removidos `KnowledgeGraphView`, `ProjectsView`, `KnowledgeInbox`, `TagPill` (e seus testes) — eram duplicatas em modal das telas `*Screen`, importadas só pelos próprios testes.
- **10.0.2 (hooks):** criados `src/context/desktopApp.ts` (`useDesktopApp`) e `src/context/mobileApp.ts` (`useMobileApp`) como facades sobre `useApp()` (em `src`, para não puxar `apps/*` ao vitest).
- **10.1 (desktop surface):** `src/desktop/**` + `src/shells/DesktopAppShell` + `src/overlays/DesktopOverlays` migrados de `useApp` → `useDesktopApp` (0 ocorrências de `useApp` na superfície desktop). Gate verde (480 testes).
- **10.1 (mobile/shared) CONCLUÍDO:** todos os consumidores migrados para `useMobileApp`/`useDesktopApp` e gate verde (lint 0, boundary OK, 480 testes). Inclui `src/components/views/*` (19), `src/components/**` (wizards/courses/estudos/library/ui/widgets/sync + `InternshipLogCard`, 29 arquivos via script UTF‑8 explícito), `MobileAppShell`, `MobileOverlays`, `DesktopAppShell`, `DesktopOverlays` e `src/shells/ScreenLayers.tsx`. Não resta nenhum `useApp()` direto fora dos facades (`src/context/{mobileApp,desktopApp}.ts`) e dos providers (`apps/*/src/*AppProvider.tsx`). **Nota:** a migração em lote inicial de `views` via script PowerShell corrompeu os acentos de 9 arquivos (U+FFFD); corrigido restaurando esses 9 do backup `cecistudy.zip` e reaplicando com o Edit tool (regra de edição adicionada ao AGENTS.md — nunca usar `Get-Content`/`Set-Content` em lote)._
- **Estado real da arquitetura (diverge do plano original):** o "bridge" `ScreenLayers` já NÃO envolve o `AppProvider` — `src/App.tsx` (web) e o entrypoint desktop já usam `MobileAppProvider`/`DesktopAppProvider` (facades em `apps/*/src/*AppProvider.tsx` que hoje apenas repassam `<AppProvider>` universal). As views consomem `useMobileApp`/`useDesktopApp` (facades em `src/context/{mobileApp,desktopApp}.ts` que hoje retornam `useApp()`). Ou seja, a separação por facade está funcionalmente completa no nível dos consumidores.
- **10.5 (split estrutural) CONCLUÍDO:** criados 4 contextos distintos em `src/context/appContexts.ts` (`AppBaseContext`, `DataClientContext`, `MobileAppContext`, `DesktopAppContext`), todos fornecidos aninhados pelo `AppBaseProvider` (antigo `AppProvider` em `AppContext.tsx`, renomeado). `useMobileApp`/`useDesktopApp` (`src/context/{mobileApp,desktopApp}.ts`) agora leem `MobileAppContext`/`DesktopAppContext` (seus contextos de casca), e `useApp` (legacy, para os testes) lê `AppBaseContext`. `AppProvider`/`useApp` seguem exportados de `AppContext.tsx`, logo os testes continuam verdes (480). Boundary OK, lint 0.
- **10.5-b (extração de domínio) CONCLUÍDO:** o estado de dados (entidades/domínio) foi extraído para `useDataClient()` em `src/context/DataClientProvider.tsx`, consumido por `AppBaseProvider` via `const data = useDataClient(); const { ... } = data;`. Toda a declaração de `useState`/`useStampedState`/`usePersistentState` de coleções + seeds estáticos (abordagens/questões) + merge inicial de stickers agora vivem no `DataClient`. Os handlers de orquestração permanecem em `AppBaseProvider` (eles apenas consomem os setters — shape público do `value` não mudou). `ReminderSettings` re-exportado de `AppContext` a partir de `DataClientProvider`. `DataClientValue` tipa os setters como `Dispatch<SetStateAction<T>>` (igual a `useStampedState`/`usePersistentState`). Seeds de abordagens/questões usam agora guarda por `length > 0` em vez de `ref` (o `resetApp` só precisa de `setApproaches([])`/`setQuestions([])` para re-semear). Gate verde: lint 0, boundary OK, 480 testes, 3 builds ok._

---

## Fase 0 — Congelar e travar

| Item | Status | Observação |
|---|---|---|
| Regra "AppContext é facade" no AGENTS.md | ✅ | `AGENTS.md:20` adicionada |
| Script `.github/scripts/check-boundaries.mjs` | ✅ | Criado; cobre mobile↔desktop e packages/* → react/capacitor/tauri |
| Estado de execução `07-estado-execucao.md` | ✅ | Este arquivo |

---

## Fase 1 — Criar packages/ (re-export)

| Pacote | Status | Observação |
|---|---|---|
| `packages/domain` | ✅ | `src/core/domain/**` + `src/core/ports/**` movidos; stubs de compat em `src/core/domain/*.ts` e `src/core/ports/index.ts` |
| `packages/application` | ✅ | `src/core/application/use-cases` |
| `packages/data` | ✅ | Módulos puros de dados movidos (ver Fase 3) |
| `packages/contracts` | ✅ | `src/core/serialization` |
| `packages/sync` | ✅ | `src/lib/sync/stamp` + `merge` (+ `transport-bridge`, `pairing`, `SyncProvider`/`SyncEngine` em `ports/sync.ts`) |
| `packages/design-tokens` | ✅ | Barrel com tokens semânticos |
| `workspaces` no `package.json` raiz | ✅ | `"workspaces": ["packages/*"]` |

**Padrão de re-export (compat):** os stubs em `src/` usam caminho **relativo** para o pacote
(`export * from '../../../packages/data/src/schema'`), NÃO `@/packages/...`. O alias `"@/*": ["./src/*", "./*"]`
do tsconfig/Vite resolve `./src/*` primeiro e NÃO faz fallback para `./packages/*` no build, então
`@/packages/data/...` quebra o Vite. O padrão relativo espelha o usado em `packages/domain`.

---

## Fase 2 — Mover domínio puro para `packages/domain`

| Item | Status | Observação |
|---|---|---|
| Entidades de domínio em `packages/domain/src/core/domain/` | ✅ | Canônico em `packages/`; `src/core/domain/*.ts` são stubs `export *` |
| `RelationKind`, `Workspace`, `Document`, etc. | ✅ | Em `packages/domain` |
| `ports/sync.ts` | ✅ | Importa `SyncManifest`/`SyncPackage` de `@/core/serialization` (alias existente) |
| Scan de imports de `src/` → `src/core/domain`/`src/core/ports` | ✅ | Nenhum arquivo em `src/` importa diretamente desses paths (só os stubs re-exportam) |

---

## Fase 3 — Mover dados para `packages/data`

### Ação 1 — módulos puros movidos (✅ concluída)

| Arquivo (canônico em `packages/data/src`) | Origem | Observação |
|---|---|---|
| `schema.ts` | `src/data/schema.ts` | `SCHEMA_VERSION`, `MIGRATIONS`, `DEFAULT_WORKSPACE_ID`, etc. Importa `parseLegacySchedule` de `@/lib/schedule` (resolve `./src/lib/schedule`) |
| `backupSchema.ts` | `src/lib/backupSchema.ts` | Validação Zod do backup |
| `persistentData.ts` | `src/lib/persistentData.ts` | `PersistedDatabase`, `readDatabaseFromState`, `buildBackupData`, `resetDatabase` |
| `exportImport.ts` (lógica pura) | `src/lib/exportImport.ts` | `buildBackupPayload`, `previewBackup`, `importAppDatabase`. **Capacitor extraído** |
| `exportFile.ts` (NOVO, em `src/lib`) | — | `exportAppDatabase` (nativo via `@capacitor/filesystem`/`@capacitor/share` + web blob). Importa constantes de `packages/data` |

**Stubs de compatibilidade em `src/`** (re-export relativo → pacote):
- `src/data/schema.ts` → `export * from '../../packages/data/src/schema'`
- `src/lib/backupSchema.ts` → `export * from '../../packages/data/src/backupSchema'`
- `src/lib/persistentData.ts` → `export * from '../../packages/data/src/persistentData'`
- `src/lib/exportImport.ts` → `export * from '../../packages/data/src/exportImport'` + `export { exportAppDatabase } from './exportFile'`

**Boundary check:** `check-boundaries.mjs` agora cobre `packages/data`, `packages/application`,
`packages/contracts`, `packages/design-tokens` (proíbe react/capacitor/tauri). `packages/data` é limpo
(já que o Capacitor vive em `src/lib/exportFile.ts`).

 ### Ação 2 / Ação 3 — DataClient + AppContext adapter (✅ DataClient concluído; adapter incremental em Fase 10)
 
 | Item | Status | Bloqueio |
 |---|---|---|
 | Extrair `DataClient` (repositories + backup/restore + sync adapter) | ✅ | — |
 | `AppContext` usa `DataClient` para backup/restore/fan-out (`applyDatabaseToSetters`, `snapshotFromState`) | ✅ | — |
 | `dataClient` exposto via `useApp().dataClient` (repositórios + serviços) | ✅ | — |
 | Bump `SCHEMA_VERSION` 12→13 (quando `workspaceId` em todas as entidades sincronizáveis) | ⏳ | aguarda workspaceId completo |
 
 > **Decisão:** Ação 1 foi feita de forma reversível (stubs re-exportam). O `DataClient` foi
 > extraído para `packages/data/src/dataClient.ts` (canônico, sem `react`/Capacitor/Tauri) e
 > consumido via stub `src/lib/dataClient.ts`. `AppContext` mantém o `useApp()` como facade; a
 > migração das views/handlers para usá-lo diretamente é a Fase 10 (incremental).
 > 
 > **Detalhe do `DataClient`:** `repositories` (CRUD puro por coleção array), `applyDatabaseToSetters`
 > (fan-out banco→setters, com `transformStickers` injetado p/ manter `packages/data` livre de `src`),
 > `snapshotFromState` (normaliza `readingProgress`/`syncIndex`), re-export de `buildBackupPayload`/
 > `importAppDatabase`/`resetDatabase`/`STATIC_BANKS` e `createSyncAdapter` (DI p/ evitar ciclo
 > `packages/data → packages/sync`). 9 testes em `src/lib/__tests__/dataClient.test.ts`.

---

## Ajustes de gate (correções pré-existentes desbloqueadas na Fase 3)

Durante a Fase 3, o lint/test revelaram falhas pré-existentes da feature "comparacoes" (incompleta),
independentes da separação. Corrigidas para manter o gate verde:

- `src/lib/headerConfig.ts`: `TEMPLE_SECTION_META` ganhou a chave `comparacoes` (icon `HeartHandshake`, cor `#8C7338`, `Icon: GitCompare`).
- `src/context/AppContext.tsx`: `value` do provider passou a incluir `focusedComparisonSlug`, `openComparison`, `closeComparison`.
- `src/lib/__tests__/routing.test.ts`: `#/biblioteca/templo/comparacoes` agora casa `templeSection: 'comparacoes'` (antes esperava `temple: true`).

---

## Fase 4 — Mover sync para `packages/sync` + `packages/contracts` (✅ concluída)

| Item | Status | Observação |
|---|---|---|
| `stamp.ts`, `merge.ts`, `pairing.ts`, `transport-bridge.ts` | ✅ | Canônico em `packages/sync/src/`. `src/lib/sync/{stamp,merge,pairing,transport-bridge}.ts` viraram stubs `export *` relativos → `packages/sync/src/*`. `scanQr.ts` permanece em `src/lib/sync` (usa câmera/Capacitor — fora do pacote). |
| `serialization.ts` (`SyncManifest`/`SyncPackage`/`MergeResult`) | ✅ | Canônico em `packages/contracts/src/serialization.ts`; `src/core/serialization.ts` é stub `export *` → `packages/contracts/src/serialization`. |
| `packages/contracts/src/index.ts` | ✅ | Re-exporta `./serialization` + `../../../packages/data/src/backupSchema` (canônico em `packages/data`; antes apontava para stubs em `src/`). |
| `packages/sync/src/index.ts` | ✅ | Inverte o padrão anterior (que re-exportava de `src/lib/sync`); agora re-exporta os arquivos locais canônicos. |
| Boundary check | ✅ | `packages/sync`/`packages/contracts` sem `react`/`@capacitor`/`__TAURI__`; `check-boundaries.mjs` verde. |

**Padrão de re-export (compat):** stubs em `src/` usam caminho **relativo**
(`export * from '../../../packages/sync/src/stamp'`), nunca `@/packages/...` — o alias `@/*`
resolve `./src/*` primeiro e não faz fallback para `./packages/*` no build do Vite (quebra silencioso).
Os arquivos canônicos em `packages/*` importam tipos de `src` via alias `@/` (ex.:
`import type { SyncIndex } from '@/types'`), consistente com `packages/domain` (`@/core/serialization`).
Testes de merge/LWW/tombstone (`src/lib/sync/__tests__`) continuam em `src/` e resolvem via stub.

> **Decisão:** `merge.ts` depende de `emptyDatabase` (`src/data/empty`), que ainda vive em `src/`
> (Fase 3 Ação 2/3 — `DataClient` — pendente). Por isso `packages/sync/src/merge.ts` importa
> `@/data/empty` (acoplamento `packages → src` temporário, permitido pelo boundary check). Quando
> o `DataClient` mover `emptyDatabase` para `packages/data`, esse import vira `@/packages/data`.

## Fase 5 — `apps/mobile` entrypoint próprio (✅ concluída)

| Item | Status | Observação |
|---|---|---|
| `apps/mobile/package.json` + `apps/mobile/vite.config.ts` + `apps/mobile/index.html` + `apps/mobile/src/app/main.tsx` | ✅ | Workspace próprio. `main.tsx` renderiza `MobileAppShell` direto (sem branch `isDesktop` do `src/App.tsx`). |
| `root package.json` `workspaces` | ✅ | Adicionado `"apps/*"` (além de `"packages/*"`). `npm install` relinka o workspace. |
| Reuso de código compartilhado | ✅ | `apps/mobile/vite.config.ts` aponta alias `@` → raiz `src` e `publicDir` → raiz `public`; o shell e os components/views ainda vivem em `src/` (migração para `apps/mobile/src` fica para Fases 8–10). `packages/*` consumidos via `@/`. |
| Boundary check | ✅ | `apps/mobile` não importa a casca desktop nem `src/desktop`/`DesktopAppShell` (verificado; o comentário do vite.config evita os tokens literais proibidos). |
| Builds independentes | ✅ | `npm run build --workspace=apps/mobile` → `apps/mobile/dist`; `npm run build` (raiz) segue gerando `dist/` próprio. `routing.test.ts` (parseRoute/routeToStack) verde. |

> **Nota:** o bundle mobile ainda inclui `DesktopSidebar` (importado por `MobileAppShell`
> para o breakpoint `≥lg` — quirje conhecido, severidade 🟡 no diagnóstico). Isso não viola
> o boundary check (o import está em `src/shells`, fora do diretório `apps/mobile`) e será
> eliminado nas Fases 8–10 quando cada app tiver seus próprios overlays/shell.

## Fase 6 — `apps/desktop` entrypoint próprio (✅ concluída)

| Item | Status | Observação |
|---|---|---|
| `apps/desktop/package.json` + `apps/desktop/vite.config.ts` + `apps/desktop/index.html` + `apps/desktop/src/app/main.tsx` | ✅ | Workspace próprio. `main.tsx` renderiza `DesktopAppShell` direto (sem branch `isDesktop` do `src/App.tsx`). |
| `desktop/src-tauri/tauri.conf.json` | ✅ | `frontendDist` de `../../dist` → `../../apps/desktop/dist`. |
| Reuso de código compartilhado | ✅ | `apps/desktop/vite.config.ts` aponta alias `@` → raiz `src` e `publicDir` → raiz `public`; o shell e os components/views ainda vivem em `src/` (migração de `src/desktop/**` para `apps/desktop/src` e a criação do `DesktopScreenLayers`/`DesktopOverlays` próprios ficam para Fases 7–8). `packages/*` consumidos via `@/`. |
| Boundary check | ✅ | `apps/desktop` não importa a casca mobile nem seus módulos dedicados (verificado; o comentário do vite.config evita os tokens literais proibidos). |
| Builds independentes | ✅ | `npm run build --workspace=apps/desktop` → `apps/desktop/dist`; `npm run build` (raiz) e `apps/mobile` seguem independentes. Testes de `src/desktop/components/__tests__` verdes. |

> **Nota:** assim como no mobile, o bundle desktop ainda compartilha `ScreenLayers`/
> `GlobalOverlays` universais (importados por `DesktopAppShell`). Isso não viola o
> boundary check (os imports ficam em `src/shells`, fora do diretório `apps/desktop`) e
> será eliminado na Fase 7 (overlays próprios) / Fase 8 (quebrar o `AppContext`).

## Fase 7 — Overlays próprios ⌘K/QuickAdd/toasts (✅ concluída)

| Item | Status | Observação |
|---|---|---|
| Remover `src/shells/GlobalOverlays.tsx` (overlay compartilhado) | ✅ | Deletado; casca universal não renderiza mais overlay. |
| Overlay próprio por app | ✅ | `src/overlays/MobileOverlays.tsx` e `src/overlays/DesktopOverlays.tsx` (cópia do antigo `GlobalOverlays`, imports reescritos para alias `@/`). DesktopOverlays leva comentário de evolução futura (⌘K → `CommandPalette`); mobile mantém QuickAdd compacto + busca. |
| Composição no entrypoint de cada app | ✅ | `apps/mobile/src/app/main.tsx` e `apps/desktop/src/app/main.tsx` renderizam `<MobileOverlays/>`/`<DesktopOverlays/>` como irmãos do shell, dentro do `AppProvider`. `src/App.tsx` (web) renderiza o overlay conforme `isDesktop`. |
| Shells (`src/shells/*AppShell`) | ✅ | Não importam mais `apps/*`; casca fica livre de overlay. |

> **Desvio deliberado (justificado) vs. plano original:** o plano previa os overlays em
> `apps/mobile/src/overlays/` e `apps/desktop/src/overlays/`. Na prática, importar módulos de
> `apps/*` a partir de `src/` (shells ou `src/App.tsx`) quebra o grafo de módulos do **vitest**
> (o workspace `apps/*` faz o `AppContext`/react resolverem como segunda instância → os testes
> de DesktopAppShell perdem o contexto e o conteúdo dinâmico não aparece: InboxScreen,
> KnowledgeGraphView, ProjectsView). `resolve.dedupe` no vitest não resolveu. **Decisão:** os
> overlays ficam em `src/overlays/` (importados por `@/` por todos os 3 entrypoints). A separação
> mobile×desktop é preservada (um arquivo por app, sem overlay compartilhado) e o boundary check
> continua verde. Migrar para `apps/*/src/overlays/` fica como melhoria futura quando o vitest
> tratar workspaces de forma isolada (ou quando os apps deixarem de importar `src/` diretamente).

> **Nota sobre testes:** suite completa 475/475 verde. A correção acima foi validada comparando
> (a) overlays em `apps/*` → 3 testes de desktop quebrados por contexto duplo; (b) overlays em
> `src/overlays/` → 475/475. `desktopShell.test.tsx` e os testes de Inbox/KnowledgeGraph/ProjectsView
> não dependem do overlay (só da casca + provider), então remover o overlay da casca não os afeta.

## Fase 8 — Quebrar `AppContext` em dois providers (✅ facade + tipo; DataClient pendente)

**Escopo entregue nesta fase:** a estrutura de dois providers foi estabelecida como
**facade fino** sobre o `AppProvider` universal legado, sem quebrar nenhuma view. A
extração completa do `DataClient` (Fase 3 Ação 2/3) permanece pendente e é pré-requisito
para os providers deixarem de delegar em `useApp()`.

| Item | Status | Observação |
|---|---|---|
| `apps/mobile/src/MobileAppProvider.tsx` | ✅ | `MobileAppProvider` (wrap de `AppProvider`) + `useMobileApp()` (delega em `useApp()` por enquanto). |
| `apps/desktop/src/DesktopAppProvider.tsx` | ✅ | `DesktopAppProvider` + `useDesktopApp()` (mesmo padrão). |
| Composição nos entrypoints | ✅ | `apps/mobile/src/app/main.tsx` e `apps/desktop/src/app/main.tsx` envolvem com seus providers; `src/App.tsx` (web) escolhe por `isDesktop`. |
| `DesktopSessionState` sai de `src/types.ts` | ✅ | Canônico em `apps/desktop/src/session/types.ts`; `src/context/AppContext.tsx` importa como `import type` (apagado em runtime → sem risco de segunda instância no vitest). |
| `AppContext` como facade de compatibilidade | ✅ | Continua servindo `useApp()`; views legadas e overlays não mudaram. `useMobileApp`/`useDesktopApp` são a porta de entrada para migração futura. |

> **Pendente (rastreado em Fase 3 Ação 2/3):** extrair `DataClient`
> (repositories + sync adapter) e mover o estado de UI/navegação específico para
> dentro de cada provider (mobile: `MobileNavigationState`/quick actions; desktop:
> `DesktopSessionState`/`openDocuments`/`activePanels`/`graphViewport`). Até lá, ambos
> os providers usam o `AppProvider` por baixo. `NavScreen` mobile (sair de `src/types.ts`
> → `apps/mobile/src/navigation/types.ts`) fica para quando as views migrarem.

> **Guardrail:** `no-restricted-imports` por app (citado no plano) não foi aplicado porque
> o lint do projeto é `tsc --noEmit` (sem ESLint). O `check-boundaries.mjs` já impede
> `apps/mobile ↔ apps/desktop`; a regra "cada provider não importa o outro" vale por
> convenção (ambos só importam `src/` e `packages/*`).

## Fase 9 — Builds independentes, sem `isDesktop` no entrypoint (✅ concluída)

| Item | Status | Observação |
|---|---|---|
| `apps/mobile/src/app/main.tsx` | ✅ | Já renderiza `MobileAppShell` direto (sem branch `isDesktop`) — da Fase 5. |
| `apps/desktop/src/app/main.tsx` | ✅ | Já renderiza `DesktopAppShell` direto (sem branch `isDesktop`) — da Fase 6. |
| `src/App.tsx` (entrypoint web) | ✅ | Deixou de branchar em `isDesktop`: virou mobile-first (`MobileAppProvider` + `MobileAppShell` + `MobileOverlays`). O preview `?platform=desktop` na web foi substituído pelo bundle nativo `apps/desktop` (alvo desktop real). |
| `isDesktop` em `platform.ts` | ✅ | Mantido para UI pontual (PerfilView `DesktopUpdateSection`, `ScreenLayers`, `EdgeSwipeBack`, `MobileAppShell` web-only, `notifications`, `desktop.ts`). Não é mais usado no entrypoint. |
| Builds independentes | ✅ | `npm run build --workspace=apps/mobile` e `--workspace=apps/desktop` geram `apps/*/dist` isolados; `desktop/src-tauri` aponta `frontendDist: ../../apps/desktop/dist` (Fase 6). `check-boundaries.mjs` já isola `apps/mobile ↔ apps/desktop`. |
| Testes isolados | ✅ | `npm run test --workspace=apps/mobile` não roda testes de `apps/desktop` (e vice-versa); os testes de desktop ficam em `src/desktop/components/__tests__`, cobertos pela suíte raiz. |

> **Decisão:** o `?platform=desktop` deixou de trocar a casca na web porque a casca desktop
> agora tem bundle nativo próprio (`apps/desktop`). Isso atende o objetivo da Fase 9 ("cada app
> já nasce sabendo qual experiência executa") — o web segue mobile-first e o desktop é entregue
> nativamente. `turbo.json` opcional não foi criado (npm workspaces já dão build independente).

## Fases pendentes

| Fase | Status | Bloqueio |
|---|---|---|
 | Fase 7 — Overlays próprios (⌘K, QuickAdd, toasts) | ✅ concluída | — |
 | Fase 8 — Quebrar AppContext em dois providers (facade) | ✅ concluída | — |
 | Fase 9 — Builds independentes, sem `isDesktop` no entrypoint | ✅ concluída | — |
  | Fase 10 — Remover pontes (`ScreenLayers`, `AppContext` universal) | 🔄 em progresso (10.0–10.1 concluídos, incl. 10.1 mobile/shared; restam 10.2–10.6) | — |

---

## Arquivos criados/modificados até agora

**Novos (packages/):**
- `packages/data/{package.json,src/index.ts,src/schema.ts,src/backupSchema.ts,src/persistentData.ts,src/exportImport.ts}`
- `packages/domain`, `packages/application`, `packages/contracts`, `packages/sync`, `packages/design-tokens` (de Fase 1)

**Novos (src/):**
- `src/lib/exportFile.ts` (adapter de plataforma de exportação — isola Capacitor)

**Modificados (stubs de compat / correções de gate):**
- `src/data/schema.ts`, `src/lib/backupSchema.ts`, `src/lib/persistentData.ts`, `src/lib/exportImport.ts` (agora re-export relativo → `packages/data`)
- `src/lib/headerConfig.ts` (chave `comparacoes` em `TEMPLE_SECTION_META`)
- `src/context/AppContext.tsx` (`value` inclui `focusedComparisonSlug`/`openComparison`/`closeComparison`)
- `src/lib/__tests__/routing.test.ts` (espera `templeSection: 'comparacoes'`)
- `package.json` (workspaces), `AGENTS.md` (regra de separação), `.github/scripts/check-boundaries.mjs` (cobrir packages/*)

**Fase 4 (sync → packages/):**
- `packages/sync/src/{stamp,merge,pairing,transport-bridge}.ts` (canônico; antes em `src/lib/sync`)
- `packages/contracts/src/serialization.ts` (canônico; antes em `src/core/serialization`)
- `src/lib/sync/{stamp,merge,pairing,transport-bridge}.ts` e `src/core/serialization.ts` → stubs `export *` relativos → `packages/*`
- `packages/sync/src/index.ts` e `packages/contracts/src/index.ts` → re-exportam os arquivos canônicos locais (`backupSchema` aponta para `packages/data`)

**Fase 5 (apps/mobile entrypoint):**
- `apps/mobile/package.json`, `apps/mobile/vite.config.ts`, `apps/mobile/index.html`, `apps/mobile/src/app/main.tsx` (workspace próprio; renderiza `MobileAppShell` direto)
- `package.json` raiz: `workspaces` inclui `"apps/*"` (além de `"packages/*"`)

**Fase 6 (apps/desktop entrypoint):**
- `apps/desktop/package.json`, `apps/desktop/vite.config.ts`, `apps/desktop/index.html`, `apps/desktop/src/app/main.tsx` (workspace próprio; renderiza `DesktopAppShell` direto)
- `desktop/src-tauri/tauri.conf.json`: `frontendDist` → `../../apps/desktop/dist`

---

## Fase 10 — Remover pontes (`ScreenLayers`, `AppContext` universal) — plano incremental

**Objetivo:** após `apps/*` terem entrypoints + providers + overlays próprios e `DataClient`
canônico, eliminar os artefatos "universais" que ainda casam mobile+desktop num só grafo:

1. `src/shells/ScreenLayers.tsx` — envelope de transição que hoje envolve ambas as shells.
2. `src/context/AppContext.tsx` (facade `useApp()`) — importado por views de ambos os apps.

**Estratégia (um PR/parte por vez, gate verde a cada passo):**

- **10.1 — Migrar views para `useMobileApp`/`useDesktopApp` + `dataClient` (uma view por PR).**
  Começar pelas views leaf (ex.: `NotesScreen`, `BookDetailModal`) e subir. Cada view deixa de
  importar `useApp` e passa a consumir o hook do seu app; handlers de dados usam
  `app.dataClient.repositories.*` (CRUD puro) em vez de setters crus. Mantém `useApp` como
  fallback até a última view migrar.
- **10.2 — Mover estado de sessão desktop para `apps/desktop` (já iniciado: `DesktopSessionState`
  canônico em `apps/desktop/src/session/types.ts`).** Completar: `StudyFocusScreen`/timer e
  `window` focus/blur vivem só no desktop; tirar do `AppContext` universal.
- **10.3 — Mover overlays de `src/overlays/*` para `apps/*/src/overlays/*`** (quando as views
  deixarem de importar `src` de forma compartilhada — requisito do dual-context do vitest).
- **10.4 — Quando nenhuma view importar `ScreenLayers`, remover `src/shells/ScreenLayers.tsx`.**
- **10.5 — Quando nenhuma view importar `AppContext` (`useApp`), remover `src/context/AppContext.tsx`.**
  `src/App.tsx` (web) passa a ser só o shell mobile; `apps/desktop/src/app/main.tsx` já usa o
  `DesktopAppShell` direto.
- **10.6 — Limpeza:** deletar stubs de compat que só existiam para o app web antigo
  (`src/lib/exportImport.ts`, `src/lib/persistentData.ts`, `src/data/empty.ts` → consolidar em
  `packages/data`), ajustar `tsconfig`/`check-boundaries` se necessário.

**Gate por parte:** `npm run lint` · `node .github/scripts/check-boundaries.mjs` · `npm run build`
(raiz) · `npm run build --workspace=apps/mobile` · `npm run build --workspace=apps/desktop` ·
`npm run test`. Cada parte deve manter os **484 testes** verdes.

**Risco conhecido:** o dual-context do vitest quebra se módulos de `apps/*` forem importados a
partir de `src` (segunda instância de `AppContext`). Por isso os overlays ficam em `src/overlays`
até 10.3, e imports `type-only` de `apps/*` em `src` são seguros (apagados em runtime).
