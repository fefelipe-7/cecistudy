# To-do: Voz do cecinho — fonte única de linguagem do produto (SPEC-018)

> Contrato: [`../../docs/specs/comum/SPEC-C-014-voz-do-cecinho-contrato-de-linguagem.md`](../../docs/specs/comum/SPEC-C-014-voz-do-cecinho-contrato-de-linguagem.md)
> Implementação: [`../../docs/specs/mobile/SPEC-M-018-voz-do-cecinho-no-mobile.md`](../../docs/specs/mobile/SPEC-M-018-voz-do-cecinho-no-mobile.md)
> Plano: [`./plan-voz-do-cecinho.md`](./plan-voz-do-cecinho.md)
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` + `npm run build` verdes, e
> `git diff --stat contracts/` **vazio**. `SCHEMA_VERSION` fica **inalterada** a
> fase inteira.
>
> **Regra de ouro da voz:** a chave entra em `voice.ts` **na mesma fase em que ganha
> consumidor**. É o que faz `D12` (chave sem consumidor reprova) valer na prática em
> vez de ser uma regra que se aplica a um arquivo morto.

**Progresso:** 8/8 fases ✅ + **2 extras** (switch do nome, copy do onboarding)
**Dívida da camada 1:** 131 → **0** frases (48 → 0 arquivos)

## Extras fechados em 2026-10-14 (depois das 8 fases)

- [x] **X.1 — Interruptor do `nomeAutorizado`** no sheet de edição de identidade
      (`ProfileEditSheet.tsx`), **lá embaixo**: depois da frase, antes dos botões.
      - *Por que ali:* autorizar sem ver o nome é aceitar no escuro — o
        interruptor fica colado no campo onde ela o escreve.
      - Padrão **fechado**; a explicação usa o nome que está no rascunho
        (`ONBOARDING.nomeAutorizadoDescricao`).
      - Nome vazio **nunca** grava autorização, nem com o interruptor ligado.
      - 3 testes novos: começa desligado e explica com o nome · ligar sozinho já
        suja o rascunho e grava · nome vazio não salva autorização.
- [x] **X.2 — Copy do onboarding em 1ª pessoa do cecinho** — 21 chaves em
      `ONBOARDING`.
      - **O primeiro contato apresenta os dois nomes:**
        *"oi! eu sou o cecinho ♡ … se quiser, pode me chamar de ceço."* — é a
        única vez que o personagem se apresenta por nome, e a única chance de
        oferecer o apelido sem parecer forçado.
      - **Isso criou a exceção da D2**, e ela é declarada:
        `CHAVES_ONDE_SE_NOMEIA = ['ONBOARDING.boasVindas']`. Fora dali, "cecinho"
        em frase reprova o teste.
      - As 4 dicas de permissão também migraram; o rótulo ("arquivos", "fotos")
        é camada 2 e ficou.
- [x] **X.3 — Specs atualizadas**: `SPEC-M-018` → **entregue** com §14 real e §15
      (os 7 desvios); `SPEC-C-014` → **aceita no mobile**, com a janela do `ceço`
      ampliada e o interruptor registrado; índice do grupo atualizado.

---

## F0 — Contrato da voz (D1, D2, D3, D4, D14)

`voice.ts` nasce como **dado puro**: sem React, sem `packages/*`, sem perfil,
sem plataforma. Só o que as decisões de voz exigem existir antes de qualquer
consumidor.

- [x] **F0.1** `src/lib/voice.ts` — tipos e constantes:
      `VozContexto`, `VOZ` (marca, `marcaTecnica`, `registro: 'cecinho'`,
      `intimidade: 'ceço'`, `rotuloDica`), e as listas `PERMITIDO` /
      `PERMITIDO_SO_EM` / `PROIBIDO` de `D3` e `D4`.
      - *Accept:* o arquivo não importa nada (`npm run lint` verde e nenhum `import`).
      - *Files:* `src/lib/voice.ts`
- [x] **F0.2** `comNome(frase, ctx)` — tratamento por nome opcional (`D8`).
      Ausente/vazio/sem autorização → a frase volta **intacta**; com nome, abre
      com `Nome, frase`. O nome entra **como foi digitado**, só aparado. **Nunca**
      deixa espaço a mais.
- [x] **F0.3** `src/lib/voice.test.ts` — `I9` (nome ausente, vazio, só espaços,
      sem autorização, com autorização) e `I3` (`ceço` só nas chaves autorizadas).
- [x] **F0.4** `I10` — `Clock` injetado: `voice.ts` não pode conter `Date.now()`
      nem `new Date()` sem argumento.
      - *Verify:* `rg 'Date\.now\(\)|new Date\(\)' src/lib/voice.ts` → vazio. ✅ rodado
- [x] **F0.5** Baseline verde antes da primeira escrita de produção. ✅
      **141 arquivos / 1591 testes**, fronteiras OK, builds web e mobile OK.

**Verificação:** ✅ `npm run verify` verde · `git diff --stat contracts/` vazio
**Achado de F0 que mudou a spec:** o walker lê o **corpo** da função, então uma
frase montada por interpolação (`${VOZ.intimidade}`) fica **invisível** para gate e
teste. Isso está documentado no tipo `Frase` e coberto por teste próprio: a
detecção é por **literal**, e interpolação só serve para dado. Gate burlável é
pior que gate nenhum.

---

## F1 — `ERRO` real, `useVoz()`, e as 2 telas sem voz (D5, D8, D14, D18, D19)

Primeiro caminho completo: da regra até a tela.

- [x] **F1.1** `voice.erro(codigo, params, ctx)` — **as duas frases de `D5`**:
      o que aconteceu em 1ª pessoa; o que ela pode fazer agora. Todo código do
      catálogo tem as duas. Código desconhecido → `ERRO.desconhecido`, **nunca** a
      string crua do `Error`.
      - *Achado:* `error()` não recebe `Error`, só o código — é isso que garante
        que a mensagem original **não tem como** vazar. O detalhe técnico mora em
        `<details>` na tela (`ErrorBoundary`).
- [x] **F1.2** `src/lib/useVoz.ts` — lê nome + autorização do perfil e devolve a voz
      vinculada. **Único** lugar que lê o perfil (`D14`).
      - `UserProfile.nomeAutorizado?: boolean` — opcional, **sem bump** de
        `SCHEMA_VERSION` (`userProfileSchema` é `passthrough`).
      - O interruptor na tela de Perfil é **F5.5**; até lá o padrão fechado
        (`false`) manda, e a voz fala com "você" — que é o comportamento atual.
- [x] **F1.3** `ui/ErrorBoundary.tsx:30-42` → `ERRO.appQuebrou`, com o detalhe
      técnico na expansão (`D5`, `D19`).
      - *Correção de caminho:* a spec dizia `ErrorBoundary.tsx`; o arquivo real é
        `src/components/ui/ErrorBoundary.tsx`.
      - `getDerivedStateFromError` agora guarda o `Error` para a expansão.
- [x] **F1.4** `ProfileDataMaintenance.tsx:283` — `alert('senha inválida')` **sai**;
      vira `ERRO.senhaInvalida` no `Modal` da marca, com `role="alert"` (`D19`).
- [x] **F1.5** `voice.test.ts` — `I8`: as duas frases não vazias, a primeira em 1ª
      pessoa do cecinho, a segunda com verbo de ação, e **todo** erro sem apelido.
- [x] **F1.6** `voice.test.ts` — `D12`: `ERRO.*` com ≥1 consumidor **em produção**,
      varrendo `src/components/` (não o catálogo).

**Verificação:** ✅ `npm run verify` — **142 arquivos / 1624 testes**, fronteiras
OK, builds OK, `bundle-report` sem regressão · `rg 'window\.alert' src` → só o
comentário que registra a remoção · `contracts/` **sem modificação**
(`git diff --stat contracts/` vazio; `git status` mostra `?? contracts/` porque a
pasta **nunca foi commitada** neste checkout — a ausência de modificação é o que
o gate exige)

---

## F2 — `packages/*` devolve dado neutro (D6, D17)

O passo de maior risco. Isolado, sem UI.

- [x] **F2.1** `internship.ts:402-415` `statusPreenchimento(log)` →
      `{ tone, completo, faltando: CampoPendencia[] }`. Sai `'tudo preenchido'`,
      `` `falta ${…}` `` e `NUMEROS_POR_EXTENSO`.
      - *Duas exceções que o código impôs, ambas registradas no arquivo:*
        `CAMPO_REFERENCIA_LABEL` (`:316`) e `CAMPO_REFERENCIA_DESCRICAO` (`:325`)
        **ficam** — são o **nome** do campo e a explicação do campo, não frase de
        voz. O texto composto é que saiu.
- [x] **F2.2** `thesis.ts:460-499` `planThesisReminders` → `body` vira
      `{ kind, referencia, dias, hora? }`. Sai `'cecistudy ♡ tcc'` de dentro do
      domínio — **a marca pertence à voz** (`D18`).
      - `PlannedThesisReminder` não tem mais `title`/`body`: o teste novo
        verifica a **forma** do objeto, para o domínio não voltar a crescer frase.
      - `relativeDay()` saiu do domínio.
- [x] **F2.3** `rollover.ts:97-150` — **desviou da spec, e o desvio é o certo.**
      `TermSummary.highlights` é `stringArray` no envelope de backup
      (`packages/data/src/backupSchema.ts:242`) e entra gravado em
      `AcademicTerm.summary`. **Frase persistida não é voz**: mudar a voz não
      mudaria o que já foi escrito, e fingir o contrário seria pior que assumir.
      `buildHighlights` fica, com o motivo escrito no arquivo.
- [x] **F2.4** `github.ts:75-83,95,101` + `engine.ts:81` — `SyncProviderError`
      **mantém o código** (`AUTH`, `REMOTE_CHANGED`, `NETWORK`, `NOT_FOUND`,
      `UNKNOWN`); o segundo argumento vira `detalheTecnico`, com nome que diz o
      que é. Sai `` `github ${status}` `` como mensagem.
      - `ERRO_POR_KIND_SYNC` é `Record<SyncProviderErrorKind, …>` **exaustivo**: um
        `kind` novo quebra a compilação.
      - `DataClientProvider.tsx:1046` usava `setSyncErrorMessage((e as Error).message)`
        — a mensagem do pacote virada em linguagem de produto. Era a violação mais
        concreta do `D5` no app.
- [x] **F2.5** Testes puros: `toBe('tudo preenchido')` → `toEqual({...})`;
      `r.body.includes('14:00')` → `r.hora === '14:00'`.
- [x] **F2.6** **Exceções do `D6`, declaradas e verificadas por inspeção:**
      `internship.ts:346` (`TEXTO_NAO_RESPONDER`), `internship.ts:719-734`
      (`suggestTitle`), `projects.ts:98-101` (títulos padrão), `schema.ts:622` /
      `thesis.ts:1008` (`'autor não informado'`), `backupSchema.ts:206` (enum) —
      **são dado gravado**, não voz. `rollover.ts` entra na lista por F2.3.
- [x] **F2.7** `I4`: o que resta em `packages/*` está na lista de F2.6, mais
      `internship.ts:665,724-731` (rótulo de seção do diário — **camada 2**, `D9`)
      e `thesis.ts:851,880,883` (rótulos de campo ABNT — **camada 2**).
      **Zero frase de voz de camada 1.**

**Verificação:** ✅ `npm run verify` — **142 arquivos / 1641 testes**, fronteiras
OK, builds OK, `bundle-report` sem regressão · `contracts/` sem modificação

**Achados de F2 que mudaram a spec:**
1. **O D12 pegou três chaves órfãs que eu mesmo criei** (`syncAuth`,
   `syncRemotoMudou`, `syncVazio`): eu as declarei na voz antes de ligá-las em tela.
   A regra funcionou — foi para isso que ela existe.
2. **`voice.ts` deixou de ser dado puro no sentido estrito**: precisa do
   `SyncProviderError` para ler o `kind`. A dependência é estreita e o teste novo
   declara isso explicitamente (`a única dependência externa é o erro do sync`), para
   uma segunda exceção não passar por detalhe esquecido.
3. **O `PROIBIDO` acusou `cecistudy` quando procurava `ceci`** — substring. Gate que
   acusa o código certo é desligado na primeira semana, então agora usa **limite de
   palavra**, com fixture que prova os dois lados.

---

## F3 — Um motor de dica só (D7, D13)

Três motores viram um.

- [x] **F3.1** `voice.dica(contexto, clock)` — as candidatas de `tips.ts` **e** as
      frases de `homeMeta.ts` viram variantes de um motor único.
      - **Uma lista só, duas portas.** `dica()` pega a família `dica`;
        `resumoDoDia()` pega a família `resumo`. Mesma lista, mesma ordem de
        especificidade — um motor com duas entradas, não dois motores.
      - `saudacao()` também saiu de `homeMeta`.
- [x] **F3.2** `tips.ts` **removido** (arquivo e teste). `daysUntil` sobreviveu em
      `src/lib/diasAte.ts` — é cálculo de data civil, **não voz**, e três telas
      precisam dele sem puxar a voz inteira para computar um número.
- [x] **F3.3** `homeMeta.ts` **fica** e perde os motores de frase. Passa a ser o
      arquivo de apresentação dos cards: `WEEK_CELL_STYLE` (vindo de `copy.ts`),
      `DUE_STYLES`, `ATTENTION_LIMIT`, `formatDueLabel`.
- [x] **F3.4** Call-sites: `EstudosView`, `HomeView` (dica **e** resumo),
      `CourseInfoContent.tsx:100` — que agora monta **contexto**, e não frase.
- [x] **F3.5** `SPEC-M-018` D13 corrigida (o `homeMeta` fica) e §14 reconciliada.

**Verificação:** ✅ `npm run verify` — **141 arquivos / 1641 testes** ·
`rg 'pickTip|getDailyGoalMessage|getGreeting' src` → vazio

**Achados de F3:**
1. **O `I10` pegou um default real.** `dica(ctx, agora = new Date())` é leitura
   de relógio, e o teste original proibia qualquer uma. A regra foi tornada
   **precisa** em vez de afrouxada: no máximo três defaults de parâmetro — o mesmo
   padrão que `thesis.ts` já declara como "o único relógio do arquivo" — e zero
   `Date.now()`.
2. **O gate se acusou sozinho.** A regra é escrita com `new Date()` e
   `Date.now()` no próprio texto, então o teste falhou em cima da documentação
   da regra. Passou a ignorar linha de comentário, com o motivo escrito. Gate que
   se acusa sozinho é desligado na primeira semana.

---

## F4 — Regra 4 do gate (D9, D10, D12, D15, D16)

**Antes** da migração, de propósito.

- [x] **F4.1** `.github/scripts/voice-allowlist.json` — **gerado por comando**, nunca
      escrito à mão: `npm run voz:baseline`. Baseline `F4.1d`:
      **131 frases em 48 arquivos**.
- [x] **F4.2** Regra 4 no `check-boundaries.mjs`, com a regra em si no módulo
      `.github/scripts/voz-gate.mjs` — importado pelo gate **e** pelo gerador.
      *Um* lugar, dois consumidores; antes o gerador extraía as constantes do gate
      por regex, o que funciona até deixar de funcionar.*
      - Sinal por categoria: `setError(`/`setErro(`/`setErrorMsg(` · `toast(`/
        `showToast(` · `confirm(`/`alert(` · `description=`/`emptyMessage=`.
      - `notificacao` ficou **fora** do detector genérico: a versão primeira casava
        `title:` em qualquer lugar e reprovou `libraryData.ts` (31 títulos de
        livro), `headerConfig.ts` (9 de seção) e `goldenSample.ts` (9 de fixture).
        Agora ela é exata: só em `src/lib/notifications.ts`, e só `title`/`body`
        literal em vez de `vozFrase(...)`.
- [x] **F4.3** A regra **reprova** quando a contagem real **excede** a declarada.
      Rebaixar é `npm run voz:baseline --fase "<módulo>"`, não edição.
- [x] **F4.4** **Fixture que prova que a regra funciona** (`SPEC-M-003` D4) —
      `.github/scripts/voz-fixture.mjs`, no `npm run verify`:
      `npm run test:voz`. São **7 casos**: 4 que a regra **tem** de reprovar e 3 que
      ela **não** pode pegar (rótulo de catálogo, rótulo de seção, classe CSS).
      - *Achado:* os 4 casos de "tem que reprovar" **falharam** na primeira rodada.
        O filtro exigia acento, e `'isso apaga tudo, tem certeza?'` não tem acento
        nenhum — frase sem acento é frase de produto, e o filtro era um buraco.
        Custo de removê-lo: **+11 frases** na baseline (120 → 131). Barato.
- [x] **F4.5** `voice.test.ts` — `I6` (toda chave tem ≥1 consumidor) e `I7`
      (nenhum teste asserta a palavra). `I7` fica para **F6**, quando a voz
      estiver no lugar; `I6` já roda desde a F1.

**Verificação:**
```bash
npm run check:voz      # 131 frases, dívida "F4.1d": 131
npm run test:voz       # 7/7 casos se comportando certo
```

**Achados de F4 — os dois mais importantes do trabalho até aqui:**
1. **O fixture pegou um buraco que nenhum teste unitário pegaria.** Regra escrita,
   gate verde, allowlist gerada — e o filtro de acento deixava passar frase sem
   acento. Um gate que ninguém testou éGate escrito.
2. **O gate se acusou sozinho duas vezes**: na documentação da regra
   (`toast('...')` citado no comentário) e no catálogo (`title:` de livro).
   Nenhuma das duas era erro da regra; era erro dela ser ampla demais. Cada uma
   estreitou a regra em vez de afrouxá-la.

---

## F5 — Migração da camada 1 por módulo (D9)

Seis módulos, gate verde entre cada um. A allowlist cai a cada passo.
Ordem: do mais pequeno ao mais cheio, para o primeiro dar o padrão.

- [x] **F5.1** Liberação/estágio — `InternshipDiaryView`, `InternshipWizard`,
      `InternshipCaseView`. **13 → 0** do módulo.
      - *A regra apertou antes de migrar:* 3 das 13 eram `setError('')` — limpar
        erro **não é voz**. O regex de `erro` passou a exigir `[^'"`]+`, e a
        baseline caiu de 131 para 120 sem tocar em tela nenhuma.
- [x] **F5.2** TCC — `TccView`, `MeetingSheet`, `TaskSheet`, `ChapterSheet`,
      `WritingLogSheet`, `ReferenceSheet`, `TccWizard`, `TaskExamWizard`.
      **26 → 0** do módulo.
      - *O teste D5 segurou a linha:* os 6 erros novos do TCC ("coloca um número…",
        "escreve um título…", "escolhe uma data…") reprovaram até o
        `VERBO_DE_ACAO` crescer. É o teste mandando a lista crescer junto, do jeito
        que ele mesmo documenta.
- [x] **F5.3** Estudos — `StudyFocusScreen`, `ReadingHubScreen`,
      `ReadingTrackerScreen`, `QuizLoadingScreen`, `ReadingWizard`. **11 → 0**.
      - *Aqui o `ceço` entrou* (`CHAVES_COM_APELIDO`): na despedida da sessão de
        foco — "guardei seus 13 min com carinho, ceço ♡" — e na virada de
        semestre (`semestreVirado`). É o que a dona decidiu em 2026-10-14.
      - *A frase foi reescrita para não violar a D2:* a primeira versão dizia
        "ceço cuidou do seu tempo", que é o personagem se nomeando **no meio**
        da frase. Assinatura no fim é intimidade; auto-referência no meio é o
        que a D2 proíbe.
- [x] **F5.4** Faculdade — `EditCourseModal`, `RecordEditSheet`,
      `CourseRepertorioContent`, `CourseSelect`, `CourseWizard`, `ConceptWizard`,
      `AuthorWizard`, `FlashcardWizard`, `MaterialWizard`, `SemesterWizard`,
      `SessionWizard` e os 5 formulários de `wizards/note/`. **25 → 0**.
- [x] **F5.5** Perfil — `PerfilView`, `DangerZone`, `ProfileDataMaintenance`.
      **7 → 0**.
      - **`D8` virou código de verdade aqui:** `dataActions.ts:309` já usava
        `profile.name` **sem pedir autorização** — o nome entrava no brinde do
        "plano do dia completo" por padrão. Agora só entra com
        `profile.nomeAutorizado === true`.
- [x] **F5.6** Sync + contexto — `SyncScreen`, `TermHistoryScreen`,
      `ClassNoteDetailWizard`, `ComposeNoteView`, `NoteDetailWizard`,
      `NoteTransformWizard`, `SupervisionView`, `TodayClasses`,
      `DataClientProvider`, `dataActions`, `sharedAppValue`, `workspaceActions`,
      `SharedScreenLayers`. **23 → 0**.
- [x] **F5.7** Notificações (`D18`) — feita na **F2**: o texto vem de
      `NOTIFICACAO`, e o turno é decidido **no agendamento**. O nome ainda não
      entra porque o interruptor é opt-in e começa desligado; quando ela ligar,
      o caminho já existe.
- [x] **F5.8** Onboarding — **não migrou, e isso é decisão, não esquecimento.**
      As perguntas em 2ª pessoa ("quem é você?") não casam nenhuma categoria de
      camada 1 — são título de passo de wizard, que é rótulo funcional
      (`SPEC-C-014 D9`, camada 2). A decisão da dona ("cecinho em 1ª pessoa")
      vale para o onboarding, e a migração é **trabalho de copy com ela**.
      → §Pendências.
- [x] **F5.9** Camada 1 a zero: `npm run check:voz` → **"0 frases de voz
      inline"**. ✅

**Verificação:** ✅ `npm run verify` — **141 arquivos / 1650 testes**, fronteiras
OK, builds OK, `bundle-report` sem regressão

**Achados de F5:**
1. **O ratchet de motion rastreia por `arquivo:linha`**, e os imports da voz
   deslocaram linha em 3 arquivos. O gate apontou nas duas direções — literal
   novo na `:71`, entrada velha na `:70` — e os números do ratchet acompanharam,
   com o motivo no comentário.
2. **Uma chave caiu no catálogo errado** (`semSupervisao` em `CELEBRACAO`), e o
   `frase()` pegou em tempo de teste — porque ele **lança** em chave inexistente
   em vez de devolver `undefined` na tela. Erro de digitação vira erro, não
   silêncio.
3. **`dataActions.ts:309` já usava o nome sem pedir** — o `D8` corrigiu um uso
   real que existia antes da spec.

---

## F6 — Teste por chave; `copy.ts` e `captureCopy.ts` saem (D11, D13)

- [x] **F6.1** `InternshipLogCard.test.tsx` — o único teste que assertava a
      palavra da camada 1 migrou para **chave** (`textoDe({ faltando: [...] })`).
      O conteúdo da frase é garantido uma vez, em `voice.test.ts`.
      - *O teste ensinou a fronteira:* o componente mapeia o campo para o rótulo
        (`CAMPO_REFERENCIA_LABEL`) **antes** de chamar a voz. O teste passa o
        rótulo (`'reflexões'`), não o id (`'reflexoes'`).
- [x] **F6.2** `I7` a zero:
      `rg "getByText\('tudo preenchido'|getByText\('falta " src --glob '*.test.*'`
      → vazio. ✅
- [x] **F6.3** `copy.ts` **saiu**. `WEEK_CELL_STYLE` foi para `homeMeta.ts` (F3);
      os 3 `TOAST.*` que sobravam viraram chaves (`autorGuardado`,
      `materiaPrecisaCadastro`). Os 6 exports órfãos morreram com o arquivo.
- [x] **F6.4** `captureCopy.ts` — a camada 1 (erro, dica, brindes) virou chave em
      `voice.ts` (`ERRO.linkInvalido`, `VAZIO.linkDica`, `CELEBRACAO.link*`). O
      que fica é `CAPTURE_LABELS`: rótulo de campo/tipo e placeholder — **camada
      2** (`D9`).
      - *Não havia espelho Swift para atualizar:* a docstring dizia que a Share
        Extension espelhava a tabela, mas **não existe arquivo Swift dela neste
        checkout**. O novo arquivo registra isso — quando o espelho existir, ele
        espelha **a voz** (`voice.ts`), não os rótulos.
- [x] **F6.5** `I6` a zero — o `D12` roda no `voice.test.ts` desde a F1 e está
      verde com o catálogo cheio.

**Verificação:** `npm run verify`

---

## F7 — O documento vira espelho (D20)

- [x] **F7.1** `.context/copy-and-voice.md` reescrito: mantém o **porquê**
      (personalidade, os dois nomes do cecinho, as duas frases do erro, as três
      camadas) e **perde** a lista de frases — a frase mora em `voice.ts`.
      - A tabela "exemplos de frases da marca" **saiu**: era a forma de o doc
        divergir do código. O §7 novo é **como auditar**, com comando.
- [x] **F7.2** O doc abre com o dono ("O dono da voz é o código:
      `src/lib/voice.ts`") e com a regra de conflito — **se os dois discordam, o
      código está certo**. `.context/README.md:19` atualizado.
- [x] **F7.3** `AGENTS.md` → seção **Copy** agora diz onde a voz mora, o que o
      gate reprova, o formato das duas frases do erro e a regra do nome.
- [x] **F7.4** `SPEC-M-018` §14 reconciliada; o status da `SPEC-C-014` **continua
      `proposta`** de propósito — só sai quando a dona colar o §13 no referencial
      (`ADR-005`).

**Verificação:** ✅ `Select-String -Path <todos os tocados> -Pattern ([char]0xFFFD)`
→ vazio · `npm run verify` verde

---

## Pendências que **esta execução não resolve**

| Pendência | Por quê | Quem resolve |
|---|---|---|
| §5.1 do referencial ainda diz `[A]` | `ADR-005` — agente não edita o referencial | dona do produto (`SPEC-C-014` §13 traz o texto pronto, já com a janela do "ceço" ampliada) |
| ~~Onboarding em 1ª pessoa~~ | ✅ fechado no extra X.2 | — |
| ~~Interruptor do `nomeAutorizado`~~ | ✅ fechado no extra X.1 | — |
| `SPEC-D-015` (voz no desktop) | outro app; 66 pontos de emissão de erro em Rust colidem com `ADR-006` | fase 2; provavelmente **ADR** |
| `PRODUCT.md` × `DESIGN.md` do desktop | "não parecer infantil" × a voz do cecinho | fase 2 |
| Camadas 2 e 3 (rótulo funcional, catálogo) | `D9` — fora do gate, por decisão | opcional, sem prazo |
| 5 U+FFFD pré-existentes em `tasks/` | `theme-plan.md` (4) e `plan-periodo-letivo-correcao.md` (1) — corrupção anterior a este trabalho, sem backup aqui | dona decidir: restaurar de backup ou reescrever |