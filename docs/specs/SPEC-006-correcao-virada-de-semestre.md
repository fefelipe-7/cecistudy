# Spec: Correção da virada de semestre (SPEC-005 em produção)

> **Status: implementada (2026-09-28), com um item revisto pela SPEC-008.**
> Lê-se junto com a
> [SPEC-008](SPEC-008-virada-de-semestre-entradas-e-navegacao.md).
> **O cabeçalho original dizia "especificada (aguardando implementação)" — isso já não era
> verdade.** O inventário de bugs (B1–B18) foi escrito contra um código que já evoluiu.
> A reconciliação item a item (o que foi implementado, o que continua aberto, e o que foi
> **absorvido pela SPEC-008**) está no § *Reconciliação com a SPEC-006* da SPEC-008 — é lá
> que o status real mora. **Não implemente daqui o que a SPEC-008 absorveu** (B5, B6,
> B7-editor, B11, B12, B13, B14, D6, D11): está especificado lá, com o diagnóstico atualizado.
> **B11 (D8) foi revisto:** o cap de `nextOrdinal` por `totalSemesters` foi **removido** —
> a SPEC-008 D3 vence. Ver o critério N5b da SPEC-008.
> Origem: auditoria de ponta a ponta da implementação de SPEC-005 (SPEC-005 §Correções
> colaterais F1–F4 e §User Stories) + verificação manual de cada achado no código.
> **Escopo: só o mobile (React/TS).** Nenhum crate Rust é tocado; os goldens TS são
> regerados ao final (o gate que o mobile consome).
> **Veredito: implementação precisa de intervenção.** Não é polimento — 7 bugs
> confirmados, 4 deles no caminho crítico que a usuária mais usa.

---

## Objetivo

A virada de semestre (SPEC-005) foi entregue e **não funciona**: seleciona o semestre
errado, não deixa corrigir o número, promete um "desfazer" que não existe, e trata um
curso de 10 semestres como se fossem 8. O app ficou com **duas fontes de verdade
desencontradas** e **nenhum caminho de volta**.

Esta spec é a **correção**, não uma redesenho. O modelo de domínio (`AcademicTerm`,
escopo por herança, resumo congelado) está **certo** e é mantido. O que está errado é a
**superfície**: onde os números vivem, quem os escreve, e se dá para voltar atrás.

### Goals

1. **Um único lugar responde "qual semestre eu tô"** — e é o único que dá para **mudar**.
2. **A virada é reversível de verdade** (o passo 4 do wizard já promete isso na tela).
3. **Um período ativo só, garantido** — a invariante que a spec pediu existe como código
   morto; passa a rodar.
4. **`totalSemesters` é 10 e é da usuária** (Psi brasileira = 10 semestres).
5. **Os controles nascem onde a pergunta já é feita** — sem obligar a aprender lugar novo.
6. **Zero leitura de `profile.semester` na UI** (fecha a task 5.1 da SPEC-005, aberta).

### Non-goals

- **Não** é redesenhar o modelo de domínio. `AcademicTerm`, `TermSummary`, o escopo por
  herança e as transições monotônicas continuam como estão.
- **Não** é transcript oficial, cálculo de média, reprovação, matrícula ou multi-curso.
- **Não** é toque no workspace Rust (gate próprio, `cargo`; desktop Flutter sem UI).
- **Não** é remover o `profile.semester` do contrato persistido — ele sai da **UI**,
  não do schema (paridade Rust + goldens + `backupSchema.ts`).
- **Não** éimplementar `saveMinimal` ("adiar só as pendências, gravar sem fechar").
  Continua item aberto, e o padrão seguro (adiar tudo) é o default.

---

## Diagnóstico

### 1. A causa-raiz: o `ordinal` do período é escrito uma vez e nunca mais

Este é o defeito **estrutural** que produz quase todos os outros.

```
empty.ts:39          profile.semester = 1          (app nasce no 1º semestre)
        ↓
DataClientProvider:463-474   ensureActiveTerm() no boot
        ↓
schema.ts:113-129    createBootstrapTerm()  →  ordinal = clamp(profile.semester)
        ↓  ← ÚNICA ESCRITA DE ordinal que existe
academicTerms        vira a fonte da verdade (HeaderNav:213, FaculdadeView:90, PerfilView:207)
        ↓
PersonalizationSection:124-130   input "semestre atual" escreve profile.semester
        ↓  ✗ e ninguém mais lê
```

Depois do boot, `profile.semester` é **campo morto**: `HeaderNav.tsx:213`,
`FaculdadeView.tsx:90` e `PerfilView.tsx:207` já usam `activeTerm.ordinal`. O input
existe na tela, aceita qualquer número (sem clamp), grava com sucesso, mostra toast
"guardei suas configurações com carinho ♡" — **e nada muda**.

