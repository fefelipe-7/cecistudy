# AGENTS.md

Guidance for OpenCode sessions in **cecistudy ♡** — personal, mobile-first, pt-BR academic organizer for Psychology (React 19 + TS + Vite 6 + Tailwind 4 + Capacitor 8). O desktop é outro app, `cecistudy-desktop` (React/Tauri, backend em Rust), e mora fora deste repositório.

## Commands & Verification
- Package manager: **npm** (no bun).
- `npm run dev` — Vite dev server on port 3000.
- `npm run lint` — `tsc --noEmit` (typecheck only; this is the "lint").
- `npm run test` — Vitest (jsdom). Single file: `npm run test -- src/lib/__tests__/routing.test.ts`. Por classe: `test:domain` (ciclo de edição), `test:ui` e `test:apps`.
- `npm run build` — `vite build` → `dist/`.
- `node .github/scripts/check-boundaries.mjs` — fails if `packages/*`/shared-code boundary rules are violated. É gate obrigatório do PR (`.github/workflows/ci.yml`) e do release; rode localmente antes de tocar `packages/*`, `src/shells` ou `src/overlays`. A regra "shared UI não brancha por plataforma" (`isMobile`/`Capacitor.isNativePlatform`) vive em `src/components`, `src/shells/SharedScreenLayers.tsx` e `src/overlays/*`.
- **Verification gate:** run `npm run lint` + `npm run test` after any code change; run the boundary check when touching `packages/*`.
- **Gate em dois níveis (desde 2026-10-10, spec-performance §8.4; dois níveis em 2026-10-18):** `npm run verify:fast` roda typecheck + testes (dot reporter) + boundary check + gate de voz + `verify:contract` — é o **ciclo de edição**. `npm run verify` é `verify:fast` + `build:web` + `bundle:report` + `build:mobile`, e **não perde nenhum passo**. É a entrada do CI (`.github/workflows/ci.yml`) — o CI nunca rodou a partir da máquina de dev (GitHub bloqueado), validar no primeiro PR. Aliases: `typecheck`, `test:ci`, `check:boundaries`, `test:voz`, `build:web`, `build:mobile`.
- **`tsconfig.json` tem `"incremental": true`:** sem mudança no código, o `typecheck` cai de ~50 s para ~11 s. O `*.tsbuildinfo` está no `.gitignore` — é cache local, apagá-lo só piora o próximo typecheck.
- **Um gate por vez (`SPEC-C-014` D5):** rodar o `verify` do mobile junto com o do desktop levou o `typecheck` de 49,65 s para 328,29 s (6,6×) nesta máquina de 3,6 GB. Não orquestre um gate pelo outro.
- **Toolchain de contrato:** Node 22 (`.nvmrc` e `engines >= 22`); npm 10.x é o par testado em CI. A máquina de dev roda Node 26 + npm 12 (warning `localStorage` experimental em workers do Vitest é ruído; `vitest.setup.ts` já trata o shadowing). Relatório de bundle: `artifacts/bundle-report.json` (regenerar ao mudar chunks — F7.6 do `tasks/todo-performance.md` torna isso script).
- Content/catalog pipeline (only when editing temple/catalog data): `npm run content:build` → `npm run db:verify` → `npm run content:check`.

## Git e branches (obrigatório)

O repositório tem `main` (release), `staging` (gate completo) e `dev` (trabalho
novo) — as três com ruleset que recusa push direto. Fluxo: `dev → staging → main`.

- **Nunca commitar direto em `main`, `dev` ou `staging`.** O servidor recusa
  ("Changes must be made through a pull request").
- **A promoção entre camadas é automática** (`.github/workflows/promote.yml`):
  a cada push em `dev`/`staging`, o PR da próxima camada é aberto e mergeado
  quando o gate fecha. **Não abra PR de promoção à mão** — e não promova
  "por fora": o gate da camada é a única coisa que decide.
- **Sempre crie e troque para uma branch antes de abrir PR de trabalho**:
  `git switch -c <tipo>/<assunto> origin/<base>`.
- A default do GitHub é **`main`**, então `gh pr create` **sem `--base`** abre
  PR contra a `main` — quase nunca é o que se quer. Trabalho novo vai com
  `--base dev`; promoção, com `--base staging` ou `--base main`.
- Título do PR segue conventional commit (`pr-title` é check obrigatório);
  promoções usam o tipo `merge`.

## Testes: classificação e corte (obrigatório)

`docs/estandares-testes.md` é a regra. Todo teste novo ou revisado declara **a classe** e **o que protege que outro gate não protege**; sem isso, não entra.

