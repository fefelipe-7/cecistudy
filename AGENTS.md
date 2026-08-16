# AGENTS.md

Guidance for OpenCode sessions working in **cecistudy ♡** — a personal, mobile-first,
pt-BR academic organizer for a Psychology student (Ceci). React 19 + TypeScript + Vite +
Tailwind CSS 4 + framer-motion, persisted locally, wrapped as native apps via Capacitor 8.

## Source of truth: read `.context/` first

`opencode.json` auto-loads `.context/*.md` as instructions. They are the canonical docs,
but **some are drifted** (see Gotchas). Trust code + `types.ts` when they conflict:
- `architecture.md` — stack, component tree, state/persistence, navigation.
- `design-system.md` + `design-system` skill — tokens & UI patterns.
- `components.md` — component inventory (note: **drift**, see Gotchas).
- `data-model.md` — entities, id prefixes, localStorage keys, seeds (drifted: app now starts **empty**).
- `copy-and-voice.md` — pt-BR, **lowercase**, warm voice ("cantinho", "dica da ceci").
- `backlog.md` — prioritized debt + phase roadmap.
- `animations.md`, `approach-detail-plan.md` — not in the auto-load list; read when relevant.

`.opencode/agents/` defines the specialized subagents (`cecistudy-refactor`,
`cecistudy-ui-reviewer`) and `.opencode/skills/` the skills. Default agent: `cecistudy`.

## Commands — use npm, NOT bun

The docs/agents mention `bun run lint`, but **bun is not installed** and there is **no
`bun.lock`** — the lockfile is `package-lock.json`. Use npm.

```sh
npm install            # required first if node_modules absent
npm run dev            # Vite dev server, port 3000
npm run lint           # = tsc --noEmit  (the only "lint"; no ESLint)
npm run test           # Vitest (jsdom); single file: npm run test -- src/lib/__tests__/routing.test.ts
npm run build          # Vite build → dist/
npm run cap:sync       # build + cap sync (copies dist/ into android/ & ios/)
npm run cap:sync:web   # cap copy web only (no build)
npm run cap:open:android / cap:open:ios
```

- `npm run clean` is `rm -rf dist` → **fails on Windows PowerShell**; use `Remove-Item -Recurse -Force dist` locally.
- Verification gate after changes: `npm run lint` and `npm run test` (tests live in `src/**/__tests__/`).

## Architecture orientation (not obvious from filenames)

- **No router.** Navigation is a **stack** (`NavScreen[]`) in `src/context/AppContext.tsx`
  (~1090 lines, owns ALL global state + handlers + navigation + dynamic header). The
  `location.hash` is only a mirror; serialization lives in `src/lib/routing.ts`
  (`parseRoute` / `routeToStack` / `stackToHash`). `App.tsx` is a thin shell.
- **`NavScreen` kinds:** `tab | course | notes | temple | streak | compose |
  composeDetails | wizard (type) | approach` (in `src/types.ts`). `App.tsx` animates in two
  layers: horizontal slide for base + 1st-level screens (`slideKey`), fade+scale overlay for
  compose/wizard (`overlayKey`).
- **Views consume `useApp()`** with no props; only nav/modals get props from `AppShell`.
- **Entry flows:** `QuickAddModal` is a type picker → `class` opens `ComposeNoteView`
  (compose), other types open a **full-screen wizard** via `WizardRouter`
  (in `src/components/wizards/`) as a `wizard` NavScreen. Saving a class opens
  `ClassNoteDetailWizard` (5-step) via `composeDetails`.
- **Onboarding-first data:** app starts **empty** (`data/empty.ts` → `emptyDatabase()`).
  Demo data (`data/seeds.ts` → `demoDatabase()`, built from `initialData.ts`) loads only via
  the onboarding choice or Perfil → configurações. `data/index.ts` is a facade that is
  currently **unused**.
- **Data layer:** `data/schema.ts` holds `SCHEMA_VERSION` (6) + `MIGRATIONS`;
  `data/constants.ts` (UI chips/labels) holds static UI data.
- **UI primitives** live in `src/components/ui/`; reuse `Modal`, `UnderlineTabBar`, `Card`,
  `Button`, `IconButton`, `ProgressBar`, `StarRating`, `Toast`, `AnimatedNumber` instead of
  duplicating markup.

## Conventions you must uphold

- **Design:** use semantic tokens from `src/index.css` `@theme` (e.g. `text-ceci-primary`,
  `bg-surface-rose`, `border-ceci-border-brand`, `shadow-floating`) — **never raw hex** in
  classNames. Hex is only allowed as *data values* (course color, book covers) via `style={{}}`.
- **Data:** `src/types.ts` is the source of truth. Respect id prefixes (`c`, `cl-`, `t`,
  `e`, `con-`, `aut-`, `app-`, `f`, `r`, `ss-`, `ilog-`, `st-`) and `cecistudy_` storage prefix.
