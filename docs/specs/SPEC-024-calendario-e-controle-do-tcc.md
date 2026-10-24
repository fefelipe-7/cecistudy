# SPEC-024 · Calendário com um dono só, e o controle que o TCC já tinha

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **proposta** (2026-10-23)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §3.2 (recorte do mobile) e §4.2 (Calendário) — **[D]**
> Decisões: D1..D15
> Supersede: **SPEC-014 (D1), em duas cláusulas**: a tab bar de sub-abas deixa de ser congelada (a sub-aba `calendario` sai) e o bloco de calendário deixa de existir dentro da Faculdade — ver §12. Estende a SPEC-012 (`spec-tcc.md`; espelho de grupo `SPEC-M-016`) sem substituir nenhuma decisão dela
> Depende de: SPEC-007 (navegação por pilha), SPEC-012 (gestão do TCC), SPEC-M-020 (arrasto de abas), SPEC-022 (barra contextual)
> Espelha: — (spec local do mobile; a cópia de grupo é `SPEC-M-023`)
> Data: 2026-10-23
> Plano de execução: [`../../tasks/plan-calendario-tcc.md`](../../tasks/plan-calendario-tcc.md)

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** Duas áreas do app estão travadas em lugares diferentes: o
  **Calendário** mora como terceira sub-aba da Faculdade e é **somente leitura**;
  o **TCC** tem um modelo de dados rico que a tela não mostra.
- **O que a usuária faz hoje.** Para ver "o que tenho nos próximos dias" ela
  abre a Home (`AttentionSection`, só tarefa + prova), depois Faculdade →
  calendário (mês, com aulas/provas/tarefas/TCC), depois TCC → visão geral (um
  único prazo). Nenhuma dessas três responde sozinha.
- **O que acontece.** Um prazo de capítulo do TCC pode ficar invisível: a Home
  não o vê (`src/components/views/HomeView.tsx:64-85`), o TCC mostra **um** prazo
  (`thesis.ts:227` — `nextThesisDeadline` devolve `ThesisDeadline | null`), e o
  calendário que o vê está atrás de duas navegações.
- **Como se sabe que isso é um problema.** (a) O app **abre a Faculdade no
  calendário**: `src/context/navigationEngine.ts:422` declara
  `useState<SubTabFaculdade>('calendario')`, enquanto
  `packages/navigation/src/hash.ts:129` declara o padrão como `disciplinas` — as
  duas fontes discordam sobre qual é a tela de entrada. (b) O motor de
  calendário de semana está escrito e **sem chamador**: `buildCalendarWeek`
  (`src/lib/schedule.ts:423`) e mais 5 símbolos têm zero referências fora do
  próprio arquivo. (c) `wordCount` e `wordGoal` são editáveis
  (`ChapterSheet.tsx:230-262`) e não aparecem na lista de capítulos
  (`TccView.tsx:441-470`). (d) `requiredness` é gravado como `'obrigatorio'`
  fixo (`ChapterSheet.tsx:107`) e **nunca lido** por ninguém.

## 2. Decisões

### D1 · O calendário é tela empilhada, não sexta aba

- **Decisão.** Vira `NavScreen { kind: 'calendar'; day?: DateKey }`, rota
  `#/calendario`, empilhada sobre a aba de origem. Não entra na `BottomNav`.
- **Justificativa.** Cinco abas são o recorte fechado do produto
  (`packages/navigation/src/types.ts:22`). Uma sexta aba muda a barra inteira
  para ganhar uma tela que é de consulta, não de navegação primária.
- **Alternativa rejeitada.** Sexta aba "calendário" na `BottomNav`: rejeitada
  pela dona em 2026-10-22 — "sem tornar o app confuso e bagunçado".
- **Consequência aceita.** O calendário fica a **dois** toques de qualquer tela
  (Home → calendário, ou Faculdade → calendário). No reload direto da rota, a
  pilha é `[tab: home, calendar]` — voltar leva à Home, mesmo que a tela tenha
  sido aberta a partir da Faculdade. É a mesma degradação que o TCC já aceita
  (`hash.ts:388-394`).

