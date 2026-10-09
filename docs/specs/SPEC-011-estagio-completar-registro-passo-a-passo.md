# SPEC-011 · Estágio: completar registro passo a passo

> Status: entregue (2026-10-07) · revisão D10–D13 entregue (2026-10-08)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §4.8 **[D]**
> Decisões: D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13
> Supersede: —
> Depende de: SPEC-009 (SPEC-M-013), SPEC-M-008 (C14), SPEC-010 (padrão de UI)
> Data: 2026-10-07

---

## 1. Contexto

A usuária cria um registro de estágio com as informações gerais — paciente (ou
"sem paciente"), horas, data — e nem sempre preenche, naquele momento, os campos de
**reflexões**, **temas**, **abordagem**, **intervenções** e **impressões clínicas**.
O card mostra badges ("reflexão ok", "sem supervisão", "discutida em intervisão"),
mas não orienta o que fazer a seguir. Ela precisa lembrar sozinha quais campos
deixou vazios e abrir o registro para editar — o app sabe o que falta e não diz.

## 2. Decisões

### D1 · O card ganha um botão contextual de "próxima ação"

- **Decisão.** Abaixo dos chips de status, em `InternshipLogCard.tsx`, um botão
  contextual mostra a próxima ação recomendada (ex.: "adicionar reflexões"). Um
  toque abre o fluxo de completar (D3). O botão só aparece em registros `done`
  (`!scheduled`) de tipo `atendimento_clinico` ou `estagio` com pelo menos uma
  pendência (D2); caso contrário, não aparece.
- **Justificativa.** A informação derivada já existe (`statusOf` em
  `packages/domain/src/core/domain/internship.ts:284-298` e
  `proximasPendenciasDePreenchimento` em `:338-350`); só falta expor. Botão
  contextual no card é o padrão de ação do app (cf. `onAddReflection`,
  `onOpenSupervision` em `InternshipLogCard.tsx:49-51`).
- **Alternativa rejeitada.** Fila de pendências na tela do diário: vira mais
  uma lista para escanear; o contexto certo é o card daquele registro.
- **Consequência aceita.** O card calcula a recomendação a cada render
  (`InternshipLogCard.tsx`) — custo trivial, registro pequeno.
  **Alterado por D10/D13:** o botão passa a valer para `estagio`,
  `atendimento_clinico`, `intervisao` e `outro`, com o chip informativo ocupando
  o lugar do chip clicável legado.

### D2 · A recomendação é derivada, nunca persistida

- **Decisão.** A função pura `proximasPendenciasDePreenchimento(log)` vive em
  `packages/domain/src/core/domain/internship.ts:338-350`, ao lado de `statusOf`.
  Nada é gravado no registro: pendência é cálculo sobre o estado atual, como o
  atraso (glossário do grupo). `reflexoes` vale para `atendimento_clinico` e
  `estagio` (mesmo critério de `reflectionExpectedFor`, `:281-282`); `tema`,
  `abordagem`, `intervencoes` e `impressoes` só para `atendimento_clinico`.
- **Justificativa.** Persistir pendência cria estado para dessincronizar — o
  mesmo bug que o glossário proíbe para `overdue`.
- **Alternativa rejeitada.** Coluna/flag `pendente` no `InternshipLog`:
  dessincroniza a cada edição e exige migração de schema sem ganho.
- **Consequência aceita.** A UI recalcula a recomendação a cada render — custo
  trivial, registro pequeno.
  **Alterado por D10/D11:** os cinco campos passam a valer para quatro tipos
  (`estagio`, `atendimento_clinico`, `intervisao`, `outro`) e a pendência passa a
  excluir os campos declinados (`declinedFields`).

### D3 · O fluxo é um modal sequencial local, não uma rota

- **Decisão.** O fluxo vive em estado local do card e usa **um** `Modal` de
  `src/components/ui/Modal.tsx` com três passos de conteúdo — seleção, campos,
  confirmação — implementado em `src/components/internship/CompleteLogModal.tsx`.
  Não entra em `WizardFlow` nem em `packages/navigation`.
- **Justificativa.** É curto, ligado a um card, não cria entidade nova. O
  `docs/modais-wizards.md` reserva wizard de tela cheia para criação de entidade.
