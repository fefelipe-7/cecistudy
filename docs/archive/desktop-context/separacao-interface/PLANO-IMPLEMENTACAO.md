# Plano de Implementação Completo — Separação de Interface (mobile / desktop)

> Documento único e consolidado da separação de interface do **cecistudy ♡**.
> Reúne o estado atual (Fases 0–9 + `DataClient`), as regras de boundary, e o plano
> incremental da **Fase 10** (remover as pontes `ScreenLayers` e o `AppContext` universal),
> com critérios de aceitação e riscos.
>
> Convenções: pt-BR, minúsculas (exceto siglas/nomes). Tokens semânticos em `src/index.css`.
> Workspace = npm workspaces (`packages/*` + `apps/*`).

---

## 1. Objetivo

Transformar o app de "um único bundle mobile/desktop com `AppContext` universal" em **dois
clientes independentes** (`apps/mobile`, `apps/desktop`) que consomem camadas canônicas em
`packages/*`, sem compartilhar estado de tela nem um facade de contexto único.

- `apps/mobile` — web/PWA + Capacitor (touch-first, `MobileAppShell` + `MobileAppProvider`).
- `apps/desktop` — Tauri 2 (sidebar/layout largo, `DesktopAppShell` + `DesktopAppProvider`).
- `packages/*` — domínio, application, data, sync, contracts, design-tokens (puro, sem `react`/Capacitor/Tauri).
- `src/` — temporariamente casing de compatibilidade; vira só "pontes para `packages/*` + `apps/*`" e, ao fim da Fase 10, é removido.

---

## 2. Regras de boundary (não negociáveis)

1. `packages/*` **nunca** importa `react`, `@capacitor/*` nem `__TAURI__`.
   - Verificado por `.github/scripts/check-boundaries.mjs` (scan ingênuo de substring — cuidado com
     essas strings em comentários).
2. `src/core/*` e `src/data/*` são **stubs de compatibilidade** que re-exportam de `packages/*`
   via **caminho relativo** (`export * from '../../packages/data/src/...'`). Nunca usar
   `@/packages/...` (o alias `@/*` resolve `./src/*` primeiro e quebra o build Vite).
3. `apps/*` têm `vite.config` com alias `@` → `../../src` (e `publicDir`/`outDir` próprios).
4. Importar módulos de `apps/*` a partir de `src` (em grafo carregado por teste) **quebra o
   dual-context do vitest** (segunda instância de `AppContext`). Imports `type-only` de `apps/*`
   em `src` são seguros (apagados em runtime).
5. Gate por parte: `npm run lint` (tsc) · `node .github/scripts/check-boundaries.mjs` ·
   `npm run build` (raiz) · `npm run build --workspace=apps/mobile` ·
   `npm run build --workspace=apps/desktop` · `npm run test` (484 testes hoje).

---

## 3. Estado atual — o que já está feito

| Fase | Status | Resumo |
|---|---|---|
| 0 — Congelar | ✅ | Imutabilidade e seeds zerados preservados. |
| 1 — `packages/` | ✅ | `packages/domain`, `application`, `data`, `sync`, `contracts`, `design-tokens` criados; stubs re-exportam. |
| 2 — Domínio puro | ✅ | Lógica pura de domínio em `packages/domain`. |
| 3 Ação 1 — data layer | ✅ | `schema`, `backupSchema`, `persistentData`, `exportImport` canônicos em `packages/data`. |
| **3 Ação 2/3 — `DataClient`** | ✅ | **Ver seção 4.** |
| 4 — Sync/Contracts | ✅ | `stamp/merge/pairing/transport-bridge` → `packages/sync`; `serialization` → `packages/contracts`. |
| 5 — `apps/mobile` | ✅ | Entrypoint próprio (`apps/mobile/src/app/main.tsx` → `MobileAppShell`). |
| 6 — `apps/desktop` | ✅ | Entrypoint próprio (`apps/desktop/src/app/main.tsx` → `DesktopAppShell`); `tauri.conf.json` aponta `frontendDist` → `../../apps/desktop/dist`. |
| 7 — Overlays | ✅ | `src/overlays/MobileOverlays.tsx` + `src/overlays/DesktopOverlays.tsx` (em `src`, não em `apps/*`, p/ respeitar o dual-context do vitest). |
| 8 — Dois providers | ✅ | `MobileAppProvider`/`useMobileApp` e `DesktopAppProvider`/`useDesktopApp` criados como facades sobre `AppProvider`; `DesktopSessionState` canônico em `apps/desktop/src/session/types.ts`. |
| 9 — Entrypoint sem `isDesktop` | ✅ | `src/App.tsx` é mobile-first (sem branch `isDesktop`); `apps/*` já renderizam shells direto. `isDesktop` mantido em `src/lib/platform.ts` para UI in-app. |