### D2 · A sub-aba `calendario` sai da Faculdade

- **Decisão.** `SubTabFaculdade` passa a ser `'disciplinas' | 'estagio'`.
  `#/faculdade/calendario` **não** vira 404: `parseRoute` a traduz para a tela
  de calendário (§7, caso de borda 1).
- **Justificativa.** Dois calendários, com duas fontes de dado, é exatamente a
  bagunça que a dona pediu para evitar. E é a oportunidade de corrigir a
  divergência de entrada: o engine diz `calendario`
  (`navigationEngine.ts:422`), a hash diz `disciplinas` (`hash.ts:129`).
  Removida a sub-aba, não há como divergir.
- **Alternativa rejeitada.** Manter as duas: a sub-aba como "prévia de 7 dias" e
  a tela como "completa". Rejeitada porque a prévia teria que ler o mesmo
  agregador e passaria a ser a mesma tela em tamanho menor.
- **Consequência aceita.** Mexe em hash, pilha, `slideKeys`, teste de arrasto e
  no `useState` inicial do engine. **Supera parcialmente a SPEC-014 D1** em duas
  cláusulas: a tab bar de sub-abas e a permanência do bloco de calendário dentro
  da Faculdade (§12). Entrada da Faculdade passa a ser `disciplinas` — o que a
  hash já declarava.

### D3 · A visão é agenda (14 dias) + mês. Sem grade de horários

- **Decisão.** A tela tem duas partes: lista cronológica dos próximos 14 dias,
  agrupada por dia, e o mês navegável (reusa o desenho de `CalendarMonth`).
  Nenhuma grade por hora.
- **Justificativa.** A grade semanal existe em código e nunca foi usada: 6
  funções e 11 tipos com **zero** chamador (verificado símbolo a símbolo em
  2026-10-23). Reaproveitar exigiria uma tela de 390px com colunas de 55px. A
  lista responde a pergunta que a usuária faz ("o que tenho essa semana") sem
  esse preço.
- **Alternativa rejeitada.** Grade de semana com blocos posicionados por hora
  (`buildCalendarWeek` + `computeOverlappingEventLayout`): rejeitada por custo
  de tela pequena e porque a detecção de sobreposição, no desktop, ainda não
  tem chamador em produção — prometer aqui o que o app dono da regra não
  entrega seria pior que não ter.
- **Consequência aceita.** O mobile **não** mostra dois compromissos no mesmo
  horário como conflito. A sobreposição continua derivada e não sinalizada no
  mobile; quem quiser ver o dia por hora usa o desktop.

### D4 · Um agregador puro é a única fonte de eventos

- **Decisão.** `buildCalendarEntries(input)` devolve `CalendarEntry[]`
  ordenada por `(date, start ?? '99:99', title)`. Substitui `upcomingEvents`,
  `eventsForMonth` e `thesisEventsForMonth`. É a única coisa que Home,
  Faculdade e a tela de calendário consomem.
- **Justificativa.** Hoje há três agregadores parciais que já divergem: a Home
  não vê TCC (`HomeView.tsx:69-87`), o mês vê (`CalendarMonth.tsx:64-77`), e a
  semana acadêmica vê estágio (`FaculdadeView.tsx:114`). Três respostas
  diferentes para a mesma pergunta.
- **Alternativa rejeitada.** Manter os três e só somar o calendário como quarto
  consumidor: cada consumidor novo recria o filtro, e a divergência vira
  estrutural.
- **Consequência aceita.** Os testes de `thesisEventsForMonth`
  (`src/lib/__tests__/schedule.test.ts:119-222`) **migram** para o agregador —
  migram, não somem: as quatro regras que eles provam (capítulo pronto não é
  prazo, pendência resolvida não é prazo, reunião cancelada não é prazo, id por
  `entityId`) passam a valer para a tela inteira.

### D5 · Criar pelo dia, reusando as folhas que já existem

- **Decisão.** O painel do dia ganha `+` que abre um seletor de três portas:
  pendência/tarefa (`TaskSheet`), prova (`openWizard('exam')`), reunião do TCC
  (`MeetingSheet`). Nenhum formulário novo.