**Sintoma reportado:** a usuária corrige o semestre no Perfil, o app continua mostrando
o outro, e ela conclui que o semestre "não funciona".

O caminho de correção que existia — `reopenTerm` (`term.ts:240-249`, documentado como
o "corrigir: era o 6º, não o 5º") — **não tem UI**. `grep` confirma: zero consumidores.

### 2. A virada fecha o período errado quando há dois ativos

`planTermRollover` (`packages/application/src/term/rollover.ts:252`):

```ts
const activeTerm = terms.find((t) => t.status === 'ativo');   // ⚠️ o PRIMEIRO do array
```

A UI usa `resolveActiveTerm` (`termScope.ts:63`) — o de `statusTransitionAt` **mais
recente**. São critérios **diferentes**. Com dois períodos `ativo` no array, o wizard
encerra o que a tela **não** está mostrando.

E dois períodos ativos são possíveis porque `enforceSingleActiveTerm`
(`term.ts:263-282`) — cuja docstring diz *"Roda no fim de `mergeSyncedDatabases` e
depois de toda virada"* — **nunca é chamada**: zero referências fora do próprio teste.
`assertTermIntegrity` (`term.ts:291`) também é código morto.

**Sintoma reportado:** "seleciona o semestre errado, não funciona".

### 3. O CTA de "primeiro semestre" é um beco sem saída

`TermRolloverCta.tsx:32-45` promete *"abre o primeiro período"*. O wizard que ele abre:

| lugar | comportamento |
|---|---|
| `SemesterWizard.tsx:111` | `canNext = Boolean(activeTerm)` → **bloqueia** o passo 0 |
| `SemesterWizard.tsx:118` | `blockedReason = 'seu semestre ativo ainda não foi aberto'` |
| `SemesterWizard.tsx:124` | `if (!activeTerm) return;` → salvar não faz nada |
| `SemesterWizard.tsx:205-209` | passo 0 **não tem botão** pra criar o período |
| `rollover.ts:252-255` | `planTermRollover` **lança** sem período ativo |

A transição que resolveria — `openTerm` (`term.ts:223-233`) — **não tem consumidor**.

### 4. O wizard promete "desfazer" e não há como desfazer

Texto na tela, `SemesterWizard.tsx:304` e `:327-330`:

> *"confere antes de gravar — **dá pra desfazer logo depois**"*
> *"dá pra **desfazer a virada inteira**"*

Realidade: `handleSave` (`:181-183`) grava, mostra toast, fecha o wizard. **Nunca** há
chance de desfazer.

`undoTermRollover` existe no domínio (`rollover.ts:334`) e na action
(`dataActions.ts:493-513`) e **não é chamado em lugar nenhum do app**. E mesmo que fosse,
ele exige `originalTermIds` que **ninguém captura** — o plano devolve `diff.carry`/`diff.archive`
mas não guarda o `termId` de origem, então a reversão cairia no fallback
`plan.closedTermId` (`rollover.ts:354`) e devolveria metade das disciplinas ao período errado.

`celebrate` também não tem o kind `term-closed` (`src/lib/celebrate.ts:82-99`).

### 5. Curso de 10 semestres tratado como 8

`empty.ts:40` → `totalSemesters: 8`. Psicologia no Brasil é 10.

Consequências, todas visíveis:

| onde | efeito com `total = 8` |
|---|---|
| `degreeProgress` | 100% no 8º semestre (e `clamp` em 100 esconde o excesso) |
| `shouldOfferRollover` (`term.ts:351`) | `ordinal >= 8` → CTA **"virar" fires do 8º em diante, para sempre** |
| `TermRolloverCta.tsx:49-51` | "seu 8º semestre é o último da graduação 🌷" — errado |
| `semestersLeft` | 0 do 8º em diante |
| `stickers.ts:146` | adesivo de "formada" unlocka no 8º |

E o campo **não é editável** — `totalSemesters` não tem input em lugar nenhum
(confirmado: só `empty.ts`, `goldenSample.ts` e o Zod de `backupSchema.ts:25`).

### 6. O histórico de períodos mostra o progresso do semestre errado

`TermHistoryScreen.tsx:35` — a tela que a usuária abre **justamente para conferir a virada**:

```tsx
{degreeProgress(profile.semester, profile.totalSemesters)}% do curso · cada semestre
```

`profile.semester` (o campo morto do §1), enquanto cada card abaixo (`:90`) mostra
`degreeProgress(term.ordinal, …)` **correto**. O topo e os cards discordam.

### 7. O número do próximo semestre é congelado no wizard

