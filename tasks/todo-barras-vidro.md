# To-do: duas barras de vidro com sumiço (SPEC-015 / SPEC-M-019)

> Spec local: [`docs/specs/SPEC-015-barras-de-vidro-com-sumico.md`](../docs/specs/SPEC-015-barras-de-vidro-com-sumico.md)
> Spec de grupo (o contrato): [`docs/specs/mobile/SPEC-M-019-duas-barras-de-vidro-com-sumico.md`](../../docs/specs/mobile/SPEC-M-019-duas-barras-de-vidro-com-sumico.md)
> Substitui: [`todo-barra-contextual.md`](./todo-barra-contextual.md) (execução da `SPEC-M-018`, superseded)
> Decisões de produto: A5, A6, A7, A8 — todas confirmadas pela dona do produto em **2026-10-18**
> **Regra de ouro:** cada fase fecha com `npm run typecheck` + `npm run test`
> (arquivos-alvo durante o ajuste; a suíte inteira **uma vez**, no fim) +
> `node .github/scripts/check-boundaries.mjs`. `SCHEMA_VERSION` fica **22** a
> fase inteira (D10).

**Progresso: 3/4 fases — F1..F3 entregues em 2026-10-18. F4 (inspeção em
aparelho) pendente: esta máquina não tem JDK nem Xcode.**

---

## F1 — A máquina pura

- [x] **F1.1** `src/lib/chromeVisibility.ts` — reducer total `(estado, evento) => estado`.
  Constantes nomeadas: `IDLE_HIDE_MS = 3000`, `TOP_PX = 20`,
  `SCROLL_DEAD_ZONE_PX = 4`, `CHROME_FADE_IN = 0.24`, `CHROME_FADE_OUT = 0.16`.
  Ficam **aqui** e não em `src/lib/motion/tokens.ts`: `BASE_D` é o vocabulário de
  navegação e overlay, e um `chromeHide` de 160 ms competindo com um `screenExit`
  no mesmo vocabulário não seria comparável na leitura. Não quebra o ratchet —
  `noInlineTokens.test.ts` reprova `duration:` **seguido de literal**;
  `duration: CHROME_FADE_OUT` não casa.
- [x] **F1.2** `precisaDeInert(estado)` — a decisão de acessibilidade é da máquina,
  não do renderizador.
- [x] **F1.3** Estado com **quatro** campos e dois predicados de fixação:
  `preso` (menu aberto, D8) e `foco` (foco de teclado dentro, A8/J6). Invariante
  estrutural única: `preso || foco ⇒ visivel`, aplicada **na saída** de
  `chromeReducer` — nenhum caminho, nem uma entrada já inconsistente, escapa dela.
- [x] **F1.4** Testes: `src/lib/__tests__/chromeVisibility.test.ts` — **26 casos**,
  incluindo a totalidade (5 estados × 11 eventos, nenhum par lança e todo par
  devolve estado coerente). É a invariante **J14**.

**Verificação:** `npm run test -- src/lib/__tests__/chromeVisibility.test.ts` verde.

---

## F2 — O hook (listener e temporizador)

- [x] **F2.1** `src/lib/useChromeVisibility.ts` — listener `window` com
  `{ passive: true }` (o `<main>` não tem `overflow`: o scroll é do documento,
  mesmo precedente de `src/components/HeaderNav.tsx:49`) e tratamento coalescido
  por `requestAnimationFrame`: no máximo um por quadro (J9).
- [x] **F2.2** **Um** temporizador, dono do hook. É (re)criado só com a barra
  visível, fora do topo, sem menu e sem foco; cancelado em qualquer rolagem, na
  troca de tela e no unmount (J10). `montadoRef` é lido no callback — `setState`
  nunca roda depois do unmount.
- [x] **F2.3** Sob movimento reduzido o hook **ignora** `rolou` e `parou` antes de
  chegar ao reducer: as barras nunca somem (A8) e o shell para de re-renderizar a
  cada rolagem. Os eventos de foco/menu/navegação continuam alimentando a máquina.
- [x] **F2.4** Testes: `src/lib/__tests__/useChromeVisibility.test.tsx` — **24 casos**
  com `vi.useFakeTimers` e `rAF` stubado: J5, J6, J9, J10, a zona morta, o
  cancelamento do timer por rolagem e o ciclo de vida.