- **Justificativa.** `TaskSheet` da Home aceita só `open`/`onClose`
  (`views/home/TaskSheet.tsx:23-26`) — é reuso direto. Um formulário de
  calendário seria um quarto caminho de escrita para a mesma entidade.
- **Alternativa rejeitada.** Formulário único de "novo evento" com tipo: cria um
  dono novo para dado que já tem dono, e a transição de estado ficaria fora do
  domínio.
- **Consequência aceita.** O `+` não cria evento com hora de início/fim. Quem
  precisa de horário usa a disciplina, o TCC ou o registro de estudo.

### D6 · A data do calendário é `DateKey`, não o dia do mês

- **Decisão.** `CalendarEntry.date` é `DateKey` (`YYYY-MM-DD`). A grade do mês
  é agrupada por `DateKey`, não por `number`.
- **Justificativa.** A chave do mês nasce `Map<number, CalendarEvent[]>`
  (`src/lib/schedule.ts:180,218`) e é consumida como `calEvents.get(day)`
  (`CalendarMonth.tsx:93,141`). A chave perde mês e ano: o dia 5 de dois meses é
  a mesma chave. Funciona hoje porque o mapa é refeito por mês; quebra no
  primeiro item que atravesse a virada.
- **Alternativa rejeitada.** Manter `number` e "só tomar cuidado": a regra de
  tempo do grupo proíbe derivar data civil de `Date` e exige `DateKey`
  (`SPEC-C-002`).
- **Consequência aceita.** Todo consumidor do mês passa a comparar string. Custo
  único, some a classe de bug.

### D7 · As palavras do capítulo aparecem

- **Decisão.** A linha do capítulo mostra `wordCount/wordGoal` quando houver; o
  card de progresso mostra o total de palavras do TCC (soma de `wordCount`).
- **Justificativa.** O dado é digitado e desaparece: `ChapterSheet.tsx:230-262`
  grava, `TccView.tsx:441-470` não lê. A meta semanal (`renderWeekCard`) conta
  **log**, não o total real — são números diferentes e o app só mostra um.
- **Alternativa rejeitada.** Esperar o editor de texto do desktop
  (`SPEC-D-011`): o número não depende de editor, depende de ler o campo que já
  existe.
- **Consequência aceita.** Duas fontes de palavra convivem (log = delta da
  semana, `wordCount` = total informado). A tela precisa nomear as duas
  (`esta semana` vs `no total`), senão o usuário acha que uma está errada.

### D8 · `requiredness` sai do limbo

- **Decisão.** Vira controle no `ChapterSheet` (`essencial` / `opcional`, os
  dois valores que a UI mostra) e passa a ser lido no progresso: o card mostra
  "N de M essenciais prontos" ao lado do percentual geral.
- **Justificativa.** Hoje é `'obrigatorio'` fixo na criação
  (`ChapterSheet.tsx:107`) e ninguém lê. É dado que existe, ocupa o contrato e
  não serve para nada. `Requiredness` tem 5 valores no domínio
  (`projects.ts:34`); a UI usa 2 porque são os 2 que mudam a leitura do
  progresso.
- **Alternativa rejeitada.** Remover o campo: quebra o espelho com o desktop,
  onde `requiredness` decide o que vira obrigação. Removê-lo aqui para
  reintroduzi-lo depois é trabalho duas vezes.
- **Consequência aceita.** O percentual geral **não** muda de significado — ele
  continua contando todos os capítulos. A contagem de essenciais é adicional,
  não substituta.

### D9 · Prazo do TCC é lista, e o "próximo" é o primeiro item dela

- **Decisão.** `thesisDeadlines(state, from, to): ThesisDeadline[]`.
  `nextThesisDeadline(state, today)` passa a ser
  `thesisDeadlines(state, today, '9999-12-31')[0] ?? null`.
- **Justificativa.** A tela precisa de "próximos 30 dias"; a função devolve
  `null | um` (`thesis.ts:227-286`). Duplicar o filtro em outro lugar cria a
  segunda verdade sobre "o que é prazo de capítulo".