`SemesterWizard.tsx:56-72` inicializa `ordinal: (activeTerm?.ordinal ?? profile.semester ?? 1) + 1`
e `label: ''` — e **não existe nenhum `patch` de `ordinal` ou `label` no arquivo inteiro**
(verificado: os únicos `patch` são `decisions` e `carry*`, linhas `:248`, `:283`).

Se o `ordinal` inicial estiver errado, **não há como corrigir durante a virada**. O único
input de semestre na UI é o do Perfil, que não faz nada (§1).

Pior: o teto é ignorado. `rollover.ts:284` usa `clampTermOrdinal(x)` com o teto **global
de 12**, ignorando `totalSemesters` — num curso de 10, a 10ª virada cria "11º semestre".

### 8. O rascunho não existe (o app já tem a primitiva)

`SemesterWizard.tsx:63-72` chama `useWizardForm` **sem `draftKey`**. A primitiva existe
(`src/lib/useWizardDraft.ts`, storage key `wizard_draft_<key>`, já usada pelo
`InternshipWizard`). Sair no meio do wizard perde todas as decisões **sem aviso** — e
sem `isDirty`, o `WizardScaffold` (`:59,89,103`) não pede confirmação ao descartar.

### 9. Divergências spec ↔ código (a spec mente em 3 pontos)

| spec | código | quem está certo |
|---|---|---|
| `:952` "`reopenTerm` **zera** `summary` e `endedAt`" | preserva os dois (`term.ts:246-248`) | **spec** — ver D7 |
| `:960-962` aula sem `courseId` **entra** no resumo | fica **fora** (`rollover.ts:158`) | **código** — escopo por herança é exato |
| `:1004-1013` `SemesterWizard.test.tsx` com 8 casos | o arquivo **não existe** | **spec** — §Plano F6 |
| `:1015-1018` merge garante 1 `ativo` | não implementado | **spec** — §Plano F2 |
| `:1058,1064` virada desfazível + rascunho | não implementadas | **spec** — §Plano F3/F4 |
| cabeçalho: *"aguardando implementação"* | já implementada | **spec** |

---

## Bugs confirmados (inventário)

Prioridade 🔴 = quebra o caminho que a usuária usa · 🟡 = inconsistência visível ou
latente · 🟢 = acabamento.

| # | P | Bug | Local | Sintoma |
|---|---|---|---|---|
| B1 | 🔴 | `ordinal` do período ativo é escrito **uma vez** e nunca mais | `schema.ts:113-129` + `PersonalizationSection.tsx:124-130` | "semestre errado, não funciona" |
| B2 | 🔴 | `planTermRollover` usa `find` (o 1º) em vez de `resolveActiveTerm` (o mais recente) | `rollover.ts:252` | fecha o período **errado** |
| B3 | 🔴 | `enforceSingleActiveTerm` e `assertTermIntegrity` são código morto | `term.ts:263,291` | 2 ativos possíveis → habilita B2 |
| B4 | 🔴 | Wizard promete "desfazer"; não existe, e `originalTermIds` não é capturado | `SemesterWizard.tsx:304,327` · `dataActions.ts:493` | virada irreversível |
| B5 | 🔴 | CTA "primeiro semestre" abre wizard travado; `openTerm` sem consumidor | `TermRolloverCta.tsx:32` · `SemesterWizard.tsx:111,124` | beco sem saída |
| B6 | 🔴 | `ordinal`/`label` do próximo período congelados no wizard | `SemesterWizard.tsx:56-72` | não dá para corrigir na hora |
| B7 | 🔴 | `totalSemesters = 8` para curso de 10, e não editável | `empty.ts:40` | 100% no 8º, CTA "virar" eterno |
| B8 | 🔴 | Input "semestre atual" grava campo morto, sem clamp | `PerfilView.tsx:167,179` | ilusão de controle |
| B9 | 🟡 | `TermHistoryScreen` mostra `%` de `profile.semester` | `TermHistoryScreen.tsx:35` | topo ≠ cards |
| B10 | 🟡 | `undoTermRollover` deixa o termo `ativo` com `endedAt` + `summary` | `rollover.ts:344-350` · `term.ts:246-248` | estado inconsistente; `shouldOfferRollover` responde `true` |
| B11 | 🟡 | `planTermRollover` ignora `totalSemesters` no teto | `rollover.ts:284` | cria "11º semestre" em curso de 10 |
| B12 | 🟡 | Wizard sem rascunho e sem `isDirty` | `SemesterWizard.tsx:63-72` | perde decisões sem aviso |
| B13 | 🟡 | `openCards` conta **todos** os flashcards, não só os não revisados | `SemesterWizard.tsx:105` | infla a pendência |
| B14 | 🟡 | `JourneyTimeline` acha período por `ordinal` (`find`) | `JourneyTimeline.tsx:52` | frágil se houver `ordinal` repetido |
| B15 | 🟡 | `undoTermRollover` na action lê estado do **closure** | `dataActions.ts:497-498` | reversão parte de base velha |
| B16 | 🟡 | `scope.grade` não é recortado por período (nome enganoso) | `termScope.ts:150` | `WeekGrid` mostra resquício de período antigo |
| B17 | 🟢 | Acessibilidade dos passos do wizard | `SemesterWizard.tsx:394-403` | sem `radiogroup`/`status`/foco |
| B18 | 🟢 | `bestStreak` (streak **global**) congelado como "do período" | `SemesterWizard.tsx:178` | histórico repete a maior streak da jornada |

