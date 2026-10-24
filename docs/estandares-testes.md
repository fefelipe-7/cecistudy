# Padrões de teste — cecistudy mobile

**Status:** aceita  
**Origem:** spec-performance §8, AGENTS.md  
**Valido a partir de:** 2026-10-23  
**Dono:** app mobile. O desktop tem gate próprio (`npm run verify`).

## Problema

A suíte completa passa de 2 mil testes, é lenta e flaky por tempo. Rodar tudo a cada edição sobrecarrega máquina e CI. A contagem sai do comando (`npm run test:ci`), não deste texto.

## Princípios

1. **Pirâmide enxuta**: domínio puro > integração de módulo > UI > e2e. Testes de UI só onde o comportamento não é testável no domínio.
2. **Separação por caminho**: `packages/*` é domínio/aplicação — testes unitários rápidos, sem jsdom, sem timer real. `src/*` é UI/integração — pode usar jsdom, mas deve ser mínimo.
3. **Sem tempo real**: testes que dependem de `setTimeout`/`Date.now()` usam `vi.useFakeTimers()` e datas fixas. Flaky por relógio = débito.
4. **Timeout padrão**: 5s por teste, 10s máximo. Teste que precisa mais é sinal de integração mal desenhada.
5. **Determinismo**: sem rede, sem SQLite real, sem Capacitor em teste unitário. Mocks explícitos, fixtures versionadas.

## Categorias e scripts

Scripts adicionados em `package.json`. Não use `--include`: não é flag do Vitest (falha com `Unknown option`). Use `--exclude`, como abaixo, ou filtro posicional (`vitest run packages/`).

```json
"test:domain": "vitest run --exclude 'src/**' --exclude 'apps/**'"
"test:ui":     "vitest run --exclude 'packages/**' --exclude 'apps/**'"
"test:apps":   "vitest run --exclude 'src/**' --exclude 'packages/**'"
"test":        "vitest run"
"test:ci":     "vitest run --reporter=dot"
```

Fluxo recomendado:

- **Ciclo de edição**: `npm run test:domain` — ~segundos, valida domínio.
- **PR**: `test:domain` + `test:ui` com reporter dot, + boundary check.
- **Release/CI**: `test:ci` completo, mas nunca junto com `verify` do desktop.

## Organização

- `packages/domain/**/__tests__` — invariantes puras, sem efeitos.
- `packages/application/**/__tests__` — use-cases, com repositório fake.
- `src/components/**/__tests__` — render + interação básica com `@testing-library/react`. Não testar lógica de domínio.
- Nome de arquivo: `*.test.ts(x)` ao lado do código.
- Descrição `describe('modulo — contexto')` curta, `it` descreve comportamento.

## Regras anti-flaky

- Não usar `await new Promise(r => setTimeout(r, x))`. Use `vi.advanceTimersByTime`.
- Não criar `new Date()` sem injeção. Use `DateKey` / `now` injetado.
- Limpar estado entre testes: `afterEach(cleanup)`. Já configurado.
- `canvas-confetti` e `requestAnimationFrame` mockados em `vitest.setup.ts`.

## Classificação e corte

Todo teste novo ou revisado responde duas perguntas: **qual é a classe** e **o que ele protege que outro gate não protege**. Sem resposta, o teste não entra.

| Classe | Onde mora | O que prova | Ação |
|---|---|---|---|
| invariante de domínio | `packages/*` | regra pura e borda | manter; sem jsdom |
| caso de uso | `packages/application` | orquestração com repositório fake | manter |
| UI comportamental | `src/**` | interação ou estado que o domínio não cobre | manter, mínimo |
| render-only / snapshot estático | qualquer | que o markup apareceu | **remover** |
| duplicata de gate existente | qualquer | a mesma regra já provada em outro lugar | **remover ou mesclar** |
| compat stub | `src/core/*`, `src/data/*` | re-export | **não testar** |
| variação de dado | mesma asserção | N entradas | `it.each`, não N testes |