**Verificação:** `npm run test -- src/lib/__tests__/useChromeVisibility.test.tsx` verde.

---

## F3 — O renderizador duplo e a substituição da barra única

- [x] **F3.1** `src/components/ui/ContextualBars.tsx` — duas barras **irmãs** no
  mesmo contêiner `fixed`: `[ ← voltar ]` (`shrink-0`, com seta e
  **texto**) e `[ ⋯ | cápsula ]` (`flex-1 min-w-0`, a que encolhe e trunca), com
  `gap-2`. `⋯` só existe quando há ação secundária.
- [x] **F3.2** Só `opacity` anima no wrapper (D3): um `transform` ali viraria
  containing block do `fixed` interno — bug já documentado em
  `src/shells/MobileAppShell.tsx:292-296`.
- [x] **F3.3** `inert` quando oculta (D2), derivado de `precisaDeInert`. As duas
  barras compartilham **um** estado (D11) — um único `data-visivel` no DOM.
- [x] **F3.4** Foco: `onFocus`/`onBlur` no contêiner; o `blur` só conta como saída
  quando `relatedTarget` está fora. Avisa a máquina por `onFocusChange` (J6).
- [x] **F3.5** `src/components/ui/ContextualBar.tsx` **removido** (a barra única
  não tem mais contrato). O menu permanece: `ContextualBarMenu.tsx`, agora com a
  barra **presa** enquanto aberto (D8).
- [x] **F3.6** O recognizer sai do caminho da barra (A7). `src/lib/useLongPress.ts`
  continua existindo com os **quatro** consumidores que já tinha.
- [x] **F3.7** `src/shells/MobileAppShell.tsx` — `useChromeVisibility({ reduced:
  profile.reduced })`, aviso de navegação por troca de `kind` da tela no topo da
  pilha, e as quatro propriedades passadas ao renderizador.