**Gate atual:** lint 0 · boundary ok · 480 testes (eram 484 antes de remover código morto) · 3 builds ok. **Fase 10 iniciada:** criados `src/context/{desktopApp,mobileApp}.ts` (facades); superfície desktop (`src/desktop/**`, `DesktopAppShell`, `DesktopOverlays`) migrada para `useDesktopApp`. Falta migrar a camada mobile/shared para `useMobileApp` e, por fim, remover `ScreenLayers`/`AppContext` universal (10.4/10.5).

> Pendente de schema: bump `SCHEMA_VERSION` 12→13 quando `workspaceId` estiver em todas as
> entidades sincronizáveis (Fase 3 Ação 3 — adiada; não bloqueia a Fase 10).

---

## 4. `DataClient` (canônico — FEITO)

Local: `packages/data/src/dataClient.ts` (consumido via stub `src/lib/dataClient.ts`).

Responsabilidades (puras, sem React):
- **`repositories`** — CRUD imutável por coleção array (`courses`, `classes`, `tasks`, `exams`,
  `authors`, `concepts`, `readings`, `flashcards`, `materials`, `internshipLogs`, `supervision`,
  `stickers`, `sessions`, `techniques`, `quizSessions`, `looseNotes`): `getAll`, `getById`,
  `upsert`, `remove`, `replaceAll`.
- **`applyDatabaseToSetters(db, setters, { transformStickers })`** — fan-out banco → setters do
  contexto. `transformStickers` é **injetado** (vem de `src/lib/stickers`) para manter
  `packages/data` livre de import de `src`. `syncIndex` cai no padrão quando ausente.
- **`snapshotFromState(state)`** — normaliza `readingProgress`/`syncIndex` para o backup.
- **Backup/restore** — re-export de `buildBackupPayload`, `importAppDatabase`, `resetDatabase`, `STATIC_BANKS`.
- **`createSyncAdapter(mergeFn)`** — adapta o merge de `packages/sync` por DI (evita ciclo
  `packages/data → packages/sync`).

Exposição: `useApp().dataClient` (tipo `DataClient`). Já usado em `applyDatabase`,
`exportData`, `getSyncPayloadJson`.

Testes: `src/lib/__tests__/dataClient.test.ts` (9 testes: repositories, applyDatabaseToSetters,
snapshotFromState, round-trip de backup, sync adapter).

---

## 5. Fase 10 — Remover pontes (`ScreenLayers` + `AppContext` universal)

### Estratégia geral
Migrar **uma view por PR**, de leaf para root, trocando `useApp()` → `useMobileApp()`/`useDesktopApp()`
+ `dataClient`. Manter `useApp()` como fallback até a última view migrar. Gate verde a cada parte.

### 10.1 — Migrar views para `useMobileApp`/`useDesktopApp` + `dataClient`  ⏳
- **Objetivo:** nenhuma view importa `useApp` vindo do `AppContext` universal.
- **Ordem sugerida (leaf → root):**
  1. `NotesScreen`, `BookDetailModal`, `LibraryFilterModal` (biblioteca leaf).
  2. `ConceptsScreen`, `AuthorsScreen`, `TechniquesScreen`, `TempleScreen` (catálogo/templo).
  3. `StudyFocusScreen`, `ReaderModeModal`, `Flashcard*`, quizzes (`src/components/quizzes/*`).
  4. `FaculdadeView`, `CourseDetailView`, `ClassNote*`, `EditCourseModal`.
  5. `HomeView`, `EstudosView`, `BibliotecaView`, `PerfilView` (views raiz).
- **Como:** cada view passa a consumir o hook do seu app; handlers de dados usam
  `app.dataClient.repositories.*` (CRUD puro) + setters do provider. Manter assinaturas de
  `useApp()` equivalentes no `MobileAppProvider`/`DesktopAppProvider` durante a transição.
- **Arquivos:** `src/components/{views,library,courses,estudos,quizzes}/...`, `apps/mobile/src/MobileAppProvider.tsx`, `apps/desktop/src/DesktopAppProvider.tsx`.
- **Gate:** os 484 testes + builds + boundary.

### 10.2 — Estado de sessão desktop para `apps/desktop`  ⏳
- **Objetivo:** timer de foco (`StudyFocusScreen`/pomodoro), `window` focus/blur e estado de
  sessão desktop saem do `AppContext` universal e vivem só no `DesktopAppProvider`.