**Regra de corte:** um teste só fica se **falha quando o comportamento quebra** e não é coberto por outro gate. Teste que passa com a implementação apagada não protege nada. Lógica pura que ainda mora em `src/` migra para o package dono.

Não testar: render puro de componente sem lógica, helper de formatação trivialmente derivado, código gerado.

## Medição

- `npm run test:domain` deve ficar < 30s em máquina de dev.
- Testes `src` que ultrapassarem 5s devem ser revisados para isolamento.
- Flaky recorrente → marcar com `// shortcut: teste de tempo, remover quando X` e abrir débito.

## Gate

`verify:fast` já usa `test:ci`. Manter `test:domain` como gate rápido local. Testes completos só no CI/noturno.

## Continuidade

O padrão vale para teste novo e para teste revisado. A rodada de 2026-10-23 cortou render-only, duplicatas e moveu domínio; o que sobra exige julgamento, não corte em bloco.

**Antes de cortar:** rode a classe (`npm run test:domain` ou `npm run test:ui`). Corte sem execução verde não entra — o teste pode ser a única prova de uma borda.

**Pendências registradas:**

1. **Verificação verde** de `test:domain`, `test:ui` e `test:apps` (T2.11 do `tasks/todo-test-reduction.md`). Este checkout não tem `node_modules`; rode `npm ci` antes.
2. **Mover** `collections`, `dataClient`, `exportImport` (T3.10) — bloqueados por imports de `src/` (`@/data/empty`, `persistentData`). Precisa desacoplar antes.
3. **Revisar, não cortar em bloco**, os candidatos `ProfileHero`, `ProgressPulse`, `JourneyRail` e `TccView`: inspeção de 2026-10-23 mostrou testes de comportamento (h1, navegação, aria, escrita), não render puro.
4. **FSRS/review, calendarAggregator/schedule, courseRepertorio/repertorioOptions** foram inspecionados: cobrem comportamentos distintos, não são duplicatas. Não mesclar sem provar sobreposição.

**Melhoria candidata (não feita):** trocar os `--exclude` por projetos do Vitest (`test.projects`) com `domain` em `environment: 'node'`, o que barra jsdom no domínio por configuração e dispensa a lista de exclusão. Só entra com a suíte verde.

---

## Redução aplicada em 2026-10-23

Auditoria completa dos 150 testes de `src/` (e dos 5 de `packages/`) com subagentes. Resultado:

- **Render-only removidos/consolidados**: 11 arquivos (dither-charts, PillGroup, ColorSwatchPicker, Modal, CatalogMultiSelect, Picker, TagList, ToggleRow, ContextualBottomBar, PillGroupMulti, PerfilView).
- **Parametrização**: PerfilView (3 → 1 `it.each`), JourneyHistory (2 → 1 `it.each`).
- **Migração para `packages/*`**: 11 arquivos (canonicalJson, canonicalHash, focusTimer, stamp, pairing, provider, github, schema, migration20 + dateBR/internshipCases deletados como duplicata).
- **Dedupe**: use-cases.test.ts (2 testes duplicados de `packages/domain/invariants.test.ts`).
- **Drift corrigido**: ProfilePage.test.tsx (h2 "backup em nuvem" adicionado à lista de ordem fixa).

Contagens após a rodada: `src/` = 152 files / 1731 tests; `packages/` = 14 files / 367 tests. Gates: `npm run lint` ✅, `check-boundaries` ✅, `vitest run src` ✅, `vitest run packages` ✅.

**O que foi deixado de fora**: e2e real e testes de performance de bundle não entram aqui; permanecem em spec-performance. Mover `collections`, `dataClient`, `exportImport`, `quizPlayState`, `quizStack`, `routing` ainda está bloqueado por imports de `src/` (tipos, `emptyDatabase`, `persistentData`) — candidatos da próxima rodada.