| Classe | Onde | Ação |
|---|---|---|
| invariante de domínio | `packages/*`, sem jsdom | manter |
| caso de uso | `packages/application`, repositório fake | manter |
| UI comportamental | `src/**`, jsdom | manter só o que o domínio não cobre |
| render-only / snapshot estático | qualquer | **remover** |
| duplicata de gate existente | qualquer | **remover ou mesclar** |
| compat stub (`src/core/*`, `src/data/*`) | — | **não testar** |

**Corte:** um teste só fica se falha quando o comportamento quebra e não é coberto por outro gate. Variação de dado vira `it.each`; teste de tempo usa `vi.useFakeTimers()` (timeout 5 s); lógica pura em `src/` migra para o package dono. Scripts: `test:domain` no ciclo de edição; `test:ui`/`test:apps` no PR; `test:ci` dentro do `verify:fast`.

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
  `pickDomainActions`, `buildAppContextValue`), sem provider/hook. O **desktop é outro app**,
  `cecistudy-desktop` (React/Tauri, backend Rust) — o cliente Tauri que existia **dentro** deste
  repositório (`desktop/`, `apps/desktop/`, `src/desktop/`) foi removido em 2026-09, e a tentativa
  anterior de desktop (`cecistudy-rust/`) foi removida pela `ADR-008` (prosa arquivada em
  `../docs/arquivo-tentativa-desktop/`). Não adicione regras de negócio novas a `AppContext`; chame
  `packages/*` (domínio/data/sync/navigation) ou os use-cases.

## Architecture & Navigation
- **No router.** Navigation is a state stack (`NavScreen[]`) in `src/context/AppContext.tsx`; `location.hash` is only a mirror (`src/lib/routing.ts`). Source of truth = the stack.
- **Views** consume `useApp()` with no props.
- **App starts empty** (`src/data/empty.ts`): no demo/seed data; onboarding always begins from zero.
- **AppContext is a facade** (Fase 0 rule): do not add new business rules directly to it; call into `packages/*` instead.

## Code Conventions
- **Design tokens:** use semantic tokens from `src/index.css` `@theme` (`text-ceci-primary`, `bg-surface-rose`, `border-ceci-border-brand`); never raw hex in classNames (hex only as data values via `style={{}}`). See `.context/design-system.md`.
- **Copy:** pt-BR, lowercase, warm ("guardar", "bora estudar?", "prontinho ♡"). Never refer to the user as "Ceci". **A voz do cecinho mora em `src/lib/voice.ts`** (`SPEC-M-018`/`SPEC-C-014`): frase de camada 1 (erro, empty state, dica, confirmação, celebração, notificação) nunca é escrita inline em componente — o `check-boundaries.mjs` (regra 4) reprova. Erro tem **duas frases**: o que houve, em 1ª pessoa, e o que ela pode fazer. Nome da usuária só com `nomeAutorizado`. O "porquê" da voz está em `.context/copy-and-voice.md`; a frase, no código.
- **Schema changes:** o valor atual de `SCHEMA_VERSION` mora **no código** — leia
  `packages/data/src/schema.ts` (re-exportado em `src/data/schema.ts`); número em
  documento envelhece e mente (foi o débito C3). Bump apenas em
  `packages/data/src/schema` e sempre com entrada nova em `MIGRATIONS` — e SOMENTE
  quando o formato persistido em `packages/domain|data` muda. Mudanças de
  navegação/UI (ex.: `NavScreen`) **nunca** dão bump em `SCHEMA_VERSION`. Estado
  novo persistido precisa de chave `usePersistentState` + seed em
  `src/data/empty.ts`. O verificador do contrato (`npm run verify:contract`)
  confere o header de `contracts/schema.sql` contra o código.