---

## Decisões de design

### D1 — O período é a única fonte; `profile.semester` vira campo derivado

`profile.semester` **continua no contrato persistido** (Rust, goldens, `backupSchema.ts:24`
exigem o campo) mas muda de papel:

- **escrito pelo app**, como espelho de `activeTerm.ordinal` — nunca mais digitável;
- **nunca lido pela UI** (fecha a task 5.1 da SPEC-005);
- mantém a compatibilidade com `ensureActiveTerm`/`MIGRATIONS[18]`, que ainda o usam
  como **entrada** (é o único ponto de onde se deriva o `ordinal` inicial).

Isso mata o ping-pong de sync (§O1 da SPEC-005) sem quebrar o contrato cross-língua,
e mata o input fantasma (B8).

**Aceite:** `grep -rn "profile\.semester" src/` não retorna **nenhuma leitura** em
componente de UI. As únicas ocorrências restantes são `schema.ts` (entrada da migração),
`DataClientProvider` (derivação), `dataActions` (escrita derivada) e `stickers.ts`
(que passa a receber o ordinal como argumento — D6).

### D2 — Onde a usuária muda de semestre

Princípio: **o controle nasce onde a pergunta já é feita, e edita a entidade que possui
o número.** Cinco lugares, cinco perguntas diferentes — sem sobreposição:

| # | pergunta da usuária | onde ela já está | controle | o que edita |
|---|---|---|---|---|
| 1 | "qual semestre eu tô?" | Perfil → jornada | card **"período atual"** com botão `corrigir` → input numérico | `ordinal`/`label` do termo **ativo** |
| 2 | "quantos semestres tem o curso?" | Perfil → mesmo card | **"curso de N semestres"**, clamp `1..12` | `profile.totalSemesters` |
| 3 | "o próximo é qual?" | Wizard de virada, **passo 1** | input numérico do próximo `ordinal` | `nextOrdinal` do plano |
| 4 | "virou errado, como volto?" |Wizard, **depois** de gravar | toast com ação **`desfazer`** (8s) | desfaz a virada inteira |
| 5 | "fechei o semestre errado" | Perfil → histórico | **`reabrir período`** no card do período ativo | `reopenTerm` |

Justificativa de cada placement:

- **#1 no Perfil** — é onde a pergunta "em que punto da minha jornada eu estou?" é feita
  hoje, é onde o input (inútil) já está, e o card precisa mostrar o `% do curso` que hoje
  está errado (B9). Trocar o input morto por um card do período **real** é a menor
  mudança visual que conserta o controle. O header (`:213`) e o hero da Faculdade
  (`:90`) ficam **read-only** — são indicadores, não controles.
- **#3 no wizard** — não é o mesmo controle do #1: ali a decisão que está sendo tomada
  é "vou para o 7º", e é o **único** momento em que a usuária pode corrigir antes de
  gravar. Vira input editável com clamp em `min(12, total)`, com preview do rótulo.
- **#4 como toast, não como tela** — desfazer é uma ação de **reversão imediata**, não
  uma navegação. Toast com ação é o padrão do app (`showToast` em 40+ pontos) e não
  rouba o foco. **8s**, não 2,6s do toast padrão (§D5).
- **#5 no histórico** — o período encerrado é o transcript e permanece **imutável**; o que
  se reabre é o **ativo**. Fica no histórico porque é lá que a lista de períodos vive, e
  porque "reabrir" é uma ação de manutenção, não de edição.

### D3 — Corrigir o ordinal é uma transição de domínio, não um update livre

Novo `retitleTerm(terms, termId, ordinal, label, now)` em `packages/domain/term.ts`:

- só o período **ativo** é renumerável (o encerrado é o transcript);
- `ordinal` clampado em `1..min(MAX_TERM_ORDINAL, total)`;
- `label` sincronizado com `termLabel(ordinal)` quando não vier explícito;
- **idempotente** (mesma referência de array quando nada muda), como as outras transições;
- grava `updatedAt`/`statusTransitionAt` — a carimbação por registro do sync continua
  funcionando, e dois dispositivos que corrigem convergem por LWW.

