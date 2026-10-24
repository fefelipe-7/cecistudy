# Plano: calendário com um dono só e o controle do TCC (SPEC-024)

> Spec que rege: [`../docs/specs/SPEC-024-calendario-e-controle-do-tcc.md`](../docs/specs/SPEC-024-calendario-e-controle-do-tcc.md)
> Espelho de grupo: [`../../docs/specs/mobile/SPEC-M-023-calendario-e-controle-do-tcc-no-mobile.md`](../../docs/specs/mobile/SPEC-M-023-calendario-e-controle-do-tcc-no-mobile.md)
> To-do: [`todo-calendario-tcc.md`](todo-calendario-tcc.md)
> Data: 2026-10-23

## Regras do plano

1. **Uma fase por vez.** Cada fase fecha com o gate verde, não com "quase".
2. **Nenhuma fase sobe `SCHEMA_VERSION`.** O valor mora no código
   (`packages/data/src/schema.ts:13`) e a spec inteira é navegação, UI e função
   pura — nada novo é persistido. Se precisar subir, a fase está errada.
3. **Gate do ciclo de edição:** `npm run verify:fast` (typecheck + testes +
   boundary + voz + contrato). **Gate completo:** `npm run verify`. Rodar
   `npm run check:boundaries` **antes** de tocar `packages/*`, `src/shells` ou
   `src/overlays`.
4. **Deleção só com prova.** Símbolo só sai depois de `rg` mostrar zero
   chamador — não por parecer morto.
5. **Um commit por tarefa**, citando a decisão (`D7`, `D2`, ...).

## Ordem e por quê

```
Fase 0  o dado que já existe aparece   (D7 D8 D9 D11)  risco: baixo
Fase 1  agregador único                (D4 D6)         risco: baixo
Fase 2  tela, rota e limpeza           (D1 D2 D3 D5)   risco: alto  ← checkpoint
Fase 3  consumidores                   (D13)           risco: médio ← checkpoint
Fase 4  controles do TCC               (D10 D12 D14)   risco: baixo
```

Fase 0 primeiro porque entrega valor sem tocar navegação. Fase 2 é a única
irreversível para quem tem link salvo — por isso vem depois de o agregador já
estar testado.

---

## Fase 0 · O dado que já existe aparece

**Entrega:** palavras por capítulo, `requiredness` editável e lido, lista de
prazos, ritmo. **Nada de navegação.**

### T0.1 · Palavras na lista e no progresso (D7)

- **Arquivos:** `src/components/views/TccView.tsx` (linha do capítulo e card de
  progresso).
- **O que muda:** a linha mostra `wordCount/wordGoal` quando houver; o card
  mostra a soma de `wordCount` rotulada **no total** (a semana continua sendo o
  log).
- **Aceite:** as duas fontes de palavra aparecem com rótulos distintos.
- **Verificação:** `npm run test -- src/components/tcc`
- **Depende de:** —
- **Tamanho:** S

### T0.2 · `requiredness` editável e lido (D8)

- **Arquivos:** `src/components/tcc/ChapterSheet.tsx:107` (hoje fixo),
  `src/components/views/TccView.tsx` (card de progresso).
- **O que muda:** seletor `essencial`/`opcional` no sheet; o card mostra
  "N de M essenciais prontos" ao lado do percentual.
- **Aceite:** o seletor persiste; a contagem reage; o percentual geral **não**
  muda de significado.
- **Verificação:** `npm run test -- src/components/tcc`
- **Depende de:** T0.1 (mesmo card)
- **Tamanho:** S

### T0.3 · `thesisDeadlines` em lista (D9)

- **Arquivos:** `packages/domain/src/core/domain/thesis.ts:227-286`.
- **O que muda:** `thesisDeadlines(state, from, to)`; `nextThesisDeadline` vira
  `thesisDeadlines(state, today, '9999-12-31')[0] ?? null`.
- **Aceite:** I5 — o "próximo" e o primeiro da lista são o mesmo item; os testes
  atuais de `nextThesisDeadline` passam sem edição.
- **Verificação:** `npm run test -- $(rg -l "nextThesisDeadline" src packages --glob '*.test.*' | tr '\n' ' ')`
- **Depende de:** —
- **Tamanho:** S

### T0.4 · `thesisPace` (D11)

