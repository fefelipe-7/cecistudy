# Tarefas: Correção da virada de semestre (SPEC-006)

> Spec: [`docs/specs/SPEC-006-correcao-virada-de-semestre.md`](../docs/specs/SPEC-006-correcao-virada-de-semestre.md)
> Plano: [`tasks/plan-periodo-letivo-correcao.md`](./plan-periodo-letivo-correcao.md)
> Corrige: [`tasks/todo-periodo-letivo.md`](./todo-periodo-letivo.md) (itens abertos F5–F8)
> Verificação: `npm run lint` + `npm run test` (+ `node .github/scripts/check-boundaries.mjs` ao tocar `packages/*`).
> **Baseline: 95 arquivos / 945 testes.**

Mapa de bugs → tasks: **B1** ordinal escrito uma vez · **B2** `find` vs `resolveActiveTerm` ·
**B3** invariantes em código morto · **B4** desfazer inexistente · **B5** CTA travado ·
**B6** ordinal congelado no wizard · **B7** total 8 · **B8** input fantasma ·
**B9** % errado no histórico · **B10** `summary`/`endedAt` no reativo · **B11** teto ignorado ·
**B12** sem rascunho · **B13** `openCards` · **B14** timeline por `ordinal` ·
**B15** undo do closure · **B16** `grade` sem recorte · **B17** a11y · **B18** `bestStreak`.

---

## F0 — Blindagem (testes que pegam os bugs **antes** da correção)

- [ ] **0.1** Testes que pegam **B10** (D7) e **B2/B3** (D4)
  - `term.test.ts`: **inverter** `reopenTerm` — passa a exigir que **zere** `endedAt`
    **e** `summary` (o teste atual em `:107-111` afirma o contrário)
  - `termRollover.test.ts`: `planTermRollover` com **2 períodos `ativo`** em ordem
    invertida → encerra o de `statusTransitionAt` **mais recente** (o que
    `resolveActiveTerm` devolve)
  - `termRollover.test.ts`: com `totalSemesters: 10` e `nextOrdinal: 11` → grava `10`
  - Accept: os 3 testes falham contra o código atual, cada um citando o bug que pega
  - Verify: `npm run test -- packages/`
  - Files: `packages/domain/src/core/domain/__tests__/term.test.ts`,
    `packages/application/src/term/__tests__/termRollover.test.ts`
  - Deps: —
  - Scope: S

- [ ] **0.2** Testes que pegam **B7** (D8) e **B16** (D9)
  - `schema.test.ts`: `MIGRATIONS[19]` — `totalSemesters: 8` + `semester: 9` → `10`;
    `totalSemesters: 8` + `semester: 5` → **intocada** (`8`); idempotente
  - `termScope.test.ts`: `useTermScope` devolve `allActive` (não `grade`) e `active`
    continua sendo o recorte do período
  - Accept: ambos falham contra o código atual
  - Verify: `npm run test -- src/`
  - Files: `src/data/__tests__/schema.test.ts`, `src/lib/__tests__/termScope.test.ts`
  - Deps: —
  - Scope: S

### ✅ Checkpoint F0 — Blindagem
- [ ] `npm run lint` verde
- [ ] `npm run test` — os testes novos falham **de propósito** (B2, B7, B10, B16)
- [ ] Se parar aqui: reverter F0 inteiro (é só teste)

---

## F1 — Domínio (`packages/domain/src/core/domain/term.ts`)

- [ ] **1.1** `retitleTerm` — renumera o período **ativo** (D3, fecha **B1/B6**)
  - `retitleTerm(terms, termId, ordinal, label, totalSemesters, now)`
  - `ordinal` clampado em `1..min(MAX_TERM_ORDINAL, totalSemesters)`;
    `label` sincronizado com `termLabel(ordinal)` quando não vier explícito
  - **Idempotente**: mesma referência de array quando nada muda
  - Grava `updatedAt`/`statusTransitionAt` (carimbagem por registro do sync continua)
  - Recusa período `encerrado` (o transcript é imutável) e `termId` inexistente
  - Accept: 6 testes novos (clamp, teto do curso, label explícito vs derivado,
    idempotência, encerrado recusado, id inexistente)
  - Verify: `npm run test -- packages/domain`
  - Files: `packages/domain/src/core/domain/term.ts`, `.../__tests__/term.test.ts`
  - Deps: 0.1
  - Scope: M