- **Alternativa rejeitada.** Uma segunda função `upcomingThesisDeadlines` ao
  lado da primeira: são a mesma filtragem com `slice` diferente.
- **Consequência aceita.** `nextThesisDeadline` vira uma linha. Quem já chama
  (`TccView.tsx:128`) não muda.

### D10 · Referência e capítulo se leem nos dois sentidos

- **Decisão.** A aba leituras ganha filtro por capítulo; o `ChapterSheet` lista
  as referências vinculadas (só leitura, com atalho para a referência).
- **Justificativa.** `chapterIds` é escrito no `ReferenceSheet`
  (`ReferenceSheet.tsx:107,128,228`) e, no `ChapterSheet`, só se **desfaz** o
  vínculo na remoção do capítulo (`ChapterSheet.tsx:137-146`) — nenhuma tela
  **lista** as referências de um capítulo. Quem escreve o capítulo 3 precisa
  saber o que já pode citar sem abrir 40 referências uma por uma.
- **Alternativa rejeitada.** Criar uma entidade de "citação por capítulo": é a
  mesma relação, com tabela nova e migração.
- **Consequência aceita.** O filtro usa `PillGroup`, que já é reservado a filtro
  (`SPEC-010 D7`). A aba passa a ter dois filtros (status e capítulo);
  combinam por interseção.

### D11 · O ritmo é informado, nunca cobrado

- **Decisão.** `thesisPace(state, today)` devolve `null` ou uma das três faixas:
  `no_ritmo`, `apertado`, `nao_da` — comparando as palavras que faltam (soma de
  `wordGoal` dos capítulos não prontos, com fallback para `wordCount` quando não
  há meta) divididas pelas semanas até `deliveryDate`, contra a média real das
  últimas 4 semanas de `thesisWritingLogs`. Nenhum estado é persistido; nenhuma
  faixa usa vermelho.
- **Justificativa.** Os três insumos já existem: meta por capítulo, entrega e
  log semanal. O app hoje mostra "300 de 500 palavras" e não diz o que isso
  significa para a entrega.
- **Alternativa rejeitada.** Selo/streak de ritmo: joga o peso emocional na
  usuária. Rejeitada pela dona em 2026-10-22 — a projeção deve informar, não
  cobrar.
- **Consequência aceita.** Sem `deliveryDate` ou sem log, a função devolve
  `null` e a tela não mostra nada. Ela **não** estima a partir de zero.

### D12 · O TCC copia a estrutura; não ganha editor

- **Decisão.** Botão "copiar sumário" na aba capítulos: os capítulos na ordem
  canônica de `orderChaptersForRender`, com numeração e o `kind` (capítulo ou
  seção), em texto puro para colar no Word.
- **Justificativa.** O que a usuária perde ao sair do app é a estrutura, não a
  formatação fina. Editor, DOCX e round-trip continuam fora de escopo
  (`SPEC-012 §Fora de escopo`).
- **Alternativa rejeitada.** Exportar `.docx`: exige biblioteca, template e
  teste de arquivo binário, para um ganho que o sumário copiado já entrega.
- **Consequência aceita.** A numeração é a da ordem da lista, não a ABNT
  automática. Quem usa numeração própria (1.1, 1.2) copia do jeito que montou.

### D13 · Home e Faculdade passam a ler o mesmo agregador

- **Decisão.** `AttentionSection` (Home) inclui prazo de TCC e pendência de
  estágio, na mesma ordenação por data, e "ver todas" abre a tela de calendário.
  A lista de eventos da Faculdade consome o agregador em vez de
  `upcomingEvents`.
- **Justificativa.** É a D4 aplicada aos dois consumidores que já existiam. Sem
  isso, o agregador único é só um módulo novo com um chamador.
- **Alternativa rejeitada.** Deixar a Home como está e corrigir só o calendário:
  mantém exatamente o buraco que motivou esta spec.
- **Consequência aceita.** A Home muda de conteúdo numa tela que a dona já
  aprovou; o bloco ganha itens de outra origem, mantendo o teto de
  5 e o "+N aguardando".

### D14 · Os lembretes do TCC ganham os campos que o domínio já planeja

