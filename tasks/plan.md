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

---

## Plano FREQ — Frequência de participação nas aulas (spec `.context/spec-frequencia.md`) ✅

> **Status: implementado (2026-09-22), gate verde (lint + 751 testes + build + boundaries).**
> Resumo completo e follow-ups em `tasks/todo.md` → "Fase FREQ".

| Item | Decisão | Arquivos |
|---|---|---|
| Dado | `Course.attendance` vira `CourseAttendance` (`records[]` + `baseAttended`); sem coleção nova (viaja no `data_json`/sync) | `src/types/entity.ts` |
| Núcleo puro | stats/margem/ações testadas por unidade (21 testes) | `src/lib/attendance.ts` + test |
| Migração | `SCHEMA_VERSION` 15; `{attended,total}` → nova shape; golden regen | `packages/data/src/schema.ts`, `cecistudy-rust/contracts/golden/` |
| Ações | `markAttendance`/`updateAttendanceRecord`/`removeAttendanceRecord` + auto-upsert no `addClassNote` | `src/context/dataActions.ts`, `AppContext.tsx` |
| Home | sheet 2×2 + badge "registrada hoje" | `TodayClasses.tsx`, `ClassActionsSheet.tsx` |
| Detalhe (info) | card de frequência por status + margem | `CourseAttendanceCard.tsx`, `CourseInfoContent.tsx` |
| Detalhe (aulas) | histórico unificado por data + `RecordEditSheet` | `CourseAulasContent.tsx`, `RecordEditSheet.tsx` |
| Grade | pill "freq X%" em atencao/limite/estourou | `DisciplinasGrid.tsx` |

**Follow-ups:** long-press de record via `ManageSurface` (ManagedItemKind não cobre records); editar `hours` no
`RecordEditSheet`; fidelidade do card de info aos botões rápidos §7.2; alinhar gate cargo do Rust aos golden files.

---

## Fase FLASH — Flashcards à la Anki + revisão 3D (spec `docs/specs/SPEC-003-flashcards-revisao-anki-3d.md`) 🔨

> **Status:** em andamento (2026-09-23). Plano de implementação na seção "Plano de implementação" da spec —
> 5 tasks; gate por task (`npm run lint` + `npm run test` + `npm run build`) + commit por slice.

**Decisões-chave (resumo da spec)**

| Item | Decisão | Arquivos |
|---|---|---|
| Scheduler | FSRS como fonte única de verdade (2026-09-17); `review.ts` vira fallback; sem bump de `SCHEMA_VERSION` (campos já existem desde migração 16) | `src/lib/fsrs.ts`, `src/lib/review.ts` |
| Bug legado | `handleReviewFlashcard` congela `lastReviewed` (`c.lastReviewed ?? undefined`) — sched FSRS nunca "adoece"; também `timesReviewed` só conta quality≥2 | `src/context/dataActions.ts` |
| Contadores | `isCardDue`/`nextDueLabel`/`cardCounts` puros (FSRS-first, fallback legado); 4ª cópia inlined em `navigationEngine.ts` eliminada | `fsrs.ts`, `HomeView`, `EstudosView`, `StudyRevisarScreen`, `navigationEngine.ts` |
| Revisão | loop Anki `esqueci/custei/lembrei/fácil` (quality 0..3, intervalo impresso), swipe **só após revelar** (→Good, ←Again), undo, tri-count `novas · aprendendo · revisar` por `state`, `aria-live`, `celebrate` no fim da fila | `src/components/flashcards/` (novo) |
| 3D | framer-motion + CSS-3D puro (perspective, `preserve-3d`, `backface-visibility:hidden`, `translateZ(0)`), **sem three.js**; stack atrás em 2D; reduced-motion global | `Card3D.tsx`, `CardCreation3D.tsx` |
| Criação | card-como-form (frente → flip → verso) + confirmação com **voo para baú/envelope temático** (`layoutId`, commit síncrono, decoração ≤300ms); edição abre em "modo simples"; toggle 3D ♡ / simples | `CardCreation3D.tsx`, `CardBaúEnvelope.tsx`, `FlashcardWizard.tsx` |

**Tasks (detalhe em `tasks/todo.md`)**