- **Arquivos:** `packages/domain/src/core/domain/thesis.ts` (função nova),
  `src/components/views/TccView.tsx` (card).
- **O que muda:** `thesisPace(state, today) → null | 'no_ritmo' | 'apertado' |
  'nao_da'`. Sem `deliveryDate` ou sem log → `null`, e a tela não renderiza.
- **Aceite:** I7; nenhuma faixa usa vermelho; nada é persistido.
- **Verificação:** `npm run test -- packages/domain` (ou o arquivo de teste de
  `thesis`; localizar com `rg -l "thesisProgress" --glob '*.test.*'`)
- **Depende de:** T0.3 (mesma janela, mesma ordenação)
- **Tamanho:** M

**Gate da fase:** `npm run verify:fast`.

---

## Fase 1 · Um agregador só

**Entrega:** `buildCalendarEntries` com os testes que hoje provam as três
projeções parciais migrados para ele. **Nenhum consumidor trocado ainda.**

### T1.1 · Tipo e função `buildCalendarEntries` (D4, D6)

- **Arquivos:** `src/lib/schedule.ts`.
- **O que muda:**
  - `CalendarEntry { id, date: DateKey, kind, layer, title, start?, end?, ref }`;
  - `buildCalendarEntries({ exams, tasks, chapters, meetings, milestones,
    projects, internshipLogs, studySessions, classSlots, from, to })` devolve
    lista ordenada por `(date, start ?? '99:99', title)`;
  - item só entra se `ref` resolve para entidade existente (I2);
  - capítulo `pronto`, pendência `resolvida` e reunião `cancelada` não entram (I3).
- **Aceite:** I1, I2 e I3 verdes.
- **Verificação:** `npm run test -- src/lib/__tests__/calendarAggregator.test.ts`
- **Depende de:** —
- **Tamanho:** M

### T1.2 · Migrar os testes de projeção do TCC

- **Arquivos:** `src/lib/__tests__/schedule.test.ts:119-222`.
- **O que muda:** os 4 casos de `thesisEventsForMonth` (capítulo pronto,
  pendência resolvida, reunião cancelada, id por `entityId`) passam a rodar
  contra o agregador. **Migrar, não apagar** — as regras continuam provadas.
- **Aceite:** os mesmos 4 casos, com os mesmos nomes, contra a função nova.
- **Verificação:** `npm run test -- src/lib/__tests__/schedule.test.ts`
- **Depende de:** T1.1
- **Tamanho:** S

### T1.3 · Fixture de cobertura por origem

- **Arquivos:** `src/lib/__tests__/calendarAggregator.test.ts`.
- **O que muda:** um teste com **uma** entidade de cada origem (aula, prova,
  tarefa, capítulo, pendência, reunião, marco, estágio, estudo) exigindo 9 itens.
- **Aceite:** último item da §8 da spec.
- **Verificação:** mesmo comando de T1.1
- **Depende de:** T1.1
- **Tamanho:** S

**Gate da fase:** `npm run verify:fast`. Nada visível muda — se mudou, vazou.

---

## Fase 2 · A tela, a rota e a limpeza

**Entrega:** calendário como tela empilhada, sub-aba removida, motor morto
deletado. **Fase irreversível para link salvo** — o teste de degradação vem
antes da remoção.

### T2.1 · Degradação da rota antiga (D2) — **primeiro**

- **Arquivos:** `packages/navigation/src/hash.ts:94,101,267`,
  `src/lib/__tests__/routing.test.ts:94,259,440,493`.
- **O que muda:** `'calendario'` sai de `SUB_TAB_BY_TAB.faculdade`;
  `parseRoute('#/faculdade/calendario')` devolve a rota do calendário;
  `#/faculdade/aulas` e `/avaliacoes` continuam degradando para `disciplinas`.
- **Aceite:** I8 e I9.
- **Verificação:** `npm run test -- src/lib/__tests__/routing.test.ts`
- **Depende de:** —
- **Tamanho:** S

### T2.2 · `NavScreen { kind: 'calendar' }` e rota `#/calendario` (D1)

- **Arquivos:** `packages/navigation/src/types.ts:54-109`,
  `packages/navigation/src/hash.ts` (campo, parse, `stackFromRoute`,
  `stackToHash`), `src/context/slideKeys.ts:129`,
  `src/shells/SharedScreenLayers.tsx` (`ScreenKey`, `SCREEN_CHUNK_LOADERS`,
  `SlideContent`), `src/context/navigationEngine.ts` (`openCalendar` e a flag
  derivada).