**Motivo de ser transição e não update:** o `ordinal` é o que dá a ordem da timeline, o
`%` do curso e o teto da virada. Alterá-lo por fora do domínio quebraria a invariante
"o resumo congelado é do período que o ordinal nomeia" sem nenhum guard.

### D4 — Um período ativo só, garantido em três portas

`enforceSingleActiveTerm` (`term.ts:263`) sai do código morto e roda em **três** pontos:

1. **pós-merge** — `packages/sync/src/merge.ts`, logo após o merge de `academicTerms`
   (é o que a docstring de `term.ts:260` já promete, e o que a SPEC-005 §D6 exige);
2. **pós-virada** — no fim de `planTermRollover`;
3. **pós-correção** — no fim de `retitleTerm` e de `reopenTerm`.

E `planTermRollover` passa a usar `resolveActiveTerm(terms)` — **o mesmo critério que a
UI usa para mostrar o período** — em vez de `terms.find(...)` (B2). Com a invariante
rodando, os dois critérios coincidem sempre; sem ela, a virada fechava o período errado.

`assertTermIntegrity` também sai do código morto: roda no boot e, se encontrar órfã
(disciplina `ativa` apontando para período que não é o ativo), **loga e repara**
(reatribui ao período ativo) em vez de falhar em silêncio.

### D5 — A virada é reversível: estado de "última virada" em memória

`applyTermRollover` passa a guardar o inverso no **commit**, não a UI:

```ts
// dataActions.ts
setLastRollover({ plan, originalTermIds, appliedAt });
```

- `originalTermIds` é capturado de `courses` **antes** do `setCourses` — fecha a lacuna
  de `rollover.ts:339` (B4) e elimina o fallback incorreto `plan.closedTermId` (`:354`);
- fica em `useState` do provider (**não persistido**): o desfazer é para a sessão, e um
  `undo` persistido seria estado que divergiria entre dispositivos sem ganho;
- `undoLastRollover()` (nova) consome `lastRollover`, aplica `undoRollover` e zera o estado.

**Toast com ação.** `ui/Toast.tsx` hoje é `message: string | null` — sem slot de ação.
Passa a aceitar `action?: { label: string; onClick: () => void }`, com **timer de 8s**
quando há ação (2,6s sem), e o `useEffect` de timer em `DataClientProvider:567-582` passa
a respeitar a duração. `OverlaysContent.tsx:177` só passa a repassar.

**Confete.** Novo kind `term-closed` em `celebrate.ts` (usa o preset de `reading-done` +
`sideCannons(90)` — a menor celebração adequada para "virar o semestre").

**Comportamento do `undo` (corrige B10):** devolve o período para `ativo` **limpando
`endedAt` e `summary`** — ver D7.

### D6 — O resumo é derivado por ordinal, nunca lido do perfil

`stickers.ts:74,142,146` recebe o ordinal como **argumento** em vez de ler
`state.profile.semester` — assim o adesivo de "metade", "penúltimo" e "formada"
desbloqueia pelo **período ativo**, e não por um campo congelado.

`profileMeta.ts:10` (`getJourneyReflection`) idem.

`bestStreak` (B18) sai do resumo do período: a streak é **global** por decisão O2 da
SPEC-005, e congelá-la em cada período faz o histórico repetir a maior streak da
jornada. O `TermSummary` ganha `focusMinutes` (que já tem) como métrica de alcance.

### D7 — `reopenTerm`/`undo` **zeram** `summary` e `endedAt` (a spec estava certa)

O código hoje preserva os dois (`term.ts:246-248`) e um teste afirma isso
(`term.test.ts:107-111`). A SPEC-005 §952 diz o contrário. **A spec está certa**, e o
motivo é concreto:

`TermHistoryScreen.tsx:88` renderiza o `summary` **sem checar `status`** — um período
reativo com resumo congelado mostraria "12 aulas · 3h de foco" em um semestre que está
**começando**. Além disso `endedAt` num período `ativo` faz `shouldOfferRollover`
(`term.ts:350`) responder `true` na hora.

O resumo é um **snapshot de um período fechado**. Período aberto não tem snapshot — e
quando fechar de novo, `buildTermSummary` o recalcula de forma determinística, sem
perda. **A SPEC-005 §952 é restaurada; o teste `term.test.ts:107-111` é invertido.**

### D8 — `totalSemesters` é 10, é da usuária, e migra com critério conservador

