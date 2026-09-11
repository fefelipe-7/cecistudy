# AGENTS.md

Guidance for OpenCode sessions in **cecistudy ♡** — personal, mobile-first, pt-BR academic organizer for Psychology (React 19 + TS + Vite 6 + Tailwind 4 + Capacitor 8 + Tauri 2 desktop).

## Commands & Verification
- Package manager: **npm** (no bun).
- `npm run dev` — Vite dev server on port 3000.
- `npm run lint` — `tsc --noEmit` (typecheck only; this is the "lint").
- `npm run test` — Vitest (jsdom). Single file: `npm run test -- src/lib/__tests__/routing.test.ts`
- `npm run build` — `vite build` → `dist/`.
- `node .github/scripts/check-boundaries.mjs` — fails if mobile/desktop/packages import boundaries are violated. É gate obrigatório do PR (`.github/workflows/ci.yml`) e do release; rode localmente antes de tocar `packages/*`, `src/shells` ou `src/desktop`. A regra "shared UI não brancha por plataforma" (`isDesktop`/`isMobile`/`Capacitor.isNativePlatform`/`__TAURI__`) vive em `src/components`, `src/shells/SharedScreenLayers.tsx` e `src/overlays/*`.
- **Verification gate:** run `npm run lint` + `npm run test` after any code change; run the boundary check when touching `packages/*`.
- Content/catalog pipeline (only when editing temple/catalog data): `npm run content:build` → `npm run db:verify` → `npm run content:check`.

## Monorepo / Package Boundaries (read before editing `packages/*`)
- `packages/*` are npm workspaces and the **canonical** shared libraries: `domain`, `application`, `data`, `sync`, `contracts`, `design-tokens`.
- `src/core/*` and `src/data/*` are **compat stubs** that re-export from those packages. Do NOT add business rules there — put new domain/use-case logic in `packages/domain` / `packages/application`.
- **CRITICAL re-export rule:** compat stubs use a RELATIVE path to the package
  (`export * from '../../packages/data/src/schema'`). Never use `@/packages/...` — the tsconfig
  `@/*` alias resolves `./src/*` first and does NOT fall back to `./packages/*`, so `@/packages/...`
  compiles under `tsc` but breaks the Vite build.
- **Boundary rule:** `packages/*` must NEVER import `react`, `@capacitor/*`, or `__TAURI__` (enforced
  by `check-boundaries.mjs`). Platform/Capacitor glue stays in `src/lib` (e.g. `exportFile.ts` isolates
  `@capacitor/filesystem`/`@capacitor/share`).
- **`apps/mobile` and `apps/desktop` DO exist** as independent clients (Tauri 2 desktop, Capacitor mobile).
  Each has its own entrypoint (`apps/*/src/app/main.tsx`), provider (`apps/*/src/*AppProvider.tsx`),
  `vite.config.ts` and build (`npm run build --workspace=apps/mobile|apps/desktop`). `src/App.tsx` (web)
  is mobile-first and no longer branches on `isDesktop`. The Fase 10 separation is in progress
  (see `desktop/context-desktop/separacao-interface/07-estado-execucao.md`): desktop components now use
  `useDesktopApp()` (`src/context/desktopApp.ts`) and mobile/shared views are migrating to `useMobileApp()`
  (`src/context/mobileApp.ts`); both are facades over the still-universal `AppContext` until the bridge is
  removed. Do not add new business rules directly to `AppContext`; call into `packages/*` instead.

## Architecture & Navigation
- **No router.** Navigation is a state stack (`NavScreen[]`) in `src/context/AppContext.tsx`; `location.hash` is only a mirror (`src/lib/routing.ts`). Source of truth = the stack.
- **Views** consume `useApp()` with no props.
- **App starts empty** (`src/data/empty.ts`): no demo/seed data; onboarding always begins from zero.
- **AppContext is a facade** (Fase 0 rule): do not add new business rules directly to it; call into `packages/*` instead.

## Code Conventions
- **Design tokens:** use semantic tokens from `src/index.css` `@theme` (`text-ceci-primary`, `bg-surface-rose`, `border-ceci-border-brand`); never raw hex in classNames (hex only as data values via `style={{}}`). See `.context/design-system.md`.
- **Copy:** pt-BR, lowercase, warm ("guardar", "bora estudar?", "prontinho ♡"). Never refer to the user as "Ceci".
- **Schema changes:** bump `SCHEMA_VERSION` only in `packages/data/src/schema` (re-exported at `src/data/schema.ts`) and add a `MIGRATIONS` entry — and ONLY when the persisted format in `packages/domain|data` changes. Navigation/UI changes (e.g. `NavScreen`) must never bump `SCHEMA_VERSION`. New persisted state needs a `usePersistentState` key + seed in `src/data/empty.ts`.
- **Editing files (MANDATORY):** ALWAYS edit via the `edit` tool. **Never** bulk-rewrite source files with PowerShell `Get-Content`/`Set-Content` (or any encoding-naive write) — it silently corrupts UTF‑8/non‑ASCII and turns pt‑BR accents (á/ã/ç/ê/õ…) into the U+FFFD replacement char, which is lossy and unrecoverable. Mechanical renames across many files must be done with the `edit` tool per file, or a script that reads **and** writes explicitly as UTF‑8 — and must be verified with `npm run lint` + a check for the replacement character (`\x{FFFD}`). (Incidente 2026‑08: migração em lote via PowerShell corrompeu 9 arquivos de views; recuperados de backup e refeitos com o `edit` tool.)

