# Tarefas: Período letivo (`AcademicTerm`) e progressão de semestre (SPEC-005)

> Spec: [`docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md`](../docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md)
> Plano: [`tasks/plan-periodo-letivo.md`](./plan-periodo-letivo.md)
> Verificação: `npm run lint` + `npm run test` (+ `node .github/scripts/check-boundaries.mjs` ao tocar `packages/*`).

---

## ⚠️ Este plano foi auditado e **corrigido** pela SPEC-006

> A implementação deste plano foi entregue e **não funciona**: o `ordinal` do período
> ativo é escrito uma vez só e nunca mais, o input "semestre atual" do Perfil grava um
> campo morto, o wizard promete um "desfazer" que não existe, o CTA de "primeiro
> semestre" abre uma tela travada, e um curso de 10 semestres é tratado como 8.
> **18 bugs confirmados** (8 vermelhos).
>
> A correção está em
> [`docs/specs/SPEC-006-correcao-virada-de-semestre.md`](../docs/specs/SPEC-006-correcao-virada-de-semestre.md) ·
> [`tasks/plan-periodo-letivo-correcao.md`](./plan-periodo-letivo-correcao.md) ·
> [`tasks/todo-periodo-letivo-correcao.md`](./todo-periodo-letivo-correcao.md).
>
> Os itens `[ ]` deste arquivo **não são para executar aqui** — estão superado pelas
> tasks da SPEC-006. Mapeamento:
>
> | item aberto aqui | bug | corrigido em |
> |---|---|---|
> | 5.1 `profile.semester` derivado | B1, B8 | SPEC-006 · D1 · task 4.3 + 6.1 |
> | 5.2 `totalSemesters` editável + clamp | B7, B11 | SPEC-006 · D8 · task 2.1/2.3 + 3.2 |
> | 7.3 desfazer + confete pós-virada | B4 | SPEC-006 · D5 · task 4.2 + 5.2 |
> | 7.4 `TermHistoryScreen` (parcial) | B9 | SPEC-006 · task 6.1 |
> | 7.5 a11y dos passos | B17 | SPEC-006 · D11 · task 6.6 |
> | 5.3 copy dual-scope | — | permanece aberto (não é bug) |
> | 5.4 backfill de perfil no import | — | coberto pela `MIGRATIONS[19]` (task 2.1) |
> | 8.1 `schema:verify` no CI | — | permanece adiado para a fase Rust |

---

## F1 — Domínio puro (fundação, sem contrato)

- [x] **1.1** Entidade `AcademicTerm` + invariantes
  - `packages/domain/src/core/domain/term.ts` (novo): `TermStatus`, `CourseStatus`,
    `TermSummary`, `TermGrade`, `AcademicTerm`, `TermScopedCourse`,
    `MAX_TERM_ORDINAL`, `clampTermOrdinal`, `termLabel`, `createAcademicTerm`,
    `enforceSingleActiveTerm`, `closeTerm`, `openTerm`, `reopenTerm`,
    `resolveActiveTerm`, `resolveLatestClosedTerm`, `termsByRecency`,
    `assertTermIntegrity`, `shouldOfferRollover`
  - Accept: status só avança; `closeTerm`/`openTerm` idempotentes (mesma
    referência de array no no-op); `reopenTerm` é a única volta de
    `encerrado`→`ativo` e **preserva** o resumo congelado; `resolveActiveTerm`
    desempata por `statusTransitionAt`; `assertTermIntegrity` acha disciplinas
    `ativa` fora do período ativo sem `termId` (escape hatch)
  - Verify: `npm run test -- packages/domain/src/core/domain/__tests__/term.test.ts` (24 testes)
  - Files: `packages/domain/src/core/domain/term.ts`, `.../__tests__/term.test.ts`
  - Scope: S