- **O que muda:** kind novo, rota, serialização e tela registrada no chunk
  loader. Pilha no reload: `[tab: home, calendar]`.
- **Aceite:** I10; `isUnknownSlideKind` não reclama; ida e volta pela hash
  preserva `day` quando presente.
- **Verificação:** `npm run verify:fast`
- **Depende de:** T2.1
- **Tamanho:** M

### T2.3 · `CalendarScreen` (D3, D5)

- **Arquivos:** `src/components/views/CalendarScreen.tsx` (novo),
  `src/components/views/faculdade/CalendarMonth.tsx` (vira parte, com chave
  `DateKey`).
- **O que muda:** agenda de 14 dias agrupada por dia + mês navegável + painel do
  dia com `+` (3 portas: `TaskSheet`, `openWizard('exam')`, `MeetingSheet`).
  Sem grade de horários.
- **Aceite:** I4 (nenhuma escrita no render); I10 (dez/jan não colidem); cada
  porta abre a folha certa; sem TCC, a porta de reunião não aparece.
- **Verificação:** `npm run test -- src/components/calendar`
- **Depende de:** T2.2, T1.1
- **Tamanho:** L

### T2.4 · Remover a sub-aba do engine e da view

- **Arquivos:** `packages/navigation/src/types.ts:25` (`SubTabFaculdade`),
  `src/context/navigationEngine.ts:422` (default `'calendario'`),
  `src/components/views/FaculdadeView.tsx:34,40,140,237`.
- **O que muda:** `SubTabFaculdade = 'disciplinas' | 'estagio'`; default vira
  `'disciplinas'` (o que `hash.ts:129` já declarava); o herói abre a tela de
  calendário em vez de trocar a sub-aba.
- **Aceite:** `rg "'calendario'" src/components/views/FaculdadeView.tsx packages/navigation/src/types.ts`
  vazio; a Faculdade abre em `disciplinas`.
- **Verificação:** `npm run check:boundaries && npm run test -- src/components/ui/__tests__/SwipeableTabPanel.test.tsx`
- **Depende de:** T2.1, T2.2
- **Tamanho:** M

### T2.5 · Deletar o motor de grade morto (D3)

- **Arquivos:** `src/lib/schedule.ts:331-620`.
- **Sai:** `buildCalendarWeek`, `computeOverlappingEventLayout`,
  `layoutTimedEntry`, `snapTo30Minutes`, `timeToMinutes`, `minutesToTime`,
  `CAL_GRID_START_HOUR`, `CAL_GRID_END_HOUR`, `CAL_HOUR_HEIGHT` e os tipos que só
  eles usam (`CalendarEntry` antigo, `TimedEntry`, `DayCalendarEntries`,
  `CalendarLayer`, `CalendarSubtype`, `CalendarEntryRef`, `CalendarStage`,
  `CalendarLink`, `TimedLayoutEntry`).
- **Aceite:** o `rg` do critério de aceite da §8 retorna vazio; build verde.
- **Verificação:** `npm run verify`
- **Depende de:** T2.3, T2.4
- **Tamanho:** M

**Gate da fase + checkpoint:** `npm run verify` verde. **Mostrar a tela para a
dona antes da Fase 3** — é a única fase com mudança de navegação irreversível.

---

## Fase 3 · Os consumidores passam a ler o agregador

### T3.1 · Home (D13)

- **Arquivos:** `src/components/views/HomeView.tsx:64-85`.
- **O que muda:** `attentionItems` vem do agregador e inclui prazo de TCC e
  pendência de estágio; teto de 5 mantido; "ver todas" abre a tela.
- **Aceite:** mesma ordem por data; `remainingCount` conta tudo que ficou fora.
- **Verificação:** `npm run test -- src/components/views`
- **Depende de:** T1.1, T2.2
- **Tamanho:** M

### T3.2 · Faculdade (D13)

- **Arquivos:** `src/components/views/FaculdadeView.tsx:114`,
  `src/components/views/faculdade/WeekEventsList.tsx`.
- **O que muda:** `upcomingEvents` deixa de ser chamado; a lista lê o agregador.
- **Aceite:** Faculdade e agenda do calendário mostram o mesmo conjunto para a
  mesma janela.