- default `10` em `empty.ts:40` e `goldenSample.ts:42`;
- **campo editável** com clamp `1..12` no card do Perfil (D2 #2);
- **`MIGRATIONS[19]`** (`SCHEMA_VERSION` 18 → 19) corrige **só o caso evidentemente
  errado**: `totalSemesters === 8` **e** `profile.semester > 8` → `10`. Quem está
  legitimamente num curso de 8 semestres e no ≤ 8 **não é tocado**;
- `planTermRollover` passa a receber `totalSemesters` e clampar o `nextOrdinal` em
  `min(MAX_TERM_ORDINAL, total)` (B11) — nada de "11º semestre" em curso de 10;
- `shouldOfferRollover` deixa de disparar para sempre: o gatilho do CTA passa a ser
  "chegou ao fim **ou** é o último da graduação", e o texto do CTA (`:49-51`) distingue os
  dois casos corretamente.

### D9 — `scope.grade` é renomeado, `scope.active` é o recorte

`termScope.ts:141,150`: `grade` → `allActive`, com doc explícita ("tudo que está ativo,
**incluindo** disciplinas avulsas e de períodos anteriores"). `active` continua sendo o
recorte do período.

`WeekGrid` (`FaculdadeView.tsx:108,130,167`) **mantém** `allActive` — a grade da semana
é sobre a sua semana, e incluir a disciplina avulsa é o comportamento certo.
`DisciplinasGrid` e o contador do hero (`:91`) usam `active`. Isso mata a armadilha de
nome (B16) sem mudar o que a usuária vê.

### D10 — O wizard ganha rascunho, confirmação e a correção do número

`SemesterWizard.tsx`:

- `useWizardForm({ draftKey: 'semester', isDirty })` — a primitiva já existe
  (`useWizardDraft.ts`, padrão do `InternshipWizard`); `clearDraft()` no commit;
- `isDirty` compara com os valores iniciais → o `WizardScaffold` passa a pedir confirmação
  ao descartar (`:59,89,103`);
- **passo 1 vira o lugar de corrigir o número** (D2 #3): input numérico do próximo
  `ordinal`, clamp `1..min(12, total)`, com preview do rótulo ("7º semestre");
- **passo 0 ganha o caso sem período ativo** (B5): em vez do beco sem saída, o passo
  oferece **"abrir o primeiro período"** com um input de ordinal → `openTerm` /
  `createAcademicTerm` (D5/#4). Nunca `planTermRollover` nesse caminho;
- `openCards` (`:105`) passa a filtrar os flashcards **não revisados no período**
  (`lastReviewed` posterior a `activeTerm.startedAt`), alinhando com `openTasks`
  (`!t.completed`) e `openReadings` (`status !== 'concluido'`) (B13).

### D11 — a11y dos passos (fecha a task 7.5 da SPEC-005)

`role="radiogroup"` + `aria-labelledby` no passo 2 (as decisões de disciplina **são** um
grupo de escolha única-por-disciplina, com `role="radio"` + `aria-checked` em vez de
`aria-pressed` solto); `role="status"` nos contadores do passo 3; foco no `headline` ao
trocar de passo (`tabIndex={-1}` + `.focus()`); `aria-current="step"` no indicador do
`WizardScaffold`.

---

## Modelo de dados

### `AcademicTerm` — **inalterado**

Nenhum campo novo, nenhuma mudança de shape. `SCHEMA_VERSION` 18 → 19 por causa do
**valor** de `totalSemesters` (D8), não do formato — mesmo precedente de `MIGRATIONS[18]`,
que também só normalizou valores.

### Novos em `packages/domain/src/core/domain/term.ts`

```ts
/** Renumera o período **ativo** (o encerrado é o transcript). Idempotente. */
export function retitleTerm(
  terms: AcademicTerm[],
  termId: EntityId,
  ordinal: number,
  label: string | undefined,
  totalSemesters: number,
  now: string,
): AcademicTerm[];

/** Reabre um período encerrado **zerando** `endedAt` e `summary` (D7). */
export function reopenTerm(terms, termId, now): AcademicTerm[];  // assinatura igual, comportamento corrigido
```

### `TermSummary` — `bestStreak` sai (D6)

Removido o campo e o tipo correspondente no crate `cecistudy-domain` do workspace Rust
(que ainda não foi tocado por esta spec — a remoção é a tarefa F3 do breakdown Rust);
`focusMinutes` cobre o alcance. Goldens
TS regenerados com aprovação explícita (o gate que o mobile consome).

### `packages/application/src/term/rollover.ts`

```ts
planTermRollover(input: {
  // ...de hoje
  totalSemesters: number;   // NOVO — teto do próximo ordinal (B11)
  activeTermId?: EntityId;  // NOVO — opcional, para o caso "virada de um período específico"
}): TermRolloverPlan;

TermRolloverPlan {
  // ...
  originalTermIds: Record<string, string | null>;  // NOVO — fecha a lacuna do undo (B4)
  closedTermId: EntityId;                          // existente, usado no fallback
}
```

`undoTermRollover` passa a ler `originalTermIds` de `plan` (com o argumento explícito
mantido como override, para o teste de round-trip).

---

## Onde nasce cada controle (mapa de arquivo)

| controle | arquivo | ponto de entrada |
|---|---|---|
| card "período atual" + `corrigir` | `src/components/views/perfil/JourneyTermCard.tsx` (**novo**) | `PerfilView.tsx` |
| campo "curso de N semestres" | mesmo card | idem |
| `reabrir período` | `src/components/terms/TermHistoryScreen.tsx` | card do período **ativo** |
| input do próximo `ordinal` | `src/components/wizards/SemesterWizard.tsx` | passo 1 |
| abrir o primeiro período | idem | passo 0 (caso `activeTerm === null`) |
| toast com `desfazer` | `src/components/ui/Toast.tsx` + `src/overlays/OverlaysContent.tsx` + `DataClientProvider.tsx` | pós-commit |
| `retitleTerm` no app | `src/context/dataActions.ts` → `correctTermOrdinal` | card do Perfil |
| `lastRollover` / `undoLastRollover` | `src/context/dataActions.ts` | estado do provider |

---

## Critérios de aceite

Verificáveis, um por bug:

- [ ] **B1/B8** `grep -rn "profile\.semester" src/` → **zero leitura** em componente de
      UI. O input "semestre atual" não existe mais no Perfil; quem escrever vê o card do
      período ativo.
- [ ] **B1** Digitando um número errado no input do "curso de N semestres", o card mostra
      o novo `%` **e** o total é gravado; nada mais é afetado.
- [ ] **B2/B3** Com dois períodos `ativo` no array, `planTermRollover` fecha **o mesmo**
      que `resolveActiveTerm` mostra na UI (teste unitário com 2 ativos em ordem invertida).
- [ ] **B3** `enforceSingleActiveTerm` roda pós-merge: fixture de 2 dispositivos com
      períodos distintos → resultado tem exatamente 1 `ativo` (o de `statusTransitionAt`
      mais recente).
- [ ] **B3** `assertTermIntegrity` roda no boot: disciplina `ativa` apontando para período
      não-ativo é reparada (reatribuída ao ativo).
- [ ] **B4** Depois de gravar a virada, o toast mostra **`desfazer`** por 8s; tocar
      devolve **exatamente** o estado anterior (mesmo `id` de período, mesmo `termId` de
      cada disciplina, `summary` limpo, `endedAt` limpo) — teste de round-trip.
- [ ] **B4** `originalTermIds` é capturado no commit: um `undo` disparado depois de uma
      escrita intermediária **não** usa o estado do closure (B15).
- [ ] **B5** Sem período ativo, o CTA leva a um wizard que **permite abrir o primeiro
      período** e grava — sem `planTermRollover` e sem `throw`.
- [ ] **B6** O passo 1 do wizard tem input numérico editável; mudar para `7` quando o
      cálculo dizia `8` grava o `7º semestre` (e o passo 4 mostra o rótulo correto).
- [ ] **B7** `totalSemesters` default `10`; campo editável aceita `1..12` e rejeita `0`,
      `13` e `abc`. Com `total = 10` e `ordinal = 10`, o CTA diz "último da graduação" e
      **não** sugere virar de novo.
- [ ] **B7** `MIGRATIONS[19]`: fixture `totalSemesters: 8` + `semester: 9` → `10`;
      fixture `totalSemesters: 8` + `semester: 5` → **intocada** (`8`).
- [ ] **B9** `TermHistoryScreen`: o `%` do topo bate com o `ordinal` do termo ativo
      (teste de render com `profile.semester` deliberadamente divergente).
- [ ] **B10** Depois do `undo`, o período está `ativo`, **sem** `endedAt` e **sem**
      `summary`; `shouldOfferRollover` responde `false`; o card do histórico **não**
      mostra resumo.
- [ ] **B11** `planTermRollover` com `totalSemesters: 10` e `nextOrdinal: 11` → grava
      `10` (o teto), nunca `11`.
- [ ] **B12** Sair no passo 2, voltar → as decisões voltaram. `isDirty` dispara a
      confirmação de descarte.
- [ ] **B13** O contador de flashcards do passo 3 conta só os não revisados desde
      `activeTerm.startedAt`.
- [ ] **B14** `JourneyTimeline` resolve período por **`id`**, nunca por `ordinal`.
- [ ] **B16** `useTermScope` devolve `allActive` (não `grade`); `DisciplinasGrid` e o
      contador do hero usam `active`; `WeekGrid` usa `allActive`.
- [ ] **D6** Desbloquear adesivo de "formada" depende do **termo ativo**, não do perfil.
- [ ] **D7** `reopenTerm` zera `endedAt` + `summary` (teste invertido de
      `term.test.ts:107-111`).
- [ ] **D11** `role="radiogroup"` no passo 2, `role="status"` nos contadores, foco no
      `headline` a cada passo.
- [ ] **SPEC** As 6 divergências spec↔código do §Diagnóstico 9 estão resolvidas **por
      escrito**: ou o código mudou, ou a SPEC-005 está atualizada com a razão.

---

## Plano de implementação

Ordem por dependência. Cada fase fecha com `npm run lint` + `npm run test` verde.
Nenhum crate Rust é tocado.

### F0 — Blindagem (nenhuma mudança de comportamento)
Objetivo: os testes que pegam os bugs B2/B3/B7/B10 **antes** da correção.
`term.test.ts` (inverter o caso de `summary` de `reopenTerm`), `termRollover.test.ts`
(2 ativos, teto do `total`), `schema.test.ts` (MIGRATIONS 19), `termScope.test.ts`
(`allActive`). · **S**

### F1 — Domínio (`packages/domain/src/core/domain/term.ts`)
`retitleTerm` (D3) · `reopenTerm` zerando `endedAt`/`summary` (D7) · docstring de
`enforceSingleActiveTerm` apontando as 3 portas (D4). · **M**

### F2 — Persistência + sync
`SCHEMA_VERSION` 19 + `MIGRATIONS[19]` (D8) · `enforceSingleActiveTerm` pós-merge em
`packages/sync/src/merge.ts` (D4) · `default` 10 em `empty.ts`/`goldenSample.ts` (D8).
· **M**

### F3 — Aplicação (`packages/application/src/term/rollover.ts`)
`resolveActiveTerm` no lugar de `find` (B2) · `totalSemesters` no teto (B11) ·
`originalTermIds` no plano (B4) · `enforceSingleActiveTerm` no fim (D4) ·
`undoTermRollover` lendo do plano + limpando `endedAt`/`summary` (B10, B16) ·
`bestStreak` fora do `TermSummary` (D6). · **M**

### F4 — Actions
`correctTermOrdinal` + `reopenActiveTerm` (D3) · `lastRollover` + `undoLastRollover`
(D5) · `profile.semester` derivado no `applyTermRollover` (D1) ·
`assertTermIntegrity` no boot (D4) · `undoTermRollover` fora do closure (B15). · **M**

### F5 — Toast com ação + confete
`Toast` com `action` + timer de 8s (D5) · `OverlaysContent` repassando ·
`DataClientProvider` com duração variável · kind `term-closed` em `celebrate.ts` ·
`undoLastRollover` no botão. · **M**

### F6 — UI: os controles nos lugares certos
`JourneyTermCard` novo (D2 #1, #2) · input removido do `PersonalizationSection` (B8) ·
`reabrir período` no `TermHistoryScreen` (D2 #5) · wizard: rascunho + `isDirty` +
input do próximo `ordinal` + caso "primeiro período" + `openCards` (D10) ·
`TermHistoryScreen` lendo o ordinal ativo (B9) · `JourneyTimeline` por `id` (B14) ·
`allActive` (D9) · `stickers`/`profileMeta` por argumento (D6) · a11y (D11). · **L**

### F7 — Fechamento
Testes do `SemesterWizard` (os 8 casos que a SPEC-005 `:1004-1013` prometeu e nunca
existiram) · testes de render de `TermHistoryScreen`/`TermCard`/`JourneyTermCard` ·
**regenerar goldens** com aprovação explícita · atualizar SPEC-005 §952 e o cabeçalho
"aguardando implementação" · `.context/backlog.md` Fase 22 → fechada · este doc → `✅`. · **M**

### Fora de escopo (fica aberto)
`saveMinimal` (gravar sem fechar) · SPEC-005 §460 `schema.sql` canônico (adiado para a
fase Rust) · paridade Rust do `TermSummary` sem `bestStreak`.

---

## Verificação

```bash
npm run lint                      # tsc --noEmit
npm run test                      # vitest (gate do mobile)
node .github/scripts/check-boundaries.mjs   # packages/* não toca react/capacitor
npm run build
npm run content:check             # só se o catálogo encostou (não deve)
```

**Gate de conteúdo:** os goldens TS (`contracts/golden/`) são regerados **com aprovação
explícita da usuária** — eles são o oráculo de paridade que o mobile consome e que o
workspace Rust vai usar. Nenhum `cargo` é rodado aqui.

**Riscos que sobram:**
- `MIGRATIONS[19]` é irreversível para quem já rodou — por isso o critério é
  conservador (só `8` com `ordinal > 8`), e o default novo só afeta quem nunca configurou.
- A F6 é a fase com mais churn de UI (Perfil + wizard + histórico). Vai por partes, com o
  gate verde entre elas, e nunca mistura com a F1–F4 (que é onde está a lógica).
