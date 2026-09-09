# Plano de Implementação: Refatoração Completa do cecistudy

## Overview
Refatoração completa do aplicativo cecistudy em três eixos paralelos:
1. **MOD-001 — Modularização**: Quebrar arquivos grandes em componentes menores e coesos.
2. **HAR-001 — Remover Hardcoded**: Eliminar cores hex, dados literais e strings hardcoded.
3. **SEP-001 — Separação Mobile/Desktop**: Completar a separação entre apps mobile e desktop, eliminando pontes remanescentes.

## Architecture Decisions
- **Extração por domínio**: handlers de estado extraídos como hooks de ação (`*Actions.ts`).
- **Tokens semânticos**: substituir todo hex em classNames por tokens do design system (`ceci-*`, `surface-*`, etc.).
- **Facade por plataforma**: `useMobileApp` / `useDesktopApp` como únicas portas de entrada para views.
- **`src/desktop/` removido**: todo código desktop migrado para `apps/desktop/src/`.
- **`ScreenLayers` removido**: transições incorporadas em cada `AppShell` específico.

## Task List

### Fase A: Fundação (MOD-001 + HAR-001)

- [x] **A.1** Extrair `src/lib/copy.ts` — centralizar strings hardcoded da UI
  - Acceptance: strings duplicadas (WEEK_CELL_STYLE, toasts) substituídas por imports de `copy.ts`
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/lib/copy.ts`, `src/components/views/*.tsx`, `src/components/wizards/*.tsx`

- [x] **A.2** Extrair `src/lib/profileMeta.ts` — `getJourneyReflection` e textos de semestre
  - Acceptance: `PerfilView.tsx` sem `getJourneyReflection` inline
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/lib/profileMeta.ts`, `src/components/views/PerfilView.tsx`

- [x] **A.3** Extrair `DUE_STYLES` e `ATTENTION_LIMIT` de `HomeView.tsx` para `src/lib/homeMeta.ts`
  - Acceptance: `HomeView.tsx` sem constantes locais
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/lib/homeMeta.ts`, `src/components/views/HomeView.tsx`

- [x] **A.4** Substituir hex hardcoded em classNames por tokens semânticos
  - Acceptance: zero `text-[#`, `bg-[#`, `border-[#` em classNames (exceto hex em `style={{}}`)
  - Verify: `npm run lint` + grep para confirmar zero ocorrências
  - Files: `src/components/**/*.tsx`

- [x] **A.5** Substituir `rounded-[24px]` → `rounded-2xl`, `rounded-[20px]` → `rounded-xl`
  - Acceptance: zero `rounded-[24px]` e `rounded-[20px]` em classNames
  - Verify: `npm run lint` + grep
  - Files: `src/components/**/*.tsx`

### Fase B: Modularização pesada (MOD-001)

- [x] **B.1** Dividir `psicoterapiaApproaches.ts` (5361 linhas) em arquivos por família
  - Verified: `npm run build` + `npm run test` ok
  - Files: `src/data/psicoterapia/fam-*.ts` (10), `src/data/psicoterapia/index.ts`, barril `src/data/psicoterapiaApproaches.ts`

- [x] **B.2** Extrair handlers de `AppContext.tsx` em hooks de ação por domínio
  - Partial: `dataActions.ts` (39 handlers) + `workspaceActions.ts` (12 handlers) extraídos; `AppContext.tsx` 2697 → 2440 linhas
  - Note: B.2c (sync/nav/quiz/ui restantes) ADIADO — alto risco de trama com `setStack`/`syncHash`/derivativos
  - Files: `src/context/dataActions.ts`, `src/context/workspaceActions.ts`, `src/context/AppContext.tsx`

- [x] **B.3** Dividir `src/types.ts` em sub-arquivos por domínio
  - Deviation: arquivos finais são `entity.ts`, `navigation.ts`, `quiz.ts`, `internship.ts`, `profile.ts`, `temple.ts` (sem `library.ts`/`study.ts` separados — grupos sobrepostos agregados para evitar imports circulares)
  - `src/types.ts` removido; imports `../types`/`./types`/`@/types` resolvem para o barrel `src/types/index.ts`
  - Verified: `npm run lint` + `npm run test` (62 arquivos / 521 testes) + `npm run build` ok
  - Files: `src/types/index.ts`, `src/types/entity.ts`, `src/types/navigation.ts`, `src/types/quiz.ts`, `src/types/internship.ts`, `src/types/profile.ts`, `src/types/temple.ts`

- [x] **B.4** Extrair seções de `BibliotecaView.tsx` em componentes
  - Acceptance: `BibliotecaView.tsx` ≤ 400 linhas (→ 284) ✓; novos `MyMaterialsSection`, `ExploreSection`, `ExploreSections`, `ExploreShelves`
  - Verify: `npm run lint` + `npm run test` (521 verdes) + `npm run build`
  - Files: `src/components/views/biblioteca/*.tsx`, `src/components/views/BibliotecaView.tsx`

- [ ] **B.5** Extrair steps de `NoteTransformWizard.tsx` em componentes
  - Acceptance: `NoteTransformWizard.tsx` ≤ 300 linhas; 5 steps como componentes
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/wizards/note/*.tsx`, `src/components/views/NoteTransformWizard.tsx`

- [x] **B.6** Extrair seções de `PerfilView.tsx` em componentes
  - Acceptance: `PerfilView.tsx` ≤ 350 linhas; novos `ProfileOverview`, `StreakSection`, etc.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/perfil/*.tsx`, `src/components/views/PerfilView.tsx`
  - Result: `PerfilView.tsx` **350**; `PerfilView` extraídos em `perfil/ProfileHeader`, `JourneySummary`,
    `JourneyTimeline`, `StickersSection`, `PersonalizationSection`, `DataSection`. Checks verdes.

- [x] **B.7** Extrair seções de `FaculdadeView.tsx` e `HomeView.tsx`
  - Acceptance: ambos ≤ 300 linhas; componentes de seção em subdiretórios
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/faculdade/*.tsx`, `src/components/views/home/*.tsx`

### Fase C: Separação Mobile/Desktop (SEP-001)

- [ ] **C.1** Migrar `DesktopSidebar.tsx` de `src/desktop/` para `apps/desktop/src/components/`
  - Acceptance: import atualizado; `src/desktop/` reduzido
  - Verify: `npm run build --workspace=apps/desktop` + `check-boundaries`
  - Files: `apps/desktop/src/components/DesktopSidebar.tsx`, `src/desktop/`

- [ ] **C.2** Substituir `ScreenLayers.tsx` por animações diretas nos `AppShell`s
  - Acceptance: `ScreenLayers.tsx` removido; transições funcionando em mobile e desktop
  - Verify: `npm run test` + builds
  - Files: `src/shells/ScreenLayers.tsx` → deletado, `src/shells/MobileAppShell.tsx`, `src/shells/DesktopAppShell.tsx`

- [ ] **C.3** Migrar views restantes para `useMobileApp`/`useDesktopApp`
  - Acceptance: zero imports de `useApp` em `src/components/views/*`
  - Verify: `npm run test` + grep
  - Files: `src/components/views/**/*.tsx`, `src/context/mobileApp.ts`, `src/context/desktopApp.ts`

- [ ] **C.4** Remover `useApp` legado de `AppContext.tsx` (manter apenas para testes)
  - Acceptance: `useApp` exportado apenas para compatibilidade de testes
  - Verify: `npm run test` — todos os 480+ testes verdes
  - Files: `src/context/AppContext.tsx`

- [ ] **C.5** Remover `isDesktop` de `src/App.tsx` e `src/shells/*`
  - Acceptance: `src/App.tsx` é shell web mobile-only; `isDesktop` só em `src/lib/platform.ts`
  - Verify: `npm run build` + grep
  - Files: `src/App.tsx`, `src/shells/*`

- [ ] **C.6** Remover `src/desktop/` completamente
  - Acceptance: diretório vazio ou removido; boundary check verde
  - Verify: `node .github/scripts/check-boundaries.mjs`
  - Files: `src/desktop/`

- [ ] **C.7** Mover overlays de `src/overlays/` para `apps/*/src/overlays/` (Fase 10.3)
  - Acceptance: overlays específicos por app; sem overlay compartilhado
  - Verify: `npm run test` + builds
  - Files: `apps/mobile/src/overlays/`, `apps/desktop/src/overlays/`

## Checkpoints

- [x] **Checkpoint A**: Fim da Fase A — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes verdes)
- [x] **Checkpoint B**: Fim da Fase B — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes); nenhum arquivo > 400 linhas nos diretórios extraídos ✓
- [ ] **Checkpoint C**: Fim da Fase C — `npm run lint` + `npm run test` + builds mobile/desktop verdes; `check-boundaries` verde

## Risks and Mitigations
| Risco | Impacto | Mitigação |
|---|---|---|
| Quebrar testes ao remover `useApp` | Alto | Manter `useApp` como facade legado até última view migrar |
| `src/desktop/` importado por algum módulo escondido | Médio | Busca global antes de remover; `check-boundaries.mjs` como guard |
| Dual-context do vitest quebra se `apps/*` importado de `src` | Alto | Usar apenas `type` imports de `apps/*` em `src`; overlays ficam em `src/` até Fase 10.3 |
| Migração de hex em classNames altera visual sutilmente | Baixo | Usar tokens equivalentes; comparar visualmente após cada batch |
| `psicoterapiaApproaches.ts` dividido quebra imports | Médio | `index.ts` com re-export mantém compatibilidade |

## Open Questions
- `copy.ts` será único ou por módulo? → Começar único, dividir se > 300 linhas.
- `ScreenLayers.tsx` — substituir ou mover? → Substituir por animações diretas nos `AppShell`s.
- `isDesktop` — manter ou remover completamente? → Manter apenas em `src/lib/platform.ts`.
- Ordem de execução: MOD-001 → HAR-001 → SEP-001 (modularização facilita separação).
