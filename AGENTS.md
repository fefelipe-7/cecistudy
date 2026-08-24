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
- **Tri-modal Storage:** web = `localStorage` · nativo domínio = **SQLite** (`cecistudy_user`, plugin `@capacitor-community/sqlite`; camada em `src/lib/db/` com import legado de Preferences no boot) · preferências pequenas (`reminder`, `onboarding`, gcal) = `@capacitor/preferences` via `usePersistentState`. Catálogo estático (questões/abordagens/obras) vive no `.db` de `public/assets/databases/` (gerado por `npm run content:build`; verificado por `db:verify`) — no nativo o app lê dele (`catalogDb.ts`); na web, do facade JS.
- **Native (`android/`/`ios/`):** Committed to repo. Native builds + releases + OTA run in CI (`.github/workflows/release.yml`); this Linux machine has no JDK/SDK/Xcode.
- **OTA Updates:** Self-hosted web bundle updates via `@capgo/capacitor-updater` (`src/lib/ota.ts`) hosted on GitHub Pages (`ota/README.md`).

## Desktop (`desktop/` — Tauri 2)
- **Casca sobre o bundle web:** `desktop/src-tauri` empacota o mesmo `dist/` da raiz (`frontendDist: ../../dist`). Nada de código do app mora em `desktop/`; nenhum código Tauri entra nas deps da raiz.
- **Detecção:** `isDesktop` em `src/lib/platform.ts` (via `window.__TAURI_INTERNALS__`; ponte de recursos via `window.__TAURI__` com `withGlobalTauri: true`) — irmã do `isNativePlatform`.
- **Comandos só em `desktop/`:** `cd desktop && npm run dev|build` (dev usa `devUrl` localhost:3000 → rode o dev server da raiz junto). Build local exige toolchain C (MSVC no Windows); CI cobre windows/macos/ubuntu.
- **Features desktop:** lembrete diário via timer JS (`src/lib/notifications.ts`, dispara com app aberto); auto-update via tauri-plugin-updater + GitHub Releases (`latest.json` assinado; card no Perfil). Layout ≥ `lg:`: sidebar fixa (`DesktopSidebar.tsx`) substitui BottomNav/FAB.

## Gotchas & Environment Quirks
- **Node 26 & Jsdom:** Experimental global `localStorage` shadows jsdom's storage; fixed in `vitest.setup.ts`.
- **Git Repo:** Local workspace lacks a `.git` folder; CI expects `main`.
- **Docs Drift:** `.context/*.md` files may be drifted in places; trust code + `types.ts` as the ultimate source of truth.
- **GitHub bloqueado nesta rede** (api/github/CDN = 000): npm, PyPI e CDN Microsoft funcionam. Build nativo do desktop é possível localmente com llvm-mingw 20260616 em `%LOCALAPPDATA%` + stub de CRT (receita completa no `desktop/README.md`); instaladores (.msi/.exe) só no CI.