- **Alternativa rejeitada.** Reaproveitar `WizardScaffold`/`WizardFlow`: empilha
  rota, exige seed tipado novo, e o conteúdo é completar um registro existente,
  não criar um. Três `Modal`s empilhados: quebra o foco e confunde o Escape e o
  focus trap de `Modal.tsx`.
- **Consequência aceita.** O estado do fluxo morre ao fechar o modal e re-semeia
  a cada abertura (`CompleteLogModal.tsx:107-110`); não há "retomar de onde
  parou".

### D4 · Seleção de campos num modal com toggles

- **Decisão.** O primeiro passo lista os campos **pendentes** (D2) como
  `ToggleRow` (`src/components/ui/ToggleRow.tsx`), todos pré-marcados. A usuária
  ajusta e confirma com "continuar". Se desmarcar todos, o fluxo vai direto à
  confirmação (D8).
- **Justificativa.** `ToggleRow` já é o padrão de linha com título + descrição +
  toggle; reutilizar evita estilo novo. Pré-marcar a recomendação respeita a
  intenção do botão contextual.
- **Alternativa rejeitada.** Listar os cinco campos sempre (inclusive os já
  preenchidos): polui a seleção com o que não é pendência. Checkboxes grandes com
  ilustração: mais toques para o caso comum (aceitar a sugestão).
- **Consequência aceita.** A usuária pode desmarcar tudo e confirmar — fluxo
  termina direto na confirmação (D8), sem campos.
  **Alterado por D11/D12:** a seleção passa a listar os cinco campos (todos
  **ligados** por padrão), compartilhada com o wizard e **persistida** em
  `declinedFields`; desmarcar num campo vazio grava o texto automático (D12).

### D5 · Um campo por vez, em sequência, com "desisti da ideia"

- **Decisão.** Para cada campo marcado, o mesmo modal troca o conteúdo por um
  `textarea` rotulado, com indicador "campo X de Y". Acima do campo, o botão
  "desisti da ideia" pula aquele campo **sem gravar nada** e vai para o próximo.
  O botão primário "salvar e seguir" grava via caminho existente (D9) e avança;
  com texto vazio, avança sem gravar (equivalente a pular).
- **Justificativa.** Manter um modal fixo evita empilhar camadas; o conteúdo que
  "sai e entra" mantém o contexto da tarefa. "Desisti da ideia" preserva a
  autonomia da usuária sem punir a mudança de ideia.
- **Alternativa rejeitada.** Um modal por campo (instâncias novas empilhadas):
  quebra o foco, confunde o Escape e o TrapFocus de `Modal.tsx`.
- **Consequência aceita.** O estado "em qual campo estou" é local e volátil;
  fechar no meio ("agora não") descarta o que não foi salvo.

### D6 · Reflexões nunca recebe texto automático

- **Decisão.** O campo de reflexões só grava o que a usuária digitar. Nenhum
  prefill, nenhuma sugestão de texto como valor (invariante `I4` de
  `internship.ts:662`: `sanitizeLog` limpa, não fabrica).
- **Justificativa.** É invariante do domínio (SPEC-009): reflexão é da usuária,
  não do app.
- **Alternativa rejeitada.** Placeholder com exemplo de reflexão preenchido:
  vira texto que parece preenchido e pode ser salvo sem querer.
- **Consequência aceita.** Placeholder de ajuda é permitido
  (`CompleteLogModal.tsx:21`); texto de valor, não.
  **Supersede D12** no ponto do texto automático: o campo continua gravando só o
  que a usuária digitar — ou o texto automático do `TEXTO_NAO_RESPONDER` que a
  própria usuária pediu ao desligar o switch (ação explícita, nunca do
  `sanitizeLog`).

### D7 · Supervisão tem botão contextual próprio, fluxo à parte

- **Decisão.** Quando `statusOf` indicar "sem supervisão" em um registro
  `atendimento_clinico` `done`, o card mostra um segundo botão contextual
  ("adicionar supervisão") que abre o fluxo atual de supervisão:
  `openWizard('internship', { kind: 'supervisao', discussedLogIds: [log.id] })`
  (`InternshipLogCard.tsx:234-244`) — o wizard com o vínculo pré-semeado. A
  supervisão **não** entra no modal de toggles da D4.