- **Academic term (SPEC-005):** `academicTerms` (`AcademicTerm`) is the **source of truth** for "which semester am I in". `profile.semester` is legacy/fallback — in the UI always read `useActiveTerm(terms)?.ordinal`, never `profile.semester` directly. Scope the views with `useTermScope`/`activeCourses` (inheritance by `courseId`; `Course.termId == null` is the anti-orphan escape hatch, not a term course). `Course.status` `arquivado` removes it from the grade, **never** deletes it. `MIGRATIONS[18]` creates the bootstrap term idempotently; the native `academic_term` table is `IF NOT EXISTS` (no `USER_SCHEMA_VERSION` bump) and the course `termId` still travels inside the course `data_json` (the denormalized `course_term` is a Rust-phase follow-up). Spec: `docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md` · tasks: `tasks/todo-periodo-letivo.md` · status: `.context/backlog.md` Fase 22 (implementada).
- **Rollover entry points (SPEC-008):** the rollover button is **always available** with an active term — `canRollover(term)` gates *enablement*, `shouldNudgeRollover(...)` only decides the emphasis (SPEC-008 D1). Never gate visibility on the nudge. The semester number is capped by `MAX_TERM_ORDINAL` (12), **never** by `profile.totalSemesters`: `totalSemesters` is an editable guess, and a cap that depends on another field hides the mistake. Going past the course total is a **warning** ("além dos 8 do curso"), not a clamp (SPEC-008 D3, which **overrides** SPEC-006 D8). The term history is a **sibling** of the wizard, not a child; expanding a term is local state. With no active term the wizard collapses to a single "open my 1st semester" step (`openFirstTerm`) — never `planTermRollover` on that path. Spec: `docs/specs/SPEC-008-virada-de-semestre-entradas-e-navegacao.md` · tasks: `tasks/todo-virada-entradas-navegacao.md`.
- **Estágio (SPEC-009):** toda a regra do Estágio vive em `packages/domain/src/core/domain/internship.ts`; `src/lib/internshipCases.ts`, `src/types/internship.ts` e `src/lib/dateBR.ts` são stubs de compat com re-export **relativo**. Três regras que não se negociam:
  1. **Data civil, nunca `Date`.** `InternshipLog.date` é `DateKey` (`YYYY-MM-DD`) em fuso **local**. `new Date('2026-08-26')` é UTC 00:00 e, em São Paulo (UTC−3), formatar por `Date` mostra `25/08`. Use `toDateKey`/`formatDateBR`/`weekStartKey`/`inWeek` do domínio. `toISOString().slice(0,10)` **não** serve para "é hoje?".
  2. **O vínculo sessão ↔ supervisão tem fonte única:** `discussedLogIds`, do lado da supervisão (`D3`). "Supervisionada" é **derivado** (`buildLinkIndex`/`statusOf`). `supervisionLogId` não é escrito — a `MIGRATIONS[20]` o converte e o apaga. Se você se pegar escrevendo o vínculo nos dois lados, está reintroduzindo `F2`/`F3`.
  3. **Uma escrita por ação.** `handleSaveInternshipLog`/`handleDeleteInternshipLog` usam `planSave`/`planDelete` e fazem **uma** atualização de estado. O wizard **não** itera `handleUpdateInternshipLog` por sessão marcada.
  - `MIGRATIONS[20]` é pura, idempotente e determinística: **nenhum `Date` dentro de migração** (`F15`). Versão faltante é erro, não `continue` (`F17`).
  - Spec: `docs/specs/SPEC-009-estagio-supervisao-e-intervisao-v4.md` · cópia de grupo: `SPEC-M-013`.
- **Estágio (SPEC-010, entregue 2026-10-07):** toda superfície de Estágio abre com **um** `HeroCard` (`src/components/ui/HeroCard.tsx`) acima dos controles — o conteúdo muda com a aba/tela, a identidade (eyebrow "estágio", serifa, mascote, `rounded-[26px]`) é fixa. Não criar cabeçalho compacto próprio por aba, nem segunda ação primária fora do hero (o botão de ação fica no hero; a barra inferior só leva secundárias). Cartão de paciente tem tile de iniciais à esquerda (D5). Filtro único por tela = `PillGroup` (D7). Spec: `docs/specs/SPEC-010-padrao-hero-e-qualidade-de-ui-do-estagio.md` · tasks: `tasks/todo-hero-estagio.md`.
- **Hero da Home (SPEC-023, revertida em 2026-10-22):** a Home abre com o **card clássico** de saudação — `HeroSection.tsx` com gradiente `surface-default → surface-rose`, a arte do turno do dia à direita (`home/heroMascote.ts`: duas por turno, alternando por dia — as oito artes aparecem) e a frase do dia embaixo. O card fino com vídeo em loop e o véu escuro foram **tentados e revertidos** (a arte do vídeo não ficou boa em tela pequena); o céu azul acima do card também saiu — **não existe `hero-ceu`**. O que ficou daquela rodada: o tema **`campinho`** (`src/lib/themes.ts`), que faz do verde do campo a identidade do app inteiro. A frase do dia continua curta **na voz** (`src/lib/voice.ts`, família `resumo`) — nunca no componente. Spec: `docs/specs/SPEC-023-hero-da-home-com-video-de-fundo.md`.

