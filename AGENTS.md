# AGENTS.md

Guidance for OpenCode sessions in **cecistudy ♡** — personal, mobile-first, pt-BR academic organizer for Psychology (React 19 + TS + Vite 6 + Tailwind 4 + Capacitor 8). O desktop é o app **Campus**, em `../../cecistudy-desktop/` (React/Tauri v2), e é o canônico — ver `ADR-001` e `ADR-008`.

## Commands & Verification
- Package manager: **npm** (no bun).
- `npm run dev` — Vite dev server on port 3000.
- `npm run lint` — `tsc --noEmit` (typecheck only; this is the "lint").
- `npm run test` — Vitest (jsdom). Single file: `npm run test -- src/lib/__tests__/routing.test.ts`
- `npm run build` — `vite build` → `dist/`.
- `node .github/scripts/check-boundaries.mjs` — fails if `packages/*`/shared-code boundary rules are violated. É gate obrigatório do PR (`.github/workflows/ci.yml`) e do release; rode localmente antes de tocar `packages/*`, `src/shells` ou `src/overlays`. A regra "shared UI não brancha por plataforma" (`isMobile`/`Capacitor.isNativePlatform`) vive em `src/components`, `src/shells/SharedScreenLayers.tsx` e `src/overlays/*`.
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
- **`apps/mobile` DO exist** as an independent client (Capacitor mobile). It has its own entrypoint
  (`apps/mobile/src/app/main.tsx`), provider (`apps/mobile/src/MobileAppProvider.tsx`),
  `vite.config.ts` and build (`npm run build --workspace=apps/mobile`). `src/App.tsx` (web)
  is mobile-first and shares the same mobile shell. A separação de consumidores (Fase 10.1) já está
  **concluída** (auditado 2026-09-12): **zero `useApp` no código** — views usam `useMobileApp()`
  (`src/context/mobileApp.ts`), e as views pesadas consomem os sub-contextos por domínio
  (`src/context/DataClientProvider.tsx` + `shellNavContexts.ts` + `navigationEngine.ts`).
  `src/context/AppContext.tsx` é agora um módulo **só de tipos** (470 linhas: `AppContextValue`,
  `pickDomainActions`, `buildAppContextValue`), sem provider/hook. **O desktop é o
  app `Campus`, em outro repositório** (`../../cecistudy-desktop/`), e é o canônico
  — nada aqui é importado por ele e nada dele é importado aqui; o que os dois
  compartilham é decisão, spec e contrato de dados, nunca código. Não adicione
  regras de negócio novas a `AppContext`; chame
  `packages/*` (domínio/data/sync/navigation) ou os use-cases.

## Architecture & Navigation
- **No router.** Navigation is a state stack (`NavScreen[]`) in `src/context/AppContext.tsx`; `location.hash` is only a mirror (`src/lib/routing.ts`). Source of truth = the stack.
- **Views** consume `useApp()` with no props.
- **App starts empty** (`src/data/empty.ts`): no demo/seed data; onboarding always begins from zero.
- **AppContext is a facade** (Fase 0 rule): do not add new business rules directly to it; call into `packages/*` instead.