- **Justificativa.** Supervisão é vínculo derivado de registro (via
  `discussedLogIds`, `internship.ts:112`; `buildLinkIndex`, `:244-267`), não um
  campo de texto do log. Misturá-la como toggle quebraria a fonte única do vínculo.
- **Alternativa rejeitada.** Tratar supervisão como mais um campo no modal:
  grava no lugar errado e duplica o vínculo.
- **Consequência aceita.** O fluxo de supervisão continua o de hoje; a revisão
  dele fica para fase posterior — esta spec só entrega o botão contextual.

### D8 · Tela final de confirmação e parabéns

- **Decisão.** Depois do último campo, o modal mostra um conteúdo de confirmação:
  mascote `celebrate-small` (`CompleteLogModal.tsx:225`), título "tudo anotado ♡",
  resumo do que foi preenchido (ou "nada mudou por aqui — tudo certo ♡" quando
  nada foi gravado), botão "concluir". Nada é gravado nessa tela.
- **Justificativa.** Fecha o ciclo com reforço positivo e sem risco de escrita
  acidental.
- **Alternativa rejeitada.** Toast apenas (`src/components/ui/Toast.tsx`):
  some rápido e não marca o fim de um fluxo multi-etapa.
- **Consequência aceita.** Mais uma tela no modal — aceitável porque é a última.

### D9 · Gravação pelo caminho existente, sem mudança de schema/sync

- **Decisão.** Cada "salvar e seguir" chama o mesmo `handleSaveInternshipLog`
  do provider (`src/context/dataActions.ts:570-577`, `planSave`/`sanitizeLog`,
  `internship.ts:718-725`/`:656-709`). Os cinco campos já existem em
  `InternshipLog` (`internship.ts:71,82,84,86,88`). Não há bump de
  `SCHEMA_VERSION` nem mudança em `packages/sync` (`stamp.ts:25` já cobre
  `internshipLogs`).
- **Justificativa.** O dado já existe; só falta uma porta de entrada melhor.
- **Alternativa rejeitada.** Novo endpoint/comando de "completar parcial":
  duplica a regra de `planSave`.
- **Consequência aceita.** O modal respeita as mesmas invariantes de save —
  testes existentes de `planSave` cobrem o caminho. **A régua C14 permanece
  aberta:** os campos clínicos já estão no envelope de sync
  (`collections.ts:106`, `syncable: true`; `backupSchema.ts:124`,
  `passthrough`) — esta spec não muda isso; a correção é de `SPEC-M-008`/
  `SPEC-C-008`.

### D10 · Os cinco campos de referência valem para quatro tipos

- **Decisão.** `camposDeReferencia(type)` devolve os cinco campos (`reflexoes`,
  `tema`, `abordagem`, `intervencoes`, `impressoes`) para `estagio`,
  `atendimento_clinico`, `intervisao` e `outro` — e **vazio** para `supervisao`.
  A mesma escolha vale no wizard, no modal e no card. `reflexoes` deixa de ser
  "só clínico e estágio".
- **Justificativa.** A usuária declarou que todo tipo que já tem os campos no
  app deve apresentá-los; supervisão é vínculo (D7), não campo.
- **Alternativa rejeitada.** Manter o critério de `reflectionExpectedFor`
  (SPEC-009) para `reflexoes`: esconde campos que o wizard de intervisão/outro
  já coleta e cria dois critérios concorrentes.
- **Consequência aceita.** `reflectionExpectedFor`/`computePendencies` (nível de
  **caso**, pendência agregada) ficam intocados; "reflexão esperada do caso" e
  "campos de referência do registro" são leituras diferentes. Intervisão passa a
  ter botão de completar e chip próprios.

### D11 · A escolha de campos é persistida como `declinedFields`, sem bump de schema

- **Decisão.** `InternshipLog` ganha `declinedFields?: CampoPendencia[]` — os
  campos que a usuária declarou que **não** vai responder. Ausência = todos os
  cinco ativos. É a fonte da escolha compartilhada entre wizard e modal
  (switches começam todos **ligados**), aplicada por `comDeclinados(log,
  declinados)` — função pura — antes de todo save. **Sem bump de
  `SCHEMA_VERSION`** (permanece 21): campo opcional segue o precedente das
  migrações 4 e 8 (campos novos do `InternshipLog` não precisam de backfill), o
  `backupSchema.internshipLogSchema` é `passthrough`, e um bump forçaria
  regenerar goldens em `cecistudy-rust/contracts/` — fora do contrato da
  ADR-009.