- **Verificação:** `npm run verify:fast`
- **Depende de:** T3.1
- **Tamanho:** S

### T3.3 · Apagar `upcomingEvents`, `eventsForMonth` e `thesisEventsForMonth`

- **Arquivos:** `src/lib/schedule.ts:175,211,289`.
- **Aceite:** `rg "eventsForMonth|thesisEventsForMonth|upcomingEvents" src --glob '!*.test.*'`
  retorna vazio.
- **Verificação:** o `rg` acima + `npm run verify:fast`
- **Depende de:** T3.1, T3.2
- **Tamanho:** S

**Gate da fase + checkpoint:** `npm run verify` verde. Revisar a Home com a dona
— é a tela aprovada que muda de conteúdo.

---

## Fase 4 · Os controles do TCC

### T4.1 · Filtro de leituras por capítulo (D10)

- **Arquivos:** `src/components/views/TccView.tsx` (aba leituras).
- **O que muda:** segundo `PillGroup` (capítulo) somado ao de status, por
  interseção.
- **Aceite:** os dois filtros combinam; "todos" volta ao conjunto completo.
- **Verificação:** `npm run test -- src/components/tcc`
- **Depende de:** —
- **Tamanho:** M

### T4.2 · Referências no `ChapterSheet` (D10)

- **Arquivos:** `src/components/tcc/ChapterSheet.tsx:137-146` (já desfaz
  vínculo), `src/components/tcc/ReferenceSheet.tsx:107,128,228` (já escreve).
- **O que muda:** lista **somente leitura** das referências vinculadas, com
  atalho para abrir a referência. Não cria vínculo novo aqui.
- **Aceite:** a lista reflete `chapterIds`; remover capítulo continua só
  desfazendo o vínculo (a referência não morre).
- **Verificação:** `npm run test -- src/components/tcc`
- **Depende de:** T4.1 (mesma tela)
- **Tamanho:** S

### T4.3 · Copiar sumário (D12)

- **Arquivos:** `src/components/views/TccView.tsx` (usa
  `orderChaptersForRender`, `packages/domain/src/core/domain/thesis.ts:348`).
- **O que muda:** botão que copia a estrutura na ordem canônica, com numeração e
  `kind`, em texto puro.
- **Aceite:** a saída respeita `orderChaptersForRender`; sem editor, sem arquivo.
- **Verificação:** `npm run test -- src/components/tcc`
- **Depende de:** —
- **Tamanho:** S

### T4.4 · Lembretes detalhados (D14)

- **Arquivos:** `src/components/wizards/TccWizard.tsx:75,135`,
  `src/components/views/TccView.tsx` (seção).
- **O que muda:** expõe `chapterDaysBefore`, `milestoneDaysBefore`, `time`,
  `meetingEve` e `meetingMinutesBefore`. O teto de 64 continua sendo do domínio
  (`thesis.ts:413`).
- **Aceite:** salvar e reabrir preserva os valores; desligar o interruptor
  continua desligando tudo.
- **Verificação:** `npm run test -- src/components/tcc`
- **Depende de:** —
- **Tamanho:** M

**Gate final:** `npm run verify` verde + todos os critérios da §8 da spec
marcados.

---

## Item aberto (não bloqueia nenhuma fase)

**Destino de `packages/domain/src/core/domain/calendar.ts`** (`Responsibility`,
`PlanningBlock`) e de `src/core/application/use-cases/calendar.ts`.

- **Estado:** espelho do calendário do desktop, com teste
  (`use-cases.test.ts`) e **zero chamador de produção**.
- **Decisão que falta:** (a) deletar junto com o motor morto da Fase 2, ou
  (b) manter declarado como não usado.
- **Recomendação do plano:** (a) — `ADR-009` diz que cada app tem o seu contrato
  de dados, e espelho sem chamador cria confiança falsa. Mas **deletar código de
  domínio é decisão da dona**, não do agente: fica registrado e não é executado
  até ela responder.
- **Enquanto não decidir:** G4 garante que `src/components` não importa nada
  dele.

## Débito que este plano não paga

- **C2** (`USER_SCHEMA_VERSION` duplicada): mexe em `packages/data`. Não tocar.
- **C10** (`packages/design-tokens` morto): fora de escopo.
- **Sobreposição sem chamador no desktop (C5):** é o motivo da D3 — não é
  resolvido aqui.