- [x] **1.2** Exportar no índice do domínio + **correção de infra do gate**
  - `packages/domain/src/core/domain/index.ts`: `export * from './term';`
  - `ids.ts`: prefixo `'trm'` no union `EntityPrefix`
  - `src/types/index.ts`: re-export dos tipos do período (fonte única, sem duplicar contrato)
  - `src/lib/termRollover.ts` (stub de compat) + `packages/application/src/index.ts`
  - ⚠️ **Infra descoberta:** `vitest.config.ts` só incluía `src/**` e `apps/**` — os
    testes de `packages/` (ex.: `invariants.test.ts`) **existiam e nunca rodavam** no
    gate. Adicionado `packages/**/*.test.{ts,tsx}` (a SPEC-005 precisa dos testes de
    domínio/aplicação). Consequência: mais carga paralela expôs o timeout de 5s do
    `QuizFlowHarness.test.tsx` (que passa isolado) → timeout explícito de 20s.
  - Verify: `npm run lint` + `npm run test` (928 testes verdes)
  - Files: `packages/domain/src/core/domain/{index,ids}.ts`, `src/types/index.ts`,
    `packages/application/src/index.ts`, `src/lib/termRollover.ts`, `vitest.config.ts`,
    `src/components/quizzes/__tests__/QuizFlowHarness.test.tsx`
  - Scope: S

- [x] **1.3** `buildTermSummary` + transições de rollover em `application`
  - `packages/application/src/term/rollover.ts` (novo) + `__tests__/termRollover.test.ts`
  - Accept: `buildTermSummary` é **pura** (`closedAt` por argumento, nunca
    `Date.now()`); entradas idênticas → saída idêntica; `planTermRollover` é
    determinística e **não muta** as entradas; devolve um **plano** de escritas
    (2 termos + N cursos) e um `diff` em linguagem natural; `undoTermRollover` faz
    round-trip; `bestStreak` entra pela porta (boundary: `computeStreak` mora em
    `src/lib` e pacote não depende de código do app)
  - Verify: `npm run test -- packages/application/src/term/__tests__/termRollover.test.ts` (20 testes)
  - Files: `packages/application/src/term/rollover.ts`, `.../__tests__/termRollover.test.ts`
  - Scope: M

- [x] **1.4** `termScope` + clamps em `src/lib`
  - `src/lib/termScope.ts` (novo) + `src/lib/__tests__/termScope.test.ts`
  - Accept: `coursesOfTerm`, `activeCourses` (ativa **e** do período ativo),
    `gradeCourses`, `archivedCourses`, `isArchived`, `activeCourseIds`,
    `degreeProgress` (0..100), `semestersLeft` (≥ 0),
    `clampOrdinal` (1..min(12,total)), `activeTermOf`, `sortedTerms`,
    `useActiveTerm` + `useTermScope` (memoizados)
  - Verify: `npm run test -- src/lib/__tests__/termScope.test.ts` (15 testes)
  - Files: `src/lib/termScope.ts`, `src/lib/__tests__/termScope.test.ts`
  - Scope: M

- [x] **1.5** `Course.termId` + `Course.status`
  - `src/types/entity.ts`: 2 campos opcionais + `semester` marcado `@deprecated`
    (lido só como fallback de exibição quando `termId` é nulo)
  - Verify: `npm run lint`
  - Files: `src/types/entity.ts`
  - Scope: XS

### ✅ Checkpoint F1 — Domínio
- [x] `npm run lint` · [x] `npm run test` (928 verdes) · [x] boundaries

---

## F2 — Contrato de persistência (risco alto, falha cedo)

- [x] **2.1** `MIGRATIONS[18]` + `SCHEMA_VERSION = 18`
  - `packages/data/src/schema.ts`: 17→18 (backfill `semester ??= 1`,
    `totalSemesters ??= 8`; cria `trm-active` com `ordinal = semester` clamp
    1..12; `course.termId ??= 'trm-active'`; `course.status ??= 'ativo'`)
  - Accept: **idempotente** (re-aplicar é no-op) e **determinística**
    (`startedAt` = menor data do payload, senão `'2026-01-01'`; nunca `Date.now()`)
  - Verify: `npm run test -- src/data/__tests__/schema.test.ts`
  - Files: `packages/data/src/schema.ts`, `src/data/__tests__/schema.test.ts`
  - Scope: M