- **Decisão.** A aba visão do TCC passa a editar `chapterDaysBefore`,
  `milestoneDaysBefore`, `time`, `meetingEve` e `meetingMinutesBefore`. Hoje só
  `enabled` é editável (`src/components/wizards/TccWizard.tsx:75,135`).
- **Justificativa.** `planThesisReminders` (`thesis.ts:353`) implementa 4
  gatilhos configuráveis que a UI nunca expôs. A usuária só pode desligar tudo.
- **Alternativa rejeitada.** Manter só on/off: a decisão de quando lembrar
  volta a ser do código, não dela.
- **Consequência aceita.** A tela ganha uma seção; o teto de 64 notificações
  (`THESIS_REMINDER_CEILING`) já é aplicado pelo domínio, não precisa de UI para
  isso.

### D15 · O espelho morto do Calendário do desktop não é a base desta tela

- **Decisão.** Esta spec **não** constrói o calendário sobre
  `packages/domain/src/core/domain/calendar.ts` (`Responsibility`,
  `PlanningBlock`). A tela agrega o que o mobile já tem: `Exam`, `Task`,
  `Thesis*`, `InternshipLog`, `StudySession` e os slots da disciplina. O destino
  do espelho morto fica registrado como item aberto no plano de execução.
- **Justificativa.** `planResponsibility` e `scheduleEvent`
  (`src/core/application/use-cases/calendar.ts`) não têm **nenhum** chamador de
  produção — só `use-cases.test.ts`. Construir em cima disso seria construir em
  cima do que ninguém usa, e prometeria planejamento por bloco sem tela para
  criar o bloco. A ADR-009 diz que cada app tem o seu contrato de dados: espelho
  sem chamador não é contrato, é peso com teste.
- **Alternativa rejeitada.** Adotar `Responsibility` agora: exigiria migração de
  schema, tela de bloco de planejamento e a tradução de `Task` → `Responsibility`
  — três frentes para resolver "não vejo meus prazos num lugar".
- **Consequência aceita.** O mobile continua sem bloco de planejamento. Se um
  dia ele entrar, entra **portando a decisão** do desktop pelo procedimento do
  `AGENTS.md` do grupo, não herdando este arquivo.

## 3. Escopo

| Item | Tipo |
|---|---|
| `NavScreen { kind: 'calendar' }` + rota `#/calendario` + serialização | código |
| Remoção da sub-aba `calendario` e degradação de `#/faculdade/calendario` | código |
| `buildCalendarEntries` e o tipo `CalendarEntry` reescrito | código |
| Tela `CalendarScreen` (agenda 14 dias + mês + painel do dia com `+`) | código |
| Home e Faculdade consumindo o agregador | código |
| Deleção de `buildCalendarWeek`, `computeOverlappingEventLayout`, `layoutTimedEntry`, `snapTo30Minutes`, `timeToMinutes`, `minutesToTime`, `CAL_GRID_*`, `CAL_HOUR_HEIGHT` e dos tipos que só eles usam | código |
| `wordCount`/`wordGoal` na linha do capítulo + total no progresso | código |
| `requiredness` editável e lido no progresso | código |
| `thesisDeadlines` + `nextThesisDeadline` como primeiro item | código |
| Filtro de leituras por capítulo + referências no `ChapterSheet` | código |
| `thesisPace` + card de ritmo | código |
| "copiar sumário" | código |
| Lembretes detalhados do TCC | código |
| Testes de agregador, rota, invariantes e migração dos testes de TCC | gate |

**Nenhuma mudança de schema.** `SCHEMA_VERSION` (`packages/data/src/schema.ts:13`)
não sobe: nada novo é persistido, nada é migrado. Se a implementação precisar
subir a versão, a implementação está errada.

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Grade de horários (semana/dia) | D3 — motor morto não é motivo para construir tela |
| Detecção de sobreposição no mobile | a regra é do desktop e lá ainda não tem chamador (glossário, "Sobreposição e conflito") |
| Camada `google` / `gcal` | exige integração e o bug de UTC do `calendar.ts` do desktop; já fora de escopo na `SPEC-012` |
| Agenda do celular (`deviceEventId`) | idem `SPEC-012 §Fora de escopo` |
| Editor de texto, DOCX, versões | `SPEC-D-011` (desktop) |
| Vários TCCs | um TCC (`SPEC-012 D1`) |
| Recorrência de reunião | `SPEC-012 §Fora de escopo` |
| Colaboração com a orientadora | §4.7 **[D]** do referencial |
| Notificação nova além das que o domínio já planeja | D14 é UI sobre `planThesisReminders`, não plano novo |

