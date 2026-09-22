# Plano de Implementação: Refatoração Completa do cecistudy

## Overview
Refatoração completa do aplicativo cecistudy em três eixos paralelos:
1. **MOD-001 — Modularização**: Quebrar arquivos grandes em componentes menores e coesos.
2. **HAR-001 — Remover Hardcoded**: Eliminar cores hex, dados literais e strings hardcoded.
3. **SEP-001 — Separação Mobile/Desktop**: Completar a separação entre apps mobile e desktop, eliminando pontes remanescentes.

## Architecture Decisions
- **Extração por domínio**: handlers de estado extraídos como hooks de ação (`*Actions.ts`).
- **Tokens semânticos**: substituir todo hex em classNames por tokens do design system (`ceci-*`, `surface-*`, etc.).
- **Facade de dados**: `useMobileApp` como porta de entrada das views (facade desktop `useDesktopApp`/`src/desktop/` removidos na limpeza do legado, 2026-09).
- **Legado desktop removido (2026-09)**: `desktop/`, `apps/desktop/`, `src/desktop/` **não existem mais**; o desktop novo é Flutter+Rust em `cecistudy-rust/` (sem base React/JS).
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

- [x] **B.5** Extrair steps de `NoteTransformWizard.tsx` em componentes
  - Acceptance: `NoteTransformWizard.tsx` ≤ 300 linhas; 5 steps como componentes
  - **Status:** concluído com **acceptance parcial** (reconciliado com `todo.md`): constantes + 8 forms
    extraídos (`src/components/wizards/note/`); wizard 991 → **753** linhas. Meta ≤ 300 **não atingida**
    (orquestração de estado ainda acoplada — diferido a fase futura). Checks verdes.
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

> **Atualizado 2026-09-12 (auditoria por agentes):** espelha o estado real do `todo.md`. C.2–C.5
> **concluídos de fato** (zero `useApp` no código; `ScreenLayers` removido; `AppContext` só-tipos).
> Pendentes: C.1/C.6 (movimentação de `src/desktop/` — decisão em aberto vs. Flutter+Rust) e C.7
> (overlays — desvio deliberado por compatibilidade com vitest).
>
> **Atualizado 2026-09 (limpeza do legado):** o desktop legado foi **removido por completo** —
> `desktop/`, `apps/desktop/` e `src/desktop/` **não existem mais** (`dev:desktop`, `release-desktop.yml`,
> `src/lib/platform.ts` também). C.1/C.6 foram executados na limpeza; C.7 segue como desvio do vitest.

- [x] **C.1** Migrar `DesktopSidebar.tsx` de `src/desktop/` para `apps/desktop/src/components/`
  - Acceptance: import atualizado; `src/desktop/` reduzido
  - **Status:** superseded (2026-09-12) → **executado na limpeza do legado (2026-09)**: `apps/desktop/`
    + `src/desktop/` + `desktop/` removidos por completo (desktop novo é Flutter+Rust, sem base React/JS).
  - Verify: `node .github/scripts/check-boundaries.mjs`
  - Files: removidos (2026-09)

- [x] **C.2** Substituir `ScreenLayers.tsx` por animações diretas nos `AppShell`s
  - Acceptance: `ScreenLayers.tsx` removido; transições funcionando em mobile e desktop
  - **Status:** concluído — `ScreenLayers.tsx` deletado; `SharedScreenLayers.tsx` + `SlideScreen.tsx`
    + `src/desktop/screens/DesktopScreenLayers.tsx`. 3 builds verdes.
  - Verify: `npm run test` + builds
  - Files: `src/shells/ScreenLayers.tsx` → deletado, `src/shells/MobileAppShell.tsx`, `src/shells/DesktopAppShell.tsx`

- [x] **C.3** Migrar views restantes para `useMobileApp`/`useDesktopApp`
  - Acceptance: zero imports de `useApp` em `src/components/views/*`
  - **Status: excedeu o critério** — zero `useApp` em todo `src/`+`apps/`; views em `useMobileApp`
    / `useDataClient*` / `useNavValue`; desktop só `useDesktopApp` na superfície.
  - Verify: `npm run test` + grep
  - Files: `src/components/views/**/*.tsx`, `src/context/mobileApp.ts`, `src/context/desktopApp.ts`

- [x] **C.4** Remover `useApp` legado de `AppContext.tsx` (manter apenas para testes)
  - Acceptance: `useApp` exportado apenas para compatibilidade de testes
  - **Status: excedeu o critério** — hook `useApp` deletado por completo; `AppContext.tsx` = 470 linhas
    só de tipos (`AppContextValue`, `pickDomainActions`, `buildAppContextValue`); provider/hook em `appContexts.ts`.
  - Verify: `npm run test` — todos os testes verdes
  - Files: `src/context/AppContext.tsx`

- [x] **C.5** Remover `isDesktop` de `src/App.tsx` e `src/shells/*`
  - Acceptance: `src/App.tsx` é shell web mobile-only; `isDesktop` só em `src/lib/platform.ts`
  - **Status:** concluído — `src/App.tsx` mobile-first sem branch; `isDesktop` só em `platform.ts` e
    `notifications.ts`; `src/lib/platform.ts` removido na limpeza do legado (2026-09).
  - Verify: `npm run build` + grep
  - Files: `src/App.tsx`, `src/shells/*`

- [x] **C.6** Remover `src/desktop/` completamente
  - Acceptance: diretório vazio ou removido; boundary check verde
  - **Status:** superseded (2026-09-12) → **executado na limpeza do legado (2026-09)**: `src/desktop/`
    (37 arquivos) removido com `apps/desktop/` e `desktop/`. Especificações arquivadas em
    `cecistudy-rust/spec/` + `docs/archive/`.
  - Verify: `node .github/scripts/check-boundaries.mjs`
  - Files: removidos (2026-09)

- [ ] **C.7** Mover overlays de `src/overlays/` para `apps/*/src/overlays/` (Fase 10.3)
  - Acceptance: overlays específicos por app; sem overlay compartilhado
  - **Status:** pendente com desvio documentado (vitest: `src`→`apps/*` quebra dual-context; 3 testes
    desktop falhavam → overlays ficam em `src/overlays/`). Reavaliar quando o vitest isolar workspaces.
  - Verify: `npm run test` + builds
  - Files: `apps/mobile/src/overlays/`

## Checkpoints

- [x] **Checkpoint A**: Fim da Fase A — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes verdes)
- [x] **Checkpoint B**: Fim da Fase B — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes); nenhum arquivo > 400 linhas nos diretórios extraídos ✓
- [x] **Checkpoint C**: Fim da Fase C — `npm run lint` + `npm run test` + builds mobile/desktop verdes; `check-boundaries` verde
  > Fechado (2026-09-12): C.2–C.5 ✅; C.1/C.6 superseded. **2026-09:** C.1/C.6 executados na limpeza
  > do legado (`desktop/`, `apps/desktop/`, `src/desktop/` removidos); C.7 permanece como desvio do vitest.

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
- `isDesktop` — manter ou remover completamente? → **Removido** (2026-09) com o legado desktop; `src/lib/platform.ts` deletado.
- Ordem de execução: MOD-001 → HAR-001 → SEP-001 (modularização facilita separação).
