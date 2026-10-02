# To-do: Virada de semestre — entradas, correção de números e navegação (SPEC-008)

> Spec: [`../docs/specs/SPEC-008-virada-de-semestre-entradas-e-navegacao.md`](../docs/specs/SPEC-008-virada-de-semestre-entradas-e-navegacao.md)
> Plano: [`./plan-virada-entradas-navegacao.md`](./plan-virada-entradas-navegacao.md)
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` + `npm run build` verdes, e
> `git diff --stat contracts/` **vazio**. `SCHEMA_VERSION` fica **19** a fase inteira.

**Progresso:** 6/6 fases ✅ (F0 · F1 · F2 · F3 · F4 · F5) — SPEC-008 implementada

---

## F0 — Blindagem (N1, N3)

Testes que **falham** pelos bugs, antes de qualquer código de produção. Nenhum arquivo de
produção é tocado nesta fase.

> **Escopo de F0 = só o que F1 e F2 precisam.** As demais fases escrevem o próprio teste
> primeiro, dentro da fase (test-first por fase). Isso evita deixar a árvore vermelha por
> duas fases inteiras.

- [x] **F0.1** `term.test.ts` — inverter os 3 casos de `shouldOfferRollover` (`:340-350`) para
      `shouldNudgeRollover`: `false` com 1 mês e `ordinal < total`; `true` com 4 meses;
      `true` se `ordinal >= total`; `false` com `null`.
  - *Accept:* o teste descreve a **intenção** (ênfase), não o bug (data de encerramento).
  - *Files:* `packages/domain/src/core/domain/__tests__/term.test.ts`
- [x] **F0.2** `term.test.ts` — `canRollover`: `null → false`, `ativo → true`,
      `encerrado → false`, `planejado → false`.
  - *Files:* idem
- [x] **F0.3** `routing.test.ts` — **inverter** `:521-526`: `routeToStack({ tab: 'perfil',
      termHistory: true })` espera `[perfil, termHistory]` (2 telas, **sem** o wizard).
  - *Files:* `src/lib/__tests__/routing.test.ts`
- [x] **F0.4** Baseline vermelho registrado:
  - `tsc --noEmit` → **exatamente 2 erros**, ambos `has no exported member` (as funções novas
        ainda não existem). Nenhum outro erro: a reescrita do arquivo não introduziu dano.
  - `term.test.ts` → **34 pré-existentes verdes / 7 novos vermelhos** (`is not a function`).
        Os 34 provam que a reescrita do arquivo preservou tudo.
  - `routing.test.ts` → **44 verdes / 1 vermelho**: `expected [ Array(3) ] to deeply equal
        [ Array(2) ]` — a pilha de 3 telas é literalmente o bug N3.
  - Round-trip (`stackToHash` → `parseRoute`) continua verde: a URL não muda, só a base.

**Verificação:** ✅ baseline vermelho por motivo certo, e só por ele.


---

## F1 — Domínio: o botão é sempre, o aviso é que é condicional (N1, D1)

Mata a causa de raiz. Um arquivo de domínio, dois arquivos de call-site, zero wizard.

- [x] **F1.1** `ROLLOVER_NUDGE_MONTHS = 4` + helper interno `monthsElapsed(from, to)` (meses
      inteiros, com o ajuste do dia — 28/02 → 27/06 são 3 meses, não 4).
- [x] **F1.2** `canRollover(term): term is AcademicTerm` — estrutural, **sem data e sem
      número**: `status === 'ativo'`. É type guard, então `term!` some dos call-sites.
- [x] **F1.3** `shouldNudgeRollover(term, today, total, { nudgeAfterMonths? })` — meses desde
      `startedAt` `>=` o limiar **ou** `ordinal >= total`.
      `shouldOfferRollover` **removido**.
- [x] **F1.4** Docstring em `canRollover` explica **por que** o ramo `endedAt` era morto,
      para ninguém "simplificar" de volta.
- [x] **F1.5** Call-sites: `FaculdadeView.tsx` e `perfil/JourneyTimeline.tsx`.
      `grep -rn shouldOfferRollover src/` → **zero**. Em `packages/` só sobram comentários
      históricos (o da docstring nova é intencional); `schema.ts:438` e
      `application/term/rollover.ts:386` foram atualizados.
- [x] **F1.6** `term.test.ts` 41/41 verde.
- [x] **F1.7** *(desvio do plano, absorvido aqui)* A variante quieta do
      `TermRolloverCta` entrou em F1 em vez de F3. Sem ela a correção de F1 seria
      **inútil**: `if (!due && term) return null` continuaria escondendo o botão, e trocar
      só o predicado mostraria "tá chegando no fim" no primeiro mês do semestre. Era um
      arquivo de 81 linhas; deixar a separação(make it look like two phases) custaria um
      estado intermediário com copy mentirosa no ar.
      - Props `due: boolean` → `available` + `nudge` (`canRollover` / `shouldNudgeRollover`).
      - Variante **quieta**: borda neutra, sem `Sparkles`, copy "tá guardando tudo que você
        anota" no lugar de "tá chegando no fim". O botão **virar** continua ali.
      - `JourneyTimeline` idem.
  - *Nota de spec:* o nome da opção no plano era `monthsPerTerm`; virou `nudgeAfterMonths`
    (o anterior descrevia mal um limiar de meses).

**Verificação:** ✅ `tsc` 0 erros · `vitest` **1080/1081** (a única falha é o teste de F2) ·
boundaries OK · `build` OK em 8.5s.


---

## F2 — Navegação: o histórico é irmão do wizard (N3, D5)

Bug triplicado. Corrige os **três** lugares, senão o reload traz o bug de volta.

- [x] **F2.1** `openTermHistory` (`navigationEngine.ts:1330`) — empilha sobre a base atual:
      base `perfil` → mantém a base (virando do assistente: `[perfil, wizard, termHistory]`);
      senão → `[perfil, termHistory]`. Filtra um `termHistory` anterior antes de
      empilhar, então chamar de novo só troca o `termId` do topo (idempotente).
- [x] **F2.2** `routeToStack` (`hash.ts:332-338`) → `[{perfil}, {termHistory}]` (2 telas).
      **URL não muda** — o round-trip `stackToHash`/`parseRoute` segue idêntico.
- [x] **F2.3** `TermHistoryScreen.tsx:59` — expandir/recolher em `useState` local
      (`expandedId`), com toggle. `focusedTermId` virou só o valor **inicial** (deep-link
      abre o card certo) e não é mais Controlled pela URL.
- [x] **F2.4** Os 4 doc-comments que justificavam o bug reescritos (`navigationEngine.ts`,
      `headerConfig.ts:169-171`, `TermHistoryScreen.tsx:10-13`, `hash.ts:287-290`).
  - *Accept:* `grep` dos 4 textos → **vazio** ✅
- [x] **F2.5** `routing.test.ts:521-526` verde; `navigationRegression.test.tsx` e
      `TermHistoryScreen.test.tsx` existentes continuam verdes sem alteração.
- [x] **F2.6** Teste novo (N3e): abrir/fechar o resumo não chama `openTermHistory`; 5
      expansões não empilham 5 telas. `TermHistoryScreen.test.tsx` 3 → 5 testes.

**Verificação:** ✅ `tsc` 0 erros · `vitest` **1083/1083** (100% verde) · boundaries OK ·
`build` OK em 8.9s.


---

## F3 — Superfície dos números (N2, N4, D2, D3)

O que a usuária mais sente. **Não mistura com F4.** Vai por partes, gate verde entre elas.

> Test-first dentro da fase: os 7 testes novos foram escritos **antes** do código
> (6 antigos verdes / 7 novos vermelhos), depois a implementação.

- [x] **F3.1** `dataActions.ts` — `setTotalSemesters(n)`, clamp `1..MAX_TERM_ORDINAL` no
      domínio (não só no input), com no-op quando o número não muda.
- [x] **F3.2** `JourneyTermCard` — stepper `− N +` para o total do curso, com
      `aria-label` nos dois botões.
- [x] **F3.3** `JourneyTermCard` — botão de **rótulo** "corrigir" (ícone + texto) com
      `.touch-target` (≥44px). O `aria-label` já existia; o que faltava era o rótulo
      visível e a área de toque (era `w-9 h-9` = 36px).
- [x] **F3.4** `JourneyTermCard` — `max` do input de `ordinal` → `MAX_TERM_ORDINAL` (12),
      **não** `totalSemesters`. **Quebra a trava circular** (N2b).
- [x] **F3.5** `JourneyTermCard` — aviso explícito quando `ordinal > totalSemesters`
      ("seu 9º está além dos 8 do curso — ajusta o total aqui embaixo ♡"), no lugar do
      100% + "faltam 0 semestres" silenciosos.
- [x] **F3.6** `JourneyTermCard` — ação primária **"virar o semestre ♡"**; sem período
      ativo → **"abrir meu 1º semestre ♡"**.
- [x] **F3.7** `PerfilView.tsx` — card movido para **logo abaixo do `ProfileHeader`**
      (antes de `JourneySummary`, funil, `StudyStats` e da timeline).
- [x] **F3.8** ~~`TermRolloverCta`~~ — **feito em F1** (a variante quieta/absoluto era
      pré-requisito da correção de domínio; sem ela o botão continuaria escondido).
- [x] **F3.9** `JourneyTimeline.tsx:91` — idem: **feito em F1** (`available` + `nudge`).
- [x] **F3.10** Testes: `JourneyTermCard.test.tsx` 6 → **13** (trava circular, aviso,
      stepper com teto/piso, rótulo 44px, virar/abrir o 1º).

**Achado que o plano tinha errado:** a trava circular **não era só o input**.
`dataActions.correctTermOrdinal` passava `profile.totalSemesters` como `cap` do
`retitleTerm`, e o domínio clampeava de novo. Abrir o `max` do input sozinho não
teria resolvido nada — corrigido nos dois lados. O contrato de `retitleTerm` (respeitar
um `cap`) continua intacto e testado; o que mudou é que o chamador para de usar o total
do curso como teto.

**Nota de produto:** o CTA de virada agora aparece em dois lugares do Perfil (o card no
topo e a timeline). É intencional — o card é o atalho, a timeline é o contexto —, mas
vale conferir na tela se não virou redundância.

**Verificação:** ✅ `tsc` 0 erros · `vitest` **1090/1090** · boundaries OK · `build` OK.


---

## F4 — Wizard + escopo (N5–N8, D4, D6, D7)

O wizard é o arquivo que **grava** o semestre. Não se mistura com F3.

- [ ] **F4.1** Passo 1 — input numérico do próximo `ordinal`, clamp `1..12`, com **preview do
      rótulo** ("7º semestre").
- [ ] **F4.2** Passo 0 — caso `activeTerm === null`: **"abrir o primeiro período"** com input
      de `ordinal`/`label` → `createAcademicTerm` + `openTerm`. **Nunca** `planTermRollover`
      nesse caminho. Some `canNext`/`blockedReason`/`if (!activeTerm) return` como becos.
- [x] **F4.3** `totalSemesters` NÃO é mais teto do `nextOrdinal` (SPEC-008 D3 venceu a
      SPEC-006 D8). O cap por total saiu de `planTermRollover`; o limite é `MAX_TERM_ORDINAL`.
- [x] **F4.4** Clamp **anunciado**: input de `ordinal` com `max={MAX_TERM_ORDINAL}` e um
      `role="status"` que diz o que foi ajustado ("deixei em 12º — o semestre vai de 1 a 12").
      Passar do total do curso vira **aviso** ("além dos 8 do curso"), não clamp.
- [x] **F4.5** `useWizardForm({ draftKey: 'semester', isDirty })` + `clearDraft()` no commit
      (nos dois caminhos: virada e 1º período).
- [x] **F4.6** `openCards` filtra os não revisados desde `activeTerm.startedAt`
      (`lastReviewed` — que **existe** em `Flashcard`, `entity.ts:215`).
- [x] **F4.7** a11y: `role="radiogroup"`/`role="radio"`/`aria-checked` + roving tabindex +
      setas no passo 2, `role="status"` nos contadores do passo 3, foco no `headline` a cada
      passo e `aria-current="step"` (lista `sr-only`) no scaffold.
- [x] **F4.8** `stickers.ts` — `StickerState.termOrdinal` (derivado do **período ativo**).
      `profileMeta.ts` **já** recebia o ordinal por argumento: nada a fazer.
- [x] **F4.9** `gradeCourses` → **`allActiveCourses(courses, terms)`**; `useTermScope.grade`
      passa a ser a união dos períodos ativos. Consumidor real: `FaculdadeView:65`
      (`getTodaySchedule`), que punha na grade de aulas a matéria de um semestre **encerrado**.
- [x] **F4.10** `JourneyTimeline` — `Map<ordinal, term>` a partir de `sortedTerms` (o mais
      recente vence) em vez de `find` por `ordinal`.
- [x] **F4.11** `clampOrdinal` (`termScope.ts:131`) — o `total` saiu do contrato; o teto é
      `MAX_TERM_ORDINAL`. O teste antigo (`clampOrdinal(9, 8) === 8`) era o que **fixava** a
      trava circular em código; foi reescrito.

### Conflito de spec que a F4 expôs — **resolvido: SPEC-008 D3 vence**

A SPEC-006 D8 e a SPEC-008 D3 diziam o oposto sobre o teto do `ordinal` do próximo
semestre. A 006 estava implementada e testada (B11: `at(8, 9) === 8`); a 008 é o que
F1/F3 já entregaram.

**Decisão:** a **008 vence**. O raciocínio: o total do curso é um palpite editável, e um
teto que depende de outro campo dá o pior resultado possível quando o palpite está errado
— a usuária digita 9, o passo de revisão promete "9º semestre" e a gravação joga 8 em
silêncio, sem nenhum lugar de onde "8" ter vindo. O aviso ("além dos 8 do curso — ajusta
no cartão") informa e ela **pode** corrigir, porque o total tem editor desde a F3. O clamp
esconde.

**O que mudou:**
- `planTermRollover`: `totalSemesters` não é mais teto do `nextOrdinal` (vira `@deprecated`,
  mantido no input por compatibilidade, mas sem efeito). O cap efetivo é `MAX_TERM_ORDINAL`.
- `clampOrdinal(ordinal)`: o `total` saiu da assinatura.
- B11 e o teste de `clampOrdinal` reescritos para o contrato novo, incluindo o caso que
  **falha se alguém voltar a passar o total** (`at(8, 9) === 9`).
- `SemesterWizard.test.tsx` ganhou um teste do **caminho de escrita**: digitar 9 num curso
  de 8 tem de chegar a `terms[nextTermId].ordinal === 9` no plano gravado.

**Débito do gate que veio junto (não era do plano):** o gate de tokens de movimento
pegou `WizardScaffoldHeader.tsx` com `duration: 0.35` inline, que estava no ratchet
`KNOWN_INLINE` por **número de linha** (75) — minha inserção da lista acessível
empurrou para 82. Em vez de renumerar (ratchet por linha é frágil e quebra de novo na
próxima edição), **paguei a dívida**: a barra agora usa `BASE_D.step` + `EASE.standard`
e a entrada saiu do `KNOWN_INLINE`. O ratchet só encolhe.

**Verificação:** ✅ `tsc` 0 · `vitest` **1112/1112** (106 arquivos) · boundaries OK ·
`build` OK. Testes novos: `SemesterWizard.test.tsx` (13) e `WizardScaffold.test.tsx` (4).

---

## F5 — Fechamento

- [x] **F5.1** Testes do `SemesterWizard` — **`SemesterWizard.test.tsx`, 13 testes** (não
      existia nenhum): 1º período grava sem `planTermRollover`, `ordinal` default = `ativo+1`
      (ou 1), trava circular quebrada **no caminho de escrita** (9 em curso de 8 chega ao
      plano), clamp de teto com `role="status"`, piso 1, recado que some, flashcards só os
      não revisados, radiogroup + setas.
- [x] **F5.2** `JourneyTermCard.test.tsx` (13) e `JourneyTimeline.test.tsx` (3, novos) +
      `WizardScaffold.test.tsx` (4, novo, para a parte compartilhada do a11y).
- [x] **F5.3** Critérios de aceite da SPEC-008: os **20** marcados. Os que não ganharam teste
      dedicado foram verificados no código: N1 (CTA no Perfil + Faculdade), N4c
      (`TermHistoryScreen:38` reabre → o `corrigir` do card ajusta), N3e (grep recursivo
      em `src/` e `packages/` → vazio), N3c (`routing.test.ts:524` = 2 telas +
      `TermHistoryScreen:36` semeia `expandedId` do `focusedTermId`).
- [x] **F5.4** **SPEC-006 reconciliada**: cabeçalho → implementada, com nota de que o B11/D8
      foi revisto pela SPEC-008. A spec já tinha a tabela de reconciliação; o que estava
      contraditório (linhas que diziam "passar `totalSemesters`") foi corrigido.
- [x] **F5.5** `.context/backlog.md` Fase 22 → `[x]`, com a lista "Corrigido depois" e as
      pendências que **continuam** marcadas como tal (`saveMinimal`, banner do
      `CourseDetailView`, `HomeView` por período, `schema.sql` para a fase Rust).
- [x] **F5.6** `AGENTS.md` ganhou a regra de **SPEC-008** (o cap nunca é o total; o histórico
      é irmão; sem período ativo é `openFirstTerm`).
- [x] **F5.7** SPEC-008 marcada `✅`; SPEC-006 marcada implementada.
- [x] **F5.8** `SCHEMA_VERSION` = **19** (intocado). `cecistudy-rust/contracts/` não foi
      tocado — nenhum crate Rust, nenhum golden. **Não** foi possível rodar
      `git diff --stat contracts/` porque o diretório **não é um repositório git**; a
      verificação foi feita por inspeção do que foi editado.

**Dívida de spec que apareceu e foi paga:** a SPEC-005 documentava o contrato antigo de
`clampOrdinal` (`(n, total)`, `1..min(12, total)`) em dois lugares. Corrigidos os dois, com
nota de que a revisão veio da SPEC-008 D3.

**Verificação final:** `npm run lint` 0 erros · `npm run test` **1112/1112** (106 arquivos) ·
boundaries OK · `npm run build` OK.

---

## Fora de escopo (fica aberto)

- `saveMinimal` (gravar sem fechar o período) — sem consumidor da SPEC-006; o padrão seguro
  (adiar tudo) é o default.
- `schema.sql` canônico + `verify-schema` — adiado para a fase Rust (a `course_term`
  desnormalizada é passo 2 do Rust).
- Paridade Rust da SPEC-006/008 — nenhum crate tocado.
- Acessibilidade do `PerfilView` fora do card do período.
