# Plano: Voz do cecinho — fonte única de linguagem do produto (SPEC-018)

> Spec-fonte do grupo: [`../../docs/specs/comum/SPEC-C-014-voz-do-cecinho-contrato-de-linguagem.md`](../../docs/specs/comum/SPEC-C-014-voz-do-cecinho-contrato-de-linguagem.md)
> Spec de implementação: [`../../docs/specs/mobile/SPEC-M-018-voz-do-cecinho-no-mobile.md`](../../docs/specs/mobile/SPEC-M-018-voz-do-cecinho-no-mobile.md)
> Tasks: [`./todo-voz-do-cecinho.md`](./todo-voz-do-cecinho.md)
> **Escopo: só o mobile (React/TS).** Nenhum crate Rust, nenhum outro app.
> `SCHEMA_VERSION` **não muda** a fase inteira: nenhuma assinatura altera dado
> persistido. `contracts/` intocado.

## Objetivo em uma frase

O app fala hoje como **sistema** ("não consegui preparar o quiz", "Sem prazos à
frente") em 1184 linhas espalhadas por 150 arquivos; esta entrega faz o **cecinho**
falar em 1ª pessoa, a partir de **um arquivo**, com **gate** que impede a voz de
voltar a se espalhar.

## Causa de raiz (1 frase)

A voz **não tem dono mecânico**: `src/lib/copy.ts` se declara fonte única e tem
**6 dos 8 exports órfãos**, existem **3 motores de frase** independentes, e **nenhuma
regra de gate** toca texto — logo nenhuma decisão de voz sobrevive à próxima
feature.

## Ordem das fases e por quê nesta ordem

| fase | o quê | por que aqui | tamanho |
|---|---|---|---|
| **F0** | Contrato: `voice.ts` com tipos, `VOZ`, `comNome`, listas de permissão | dado puro e testável sem React; os invariantes de `D3`/`D8` nascem aqui | **S** |
| **F1** | `ERRO` real + `useVoz()` + `ErrorBoundary` e o `alert` | as 2 telas sem voz são as de pior momento — primeiro caso de uso completo, do erro ao render | **S** |
| **F2** | `packages/*` devolve dado neutro (4 assinaturas) | `I4` a zero; tira 37 linhas de voz da camada pura. Isolada porque é o passo de maior risco | **M** |
| **F3** | Motor único: `tips.ts` sai, `homeMeta.ts` perde as frases | 3 motores viram 1; é o que faz a voz auditar de uma vez | **M** |
| **F4** | **Regra 4 do gate** + allowlist contada + fixture que reprova | **antes** da migração, de propósito: sem gate, F5 é lista de boas intenções | **M** |
| **F5** | Migração da camada 1 por módulo | 6 módulos, gate verde entre eles; allowlist cai a cada passo | **L** |
| **F6** | Teste por chave (não por palavra); `copy.ts` e `captureCopy.ts` saem | 566 linhas de teste assertam texto — só depois de a voz estar no lugar | **M** |
| **F7** | `.context/copy-and-voice.md` vira espelho | fecha o documento contra o código | **S** |

**F0 e F1 são o mesmo caminho feito duas vezes**: F0 cria a estrutura, F1 prova que
ela serve. **F2 é a mais arriscada e fica sozinha.** **F4 antes de F5 é a decisão mais
importante do plano** — inverte a ordem "natural" porque um gate escrito depois da
migração não tem quem o cumpra.

## Desvio do plano que a leitura do código impôs

A `SPEC-M-018` D13 diz que `homeMeta.ts` **sai**. O código mostra que ele também
guarda `DUE_STYLES`, `ATTENTION_LIMIT` e `formatDueLabel` — que **não são voz**, são
apresentação de card (classe CSS, limite de lista, rótulo de prazo). Destruir o
arquivo por causa disso seria o gateacusando o código certo.

**Correção aplicada na spec:** `homeMeta.ts` **fica**, e perde só os motores de frase
(`getGreeting`, `NO_PENDING`, `EXAMS_ONLY`, `TASKS_ONLY`, `MIXED`, `pickForDay`). Ele
passa a ser o arquivo de apresentação dos cards de pendência, e recebe
`WEEK_CELL_STYLE` (que hoje morre com `copy.ts`) por ser a mesma coisa: mapa de classe
de card compartilhado entre Home e Estudos. `voice.ts` fica com **voz e nada mais**.

## Decisões que atravessam as fases

| id | decisão | onde nasce |
|---|---|---|
| D1 | uma voz só, em 1ª pessoa do cecinho | F0 |
| D2 | o cecinho não se nomeia dentro da frase | F0 |
| D3 | `cecinho` registro, `ceço` só em afeto | F0 |
| D4 | `cantinho` é metáfora do mobile, nunca nome | F0 |
| D5 | erro tem duas frases: o que houve, o que ela faz | F1 |
| D6 | domínio devolve dado neutro; dado persistido **não** é voz | F2 |
| D7 | um motor de dica, variante por contexto, `Clock` injetado | F3 |
| D8 | nome opcional, é dado, e **pode** ir para notificação | F1 |
| D9 | migração por camada; só a camada 1 é gated | F4 |
| D10 | gate por categoria, nunca por acento | F4 |
| D11 | teste por chave, não por palavra | F6 |
| D12 | chave sem consumidor reprova | F4 |
| D13 | `voice.ts` é dono único; `copy.ts`/`tips.ts`/`captureCopy.ts` saem | F3, F6 |
| D14 | `voice.ts` é puro; `useVoz()` amarra o perfil | F1 |
| D15 | regra **4** do `check-boundaries.mjs`, com fixture | F4 |
| D16 | gate acusa categoria, não acento | F4 |
| D17 | 4 assinaturas neutras em `packages/*` | F2 |
| D18 | `useVoz()`; notificação resolve o nome no agendamento | F1, F5 |
| D19 | `ErrorBoundary` e o `window.alert` entram na camada 1 | F1 |
| D20 | `.context/copy-and-voice.md` vira espelho | F7 |

## Verificação (rodar depois de cada fase, não só no fim)

```bash
npm run lint                                # tsc --noEmit
npm run test                                # vitest (gate do mobile)
node .github/scripts/check-boundaries.mjs   # regras 1..4 a partir de F4
npm run build
```

`git diff --stat contracts/` tem que estar **vazio** ao final de cada fase.

A partir de F4:

```bash
node -e "const a=require('./.github/scripts/voice-allowlist.json');\
console.log(a.entradas.length,'entradas;',a.linhas,'linhas')"
```

O número de `linhas` **precisa cair** fase a fase. É a métrica que prova que a
migração está acabando, e a que impede a allowlist de virar licença permanente.

## Riscos

- **F2 é o passo de maior risco**: muda assinatura em `packages/*` e os testes
  puros passam de `toBe('tudo preenchido')` para `toEqual({...})`. Fica isolada, sem
  UI, e `npm run verify` fecha a fase.
- **Gate que acusa código certo é desligado na primeira semana.** Por isso D16
  (categoria, não acento) e por isso o fixture de F4 tem que **reprovar** de verdade,
  com um exemplo real de infração.
- **Reescrever tom perde informação**: D5 obriga as duas frases e `I8` verifica por
  código de erro. Tom sem informação é enfeite.
- **566 linhas de teste assertam a palavra.** Por isso F6 vem depois de F5: migrar
  texto e assertar texto ao mesmo tempo deixa a árvore vermelha sem dizer onde.
- **`ceço` vaza para erro**: `I3` é teste, não revisão.