- [ ] **1.2** `reopenTerm` zera `endedAt` e `summary` (D7, fecha **B10**)
  - **Inverte** o comportamento atual (`term.ts:246-248`) e o teste `term.test.ts:107-111`
  - Atualiza o docstring: o transcript é snapshot de um período **fechado**;
    período aberto não tem snapshot, e `buildTermSummary` o recalcula no próximo
    fechamento sem perda
  - Restaura o texto da SPEC-005 §952
  - Accept: `reopenTerm` deixa `{status:'ativo', endedAt: undefined, summary: undefined}`
  - Verify: `npm run test -- packages/domain`
  - Files: `packages/domain/src/core/domain/term.ts`, `.../__tests__/term.test.ts`
  - Deps: 0.1
  - Scope: S

- [ ] **1.3** Docstring das **3 portas** de `enforceSingleActiveTerm` (D4, fecha **B3**)
  - Documenta quem chama: pós-merge (`packages/sync`), pós-virada
    (`planTermRollover`), pós-correção (`retitleTerm`/`reopenTerm`)
  - Sem mudança de comportamento (só doc) — o wiring vem em F2/F3
  - Verify: `npm run lint`
  - Files: `packages/domain/src/core/domain/term.ts`
  - Deps: —
  - Scope: XS

### ✅ Checkpoint F1 — Domínio
- [ ] `npm run lint` · [x] `npm run test` · [x] `check-boundaries`
- [ ] O teste invertido de `reopenTerm` passa (0.1 → 1.2 fecha o B10)
- [ ] `retitleTerm` coberto

---

## F2 — Persistência + sync (fecha **B7**, metade do **B3**)

- [ ] **2.1** `SCHEMA_VERSION` 18 → 19 + `MIGRATIONS[19]` (D8)
  - `packages/data/src/schema.ts`: corrige **só** o caso evidentemente errado —
    `totalSemesters === 8` **e** `profile.semester > 8` → `10`
  - Idempotente e determinística (nunca `Date.now()`), como `MIGRATIONS[18]`
  - Accept: 3 testes (9/8 → 10 · 5/8 intocado · idempotência) + `applyMigrations` 18→19
  - Verify: `npm run test -- src/data`
  - Files: `packages/data/src/schema.ts`, `src/data/__tests__/schema.test.ts`
  - Deps: 0.2
  - Scope: S

- [ ] **2.2** `enforceSingleActiveTerm` pós-merge (D4, fecha **B3**)
  - `packages/sync/src/merge.ts`: roda logo após o merge de `academicTerms`
  - Teste: fixture de 2 dispositivos com períodos distintos → resultado tem
    **exatamente 1** `ativo` (o de `statusTransitionAt` mais recente)
  - Accept: o teste da SPEC-005 §D6 (`docs/...:1015-1018`) passa
  - Verify: `npm run test -- packages/sync`
  - Files: `packages/sync/src/merge.ts`, `.../__tests__/`
  - Deps: 1.3
  - Scope: M

- [ ] **2.3** Default `totalSemesters` = 10 (D8)
  - `src/data/empty.ts:40` e `src/data/fixtures/goldenSample.ts:42`
  - Accept: `degreeProgress(10, 10) === 100`; `shouldOfferRollover` com ordinal 8
    **não** dispara mais para sempre
  - Verify: `npm run test` (goldens precisam regenerar em F7)
  - Files: `src/data/empty.ts`, `src/data/fixtures/goldenSample.ts`
  - Deps: 2.1
  - Scope: XS

### ✅ Checkpoint F2 — Persistência + sync
- [ ] `npm run lint` · [x] `npm run test` · [x] `check-boundaries`
- [ ] B7 fechado (total 10 + migração)
- [ ] B3 fechado na metade que é sync