- **Base:** `DesktopSessionState` já é canônico em `apps/desktop/src/session/types.ts`.
- **Arquivos:** `apps/desktop/src/DesktopAppProvider.tsx`, `src/components/estudos/StudyFocusScreen.tsx` (versão mobile permanece em `MobileAppProvider`).

### 10.3 — Overlays de `src/overlays/*` → `apps/*/src/overlays/*`  ⏳
- **Pré-requisito:** concluir 10.1 (views não importam `src` de forma compartilhada).
- **Motivo:** hoje ficam em `src/overlays` porque importar `apps/*` a partir de `src` quebra o
  dual-context do vitest. Com as views migradas, cada app pode ter seus overlays próprios
  (`MobileOverlays`, `DesktopOverlays`/`CommandPalette`).
- **Arquivos:** `src/overlays/{MobileOverlays,DesktopOverlays}.tsx` → `apps/mobile/src/overlays/*`, `apps/desktop/src/overlays/*`.

### 10.4 — Remover `src/shells/ScreenLayers.tsx`  ⏳
- **Gatilho:** ninguém mais importa `ScreenLayers`.
- **Ação:** deletar; a transição de tela passa a ser responsabilidade de cada shell
  (`MobileAppShell`/`DesktopAppShell`).

### 10.5 — Remover `src/context/AppContext.tsx` (facade universal)  ⏳
- **Gatilho:** nenhuma view importa `useApp`/`AppContext`.
- **Ação:** deletar `AppContext`; `src/App.tsx` vira só o shell mobile; `apps/desktop/src/app/main.tsx`
  já usa `DesktopAppShell` direto. `MobileAppProvider`/`DesktopAppProvider` tornam-se os providers reais.

### 10.6 — Limpeza de stubs  ⏳
- Consolidar stubs que só existiam para o web antigo: `src/lib/exportImport.ts`,
  `src/lib/persistentData.ts`, `src/data/empty.ts` → mover `emptyDatabase`/`EmptyDatabase`
  definitivamente para `packages/data` (elimina o import `@/data/empty` em `packages/sync`).
- Ajustar `tsconfig`/`check-boundaries` se necessário; `src/` passa a conter só ponte para
  `packages/*` + `apps/*` (ou é removido, se virar monorepo puro).

---

## 6. Critérios de aceitação finais (fim da Fase 10)

- [ ] `apps/mobile` e `apps/desktop` buildam e rodam de forma independente.
- [ ] Nenhuma view importa `AppContext`/`useApp` universal nem `ScreenLayers`.
- [ ] `packages/*` continua sem `react`/Capacitor/Tauri (boundary ok).
- [ ] `DataClient` é a única porta de acesso a dados (CRUD + backup/restore + sync).
- [ ] Backup/restore e sincronização continuam funcionando (testes de `dataClient` + `exportImport` verdes).
- [ ] `src/` reduzido a stubs de compatibilidade (ou removido).
- [ ] 484+ testes verdes; 3 builds verdes; boundary ok.

---

## 7. Riscos e mitigações

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Dual-context do vitest quebra ao importar `apps/*` de `src` | Alta | Médio | Manter overlays em `src/overlays` até 10.3; usar only `type` imports de `apps/*` em `src`. |
| Ciclo `packages/data → packages/sync` | Média | Médio | `DataClient` injeta o merge via `createSyncAdapter`; `emptyDatabase` ainda em `src/data/empty` (resolvido em 10.6). |
| Regressão de backup ao mexer em `applyDatabase` | Média | Alto | `applyDatabaseToSetters` centraliza o fan-out; cobertura em `dataClient.test.ts`. |
| Views raiz grandes (Home/Faculdade/Perfil) | Média | Alto | Migrar por partes (10.1.5 por último); manter `useApp()` como fallback até o fim. |
| Chunk grande (>500kB) | Baixa | Baixo | Pré-existente; abordar com code-split/lazy após a Fase 10. |

---

## 8. Checklist de execução por parte

- [ ] **10.1** migrar views (leaf→root) → `useMobileApp`/`useDesktopApp` + `dataClient`
- [ ] **10.2** sessão desktop para `apps/desktop`
- [ ] **10.3** overlays para `apps/*/src/overlays/*`
- [ ] **10.4** remover `ScreenLayers`
- [ ] **10.5** remover `AppContext` universal
- [ ] **10.6** limpar stubs / consolidar `emptyDatabase` em `packages/data`

> Cada item acima é um PR próprio com o gate do item 2.5 validado antes de seguir.