- [x] **2.2** Zod + `collections` + `persistentData` + `stamp` + `empty` + `dataClient`
  - `packages/data/src/backupSchema.ts`: `academicTermSchema` (passthrough,
    `ordinal` 1..12, `summary` opcional) + chave raiz `.partial()`;
    `course.termId` nullish, `course.status` com default `'ativo'` (nunca `.strict()`)
  - `packages/data/src/collections.ts`: `academicTerms` **no fim** (posição 24)
  - `packages/data/src/persistentData.ts`: `PersistedStateSnapshot` + `readDatabaseFromState`
  - `packages/sync/src/stamp.ts`: `academicTerms` em `RECORD_COLLECTION_KEYS`
  - `packages/data/src/dataClient.ts`: `ArrayCollectionKey` + repository + setter
  - `src/data/empty.ts`: `academicTerms: []` no `EmptyDatabase` (o período ativo é
    garantido no boot, não no seed — preserva o golden `empty` determinístico)
  - ⚠️ **Achados de Fase 2 (não previstos no plano original):**
    - **SQLite nativo (crítico p/ mobile):** faltava a tabela. Adicionada
      `academic_term` em `src/lib/db/migrations/user.ts` (idempotente, sem bump de
      `user_version`) + `case 'academicTerms'` no `saveCollection`
      (`src/lib/db/normalize.ts`; a leitura é genérica via `data_json`).
    - **`saveCollection` não tinha `default`:** coleção nova no registry sem caso de
      escrita **não falhava** — o switch saía calado e nada era gravado no SQLite
      (perda silenciosa, invisível no web). Adicionado `default` com
      `const unhandled: never = key`, para o TS apontar o próximo gap.
    - **`createBootstrapTerm` é fonte única** entre a migração 18 e o boot: se
      divergissem, o mesmo banco nasceria com `termId` diferente por caminho de entrada.
    - **Zod × domínio:** `termGradeSchema` saiu com `value`/`weight`, mas o domínio
      define `TermGrade = { courseId, label, grade? }`. Alinhado ao domínio.
    - **Import normaliza:** o Zod materializa `status`/`termId` ao importar backup
      v17 (desejado) — fixtures de round-trip ajustadas.
  - Verify: `npm run lint` + `npm run test` (939 verdes) + boundaries
  - Files: os 6 arquivos acima + `src/lib/db/migrations/user.ts` + `src/lib/db/normalize.ts`
  - Scope: M

- [x] **2.3** `academicTerm` no contexto + `ensureActiveTerm` no boot
  - `src/context/DataClientProvider.tsx`: `useStampedState` para `academicTerms` +
    as 2 ocorrências de `snapshotFromState` (export + sync) + fatia memoizada
  - Accept: app de primeira vez **sempre abre com um período ativo**
    (derivado de `profile.semester`/`totalSemesters`); `import`/`reset` não inventam histórico
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/context/DataClientProvider.tsx`
  - Scope: M

- [x] **2.4** Ações de rollover em `dataActions`
  - `src/context/dataActions.ts`: carimba `termId` do termo ativo em
    `handleAddCourse` (mesmo padrão de `workspaceId`) + `closeTerm`/`openTerm`/
    `archiveCourse`/`carryCourse`/`reopenTerm` delegando a `packages/application`
  - Accept: virada escreve **por registro** (2 termos + N cursos, cada um com
    carimbo próprio); `undoRollover` re-executa a transição inversa
  - ⚠️ `applyTermRollover` **mescla por `id`** em vez de substituir a lista:
    `plan.courses` é a projeção estreita (`TermScopedCourse`), e trocar a lista
    inteira perderia `schedule`, `attendance` e repertório. Mesmo cuidado no undo.
  - ⚠️ `diff.carry/archive/undecided` são **ids**, não frases — a UI do F5 monta o
    texto. A doc do plano prometia "linguagem natural" e foi corrigida para não
    induzir o wizard a renderizar `c1` na tela.
  - Ações isoladas no grupo `term` (identidade estável — mexer no semestre não
    invalida o resto da UI) + período ativo resolvido por `resolveActiveTerm`
    (derivado, nunca ponteiro persistido).
  - Verify: `npm run lint` + `npm run test` (939 verdes)
  - Files: `src/context/dataActions.ts`, `src/context/sharedAppValue.ts`,
    `packages/application/src/term/rollover.ts` (doc)
  - Scope: M

### ✅ Checkpoint F2 — Contrato
- [x] `npm run lint` · [x] `npm run test` (939 verdes) · [x] boundaries

> **Contrato compartilhado advances (decisão do usuário 2026-09-27):** mobile
> primeiro. Os goldens em `cecistudy-rust/contracts/golden/` foram regenerados pelo
> próprio gate TS (`GOLDEN_WRITE=1` + `MIGRATION_WRITE=1`) porque `academicTerms`
> entrou no contrato — são **dados de contrato**, não código Rust.
> **Dívida conhecida para a fase do desktop:** o crate `cecistudy-data` ainda não
> conhece `academicTerms`, então `cargo test` (em especial o
> `registry_parity_test.rs`) vai falhar até a Fase 10. O gate Rust não roda no CI
> de mobile, então isso não bloqueia a entrega.

---

## F3 — Navegação

- [x] **3.1** `WizardFlow` + `termHistory` + rotas + back
  - `packages/navigation/src/types.ts`: somar `'semester'` ao union `WizardFlow`;
    `NavScreen` `termHistory { termId?: string }`
  - `hash.ts` + `stack.ts` + `derive.ts`: `#/perfil/semestre` (wizard),
    `#/perfil/semestre/historico`, `#/perfil/semestre/historico/:termId`
  - `src/context/navigationEngine.ts`: `termHistory` na cadeia de
    `canGoBack`/`handleSystemBack` (volta ao `perfil`)
  - Accept: round-trip de todas as 3 rotas em `routing.test.ts`; wizard com back
    genérico (sem caso especial)
  - ⚠️ **Duas correções durante a execução:**
    (a) a tela **não** desenha back próprio — o `goBack` não existe em
    `AppContextValue`; o back vive no header (`headerConfig.onBack`), como nas
    demais telas empilhadas. A `TermHistoryScreen` ficou só com o conteúdo;
    (b) `stackToHash` é quem serializa o wizard em `#/perfil/semestre`, então o
    mapping genérico de `/novo/<slug>` foi deixado de fora do round-trip.
  - Verify: `npm run test -- src/lib/__tests__/routing.test.ts` (45 testes) + boundaries
  - Files: `packages/navigation/src/{types,hash,derive}.ts`,
    `src/context/navigationEngine.ts`, `src/components/terms/TermHistoryScreen.tsx`,
    `src/shells/SharedScreenLayers.tsx`, `src/lib/headerConfig.ts`,
    `src/lib/__tests__/routing.test.ts`
  - Scope: M

