# Spec: Virada de semestre — entradas, correção de números e navegação (SPEC-005/006 em uso)

> **Status: ✅ implementada (2026-09-28).** Todos os 20 critérios de aceite verificados;
> suíte com **1112 testes** verdes (`tsc` 0, fronteiras OK, build OK).
> **Revisão durante a implementação (F4):** o conflito entre a SPEC-006 D8 (total do curso
> como teto do `nextOrdinal`) e esta spec (aviso, não clamp) foi resolvido em favor da
> SPEC-008 — o cap foi **removido** de `planTermRollover` e `clampOrdinal` perdeu o
> parâmetro `total`. Ver N5b e §Decisões de design.
> Origem: relato de uso da SPEC-005/006 em produção - *"não existe um botão que inicia o
> processo de troca de semestre, não existe um botão para corrigir quantos semestres tem no
> total e qual é agora, e a tela de histórico abre o wizard quando você sai"*.
> Cada afirmação do relato foi verificada no código antes de virar bug aqui.
> **Escopo: só o mobile (React/TS).** Nenhum crate Rust é tocado; nenhum goldens é regerado
> (nada de formato persistido muda - ver §Modelo de dados). `SCHEMA_VERSION` segue 19.
> **Veredito: 1 bug de domínio morto + 2 de navegação + 4 de superfície.** O modelo de
> domínio da SPEC-005 está certo e **não** é redesenhado.
>
> **Plano e execução:** `tasks/plan-virada-entradas-navegacao.md` ·
> `tasks/todo-virada-entradas-navegacao.md` (F0–F5).

---

## Objetivo

A virada de semestre está **corretamente implementada** e **praticamente inalcançável**.
O botão que inicia o processo existe em dois lugares, mas ambos estão atrás de um predicado
de domínio cujo primeiro ramo é **estruturalmente morto** — o app nunca chega a mostrar
"seu semestre tá acabando" fora do último semestre da graduação. Some-se a isso: o total de
semestres do curso não tem **nenhum** editor no app, o input que corrige o semestre atual é
clampeado pelo total (trava circular), e o histórico de períodos é empilhado como filho do
wizard — então sair dele abre a virada.

O modelo (`AcademicTerm`, escopo por herança, resumo congelado, desfazer em 8s) está
**certo**. O que está errado é a **superfície**: onde os controles nascem, se eles existem,
e para onde o back leva.

### Goals

1. **Sempre existe um caminho para virar o semestre** — o botão é permanente, o *nudge* é
   que é condicional.
2. **Sempre existe um caminho para corrigir "qual semestre eu tô" e "quantos o curso tem"**,
   alcançável sem conhecer o app, e sem trava circular entre os dois números.
3. **O histórico de períodos é uma tela irmã do wizard**, não um filho dele: o back de onde
   veio é o caminho de volta.
4. **O wizard corrige o número que está prestes a gravar** — e sabe abrir o primeiro período
   quando não há nenhum.
5. **Fecha os itens da SPEC-006 que continuam abertos** e são exatamente estes (B5, B6, B7
   parcial, B11, B12, B13, B14, D6, D11).

### Non-goals

- **Não** é redesenhar o domínio. `AcademicTerm`, `TermSummary`, escopo por herança e as
  transições monotônicas continuam como estão.
- **Não** é transcript oficial, média, reprovação, matrícula ou multi-curso.
- **Não** é `saveMinimal` ("gravar sem fechar o período") — continua item aberto, e o padrão
  seguro (adiar tudo) é o default.
- **Não** é tocar o workspace Rust (gate próprio, `cargo`; desktop Flutter sem UI).
- **Não** é trocar o *formato* persistido — logo, **sem `SCHEMA_VERSION` novo** e sem regerar
  goldens (ver §Modelo de dados).
- **Não** é mexer no roteamento de `#/perfil/semestre*` — as URLs já estão certas; o que está
  errado é a **pilha** que elas reconstroem (ver D5).

---

## Diagnóstico

### N1 🔴 — O botão de virar existe, mas a condição que o esconde nunca é verdadeira

Este é o **defeito de raiz**, e é a causa direta de dois dos quatro relatos.

`shouldOfferRollover` (`packages/domain/src/core/domain/term.ts:448-456`):

```ts
export function shouldOfferRollover(term, today, totalSemesters): boolean {
  if (!term) return false;
  if (term.endedAt && term.endedAt <= today) return true;   // ⚠️ ramo morto
  return term.ordinal >= totalSemesters;
}
```

O primeiro ramo é a condição do "o semestre tá acabando". Ele lê `term.endedAt`. Mas
`endedAt` **só é gravado em um termo que passa a `encerrado`** — nos três únicos lugares que
o escrevem:

| onde | o que o termo vira |
|---|---|
| `closeTerm` (`term.ts:239`) | `status: 'encerrado'` |
| `planTermRollover` (`rollover.ts:309`) | `status: 'encerrado'` |
| `enforceSingleActiveTerm` (`term.ts:366`) | `status: 'encerrado'` (demoção) |

E `reopenTerm` (`term.ts:286`) **apaga** `endedAt` de propósito (D7 da SPEC-006).

O CTA é sobre o período **ativo** — e um período ativo, por construção, **nunca tem
`endedAt`**. Logo o primeiro ramo é código morto, e o único ramo vivo é
`ordinal >= totalSemesters`.

**E os dois únicos pontos de entrada do wizard estão atrás dele:**

| entrada | gate |
|---|---|
| `TermRolloverCta.tsx:30` — Faculdade | `if (!due && term) return null;` |
| `JourneyTimeline.tsx:30,91` — Perfil | `const canRollover = … shouldOfferRollover(…)` |

