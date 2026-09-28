# Implementation Plan: Correção da virada de semestre (SPEC-006)

> Spec: [`docs/specs/SPEC-006-correcao-virada-de-semestre.md`](../docs/specs/SPEC-006-correcao-virada-de-semestre.md)
> Tasks: [`tasks/todo-periodo-letivo-correcao.md`](./todo-periodo-letivo-correcao.md)
> Corrige: [`docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md`](../docs/specs/SPEC-005-periodo-letivo-e-progressao-de-semestre.md) · [`tasks/todo-periodo-letivo.md`](./todo-periodo-letivo.md)
> Criado: 2026-09-28

## Overview

SPEC-005 entregou a entidade `AcademicTerm` e o assistente de virada de semestre, mas
a implementação está **quebrada no caminho que a usuária usa**: o `ordinal` do período
ativo é escrito **uma vez** (no boot, a partir de `profile.semester`) e nunca mais, o
input "semestre atual" do Perfil grava um campo morto, o wizard promete um "desfazer"
que não existe, o CTA de "primeiro semestre" abre uma tela travada, e um curso de 10
semestres é tratado como se fossem 8.

O **modelo de domínio está certo** e é mantido (`AcademicTerm`, escopo por herança,
resumo congelado, transições monotônicas). A correção é da **superfície**: onde os
números vivem, quem os escreve, e se dá para voltar atrás.

**18 bugs confirmados** (8 vermelhos), 11 decisões de design, 8 fases.

## Architecture Decisions

| Decisão | Rationale |
|---|---|
| **Período é a única fonte**; `profile.semester` vira campo derivado (D1) | O campo **fica no contrato** (Rust, goldens, `backupSchema.ts:24` exigem), mas sai da UI: escrito pelo app, nunca lido, nunca digitável. Mata o ping-pong de sync (§O1 da SPEC-005) sem quebrar o contrato cross-língua. |
| **5 controles, 5 lugares, sem sobreposição** (D2) | O controle nasce onde a pergunta já é feita e edita a entidade que possui o número. Table completa em §Onde nasce cada controle da spec. |
| **`retitleTerm` é transição de domínio, não update livre** (D3) | O `ordinal` dá a ordem da timeline, o `%` do curso e o teto da virada. Alterá-lo fora do domínio quebraria a invariante "o resumo congelado é do período que o ordinal nomeia" sem nenhum guard. |
| **`enforceSingleActiveTerm` sai do código morto em 3 portas** (D4) | A docstring de `term.ts:260` já promete "roda no fim do merge e depois de toda virada". Sem isso, 2 ativos são possíveis — o que **habilita** o bug de fechar o período errado. |
| **`planTermRollover` usa `resolveActiveTerm`, não `find`** (D4/B2) | O mesmo critério que a UI usa para **mostrar** o período. Com a invariante rodando, os dois coincidem sempre; sem ela, a virada encerra o período que a tela não mostra. |
| **Desfazer = estado em memória + toast com ação** (D5) | `lastRollover` fica em `useState` do provider (não persistido): desfazer é para a sessão, e um `undo` persistido divergiria entre dispositivos sem ganho. `originalTermIds` é capturado no **commit**, fechando a lacuna que fazia o undo cair no fallback `plan.closedTermId`. |
| **`reopenTerm`/`undo` **zeram** `summary` e `endedAt` (D7) | A SPEC-005 §952 já dizia isso; o código faz o contrário. A spec está certa: `TermHistoryScreen.tsx:88` renderiza o `summary` sem checar status, então um período reativo mostraria "12 aulas · 3h de foco" num semestre **começando**. `endedAt` num `ativo` faz `shouldOfferRollover` responder `true` na hora. |
| **`totalSemesters` = 10 e é da usuária** (D8) | Psicologia no Brasil é 10 semestres. O default 8 estourava 100% no 8º e disparava o CTA "virar" **para sempre** do 8º em diante. `MIGRATIONS[19]` corrige só o caso evidentemente errado (`8` **com** ordinal > 8). |
| **`scope.grade` → `allActive`** (D9) | Não é bug no `WeekGrid` (a grade da semana **deve** incluir a disciplina avulsa) — é uma armadilha de nome. Renomear documenta; `DisciplinasGrid` e o hero passam a usar `active`. |
| **Rascunho no wizard** (D10) | A primitiva **já existe** (`useWizardDraft.ts`, padrão do `InternshipWizard`). `SemesterWizard` só não passava `draftKey`. |
| **a11y dos passos** (D11) | Fecha a task 7.5 da SPEC-005, aberta. `role="radiogroup"` no passo 2 (são escolhas, não toggles soltos). |

## Execution order (fases e checkpoints)

O grafo de dependências é linear de baixo pra cima: domínio puro (sem contrato) →
persistência/sync → aplicação → actions → primitivas de UI → controles → fechamento.
**F0** é a blindagem: os testes que pegam os bugs **antes** da correção.