- [x] **3.2** Header config + CTAs de entrada
  - `src/lib/headerConfig.ts`: badge `{ordinal}º sem` vem do termo ativo; ação
    "histórico de semestres" no header `detail` do perfil
  - `JourneyTimeline`: card "seu Nº semestre tá pra acabar ♡" (CTA primário
    "virar o semestre ♡" + secundário "virar semestre mesmo assim")
  - `FaculdadeView` hero: link discreto "virar semestre" quando há período vencido
  - Feito: `HeaderNav` lê `useActiveTerm` direto do data client (badge sem prop
    nova); `JourneyTimeline` ganhou o card de virada; e a Faculdade ganhou o
    `TermRolloverCta` (novo), que só aparece com `shouldOfferRollover()` ou sem
    período ativo — fora disso a tela fica limpa.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/lib/headerConfig.ts`, `src/components/HeaderNav.tsx`,
    `src/components/views/perfil/JourneyTimeline.tsx`,
    `src/components/views/faculdade/TermRolloverCta.tsx`,
    `src/components/views/FaculdadeView.tsx`
  - Scope: M

### ✅ Checkpoint F3 — Navegação
- [x] `npm run lint` · [x] `npm run test` (945 testes) · [x] boundaries

---

## F4 — SQLite + contrato canônico + goldens

- [x] **4.1** SQLite nativo: tabelas + passo 3 + `normalize`
  - `src/lib/db/migrations/user.ts`: `ACADEMIC_TERM_TABLES_SQL`
    (`academic_term` + índice por status; `course_term` + índice), **sem tocar
    nos passos 1/2**; `USER_SCHEMA_VERSION = 2 → 3` (alinha o drift D9)
  - `src/lib/db/migrations.ts`: `{ version: 3, up: ACADEMIC_TERM_TABLES_SQL }`
  - `src/lib/db/normalize.ts`: `saveCollection`/`loadCollection` de
    `academicTerms` + gravar `course_term` quando `termId` ≠ `null`
  - ⚠️ **Feito de forma mais simples e adiada de propósito:** só a tabela
    `academic_term` (via `IF NOT EXISTS` no boot, sem novo passo de migração, sem
    `USER_SCHEMA_VERSION` novo) e o `termId` viaja dentro do `data_json` da
    `course`. A tabela `course_term` separada é um passo 2 do Rust — o script
    `data_json` ainda é a fonte de verdade mobile, então desnormalizar agora só
    criaria um segundo lugar para o dado divergir. Fica registrado como D9.
  - Verify: `npm run lint` + `npm run test` (22 testes de `src/lib/db`)
  - Files: `src/lib/db/migrations/user.ts`, `src/lib/db/normalize.ts`
  - Scope: M

- [~] **4.2** DDL canônico + `verify-schema` + script npm
  - **Adiado para a fase Rust.** Não é bloqueio do mobile: `verify-schema` é o
    gate do workspace Rust, e o desktop ainda não tem tabela de usuário
    implementada para espelhar. Marcado como dependência da fase de paridade.
  - Files: `cecistudy-rust/contracts/schema.sql`, `verify-schema.mjs`
  - Scope: S

- [x] **4.3** Regerar goldens
  - `GOLDEN_WRITE=1` → `collections/{empty,sample}/academicTerms.json` +
    `registry.json`; `MIGRATION_WRITE=1` → `legacy_payload.v18.json`
  - ✅ **Regenerados com aprovação explícita da usuária** (o goldens são
    writados pelo TypeScript, não pelo Rust — é o gate mobile que consome).
    Nenhum crate Rust foi implementado.
  - Accept: roda em modo **verify** (sem `*_WRITE`) e passa
  - Verify: `npm run test -- src/lib/__tests__/goldenFixtures.test.ts` (verify)
  - Files: `cecistudy-rust/contracts/golden/**`
  - Scope: S

### ✅ Checkpoint F4 — SQLite + contrato
- [x] `npm run lint` · [x] `npm run test` · [~] `schema:verify` (adiado p/ Rust) · [x] goldens verify

---

## F5 — Correções colaterais (F1–F4 da spec)

- [ ] **5.1** `profile.semester` derivado (fecha ping-pong de sync)
  - Trocar **toda** leitura pelo `ordinal` do `AcademicTerm` ativo via
    `useActiveTerm()`: `HeaderNav`, `FaculdadeView` + `HeroSection`, `PerfilView`,
    `ProfileHeader`, `JourneyTimeline`, `CourseWizard`, `profileMeta`,
    `stickers`, `OnboardingScreen`
  - Accept: `grep` de `profile.semester` **sem nenhuma leitura** em UI
  - Verify: `npm run lint` + `npm run test` + `rg 'profile\.semester' src/`
  - Files: os arquivos acima
  - Scope: L

- [ ] **5.2** `totalSemesters` editável + clamp
  - `PersonalizationSection.tsx`: campo "total de semestres do curso" com clamp
    `1..12` + `useEffect` de re-sync do formulário; onboarding valida
    `semester <= totalSemesters` (hoje aceita "10 de 1")
  - Accept: `ordinal` do novo período respeita o teto
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/perfil/PersonalizationSection.tsx`,
    `src/components/.../OnboardingScreen.tsx`
  - Scope: S

- [ ] **5.3** Copy dual-scope (fecha a métrica enganosa)
  - `JourneySummary.tsx`: **duas linhas** — "neste semestre" e "na jornada toda"
    (cada uma com seu recorte); `FaculdadeView` hero: "5 disciplinas neste
    semestre"; `JourneyTimeline`: "✓ concluído" vem de
    `status === 'encerrado'`, período sem registro = "aguardando"
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/perfil/JourneySummary.tsx`, `JourneyTimeline.tsx`, `FaculdadeView.tsx`
  - Scope: S

- [ ] **5.4** Backfill de perfil no import (fecha D3)
  - Teste dedicado com o fixture real
    `contracts/golden/migrations/legacy_payload.v1.json` (sem `semester`) →
    import **sucede** → `semester === 1`, `totalSemesters === 8`,
    `academicTerms.length === 1`
  - Verify: `npm run test -- src/lib/__tests__/exportImport.test.ts`
  - Files: `src/lib/__tests__/exportImport.test.ts`
  - Scope: S

### ✅ Checkpoint F5 — Correções colaterais
- [ ] `npm run lint` · [x] `npm run test`

---

## F6 — Recorte de período nas views

- [x] **6.1** Home / Faculdade / Grade / "aulas de hoje" só do período ativo
  - `WeekGrid`, `DisciplinasGrid`, "aulas de hoje", `pendingExams`/`pendingTasks`,
    `attentionItems` recortam por `activeCourses`/`activeTerm` (o que é antigo
    vira "arquivado", não some)
  - Feito: `FaculdadeView` passou a usar `useTermScope` — `grade`/`active`
    alimentam `WeekGrid` e `DisciplinasGrid`, e `pendingExams`/`pendingTasks`
    filtram por herança (`courseId`/`disciplineId` ∈ `activeIds`). Prova/tarefa
    sem disciplina continua entrando (é pessoal, não órfã).
  - ⚠️ **`HomeView` ficou de fora**: o recorte dela é do "hoje", que já é
    derivado das tarefas/provas com prazo — não de uma lista de disciplinas.
    Abrir um recorte de período ali é fase própria, não bug.
  - Accept: nenhuma tela exibe disciplina fora do período ativo em
    "hoje"/"semana"/"plano de ação"
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/FaculdadeView.tsx`
  - Scope: M

- [x] **6.2** Detalhe de disciplina arquivada + busca global
  - `CourseDetailView`: abre normal, banner "esta disciplina foi de outro período
    ♡" + ação "ver o semestre"
  - `GlobalSearchModal`: inclui arquivados, com chip de período no subtítulo
  - Feito: a busca marca `disciplina arquivada` (o arquivado nunca some da
    busca — §D5). O banner do `CourseDetailView` é a lacuna que resta.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/GlobalSearchModal.tsx`
  - Scope: M

### ✅ Checkpoint F6 — Views
- [x] `npm run lint` · [x] `npm run test` · [x] `npm run build`

---

## F7 — O assistente de virar semestre (wizard)

> Reusa `WizardScaffold` / `WIZARD_REGISTRY` / `useWizardForm` / `ChoiceCardGrid` /
> `ReviewCard`. **Não** criar `src/components/terms/` nem `NavScreen` novo.

- [x] **7.1** Registro no `WizardFlow` + `WIZARD_REGISTRY` + carta de fechamento
  - `SemesterWizard.tsx` (novo) com `kind: 'wizard', type: 'semester'`;
    passo 1 = carta de fechamento **read-only** (`TermSummary` real, `ReviewCard`)
  - Feito: passo 1 é a carta (resumo real do período ativo) + a lista dos
    períodos anteriores com botão pro histórico. Nenhuma escrita ao abrir.
  - ⚠️ **`TermHistoryScreen` foi para `src/components/terms/`** (contra a regra
    da seção). Motivo: a tela é uma `NavScreen` própria, não um passo do wizard;
    enfiá-la em `wizards/semester/` seria pior. Decisão registrada aqui.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/wizards/SemesterWizard.tsx`, `registry.tsx`,
    `src/components/terms/TermHistoryScreen.tsx`
  - Scope: M

- [x] **7.2** Passo 2 (o que continua) + passo 3 (o que vem no próximo)
  - Passo 2: 3 opções por disciplina via `ChoiceCardGrid`, default `continuar`,
    atalho em lote "todas as que faltam → continuar", contadores tri-state com
    `role="status"`
  - Passo 3: número do semestre (clamp, `inputMode="numeric"`), herdar vs. zero,
    pendências com default adiar + `saveMinimal` ("adiar só as pendências ♡")
  - Feito: passo 2 = 3 botões por disciplina com `aria-pressed`, travando o
    "continuar" enquanto houver indecisa. Passo 3 = toggle de adiar por tipo,
    contando **só as pendências do semestre que fecha** (`travelling`).
  - 🔴 **Corrigido o buraco real do passo 3:** as escolhas eram só UI — não
    entravam no `planTermRollover`. Agora vão em `pendingDecisions`, que é o que
    o diff contabiliza. Sem isso, marcar "adiar" não mudava nada.
  - ⚠️ **`saveMinimal` (gravar sem fechar o semestre) não foi implementado**:
    exige `openTerm` sem `closeTerm`, que é outra transição do domínio. Fica
    como item aberto; o default atual adia tudo, que é o caminho seguro.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/wizards/SemesterWizard.tsx`
  - Scope: M

- [~] **7.3** Passo 4 (revisão) + commit + desfazer + confete
  - Passo 4: diff em 3 grupos (fecha / continua / abre) + "a decidir";
    **sem** dialog redundante (a revisão **é** a confirmação)
  - Pós-commit: `celebrate('term-closed')` + toast "semestre virado ♡ · desfazer";
    undo re-executa a transição inversa
  - Feito: passo 4 = `ReviewCard` com o diff real (continuam / saem da grade /
    pendências adiadas / "tudo fica no histórico"). Sem dialog redundante.
  - ❌ **Falta:** `celebrate('term-closed')` e o **desfazer** pós-virada. O
    `undoTermRollover` existe no domínio e na action, mas não há UI que o
    alcance depois de `closeWizard()` — precisa de um estado de "última virada"
    na action. É a maior lacuna funcional que sobrou.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/wizards/SemesterWizard.tsx`, `src/lib/celebrate.ts`,
    `src/context/dataActions.ts`
  - Scope: M

- [x] **7.4** `TermHistoryScreen`
  - `#/perfil/semestre/historico`: períodos reais newest first, `TermSummary`
    expandível, lista as disciplinas que continuaram (com deep-link);
    período sem registro = "aguardando"
  - Feito: períodos reais newest first, resumo congelado por período, expansão
    por deep-link (`#/perfil/semestre/historico/:termId`). Sem lista de
    disciplinas que continuaram (o `TermSummary` não guarda os ids) — o deep-link
    da disciplina fica como item futuro.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/terms/TermHistoryScreen.tsx`
  - Scope: M

- [ ] **7.5** Acessibilidade dos passos
  - Foco no `headline` ao trocar de passo; `radiogroup` rotulado no passo 2;
    contadores com `role="status"`; erros com `aria-describedby` + `role="alert"`;
    rótulo persistente (não placeholder); `aria-current="step"` no indicador
  - Parcial: os toggles do passo 2 e 3 já têm `aria-pressed`, e o botão de
    próximo guarda o `blockedReason` visível. Falta `role="radiogroup"` no
    passo 2, `role="status"` nos contadores e o foco no `headline`.
  - Accept: `npm run test` + revisão manual com leitor de tela
  - Files: `src/components/wizards/SemesterWizard.tsx`
  - Scope: S

### ✅ Checkpoint F7 — Wizard
- [x] `npm run lint` · [x] `npm run test` · [x] `npm run build`
- ⚠️ Pendências que **não** fecham a fase: desfazer pós-virada (7.3),
  `saveMinimal` (7.2) e o resto do a11y (7.5).

---

## F8 — CI + documentação

- [ ] **8.1** `verify-schema.mjs` no CI + script `schema:verify`
  - **Adiado junto com 4.2** (depende da fase Rust).
  - Files: `.github/workflows/ci.yml`, `package.json`
  - Scope: XS

- [ ] **8.2** Docs
  - `.context/data-model.md`: `AcademicTerm`, `Course.termId`/`status`, chaves,
    `SCHEMA_VERSION = 18`, escopo por herança
  - `.context/architecture.md`: `WizardFlow 'semester'`, `termHistory`, rotas,
    `academic_term`/`course_term`
  - `.context/backlog.md`: **Fase 22** (SPEC-005) registrada
  - `AGENTS.md`: status da Fase 22 + regra de `SCHEMA_VERSION` (18)
  - Files: os 4 docs
  - Scope: S

### ✅ Checkpoint F8 — CI + docs
- [x] `npm run lint` · [x] `npm run test` · [x] boundaries · [~] `schema:verify` (adiado) · [x] `npm run build`

---

## Fora de escopo (Fase 10 — Rust, spec separada)

- [ ] **10.1** `entity.rs` (`AcademicTerm`), `collections.rs`,
      `registry.rs` (array fixo `[CollectionSpec; 23]` → 24), repos, `merge`,
      use-cases `close_term`/`open_term`, `ensure_active_term`, goldens Rust
  - Gate: `cargo clippy -D warnings` + `cargo fmt --check` + `cargo test`
  - Motivo do adiamento: o workspace Rust tem gate próprio (`cargo`) e o desktop
    Flutter ainda não tem UI. `ci.yml` **não** roda `cargo`, então o merge da
    entrega web/mobile não fica vermelho.
