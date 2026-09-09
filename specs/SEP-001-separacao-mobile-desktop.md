# Spec: SEP-001 — Separação Mobile/Desktop

## Objective
Completar a separação entre app mobile e app desktop, eliminando as pontes remanescentes (`ScreenLayers`, `useApp` universal, `src/desktop/`) e garantindo que cada plataforma tenha sua própria casca, overlays, estado e providers, sem código compartilhado que force branching por plataforma.

## Scope

### Estado atual (Fase 10 já fez muito)
- `apps/mobile` e `apps/desktop` entrypoints próprios ✅
- `useMobileApp` / `useDesktopApp` facades ✅
- Overlays próprios (`MobileOverlays` / `DesktopOverlays`) ✅
- `AppContext` renomeado para `AppBaseProvider` com `useApp()` legado ✅
- `DesktopSessionState` canônico em `apps/desktop/src/session/types.ts` ✅
- `ShellExtras` interface para extensões específicas de casca ✅

### Resta eliminar (Fase 10 pendente)
| Item | Localização | Ação |
|---|---|---|
| `src/shells/ScreenLayers.tsx` | Envelope universal que envolve ambas shells | Remover quando nenhuma view importar |
| `src/context/AppContext.tsx` (facade `useApp()`) | Importado por views de ambos apps | Eliminar quando todas as views migrarem |
| `src/desktop/` | Código desktop antigo que pode ser duplicado | Migrar para `apps/desktop/src/` ou remover |
| `DesktopAppShell` importa `DesktopSidebar` | Quebre o boundary mobile→desktop | Substituir por componente mobile-only ou remover |
| `isDesktop` em `src/lib/platform.ts` | Ainda usado em UI pontual | Manter apenas onde necessário (PerfilView `DesktopUpdateSection`, `EdgeSwipeBack`) |
| `MobileAppShell` web-only | Componente que só existe no web | Remover quando web usar MobileAppShell diretamente |

## Tech Stack
React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · framer-motion · Capacitor 8 (mobile) · Tauri 2 (desktop)

## Commands
- Build: `npm run build` · `npm run build --workspace=apps/mobile` · `npm run build --workspace=apps/desktop`
- Test: `npm run test`
- Lint: `npm run lint`
- Boundary: `node .github/scripts/check-boundaries.mjs`

## Project Structure (após refatoração)

```
src/
  context/
    appContexts.ts                  ← AppBaseContext, DataClientContext, MobileAppContext, DesktopAppContext
    appActions.ts                   ← handlers compartilhados (extraídos em MOD-001)
    dataActions.ts
    ...
  shells/
    MobileAppShell.tsx              ← shell mobile (mobile-only components)
    DesktopAppShell.tsx             ← shell desktop (desktop-only components)
    ScreenLayers.tsx                → REMOVIDO quando todas views migrarem
  overlays/
    MobileOverlays.tsx              ← apenas mobile overlays
    DesktopOverlays.tsx             ← apenas desktop overlays
    GlobalOverlays.tsx              → REMOVIDO (já deletado na Fase 7)
  components/
    views/
      *                             ← todas via useMobileApp/useDesktopApp
  desktop/                          → REMOVIDO (código migrado para apps/desktop/src/)
apps/
  mobile/
    src/
      app/
        main.tsx                    → MobileAppProvider + MobileAppShell + MobileOverlays
        MobileAppProvider.tsx         → wrapper de AppBaseProvider + MobileAppContext
      navigation/
        types.ts                    → NavScreen mobile
      session/
        types.ts                    → MobileSessionState (se houver estado específico)
      overlays/
        MobileOverlays.tsx          → pode migrar de src/overlays/ (Fase 10.3)
      ...
  desktop/
    src/
      app/
        main.tsx                    → DesktopAppProvider + DesktopAppShell + DesktopOverlays
        DesktopAppProvider.tsx        → wrapper de AppBaseProvider + DesktopAppContext
      navigation/
        types.ts                    → NavScreen desktop
      session/
        types.ts                    ← DesktopSessionState (já canônico)
      overlays/
        DesktopOverlays.tsx         → pode migrar de src/overlays/ (Fase 10.3)
      components/
        DesktopSidebar.tsx            ← só desktop
      ...
```

