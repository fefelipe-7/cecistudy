# Spec: Período letivo (`AcademicTerm`) e progressão de semestre

> **Status: especificada (aguardando implementação).**
> Origem: investigação de ponta a ponta (3 agentes) sobre o tratamento de `semester`
> no app, na camada `packages/*`/contrato cross-língua, e pesquisa de padrões de
> domínio (1EdTech LIS, Ed-Fi, OneRoster, Canvas, Moodle, Google Classroom,
> PowerSchool, Banner) + padrões de arquivamento/retenção.
> **Escopo decidido: MVP sem Rust.** Passos 1–9. O passo 10 (paridade Rust) fica
> documentado como fase separada, porque o workspace Rust tem gate próprio
> (`cargo`) e o desktop Flutter ainda não tem UI.
> **Wizard:** o assistente de virada é um `WizardFlow` (`'semester'`) montado sobre
> o `WizardScaffold`/`WIZARD_REGISTRY` que **já existem** — não é tela nova fora
> do sistema de wizards. Ver §Infraestrutura em §UX/UX.

---

## Objetivo

Hoje o app **não tem progressão de semestre**. O semestre é um número decorativo
(`UserProfile.semester: number`) que:

- **não filtra nada** — nenhuma view, selector, query SQL ou regra de negócio
  recorta por semestre. Disciplina do 3º semestre continua na grade semanal e
  aparece como "aula de hoje" no 7º;
- **não arquiva nada** — zero ocorrência de `fecharSemestre` / `archive` /
  `term` / `semesterId` no código (ver §Diagnóstico);
- **não tem resumo, nem fechamento, nem histórico** — "virar semestre" é digitar
  um número num `<input type="number">` sem clamp em
  `src/components/views/perfil/PersonalizationSection.tsx:124`;
- **não propaga** — `profile` é singleton com LWW do **objeto inteiro**
  (`packages/data/src/collections.ts:91` + `packages/sync/src/merge.ts`), então
  celular no 5º e desktop no 6º fazem ping-pong do semestre **e de `name`,
  `dailyQuote`, `totalSemesters`** a cada sync.

Esta spec introduz **`AcademicTerm`** — o período letivo como **entidade de
domínio com status** (`planejado → ativo → encerrado`) — e um wizard de virada
que fecha o semestre com uma **carta de fechamento** (resumo real derivado do
estado) e abre o próximo com o que fica.

O `status` do período é o **único driver de visibilidade**. Não há soft-delete,
não há `archivedAt`, não há `termId` em sete tabelas, não há event sourcing.

### Goals

1. A usuária **vira semestre num assistente guiado**, vendo o resumo do que ela
   fez e decidindo o que continua, o que fica e o que vai atrás.
2. As telas passam a refletir **o período atual**, não o histórico vitalício.
3. O que é do semestre anterior **continua consultável** (busca, templo, revisão)
   sem poluir o "hoje".
4. A virada é **reversível** e **coesa com o sync** (nenhuma mutação em lote).
5. Consertar 4 defeitos pré-existentes que a feature expõe (F1–F4 em §Correções
   colaterais).

### Non-goals

- **Não** é multi-campus, multi-aluna ou multi-currículo. Sem login, sem
  matrícula, sem repetição de disciplina/reprovação — não existe "enrollment" no
  cecistudy, e é por isso que o escopo por `courseId` é **exato** (§Escopo por
  herança).
- **Não** é histórico escolar oficial (transcript), nem cálculo de IRA/média
  ponderada. Ficam para uma spec própria.
- **Não** é reprovação/"promoção" de aluno. Não existe outro aluno.
- **Não** é carga horária de mercado (créditos, 180 pontos). O app mostra as
  **horas reais registradas** (`Course.totalHours`/`hoursDone`), que já existem.
- **Não** toca nos crates Rust (ver §Não-objetivos e §Fase 10).

---

## Diagnóstico (o que existe hoje)

Achados da investigação, com `arquivo:linha`. Este é o justify de cada decisão.

### 1. O semestre é rótulo, não dimensão

| Fato | Onde |
|---|---|
| `UserProfile.semester: number` + `totalSemesters: number` | `src/types/profile.ts:7-8` |
| `Course.semester: string` **livre** (`"6º Semestre"`, `"6º sem"`, `"semestre livre"`, `"a definir"`) | `src/types/entity.ts:64`, `CourseWizard.tsx:58,324`, `EditCourseModal.tsx:121,175` |
| `number` (perfil) e `string` (curso) **nunca se cruzam** — nenhuma comparação `course.semester === profile.semester` no app | — |
| Índice SQL `idx_course_semester` que **nenhuma query usa** | `src/lib/db/migrations/user.ts:54`, `cecistudy-rust/contracts/schema.sql:46` |
| `profile.semester` **não é consultável por SQL** (vive só no `data_json`) | `src/lib/db/migrations/user.ts:42-45` |

`semester` significa **duas coisas diferentes com o mesmo nome**: contador de
jornada (perfil) e rótulo de período (curso). Essa ambiguidade é a razão de o
problema nunca ter aparecido como bug.

### 2. Nenhum filtro por semestre, em lugar nenhum

Das 5 views principais: `HomeView` e `EstudosView` e `BibliotecaView` **nem
importam `profile`**. `FaculdadeView` usa só para exibir (`HeroSection.tsx:29`).
`PerfilView` usa para exibir e editar.

Consequências concretas (mistura de períodos visível ao usuário):

| Tela | Código | Problema |
|---|---|---|
| Home "aulas de hoje" | `HomeView.tsx:50` → `schedule.ts:59-62` | aula de disciplina do 3º aparece como "hoje" no 7º |
| Faculdade "minha semana" | `FaculdadeView.tsx:91` `WeekGrid` | grade com todas as disciplinas de todos os períodos |
| Faculdade hero | `FaculdadeView.tsx:79-84` | título diz "7º semestre", contagem `courses.length` = todos os períodos |
| Perfil (11 tiles) | `PerfilView.tsx:200-221` | `studyMinutes`, `pagesRead`, `tasksDone`, `courses.length`… somam **histórico total** |
| Busca global | `GlobalSearchModal.tsx:158-171` | indexa tudo; sem recorte temporal |
| Stickers | `stickers.ts:57-190` | contadores tipo "grade montada" (`courses ≥ 3`) acumulam para sempre |

### 3. Zero mecanismo de progressão

Varredura por `fecharSemestre` / `novoSemestre` / `startSemester` /
`advanceSemester` / `semesterId` / `virada de semestre` / `período letivo` /
`roll` / `carry` em `src/`, `packages/`, `apps/`, `cecistudy-rust/` → **0
resultados**. `archive`/`arquivado` só aparece em status de
`projects`/`marketing`/`knowledge` (não-ACADÊMICOS, sem relação com semestre).

O que existe no lugar: (a) o número mutável no perfil; (b) `percentDegree`
(`PerfilView.tsx:199`); (c) `JourneyTimeline` — grade de `totalSemesters` cards
com "✓ concluído" **inferido do número**, sem nenhuma evidência; (d) 3 stickers
como marcos (`stickers.ts:74,142,146`).

### 4. Defeitos que a feature expõe

| # | Defeito | Onde |
|---|---|---|
| 🔴 **D1** | `totalSemesters` **não é editável** após o onboarding — `handleSaveProfile` grava `name, semester, university, dailyQuote, photoUrl` e nunca `totalSemesters`; `PersonalizationSection` não tem o campo. 3 stickers dependem dele | `PerfilView.tsx:171-177`, `PersonalizationSection.tsx:122-142` |
| 🔴 **D2** | `profile` singleton LWW do objeto inteiro → **ping-pong de semestre + campos não relacionados** entre dispositivos | `collections.ts:91`, `merge.ts:65-70` |
| 🔴 **D3** | Backup legado com `profile` presente mas **sem** `semester`/`totalSemesters` é **rejeitado** no import (`backupSchema.ts:24-25` obrigatório + `exportImport.ts:124` só completa se `profile` estiver totalmente ausente) → toast "esse arquivo de backup não é compatível ♡". Evidência: `contracts/golden/migrations/legacy_payload.v1.json` tem exatamente esse perfil | `packages/data/src/backupSchema.ts:22-30` |
| 🟡 **D4** | Sem clamp: input aceita `0`/`-3`/`99`; `semestersLeft` fica **negativo** ("-2 semestres restantes"); `percentDegree` pode dar `1237%` ou `NaN` | `PerfilView.tsx:199,315`, `PersonalizationSection.tsx:124` |
| 🟡 **D5** | `useState` do formulário do Perfil dessincronizado (sem `useEffect` de re-sync) — após import/sync, salvar reescreve `semester` com valor velho | `PerfilView.tsx:161` |
| 🟡 **D6** | Copy enganosa: "tudo anotado com carinho **ao longo dos semestres**" (`JourneySummary.tsx:27`) e "sua jornada **até aqui**" (`PerfilView.tsx:319`) sobre totais vitalícios | ver §F3 |
| 🟢 **D7** | `src/lib/copy.ts:187-195` — objeto `BADGE` inteiro (inclui `semesterLabel`, `completed`, `inProgress`, `awaiting`) **não é importado em lugar nenhum**; a UI hardcodeia os textos | `src/lib/copy.ts` |
| 🟢 **D8** | `SEMESTER_OPTIONS` duplicado: array local no onboarding vs. input livre no Perfil | `OnboardingScreen.tsx:30` |
| ⚠️ **D9** | Drift de contrato: `USER_SCHEMA_VERSION = 1` em `packages/data/src/schema.ts:14` mas `= 2` em `src/lib/db/migrations/user.ts:17` | 2 arquivos |
| ⚠️ **D10** | `verify-schema.mjs` **não roda no CI** (`.github/workflows/ci.yml` roda só lint + test + boundaries) | `.github/workflows/ci.yml:29-34` |