## Code Conventions
- **Design tokens:** use semantic tokens from `src/index.css` `@theme` (`text-ceci-primary`, `bg-surface-rose`, `border-ceci-border-brand`); never raw hex in classNames (hex only as data values via `style={{}}`). See `.context/design-system.md`.
- **Copy:** pt-BR, lowercase, warm ("guardar", "bora estudar?", "prontinho ♡"). Never refer to the user as "Ceci".
- **Schema changes:** bump `SCHEMA_VERSION` only in `packages/data/src/schema.ts` (re-exported at `src/data/schema.ts`) and add a `MIGRATIONS` entry — and ONLY when the persisted format in `packages/domain|data` changes. Navigation/UI changes (e.g. `NavScreen`) must never bump it. New persisted state needs a `usePersistentState` key + seed in `src/data/empty.ts`. **Não escreva o número aqui:** ele envelhece e vira mentira, e foi o que produziu o drift C3. Para o valor, leia `packages/data/src/schema.ts:12`; para conferi-lo contra o contrato, `node ../../cecistudy-desktop/contratos/dados/verify-schema.mjs --schema-ts=packages/data/src/schema.ts`.
- **Academic term (SPEC-005):** `academicTerms` (`AcademicTerm`) is the **source of truth** for "which semester am I in". `profile.semester` is legacy/fallback — in the UI always read `useActiveTerm(terms)?.ordinal`, never `profile.semester` directly. Scope the views with `useTermScope`/`activeCourses` (inheritance by `courseId`; `Course.termId == null` is the anti-orphan escape hatch, not a term course). `Course.status` `arquivado` removes it from the grade, **never** deletes it. `MIGRATIONS[18]` creates the bootstrap term idempotently; the native `academic_term` table is `IF NOT EXISTS` (no `USER_SCHEMA_VERSION` bump) and the course `termId` still travels inside the course `data_json` (the denormalized `course_term` is a Rust-phase follow-up). Spec: `docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md` · tasks: `tasks/todo-periodo-letivo.md` · status: `.context/backlog.md` Fase 22 (implementada).
- **Rollover entry points (SPEC-008):** the rollover button is **always available** with an active term — `canRollover(term)` gates *enablement*, `shouldNudgeRollover(...)` only decides the emphasis (SPEC-008 D1). Never gate visibility on the nudge. The semester number is capped by `MAX_TERM_ORDINAL` (12), **never** by `profile.totalSemesters`: `totalSemesters` is an editable guess, and a cap that depends on another field hides the mistake. Going past the course total is a **warning** ("além dos 8 do curso"), not a clamp (SPEC-008 D3, which **overrides** SPEC-006 D8). The term history is a **sibling** of the wizard, not a child; expanding a term is local state. With no active term the wizard collapses to a single "open my 1st semester" step (`openFirstTerm`) — never `planTermRollover` on that path. Spec: `docs/specs/SPEC-008-virada-de-semestre-entradas-e-navegacao.md` · tasks: `tasks/todo-virada-entradas-navegacao.md`.
- **Editing files (MANDATORY):** ALWAYS edit via the `edit` tool. **Never** bulk-rewrite source files with PowerShell `Get-Content`/`Set-Content` (or any encoding-naive write) — it silently corrupts UTF‑8/non‑ASCII and turns pt‑BR accents (á/ã/ç/ê/õ…) into the U+FFFD replacement char, which is lossy and unrecoverable. Mechanical renames across many files must be done with the `edit` tool per file, or a script that reads **and** writes explicitly as UTF‑8 — and must be verified with `npm run lint` + a check for the replacement character (`\x{FFFD}`). (Incidente 2026‑08: migração em lote via PowerShell corrompeu 9 arquivos de views; recuperados de backup e refeitos com o `edit` tool.)

## Persistence & Native
- **Tri-modal storage:** web = `localStorage` · native domain data = **SQLite** (`@capacitor-community/sqlite`, `cecistudy_user`) via `src/lib/db/` · small prefs (`reminder`, `onboarding`, `gcal`) = `@capacitor/preferences` (through `usePersistentState`). Static catalog (questions/approaches/works) ships in `public/assets/databases/*.db` (built by `content:build`, checked by `db:verify`); web reads it via JS facades.
- **Native (`android/`, `ios/`):** committed. Releases OTA/mobile (APK+IPA+OTA) rodam em CI (`.github/workflows/release.yml`). Gates de PR em `.github/workflows/ci.yml` (lint+test+boundary). This Linux box has no JDK/SDK/Xcode, so you cannot compile native here.
- **Desktop é outro repositório: `../../cecistudy-desktop/` (produto Campus, React 19 + Tauri v2).**
  É o app canônico do desktop (`ADR-001`). O `cecistudy-rust/` — o desktop Flutter+Rust — foi
  **removido** pela `ADR-008`, executada em `01c249f`. Não traga a referência de volta.