---

## F3 — Aplicação (`packages/application/src/term/rollover.ts`)

- [ ] **3.1** `resolveActiveTerm` no lugar de `find` (D4, fecha **B2**)
  - `rollover.ts:252`: `terms.find(t => t.status === 'ativo')` → `resolveActiveTerm(terms)`
  - `enforceSingleActiveTerm` no fim do plano (3ª porta, D4)
  - Accept: o teste de 2 ativos em ordem invertida (0.1) passa
  - Verify: `npm run test -- packages/application`
  - Files: `packages/application/src/term/rollover.ts`, `.../__tests__/termRollover.test.ts`
  - Deps: 0.1, 1.3
  - Scope: S

- [ ] **3.2** `totalSemesters` no teto do `nextOrdinal` (D8, fecha **B11**)
  - `rollover.ts:284`: `clampTermOrdinal(x)` (teto global 12) → `clampTermOrdinal(x, total)`
  - `totalSemesters` entra no input de `planTermRollover`
  - Accept: `total: 10` + `nextOrdinal: 11` → grava `10`, nunca `11`
  - Verify: `npm run test -- packages/application`
  - Files: `packages/application/src/term/rollover.ts`, `.../__tests__/`
  - Deps: 0.1
  - Scope: S

- [ ] **3.3** `originalTermIds` no plano + `undo` correto (D5, fecha **B4**/**B10**)
  - `TermRolloverPlan` ganha `originalTermIds: Record<string, string|null>` +
    `closedTermId` (o argumento explícito de `undoTermRollover` vira override)
  - `undoTermRollover` **zera** `endedAt` e `summary` do termo reaberto
  - Elimina o fallback incorreto `plan.closedTermId` (`:354`)
  - Round-trip testado: `undo(planTermRollover(x)) === x`
  - Accept: round-trip exato (mesmo id de período, mesmo `termId` por disciplina)
  - Verify: `npm run test -- packages/application`
  - Files: `packages/application/src/term/rollover.ts`, `.../__tests__/`
  - Deps: 3.1
  - Scope: M

- [ ] **3.4** `bestStreak` fora do `TermSummary` (D6, fecha **B18**)
  - Remove o campo do tipo e do `buildTermSummary`; `focusMinutes` cobre o alcance
  - A streak é **global** por decisão O2 da SPEC-005 — congelá-la por período faz o
    histórico repetir a maior streak da jornada
  - Rust **não** é tocado (registrado como tarefa do breakdown Rust)
  - Accept: `TermSummary` sem `bestStreak`; `buildTermSummary` não o produz
  - Verify: `npm run test -- packages/application` + `npm run lint`
  - Files: `packages/application/src/term/rollover.ts`, `.../__tests__/`,
    `packages/domain/src/core/domain/term.ts`
  - Deps: —
  - Scope: S

### ✅ Checkpoint F3 — Aplicação
- [ ] `npm run lint` · [x] `npm run test` · [x] `check-boundaries`
- [ ] **B2, B11, B10, B4, B18 fechados** — o caminho da virada está correto ponta a ponta
- [ ] Testes de F0.1 verdes

---

## F4 — Actions (`src/context/dataActions.ts`)

- [ ] **4.1** `correctTermOrdinal` + `reopenActiveTerm` (D3, expõe o que F1 criou)
  - Escrevem por registro via `retitleTerm`/`reopenTerm`; `hapticSuccess`/`hapticTap`
  - `correctTermOrdinal` também **reescreve `profile.semester`** (D1, o campo derivado)
  - Accept: corrigir o ordinal muda o card do Perfil **e** o header
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/context/dataActions.ts`, `src/context/AppContext.tsx`
  - Deps: 1.1, 1.2
  - Scope: M

- [ ] **4.2** `lastRollover` + `undoLastRollover` (D5, fecha **B4**/**B15**)
  - `applyTermRollover` guarda `{plan, appliedAt}` no commit, lendo `originalTermIds`
    do plano — **não** do closure
  - `undoLastRollover()` consome e zera o estado
  - `undoTermRollover` (action) sai do closure: lê por `setX(prev => …)` (fecha **B15**)
  - Estado em `useState` do provider, **não persistido**
  - Accept: undo disparado depois de uma escrita intermediária devolve o estado certo
  - Verify: `npm run test` + teste de action
  - Files: `src/context/dataActions.ts`, `src/context/AppContext.tsx`
  - Deps: 3.3
  - Scope: M

