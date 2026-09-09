# 01 — Diagnóstico do Acoplamento Atual

> O que impede, hoje, que desktop e mobile evoluam sem se afetar.
> Auditado em `src/` + `desktop/` em ago/2026. Toda linha citada foi verificada.

## 1. Como o app nasce hoje

```ts
// src/App.tsx:18
const Shell = isDesktop ? DesktopAppShell : MobileAppShell;
```

- `isDesktop` = `'__TAURI_INTERNALS__' in window` ou `?platform=desktop` (`src/lib/platform.ts:32`)
- `initPlatformFlags()` marca `<html data-platform>` e habilita a variante `desktop:*` no Tailwind
- `preloadScreenChunks()` (`src/shells/ScreenLayers.tsx:134`) pré-carrega **todos** os chunks de tela no idle — mobile e desktop juntos

O `desktop/src-tauri/tauri.conf.json` empacota `frontendDist: "../../dist"` — o **mesmo `dist/`**
gerado por `npm run build` na raiz. Não há entrypoint desktop próprio.

Consequência: `npm run build` na raiz gera um único bundle que contém `HomeView`,
`FaculdadeView`, `BibliotecaView`, `DesktopSidebar`, `SplitLayout`, `CourseDetailPane`,
`KnowledgeGraphScreen`, `ProjectsScreen` e `InboxScreen` ao mesmo tempo.

## 2. Inventário de acoplamento

| Camada | Arquivo | Problema para independência | Severidade |
|---|---|---|---|
| **Entry point** | `src/App.tsx` (37 linhas) | Um único `App.tsx` decide a plataforma em runtime. Não há `apps/mobile/src/main.tsx` nem `apps/desktop/src/main.tsx`. | 🔴 |
| **Provider universal** | `src/context/AppContext.tsx` (~1880 linhas) | Um provider concentra: dados (courses, classes, tasks…), navegação (`navigationStack: NavScreen[]`), overlays (`isComposeScreenOpen`, `overlayKey`), sessão desktop (`DesktopSessionState`, `workspaces`), conhecimento (`relations/suggestions`), projetos (`projects/outputs`) e sync. Desktop e mobile leem o mesmo contexto. | 🔴 |
| **Renderização compartilhada** | `src/shells/ScreenLayers.tsx` (401 linhas) | `SlideContent` e `OverlayContent` são consumidos pelas **duas** shells. `SplitLayout`/`CourseDetailPane` (desktop master-detail) e views mobile caem no mesmo `AnimatePresence`. Alterar `ScreenLayers` recompila os dois clientes. | 🔴 |
| **Overlays compartilhados** | `src/shells/GlobalOverlays.tsx` (176 linhas) | `QuickAddModal`, `GlobalSearchModal`, `EditCourseModal`, `EditTccModal`, `ManageDataModal`, `OtaUpdateModal`, `Toast` e o efeito `⌘K` são universais. `CommandPalette` (desktop) deveria ser paleta rica, não a busca compacta do mobile. | 🟡 |
| **Shells condicionais** | `src/shells/DesktopAppShell.tsx` + `MobileAppShell.tsx` | Ambas importam de `ScreenLayers`/`GlobalOverlays`. `MobileAppShell` ainda importa `DesktopSidebar` para `≥lg` (`MobileAppShell.tsx:13`). O desktop não deveria depender de `BottomNav`/`SlideScreen` e o mobile não deveria carregar `SplitLayout`. | 🟡 |
| **Tipos mistos** | `src/types.ts` (893 linhas) | No mesmo arquivo vivem: entidades de domínio (`Course`, `Task`, `TccData`), navegação (`NavTab`, `NavScreen`, `SubTab*`), sessão visual (`DesktopSessionState`) e UI (`DynamicHeaderConfig`, `ManagedItem`). `DesktopSessionState` (`types.ts:597`) é estado visual do desktop, não contrato de domínio. | 🟡 |
| **Componentes** | `src/components/` (~40 pastas) | `views/HomeView`, `FaculdadeView`, `EstudosView`, `BibliotecaView`, `PerfilView` são consumidas por `SlideContent` compartilhado. `desktop/components/*` (Sidebar, Topbar, `ui/Panel`) já estão separados, mas ainda importados por `ScreenLayers` via lazy. | 🟡 |
| **Lib mista** | `src/lib/` | Mistura: agnóstico (`utils.ts`, `routing.ts`, `streak.ts`), Capacitor (`storage.ts`, `native.ts`, `notifications.ts`), Tauri (`desktop.ts`, `platform.ts`), sync (`sync/merge.ts`, `sync/stamp.ts`), OTA (`ota.ts`) e UI (`motion.ts`, `haptics.ts`). Pacotes compartilhados não deveriam importar Capacitor/Tauri. | 🟡 |
| **Wrapper nativo** | `desktop/src-tauri/` | Shell Tauri separado, mas consome `dist/` compartilhado. Não há `apps/desktop/src/` com entrypoint, Vite config e `package.json` próprios. | 🔴 |
| **Persistência** | `src/lib/storage.ts` + `usePersistentState`/`useSqliteState`/`useStampedState` | Tri-modal correto (web `localStorage` ↔ nativo SQLite `cecistudy_user` ↔ `Preferences`), mas exposto via `AppContext` universal. O `DataClient` deveria ser o ponto de acesso, não o `useApp()`. | 🟡 |

## 3. Fluxos que já mostram a dor

- **Trocar uma cor no desktop** (`desktop/components/ui/Panel.tsx`) → `npm run build` na raiz recompila e invalida o cache do mobile (mesmo bundle).
- **Adicionar um `NavScreen` novo** (`types.ts:25`) → mobile e desktop precisam recompilar mesmo que só um use.
- **Editar `AppContext` para um wizard desktop** → todas as views mobile re-renderizam (provider universal).
- **Mover `looseNotes` para `Document/Block`** → ainda há `src/components/library/notes.ts` + `src/shells/ScreenLayers` acoplados.
- **Sincronizar** → `SyncIndex`/`tombstones` vivem em `AppContext` e viajam no backup, mas o protocolo ainda é `snapshot` de coleções, não `SyncPackage` versionado por workspace.

## 4. O que já está relativamente desacoplado (aproveitar)

- `src/core/domain/` (F0–F3) — entidades puras (`Workspace`, `Document`, `Block`, `Relation`, `Project`, etc.) sem React/Capacitor/Tauri. É a semente de `packages/domain`.
- `src/core/application/use-cases/` — funções puras testadas (`createWorkspace`, `createProject`, `addRelation`).
- `src/core/ports/` + `src/core/serialization.ts` — fronteira de repositórios/sync/blobs.
- `src/lib/sync/{stamp,merge}.ts` — LWW, tombstones, preview (base do `packages/sync`).
- `src/desktop/` — `SplitLayout`, `Panel`, `CourseMasterList`, `CourseDetailPane`, `KnowledgeGraphScreen` já isolados visualmente (falta isolá-los fisicamente em `apps/desktop/`).

## 5. Conclusão do diagnóstico

A arquitetura atual **foi correta para lançar a shell desktop rápido**, mas **não atende ao requisito de evolução independente**. O próximo module que for adicionado dentro do `AppContext`/`ScreenLayers` atual aumenta o custo de separação. O diagnóstico recomenda congelar novas regras no `AppContext` e iniciar a separação pela criação de fronteiras (ver `02-fronteiras` e `03-plano`).