- **Nenhum app importa o outro.** O que se compartilha é decisão, spec e contrato de dados
  (`ADR-007`, `ADR-009`), nunca código. Regras do desktop vivem em
  `cecistudy-desktop/src-tauri/`; as suas specs em `cecigroup/docs/specs/desktop/` (`SPEC-D-xxx`).
- **O contrato de dados é deste repositório mobile para escrita e do desktop para dono.** Os
  goldens e o `schema.sql` moram em `cecistudy-desktop/contratos/dados/`. Este app os **gera**
  (`GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts` e
  `MIGRATION_WRITE=1 ... migrationFixtures.test.ts`) e escreve no outro repositório, porque só
  ele tem estado cênico. O caminho é descoberto por `packages/contracts/src/dados-path.ts` — não
  escreva caminho literal, a profundidade difere entre local e CI. `CECISTUDY_CONTRATO_DIR`
  sobrescreve a busca.
- **SPEC-005 (Fase 22, mobile):** implementada **só** no React/TS. O goldens foram regerados com
  aprovação explícita da usuária, porque
- **SPEC-005 (Fase 22, mobile):** implementada **só** no React/TS. O workspace Rust **não** foi
  tocado (nenhum crate); os goldens TS foram regerados com aprovação explícita da usuária, porque
  `goldenFixtures`/`migrationFixtures` são o gate que o mobile consome.

## Gotchas & Environment Quirks
- **Node:** `engines >=22` / `.nvmrc` = 22. If running on Node 26, jsdom's `localStorage` is shadowed by an experimental global; handled in `vitest.setup.ts`.
- **Git repo:** workspace clonado de `https://github.com/fefelipe-7/cecistudy.git`, branch `main` (push OK daqui). CI espera `main`.
- **Docs drift:** `.context/*.md` and specs arquivadas may be stale in places — trust the code and `packages/data/src/schema` / `packages/domain` as source of truth.
- **GitHub network is blocked from this machine** (api/cdn = 000); npm, PyPI, and Microsoft CDN work.

## Skills do projeto (e quando usar)
Skills locais em `.agents/skills/<nome>/SKILL.md` (instalados via `npx skills add`). Agrupadas por
função — use a skill certa na hora certa (leia o `SKILL.md` correspondente antes de especificar/implementar).

### Frontend & Design (UI/UX das telas do app)
- `frontend-design` — diretrizes de design de interface; use ao especificar/implementar QUALQUER tela nova do app.
- `web-design-guidelines` — boas práticas de web design (acessibilidade, layout); use em specs de shell/perfil/settings.
- `vercel-react-best-practices` — padrões React/Tailwind; use ao definir componentes/estado das features.
- `vercel-composition-patterns` — padrões de composição de componentes; use no master-detail, split layouts, inspector.
- `ui-ux-pro-max` (+ `ui-styling`, `design`, `design-system`, `brand`, `banner-design`, `slides`) — polimento visual/UX; use em telas ricas (grafo, documents, marketing).
- `react-ui` — padrões de UI React; use em componentes de biblioteca/leitura do app.
- `design-system` — mantenha os tokens `ceci-*` (compartilhado); nunca hex raw em classes.

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
- `greenfield-architecture-planner` — arquitetar módulos novos do zero; use em Calendário/Documents/Marketing/Biblioteca.

### Planning
- `planning-and-task-breakdown` — quebrar em tarefas; use no plano de implementação de cada spec.
- `roadmap-frameworks` — roadmap; use para sequenciar Fases.

### Implementation
- `incremental-implementation` — implementação incremental e segura; use ao planejar a remoção do código mobile compartilhado.
- `context-engineering` — engenharia de contexto/estado; use na separação de estado/contextos.

**Regra:** o desktop é outro repositório — `../../cecistudy-desktop/` — e não tem `AGENTS.md`
de skill local. Para trabalho de domínio do desktop, o caminho é o grupo:
`cecigroup/docs/specs/desktop/` (`SPEC-D-xxx`) e `cecigroup/.opencode/skill/`. A pasta
`cecistudy-rust/` e as skills do workspace Rust saíram com a `ADR-008`; se uma referência a elas
aparecer neste arquivo, ela é drift.