- [ ] **4.3** `profile.semester` derivado + `assertTermIntegrity` no boot (D1/D4, fecha **B1**/**B3**)
  - `applyTermRollover` grava `profile.semester = novo.ordinal`
  - `DataClientProvider`: `assertTermIntegrity` roda no boot; órfã (disciplina `ativa`
    em período não-ativo) é **reparada** (reatribuída ao ativo) + `log.warn`
  - Accept: nenhuma disciplina ativa fica presa em período encerrado
  - Verify: `npm run test`
  - Files: `src/context/dataActions.ts`, `src/context/DataClientProvider.tsx`
  - Deps: 2.2
  - Scope: M

### ✅ Checkpoint F4 — Actions
- [ ] `npm run lint` · [x] `npm run test` · [x] `check-boundaries`
- [ ] Virada reversível ponta a ponta (domínio → action)
- [ ] `profile.semester` é espelho do termo ativo

---

## F5 — Toast com ação + confete (fecha **B4**)

- [ ] **5.1** `Toast` aceita `action` (D5)
  - `ui/Toast.tsx`: `action?: { label: string; onClick: () => void }`, botão com
    `aria-label`; **timer de 8s** quando há ação (2,6s sem)
  - `overlays/OverlaysContent.tsx:177` repassa
  - `DataClientProvider:567-582`: duração variável, timer limpo no unmount
  - Accept: toast com "desfazer" fica 8s e o botão é acessível por teclado
  - Verify: `npm run test` + teste de `Toast`
  - Files: `src/components/ui/Toast.tsx`, `src/overlays/OverlaysContent.tsx`,
    `src/context/DataClientProvider.tsx`
  - Deps: —
  - Scope: M

- [ ] **5.2** `celebrate('term-closed')` + o botão que desfaz (D5)
  - `lib/celebrate.ts`: novo kind (preset `reading-done` + `sideCannons(90)`)
  - `SemesterWizard.handleSave`: `applyTermRollover` → `celebrate` → toast com
    `undoLastRollover` → `closeWizard` (mais `clearDraft`)
  - `showToast` passa a aceitar a ação (assinatura aditiva)
  - Accept: depois de gravar, o toast oferece "desfazer" e desfazer devolve tudo
  - Verify: `npm run test` + `npm run lint`
  - Files: `src/lib/celebrate.ts`, `src/components/wizards/SemesterWizard.tsx`,
    `src/context/DataClientProvider.tsx`
  - Deps: 4.2, 5.1
  - Scope: M

### ✅ Checkpoint F5 — Toast + confete
- [ ] `npm run lint` · [x] `npm run test`
- [ ] Virada gravada **é** reversível pela UI (o que a tela já prometia)

---

## F6 — UI: os controles nos lugares certos (D2)

> Maior churn. Vai por partes, gate verde entre elas, nunca misturando com F1–F4.

- [ ] **6.1** `JourneyTermCard` (novo) + remover o input fantasma (D2 #1/#2, fecha **B1**/**B8**/**B9**)
  - `src/components/views/perfil/JourneyTermCard.tsx` (novo): card do **período ativo**
    com `ordinal`, `% do curso`, "faltam N", botão `corrigir` → input numérico
  - Campo **"curso de N semestres"** com clamp `1..12`
  - `PersonalizationSection.tsx`: o input "semestre atual" **sai** (grava campo morto);
    entra o card
  - `PerfilView.tsx`: `semester` sai do form; o `save` não escreve mais `profile.semester`
  - `TermHistoryScreen.tsx:35`: `%` do topo passa a ler o **ordinal do termo ativo**
  - Accept: `grep -rn "profile\.semester" src/` → **zero leitura** em componente de UI
  - Verify: `npm run lint` + `npm run test` + teste de render do card
  - Files: `src/components/views/perfil/JourneyTermCard.tsx` (novo),
    `src/components/views/perfil/PersonalizationSection.tsx`,
    `src/components/views/PerfilView.tsx`, `src/components/terms/TermHistoryScreen.tsx`
  - Deps: 4.1, 4.3, 2.3
  - Scope: L

- [ ] **6.2** `reabrir período` no histórico (D2 #5)
  - `TermHistoryScreen.tsx`: ação no card do período **ativo** → `reopenActiveTerm`
    + confirmação (`Modal`, `closeOnBackdrop={false}`)
  - O `summary` do período ativo **não** é renderizado (D7 — some com o bug do
    snapshot de um semestre que está começando)
  - Accept: reabrir devolve o período a `ativo` limpo e o card some do histórico
  - Verify: `npm run test` + `npm run lint`
  - Files: `src/components/terms/TermHistoryScreen.tsx`
  - Deps: 4.1
  - Scope: S

- [ ] **6.3** Wizard: rascunho, `isDirty` e o próximo `ordinal` editável (D10, fecha **B6**/**B12**)
  - `useWizardForm({ draftKey: 'semester', isDirty })` — a primitiva já existe;
    `clearDraft()` no commit
  - **Passo 1 vira o lugar de corrigir o número** (D2 #3): input numérico do próximo
    `ordinal`, clamp `1..min(12, total)`, preview do rótulo
  - `isDirty` dispara a confirmação de descarte do `WizardScaffold`
  - Accept: sair no passo 2 e voltar traz as decisões; `8` → `7` grava "7º semestre"
  - Verify: `npm run test` + `npm run lint`
  - Files: `src/components/wizards/SemesterWizard.tsx`
  - Deps: 3.2, 5.2
  - Scope: M

- [ ] **6.4** Wizard: o caso "primeiro período" (D10, fecha **B5**)
  - `TermRolloverCta.tsx:32-45` entrega o que promete
  - Passo 0 sem `activeTerm`: input de ordinal → `openTerm`/`createAcademicTerm`
    (**nunca** `planTermRollover`, que lança)
  - `canNext`/`blockedReason`/`handleSave` saem do beco sem saída
  - Accept: sem período ativo, o CTA leva a um wizard que **permite abrir o primeiro**
    e grava, sem `throw`
  - Verify: `npm run test` + `npm run lint`
  - Files: `src/components/wizards/SemesterWizard.tsx`,
    `src/components/views/faculdade/TermRolloverCta.tsx`
  - Deps: 6.3
  - Scope: M

- [ ] **6.5** `allActive` + `stickers`/`profileMeta` por argumento (D9/D6, fecha **B16**)
  - `termScope.ts`: `grade` → `allActive`, com doc ("inclui avulsas e períodos
    anteriores"); `active` continua o recorte
  - `WeekGrid` (`FaculdadeView.tsx:108,130,167`) **mantém** `allActive`;
    `DisciplinasGrid` e o contador do hero (`:91`) passam a usar `active`
  - `stickers.ts:74,142,146` e `profileMeta.ts:10` recebem o ordinal como argumento
  - Accept: o adesivo de "formada" desbloqueia pelo **termo ativo**
  - Verify: `npm run test` + `npm run lint`
  - Files: `src/lib/termScope.ts`, `src/lib/stickers.ts`, `src/lib/profileMeta.ts`,
    `src/components/views/FaculdadeView.tsx` + consumidores de `stickers`
  - Deps: 6.1
  - Scope: M

- [ ] **6.6** `JourneyTimeline` por `id` + `openCards` + a11y (D11, fecha **B13**/**B14**/**B17**)
  - `JourneyTimeline.tsx:52`: `find(t => t.ordinal === …)` → resolver por **`id`**
  - `SemesterWizard.tsx:105`: `openCards` filtra os **não revisados** desde
    `activeTerm.startedAt` (`lastReviewed`), alinhando com `openTasks`/`openReadings`
  - a11y: `role="radiogroup"` + `role="radio"`/`aria-checked` no passo 2,
    `role="status"` nos contadores do passo 3, foco no `headline` a cada passo,
    `aria-current="step"` no indicador
  - Accept: os 3 bugs fecham; `getByRole('radiogroup')` encontra o passo 2
  - Verify: `npm run test` + `npm run lint`
  - Files: `src/components/views/perfil/JourneyTimeline.tsx`,
    `src/components/wizards/SemesterWizard.tsx`, `src/components/wizards/WizardScaffold.tsx`
  - Deps: 6.3
  - Scope: M

### ✅ Checkpoint F6 — UI
- [ ] `npm run lint` · [x] `npm run test` · [x] `npm run build`
- [ ] `grep -rn "profile\.semester" src/` → zero leitura em UI
- [ ] Os 5 controles da D2 nos 5 lugares certos

---

## F7 — Fechamento

- [ ] **7.1** `SemesterWizard.test.tsx` — os 8 casos que a SPEC-005 §1004-1013 prometeu
  - "virar semestre chama a ação uma vez" · "rascunho restaura ao voltar" ·
    "desfazer devolve o estado anterior" · "sem período ativo abre o primeiro" ·
    "ordinal errado é gravado" · "teto do curso é respeitado" · "saiu no passo 2 e
    perdeu" (negativo) · "contadores de pendência batem com o recorte do período"
  - `TermHistoryScreen`/`JourneyTermCard`/`TermRolloverCta`: teste de render cada
    (pega **B9** e o `summary` do reativo)
  - Files: `src/components/wizards/__tests__/SemesterWizard.test.tsx`,
    `src/components/terms/__tests__/TermHistoryScreen.test.tsx`
  - Deps: 6.1–6.6
  - Scope: L

- [ ] **7.2** Regenerar goldens (com aprovação **explícita** da usuária)
  - `SCHEMA_VERSION` 19 + `totalSemesters` 10 mudam os goldens TS
  - Rodar em modo **verify** depois de regerar
  - Nenhum crate Rust tocado
  - Files: `contracts/golden/`
  - Deps: 2.1, 2.3, 3.4
  - Scope: S

- [ ] **7.3** Docs: SPEC-005 §952 + cabeçalho, backlog Fase 22, AGENTS.md
  - SPEC-005: §952 (reopenTerm) e o cabeçalho "aguardando implementação" → corrigidos,
    com a razão das 6 divergências spec↔código do §Diagnóstico 9
  - `.context/backlog.md`: Fase 22 → fechada (ou parcial com o que sobrar)
  - `AGENTS.md`: `SCHEMA_VERSION` 18 → 19, regra de `totalSemesters`
  - `docs/specs/SPEC-006-*.md` → `✅`
  - Files: os docs
  - Deps: 7.1
  - Scope: M

### ✅ Checkpoint F7 — Fechamento
- [ ] `npm run lint` · [x] `npm run test` · [x] `check-boundaries` · [x] `npm run build`
- [ ] Goldens em modo verify
- [ ] Docs consistentes com o código

---

## Fora de escopo (continua aberto)

- [ ] `saveMinimal` ("adiar só as pendências, gravar sem fechar o semestre") — exige
      `openTerm` sem `closeTerm`; o default seguro (adiar tudo) permanece
- [ ] Paridade Rust de `retitleTerm`, do `TermSummary` sem `bestStreak` e da
      `MIGRATIONS[19]` — workspace `cecistudy-rust` (gate próprio: `cargo`)
- [ ] SPEC-005 §460 `schema.sql` canônico + `verify-schema` no CI — adiado para a fase Rust
- [ ] Banner "esta disciplina foi de outro período ♡" no `CourseDetailView`
- [ ] `HomeView` recortada por período