## Persistence & Native
- **Tri-modal storage:** web = `localStorage` · native domain data = **SQLite** (`@capacitor-community/sqlite`, `cecistudy_user`) via `src/lib/db/` · small prefs (`reminder`, `onboarding`, `gcal`) = `@capacitor/preferences` (through `usePersistentState`). Static catalog (questions/approaches/works) ships in `public/assets/databases/*.db` (built by `content:build`, checked by `db:verify`); web reads it via JS facades.
- **Native (`android/`, `ios/`):** committed. Releases OTA/mobile (APK+IPA+OTA) rodam em CI (`.github/workflows/release.yml`); releases desktop (Tauri, msi/dmg/AppImage/deb) em `.github/workflows/release-desktop.yml` — pipelines **independentes** por app. Gates de PR em `.github/workflows/ci.yml` (lint+test+boundary). This Linux box has no JDK/SDK/Xcode, so you cannot compile native here.
- **Desktop (`desktop/` — Tauri 2):** `desktop/src-tauri` wraps the root `dist/`. No app code lives in `desktop/`; no Tauri deps enter root `package.json`. Preview the desktop shell in-browser with `npm run dev:desktop` (or `?platform=desktop`); `?platform=web` forces the mobile/web shell. Detection: `isDesktop` in `src/lib/platform.ts`. **⚠️ Legado — o novo desktop é Flutter+Rust (abaixo).**
- **Desktop novo (`cecistudy-rust/` — Flutter + Rust, em progresso):** o plano de migração
  Tauri→Flutter+Rust vive em `plano-desktop-flutter-rust.md`
  (spec macro) + `desktop/spec/01-task-breakdown-flutter-rust.md` (fonte de verdade de status)
  + `desktop/spec/PLANO-CONSOLIDADO-FLUTTER-RUST.md` (consulta de planejamento; numeração
  diferente do breakdown). O núcleo Rust (workspace em `cecistudy-rust/`) está na **Fase 1 (20/23)**:
  crates `common/domain/data/content/sync/app` implementados e com gate verde
  (`cargo clippy -D warnings` + `cargo fmt --check` + 116 testes). Regras do workspace em
  `cecistudy-rust/AGENTS.md`. Próximos passos: portar módulos de domínio que faltam
  (`calendar/knowledge/marketing/projects/internship`), depois `cecistudy-ffi` (bridge
  flutter_rust_bridge) e então as Fases 2+ (UI Flutter). **Não tocar os crates Rust através do
  `eslint`/`tsc` da raiz — o gate Rust é o `cargo`.**

## Gotchas & Environment Quirks
- **Node:** `engines >=22` / `.nvmrc` = 22. If running on Node 26, jsdom's `localStorage` is shadowed by an experimental global; handled in `vitest.setup.ts`.
- **Git repo:** workspace clonado de `https://github.com/fefelipe-7/cecistudy.git`, branch `main` (push OK daqui). CI espera `main`.
- **Docs drift:** `.context/*.md` and the separation plan in `desktop/context-desktop/` may be stale in places — trust the code and `packages/data/src/schema` / `packages/domain` as source of truth.
- **GitHub network is blocked from this machine** (api/cdn = 000); npm, PyPI, and Microsoft CDN work. Native desktop installers build only in CI.

## Skills do projeto (e quando usar)
Skills locais em `.agents/skills/<nome>/SKILL.md` (instalados via `npx skills add`). Agrupadas por
função — use a skill certa na hora certa (leia o `SKILL.md` correspondente antes de especificar/implementar).

### Frontend & Design (UI/UX das features desktop)
- `frontend-design` — diretrizes de design de interface; use ao especificar/implementar QUALQUER tela desktop nova.
- `web-design-guidelines` — boas práticas de web design (acessibilidade, layout); use em specs de shell/perfil/settings.
- `vercel-react-best-practices` — padrões React/Tailwind; use ao definir componentes/estado das features.
- `vercel-composition-patterns` — padrões de composição de componentes; use no master-detail, split layouts, inspector.
- `ui-ux-pro-max` (+ `ui-styling`, `design`, `design-system`, `brand`, `banner-design`, `slides`) — polimento visual/UX; use em telas ricas (grafo, documents, marketing).
- `react-ui` — padrões de UI React; use em componentes de biblioteca/leitura desktop.
- `design-system` — mantenha tokens `--ds-*` (desktop) e `ceci-*` (compartilhado); nunca hex raw em classes.

### Product / Discovery
- `idea-refine` — refinar/validar ideia de feature; use antes de escrever spec de módulo greenfield.
- `problem-statement` — articular o problema; use na introdução de cada spec.
- `prioritization-methods` — priorizar features; use no roadmap.

### Specification
- `spec-driven-development` — fluxo spec→test→código; use como esqueleto de TODAS as specs.
- `prd` — product requirements doc; use em módulos greenfield grandes (calendário, documents, marketing).
- `specification-techniques` — técnicas de especificação; use para formato/detalhamento.
- `user-stories` — histórias de usuário; use para critérios de aceite por feature.

### Architecture
- `greenfield-architecture-planner` — arquitetar módulos novos do zero; use em Calendário/Documents/Marketing/Biblioteca desktop.

### Planning
- `planning-and-task-breakdown` — quebrar em tarefas; use no plano de implementação de cada spec.
- `roadmap-frameworks` — roadmap; use para sequenciar Fases.

### Implementation
- `incremental-implementation` — implementação incremental e segura; use ao planejar a remoção do código mobile compartilhado.
- `context-engineering` — engenharia de contexto/estado; use na separação de estado (`DesktopSessionState`, `ScreenLayers`).

**Regra:** specs de features desktop vivem em `desktop/spec/` e DEVEM respeitar `.github/scripts/check-boundaries.mjs`
(desktop NUNCA importa mobile estaticamente; estado visual desktop fica em `DesktopSessionState`, nunca no `SyncPackage`).
O relatório-base de varredura está em `desktop/spec/00-relatorio-varredura.md`.
