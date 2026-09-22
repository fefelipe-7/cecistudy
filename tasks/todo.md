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

> **Atualizado 2026-09-12 (auditoria por agentes do workspace):** a Fase C está **muito à frente dos
> docs** — os itens C.2–C.5 estão **concluídos de fato** (o código está no arquivo mesmo com os checks
> marcados `[ ]`). O estado real: **C.2 ✅ · C.3 ✅ (excedeu critério) · C.4 ✅ (excedeu critério) ·
> C.5 ✅**. Restam **C.1, C.6 e C.7** (movimentação de arquivos — 2 deles com decisão em aberto).
> Gate atual verificado: lint 0 · 71 arquivos de teste / 575 testes · 3 builds + boundary OK
> (números 480+/521 nos checks abaixo eram o estado antigo).
>
> **Atualizado 2026-09 (limpeza do legado):** o desktop legado foi **removido por completo** —
> `desktop/`, `apps/desktop/` e `src/desktop/` **não existem mais**; `dev:desktop`,
> `release-desktop.yml` e `src/lib/platform.ts` também foram removidos. Planejamento arquivado em
> `docs/archive/` e `cecistudy-rust/spec/`. Os registros C.1/C.6 abaixo ("superseded") são históricos.

- [x] **C.1** Migrar `DesktopSidebar.tsx` de `src/desktop/` para `apps/desktop/src/components/`
  - Acceptance: import atualizado; `src/desktop/` reduzido
  - **Status: superseded → executado na limpeza do legado (2026-09).** Foi encerrado como "superseded"
    (decisão 2026-09-12: `DesktopSidebar.tsx` permaneceu em `src/desktop/components/`), e depois
    `apps/desktop/` + `src/desktop/` + `desktop/` foram **removidos por completo** quando o desktop
    React/Tauri saiu do repositório (o desktop novo é Flutter+Rust, sem base React/JS).
  - Verify: `node .github/scripts/check-boundaries.mjs`
  - Files: `apps/desktop/src/components/DesktopSidebar.tsx`, `src/desktop/` — removidos (2026-09)

- [x] **C.2** Substituir `ScreenLayers.tsx` por animações diretas nos `AppShell`s
  - Acceptance: `ScreenLayers.tsx` removido; transições funcionando em mobile e desktop
  - **Status real:** concluído — `ScreenLayers.tsx` deletado; substituído por `src/shells/SharedScreenLayers.tsx`
    + `SlideScreen.tsx` + `src/desktop/screens/DesktopScreenLayers.tsx`. 3 builds verdes.
  - Verify: `npm run test` + builds
  - Files: `src/shells/ScreenLayers.tsx` → deletado, `src/shells/MobileAppShell.tsx`, `src/shells/DesktopAppShell.tsx`

- [x] **C.3** Migrar views restantes para `useMobileApp`/`useDesktopApp`
  - Acceptance: zero imports de `useApp` em `src/components/views/*`
  - **Status real: excedeu o critério** — **zero ocorrências de `useApp` em todo `src/`+`apps/`**.
    Views usam `useMobileApp()` (`mobileApp.ts`), os bundles `useDataClient*/useNavValue` (Home/Faculdade/Estudos)
    ou `useDataClientCourses` (CourseDetailView); `useDesktopApp()` só na superfície desktop
    (`src/desktop/**`, `DesktopAppShell`, `DesktopOverlays`).
  - Verify: `npm run test` + grep
  - Files: `src/components/views/**/*.tsx`, `src/context/mobileApp.ts`, `src/context/desktopApp.ts`

- [x] **C.4** Remover `useApp` legado de `AppContext.tsx` (manter apenas para testes)
  - Acceptance: `useApp` exportado apenas para compatibilidade de testes
  - **Status real: excedeu o critério** — hook `useApp` **deletado por completo**, nem para testes.
    `src/context/AppContext.tsx` virou módulo **só de tipos** (470 linhas): `AppContextValue`,
    `ShellExtras`, `pickDomainActions`, `buildAppContextValue`; o provider/hook vive em
    `src/context/appContexts.ts`. 71 arquivos de teste / 575 testes verdes.
  - Verify: `npm run test` — todos os testes verdes
  - Files: `src/context/AppContext.tsx`

