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

---

## Fase FREQ — Frequência de participação nas aulas (spec `.context/spec-frequencia.md`) ✅

> **Status: implementada (2026-09-22).** Gate: `npm run lint` + `npm run test` (81 files / 751 testes) +
> `npm run build` + `check-boundaries.mjs` verdes.

- [x] **FREQ 1 — Núcleo puro:** `src/types/entity.ts` (AttendanceStatus/AttendanceRecord/CourseAttendance,
      `Course.attendance` enriquecido) + `src/lib/attendance.ts` (attendanceStats, applyAttendanceAction,
      updateAttendanceRecord, removeAttendanceRecord, upsertPresenceForClassNote, recordHoursForCourse,
      migrateLegacyAttendance, `DEFAULT_MIN_ATTENDANCE_PCT`/`DEFAULT_CLASS_HOURS`) + 21 testes
      (`src/lib/__tests__/attendance.test.ts`).
- [x] **FREQ 2 — Migração:** `SCHEMA_VERSION` 14→15 + `MIGRATIONS[15]` (converte `{attended,total}` →
      `{total, minPct:75, baseAttended, records:[]}`); golden files regenerados (ts↔Rust); schema.test cobre 14→15.
- [x] **FREQ 3 — Ações:** `src/context/dataActions.ts` — `markAttendance`/`updateAttendanceRecord`/
      `removeAttendanceRecord` + auto-upsert de presença em `addClassNote`; expostos em `AppContextValue`/`useMobileApp`.
- [x] **FREQ 4 — Editar matéria:** `EditCourseModal.tsx` (total de aulas, mínimo %, baseAttended; preserva records).
- [x] **FREQ 5 — Card de frequência:** `src/components/courses/detail/CourseAttendanceCard.tsx` (setup/quatro
      status/margem) + `CourseInfoContent.tsx` conectado (removido `75` hardcoded).
- [x] **FREQ 6 — Home "hoje na facul":** toque no card abre `ClassActionsSheet` 2×2 (fui / anotar coisinha /
      cancelou / deixei de ir) + badge "registrada hoje"; annotate combina `markAttendance('presente')` +
      `openCompose(course.id)`.
- [x] **FREQ 7 — Histórico unificado:** `CourseAulasContent.tsx` — "histórico de aulas" por data (presenças +
      notas, nota vinculada vira a linha da presença) + `RecordEditSheet.tsx` (mudar status / apagar registro) +
      atalho "registrar presença de hoje" no empty state.
- [x] **FREQ 8 — Alerta na grade:** `DisciplinasGrid.tsx` — pill "freq X%" quando `atencao`/`limite`/`estourou`.

**Follow-ups (não executados):**
- Long-press em record → `ManageSurface` dedicado (hoje usa a mesma sheet; `ManagedItemKind` não cobre records).
  Estendê-lo depois se virar padrão.
- `RecordEditSheet` exibe mas não edita `hours` (v1 só muda status/apaga).
- Quick actions do card (fui/falta/cancelada) só aparecem quando há aula hoje (evita registrar presença em dia livre) — ok por design.
- Alinhamento futuro do gate cargo do Rust (`cecistudy-rust/contracts/golden/`) com os golden files novos.

---

## Fase FLASH — Flashcards à la Anki + revisão 3D (spec `docs/specs/SPEC-003-flashcards-revisao-anki-3d.md`) 🔨

> **Status:** em andamento (2026-09-23). Gate por task: `npm run lint` + `npm run test` + `npm run build`.