## Code Style
- Views compartilhadas: `useMobileApp()` ou `useDesktopApp()` — nunca `useApp()`.
- Nenhuma view brancha por `isDesktop`.
- Componentes específicos de plataforma: no diretório do app (`apps/mobile/src/` ou `apps/desktop/src/`).
- `src/desktop/`: remover completamente quando todo o código migrar.
- `src/shells/ScreenLayers.tsx`: remover quando nenhuma view importar.
- Imports de `apps/*` a partir de `src/`: só `type` imports (já o padrão).
- `isDesktop`: manter apenas em `src/lib/platform.ts` para UI pontual; removê-lo de `src/App.tsx` e `src/shells/*`.

## Testing Strategy
- Baseline atual: 480 testes verdes.
- Após cada migração de view: rodar `npm run test`.
- `apps/mobile` e `apps/desktop` builds independentes: `npm run build --workspace=apps/mobile` · `npm run build --workspace=apps/desktop`.
- `check-boundaries.mjs`: verde após cada remoção de código.
- Testes de `DesktopAppShell` e `MobileAppShell`: continuam em `src/desktop/components/__tests__/`.

## Boundaries
- **Always:** Usar `useMobileApp`/`useDesktopApp` em vez de `useApp` em novas migrações.
- **Ask first:** Remover `src/desktop/` — garantir que tudo foi migrado para `apps/desktop/src/`.
- **Never:** Importar `apps/desktop` a partir de `apps/mobile` ou vice-versa.
- **Never:** Importar `src/desktop` a partir de `src/` (boundary check).
- **Never:** Adicionar `isDesktop` em novos componentes — usar `useDesktopApp`/`useMobileApp`.
- **Never:** Quebrar o gate de 480 testes.

## Success Criteria
1. `src/desktop/` removido ou reduzido a stubs vazios (quando todo código migrar).
2. `src/shells/ScreenLayers.tsx` removido (quando nenhuma view importar).
3. Zero imports de `useApp` em `src/components/views/*` (todos via `useMobileApp`/`useDesktopApp`).
4. Zero imports de `apps/mobile` → `apps/desktop` ou vice-versa.
5. `src/App.tsx` é apenas o shell web mobile (sem `isDesktop` branch).
6. `isDesktop` removido de `src/App.tsx` e `src/shells/*`.
7. `npm run build` (raiz) verde — web mobile-only.
8. `npm run build --workspace=apps/mobile` verde.
9. `npm run build --workspace=apps/desktop` verde.
10. `npm run test` — 480+ testes verdes.
11. `node .github/scripts/check-boundaries.mjs` verde.
12. Nenhuma view contém `isDesktop`, `Capacitor.isNativePlatform`, ou `__TAURI__`.

## Open Questions
- O `DesktopAppShell` ainda importa `DesktopSidebar` de `src/desktop/` — o que fazer quando `src/desktop/` for removido?
  → Decisão: mover `DesktopSidebar.tsx` para `apps/desktop/src/components/` e atualizar o import.
- O `ScreenLayers.tsx` é importado por `MobileAppShell` (que está em `src/shells/`). Quando removê-lo?
  → Decisão: substituir `ScreenLayers` por animações diretas no `AppShell` de cada app, ou mover a lógica de transição para cada `AppShell`.
- O `useApp()` legado pode ser removido completamente ou manter como fallback?
  → Decisão: remover quando todas as views migrarem; manter `useApp` apenas em `src/context/AppContext.tsx` para testes legados.
- Fase 10.3 (mover overlays para `apps/*/src/overlays/`) — quando fazer?
  → Decisão: só após 10.1 (todas views migrarem) para evitar o problema do dual-context do vitest.

## Dependencies
- MOD-001 (modularização): `AppContext.tsx` menor facilita a quebra final.
- HAR-001 (hardcoded): remover `isDesktop` branches é parte desta fase.
- Fase 10.1 já migrou views compartilhadas — esta fase completa as restantes.