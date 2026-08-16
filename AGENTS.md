# AGENTS.md

Guidance for OpenCode sessions working in **cecistudy ♡** — a personal, mobile-first, pt-BR academic organizer for Psychology (React 19 + TypeScript + Vite + Tailwind CSS 4 + Capacitor 8).

## Commands & Verification
- **Package Manager:** Use **`npm`** (no bun).
- `npm run dev` — Vite dev server (port 3000)
- `npm run lint` — `tsc --noEmit` (only typecheck/lint)
- `npm run test` — Vitest (jsdom). Single file: `npm run test -- src/lib/__tests__/routing.test.ts`
- `npm run build` — Vite build → `dist/`
- **Verification Gate:** Always run `npm run lint` and `npm run test` after code changes.

## Architecture & Navigation
- **No Router:** Navigation is a state stack (`NavScreen[]`) in `AppContext.tsx`. `location.hash` is a mirror (`src/lib/routing.ts`).
- **Views:** Views consume `useApp()` with no props.
- **Entry & Startup:** App starts empty (`data/empty.ts`). Demo data (`data/seeds.ts`) loads only via onboarding or Perfil → configurações.

## Code Conventions
- **Design System:** Use semantic tokens from `src/index.css` `@theme` (e.g. `text-ceci-primary`, `bg-surface-rose`, `border-ceci-border-brand`) — **never raw hex** in classNames (hex allowed only as data values via `style={{}}`).
- **Copy:** pt-BR, lowercase, warm ("guardar", "bora estudar?", "prontinho ♡").
- **State & Schema:** New global state requires `usePersistentState` in `AppContext.tsx`, interface in `types.ts`, and seed in `data/empty.ts`. If data shape changes, bump `SCHEMA_VERSION` in `data/schema.ts` and add a migration.

## Persistence & Native
- **Dual Storage:** `src/lib/storage.ts` switches `localStorage` (web) ↔ `@capacitor/preferences` (native).
- **Native (`android/`/`ios/`):** Committed to repo. Native builds + releases + OTA run in CI (`.github/workflows/release.yml`); this Linux machine has no JDK/SDK/Xcode.
- **OTA Updates:** Self-hosted web bundle updates via `@capgo/capacitor-updater` (`src/lib/ota.ts`) hosted on GitHub Pages (`ota/README.md`).

## Gotchas & Environment Quirks
- **Node 26 & Jsdom:** Experimental global `localStorage` shadows jsdom's storage; fixed in `vitest.setup.ts`.
- **Git Repo:** Local workspace lacks a `.git` folder; CI expects `main`.
- **Docs Drift:** `.context/*.md` files may be drifted in places; trust code + `types.ts` as the ultimate source of truth.