## 5. Contrato

Nada cruza para o outro app. Esta é uma spec de apresentação e agregação sobre
dado que o mobile já possui.

| Artefato | O que é | Onde |
|---|---|---|
| `CalendarEntry` | item de leitura do calendário: `{ id, date, kind, layer, title, start?, end?, ref }` | `src/lib/schedule.ts` |
| `buildCalendarEntries` | função pura; recebe coleções e janela; devolve lista ordenada | idem |
| `thesisDeadlines` | lista de prazos do TCC numa janela | `packages/domain/src/core/domain/thesis.ts` |
| `thesisPace` | faixa de ritmo ou `null` | idem |
| `ref` | aponta para a entidade real (`exam`/`task`/`chapter`/...); é o que permite o toque navegar | idem |

**Quem consome:** a tela de calendário, a Home e a Faculdade, dentro do mobile.

**O que o desktop continua sendo:** o dono da regra do Calendário
(`ADR-003`, `ADR-009`). O mobile **não** adota `Responsibility` nesta spec
(D15) e não reimplementa atraso, transição nem sobreposição.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | `buildCalendarEntries` é puro: nenhum relógio. `today` chega por parâmetro | `src/lib/schedule.ts` | `src/lib/__tests__/calendarAggregator.test.ts` ("mesma entrada, mesma saída") |
| I2 | Todo `CalendarEntry` tem `ref` que resolve para uma entidade presente nas coleções de entrada — nenhum item órfão | `src/lib/schedule.ts` | idem ("todo item tem dono") |
| I3 | Capítulo `pronto`, pendência `resolvida`/`arquivada` e reunião `cancelada` **não** geram item | `src/lib/schedule.ts` | idem (migração de `schedule.test.ts:202`) |
| I4 | A tela de calendário **não escreve**: nenhuma chamada de escrita no caminho de render | `src/components/views/CalendarScreen.tsx` | `src/components/calendar/__tests__/CalendarScreen.test.tsx` |
| I5 | `nextThesisDeadline(s, d)[0]` e `thesisDeadlines(s, d, '9999-12-31')[0]` são o mesmo item | `packages/domain/src/core/domain/thesis.ts` | `thesis.test.ts` ("próximo é o primeiro da lista") |
| I6 | Total de palavras = soma de `wordCount`; nenhum arredondamento | `TccView.tsx` | `TccView.test.tsx` ("total é a soma") |
| I7 | `thesisPace` devolve `null` sem `deliveryDate` ou sem log — nunca estima de zero | `thesis.ts` | `thesis.test.ts` ("sem dados, sem faixa") |
| I8 | `parseRoute('#/faculdade/calendario')` devolve a tela de calendário, nunca `undefined` | `packages/navigation/src/hash.ts` | `routing.test.ts` |
| I9 | `SubTabFaculdade` nunca recebe valor fora do tipo depois de um reload de hash antigo | `src/context/navigationEngine.ts` | `routing.test.ts` ("sub-tab removida satura no padrão") |
| I10 | Nenhum item do mês usa `number` como chave de data | `CalendarScreen.tsx` | `CalendarScreen.test.tsx` ("dezembro e janeiro não colidem") |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Hash antigo `#/faculdade/calendario` | abre a tela de calendário (D2); não cai em 404 nem na lista de disciplinas |
| Hash antigo `#/faculdade/aulas` ou `/avaliacoes` | continua degradando para `disciplinas` (`hash.ts:267`) |
| Reload direto em `#/calendario` | pilha `[home, calendar]`; voltar leva à Home |
| Dia sem nada | painel mostra o vazio da voz (`VAZIO`) e o `+` continua disponível |
| Item cujo `ref` aponta para entidade apagada | item não entra no agregador (I2), sem erro |
| TCC sem capítulo nem prazo | calendário não mostra camada tcc; Home idem |
| `deliveryDate` no passado | `thesisPace` devolve `nao_da` com semanas = 0; nunca divide por zero |
| Dois capítulos com o mesmo título no mesmo dia | dois itens, ids diferentes por `entityId` (regra herdada de `schedule.test.ts:214`) |
| Mensal de dezembro → janeiro | chaves `DateKey` distintas (I10) |
| Capítulo sem `wordGoal` mas com `wordCount` | a linha mostra só o total; o ritmo usa `wordCount` como meta (D11) |
| Tela de 320px | agenda e mês empilham; nenhum texto truncado a ponto de perder a data |
| `+` com o TCC não iniciado | a porta "reunião do TCC" não aparece; não cria reunião órfã |