Resultado: **a virada de semestre só é alcançável no último semestre da graduação.** A
promessa do comentário em `TermRolloverCta.tsx:3-5` ("o semestre tá acabando — *passou do
meio*, ou já é o último") não é cumprida pelo código: o "meio do semestre" nunca é
calculado.

> O usuário que escolheu o semestre errado no início e quer corrigir **não tem como virar o
> semestre** — a não ser que esteja no último. E o usuário que quer só corrigir o número
> (§N4) não encontra o controle.

### N2 🔴 — `totalSemesters` não tem editor em lugar nenhum — e trava o input do ordinal

`grep -rn totalSemesters src/ packages/` (fora de teste) mostra que o campo é **lido** em
9 arquivos e **escrito** em 3, todos fora do alcance da usuária depois do onboarding:

| escrita | onde |
|---|---|
| `OnboardingScreen.tsx:50,71,200` | escolha do onboarding |
| `empty.ts:43` | seed (`DEFAULT_TOTAL_SEMESTERS = 10`) |
| `schema.ts:408-409,448-449` | migrações |

**Não existe input, stepper ou toggle para o total em nenhuma tela.** E o efeito não é
cosmético: `JourneyTimeline.tsx:49` desenha
`Array.from({ length: profile.totalSemesters })` — a linha do tempo da graduação inteira é
dimensionada por esse número. Um total errado desenha a jornada errada, e não há como
consertar.

**A trava circular** é o pior sintoma (`JourneyTermCard.tsx:77-82`):

```tsx
<input id="term-ordinal" type="number" min={1} max={totalSemesters} … />
```

O input que corrige "em que semestre você está?" é clampeado pelo total do curso. Se a
usuária está no 9º e o app acha que o curso é de 8 (`totalSemesters: 8` era o default
histórico; `MIGRATIONS[19]` só corrige o caso `8` **com** `profile.semester > 8`), o input
**não aceita 9**. E o único jeito de subir o total seria um editor que não existe. Circular.

O domínio já tinha a resposta certa e ela está no lugar errado: `clampOrdinal`
(`termScope.ts:131-133`) clampa em `min(MAX_TERM_ORDINAL, total)` — herdando a mesma
confunção entre "posição na jornada" e "duração do curso".

### N3 🔴 — Sair do histórico abre o wizard de virada

Este é o terceiro relato, confirmado, e ele está **triplicado** — corrigir em um lugar não
resolve:

1. **`navigationEngine.ts:1330-1342`** — `openTermHistory` **descarta** a pilha atual e
   reconstrói `[perfil, wizard semester, termHistory]`:
   ```ts
   const next: NavScreen[] = [
     { kind: 'tab', tab: 'perfil' },
     { kind: 'wizard', type: 'semester' },
     { kind: 'termHistory', termId },
   ];
   ```
2. **`goBack` (`navigationEngine.ts:660-667`)** — pop de um. De `[perfil, wizard,
   termHistory]` sobra `[perfil, wizard]` = **a virada de semestre**.
3. **`packages/navigation/src/hash.ts:332-338`** — `routeToStack` reconstrói a **mesma**
   pilha de 3 telas, então recarregar a página ou entrar por deep-link
   (`#/perfil/semestre/historico`) **também** deixa a wizard embaixo do histórico.

Não existe `closeTermHistory` em lugar nenhum. E o comportamento está **documentado como
intencional** em três lugares, o que é o motivo de ter sobrevivido:

| arquivo:linha | o que diz |
|---|---|
| `navigationEngine.ts:1324-1329` | *"o wizard de semestre é o passo 1 dele (índice dos períodos)"* |
| `src/lib/headerConfig.ts:168-179` | *"o back do header devolve ao passo 1 do wizard … porque é literalmente o pop da pilha"* |
| `TermHistoryScreen.tsx:10-13` e `hash.ts:287-290` | mesma justificativa, espelhada |

E o passo 1 do wizard **não é** o histórico: `SemesterWizard.tsx:216-235` mostra os
períodos anteriores como uma **lista read-only** com um link "ver o histórico completo".
São telas diferentes com nomes parecidos.

**Agravante no mesmo arquivo:** `TermHistoryScreen.tsx:59` usa
`onOpen={() => openTermHistory(term.id)}` para **expandir/recolher** o resumo de um card
(`aria-expanded`, `TermCard.tsx:132-139`). Ou seja, o toggle de expansão **empilha uma
tela**. Cada "ver o resumo inteiro" acrescenta um nível na pilha — e o back depois disso
desemboca na wizard.

**Um teste afirma o bug** (`src/lib/__tests__/routing.test.ts:521-526`):
`routeToStack({ termHistory: true, termId: 'trm-3' })` →_equal_ a pilha de 3 telas com o
wizard. Precisa ser invertido.

### N4 🟡 — O controle para corrigir "qual semestre eu tô" existe, mas ninguém acha

O `JourneyTermCard` (`src/components/views/perfil/JourneyTermCard.tsx`) já faz o que a
SPEC-006 D2 mandou: o `ordinal` do período **ativo**, corrigido por `retitleTerm`
(`dataActions.ts:605-619`). O problema é onde e como ele aparece:

- **posição** — `PerfilView.tsx:350-355`, ou seja **depois** de `ProfileHeader`,
  `JourneySummary`, `DitherFunnelChart`, `StudyStatsWidget` e `JourneyTimeline`: abaixo de
  ~4 dobras de scroll da timeline e do funil;
- **tamanho** — o botão é `w-9 h-9` (`JourneyTermCard.tsx:125`) = **36px**, abaixo do mínimo
  de 44px do design system (`.touch-target`, `.context/design-system.md §1`);
- **forma** — ícone de lápis **sem rótulo**. O `.context/copy-and-voice.md` pede CTAs
  convidativos ("corrigir", "virar o semestre"), não affordances de ícone solto;
- **contraste com o número** — o semestre atual está visível **o tempo todo** no header
  (`HeaderNav.tsx:56,231` — `{activeTermOrdinal}º sem`) e no `ProfileHeader`
  (`ProfileHeader.tsx:74`, "`{currentOrdinal}º de {totalSemesters} semestres`"), e **esses
  dois são read-only, sem nenhuma affordance**. A pergunta é feita no header; a resposta
  editável mora no rodapé do Perfil. Isso viola o princípio da SPEC-006 D2 ("o controle nasce
  onde a pergunta já é feita").

O caso que a usuária relata — "escolhi por engano no início" — tem dois desfechos
possíveis, e **um deles não tem caminho nenhum**:

| ela está… | o que resolve | onde está |
|---|---|---|
| no período **ativo** errado | `JourneyTermCard` → `corrigir` | Perfil, fundo da página, 36px |
| com o semestre já **encerrado** errado | reabrir o encerrado → corrigir | `TermHistoryScreen:159-167`, que só é alcançável pelo back que abre a wizard (N3) |

Ou seja: **se ela já virou o semestre uma vez, corrigir depende de uma tela cuja navegação
está quebrada.**

### N5 🟡 — O wizard não corrige o número que está prestes a gravar

`SemesterWizard.tsx:57-73` semeia `ordinal` e `label` no formulário. **Não existe nenhum
`patch` para os dois no arquivo inteiro** — os únicos `patch` são `decisions` (`:254`) e
`carry*` (`:289`). O `ordinal` é portanto sempre `activeTerm.ordinal + 1` e o `label` sempre
`${ordinal}º semestre` (`:139`).

Se a virada vai gravar o número errado, **não há como corrigir na hora** — e o número errado
gravado só se corrige voltando ao `JourneyTermCard` de N4.

**E o teto do curso é código morto.** `planTermRollover` **aceita** `totalSemesters`
(`rollover.ts:260`) e o usa no clamp (`:322`) — mas o wizard **não passa**
(`SemesterWizard.tsx:133-181`). A proteção contra "criar um 11º semestre num curso de 10"
existe, está testada (`termRollover.test.ts:395`) e nunca é exercitada pela UI.

**E o passo 0 é beco sem saída sem período ativo** (N5c, idêntico ao B5 da SPEC-006):

| lugar | comportamento |
|---|---|
| `SemesterWizard.tsx:111-115` | `canNext = step === 0 ? Boolean(activeTerm)` → bloqueia |
| `SemesterWizard.tsx:117-122` | `blockedReason = 'seu semestre ativo ainda não foi aberto'` |
| `SemesterWizard.tsx:125` | `if (!activeTerm) return;` → salvar não faz nada |
| `rollover.ts:287-289` | `planTermRollover` **lança** sem período ativo |

A transição que resolveria — `openTerm` (`term.ts:249`) — tem **zero consumidores** fora do
próprio teste de domínio (`term.test.ts:100,139`).

### N6 🟡 — `openCards` conta todos os flashcards, não só os pendentes

`SemesterWizard.tsx:106`: `flashcards.filter((f) => !f.courseId || travelling.has(f.courseId))`
— não filtra por `lastReviewed` nem por `activeTerm.startedAt`. Os vizinhos filtram
corretamente: `openTasks` por `!t.completed` (`:100-102`), `openReadings` por
`r.status !== 'concluido'` (`:103-105`). O passo 3 mostra um número inflado.

### N7 🟡 — `JourneyTimeline` acha período por `ordinal`, e `retitleTerm` permite duplicar

`JourneyTimeline.tsx:52`: `academicTerms.find((t) => t.ordinal === sem)`. Depois do D3 da
SPEC-006, `retitleTerm` é livre para renumerar o período ativo — e renumerar o ativo para o
número de um **encerrado** cria dois termos com o mesmo `ordinal`. O `find` pega o primeiro do
array, que não é necessariamente o certo, e o card do semestre mostra o resumo do período
errado.

### N8 🟢 — `stickers` ainda lê o campo legado

`src/lib/stickers.ts:74,142,146` (`metade`, `penúltimo`, `formada`) leem
`state.profile.semester`. Como o campo passou a ser **espelho** escrito pelas actions
(`dataActions.ts:510-513`), os adesivos destravam pelo valor congelado, não pelo período
ativo. É o D6 da SPEC-006, não implementado.

---

## Bugs confirmados (inventário)

🔴 = tira o caminho da usuária · 🟡 = inconsistência visível ou latente · 🟢 = acabamento.

| # | P | Bug | Local | Sintoma |
|---|---|---|---|---|
| N1 | 🔴 | `shouldOfferRollover` lê `endedAt`, que **só existe** em termo `encerrado` — ramo morto | `term.ts:448-456` | **virar o semestre é inalcançável** fora do último semestre |
| N1b | 🔴 | Os dois únicos entry points do wizard estão atrás desse predicado | `TermRolloverCta.tsx:30` · `JourneyTimeline.tsx:30,91` | "não existe um botão que inicia a troca" |
| N2 | 🔴 | `totalSemesters` sem editor em nenhuma tela | (ausente) | "não existe um botão para corrigir o total" |
| N2b | 🔴 | Input do ordinal com `max={totalSemesters}` → trava circular | `JourneyTermCard.tsx:81` | estar no 9º com total 8 é **irrecuperável** |
| N3 | 🔴 | `openTermHistory` descarta a pilha e empurra a wizard embaixo | `navigationEngine.ts:1330-1342` | "sai do histórico e abre a virada" |
| N3b | 🔴 | `routeToStack` reconstrói a mesma pilha de 3 telas | `hash.ts:332-338` | recarregar a URL reproduz o bug |
| N3c | 🔴 | Teste **afirma** o bug | `routing.test.ts:521-526` | o bug está protegido |
| N3d | 🔴 | 3 doc-comments justificam o bug como intencional | `navigationEngine.ts:1324` · `headerConfig.ts:169` · `TermHistoryScreen.tsx:10` | quem lê o código acha que está certo |
| N3e | 🟡 | Expandir o resumo de um card **empilha uma tela** | `TermHistoryScreen.tsx:59` | "ver o resumo inteiro" vira nível de pilha |
| N4 | 🔴 | Controle de correção: 36px, ícone sem rótulo, abaixo de 4 dobras de scroll | `JourneyTermCard.tsx:121-128` · `PerfilView.tsx:350` | a usuária não acha |
| N4b | 🟡 | O número aparece no header read-only, sem affordance | `HeaderNav.tsx:231` · `ProfileHeader.tsx:74` | pergunta no header, resposta no rodapé |
| N4c | 🟡 | Se o semestre errado já foi **encerrado**, corrigir depende do histórico (N3) | `TermHistoryScreen.tsx:159-167` | sem caminho quando mais precisa |
| N5 | 🔴 | Wizard sem `patch` de `ordinal`/`label` | `SemesterWizard.tsx:57-73` | grava o número errado sem aviso |
| N5b | 🟡 | `totalSemesters` não é passado a `planTermRollover` | `SemesterWizard.tsx:133-181` | clamp de teto é código morto |
| N5c | 🔴 | Passo 0 sem período ativo é beco sem saída; `openTerm` sem consumidor | `SemesterWizard.tsx:111,125` · `term.ts:249` | não dá para começar |
| N5d | 🟡 | Wizard sem rascunho e sem `isDirty` | `SemesterWizard.tsx:57-73` | sair no passo 2 perde as decisões |
| N6 | 🟡 | `openCards` conta todos os flashcards | `SemesterWizard.tsx:106` | infla a pendência do passo 3 |
| N7 | 🟡 | `JourneyTimeline` resolve período por `ordinal` (`find`) | `JourneyTimeline.tsx:52` | resumo do semestre errado |
| N8 | 🟢 | `stickers` lê `profile.semester` (espelho) | `stickers.ts:74,142,146` | adesivo destrava pelo valor congelado |

---

## Reconciliação com a SPEC-006

A SPEC-006 está marcada "aguardando implementação", mas **~60% já foi implementada**.
Corrigir o cabeçalho dela é parte desta spec (F5).

### Já resolvido na SPEC-006 (não repetir)

| item | onde está |
|---|---|
| B1/B8 — `profile.semester` não é mais digitável; `JourneyTermCard` corrige o termo **ativo** | `JourneyTermCard.tsx` + `retitleTerm` (`term.ts:305`) |
| B2 — `planTermRollover` usa `resolveActiveTerm` | `rollover.ts:278-286` |
| B3 — `enforceSingleActiveTerm` roda pós-merge, pós-virada e no boot; `assertTermIntegrity` repara órfãs | `merge.ts:172` · `rollover.ts:278` · `DataClientProvider.tsx:482,504` |
| B4 — desfazer de verdade: `lastRollover` + `originalTermIds` + toast com ação por 8s | `dataActions.ts:535-550` · `DataClientProvider.tsx:616` · `termUndoWindow.ts` |
| B7 (parte) — `totalSemesters = 10` + `MIGRATIONS[19]` (`SCHEMA_VERSION` 19) | `schema.ts:30,448` |
| B9 — histórico lê o ordinal do termo ativo | `TermHistoryScreen.tsx:48` |
| B10/D7 — `reopenTerm`/`undo` zeram `endedAt` e `summary` | `term.ts:286` · `rollover.ts:410` |
| D5 — confete `term-closed` | `celebrate.ts:101` · `dataActions.ts:562` |

### Ainda aberto na SPEC-006 e **absorvido por esta** (implementado aqui, não lá)

B5 (= N5c) · B6 (= N5) · B7-parte-editor (= N2) · B11 (= N5b) · B12 (= N5d) · B13 (= N6) ·
B14 (= N7) · D6 (= N8) · D11 (a11y dos passos — ver §Plano, F4).

### Continua aberto nas duas

`saveMinimal` (gravar sem fechar) · `scope.grade` → `allActive` (D9, é renomear `termScope.ts:164`
e 3 call-sites, cabe no F4) · `schema.sql` canônico (adiado para a fase Rust).

---

## Decisões de design

### D1 — O botão é permanente; o *nudge* é que é condicional

`shouldOfferRollover` hoje **confunde duas perguntas** num booleano só:

| pergunta | quem faz |
|---|---|
| "dá para virar o semestre?" | **sempre que existe um período ativo** — é estrutural, não depende de data nem de número |
| "vale a pena avisar que o semestre acabou?" | heurística de ênfase |

A correção separa as duas em `packages/domain/src/core/domain/term.ts`:

```ts
/** Estrutural: existe um período ativo que pode ser encerrado? */
export function canRollover(term: AcademicTerm | null): boolean {
  return term !== null;
}

/** Ênfase: o período já cumpriu o prazo ou é o último da graduação? */
export function shouldNudgeRollover(
  term: AcademicTerm | null,
  today: string,
  totalSemesters: number,
  opts?: { monthsPerTerm?: number },
): boolean;
```

`shouldNudgeRollover` substitui o ramo morto por um que **usa o dado que existe**:
meses transcorridos desde `term.startedAt` (`ROLLOVER_NUDGE_MONTHS = 4`, metade de um
semestre de 6 meses), **ou** `ordinal >= totalSemesters`.

- `canRollover` **não tem data nem número** — é a resposta honesta a "existe um caminho
  para virar o semestre?". Nunca mais é usado como gate de visibilidade.
- `shouldNudgeRollover` decide **ênfase** (rosa, com countdown), nunca **existência**.
- `shouldOfferRollover` sai (renomeado nos 2 call-sites e no teste
  `term.test.ts:340-346,350`, que é invertido).

**Por que o botão sempre visível e não um menu escondido:** a SPEC-006 §Objetivo diz que a
tela fica limpa fora de hora. Isso é certo para o **nudge**, errado para o **controle**. Um
controle que aparece e some conforme o relógio vira um beco sem saída — que é exatamente o
que a usuária encontrou. O botão é uma **ação primária** da área; o aviso é **cor** e
**hierarquia**.

### D2 — Um card, duas perguntas, e ele sobe para o topo do Perfil

O `JourneyTermCard` passa a ser o **único lugar que responde e corrige "onde eu tô na
graduação"**, e ganha a ação primária da virada. Ele sobe para **imediatamente abaixo do
`ProfileHeader`** (antes de `JourneySummary`, funil e `StudyStats`): identidade de jornada
antes de estatística.

O card tem três partes:

| parte | interação | escreve |
|---|---|---|
| **`{label}` grande + `{n}º de {total} semestres`** | read-only | — |
| **corrigir** (`ordinal` do período ativo) | input numérico, `min=1` `max=12` | `retitleTerm` |
| **curso de N semestres** | stepper `− N +`, `clamp 1..12` | `profile.totalSemesters` |
| **virar o semestre ♡** | ação primária, **sempre visível** | abre o wizard |

O **ícone de lápis de 36px sai**: vira um botão com **rótulo** ("corrigir"), `.touch-target`
(44px), alinhado com a voz do produto. O `Pencil` continua como ícone **com** texto, não
como botão de ícone.

**A ação primária ganha um rótulo que diz o que vai acontecer** — "virar o semestre ♡"
quando há decisão de disciplina a tomar; e no estado sem período ativo, "abrir meu 1º
semestre ♡" (que é o caminho de N5c pelo lugar onde a pergunta já é feita).

**O header segue read-only** (badge de semestre, `HeaderNav.tsx:213`): indicador não é
controle. Mas ele deixa de ser beco — é o Perfil que o torna uma informação acionável, e o
Perfil é alcançável em dois toques do header (avatar).

### D3 — `ordinal` e `totalSemesters` param de ser parentes

O input do ordinal passa a ser clampeado em `1..MAX_TERM_ORDINAL` (12), **não** em
`1..totalSemesters`. Isso **quebra a trava circular** de N2b: um total errado nunca mais
torna o ordinal irrecuperável.

Justificativa de domínio: `ordinal` é **posição na jornada**; `totalSemesters` é **duração
do curso**. Um curso de 8 semestres ainda pode ter a aluna matriculada no 9º (troca de
curso, Matrícula Concorrência, período de integralização) — forçar `ordinal <= total` transforma um
dado possivelmente errado em **dado impossível de corrigir**. O limite de 12 já é o domínio
(`MAX_TERM_ORDINAL`, `term.ts:63`).

E a inconsistência passa a ser **dita, não escondida**: quando `ordinal > totalSemesters`,
o card mostra um aviso explícito (*"seu 9º semestre está além dos 8 que você configurou —
ajusta o total do curso?"*) em vez de mostrar 100% e 0 restantes em silêncio
(`degreeProgress`/`semestersLeft` já clampeiam — `termScope.ts:116-128`).

`clampOrdinal` (`termScope.ts:131-133`) deixa de usar `total` e passa a usar
`MAX_TERM_ORDINAL`; o teto do curso vira **aviso**, não clamp. O clamp por `total`
**continua** existindo em `planTermRollover` (`rollover.ts:322`) — lá ele protege a
**transição** e não o **campo editável** — mas vira **explícito** (D4).

### D4 — O wizard corrige o número, abre o primeiro período, e nada é silencioso

`SemesterWizard.tsx`:

- **Passo 1 vira editável** (D2 da SPEC-006, ainda não implementado): input numérico do
  próximo `ordinal`, clamp `1..12`, com **preview do rótulo** ("7º semestre") ao lado.
- **Passo 0 ganha o caso sem período ativo** (N5c): em vez de `canNext = false` +
  `blockedReason`, o passo oferece **"abrir o primeiro período"** com input de `ordinal` e
  `label` → `createAcademicTerm` + `openTerm` (`term.ts:154,249`). **Nunca** por
  `planTermRollover` nesse caminho. A virada propriamente dita só faz sentido a partir do
  segundo período.
- **`totalSemesters` NÃO é passado a `planTermRollover`** (N5b). O cap que existia em
  `planTermRollover` (`min(totalSemesters, 12)`) era **código morto** — ninguém o passava.
  Ele foi **removido** em vez de ativado: com o total errado, a usuária digita 9, o passo
  de revisão promete "9º semestre" e a gravação guardaria 8, sem nenhum rastro de onde o
  8 veio. O `nextOrdinal` é limitado só pelo teto global.
- **Passar do total do curso é aviso, não clamp**: se a usuária pedir um `ordinal` acima do
  total, o passo 1 mostra *"além dos 8 do curso — dá pra ajustar no cartão do perfil ♡"* e
  o número digitado é o que entra. O aviso informa; o clamp escondia. O teto global (12)
  continua protegendo a transição.
- **Rascunho e `isDirty`** (N5d): `useWizardForm({ draftKey: 'semester', isDirty })` — a
  primitiva já existe (`src/lib/useWizardForm`, padrão do `InternshipWizard`) e o
  `WizardScaffold` (`WizardScaffold.tsx:59,89,103`) já pede confirmação ao descartar.
  `clearDraft()` no commit.
- **`openCards` filtra os não revisados** (N6): `!f.lastReviewed || f.lastReviewed <
  activeTerm.startedAt`, alinhado com `openTasks`/`openReadings`.
- **a11y dos passos** (D11 da SPEC-006): `role="radiogroup"` no passo 2 com `role="radio"`
  + `aria-checked` (hoje é `aria-pressed` solto em botões, `SemesterWizard.tsx:255`),
  `role="status"` nos contadores do passo 3, foco no `headline` a cada passo
  (`tabIndex={-1}` + `.focus()`), `aria-current="step"` no indicador do scaffold.

### D5 — O histórico é irmão do wizard, não filho

A decisão de pilha de 3 telas foi tomada porque "o histórico é o passo 1 do wizard" — e as
duas frases são falsas ao mesmo tempo (N3). O conserto é fazer a pilha **honrar de onde o
usuário veio**, e é uma linha em cada um dos três lugares:

1. **`openTermHistory` empilha sobre o que está na tela** (`navigationEngine.ts:1330`):
   ```ts
   const top = navigationStack[navigationStack.length - 1];
   const base =
     top.kind === 'wizard' && top.type === 'semester'
       ? navigationStack                       // vindo do wizard → volta pro wizard
       : [{ kind: 'tab', tab: 'perfil' }];      // vindo do Perfil → volta pro Perfil
   setStack([...base, { kind: 'termHistory', termId }]);
   ```
   Isso generaliza a correção: **qualquer** base futura funciona, sem caso especial.
2. **`routeToStack` reconstrói `[perfil, termHistory]`** (`hash.ts:332-338`) — duas telas.
   Recarregar `#/perfil/semestre/historico` leva ao histórico, e o back vai para o Perfil.
3. **`TermHistoryScreen` expande em estado local** (N3e): `useState<string | null>` para o
   card aberto, no lugar de `openTermHistory(term.id)` (`TermHistoryScreen.tsx:59`).
   `focusedTermId` na URL continua sendo lido para o deep-link
   (`#/perfil/semestre/historico/trm-3`), mas **escrever** no deep-link não empilha mais.

**As URLs não mudam.** `#/perfil/semestre` e `#/perfil/semestre/historico` já expressam a
relação de irmandade; só a pilha estava errada. Nenhuma rota é migrada, nenhum
`NavScreen` novo, `parseRoute`/`stackToHash` seguem iguais (o teste de round-trip em
`routing.test.ts:482` continua válido).

**Os três doc-comments que justificam o bug são corrigidos** (N3d) — e o teste que afirma
o bug é invertido (`routing.test.ts:521-526`): `routeToStack({ termHistory: true })` passa
a esperar `[perfil, termHistory]`.

`goBack` (`navigationEngine.ts:660`) **não muda**: uma vez que a pilha está certa, o pop de
um já é o comportamento correto. Não há `closeTermHistory` para criar.

### D6 — `stickers` e `profileMeta` pelo período ativo (D6 da SPEC-006)

`src/lib/stickers.ts` (`:18,74,141-146`) e `src/lib/profileMeta.ts:10` recebem o ordinal
como **argumento**, derivado de `useActiveTerm(...).ordinal`, em vez de lerem
`state.profile.semester`. Os adesivos de "metade", "penúltimo" e "formada" destravam pelo
período **ativo**.### D7 — `JourneyTimeline` resolve por `id`, e `scope.grade` vira `allActive`

- `JourneyTimeline.tsx:52` deixa de fazer `find(t => t.ordinal === sem)` (N7). O mapa
  `ordinal → termId` sai de `useTermScope` (`allActiveTerms` + `sortedTerms`) e a timeline
  mapeia por `id`. Dois períodos com o mesmo `ordinal` deixam de colidir: cada quadradinho
  mostra o resumo do período que **realmente** foi aquele.
- `termScope.ts:164` `grade: Course[]` → `allActive: Course[]`, com doc explícita ("tudo que
  está ativo, **incluindo** disciplinas avulsas e de períodos anteriores"), e
  `gradeCourses` (`:86`) → `allActiveCourses`. `WeekGrid` e a grade de 12 colunas
  (`FaculdadeView.tsx:65,108,130,167` — hoje `scope.grade`) passam a usar `allActive`: a
  grade da semana é sobre a sua semana. `DisciplinasGrid` e o contador do hero
  (`FaculdadeView.tsx:99-100`) usam `active`. É o D9 da SPEC-006: mata a armadilha de nome
  sem mudar o que a usuária vê.

---

## Modelo de dados

**Nenhuma mudança.** Nenhum campo novo, nenhuma migração, **`SCHEMA_VERSION` continua 19**,
nenhum golden regerado, nenhum crate Rust tocado.

| o que | onde | por quê não é dado |
|---|---|---|
| `canRollover` / `shouldNudgeRollover` | `packages/domain/.../term.ts` | predicados puros, derivam de `status`/`startedAt`/`ordinal` que já existem |
| `nextOrdinal` editável | estado local do wizard | é o valor do `ordinal` que **já** será gravado em `AcademicTerm` |
| `totalSemesters` editável | `profile.totalSemesters` | campo que **já** existe no contrato (Zod: `backupSchema.ts:25`; Rust: `contracts/schema.sql`) |
| expansão do card do histórico | `useState` local | é estado de tela, não de domínio |

`ROLLOVER_NUDGE_MONTHS` é constante de código, não preferência persistida: um app pessoal
não precisa de um knob para isso, e a escolha do mês é informação de domínio do calendário
letivo, não do usuário.

---

## Onde nasce cada controle (mapa de arquivo)

| controle | arquivo | ponto de entrada |
|---|---|---|
| card do período, corrigir ordinal, total do curso, **virar o semestre** | `src/components/views/perfil/JourneyTermCard.tsx` (existência) | `PerfilView.tsx` — **movido para logo abaixo do `ProfileHeader`** |
| **botão "virar" permanente na Faculdade (variante quieta)** | `src/components/views/faculdade/TermRolloverCta.tsx` | `FaculdadeView.tsx:108-114` |
| aviso de "tá acabando" (ênfase) | idem | idem |
| aviso "seu Nº está além do total" | `JourneyTermCard.tsx` | idem |
| input do próximo `ordinal` | `src/components/wizards/SemesterWizard.tsx` | passo 1 |
| abrir o primeiro período | idem | passo 0, caso `activeTerm === null` |
| reabrir período encerrado | `src/components/terms/TermHistoryScreen.tsx` | card `encerrado` |
| expansão do resumo do card | idem (estado local) | botão "ver o resumo inteiro" |
| `canRollover` / `shouldNudgeRollover` | `packages/domain/src/core/domain/term.ts` | — |
| `totalSemesters` na action | `src/context/dataActions.ts` (`setTotalSemesters`, junto de `correctTermOrdinal`) | stepper do card |
| ordinal/label por argumento | `src/lib/stickers.ts` · `src/lib/profileMeta.ts` | — |

---

## Critérios de aceite

- [x] **N1** Existe um caminho para virar o semestre com um período ativo em **qualquer**
      momento do semestre, em 2 toques a partir de qualquer aba. Teste de navegação: com
      `activeTerm.startedAt` de **ontem** e `ordinal = 2` de um curso de 10, o botão está
      visível e o wizard abre.
- [x] **N1b** `shouldNudgeRollover` retorna `false` para um período aberto há 1 mês e
      `ordinal < total`; `true` com 4 meses transcorridos; `true` se `ordinal >= total`.
      Testes em `term.test.ts` (substituindo os 4 casos de `shouldOfferRollover:340-350`).
- [x] **N1c** `canRollover(null) === false`; `canRollover(ativo) === true`;
      `canRollover(encerrado) === false`. Nenhum call-site usa `canRollover` como gate de
      *visibilidade* — só de *habilitação*.
- [x] **N2** O total do curso é editável no Perfil, com clamp `1..12`: `0`, `13` e `abc` são
      rejeitados; `12` é aceito. O passo da timeline se **redesenha** para o novo total.
- [x] **N2b** Com `totalSemesters = 8` e o período ativo no `9`, o input aceita `9` e grava
      `9`. **Este é o teste da trava circular** — falha antes da correção.
- [x] **N2c** Com `ordinal > totalSemesters`, o card mostra o aviso explícito (não 100% e
      "0 restantes" em silêncio).
- [x] **N3** A partir do Perfil: histórico → back → **Perfil** (não a wizard). A partir do
      passo 1 do wizard: histórico → back → **wizard no passo 1**.
- [x] **N3b** `routeToStack({ tab: 'perfil', termHistory: true })` → `[perfil, termHistory]`
      (2 telas). O teste `routing.test.ts:521-526` é **invertido**, não removido.
- [x] **N3c** Recarregar `#/perfil/semestre/historico` mostra o histórico; o back vai para o
      Perfil. Recarregar `#/perfil/semestre/historico/trm-3` abre o resumo de `trm-3`
      expandido **sem** empilhar.
- [x] **N3d** "ver o resumo inteiro" 5 vezes na mesma tela mantém a pilha com **2** telas.
- [x] **N3e** Nenhum doc-comment afirma que o histórico é filho do wizard. `grep -rn "passo 1
      dele\|volta para o wizard\|volta pro wizard" src/ packages/` → vazio.
- [x] **N4** O botão de corrigir tem **rótulo** e ≥44px de área de toque; fica acima de
      `JourneySummary` no DOM do Perfil.
- [x] **N4b** O card tem 4 partes: label, corrigir, total do curso, virar o semestre.
- [x] **N4c** Com um período `encerrado` de ordinal errado: histórico → "reabrir como atual" →
      `correctTermOrdinal` → o ordinal certo. As duas ações juntas, **sem** passar pela
      wizard.
- [x] **N5** No passo 1, mudar o próximo `ordinal` para `7` grava o `7º semestre`; o passo 4
      mostra "vai abrir: 7º semestre".
- [x] **N5b** Com `totalSemesters = 8` e próximo `ordinal = 9`: o passo 1 mostra o **aviso**
      "além dos 8 do curso — ajusta no cartão ♡" e o número digitado **é gravado** como
      `9º semestre`. O cap por total do curso saiu de `planTermRollover` (SPEC-008 D3 vence
      a SPEC-006 D8): um teto que depende de outro campo editável esconde o erro em vez de
      mostrá-lo. O limite passa a ser o teto global (`MAX_TERM_ORDINAL`), e o total tem
      editor desde N2.
- [x] **N5c** Sem período ativo, o card do Perfil mostra "abrir meu 1º semestre ♡"; o wizard
      oferece o mesmo; gravar cria o período **sem** `planTermRollover` e sem `throw`.
- [x] **N5d** Sair no passo 2 e voltar → as decisões voltaram (`draftKey: 'semester'`).
      Com decisões alteradas, o scaffold pede confirmação ao descartar.
- [x] **N6** O contador de flashcards do passo 3 ignora os já revisados desde
      `activeTerm.startedAt`.
- [x] **N7** Com dois períodos de `ordinal` 7 (um ativo, um encerrado), a timeline mostra o
      resumo do **encerrado** no quadradinho do 7º, e o período ativo é o "você está aqui".
- [x] **N8** O adesivo de "formada" destrava pelo `ordinal` do **período ativo**.
      `grep -rn "profile.semester" src/lib/stickers.ts src/lib/profileMeta.ts` → vazio.
- [ ] **D7** `useTermScope` devolve `allActive` (não `grade`); `WeekGrid` usa `allActive`;
      `DisciplinasGrid` e o hero usam `active`. `npm run lint` verde (a renomeação é
      typecheck-sensitive de propósito).
- [ ] **D4/a11y** `role="radiogroup"` no passo 2, `role="status"` nos contadores, foco no
      `headline` a cada passo, `aria-current="step"` no indicador.
- [ ] **Gate** `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`
      + `npm run build` verdes. `SCHEMA_VERSION` continua **19**; `contracts/golden/`
      **inalterado** (`git diff --stat contracts/` vazio).

---

## Plano de implementação

Ordem por dependência. Cada fase fecha com o gate verde. Nenhum crate Rust é tocado,
`SCHEMA_VERSION` não sobe, goldens não são regerados.

### F0 — Blindagem (testes que pegam os bugs antes da correção)
`term.test.ts`: inverter os 4 casos de `shouldOfferRollover` para `shouldNudgeRollover`
(4 meses / `ordinal >= total` / `null`); `JourneyTermCard.test.tsx`: **ordinal 9 com total 8**
(o teste da trava circular) e o `aria-label` do botão de rótulo;
`routing.test.ts`: **inverter** `:521-526` para 2 telas; teste de render do
`TermHistoryScreen` com `shouldNudgeRollover` `false` provando que o botão "virar" **existe**
. · **S**

### F1 — Domínio (`packages/domain/src/core/domain/term.ts`)
`canRollover` + `shouldNudgeRollover` + `ROLLOVER_NUDGE_MONTHS` (D1) · remover
`shouldOfferRollover` · docstrings que citam o ramo morto. · **S**

### F2 — Navegação (D5)
`openTermHistory` empilha sobre a base atual · `routeToStack` → 2 telas ·
`TermHistoryScreen` com expansão em estado local · 3 doc-comments corrigidos ·
`headerConfig.ts:169-171` reescrito. · **M**

### F3 — Superfície dos números (D2, D3)
`totalSemesters` na action (`setTotalSemesters`, clamp `1..12`) · stepper no
`JourneyTermCard` · botão de rótulo com `.touch-target` · `max` do input → `MAX_TERM_ORDINAL`
· aviso de `ordinal > total` · `JourneyTermCard` para logo abaixo do `ProfileHeader` ·
`TermRolloverCta` com variante quieta (sempre renderizado) + `JourneyTimeline` com a
variante de ênfase. · **L**

### F4 — Wizard + escopo (D4, D6, D7)
input do próximo `ordinal` no passo 1 · caso "abrir o primeiro período" no passo 0 ·
`totalSemesters` passado a `planTermRollover` + aviso do clamp no passo 4 · `draftKey` +
`isDirty` · `openCards` filtrado · a11y dos passos · `stickers`/`profileMeta` por argumento ·
`scope.grade` → `allActive` + `JourneyTimeline` por `id`. · **L**

### F5 — Fechamento
Testes do `SemesterWizard` (commit, `ordinal` editado, clamp anunciado, `draftKey`) ·
testes de render do `JourneyTermCard` (stepper, aviso, rótulo) · **`SPEC-006` reconciliada**
(cabeçalho → implemented, tabela de 3 colunas: feito aqui / feito lá / ainda aberto) ·
`.context/backlog.md` Fase 22 → fechada com o saldo real · `AGENTS.md` §SPEC-005 e
`.context/architecture.md` (§4, rotas) atualizados · este doc → `✅`. · **M**

### Fora de escopo (fica aberto)

`saveMinimal` (gravar sem fechar) · `schema.sql` canônico (fase Rust) · paridade Rust
da SPEC-006/008.

---

## Verificação

```bash
npm run lint                                # tsc --noEmit
npm run test                                # vitest (gate do mobile)
node .github/scripts/check-boundaries.mjs   # packages/* não toca react/capacitor
npm run build
git diff --stat contracts/                  # tem que estar vazio (nada de golden)
```

**Gate de conteúdo:** nenhum. `SCHEMA_VERSION` continua 19, nenhum goldens é regerado,
nenhum `cargo` é rodado. Esta spec mexe em **superfície e navegação**, não em formato.

**Riscos que sobram:**

- **F3 é o phase com mais churn de UI** (Perfil + Faculdade). Vai por partes, com o gate
  verde entre elas, e nunca mistura com F1 (que é onde está a lógica).
- **`shouldNudgeRollover` é uma heurística nova.** Com 4 meses, um semestre de 4 meses
  (trimestral) ou de 6 (semestral) faz o nudge cedo ou tarde. O botão **sempre** visível (D1)
  é o que garante que a heurística nunca vire beco sem saída — se a heurística errar, o
  custo é um aviso fora de hora, não um caminho perdido.
- **F2 muda comportamento coberto por teste.** `routing.test.ts:521-526` e os testes de
  `motion/slideKeys` / `motion/intent` (`wizard semester → termHistory` como push) podem
  precisar de ajuste — a intenção de movimento **continua sendo push**, o que muda é a base.
- **O passo 1 do wizard ficar editável aumenta a superfície de erro** (basta digitar 99).
  Mitigação: clamp `1..12` no input **e** no `planTermRollover` (defesa em duas camadas),
  mais o aviso do passo 4.