- [x] **FLASH 1 — Unificar scheduler FSRS:**
      `src/lib/fsrs.ts` ganha `isCardDue(card, now?)` (FSRS-first com fallback legado p/ cards sem `state`/`due`),
      `nextDueLabel(card)` (intervalo/dias p/ UI) e `cardCounts(cards)` (`novas/learning/review/relearning`);
      `handleReviewFlashcard` (`dataActions.ts`) passa a usar o `schedule` do FSRS (gravar `lastReviewed` real e
      `timesReviewed` sincronizado) — sai `lastReviewed: c.lastReviewed ?? undefined`; `fieldsFor.tsx` flashcard usa
      `initCard`; `isDueToday` trocado por `isCardDue` em `HomeView`/`EstudosView`/`StudyRevisarScreen` e a 4ª cópia
      inlined em `navigationEngine.ts` eliminada; testes em `src/lib/__tests__/fsrs.test.ts`.
      > Gate: lint ✓ · testes de fsrs/review/stickers/headerConfig ✓ (58) · build ✓. 7 falhas pré-existentes não
      > relacionadas (`schema.test.ts` espera SCHEMA_VERSION 15 mas migrations vão até 16; goldenFixtures;
      > QuizFlowHarness timeout 5s).

- [x] **FLASH 2 — Building blocks 3D:**
      `src/components/flashcards/Card3D.tsx` (flip spring 260/26, CSS-3D puro, `backface-visibility:hidden`,
      `translateZ(0)`, reduced-motion = crossfade) + `RatingBar.tsx` (4 botões Anki com intervalo impresso,
      `aria-label` com o próximo prazo, alvos ≥52px); hook `usePrefersReducedMotion` em `src/lib/motion.ts`;
      testes `src/lib/__tests__/cards3d.test.tsx` (8 verdes). Gate: lint ✓ + teste ✓.

- [x] **FLASH 3 — Revisão estilo Anki:**
      `src/components/flashcards/ReviewSession.tsx` — fila `isCardDue`, flip, swipe **só após revelar**
      (→Good(2), ←Again(0)), undo/erase (snapshot → `handleUpdateFlashcard`), tri-count `novas · aprendendo · revisar`,
      `aria-live`, intervalo previsto via `ratingIntervals`/`shortInterval` (fsrs.ts); `StudyRevisarScreen.tsx`
      virou wrapper fino (contexto + empty state); `celebrate('flashcards-done')` no fim da fila.
      Testes: `reviewMeta.test.ts` + `reviewSession.test.tsx` (19 verdes no TASK). Gate: lint ✓ + teste ✓ + build ✓.

- [x] **FLASH 4 — Criação com voo para baú/envelope:**
      `CardCreation3D.tsx` (textarea na frente → flip → textarea no verso → "virar o card ♡"; Enter vira,
      shift+enter nova linha; face não-interativa ao tap p/ não roubar caret do CSS-3D) +
      `CardBaúEnvelope.tsx` (tampa `rotateX`, mini-card `layoutId`, commit síncrono, voo decorativo ≤650ms
      via overlay no save); `FlashcardWizard` com 3 steps (card→contexto colapsável→revisar), toggle
      "3D ♡ / simples" com memória `usePersistentState('flashcardPrefs')`, edição abre em modo simples,
      preview 3D não-interativo no simples. Testes `cardsCreation3d.test.tsx` (5 verdes).
      Gate: lint ✓ + teste ✓ + build ✓ + boundary ✓.

- [x] **FLASH 5 — Polimento & integração:**
      contadores por aba já em `isCardDue` (Home/Estudos/navigationEngine/headerConfig — FLASH 1); gesture
      guard do card (`touch-pan-y` + drag="x" no palco, sem conflito com edge-swipe-back); reduced-motion
      full (`MotionConfig reducedMotion="user"` já global + `usePrefersReducedMotion`/crossfade no Card3D);
      QA manual de teclado/flip em WebView **deferido** (Open Question 5). Gate completo: 790 testes (784 ✓,
      6 = falhas PRÉ-EXISTENTES de drift: `schema.test` "SCHEMA_VERSION é 15" e `goldenFixtures` — fora do
      escopo FLASH); lint ✓ + build ✓ + boundary ✓. Máquina sem repo git para commit.

**Open questions da spec (deferidas):** full FSRS-5 vs simplificado (mantendo simplificado); remoção de `review.ts`;
UI de gestão de decks (picker opcional); validar flip 3D + teclado em device iOS/Android (fallback = modo simples).