## 8. Critérios de aceite

- [ ] `npm run lint` sai com 0
- [ ] `npm run test` sai com 0
- [ ] `npm run build` sai com 0
- [ ] `node .github/scripts/check-boundaries.mjs` sai com 0
- [ ] `npm run test -- src/lib/__tests__/calendarAggregator.test.ts` sai com 0
- [ ] `npm run test -- src/lib/__tests__/routing.test.ts` sai com 0
- [ ] `rg "buildCalendarWeek|computeOverlappingEventLayout|layoutTimedEntry|snapTo30Minutes|CAL_GRID_START_HOUR|CAL_HOUR_HEIGHT" src packages` retorna vazio
- [ ] `rg "eventsForMonth|thesisEventsForMonth|upcomingEvents" src --glob '!*.test.*'` retorna só `src/lib/schedule.ts` (o agregador)
- [ ] `rg "'calendario'" src/components/views/FaculdadeView.tsx packages/navigation/src/types.ts` retorna vazio
- [ ] `rg "SCHEMA_VERSION = " packages/data/src/schema.ts` continua `22`
- [ ] Um item de cada origem (aula, prova, tarefa, capítulo, pendência, reunião, marco, estágio, estudo) aparece na agenda do teste de fixture

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Agregadores de calendário em produção | `rg "export function (eventsForMonth\|thesisEventsForMonth\|upcomingEvents\|buildCalendarEntries)" src/lib/schedule.ts \| wc -l` | 4 | 1 | inspeção no PR |
| Símbolos de grade morta | `rg "buildCalendarWeek\|computeOverlappingEventLayout\|layoutTimedEntry\|snapTo30Minutes" src \| wc -l` | 12 (definições + tipos) | 0 | critério de aceite |
| Telas onde a sub-aba `calendario` existe | `rg -c "'calendario'" src packages` | 6 | 0 | critério de aceite |
| Dado editável invisível no TCC | `rg "wordCount\|wordGoal" src/components/views/TccView.tsx` | 0 | ≥ 2 | `npm run test -- src/components/tcc` |
| Testes de projeção do TCC | `npm run test -- src/lib/__tests__/schedule.test.ts` | 4 casos | 4 casos migrados | mesmo comando no agregador |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Deep-link salvo apontando para `#/faculdade/calendario` | média | médio | degradação explícita (I8) + teste antes da remoção |
| A Home perder a leitura aprovada ao ganhar itens de TCC/estágio | média | médio | manter teto de 5 e ordem por data; revisar com a dona antes de fechar a fase |
| `thesisPace` desanimar quando o número é ruim | média | alto (produto) | D11: três faixas, nenhuma vermelha, texto neutro; se ela pedir, vira só "no ritmo / abaixo do ritmo" |
| Perder o único modelo tipado de entrada com hora ao deletar `buildCalendarWeek` | baixa | baixo | histórico do git; o modelo nunca teve chamador |
| Agregador virar gargalo em device antigo | baixa | médio | derivado e memoizado por (coleções, janela); nenhuma varredura por dia |
| Mexer em `packages/navigation` quebra o gate de fronteiras | baixa | alto | rodar `check-boundaries.mjs` antes de editar `packages/navigation` |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `packages/navigation/src/types.ts:54-109`, `hash.ts:172-320`, `stack.ts` | `routing.test.ts` | `npm run test` |
| D2 | `packages/navigation/src/types.ts:25`, `hash.ts:94,101,267`, `navigationEngine.ts:422` | `routing.test.ts` (4 casos existentes migram) | `check-boundaries.mjs` |
| D3 | `src/lib/schedule.ts:423-557` (deleção), `views/CalendarScreen.tsx` | `calendarAggregator.test.ts` + `CalendarScreen.test.tsx` | `npm run test` |
| D4 | `src/lib/schedule.ts` | `calendarAggregator.test.ts` | `npm run test` |
| D5 | `views/CalendarScreen.tsx`, `views/home/TaskSheet.tsx:23`, `wizards/TccWizard` (`exam`) | `CalendarScreen.test.tsx` ("cada porta abre a folha certa") | `npm run test` |
| D6 | `src/lib/schedule.ts` (`CalendarEntry.date`) | `CalendarScreen.test.tsx` (I10) | `npm run test` |
| D7 | `TccView.tsx:441-470`, `:340-360` | `TccView.test.tsx` (I6) | `npm run test -- src/components/tcc` |
| D8 | `tcc/ChapterSheet.tsx:107`, `TccView.tsx:355` | `TccView.test.tsx` ("essenciais") | `npm run test -- src/components/tcc` |
| D9 | `packages/domain/src/core/domain/thesis.ts:227-286` | `thesis.test.ts` (I5) | `npm run test` |
| D10 | `TccView.tsx:504-600`, `tcc/ChapterSheet.tsx` | `TccView.test.tsx` ("filtro por capítulo") | `npm run test -- src/components/tcc` |
| D11 | `packages/domain/src/core/domain/thesis.ts` (`thesisPace`) | `thesis.test.ts` (I7) | `npm run test` |
| D12 | `TccView.tsx` (`copySummary`) | `TccView.test.tsx` ("sumário copiado na ordem canônica") | `npm run test -- src/components/tcc` |
| D13 | `src/components/views/HomeView.tsx:64-85`, `src/components/views/home/AttentionSection.tsx`, `src/components/views/faculdade/WeekEventsList.tsx` | `calendarAggregator.test.ts` (mesma entrada dos três consumidores) | `npm run test` |
| D14 | `TccView.tsx` (seção lembretes) | `TccView.test.tsx` ("preferências salvam") | `npm run test -- src/components/tcc` |
| D15 | `src/core/application/use-cases/calendar.ts` (sem import na tela) | `rg "planResponsibility" src/components` vazio | critério de aceite |