- **Editing files (MANDATORY):** ALWAYS edit via the `edit` tool. **Never** bulk-rewrite source files with PowerShell `Get-Content`/`Set-Content` (or any encoding-naive write) — it silently corrupts UTF‑8/non‑ASCII and turns pt‑BR accents (á/ã/ç/ê/õ…) into the U+FFFD replacement char, which is lossy and unrecoverable. Mechanical renames across many files must be done with the `edit` tool per file, or a script that reads **and** writes explicitly as UTF‑8 — and must be verified with `npm run lint` + a check for the replacement character (`\x{FFFD}`). (Incidente 2026‑08: migração em lote via PowerShell corrompeu 9 arquivos de views; recuperados de backup e refeitos com o `edit` tool.)

## Persistence & Native
- **Tri-modal storage:** web = `localStorage` · native domain data = **SQLite** (`@capacitor-community/sqlite`, `cecistudy_user`) via `src/lib/db/` · small prefs (`reminder`, `onboarding`, `gcal`) = `@capacitor/preferences` (through `usePersistentState`). Static catalog (questions/approaches/works) ships in `public/assets/databases/*.db` (built by `content:build`, checked by `db:verify`); web reads it via JS facades.
- **Native (`android/`, `ios/`):** committed. Releases OTA/mobile (APK+IPA+OTA) rodam em CI (`.github/workflows/release.yml`). Gates de PR em `.github/workflows/ci.yml` (lint+test+boundary). This Linux box has no JDK/SDK/Xcode, so you cannot compile native here.
- **Desktop:** é o **outro app** do grupo, `cecistudy-desktop/` (React 19 + Tauri v2, backend em
  Rust — `ADR-001` canônico, `ADR-006` backend). Ele mora fora deste repositório e não se importa
  daqui. O que **houve** aqui e não existe mais: o cliente Tauri interno (`desktop/`,
  `apps/desktop/`, `src/desktop/`, removido 2026-09) e a tentativa anterior (`cecistudy-rust/`,
  removida 2026-10-10 pela `ADR-008`, com a prosa arquivada em `../docs/arquivo-tentativa-desktop/`).
  A relação entre os dois apps é o [contrato de portabilidade do
  grupo](../AGENTS.md#contrato-de-portabilidade): compartilha-se **decisão, não código** — o
  motor de domínio é o Rust do desktop, o mobile porta a disciplina, reimplementa e espelha a
  decisão numerada (`D<n>`), nunca copia arquivo.
- **Contrato de dados do mobile:** é **deste app** (`ADR-009`) e mora em `contracts/`
  (`schema.sql`, `canonical-json-v1.md`, `backup-v2-spec.md`, `golden/`, `verify-schema.mjs`).
  O verificador de conformidade é `npm run verify:contract` (`node contracts/verify-schema.mjs`),
  parte do gate único `npm run verify`. O desktop tem o contrato dele, em `src-tauri/migrations/`;
  a tradução entre os formatos é Rust, no desktop — nunca aqui.
- **SPEC-005 (Fase 22, mobile):** implementada **só** no React/TS. Os goldens TS foram regerados
  com aprovação explícita da usuária, porque `goldenFixtures`/`migrationFixtures` são o gate que o
  mobile consome. (O antigo oráculo Rust de paridade foi removido com `cecistudy-rust/`.)

## Gotchas & Environment Quirks
- **Node:** `engines >=22` / `.nvmrc` = 22. If running on Node 26, jsdom's `localStorage` is shadowed by an experimental global; handled in `vitest.setup.ts`.
- **Git repo:** workspace clonado de `https://github.com/fefelipe-7/cecistudy.git`, branch `main` (push OK daqui). CI espera `main`.
- **Docs drift:** `.context/*.md` and specs arquivadas may be stale in places — trust the code and `packages/data/src/schema` / `packages/domain` as source of truth.
- **GitHub funciona desta máquina desde 2026-10-24** (`gh` autenticado; `gh api`, push e leitura de run OK). O texto antigo dizia que a api/cdn estava bloqueada — não está mais.

## Skills do projeto (e quando usar)
Skills em `../.opencode/skill/<nome>/SKILL.md` — no hub do grupo, desde 2026-10-22 (antes
ficavam em `.agents/skills/`, que foi removido do repositório). Agrupadas por
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

**Dreno:** seis nomes desta lista — `problem-statement`, `prioritization-methods`,
`prd`, `specification-techniques`, `user-stories`, `roadmap-frameworks` — **não
existem** nem no hub nem no catálogo do agent-skills-hub. A lista cita skill que
nunca foi instalada. Verificado em 2026-10-22.

**Regra:** não existe desktop dentro deste repositório. O desktop é o outro app,
`cecistudy-desktop/` (React/Tauri, backend Rust). A tentativa anterior foi removida
(`ADR-008`); sua prosa de planejamento está arquivada em
`../docs/arquivo-tentativa-desktop/` e é **história**, não regra — nada ali manda sobre
o produto ou sobre este app.