---

## Decisões de design

### D1 — `AcademicTerm` como registro de domínio com `status`

**Escolhido.** `AcademicTerm { status }` com o status como único driver de
visibilidade, `Course.termId` + `Course.status`, e **herança por `courseId`**
para todo o resto.

**Alternativas rejeitadas:**

- **`termId` em toda entidade (estilo Ed-Fi).** O Ed-Fi põe `termId` em
  `CourseOffering` e `Enrollment` porque *enrollment* é objeto de primeira
  classe com ciclo de vida próprio (reinscrição, repetição, reprovação). O
  cecistudy não tem enrollment — é uma pessoa só, que não reprova nem tranca.
  Colocar `termId` em `class_note`/`task`/`assessment`/`reading`/`study_session`/
  `flashcard` custaria 6 colunas + 6 índices + 6 caminhos de `normalize.ts` +
  divergência garantida entre o `termId` do curso e o das filhas.
- **Reaproveitar `workspaceId`.** Zero campo novo, mas `Workspace.kind` é
  `'academico' | 'profissional' | 'pessoal'` — semântica errada; e o isolamento
  por workspace **nunca foi implementado no consumo** (nenhum
  `.filter(x => x.workspaceId === currentWorkspaceId)` no app;
  `DataClientProvider.tsx:828-921` expõe coleções cruas). Reaproveitar exigiria
  implementar o que não existe + sujar workspaces.
- **Soft delete (`archivedAt` em tudo).** *"A `deleted_at` column turns every
  future query into a conditional one, and the cost is not the extra predicate.
  Unique constraints stop working… and any query written by someone who does not
  know about the column silently returns deleted data."* (ankit-rana.com/logs/40).
  Arquivar **não é delete** — é transição de estado do período. O tombstone do
  `SyncIndex` já cobre deleção real.
- **Tabela/arquivo paralelo por semestre** (`courses_archived`). Duplica a
  superfície de query ("you now have two systems to query") e quebra o merge LWW
  por registro.
- **Temporal tables / SCD-2.** Impossível no SQLite: *"It's not possible to
  provide an equivalent to Temporal Tables from within SQLite"* (bytefish.de) —
  não há transaction time estável, e triggers não têm ordem garantida. E não
  é necessário: um período é um intervalo de vigência de um fato que **já**
  temos (`term.startedAt`/`endedAt`).
- **Event sourcing.** *"The append-only, immutable nature of an event store
  conflicts with data protection regulations"* e custa schema versioning +
  upcasters + snapshots. Desproporcional para mono-usuário — e o `SyncIndex`
  (tombstone + `records`) **já é** um log de "quando cada registro mudou".
- **Só filtro por intervalo de datas global.** Não dá resumo de fechamento, nem
  histórico, e depende de toda entidade ter data — `ClassNote`, `Task`,
  `Assessment`, `ReadingItem`, `StudySession` e `Flashcard` **não têm** campo de
  data próprio confiável.

### D2 — `status` só avança; `encerrado` não volta a `ativo`

Correção de engano ("era 6º, não 5º") é modelled como **criar um novo
período / re-abrir** (`reabrirTerm` grava `status: 'encerrado' → 'ativo'` com
novo `statusTransitionAt`), nunca reescrevendo o resumo encerrado. É o `re-roll`
do Banner como operação de primeira classe, e o `read-only` do Canvas. O resumo
de um período encerrado é **imutável** (é o "transcript" do semestre).

### D3 — Escopo por herança: só `Course` ganha `termId`

| Entidade | Term-scoped? | Como |
|---|---|---|
| `Course` | ✅ | `termId` + `status` diretos |
| `ClassNote`, `Task`, `Exam`, `ReadingItem`, `StudySession`, `Flashcard` | ✅ herdado | via `courseId` — **zero coluna nova** |
| `LooseNote` | ❌ | tem `date`/`updatedAt` próprios; é global por natureza |
| `InternshipLog` | ❌ | tem `date`/`phase` próprios; `phase` já é a dimensão |
| `QuizSession` | ❌ | tem `createdAt` |
| `TccData` | ❌ | atravessa todos os períodos |
| `StreakData` | ❌ | **global por natureza** — a streak atravessa a virada (decisão consciente) |
| `Concept`, `Author`, `Approach`, `Technique`, obras do catálogo | ❌ **jamais** | catálogo imutável |

### D4 — `profile.semester` sai de ser fonte de verdade (corrige D2/ping-pong)

1. `profile.totalSemesters` **fica** (duração da jornada, muda raramente) e passa
   a ser **editável** (corrige D1).
2. `profile.semester` **é derivado** do `ordinal` do `AcademicTerm` ativo. O campo
   **permanece** no tipo e no `data_json` (compat com golden files e com o Rust),
   mas **não é lido** para nada. Comentário `@deprecated` aponta para a derivação.
3. **Nenhum ponteiro "qual período estou vendo" é persistido nem sincronizado.**
   O período ativo é derivado da lista (`status === 'ativo'`; desempate por
   `statusTransitionAt` mais recente). Isso é o que mata o ping-pong: não existe
   nada mutável por dispositivo para conflitar. Se um dia a usuária quiser
   "olhar" um período encerrado, isso é estado de tela (`useState` na
   `TermHistoryScreen`), não persistência.

> ⚠️ Consequência: a virada **propaga** entre dispositivos (celular vira
> semestre → desktop recebe). Isso é o comportamento desejado para uma pessoa só
> com 2 dispositivos, e o oposto do bug atual (número alternando sozinho).

### D5 — A virada é um rollover por cabeçalho, nunca update em lote

O `SyncIndex` carimba **por registro** (`stamp.ts:108`). Um "atualizar `termId`
de todas as disciplinas" local seria uma sequência de escritas independentes: o
dispositivo A e o B sincronizariam em instantes diferentes e o estado misto
("3 disciplinas no 6º, 4 no 5º") é **indistinguível** de um estado legítimo.

Portanto a virada escreve:
- **1** `AcademicTerm` (status → `encerrado`) + **1** novo `AcademicTerm`
  (`ativo`) — 2 registros;
- **N** `Course.status = 'arquivado'` — **só as que a usuária escolheu arquivar**,
  cada uma individualmente;
- **1** `TermSummary` congelado no período encerrado.