- **Justificativa.** Sem persistência, a escolha morre ao fechar o modal e o
  wizard desmente o card.
- **Alternativa rejeitada.** (a) Derivar o declínio do texto automático presente:
  o texto é derivado, não deve carregar estado. (b) Bump + migração + backfill:
  ruído para campo opcional e quebra o gate de goldens.
- **Consequência aceita.** `sanitizeLog` **limpa** a lista (só campos
  aplicáveis; nunca em `supervisao`) e nunca a cria sozinho.

### D12 · "Não vou responder" grava um texto automático — ação explícita, e só essa

- **Decisão.** Desligar o switch de um campo **vazio** grava o auto-texto de
  `TEXTO_NAO_RESPONDER` ("não precisou escrever as reflexões", "não precisou
  listar o tema", "não precisou escolher a abordagem", "não precisou listar as
  intervenções", "não precisou listar motivos sobre"). Religar **apaga** o
  auto-texto quando o campo contém exatamente ele; campo com conteúdo próprio e
  desligado mantém o conteúdo (oculto no card). O auto-texto é escrito pelo
  `comDeclinados` (ação explícita da usuária), **nunca** pelo `sanitizeLog`, que
  continua "limpa, não fabrica".
- **Supersede D6 (desta spec) e I4 (SPEC-009)** no ponto do texto automático: o
  campo só grava o que a usuária digitar **ou** o auto-texto que a própria
  usuária pediu ao desligar o switch. `reflectionExpectedFor` não muda: campo
  declinado continua sendo "reflexão esperada não feita" no nível do caso.
- **Alternativa rejeitada.** Ocultar o campo sem gravar nada: o chip continuaria
  cobrando e um backup perderia a intenção. Gravar `null`: mesma quebra de chip.
- **Consequência aceita.** Uma reflexão pode conter texto do app — só porque a
  usuária pediu explicitamente; protegido por teste (o `sanitizeLog` nunca
  escreve esse texto sozinho).

### D13 · O chip é informativo e o card mostra os campos marcados, vazios inclusive

- **Decisão.** O chip de preenchimento (`estagio`/`atendimento_clinico`/
  `intervisao`/`outro`, quando `!scheduled`) é **informativo** — sem clique.
  `statusPreenchimento(log)`: "tudo preenchido" (`success`) quando nenhum dos
  cinco está vazio; "falta [nome]" quando falta 1; "ainda falta preencher
  [dois/três/quatro/cinco]" quando faltam de 2 a 5 (numeral por extenso). Quem
  abre o modal é o botão contextual (D1). No expandido, os campos **marcados**
  aparecem mesmo vazios (com placeholder de texto); os declinados ficam ocultos.
- **Justificativa.** Um chip com ação dupla (abrir o modal) misturava status com
  ação; agora status é uma coisa só e a ação é o botão contextual.
- **Alternativa rejeitada.** Manter o chip clicável legado: o papel de "ação" já
  está no botão contextual. Contar declinados como "ok": esconderia a tela ativa
  do caso.
- **Consequência aceita.** O chip de reflexão antigo ("reflexão ok"/"sem
  reflexão · adicionar") sai; o cálculo passa a olhar os cinco campos.

## 3. Escopo

| Item | Tipo | Estado |
|---|---|---|
| `proximasPendenciasDePreenchimento(log)` + `CampoPendencia` em `packages/domain` | código · regra pura | entregue (`internship.ts`) |
| `camposDeReferencia`, `declinadosDe`, `comDeclinados`, `statusPreenchimento`, `TEXTO_NAO_RESPONDER`, rótulos/descrições (D10–D13) | código · regra pura | entregue (`packages/domain/src/core/domain/internship.ts`) |
| `InternshipLog.declinedFields` (sem bump de schema) | código · tipo | entregue (`internship.ts`) |
| Reexports no stub de compat | código | entregue (`src/lib/internshipCases.ts`) |
| Testes das funções puras (D10–D13) | teste | entregue (`__tests__/internship.test.ts`) |
| Botão contextual de próxima ação no `InternshipLogCard` | UI | entregue (`InternshipLogCard.tsx`) |
| Botão contextual de supervisão no `InternshipLogCard` | UI | entregue (`InternshipLogCard.tsx`) |
| Chip informativo de preenchimento (D13) | UI | entregue (`InternshipLogCard.tsx`, `statusPreenchimento`) |
| Campos de referência no expandido, declinados ocultos (D13) | UI | entregue (`InternshipLogCard.tsx`) |
| `CompleteLogModal` (seleção → campos → confirmação), com escolha persistida | UI | entregue (`src/components/internship/CompleteLogModal.tsx`) |
| Passo de switches no wizard (D10/D11) | UI | entregue (`src/components/wizards/InternshipWizard.tsx`) |
| Testes de UI do `CompleteLogModal` e do card | teste | entregue (30: 13 no modal + 17 no card, 2026-10-08) |
| Gates: lint, test, boundaries | gate | entregue (lint 0; test 1288 em 117 arquivos em 2026-10-08) |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Fluxo de supervisão revisado | D7: botão contextual apenas; revisão posterior |
| Novo campo ou migração de schema | D9: campos já existem |
| Rota/wizard em `packages/navigation` | D3: modal local |
| Sugestão de texto para reflexões | D6 + invariante `I4` |
| Correção do sync da camada clínica (C14) | `SPEC-M-008`/`SPEC-C-008`; esta spec não altera o envelope |
| Desktop | domínio da SPEC-D-xxx; a regra derivada é portável depois, espelhada |

## 5. Contrato

- **Assinaturas** em `packages/domain/src/core/domain/internship.ts`:
  - `camposDeReferencia(type): CampoPendencia[]` (`:389-390`) — os cinco
    (`reflexoes`, `tema`, `abordagem`, `intervencoes`, `impressoes`) para
    `estagio`, `atendimento_clinico`, `intervisao`, `outro`; `[]` para
    `supervisao` (D10).
  - `proximasPendenciasDePreenchimento(log): CampoPendencia[]` (`:457`) —
    campos preenchíveis **não declinados** com `trim() === ''`, na ordem
    canônica (D2/D11).
  - `comDeclinados(log, declinados): InternshipLog` (`:410-433`) — aplica a
    escolha e grava os auto-textos de `TEXTO_NAO_RESPONDER` (`:378`) nos campos
    vazios desligados; religa limpa o auto-texto; supervisão sempre retorna sem
    `declinedFields` (D12).
  - `statusPreenchimento(log): { tone: 'success' | 'warning'; label: string } | null` (`:434-445`) — `null` em supervisão; "tudo preenchido", "falta [nome]" ou "ainda falta preencher [dois..cinco]" (D13).
  - `valorCampoReferencia(log, campo): string` (`:393-395`) e `declinadosDe(log)` (`:397-399`) — leituras para o card.
- **Dado persistido:** `InternshipLog.declinedFields?: CampoPendencia[]` (`:95`),
  ausência = todos os cinco ativos.
- **Invariante:** a lista de pendências é exatamente os campos preenchíveis não
  declinados vazios, na ordem canônica; funções puras, sem relógio, sem I/O.
- **Quem consome:** `InternshipLogCard` (chip, campos do expandido e rótulo do
  botão), `CompleteLogModal` (switches e fila), `InternshipWizard` (passo de
  switches).

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | Pendência nunca é persistida; é derivada do registro atual | `proximasPendenciasDePreenchimento` (`internship.ts:457`) | `__tests__/internship.test.ts` |
| I2 | Reflexões só gravam texto da usuária **ou** o auto-texto pedido por switch (D12) | `sanitizeLog` limpa, `comDeclinados` fabrica (D12) | testes de `sanitizeLog` + `comDeclinados` |
| I3 | "Desisti da ideia" não grava nada | `CompleteLogModal.tsx` (`pula`) | `CompleteLogModal.test.tsx` (pular todos sem chamar `onSave`) |
| I4 | Supervisão não é campo do modal de toggles; nunca leva `declinedFields` | `camposDeReferencia` + `comDeclinados` (D10/D11) | teste de `camposDeReferencia` + revisão |
| I5 | `declinedFields` é limpo no `sanitizeLog` (só campos aplicáveis; nunca em supervisão) e ausência = todos ativos | `sanitizeLog` (`internship.ts:814-816`) | teste de `sanitizeLog` |
| I6 | O chip é informativo; declarado == oculto no card | `statusPreenchimento` + `declinadosDe` no card (D13) | `InternshipLogCard.test.tsx` |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Todos os campos preenchidos | chip "tudo preenchido"; botão contextual não aparece |
| Registro agendado (data futura) | nem chip, nem botão — só `done` completa (`!scheduled`) |
| Nenhum campo preenchido | 5 toggles ligados; chip "ainda falta preencher cinco"; "adicionar reflexões" |
| Só falta um campo | chip "falta [nome]"; botão "adicionar [nome]" |
| Usuária desmarca tudo e continua | grava os 5 auto-textos (D12) e vai direto à confirmação (D8) |
| Desligar campo já preenchido | auto-texto **não** sobrescreve; conteúdo próprio é mantido e oculto no card |
| Religar campo declinado vazio | limpa o auto-texto e volta à fila |
| Texto só espaços no campo | "salvar e seguir" avança sem gravar (`texto.trim()` vazio) |
| Fechar o modal no meio ("agora não") | nada é gravado; a fila e os switches não persistidos são descartados |
| Registro de tipo `estagio`/`intervisao`/`outro` | mesmos 5 campos de `atendimento_clinico` (D10); intervisão/outro ganham chip e botão |
| Registro de supervisão | sem chip, sem botão, sem switches (I4) |
| `declinedFields` com campo inexistente/duplicado | limpo pela ordem canônica no save (`sanitizeLog`); leituras filtram (I5) |

## 8. Critérios de aceite

- [x] `npm run lint` sai com 0 (2026-10-08)
- [x] `npm run test` sai com 0 — 1288 testes em 117 arquivos (2026-10-08)
- [x] `camposDeReferencia` restringe por tipo (4 tipos × 5 campos; supervisão = `[]`) — `__tests__/internship.test.ts`
- [x] `comDeclinados` grava auto-texto em campo vazio desligado, limpa ao religar, preserva conteúdo próprio — `__tests__/internship.test.ts` (D12)
- [x] pendências excluem campos declinados — `__tests__/internship.test.ts` (D11)
- [x] chip informativo por estado; declinado oculto; campos vazios marcados visíveis — `src/components/__tests__/InternshipLogCard.test.tsx` (D13, 2026-10-08)
- [x] switches começam ligados, declinar grava auto-texto, religar limpa, "agora não" descarta — `src/components/internship/__tests__/CompleteLogModal.test.tsx` (2026-10-08)
- [x] card sem pendência não mostra o botão — `src/components/__tests__/InternshipLogCard.test.tsx` (2026-10-08)
- [x] "desisti da ideia" não altera o registro — caso "pular todos os campos chega na confirmação sem chamar onSave" (2026-10-08)

Os critérios de UI acima foram fechados em 2026-10-08 com 30 testes (13 no
modal, 17 no card), no padrão de `InternshipCaseDetail.test.tsx`. Cada critério
foi verificado quebrando a regra de propósito e vendo o gate falhar: `pularCampo`
gravando (2 falhas), `podeCompletar` sem `pendencias.length > 0` (2 falhas) e o
tema declinado vazando na linha de meta do card (1 falha, corrigida ocultando o
campo na `metaLineFor`).

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Pendências de preenchimento por registro | contagem de campos vazios nos logs existentes | — | — | cálculo manual trimestral |
| Registros com reflexões preenchidas | proporção de logs com `reflections` não vazio | — | subir | verificação manual |
| Testes da suíte | `npm run test` | 1261 (2026-10-08, antes da revisão D10–D13) | 1288 (2026-10-08) | `npm run test` |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Modal interromper fluxo de edição existente | baixa | médio | mantido o botão "editar" do card; fluxo novo é aditivo |
| Campo clínico vazado por sync | baixa | alto | C14 aberto: correção é `SPEC-M-008`/`SPEC-C-008`, não esta spec |
| Usuária confundir "desisti da ideia" com cancelar tudo | média | baixo | copy explícita: "pular este campo" como `aria-label`; "agora não" fecha o modal |
| Testes de UI do modal não cobrirem o fluxo | média | médio | fechado em 2026-10-08: 30 testes de UI (13 modal + 17 card), §8 |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|---|
| D1 | `InternshipLogCard.tsx` (botão contextual) | `InternshipLogCard.test.tsx` | `npm run test` |
| D2 | `proximasPendenciasDePreenchimento` (`internship.ts:457`) | `internship.test.ts` (pendentes excluem declinados) | `npm run test` |
| D3 | `CompleteLogModal.tsx` (um `Modal`, 3 passos) | `InternshipLogCard.test.tsx` (abre o modal) | `npm run test` |
| D4/D11 | `CompleteLogModal.tsx` (switches ligados + `declinedFields`) · wizard (`camposStep`) | `CompleteLogModal.test.tsx` (5 ligados; persistência) | `npm run test` |
| D5 | `CompleteLogModal.tsx` (campo por vez + "desisti da ideia") | `CompleteLogModal.test.tsx` (I3) | `npm run test` |
| D6/D12 | `comDeclinados` (`internship.ts:410-433`) + `sanitizeLog` | testes de `comDeclinados`/`sanitizeLog` | `npm run test` |
| D7 | `InternshipLogCard.tsx` (botão supervisão → wizard com vínculo) | `InternshipLogCard.test.tsx` | `npm run test` |
| D8 | `CompleteLogModal.tsx` (confirmação com mascote + contagem) | `CompleteLogModal.test.tsx` (desmarca tudo → confirmação) | `npm run test` |
| D9 | `dataActions.ts` (planSave) · sem bump de schema (SCHEMA_VERSION permanece 21) | testes de `planSave` + card (salvar pelo contexto) | `npm run test` |
| D10 | `camposDeReferencia` (`internship.ts:389-390`) · wizard `camposStep` | `internship.test.ts` + card (intervisão/outro com botão) | `npm run test` |
| D13 | `statusPreenchimento` (`internship.ts:434-445`) + card (chip, campos, `metaLineFor`) | `InternshipLogCard.test.tsx` | `npm run test` |

**Espelho no outro app:** quando o desktop implementar Estágio (SPEC-D-008),
a função pura D2 e a escolha D11 se espelham — em Rust, com o mesmo contrato.

## 12. Reconciliação

Esta spec foi escrita como proposta e a implementação chegou junto — o código
existia antes da revisão final. A revisão D10–D13 (2026-10-08) foi especificada
na própria spec (decisões registradas na §2) e implementada na mesma sessão.
Item a item:

| Item da spec | Estado | Onde |
|---|---|---|
| D1 botão contextual | implementado | `InternshipLogCard.tsx` |
| D2 função pura + testes | implementado (inclui declinados) | `internship.ts`; `__tests__/internship.test.ts` |
| D3 modal sequencial local | implementado (um `Modal`, não três) | `CompleteLogModal.tsx` |
| D4/D11 toggles + persistência | implementado (5 campos ligados; `declinedFields`; sem bump de schema) | `CompleteLogModal.tsx`; `internship.ts:95` |
| D5 campo por vez + "desisti da ideia" | implementado | `CompleteLogModal.tsx` |
| D6/D12 reflexões sem prefill + auto-texto | implementado (`comDeclinados` fabrica; `sanitizeLog` limpa) | `internship.ts:410-433`; `CompleteLogModal.tsx` |
| D7 botão supervisão | implementado (abre wizard com vínculo pré-semeado) | `InternshipLogCard.tsx` |
| D8 confirmação com mascote | implementado (`celebrate-small`, contagem de "campos") | `CompleteLogModal.tsx` |
| D9 gravação via `planSave`, sem schema | implementado | `dataActions.ts` |
| D10 campos por tipo + wizard | implementado (4 tipos × 5; passo de switches) | `camposDeReferencia`; `InternshipWizard.tsx` |
| D13 chip informativo + expandido | implementado (chips; campos marcados; declinado oculto) | `statusPreenchimento`; `InternshipLogCard.tsx` |
| Testes de UI do modal e do card | fechado (2026-10-08, 30 testes) | `src/components/internship/__tests__/CompleteLogModal.test.tsx`; `src/components/__tests__/InternshipLogCard.test.tsx` |