## 12. Reconciliação

| Item da spec anterior | Estado | Onde |
|---|---|---|
| SPEC-014 **D1** — "a tab bar continua exatamente como estava" | **superado só nesta cláusula** pela D2 | `docs/specs/SPEC-014-faculdade-cantinho-academico.md:38-52` |
| SPEC-014 **D1** — "a composição e a ordem dos blocos continuam" | **superado só no bloco de calendário**: ele deixa de existir dentro da Faculdade (D2). Os blocos de disciplinas e estágio, e a ordem entre eles, **continuam** | idem |
| SPEC-014 D2..D6 | **em vigor**; não tocadas | idem |
| SPEC-012 (TCC) — D1..D7 e §Fora de escopo | **em vigor**; esta spec acrescenta controle, não muda modelo | `spec-tcc.md` |
| SPEC-012 — `wordCount` e `wordGoal` existem no modelo | **em vigor**; era lacuna de tela, não de modelo | `thesis.ts:96-97` |
| `thesisEventsForMonth` (SPEC-012 F4.5) | **absorvido** pelo agregador (D4); a regra continua idêntica | `src/lib/schedule.ts:211-288` |
| `#/faculdade/calendario` como rota de sub-aba | **absorvido** pela rota `#/calendario` (D2) | `hash.ts:94` |

---

> Regras de escrita do grupo: pt-BR, sem emoji em título, `caminho:linha` em
> toda afirmação sobre código. Ver
> [`../../../AGENTS.md`](../../../AGENTS.md#regras-de-escrita).