Disciplina que "continua" **mantém o mesmo `id`** e **não é tocada** — ela
simplesmente passa a pertencer ao período novo porque a association é
`termId` do curso… não: a disciplina continua com o `termId` antigo, e o período
antigo é `encerrado`. Ou seja: **disciplina que continua precisa de escrita** —
uma por disciplina, individualmente, com carimbo próprio. Isso é intencional e
está no plano: são escritas independentes, cada uma com o seu carimbo, e o
estado misto durante a convergência é **detectável** (a invariante "todo curso
ativo pertence a um período ativo" é checada no merge, §D6).

### D6 — Invariante "no máximo um período ativo" sobrevive ao merge

`enforceSingleActiveTerm(terms)` roda (a) no fim de `mergeSyncedDatabases` e (b)
depois de toda virada. Se houver >1 `ativo`, vence o de `statusTransitionAt` mais
recente; os outros **degradam para `encerrado` localmente** e são re-marcados
(tombstone não — só novo carimbo). Teste dedicado em `merge.test.ts`.

### D7 — `AcademicTerm` é `array` com LWW por registro

`academicTerms` entra em `RECORD_COLLECTION_KEYS` (`stamp.ts:15-33`), **nunca**
em `SINGLE_COLLECTION_KEYS`. Motivo: se fosse singleton, dois dispositivos
fechando períodos diferentes fariam o objeto inteiro se sobrescrever e perder o
histórico. Com LWW por registro, cada `AcademicTerm` converge isoladamente.

---

## User Stories / Critérios de aceite

1. **Virar semestre com resumo.** "Como usuária, quando o semestre acaba, eu
   quero ver um resumo do que eu fiz antes de abrir o próximo — para sentir o
   quanto andei."
   - Aceite: o wizard abre na tela "carta de fechamento" do período ativo, com
     números **derivados do estado real** (nº de disciplinas, aulas anotadas,
     tarefas concluídas, páginas lidas, minutos de foco, melhor sequência da
     streak, horas registradas) e uma frase quente gerada das métricas. A tela
     é **read-only**: nada é gravado ao abrir, e ela pode ser revisitada depois
     pelo histórico. Sem `status === 'ativo'` na base, o CTA mostra
     "começar o 1º semestre" em vez disso.

2. **Decidir o que continua e o que fica.** "Como usuária, eu quero escolher,
   disciplina por disciplina, o que continua comigo e o que sai da grade — sem
   perder nada."
   - Aceite: a lista mostra as disciplinas do período com contagem
     ("clínica comporta — 32 aulas, 14 horas") e 3 ações: **continuar** (vai para
     o período novo, mesmo `id`, com o histórico de anotações), **arquivar**
     (sai da grade, continua pesquisável), **deixar pra depois** (fica `ativo`
     num período `encerrado` — grace period; o app mostra aviso não-bloqueante
     e oferece arquivar depois). Escolha default = continuar. Preview do diff
     em linguagem natural antes de confirmar.

3. **Saber o que fica pra trás.** "Como usuária, eu quero saber que pendências
   não vão sumir, e decidir o que fazer com elas."
   - Aceite: a etapa lista tarefas não concluídas, leituras em andamento,
     flashcards com revisão vencida e registros de estágio, cada um com default
     sensato (empurrar para o período novo) e contagem explícita ("3 tarefas
   serão adiadas ♡"). Nada é apagado.

4. **Confirmar e poder voltar atrás.** "Como usuária, eu quero confirmar com
   segurança e poder desfazer se eu me enganar."
   - Aceite: a confirmação lista exatamente o que vai acontecer; após confirmar,
     o Perfil mostra um toast com **"desfazer"** que re-executa a virada
     inversa (reabre o período anterior, devolve as disciplinas, remove o
     período novo se ele estiver vazio). Nenhuma escrita destrutiva em nenhum
     momento — por isso a reversibilidade é trivial.

5. **Abrir o próximo semestre.** "Como usuária, quero uma lista do que fazer
   agora que o semestre começou."
   - Aceite: tela "bora abrir o {ordinal}º semestre?" com: criar disciplinas
     (o `CourseWizard` já pré-preenche o período pelo `ordinal` derivado, sem
     mais o `${profile.semester}º sem` hardcoded), revisar pendências adiadas,
     e uma dica do cecinho conectando as disciplinas novas aos conceitos que ela
     já viu no templo.

6. **O app parar de misturar semestres.** "Como usuária, eu quero que a
   faculdade e a home mostrem só o que é de agora, e que o que ficou para trás
   eu ainda consiga consultar."
   - Aceite: `WeekGrid`, `DisciplinasGrid`, "aulas de hoje" (Home),
     `pendingExams`/`pendingTasks` e o plano de ação recortam pelo período
     ativo. A busca global inclui períodos anteriores, com chip de período no
     subtítulo. O detalhe de disciplina arquivada abre normalmente (read-only
     para o que depende de participação), com aviso visual.

7. **Ver o histórico.** "Como usuária, eu quero olhar como foi cada semestre."
   - Aceite: a `JourneyTimeline` do Perfil passa a listar os períodos reais
     (com o `TermSummary` de cada encerrado) em vez de inferir "✓ concluído"
     pelo número. Período sem registro aparece como "aguardando".

8. **Editar o total de semestres.** "Como usuária, quero corrigir a duração do
   meu curso depois."
   - Aceite: campo "total de semestres do curso" no Perfil → personalização,
   com clamp `1..12`; `ordinal` do novo período respeita esse teto
   (o teto de `ordinal` na criação de período respeita esse valor).

9. **Meu backup antigo ainda entra.** "Como usuária, quero importar o backup que
   fiz no semestre passado sem perder nada."
   - Aceite: import de payload com `profile` sem `semester`/`totalSemesters`
   succeede (backfill na migração 18) e cria o `AcademicTerm` correspondente.

10. **Continuar no outro dispositivo.** "Como usuária, quero que a virada
    apareça no meu celular sem eu precisar fazer de novo."
    - Aceite: após o sync, os dois dispositivos mostram o mesmo período ativo e o
    mesmo histórico; a lista de disciplinas é a mesma; nenhum campo "pinga".

11. **Pureza e reversibilidade** — *(critério técnico, sem UI)*:
    - Aceite: `buildTermSummary` é uma função pura; dados idênticos de entrada
      produzem `TermSummary` idêntico (sem `Date.now()` dentro);
    - `closeTerm`/`openTerm` são transições puras e **idempotentes** (aplicar duas
      vezes = mesmo resultado);
    - `enforceSingleActiveTerm` nunca deixa >1 `ativo`;
    - `MIGRATIONS[18]` é idempotente e **determinística** (fixture golden
      gerável).

---

## Modelo de dados proposto

### `AcademicTerm` (`packages/domain/src/core/domain/term.ts`, novo)

```ts
/** Ciclo de vida do período letivo. Só avança — `encerrado` não volta a `ativo`
 *  sem uma transição explícita (`reabrirTerm`). */
export type TermStatus = 'planejado' | 'ativo' | 'encerrado';

/** Situação de uma disciplina dentro do app. `arquivado` = saiu da grade ativa
 *  mas continua pesquisável. Nunca é delete. */
export type CourseStatus = 'ativo' | 'arquivado';

/** Resultado imutável do fechamento — o "transcript" do período. */
export interface TermSummary {
  closedAt: string;                                  // ISO — quando foi congelado
  courses: number;
  archivedCourses: number;
  carriedCourses: number;                            // continuaram no próximo
  classNotes: number;
  tasksCompleted: number;
  tasksCarriedOver: number;
  readingsCompleted: number;
  pagesRead: number;
  focusMinutes: number;
  loggedHours: number;                               // soma de attendance/hoursDone
  bestStreak: number;
  grades: Array<{ courseId: string; label: string; grade?: number }>;
  /** Frases prontas no tom do app, geradas das métricas. */
  highlights: string[];
}

export interface AcademicTerm {
  id: string;                    // `trm-` + makeId (packages/domain/src/core/domain/ids.ts:36)
  workspaceId?: string;          // paridade com o resto do domínio
  /** Rótulo exibido: "6º semestre". */
  label: string;
  /** 1..totalSemesters — usado pela timeline e pelo cálculo de % da graduação. */
  ordinal: number;
  status: TermStatus;
  /** ISO date (YYYY-MM-DD). O fim é derivado quando `status === 'encerrado'`. */
  startedAt: string;
  endedAt?: string;
  /** Quando o `status` mudou pela última vez — desempate da invariante (D6). */
  statusTransitionAt: string;
  createdAt: string;
  updatedAt: string;
  /** Congelado no fechamento. Presente só quando `status === 'encerrado'`. */
  summary?: TermSummary;
}
```

### `Course` (`src/types/entity.ts`) — 2 campos opcionais

```ts
  /** Período letivo ao qual a disciplina pertence (SPEC-005). `null` = fora de
   *  período (disciplina avulsa, template, dado importado sem período). */
  termId?: string | null;
  /** Situação da disciplina. Default `'ativo'`. Arquivar nunca apaga. */
  status?: CourseStatus;
```

`Course.semester: string` **permanece** (deprecado) — é lido só como fallback de
exibição quando `termId` é `null`. Não entra em filtro nenhum. (Removê-lo de
uma vez quebraria `payload.rs:248`, que valida `semester` como obrigatório no
`data_json`.)

### Invariantes (em `packages/domain`, **não** na UI)

```ts
export const MAX_TERM_ORDINAL = 12;

/** No máximo um período ativo. */
export function enforceSingleActiveTerm(terms: AcademicTerm[]): AcademicTerm[];

/** `status` só avança. Transições inválidas devolvem o array inalterado. */
export function closeTerm(terms, termId, closedAt, summary): AcademicTerm[];
export function openTerm(terms, termId): AcademicTerm[];        // previsto → ativo
export function reopenTerm(terms, termId, now): AcademicTerm[];  // encerrado → ativo

/** Toda disciplina `ativa` deve pertencer a um período `ativo` (ou a nenhum —
 *  `termId === null` é o escape hatch anti-órfão). */
export function assertTermIntegrity(terms, courses): { orphans: Course[] };

/** Período ativo derivado. Sem estado persistido, sem ponteiro por dispositivo. */
export function resolveActiveTerm(terms: AcademicTerm[]): AcademicTerm | null;
```

### `TermSummary` é derivado, não digitado

`buildTermSummary(state: TermSummaryInput, term, closedAt)` — **função pura** em
`packages/application/src/term/rollover.ts`. Reusa as agregações que já existem
(`deriveCases` em `src/lib/`, `streakStats` em `src/lib/streak.ts`) e aplica o
recorte de período (§Escopo por herança). Recebe `closedAt` por argumento —
**nunca** `Date.now()` dentro (mesmo padrão de `quiz/playState.ts:1-3` e
`focus/timer.ts`).

### Filtros de período (`src/lib/termScope.ts`, novo)

```ts
export const coursesOfTerm   = (courses, termId) => Course[]
export const activeCourses   = (courses, terms) => Course[]      // status ativo + período ativo
export const archivedCourses = (courses) => Course[]
export const isArchived      = (course, terms) => boolean       // derivado, sem coluna
export const degreeProgress  = (ordinal, total) => number       // clamp 0..100
export const semestersLeft   = (ordinal, total) => number       // clamp ≥ 0
export const clampOrdinal    = (n, total) => number            // clamp 1..min(12, total)
```

Derivados **no consumo** (não em coluna), espelhando o padrão de
`workspaceActions`/`sharedAppValue`: `DataClientProvider` expõe as coleções
cruas; `termScope` é aplicado nos pontos de presentation (views) — como o
`workspaceId` deveria ter sido e nunca foi.

### Migração (`packages/data/src/schema.ts`)

`SCHEMA_VERSION` **17 → 18**. `MIGRATIONS[18]`:

```
17 → 18: modelo de período letivo (SPEC-005).
  1. Backfill de perfil: `semester ??= 1`, `totalSemesters ??= 8`
     (fecha o gap de import de backup legado — D3).
  2. Cria `academicTerms` com UM período, a partir do `profile.semester`:
     id `trm-active`, `status: 'ativo'`, `ordinal = semester` (clamp 1..12).
  3. `course.termId ??= 'trm-active'`, `course.status ??= 'ativo'`.
  Idempotente: só preenche o que falta; re-aplicar é no-op.
  Determinística: `startedAt`/`statusTransitionAt` = menor data disponível no
  payload (courses[].createdAt, classes[].date, tasks[].createdAt,
  internshipLogs[].date), senão `profile`-derivada, senão `'2026-01-01'`
  (constante do projeto — nunca `Date.now()`, senão quebra o golden).
  NÃO cria período "sem nome" para cursos com `semester` vazio/"semestre livre":
  o período corrente existe de todo jeito (a usuária TEM um semestre atual).
```

### Zod tolerante (`packages/data/src/backupSchema.ts`)

```ts
const academicTermSchema = passthrough({
  id: z.string(),
  label: z.string(),
  ordinal: z.number().int().min(1).max(12),
  status: z.enum(['planejado', 'ativo', 'encerrado']),
  startedAt: z.string(),
  statusTransitionAt: z.string(),
  // endedAt / summary opcional: ausente = período ainda aberto
});
```

- `course`: `termId: z.string().nullish()` e `status: z.enum([...]).default('ativo')`
  — **nunca `.strict()`**, nunca obrigatório sem default.
- `profile`: `semester`/`totalSemesters` continuam `z.number()`, mas a migração 18
  roda **antes** do Zod (fluxo já existente em `exportImport.ts:100-107`), o que
  fecha D3. Reforço: o gate é `migrateDatabase` → `backupDataSchema.safeParse`.
- `academicTerms` entra no objeto raiz de `backupDataSchema` (`.partial()`),
  então payload antigo sem a chave segue válido.

### Coleções & sync (9 passos de checklist)

1. `packages/data/src/collections.ts:90-127` — `academicTerms`:
   `{ key: 'academicTerms', kind: 'array', table: 'academic_term', syncable: true }`.
   **Anexar ao fim** (posição 24) — a ordem do array é a de hidratação e é
   congelada por teste (`collections.test.ts:93-124`); não reordenar as 23.
2. `src/data/empty.ts` — campo em `EmptyDatabase` + `emptyDatabase()`:
   `academicTerms: []`… **não**: `[]` deixa a app sem período ativo. O seed
   precisa ser `emptyDatabase()` sem termo, e o **AppContext garante um termo
   ativo no boot** (`ensureActiveTerm`, passo 7 do plano) para o app de
   primeira vez nunca abrir sem período. Isso preserva o goldfile `empty`
   determinístico e evita que o `reset` invente histórico.
3. `src/types/entity.ts` — `Course.termId` + `Course.status`.
4. `packages/data/src/persistentData.ts:52-114` — `PersistedStateSnapshot` +
   `readDatabaseFromState` (1 campo, sem default: `?? []` defensivo como os
   vizinhos).
5. `packages/data/src/backupSchema.ts` — schema + chave raiz.
6. `packages/sync/src/stamp.ts:15-33` — `academicTerms` em `RECORD_COLLECTION_KEYS`.
7. `packages/data/src/dataClient.ts:59-73` (`ArrayCollectionKey`) + `:113-131`
   (`repositories`) + `:132-196` (`DataClientSetters` + `applyDatabaseToSetters`).
8. `src/context/DataClientProvider.tsx` — `useStampedState` (junto das linhas
   392-438) + as **duas** ocorrências de `snapshotFromState` (`:648-653` export,
   `:673-679` sync) + a fatia memoizada de domínio (`domainFaculdade`).
9. `src/context/dataActions.ts` — carimba `termId` do termo ativo em
   `handleAddCourse` (mesmo padrão de `workspaceId`, `dataActions.ts:343`), +
   `closeTerm`/`openTerm`/`archiveCourse`/`carryCourse` como ações puras
   delegando a `packages/application`.

### SQLite nativo

- `src/lib/db/migrations/user.ts` — novo `ACADEMIC_TERM_TABLES_SQL`:
  ```sql
  CREATE TABLE IF NOT EXISTS academic_term (
    id TEXT PRIMARY KEY, name TEXT, ordinal INTEGER, status TEXT,
    started_at TEXT, ended_at TEXT, status_transition_at TEXT,
    created_at TEXT, updated_at TEXT, data_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_academic_term_status ON academic_term(status);
  CREATE TABLE IF NOT EXISTS course_term (
    course_id TEXT NOT NULL, term_id TEXT NOT NULL,
    PRIMARY KEY (course_id, term_id)
  );
  CREATE INDEX IF NOT EXISTS idx_course_term_term ON course_term(term_id);
  ```
  ⚠️ O índice `idx_course_semester` **existe e não é usado**; a nova
  `course_term` é a relação **consultável** que faltava. O `course.semester`
  (string) segue gravado em `course.semester TEXT` para compat/display.
- `src/lib/db/migrations.ts` — **passo 3** (`{ version: 3, up: ACADEMIC_TERM_TABLES_SQL }`).
  ⚠️ **Nunca** editar o passo 1 ou 2 já aplicados (ver o aviso no topo de
  `user.ts`).
- `USER_SCHEMA_VERSION = 2 → 3` em `user.ts:17`. Corrigir de passagem o **drift
  D9** (`packages/data/src/schema.ts:14` diz `1`; alinhar os dois ou remover o
  campo duplicado de `schema.ts`, que não tem consumidor).
- `src/lib/db/normalize.ts` — `case 'academicTerms'` em `saveCollection` (uma
  transação, `DELETE` + `INSERT`, como as outras `kind: 'array'`) + `loadCollection`
  + gravar `course_term` quando `termId` ≠ `null`.
- `cecistudy-rust/contracts/schema.sql` — espelhar as 2 tabelas + atualizar o
  header `USER_SCHEMA_VERSION` (`verify-schema.mjs:27-36` compara por regex com
  `schema.ts` — **falha** até alinhar) + acrescentar as tabelas nas listas
  `USER_TABLES` de `verify-schema.mjs:50-73`.
- ⚠️ `verify-schema.mjs` **não roda no CI** (D10 — confirmado: `ci.yml` tem
  só 3 steps, `lint`/`test`/`boundaries`). Recomendo passar a rodar nesta fase
  (1 step no job `verify`) — é a única barreira entre a tabela TS e o DDL
  canônico.

### Golden files (regenerar)

```bash
GOLDEN_WRITE=1      npm run test -- src/lib/__tests__/goldenFixtures.test.ts
MIGRATION_WRITE=1  npm run test -- src/lib/__tests__/migrationFixtures.test.ts
```
Geram `collections/{empty,sample}/academicTerms.json`,
`golden/registry.json` (nova entrada) e
`golden/migrations/legacy_payload.v18.json` (cadeia cumulativa).

⚠️ O golden de `empty` terá `academicTerms: []`. O Rust vai ler isso
corretamente (coleção vazia é válida) mas o `use_case` `close_term` do Rust vai
precisar do `ensure_active_term` espelhado. **Registrado na Fase 10** — não é
bloqueante para o MVP, mas é uma divergência conhecida a ser fechada antes do FFI.

---

## UX/UX — o assistente de virar semestre

Tom: pt-BR, minúsculo, acolhedor (`.context/copy-and-voice.md`). Nada de
"finalizar"/"encerrar"/"submit" — usar "virar", "fechar", "guardar", "prontinho
♡". Tokens de `.context/design-system.md` (sem hex em className). Labels de
botão = **verbo + objeto** ("virar semestre ♡"), nunca "OK"/"sim"
(https://www.gov.br/ds/padroes/writing/microcopy).

### Infraestrutura — **reusar o `WizardScaffold`, não criar pasta nova**

⚠️ **Correção de rumo vs. a primeira redação desta spec.** Existe uma
infraestrutura de wizard de tela cheia **já pronta e testada**. O assistente de
virar semestre é um `WizardFlow` como os outros — **não** um `src/components/terms/`
novo, e **não** um `NavScreen` novo (o `kind: 'wizard'` já cobre).

| Peça | Onde | O que dá |
|---|---|---|
| `WizardScaffold` | `src/components/wizards/WizardScaffold.tsx` | header com contador "2 de 4", mascote, `headline`/`subtitle`, transição lateral por passo, `blockedReason`, `saveMinimal`, confirmação de descarte (`isDirty`) |
| `WizardScaffoldFooter` | `.../WizardScaffoldFooter.tsx` | sticky footer: "continuar" / "guardar ♡" / "cancelar"·"voltar", "salvando...", botão "guardar só o essencial ♡" |
| `useWizardForm` | `src/lib/useWizardForm.ts` | `values` + `patch` + `step`/`setStep` + `isDirty`, com **rascunho persistente** (`useWizardDraft`) |
| `useWizardDraft` | `src/lib/useWizardDraft.ts` | rascunho por `draftKey` (sobrevive a sair/fechar) |
| `WIZARD_REGISTRY` | `src/components/wizards/registry.tsx` | mapa `WizardFlow → componente`; adicionar wizard = **1 linha**, sem switch |
| `WizardRouter` | `.../WizardRouter.tsx` | renderiza via `currentWizardType` do `useMobileApp()` |
| `wizardFields` | `.../wizardFields.tsx` | `FieldLabel`, `FieldHint`, `TextInput`, `ReviewCard` (card de revisão do último passo) |
| `ChoiceCardGrid` | `src/components/ui/ChoiceCardGrid.tsx` | cards de escolha única/grade (usar no "o que continua") |
| `FixedBottomBar` | `src/components/ui/FixedBottomBar.tsx` | barra fixa com safe-area |

**Registro (task obrigatória, sem switch):**
- `packages/navigation/src/types.ts` — somar `'semester'` ao union `WizardFlow`;
- `src/components/wizards/registry.tsx` —
  `semester: () => <SemesterWizard />`;
- `src/components/wizards/SemesterWizard.tsx` — o novo wizard (único arquivo novo
  de UI do wizard; os sub-componentes dos passos ficam ao lado, como `note/`).

Benefícios que vêm de graça: contador de passo, rascunho ("seu rascunho fica
salvo enquanto você navega" = *confidence bridge*,
https://tenet.so/blog/confidence-bridge-design-pattern), "guardar só o essencial",
confirmação de descarte, foco e safe-area já tratados. **Não mexer no
`WizardScaffold`.**

### Entrada no app (onde fica o botão)

- **CTA principal — `JourneyTimeline` do Perfil.** Quando o período ativo tem
  `endedAt` no passado **ou** `ordinal === totalSemesters`: um card destacado
  "seu 6º semestre tá pra acabar ♡" com botão primário **"virar o semestre ♡"**
  que abre o wizard (`openWizard('semester')`).
- **CTA secundário (sempre disponível).** No mesmo card, link discreto
  **"virar semestre mesmo assim"** — a virada é decisão dela, não do calendário.
- **Atalho no `FaculdadeView`.** No hero da faculdade, um link discreto
  "virar semestre" (ícone `CalendarDays`) visível quando há período ativo com
  `endedAt` vencido. Facilita o acesso sem obrigar a ir ao Perfil.
- **Cabeçalho.** O badge `{ordinal}º sem` (`HeaderNav.tsx:206`) passa a vir do
  `AcademicTerm` ativo. No header `detail` do Perfil, ação de menu
  **"histórico de semestres"** (ícone `History`) → tela de histórico.
- **Deep-link:** `#/perfil/semestre` (wizard) e `#/perfil/semestre/historico`.

### As perguntas do wizard (4 passos)

Estrutura honrar → decidir → planejar → confirmar, fundindo o *close/reflect* do
Asana (end-of-month) e o *revisar antes de planejar* do Stanford
(https://ctl.stanford.edu/students/end-of-quarter-reflection). 4 passos está no
ponto certo (faixa ideal 3–6, NN/g), e o passo 4 é o *confidence bridge*.

**Passo 1 · "como foi esse semestre?"** (honrar, derivado de dados reais)
Headline: **"vamos fechar o 6º semestre com carinho?"**. Card com o `ordinal`
grande em `font-display`, as contagens do período em grid (via `ReviewCard`:
disciplinas, aulas anotadas, tarefas cumpridas, páginas lidas, minutos de foco,
melhor sequência), a nota mais alta entre as `ClassNote`s `rating ≥ 4` (destaque
"as aulas que você marcou com 5 estrelas"), e a `dica do cecinho`. É **read-only**:
nada é gravado ao abrir, e a mesma tela reaparece no histórico.
- *Empty state:* "ainda não tem nada anotado nesse semestre — tudo bem, a gente
  abre o próximo com calma ♡" (o botão de "continuar" segue habilitado).
- `saveLabel` do scaffold não se aplica (não é último passo).

**Passo 2 · "o que continua?"** (o núcleo cognitivo — decidir por disciplina)
Headline: **"o que continua, o que fica ♡"**. Uma linha por `activeCourse` com cor,
nome, código, contagem ("32 aulas · 14 horas registradas") e um seletor de 3
opções — usar `ChoiceCardGrid` em `columns={1}` por linha, ou 3 `button`s em
`radiogroup` rotulado (a11y, ver §Acessibilidade):
- `continuar` (default, `Check`) — mantém o `id` e **todo** o histórico
  (anotações, leituras, flashcards, repertório — é o conhecimento que viaja com
  a matéria);
- `arquivar` (`Archive`) — sai da grade, **fica pesquisável**;
- `deixar pra depois` (`Clock`) — grace period: permanece no período que está
  encerrando e reaparece como "a decidir" no passo 4.
- **Atalho em lote:** botão **"todas as que faltam → continuar"** (resolve ~90%
  em 1 clique) + contadores tri-state ao vivo: `4 continuam · 1 arquiva · 2 a
  decidir` (`role="status"` quando mudam).
- *Empty state:* "nenhuma disciplina cadastrada ainda — quer montar a grade do
  próximo?" (leva ao passo 3).
- `dica do cecinho ✨`: "dá pra decidir tudo depois — o que ficar 'a decidir' só
  espera no próximo semestre."

**Passo 3 · "o que vem no próximo?"** (planejar — herdar, não recomeçar)
Headline: **"o que fica pra trás ♡"**. (a) **Número do semestre** — default
`atual + 1`, campo numérico com clamp; (b) **Como abrir a grade** —
`ChoiceCardGrid`: "copiar as que continuam, já preenchidas" (default, herdando
do padrão Notion "novo semestre herda a organização") / "montar do zero" /
"adicionar depois"; (c) **Pendências** — tarefas sem `dueDate`/não concluídas,
leituras em andamento, flashcards com revisão vencida, registros de estágio.
Default de cada bloco = **adiar para o novo período**; contagem explícita ("3
tarefas serão adiadas ♡"); ação secundária por bloco "deixar como está" (mantém
pendente no período encerrado). **Nada é apagado.**
- `saveMinimal` do scaffold: "adiar só as pendências ♡" salva este passo sem
  fechar o semestre (reabre depois pelo rascunho `draftKey`).
- *Empty state:* se nada foi `continuar`, a opção de copiar não aparece.

**Passo 4 · "olha antes de guardar"** (o confidence bridge / confirmação)
Headline: **"olha antes de guardar ♡"**. `ReviewCard` (ou diff dedicado) em 3
grupos: **fecha** (o que arquiva) / **continua** (o que avança) / **abre** (o que
entra) + a lista de "a decidir" + o destino das pendências. Botão primário
**"virar semestre ♡"** (o scaffold já pinta o último botão em `bg-ceci-brand` +
ícone `Check`). `dica do cecinho ✨`: "nada some — o semestre anterior fica
guardadinho, e se algo não ficar bom a gente desfaz num toque."
- **Sem dialog de confirmação separado** — a revisão **é** o passo. Um dialog
  "tem certeza?" seguido de toast "desfazer" é *ruído* (regra "one safety net per
  action", https://www.industrialempathy.com/posts/one-safety-net-per-action/).
  Virar semestre **nunca apaga** → é reversível por natureza → só a rede de
  recuperação.
- *Empty/degenerate:* se tudo ficou "a decidir", o CTA vira secundário: "nada pra
  fechar ainda — dá pra voltar e decidir com calma" (volta ao passo 2).
- Pós-commit: confete (`celebrate('term-closed')` — novo preset) + toast
  **"semestre virado ♡ · desfazer"** (undo real, re-executa a transição inversa —
  possível porque nada foi apagado).

### O outro lado: "bora abrir o {ordinal}º semestre?"

Tela/sheet após a virada (checklist do mercado — que em ferramenta genérica leva
~2h, https://calmevo.com/how-to-use-notion-for-college/ — automatizado em 3
toques):
1. **montar a grade** — criar disciplinas; o `CourseWizard` já vem com o período
   pelo `ordinal` derivado (§D4), sem o `${profile.semester}º sem` hardcoded
   (`CourseWizard.tsx:58`);
2. **revisar as adiadas** — deep-link para a pendência mais adiada;
3. **dica do cecinho** — conecta as disciplinas novas aos conceitos já visitados
   (o dado existe: `concept.courseIds`).

### Histórico de semestres

`#/perfil/semestre/historico` — períodos reais, newest first. Card por período:
`ordinal` grande, `label`, intervalo (`startedAt`→`endedAt`), status, e o
`TermSummary` expandível. Período `encerrado` lista **as disciplinas que
continuaram** (com deep-link) — é o que dá confiança para fechar. Período sem
registro = "aguardando".

### Microcopy (strings prontas, prontas para revisão de copy)

Regra de voz aplicada: o texto **nomeia o remédio, não o problema** ("não foi
possível salvar" → "ainda não foi salvo — tente de novo"; "campo inválido" →
"falta um número aqui"). Erros dizem **o que aconteceu + o que fazer + por quê**;
sucesso confirma a ação. Botões = **verbo + objeto**. (https://www.gov.br/ds/padroes/writing/microcopy,
https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)

| Contexto | Texto |
|---|---|
| Entrada (CTA) | **virar o semestre** / **virar semestre ♡** |
| Título do wizard | **novo semestre** |
| Passo 1 (subtitle) | "vamos fechar o 6º semestre com carinho?" |
| Passo 1 (headline) | "como foi esse semestre?" |
| Passo 2 (headline) | "o que continua, o que fica ♡" |
| Passo 3 (headline) | "o que vem no próximo?" / "o que fica pra trás ♡" |
| Passo 4 (headline) | "olha antes de guardar ♡" |
| Botão sair/descartar | "sair sem guardar" (o scaffold já tem) |
| Dica do cecinho (passo 2) | "dica do cecinho ✨: dá pra decidir tudo depois — o que ficar 'a decidir' só espera no próximo semestre." |
| Dica do cecinho (passo 4) | "dica do cecinho ✨: nada some. o semestre anterior fica guardadinho, e se algo não for bem a gente desfaz num toque." |
| Toast pós-commit | "semestre virado ♡ · desfazer" |
| Undo | "o 6º voltou pra grade ♡" |
| Save-minimal (passo 3) | "adiar só as pendências ♡" |

### Fontes da pesquisa de UX/domínio

Wizard/stepper: NN/g *Wizards* (nngroup.com/articles/wizards/) · *Progress Bars*
· DeveloperUX *Multi-Step Form* · Tenet *confidence bridge* (tenet.so) ·
DevExpress stepper. Transição/ritual: Asana *end-of-month close* ·
Stanford *End-of-Quarter Reflection* · Mindsera *annual review* ·
Notion *get organized for a new semester* · Duolingo *Daily Refresh*.
Decisão em lote: NN/g *Destructive Action Confirmation* · Design System AU
*Selectable Table with Batch Actions* · Misar *Diff Review*.
Undo: *One Safety Net Per Action* (industrialempathy.com) · NN/g
*Confirmation Dialog* · UX Patterns Guide *Destructive Action Confirmation*.
Acessibilidade: W3C *Redundant Entry* · VA.gov *Form Accessibility Guidelines* ·
NN/g *Input Validation*. Microcopy: gov.br *Padrões de Escritura/Microcopy*.
Retenção/arquivamento: PowerSchool EOY · Canvas Terms · Moodle Automatic Course
Archival · Google Classroom Archive. Catálogo/Offering: 1EdTech LIS Profiles ·
Ed-Fi Session · OneRoster v1 · xDBML university registrar.

### Acessibilidade dos passos novos (o scaffold já resolve o resto)

- Indicador de passo: `aria-current="step"` (adicionar ao `WizardScaffoldHeader`
  em task própria, ou local — preferir local para não tocar no scaffold).
- Ao trocar de passo, mover o foco para o `headline` (`tabIndex={-1}` +
  `useEffect`), sem `alertdialog` e sem roubar o foco do primeiro campo
  (https://design.va.gov/templates/forms/accessibility-guidelines).
- Passo 2: cada linha como `radiogroup` rotulado (não 3 botões soltos);
  contadores com `role="status"`.
- Campo do número do semestre: `type="text" inputMode="numeric"` (não
  `type="number"` — spinners confundem leitor de tela, WCAG 3.3.7).
- Erros com `aria-describedby` + `role="alert"`; rótulo persistente (não
  placeholder como label). Pré-preencher (WCAG 3.3.7 *Redundant Entry*).

### Recorte visual nas telas

| Onde | Comportamento |
|---|---|
| `WeekGrid`, `DisciplinasGrid`, "aulas de hoje" | só o período ativo |
| `HomeView` `attentionItems` | só período ativo (o que é antigo vira "arquivado", não some) |
| `FaculdadeView` hero | contagem do período ("5 disciplinas neste semestre") |
| `CourseDetailView` de disciplina arquivada | abre normal, banner "esta disciplina foi de outro período ♡" + ação "ver o semestre" |
| `GlobalSearchModal` | inclui arquivados, com chip de período no subtítulo |
| `PerfilView` tiles | **duplo**: `neste semestre` + `na jornada toda` (corrige D6) |
| `JourneyTimeline` | períodos reais, não inferência pelo número |

---

## Navegação & persistência

O assistente de virar semestre **não é um `NavScreen` novo**: ele entra como
`{ kind: 'wizard'; type: 'semester' }`, que já existe
(`packages/navigation/src/types.ts:57`) e já é roteado pelo `WizardRouter`. Só
o **histórico** é uma tela empilhada nova:

```ts
// packages/navigation/src/types.ts
export type WizardFlow =
  | 'task' | 'exam' | 'task-exam' | 'course' | 'reading' | 'flashcard'
  | 'internship' | 'session' | 'author' | 'concept' | 'material'
  | 'semester';                                    // ← NOVO

| { kind: 'termHistory'; termId?: string }         // ← NOVO NavScreen
```

⚠️ **Boundary check**: os tipos de navegação são propriedade de
`packages/navigation`; declará-los em `src/` faz
`.github/scripts/check-boundaries.mjs:100-115` falhar. Editar lá.

Rotas (`packages/navigation/src/hash.ts` + `stack.ts` + `derive.ts`):
- `#/perfil/semestre` → `[{tab:'perfil'}, {kind:'wizard', type:'semester'}]`
- `#/perfil/semestre/historico` → `[{tab:'perfil'}, {kind:'termHistory'}]`
- por período: `#/perfil/semestre/historico/trm-abc` →
  `[{tab:'perfil'}, {kind:'termHistory', termId:'trm-abc'}]`

Atualizar: `parseRoute` / `routeToStack` / `stackToHash` +
`src/lib/__tests__/routing.test.ts` (round-trip obrigatório) +
`canGoBack`/`handleSystemBack` (`navigationEngine.ts`) para incluir
`termHistory` na cadeia de back, e `handleSystemBack` de volta ao `perfil`.
O `kind: 'wizard'` já tem back treatment genérico — verificar que `type: 'semester'`
não precisa de caso especial.

> `SubTabPerfil`: o Perfil **não tem sub-tabs** (página única inline, por
> decisão de arquitetura). `termHistory` é uma tela **empilhada**, não sub-tab —
> coerente com o padrão de `#/faculdade/estagio`.

---

## Correções colaterais (F1–F4, decididas para esta entrega)

### F1 — `profile.semester` derivado (fecha D2 / ping-pong de sync)

Substituir toda leitura de `profile.semester` pelo `ordinal` do `AcademicTerm`
ativo. Pontos: `HeaderNav.tsx:206`, `FaculdadeView.tsx:79` + `HeroSection.tsx:29`,
`PerfilView.tsx:161,173,199,315,340`, `ProfileHeader.tsx:62-71`,
`JourneyTimeline.tsx:24,30-31,57`, `CourseWizard.tsx:58`, `profileMeta.ts:9-19`,
`stickers.ts:74,142,146`, `OnboardingScreen.tsx:66-78`.
`profile.semester` fica no tipo como `@deprecated` (compat de contrato) e a
migração 18 o mantém em sincronia por **escrita** (uma vez, no fechamento) —
não por leitura.

Helper único: `useActiveTerm()` em `src/lib/termScope.ts` (memoizado a partir
de `academicTerms`), exposto via `AppContext` (`buildAppContextValue`) para
não espalhar o `.find()`.

> ⚠️ **Não** fazer isto: re-quebrar `profile` em coleções separadas. O LWW do
> objeto inteiro ainda clobberia `name`/`dailyQuote` — mas isso é um bug
> **pré-existente e independente**, que fica registrado como follow-up (§Open
> Questions O1). O semester deixa de ser a vítima.

### F2 — `totalSemesters` editável + clamp (fecha D1, D4, D5)

- `PersonalizationSection`: adicionar par de campos **"semestre atual"** (read-only
  com hint "use o botão virar semestre ♡" + link para `#/perfil/semestre`) e
  **"total de semestres do curso"** (`PillGroup`/`input` com clamp `1..12`,
  espelhando `SEMESTER_OPTIONS` do onboarding).
- `PerfilView.handleSaveProfile` passa a gravar `totalSemesters`.
- Extrair `SEMESTER_OPTIONS` de `OnboardingScreen.tsx:30` para
  `src/lib/termScope.ts` (fecha D8) e **compartilhar** o mesmo componente de
  escolha com o onboarding (fecha a duplicação de UI).
- `degreeProgress`/`semestersLeft` passam a usar `clamp` (nunca negativo, nunca
  >100%).
- `PerfilView.tsx:161` ganha `useEffect` de re-sync do formulário (fecha D5).
- Onboarding: validar `semester <= totalSemesters` (hoje aceita `10 de 1`).

### F3 — Copy honesta (fecha D6)

- `JourneySummary.tsx:27`: "tudo anotado com carinho ao longo dos semestres" →
  passa a ter **duas linhas**: `neste semestre` e `na jornada toda` (com os
  respective cortes), cada uma com seu recorte de período.
- `PerfilView.tsx:319`: "sua jornada até aqui" → mantém, mas com tiles
  dual-scope.
- `FaculdadeView.tsx:79-84`: hero passa a dizer "5 disciplinas neste semestre"
  quando há período, com o total no período.
- `JourneyTimeline`: "✓ concluído" deixa de ser inferido do número e passa a vir
  de `AcademicTerm.status === 'encerrado'`; período sem registro = "aguardando".
- `src/lib/copy.ts:187-195`: **deletar** o objeto `BADGE` morto (D7) ou, se
  houver reaproveitamento, usá-lo como fonte única dos rótulos. Escolher **usar**
  (dá copy testável) — mas só nos pontos tocados por esta spec, sem varrer o app.

### F4 — Backfill de perfil no import (fecha D3)

Já coberto por `MIGRATIONS[18]` passo 1 (§Migração). Teste dedicado em
`exportImport.test.ts`: payload `v1` (o fixture real de
`contracts/golden/migrations/legacy_payload.v1.json`, sem `semester`) → import
**sucede** → `semester === 1`, `totalSemesters === 8`, `academicTerms.length === 1`.

---

## Plano de implementação (tasks)

Incremental; cada passo verde em `npm run lint` + `npm run test`. Ordem por
risco crescente (o domínio primeiro, porque é puro e não toca contrato).

| # | Task | Arquivos | Gate |
|---|---|---|---|
| 1 | Entidade + invariantes + factories puras | `packages/domain/src/core/domain/term.ts` (novo), `__tests__/term.test.ts` | lint + test |
| 2 | `TermStatus`/`CourseStatus` no index; `MAX_TERM_ORDINAL` | `packages/domain/src/index.ts` | lint |
| 3 | Transições puras de rollover + `buildTermSummary` + `enforceSingleActiveTerm` | `packages/application/src/term/rollover.ts` (novo), `__tests__/termRollover.test.ts` | lint + test |
| 4 | `termScope` + `useActiveTerm` + clamps | `src/lib/termScope.ts` (novo), `__tests__/termScope.test.ts` | lint + test |
| 5 | `Course.termId`/`status` no tipo | `src/types/entity.ts` | lint |
| 6 | `MIGRATIONS[18]` + `SCHEMA_VERSION = 18` + teste de idempotência/determinismo | `packages/data/src/schema.ts`, `src/data/__tests__/schema.test.ts` | lint + test |
| 7 | Zod + `collections.ts` + `persistentData` + `dataClient` + `stamp` + `empty` | `packages/data/src/{backupSchema,collections,persistentData,dataClient}.ts`, `packages/sync/src/stamp.ts`, `src/data/empty.ts` | lint + test |
| 8 | `academicTerm` no contexto (useStampedState + 2 snapshots + fatia) + `ensureActiveTerm` no boot | `src/context/DataClientProvider.tsx` | lint + test |
| 9 | Ações de rollover no `dataActions` (carimbrando `termId` no `handleAddCourse`) | `src/context/dataActions.ts` | lint + test |
| 10 | `WizardFlow` + `termHistory` NavScreen + rotas + back + header config + CTAs (JourneyTimeline, hero faculdade, menu do header) | `packages/navigation/src/{types,hash,stack,derive}.ts`, `src/context/navigationEngine.ts`, `src/lib/headerConfig.ts`, `PerfilView`/`JourneyTimeline`, `__tests__/routing.test.ts` | lint + test |
| 11 | SQLite: tabelas + passo 3 + `normalize` (save/load + `course_term`) + `USER_SCHEMA_VERSION` | `src/lib/db/migrations/user.ts`, `migrations.ts`, `normalize.ts` | lint + test |
| 12 | DDL canônico + `verify-schema.mjs` (tabelas + versão) + novo script npm `schema:verify` | `cecistudy-rust/contracts/schema.sql`, `verify-schema.mjs`, `package.json` | `npm run schema:verify` |
| 13 | Regerar goldens (`GOLDEN_WRITE=1`, `MIGRATION_WRITE=1`) | `cecistudy-rust/contracts/golden/**` | `npm run test` |
| 14 | **F1** — trocar toda leitura de `profile.semester` pelo `useActiveTerm()` | §F1 | lint + test |
| 15 | **F2** — `totalSemesters` + clamps + re-sync do form + validar onboarding | §F2 | lint + test |
| 16 | **F3** — copy dual-scope + `SEMESTER_OPTIONS` compartilhado + `BADGE` | §F3 | lint + test |
| 17 | **F4** — teste de import de payload v1 sem `semester` | `exportImport.test.ts` | test |
| 18 | Recorte de período nas views (Home/Faculdade/Perfil/Detalhe/Busca) | §Recorte visual | lint + test |
| 19 | Passo 1 (`TermClosingLetter` — carta de fechamento read-only) + `TermHistoryScreen` | `src/components/wizards/semester/*` (novo) | lint + test |
| 20 | `SemesterWizard` completo (4 passos sobre `WizardScaffold`) + registro no `WIZARD_REGISTRY` + a11y dos passos (foco no headline, `radiogroup`, `role="status"`) + `reabrir`/desfazer | `src/components/wizards/SemesterWizard.tsx` (novo), `src/components/wizards/semester/*`, `registry.tsx`, `__tests__/SemesterWizard.test.tsx` | lint + test |
| 21 | "bora abrir o Xº semestre?" + toast de desfazer + confete `term-closed` | `src/lib/celebrate.ts`, `src/components/wizards/semester/*` | lint + test |
| 22 | `verify-schema.mjs` no CI + novo script npm `schema:verify` (o `db:verify` existente é do **catálogo de conteúdo**, não serve aqui) | `.github/workflows/ci.yml`, `package.json` | (CI) |
| 23 | Doc: `.context/data-model.md`, `architecture.md`, `backlog.md` (Fase 22), `AGENTS.md` | docs | — |
| 24 | **Fase 10 (Rust, separada)** — `entity.rs`, `collections.rs`, `registry.rs` (array fixo 23→24), repos, `merge`, use-cases `close_term`/`open_term`, goldens Rust | `cecistudy-rust/crates/**` | `cargo clippy -D warnings` + `fmt --check` + `test` |

**Tasks 1–17 = MVP de valor** (a usuária vira semestre com tudo no lugar, e os
4 bugs saem). **18–21 = a experiência**. **24 é fase própria.**

⚠️ **Task 12 tem um risco que vale explicitar:** `verify-schema.mjs` compara
`USER_SCHEMA_VERSION` por regex no header do `schema.sql` contra
`packages/data/src/schema.ts`. Se o DRL e o TS divergirem (D9 já diverge hoje:
`1` vs `2`), o verifier acusa um drift que **não é desta spec**. Resolver o D9
antes de rodar a task 12, senão o sinal é falso.

---

## Testes

Todos em `__tests__/` **ao lado do código** (`vitest.config.ts`, `globals: false`,
imports explícitos), com `describe` nomeado por comportamento.

### `packages/domain/src/core/domain/__tests__/term.test.ts`
- `enforceSingleActiveTerm`: 0, 1 e 3 ativos; desempate por `statusTransitionAt`;
  empate exato → determinístico (o `ordinal` maior vence).
- `closeTerm`: `planejado → ativo → encerrado`; `encerrado → encerrado` é no-op;
  `encerrado → ativo` direto é **rejeitado** (tem que usar `reopenTerm`).
- `reopenTerm` zera `summary` e `endedAt`, grava novo `statusTransitionAt`.
- `assertTermIntegrity`: curso ativo sem período e curso ativo em período
  encerrado são reportados; `termId: null` **não** é órfão.
- `createAcademicTerm` aplica defaults e carimba `createdAt`/`updatedAt`.
- `MAX_TERM_ORDINAL` rejeita `ordinal` 0 e 13.

### `packages/application/src/__tests__/termRollover.test.ts`
- `buildTermSummary` é **puro**: mesma entrada → mesmo output (sem `Date.now()`).
- `buildTermSummary` recorta por período via herança: aula de disciplina
  arquivada **não** entra; aula sem `courseId` **entra** (nota avulsa, escopo
  global) — decisão documentada.
- `planRollover`: diff confere com as decisões (continuar/arquivar/deixar).
- Idempotência: `applyRollover(applyRollover(x)) === applyRollover(x)`.

### `src/lib/__tests__/termScope.test.ts`
- `resolveActiveTerm` (via `useActiveTerm` testado com renderHook): 0 ativos →
  `null`; 1 → ele; 2 → o mais recente; tie → `ordinal` maior.
- `degreeProgress`: `6/8 = 75`; `9/8` → `100` (clamp); `0/0` → `0` (não `NaN`).
- `semestersLeft`: `8-6 = 2`; `6-8` → `0` (nunca negativo).
- `clampOrdinal`: `0 → 1`; `99 → min(12, total)`; `NaN → 1`.
- `isArchived`: por `course.status` **e** por período `encerrado`.

### `src/data/__tests__/schema.test.ts`
- `expect(SCHEMA_VERSION).toBe(18)`.
- 17 → 18: cria 1 termo ativo, `course.termId`/`status` preenchidos, perfil
  backfilled.
- Idempotência: rodar 2× no mesmo payload = mesmo resultado.
- Determinismo: **dois payloads byte-idênticos** → mesmo payload de saída
  (garante que o golden é gerável).
- Payload **sem nenhuma disciplina** → ainda cria o termo ativo.
- Payload v1 real (`legacy_payload.v1.json`): perfil ganha `semester: 1`.

### `src/lib/__tests__/exportImport.test.ts` (+ F4)
- Import de payload v1 com `profile` sem `semester` → **sucede** (fecha D3).
- Round-trip com `academicTerms` populado e com `summary` grande.
- `academicTerm` sem `summary` (período aberto) → válido.
- `ordinal: 0` / `status: 'inventado'` → **rejeitado**.

### `src/lib/__tests__/collections.test.ts`
- Atualizar a lista congelada (23 → 24) e o teste "toda syncable no
  `EmptyDatabase`" / "toda syncable no payload".
- `academicTerms` é `array` + `syncable: true`; `supervision` segue fora.

### `src/lib/__tests__/goldenFixtures.test.ts` / `migrationFixtures.test.ts`
- Rodar em modo verify (sem `*_WRITE`) e deve passar após a regeração.
- `registry.json` com a nova entrada.

### `src/lib/__tests__/routing.test.ts`
- Round-trip `#/perfil/semestre` (wizard `type:'semester'`) e
  `#/perfil/semestre/historico/trm-x`.
- `handleSystemBack` volta do wizard e de `termHistory` para `perfil`.

### `src/components/wizards/__tests__/SemesterWizard.test.tsx`
- Passo 1 é read-only (nenhuma chamada de escrita ao montar).
- Escolher `arquivar` numa disciplina a remove da `activeCourses` do passo 2;
  "todas as que faltam → continuar" decide as pendentes de uma vez.
- Contadores tri-state refletem as escolhas (`4 continuam · 1 arquiva · 2 a decidir`).
- Diff do passo 4 reflete as escolhas ("5 continuam, 2 ficam arquivadas").
- `virar semestre ♡` chama a ação **uma** vez; toast de desfazer aparece.
- Rascunho (`useWizardDraft`): sair no passo 2 e voltar restaura as decisões.
- Desfazer devolve o estado anterior (round-trip da transição).
- `WIZARD_REGISTRY['semester']` renderiza (teste do registry, como os outros).

### `src/lib/sync/__tests__/merge.test.ts`
- Dois dispositivos que fecharam períodos diferentes → pós-merge **exatamente 1**
  `ativo` (o de `statusTransitionAt` mais recente).
- `academicTerms` faz union de ids e LWW por registro (2 dispositivos, um offline).

---

## Boundaries (`.github/scripts/check-boundaries.mjs` + AGENTS.md)

- `packages/domain/src/core/domain/term.ts` e
  `packages/application/src/term/rollover.ts`: **sem `react`, sem `@capacitor/*`,
  sem `__TAURI__`**, sem `Date.now()` dentro das funções de domínio.
- `NavScreen` (`termHistory`) e `WizardFlow` (`'semester'`) novos **só** em
  `packages/navigation/src/types.ts`
  (`check-boundaries.mjs:100-115` proíbe declarar em `src/`/`apps/`).
- `src/components/wizards/SemesterWizard.tsx` segue o padrão dos wizards
  existentes: consome `useMobileApp()`, compõe `WizardScaffold` + `wizardFields`
  + `ChoiceCardGrid` + `ReviewCard` e **não importa nada de
  `src/components/terms/`** (pasta que não existe mais nesta spec).
- `src/lib/termScope.ts` importa de `@/` e de `packages/*` — sem plataforma.
  Nada de `isMobile`/`Capacitor` em `src/components/**` (a regra de
  "shared UI não brancha por plataforma", `check-boundaries.mjs:138-148`).
- Stubs compat (`src/data/schema.ts`, `src/lib/persistentData.ts`,
  `src/lib/collections.ts`) continuam **re-export relativo**
  (`'../../packages/...'`), nunca `@/packages/...`.
- `packages/navigation` **não** importa `src/lib/termScope` (dependência
  invertida) — o `NavScreen` leva só `termId?: string`.

---

## Success Criteria

- [ ] `npm run lint` verde.
- [ ] `npm run test` verde (baseline atual 724 testes + ≥ 60 novos).
- [ ] `node .github/scripts/check-boundaries.mjs` verde.
- [ ] `node cecistudy-rust/contracts/verify-schema.mjs` verde **e** rodando
      no CI.
- [ ] `npm run build` verde (chunk não cresce > 2 kB gzip — a lógica é pura e
      fica em `packages/`, mas o wizard é lazy).
- [ ] `SCHEMA_VERSION = 18` refletido em `schema.ts` e no header de `schema.sql`.
- [ ] Import de `legacy_payload.v1.json` **sucede** (fecha D3).
- [ ] Nenhuma tela exibe disciplina fora do período ativo em "hoje"/"semana"/"plano
      de ação".
- [ ] Virada de semestre é **desfazível** sem perda.
- [ ] Período encerrado continua **pesquisável** (busca global, templo, revisão).
- [ ] `profile.semester` não é lido em nenhum ponto de UI (grep limpo).
- [ ] `percentDegree` ∈ [0, 100] e `semestersLeft` ≥ 0 para qualquer entrada.
- [ ] O wizard abre por **3 entradas** (card da `JourneyTimeline`, link do hero da
      faculdade, deep-link `#/perfil/semestre`) e é reversível.
- [ ] Sair no meio do wizard e voltar **restaura as decisões** (rascunho por
      `draftKey`), e descartar pede confirmação (`isDirty` do scaffold).
- [ ] Nenhuma escrita de domínio acontece antes do passo 4 (diff é read-only).

---

## Não-objetivos (Fase 10 — Rust, spec separada)

O gate Rust é `cargo clippy -D warnings` + `cargo fmt --check` + `cargo test` e
**não passa pelo `tsc` da raiz**. Se esta spec mexer no contrato, o Rust fica
temporariamente divergente — o que é aceitável e conhecido, porque:

1. `academicTerms` **entra no payload de backup**. O `cecistudy-data` Rust
   valida com `collections.rs`/`registry.rs` e o `registry_parity_test.rs`
   falha até o array fixo `[CollectionSpec; 23]` virar 24.
   ✅ **Verificado:** `ci.yml` tem exatamente 3 steps (`lint`, `test`,
   `boundaries`) e **não roda `cargo`** — então o merge **não fica vermelho**
   por causa da Fase 10. O que **fica** é: `npm run test` (que inclui
   `goldenFixtures`) precisa passar, e `cargo test` no workspace Rust fica
   quebrado até a task 24. Como o AGENTS.md manda rodar o gate Rust antes de
   mexer no contrato, quem for começar a task 13 precisa saber disso.
2. O DDL canônico (`schema.sql`) muda na task 12 — o Rust lê ele? O
   `cecistudy-data` tem DDL próprio em `migrations/`; a task 24 sincroniza.
3. `payload.rs:248` valida `["id","name","professor","semester","color","icon"]`
   como obrigatórios do `data_json` do curso — `termId` **não** entra nessa
   lista, para não rejeitar payload legado.
4. O `use_case` `close_term` do Rust precisa do `ensure_active_term` espelhado
   (o golden `empty` tem `academicTerms: []`).

**Decisão explícita:** o MVP da web/mobile entrega valor agora; a paridade Rust é
a Fase 10, com spec própria, antes de `cecistudy-ffi`. Assumir o custo de
"contrato adiantado" é preferível a adiar a virada de semestre por causa de um
desktop que ainda não tem UI.

---

## Open Questions

- **O1 · `profile` continua com LWW do objeto inteiro.** A virada de semestre
  parou de ser vítima, mas `name`/`dailyQuote`/`university` ainda fazem
  ping-pong entre dispositivos (D2 residual). Re-quebrar `profile` em
  coleções separadas é uma mudança de contrato grande. **Decidir depois**, com a
  feature já na mão (é a mesma conversa que ficou pendente com `workspaceId`).
- **O2 · `streakData` é global ou por período?** A spec decide: **global** — a
  streak atravessa a virada (é o comportamento motivacional certo, e
  `merge.ts:159-163` já faz union de `activeDays`). Se a usuária preferir
  "streak do semestre", é um `TermSummary` derivado, não um estado novo.
- **O3 · Estágio (`internshipLogs`) por período?** Hoje filtra por
  `phase: 'estagio' | 'supervisao' | ...`, que é a dimensão real (a fase
  atravessa semestres). Nenhuma mudança nesta spec.
- **O4 · Disciplina repetida (reprovou e refez)?** Não modelado — o app não
  tem reprovação. Se um dia precisar, `AcademicTerm` + `Course.termId` já
  suporta: são 2 `Course` diferentes com o mesmo nome e `category`, ou 1
  `Course` com `attempts`. O modelo **não impede** nenhuma das duas; apenas
  não as sugere. Deixar explícito para não redesignar depois.
- **O5 · `Course.semester: string` — remover quando?** Depreciado em silêncio
  nesta spec (compat com `payload.rs`). Remover exige: (a) `payload.rs`
  atualizado, (b) `MIGRATIONS[N]` com `delete course.semester`, (c) remover a
  coluna `course.semester` do DDL. Proposta: na **próxima major** do contrato.
- **O6 · `verify-schema.mjs` no CI.** A task 22 adiciona. Confirmar se o
  mantenedor aceita (o script usa `node:sqlite`, que exige **Node 22+**; o CI
  já é 22+ por `engines`).
- **O7 · Semântica de `planned`.** A spec cria período `planejado` para
  "montar a grade antes de abrir o semestre". Se a usuária nunca usar, o estado
  é código morto. Considerar colapsar `planejado` → `ativo` na primeira
  gravação se nenhum período `planejado` existir há 30 dias.