- **Copy:** pt-BR lowercase, warm ("guardar" not "salvar", "bora estudar?", "prontinho ♡").
- **State:** add new global entities via `usePersistentState(key, seed)` in `AppContext.tsx`
  + interface in `types.ts` + seed in `data/empty.ts` (empty default) and `data/seeds.ts`
  (demo). If it changes persisted shape, bump `SCHEMA_VERSION` in `data/schema.ts` and add a
  migration. Keys in use: `profile, courses, classes, tasks, exams, authors, concepts,
  approaches, readings, flashcards, materials, internship, tcc, stickers, sessions,
  questions, techniques, streakData, reminder, bookmarkedCourseIds,
  looseNotes, savedBookIds, composePrefs, onboarding`. Note: **`approaches` has no setter**
  (read-only in the context value).

## Persistence & native

- **Dual persistence:** `src/lib/storage.ts` switches localStorage (web, sync) ↔
  `@capacitor/preferences` (native, async). `usePersistentState` is the hook; on native it
  hydrates *after* seeds so saved data is never overwritten.
- **Backup/import:** `src/lib/exportImport.ts` exports a versioned JSON (`SCHEMA_VERSION`) —
  native writes to Documents + share sheet (`@capacitor/filesystem`, `@capacitor/share`),
  web downloads a blob. `importData` applies `MIGRATIONS` and refuses unknown versions.
  UI in Perfil → configurações (`exportData`/`importData`/`resetApp`/`loadDemoData`).
- **Capacitor:** `android/` and `ios/` are **committed** (except build artifacts). Native
  builds (APK/IPA) run **only in CI** (`.github/workflows/native-build.yml`, node 22, npm ci,
  lint → build → `npx cap sync`; branch `main`) — this machine has no JDK/SDK/Xcode, so
  don't try to build natively here.
- `@capacitor/app` back-button handling is in `App.tsx` (modals → pop stack → exit).
- **Streak rules** (`src/lib/streak.ts`): only weekdays (Mon–Fri) count as active days;
  weekends are rest and never break the streak. Dates are local `YYYY-MM-DD`.
- **OTA updates (self-hosted):** web bundle (React/CSS/JS) updates over-the-air via
  `@capgo/capacitor-updater` (manual mode, `src/lib/ota.ts` + pure logic in
  `src/lib/otaLogic.ts`), served free from **GitHub Pages** (`.github/workflows/ota.yml`
  builds + zips `dist/`, computes SHA-256 and publishes `version.json` + `bundles/`).
  Manifest: `https://fefelipe-7.github.io/cecistudy/version.json`. Native-only; no-op on
  web. Requires `CapacitorUpdater.autoUpdate: 'off'` in `capacitor.config.ts` and **one**
  native build with the plugin embedded. Docs: `ota/README.md`. Data is untouched
  (native persistence uses Preferences, not localStorage).

## Project state / progress (as of writing)

Mature and feature-complete through backlog **Fase 8** (plus Fases 10–11: mood removal +
OTA self-hosted). Fase 9 (gesture swipe) was
**implemented then reverted** — do not reintroduce swipe without user confirmation. Current
known open items (see `backlog.md`):
- `ApproachDetailView.tsx` exists but is **never rendered** — the `#/biblioteca/abordagens/:id`
  route parses to an `approach` NavScreen, but `App.tsx` has no branch for it (dead/wired-half).
- `data/index.ts` facade is **unused** — views import from `data/empty`, `data/seeds`, etc.
- Library catalog (`CollectionBook` in `libraryData.ts`) is **parallel/unpersisted** vs
  `ReadingItem`; not yet unified.
- HomeView "meta do dia" text is partially hand-written; most stats (aulas hoje via
  `lib/schedule.ts`, assuntos a estudar via `lib/suggestions.ts`, streak, weekly progress)
  are now **derived from state**.
- Test coverage is focused on lib + a few ui primitives; views/modals largely uncovered.

## Gotchas / doc drift

- `components.md` predates some code: it does **not** list `src/components/wizards/*`,
  `OnboardingScreen.tsx`, `StreakView.tsx`, `ApproachDetailView.tsx`, `TempleScreen.tsx`,
  `ComposeNoteView.tsx`, `ClassNoteDetailWizard.tsx`,
  `StarRating.tsx`, `AnimatedNumber.tsx`, `ApproachDetail*Card.tsx`. Trust the code +
  `types.ts` over that inventory when they conflict.
- `.context/*.md` are **also drifted** on: `npm run cap:assets` (script **removed** from
  `package.json`), seeds-as-default (app now starts empty), `EstudosView` sub-tabs
  `leituras`/`questoes` (now render content) and the **mood feature** (estado de espírito
  was fully removed: `currentMood`/`moodHistory`/`avatarMood`/`StudySession.mood`,
  `moodPresets.ts`, `EstadoDeEspiritoView`, `MoodCalendarWidget`).
- The workspace is **not currently a git repo** (`.git` absent) even though
  `.github/workflows/` exists; CI expects a `main` branch when initialized.
- On **Node 26**, the experimental global `localStorage` (undefined) shadows jsdom's and breaks
  `storage.test.ts`; the fix lives in `vitest.setup.ts` (redefine `globalThis.localStorage`).
- `.opencode/node_modules` is opencode's own bundled tooling — leave it alone.
- `EstudosView` sub-tabs are now `sessoes / leituras / flashcards / questoes / historico`
  (5), and `DEFAULT_SUB_TAB` in `routing.ts` is `faculdade:disciplinas, estudos:sessoes,
  biblioteca:autores, perfil:jornada`.