```
F0 Blindagem ────────────► CP0  lint + test   (testes vermelhos de propósito)
   term.test.ts (inverter summary de reopenTerm) · termRollover.test.ts (2 ativos,
   teto do total) · schema.test.ts (MIGRATIONS 19) · termScope.test.ts (allActive)

F1 Domínio ──────────────► CP1  lint + test + boundaries
   retitleTerm · reopenTerm zerando summary/endedAt · docstring das 3 portas

F2 Persistência + sync ─► CP2  lint + test + boundaries
   SCHEMA_VERSION 19 + MIGRATIONS[19] · enforceSingleActiveTerm pós-merge · default 10

F3 Aplicação ────────────► CP3  lint + test + boundaries
   resolveActiveTerm no lugar de find · totalSemesters no teto · originalTermIds
   no plano · enforceSingleActiveTerm no fim · undo limpando summary/endedAt

F4 Actions ──────────────► CP4  lint + test
   correctTermOrdinal · reopenActiveTerm · lastRollover + undoLastRollover ·
   profile.semester derivado · assertTermIntegrity no boot · undo fora do closure

F5 Toast + confete ──────► CP5  lint + test
   Toast com action + timer 8s · OverlaysContent · DataClientProvider · term-closed

F6 UI: controles ────────► CP6  lint + test + build
   JourneyTermCard · input morto removido · reabrir período · wizard (rascunho,
   isDirty, próximo ordinal, primeiro período, openCards) · TermHistoryScreen ·
   JourneyTimeline por id · allActive · stickers/profileMeta por argumento · a11y

F7 Fechamento ───────────► CP7  lint + test + build + goldens
   SemesterWizard.test.tsx (os 8 casos que a SPEC-005 prometeu) · testes de render ·
   regerar goldens (aprovação explícita) · SPEC-005 §952 + cabeçalho · backlog
```

## Risks and Mitigations

| Risco | Impacto | Mitigação |
|---|---|---|
| `MIGRATIONS[19]` é irreversível para quem já rodou | Alto | Critério **conservador**: só corrige `totalSemesters === 8` **e** `profile.semester > 8`. Quem está legitimamente num curso de 8 e no ≤ 8 **não é tocado**. O default novo só afeta quem nunca configurou. |
| F0 deixa o repo com testes vermelhos de propósito | Médio | São invertidos na **mesma fase** (F1–F3). Se precisar parar no meio, F0+F1 fecham juntos — `term.test.ts` é o único arquivo, e sua inversão faz sentido junto com `reopenTerm`. |
| F6 tem o maior churn de UI (Perfil + wizard + histórico) | Médio | Vai por partes, gate verde entre elas, e **nunca** mistura com F1–F4 (onde está a lógica). Cada parte é um slice vertical testável. |
| Remover `bestStreak` do `TermSummary` diverge do Rust | Médio | Nenhum crate é tocado. O `cecistudy-domain` Rust ainda tem o campo — registrado como tarefa do breakdown Rust, junto com a paridade do `retitleTerm`. `ci.yml` não roda `cargo`. |
| Inverter o teste de `reopenTerm` contradiz o docstring atual | Baixo | O docstring e a SPEC-005 §952 mudam **junto** na F1, com o raciocínio (D7) escrito. |
| `enforceSingleActiveTerm` pós-merge degrada um `ativo` para `encerrado` sem `summary` | Médio | É o comportamento já documentado (`term.ts:258-260`, "não é tombstone, para que possa voltar a convergir"). O card do histórico mostra "aguardando" quando não há `summary` — comportamento já existente. |
| Goldens TS divergentes | Médio | Regerar com aprovação **explícita** da usuária (o gate que o mobile consome), depois rodar em modo verify. |

## Parallelization Opportunities

- **Seguro em paralelo:** F0 (testes) e a doc de F7 são independentes do código.
- **Sequencial obrigatório:** F1 → F2 → F3 → F4. Cada uma muda a assinatura ou a
  forma que a seguinte consome. Reordenar quebra a cadeia de tipos.
- **Coordenação:** F5 (Toast) precisa da assinatura de `undoLastRollover` que F4
  entrega — mas o `Toast` em si é aditivo e pode ser escrito em paralelo com F4.
- **F6 é o ponto de maior paralelização** (Perfil / wizard / histórico são disjuntos),
  mas o gate verde entre as partes é obrigatório.

## Definition of Done (task-level)

Toda task é concluída quando:

1. `npm run lint` (tsc) verde.
2. `npm run test` verde (**baseline: 95 arquivos / 945 testes**).
3. `node .github/scripts/check-boundaries.mjs` verde (quando toca `packages/*`).
4. Critérios de aceite da task conferidos no teste correspondente.
5. Sem corrupção de encoding (nenhum `�`) nos arquivos tocados.
6. Nenhum `profile.semester` lido em componente de UI (D1).
