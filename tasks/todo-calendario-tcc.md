# To-do: calendário e controle do TCC (SPEC-024)

> Spec: [`../docs/specs/SPEC-024-calendario-e-controle-do-tcc.md`](../docs/specs/SPEC-024-calendario-e-controle-do-tcc.md)
> Plano com o porquê, arquivos e critérios: [`plan-calendario-tcc.md`](plan-calendario-tcc.md)
> Espelho de grupo: [`../../docs/specs/mobile/SPEC-M-023-calendario-e-controle-do-tcc-no-mobile.md`](../../docs/specs/mobile/SPEC-M-023-calendario-e-controle-do-tcc-no-mobile.md)
> **Regra de ouro:** cada fase fecha com `npm run verify:fast` verde; a fase que
> mexe em navegação e a última fecham com `npm run verify`. `SCHEMA_VERSION` não
> sobe (nada novo é persistido).

**Progresso:** 3/5 fases.

**Ordem:** F0 dado visível → F1 agregador → F2 tela e limpeza (checkpoint da
dona) → F3 consumidores (checkpoint da dona) → F4 controles do TCC.

---

## F0 — O dado que já existe aparece

- [x] **F0.1** Palavras na linha do capítulo e total no progresso (D7) — `npm run test -- src/components/tcc`
- [x] **F0.2** `requiredness` editável + "N de M essenciais" (D8) — `npm run test -- src/components/tcc`
- [x] **F0.3** `thesisDeadlines(state, from, to)`; `nextThesisDeadline` = `[0]` (D9)
- [x] **F0.4** `thesisPace` em 3 faixas, `null` sem dado (D11)
- [x] **Gate** `npm run verify:fast` — verde (2026-10-23)

## F1 — Um agregador só

- [x] **F1.1** `buildCalendarEntries` + `CalendarEntry` com `DateKey` (D4, D6) — `npm run test -- src/lib/__tests__/calendarAggregator.test.ts`
- [x] **F1.2** Migrar os 4 casos de `thesisEventsForMonth` para o agregador — `npm run test -- src/lib/__tests__/schedule.test.ts`
- [x] **F1.3** Fixture com 1 item de cada uma das 9 origens
- [x] **Gate** `npm run verify:fast` — verde (2026-10-23)

## F2 — Tela, rota e limpeza

- [x] **F2.1** `#/faculdade/calendario` degrada para a tela nova (D2) — `npm run test -- src/lib/__tests__/routing.test.ts`
- [x] **F2.2** `NavScreen { kind: 'calendar' }` + `#/calendario` + chunk loader + slide key (D1)
- [x] **F2.3** `CalendarScreen`: agenda 14 dias + mês + `+` com 3 portas reusadas (D3, D5) — `npm run test -- src/components/views/__tests__/CalendarScreen.test.tsx`
- [x] **F2.4** `SubTabFaculdade` sem `'calendario'`; default `'disciplinas'` — `npm run check:boundaries`
- [x] **F2.5** Deletar os 9 símbolos de grade morta e os tipos que só eles usam — `npm run verify`
- [ ] **Gate + checkpoint** `npm run verify` verde (152 arquivos · 1771 testes, 2026-10-23) e **mostrar a tela para a dona**

## F3 — Consumidores

- [ ] **F3.1** Home: atenção inclui TCC e estágio, teto de 5 (D13)
- [ ] **F3.2** Faculdade: lista sem `upcomingEvents`
- [ ] **F3.3** Apagar os três agregadores antigos — `rg "eventsForMonth|thesisEventsForMonth|upcomingEvents" src --glob '!*.test.*'`
- [ ] **Gate + checkpoint** `npm run verify` verde e **revisar a Home com a dona**

## F4 — Controles do TCC

- [ ] **F4.1** Filtro de leituras por capítulo (D10) — `npm run test -- src/components/tcc`
- [ ] **F4.2** Referências listadas no `ChapterSheet`, só leitura (D10)
- [ ] **F4.3** Copiar sumário na ordem canônica (D12)
- [ ] **F4.4** Lembretes: 5 campos expostos (D14)
- [ ] **Gate final** `npm run verify` + critérios da §8 da spec todos marcados

## Aberto (não bloqueia)

- [ ] Decidir com a dona: deletar ou manter `packages/domain/src/core/domain/calendar.ts` + `src/core/application/use-cases/calendar.ts` (sem chamador de produção)