- [x] **C.5** Remover `isDesktop` de `src/App.tsx` e `src/shells/*`
  - Acceptance: `src/App.tsx` é shell web mobile-only; `isDesktop` só em `src/lib/platform.ts`
  - **Status real:** concluído — `src/App.tsx` monta `MobileAppProvider → MobileAppShell + MobileOverlays`
    sem branch; `isDesktop` só em `src/lib/platform.ts` e `src/lib/notifications.ts` (timer desktop).
    Sobra apenas **1 import morto** em `src/shells/DesktopAppShell.tsx:9` (limpeza de 1 linha — ver Próximos passos).
  - Verify: `npm run build` + grep
  - Files: `src/App.tsx`, `src/shells/*`

- [x] **C.6** Remover `src/desktop/` completamente
  - Acceptance: diretório vazio ou removido; boundary check verde
  - **Status: superseded → executado na limpeza do legado (2026-09).** Foi encerrado como "superseded"
    (decisão 2026-09-12: `src/desktop/` mantido como lar do React legado), e depois **removido por
    completo** junto com `apps/desktop/` e `desktop/` (desktop novo é Flutter+Rust, sem base React/JS;
    especificações arquivadas em `cecistudy-rust/spec/` + `docs/archive/`).
  - Verify: `node .github/scripts/check-boundaries.mjs`
  - Files: `src/desktop/` — removido (2026-09)

- [ ] **C.7** Mover overlays de `src/overlays/` para `apps/*/src/overlays/` (Fase 10.3)
  - Acceptance: overlays específicos por app; sem overlay compartilhado
  - **Status real: pendente com desvio deliberado documentado** (07-estado-execucao.md, Fase 7):
    importar `apps/*` a partir de `src/` quebra o dual-context do vitest (3 testes desktop falhavam; solução
    atual `src/overlays/` → verdes). Mostrado como "migração futura" quando o vitest tratar workspaces isolados.
  - Verify: `npm run test` + builds
  - Files: `apps/mobile/src/overlays/` (overlays desktop encerrados com o legado — 2026-09)

## Checkpoints

- [x] **Checkpoint A**: Fim da Fase A — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes verdes)
- [x] **Checkpoint B**: Fim da Fase B — `npm run lint` + `npm run test` + `npm run build` verdes (521 testes); nenhum arquivo > 400 linhas nos diretórios extraídos (biblioteca/perfil/home/faculdade) ✓
- [x] **Checkpoint C**: Fim da Fase C — `npm run lint` + `npm run test` + builds mobile/desktop verdes; `check-boundaries` verde
  > **Fechado (2026-09-12):** C.2–C.5 concluídos; **C.1/C.6 encerrados como superseded** (decisão da usuária:
  > manter `src/desktop/`; desktop novo é Flutter+Rust sem base React/JS). C.7 permanece como desvio
  > documentado do vitest (overlays em `src/overlays/`). Gate real hoje verde (lint 0 · 71 arquivos de teste / 575 testes · 3 builds · boundary OK).

## Próximos passos (atualizado 2026-09-12)

> **Foco priorizado pela usuária (2026-09-12): Rust Fase 1 → FFI.** Decisões tomadas: C.1/C.6 encerrados
> (manter `src/desktop/`); **data crate alinhada a entidades tipadas** (schema.sql como fonte de forma);
> **desktop novo sem base React/JS** — domínio spec-first em Rust, TS só como oráculo de paridade;
> lote de higiene incluído.

1. **Higiene rápida** (1 sessão curta, antes de mexer no Rust):
   - Remover o import morto de `isDesktop` em `src/shells/DesktopAppShell.tsx:9` (C.5).
   - Reconciliar "técnicas" docs vs `.db` (136 no `.db` vs 135 nos docs) e comentário obsoleto do
     `catalogDb.ts` (745 → 3002) — ver R0 no breakdown.
2. **Rust Fase 1 completo (ver `cecistudy-rust/spec/01-task-breakdown-flutter-rust.md` → "Próximos passos"):**
   R1 data→entidades tipadas · R2 domínio faltante (calendar/knowledge/marketing/projects/internship)
   spec-first · R3 content naming · R4 paridade full (1.22) · R5 `cecistudy-ffi` (1.21).
3. **Fase 2 Flutter (UI greenfield, sem React/JS):** skeleton + bridge sobre `cecistudy-ffi` + primeiras telas.
4. **Desktop React visual:** **cancelado e removido** (2026-09) — sem legado no repositório.
5. **Library base psicoterapias:** completar família 05 → expandir 06–10 → revisão transversal
   (sequência em `library/cecistudy_base_psicoterapias/notas/sequencia_proximos_lotes.md`).
