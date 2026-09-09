# Tarefas: Refatoração Completa do cecistudy

> Restaurado em 2026-09-02: os arquivos haviam sido substituídos por um plano de
> "Internship Redesign UI" (concluído/abandonado). Este é o plano de refatoração
> MOD-001/HAR-001/SEP-001 (fonte: specs/).

## Fase A: Fundação (MOD-001 + HAR-001)

- [x] **A.1** Extrair `src/lib/copy.ts` — centralizar strings hardcoded da UI
  - Acceptance: strings duplicadas (`WEEK_CELL_STYLE`, toasts) substituídas por imports de `copy.ts`
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

## Fase B: Modularização pesada (MOD-001)

- [x] **B.1** Dividir `psicoterapiaApproaches.ts` (5361 linhas) em arquivos por família
  - Acceptance: ≤ 5 arquivos de ≤ 1200 linhas cada; `index.ts` com re-export
  - Verify: `npm run build` + `npm run test`
  - Files: `src/data/psicoterapia/*.ts`, `src/data/psicoterapia/index.ts`

- [x] **B.2** Extrair handlers de `AppContext.tsx` em hooks de ação por domínio
  - Partial: `dataActions.ts` (39) + `workspaceActions.ts` (12) extraídos; `AppContext.tsx` 2440 linhas; B.2c (sync/nav/quiz/ui) adiado (alto risco de trama)
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/context/dataActions.ts`, `src/context/workspaceActions.ts`, `src/context/AppContext.tsx`

- [x] **B.3** Dividir `src/types.ts` em sub-arquivos por domínio
  - Verified: `npm run lint` + `npm run test` (521) + `npm run build` ok
  - Files: `src/types/index.ts`, `src/types/entity.ts`, `src/types/navigation.ts`, `src/types/quiz.ts`, `src/types/internship.ts`, `src/types/profile.ts`, `src/types/temple.ts`

- [x] **B.4** Extrair seções de `BibliotecaView.tsx` em componentes
  - Acceptance: `BibliotecaView.tsx` ≤ 400 linhas (→ 284); novos `MyMaterialsSection`, `ExploreSection`, etc.
  - Verify: `npm run lint` + `npm run test` (521 verdes) + `npm run build`
  - Files: `src/components/views/biblioteca/*.tsx`, `src/components/views/BibliotecaView.tsx`

- [x] **B.5** Extrair steps de `NoteTransformWizard.tsx` em componentes
  - Feito: constantes + 8 forms (Class/Task/Exam/Flashcard/Session/Internship/Concept/Author/Material) em `wizards/note/`; wizard 991 → **753** linhas
  - Acceptance parcial: `≤ 300` NÃO atingido (orquestração de estado/handleSave altamente acoplada — postergado a fase futura). Checks verdes.
  - Verify: `npm run lint` + `npm run test` (521) + `npm run build`
  - Files: `src/components/wizards/note/*.tsx`, `src/components/views/NoteTransformWizard.tsx`

- [x] **B.6** Extrair seções de `PerfilView.tsx` em componentes
  - Acceptance: `PerfilView.tsx` ≤ 350 linhas; novos `ProfileOverview`, `StreakSection`, etc.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/perfil/*.tsx`, `src/components/views/PerfilView.tsx`
  - Result: `PerfilView.tsx` **350** linhas; criados `ProfileHeader`, `JourneySummary`, `JourneyTimeline`,
    `StickersSection`, `PersonalizationSection`, `DataSection` (todos default-export ≤155 linhas).
    Checks green (lint, 521 testes, build).

- [x] **B.7** Extrair seções de `FaculdadeView.tsx` e `HomeView.tsx`
  - Acceptance: ambos ≤ 300 linhas; componentes de seção em subdiretórios
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/faculdade/*.tsx`, `src/components/views/home/*.tsx`
  - Result: `FaculdadeView.tsx` **720→174** e `HomeView.tsx` **484→157** (ambos ≤300).
    Criados `faculdade/{HeroSection,WeekGrid,DisciplinasGrid,CalendarMonth,InternshipSection,WeekEventsList}`
    e `home/{HeroSection,TodayClasses,AttentionSection,WeekRhythmCard,QuickActions,CecinhoTip,rows}`.
    `CalendarMonth` e `WeekGrid` assumem estado próprio (mês/dia/abertura semanais). Removida import morta
    `selectDiaryPreview`/`INTERNSHIP_TYPE_LABEL`. Checks green (lint, 521 testes, build).

## Fase C: Separação Mobile/Desktop (SEP-001)

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
- [x] **Checkpoint B**: Fim da Fase B — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes); nenhum arquivo > 400 linhas nos diretórios extraídos (biblioteca/perfil/home/faculdade) ✓
- [ ] **Checkpoint C**: Fim da Fase C — `npm run lint` + `npm run test` + builds mobile/desktop verdes; `check-boundaries` verde