- TASK-1: unificar scheduler FSRS (`isCardDue`/`nextDueLabel`/`cardCounts`) + corrigir `handleReviewFlashcard` + `fieldsFor` com `initCard` + trocar `isDueToday` nos 4 consumidores.
- TASK-2: `src/components/flashcards/Card3D.tsx` + `RatingBar.tsx` (building blocks 3D + testes).
- TASK-3: `ReviewSession.tsx` (loop Anki: flip, swipe, erase/undo, tri-count) + refatorar `StudyRevisarScreen.tsx`.
- TASK-4: `CardCreation3D.tsx` + `CardBaúEnvelope.tsx` + `FlashcardWizard.tsx` com toggle 3D.
- TASK-5: polimento & integração (contadores por aba, gesture guard vs edge-swipe-back, reduced-motion full, QA).

**Riscos / follow-ups abertos (da spec):** full FSRS-5 vs simplificado (manter simplificado); remoção de `review.ts`
deferred; gestão de decks (picker opcional) fora do escopo; default do toggle 3D com memória via `composePrefs`;
foco/teclado em textarea dentro de CSS-3D em WebViews iOS/Android — validar em device, fallback = modo simples.

---

## Fase SPEC-004 — CourseWizard: frequência em horas, campos, ícone emoji e cores (spec `docs/specs/SPEC-004-*.md`) 🔨

> **Status:** em andamento (2026-09-23). 7 tasks (detalhe em `tasks/todo.md`); gate por task
> (`npm run lint` + `npm run test`) + boundary (muda `packages/data`). Outro agente implementa em paralelo —
> falhas de teste pré-existentes de drift (schema.test/goldenFixtures/QuizFlowHarness) são baseline, não desta fase.

**Decisões-chave (resumo da spec)**

| Item | Decisão | Arquivos |
|---|---|---|
| Frequência em horas | wizard/editar pedem `carga horária total (h)` + `horas já feitas (h)`; aulas (`total`/`baseAttended`) derivadas de `hoursPerClassFromSchedule` (média das durações dos slots, default 2h); `CardAttendance` ganha `totalHours?`/`baseHoursDone?` | `src/lib/attendance.ts`, `src/types/entity.ts` |
| Migração | `SCHEMA_VERSION` 16→17 (`MIGRATIONS[17]` backfill `totalHours = total × duração média`, idempotente); golden files íntegros (campos opcionais, `goldenSample` não muda); drift Rust (13) alargado p/ follow-up | `packages/data/src/schema.ts` |
| Campos novos | wizard coleta `category` (pills obrigatoria/optativa/estagio/tcc/extra), `minGrade` (0–10 opcional) e `officeHours` (texto opcional) — já existem na `Course`, antes só no editar | `src/components/wizards/CourseWizard.tsx` |
| Ícone emoji | emoji **salvo** em `Course.icon` (string), renderizado como `<span>` na cor da disciplina; `DynamicHeaderConfig.icon` → `\| string`; `CourseIconName` (16 Lucide) intacto, `packages/navigation` não muda | `CourseIcon.tsx`, `types/navigation.ts`, `headerConfig.ts` |
| Paleta | `COURSE_COLORS` 7→18 (variações `@theme` 400/500/600/700 de rose/blue/green/yellow/red/beige); 7 antigas preservadas | `src/lib/courseOptions.ts` |
| UI nova | `CourseIconPicker` (grade emoji + Lucide) e `EmailSlider` (slider + input numérico) reutilizados no wizard e editar | `src/components/ui/` |

**Tasks (detalhe em `tasks/todo.md`)**

- T1: modelo (`entity.ts`) + helpers de horas (`attendance.ts`) + schema 17/migração + testes (boundary).
- T2: opções (`courseOptions.ts` — 18 cores, 16 ícones, `COURSE_EMOJIS`) + teste.
- T3: renderização do ícone (`CourseIcon` emoji-branch + `navigation.ts` + `headerConfig.ts`) + teste.
- T4: `CourseIconPicker` + `EmailSlider` + testes.
- T5: `CourseWizard` (passo `curso-frequencia`, visual com picker, revisar, save).
- T6: `EditCourseModal` (horas + picker + cores) + `CourseAttendanceCard` (copy).
- T7: gate final + spec → implementada + todo com checkmarks.

**Riscos / follow-ups abertos (da spec):** duração de aulas irregulares (média subestima turmas com blocos
irregulares — futuro "duração manual"); `total`/`baseAttended` permanecem o contrato da frequência (registros/
margem), registros NÃO migrados para horas; drift Rust `SCHEMA_VERSION` (13→17) alinhado em follow-up dedicado.