- [x] **F3.8** Teste adaptado e ampliado:
  `src/components/ui/__tests__/ContextualBarsReal.test.tsx` — **45 casos**. Ele
  monta as telas a partir do `headerConfig` **real** (o gate que pega "a barra
  existe, passa no sintético e não aparece em tela nenhuma") e cobre J2, J6, J7,
  J8, J12, J13, a ordem das duas barras, a centralização, o `h-14` das duas e o
  texto de prosa que já vazou uma vez (ver abaixo).

**Verificação:** `npm run test` verde; `node .github/scripts/check-boundaries.mjs`
→ `OK: fronteiras respeitadas.`

---

## F5 — A9: o par volta ao centro (2026-10-18)

- [x] **F5.1** O contêiner do par passou de `justify-end` para **`justify-center`**.

> **Decidido pela dona do produto:** *"agora pode voltar pro meio, deixar de ser
> preso na ponta."* Fecha o A9 da `SPEC-M-019`. O ancoramento à direita existia
> desde a 018/A4 por causa do pressionar-e-seguir — e ele **saiu** (A7), então o
> motivo que sustentava a ponta deixou de existir. O que A4 realmente procurava
> era alvo estável, e o centro também dá isso, com melhor leitura.
- [x] **F5.2** Gate invertido em `ContextualBarsReal.test.tsx`: em vez de afirmar
  `justify-end` e negar `justify-center`, afirma o contrário. Sem essa inversão, o
  teste continuaria verde com a barra no lugar errado — é o defeito que um gate
  mal escrito produz.

**Verificação:** `npm run typecheck` 0 · `npm run test` verde ·
`node .github/scripts/check-boundaries.mjs` OK.

---

## F4 — Pendente (depende de aparelho)

- [ ] **F4.1** Inspeção em **aparelho físico**, iOS **e** Android, com as seis
  linhas da `SPEC-M-019` §15: sumiço ao rolar e volta ao subir; barra de voltar
  **parada** no mesmo ponto; 3 s parada não atrapalha leitura longa;
  `font-scale` 200% em tela estreita sem quebrar o layout; sem piscar em rolagem
  lenta; com leitor de tela e foco na barra, ela **não** some.
- [ ] **F4.2** Medir **renderizações por rolagem** em desenvolvimento, em
  aparelho: `flushDevMetrics` de `src/lib/performance/perfMarks.ts` (o número vai
  **aqui**, não na spec — em produção o `perfMarks` devolve `null`).

> **Não reportar "verificado em aparelho" sem ter rodado.** Esta máquina compila
> web e mobile; não instala em aparelho.

---

## Bugs que os gates acharam (registro, para não voltarem)

Todos foram encontrados **pelos testes escritos aqui**, não em revisão de leitura:

| # | Onde | O que era |
|---|---|---|
| 1 | `chromeVisibility.ts` | Rolar para baixo **ignorava** `preso` e podia esconder a barra com o menu aberto — o painel ficaria boiando sem barra embaixo. Pego pelo teste de J7. |
| 2 | `chromeVisibility.ts` | `parou` devolvia o estado sem passar pela consolidação: uma entrada `preso` com `visivel: false` escapava da invariante. Pego pelo teste de **totalidade** (J14). |
| 3 | `chromeVisibility.ts` | O atalho de identidade (devolver a mesma referência na zona morta) **pulava** a consolidação. Corrigido: o atalho só vale quando o estado já é coerente. Pego pelo mesmo teste de totalidade. |
| 4 | `useChromeVisibility.ts` | Se o movimento reduzido ligasse **com a barra escondida**, ela ficaria escondida até a próxima rolagem — sem a ação principal justamente no modo em que ela mais importa. Corrigido com o efeito de reset (que agora preserva `preso`/`foco`). |
| 5 | `useChromeVisibility.ts` | `mountedRef` (inglês) no uso contra `montadoRef` (pt-BR) na declaração: typecheck reprovou com "did you mean" e o defeito foi corrigido. |
| 6 | `ContextualBars.tsx` | Comentário JSX (`//`) dentro do `<div>` vira **nó de texto**, estoura a largura e **empurra o `⋯` para fora da tela**. O gate que pega é o `textContent` da barra em `ContextualBarsReal.test.tsx`. Era o mesmo defeito da 018 — desta vez, com teste. |

Dois erros foram **do próprio teste**, e vale registrar porque a correção foi no
teste, não no código: rolar para baixo num caso que precisava rolar para cima, e
uma asserção que contava listeners de `window` (o que mede o React, não o hook).
A segunda virou asserção de **comportamento**.

---

## Duas ações pedidas que continuam não entregues — e por quê

| Pedido | Tela | Motivo |
|---|---|---|
| "editar" | `repertorioItem` | Tela **somente leitura**: não existe rota de edição e `repertorioItem` não está em `ManagedItemKind` (`packages/navigation/src/types.ts:138-150`). Um botão ali seria **morto** — proibido pela §16.13 e pela D9 da 018. |
| "abrir relacionadas" | `comparison` | A comparação é leitura de catálogo (`ComparisonRouteView.tsx`): não existe item relacionado nem rota. Recebeu `openTemple()` — ação de navegação real. |

Fechar a primeira exige decisão de produto: incluir o item como
`ManagedItemKind` mais um caminho de edição, **ou** escolher outra ação. Não
inventei editor para fechar a lacuna.

---

## Evidência final (2026-10-18)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | 0 |
| `npm run test` (suíte inteira) | **1716 testes, 145 arquivos — verde** (medido em 2026-10-18) |
| `node .github/scripts/check-boundaries.mjs` | `OK: fronteiras respeitadas.` |
| `npm run verify` (typecheck + testes + boundaries + contrato + build web + relatório de bundle + build mobile) | **exit 0** |
| `npm run bundle:report` | `OK: nenhuma regressão da spec §10` (entrada crítica 940 KiB raw · 273 KiB gzip) |

O número é o que o comando produziu **nesta** data; quem lê depois confere com o
comando, nunca com a cópia.

Os três arquivos desta feature, medidos em separado:
`chromeVisibility.test.ts` **26** · `useChromeVisibility.test.tsx` **24** ·
`ContextualBarsReal.test.tsx` **45** — **95 casos** só desta feature. O total da
suíte é o que o comando acima produz; número copiado para documento envelhece.
