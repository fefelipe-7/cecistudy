# To-do: Barra contextual de Liquid Glass (SPEC-M-018)

> **SUPERSEDIDO em 2026-10-18.** A `SPEC-M-018` foi substituída pela
> [`SPEC-M-019`](../../docs/specs/mobile/SPEC-M-019-duas-barras-de-vidro-com-sumico.md)
> (reconciliação item a item na §14 dela). Este arquivo é **histórico de
> execução** — nada aqui deve ser implementado a partir de `D5` (compactar é
> estado local), `D15` (no compacto o clique expande) ou `D17` (geometria de
> 72 px), que morreram com a remoção do pressionar-e-seguir.
> **Execução vigente:** [`todo-barras-vidro.md`](./todo-barras-vidro.md).
>
> Correção de drift: o arquivo `src/components/ui/ContextualBar.tsx` e o teste
> `src/components/ui/__tests__/ContextualBar.test.tsx` citados abaixo **não
> existem mais**; foram substituídos por `ContextualBars.tsx` e
> `ContextualBarsReal.test.tsx`.

> Spec de grupo: [`../../docs/specs/mobile/SPEC-M-018-barra-contextual-liquid-glass.md`](../../docs/specs/mobile/SPEC-M-018-barra-contextual-liquid-glass.md)
> Decisões de produto: **A1 e A2 em 2026-10-16** · **A3 e A4 em 2026-10-18**
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` +
> `node .github/scripts/check-boundaries.mjs` verdes. `SCHEMA_VERSION` fica
> **22** a fase inteira (a spec é só apresentação — D7).

**Progresso:** 4/5 fases ✅ — F1 a F4 entregues em 2026-10-16; **A3 fechada em
2026-10-18** (cápsula central ativada + geometria D17). F5 (inspeção em aparelho)
**pendente**.

> **A3 fechada.** A barra estava correta mas **sem a cápsula central**, porque
> eu tinha deixado A3 em aberto e nenhuma tela declarava `role: 'primary'`. A
> ativação é `role: 'primary'` na primeira ação de cada uma das cinco telas. O
> risco real dessa feature não era a barra quebrar: era **a barra existir, passar
> em todos os testes sintéticos e não aparecer em nenhuma tela de verdade**.
> `src/components/ui/__tests__/ContextualBarReal.test.tsx` (19 casos) é o teste
> que pega isso — ele monta a barra a partir do `headerConfig` **real**.

**Ordem das fases:** derivação pura (F1) → menu e recognizer (F2) → gesto e
compactação (F3) → a11y (F4) → inspeção e gates (F5). A ordem real diverge da
tabela da spec em um ponto, por um motivo registrado em F1.4.

---

## F6 — A4: seta fixa na borda direita + mapa das 15 telas (2026-10-18)

- [x] **F6.1** A barra passou de `justify-center` para **`justify-end`**. A seta é
  o último filho e fica na extrema lateral direita. **Não se move** entre os
  estados: com a barra centralizada, o gesto acontecia sobre um alvo que escapava.
- [x] **F6.2** Entrada e saída de `⋯` e cápsula deslizam **da direita para a
  esquerda** (`x: 32 → 0`), com a opacidade acompanhando a geometria. A seta é a
  âncora: crescer para a direita a empurraria para fora da tela.
- [x] **F6.3** Mapa das **15 telas** que declaravam nenhuma ação. Todas apontam
  para chamador que já existia — nenhuma ação inventada. Tabela na §5 da spec.
- [x] **F6.4** `HeaderConfigActions` ganhou `openSearch`, `openStreak`,
  `openTemple`, `openStudy`; o engine passa as quatro de `navigationEngine`.

### Duas ações pedidas que **não** foram entregues — e por quê

| Pedido | Tela | Motivo |
|---|---|---|
| "editar" | `repertorioItem` | Tela **somente leitura**: sem rota de edição e `repertorioItem` não está em `ManagedItemKind` (`packages/navigation/src/types.ts:138-150`). Botão de editar ali seria **morto** — proibido pela §16.13 e pela D9. |
| "abrir relacionadas" | `comparison` | A comparação é leitura de catálogo (`ComparisonRouteView.tsx`): não existe item relacionado nem rota. Recebeu `openTemple()` no lugar — ação de navegação real, coerente com a decisão de produto. |

> A tela do item do repertório segue **sem barra**. Fechá-la exige uma decisão:
> adicionar o item como `ManagedItemKind` + caminho de edição, ou escolher outra
> ação. Não inventei editor para fechar a lacuna.

### Bug introduzido e corrigido no mesmo dia

Um `//` de comentário foi escrito **dentro** do JSX, entre o `<motion.div>` e o
`<div>` interno. Em JSX, `//` não é comentário: o React renderiza como **nó de
texto**. O texto de prosa virou um item flex, estourou `max-w` e **empurrou o `⋯`
para fora da tela** — sintoma exato de "os três pontos sumiram e apareceu texto
aleatório".

Nenhum teste de presença pegou: o botão estava no DOM, só não cabia. O gate que
pega agora está em `ContextualBarReal.test.tsx` — *"a barra renderiza os três
controles e nenhum texto de comentário"* — que afirma o `textContent` da barra.

---

## F1 — Derivação pura e a barra no shell

- [x] **F1.1** `packages/navigation/src/contextualBar.ts` — regras puras:
  `planContextualBar({ kind, canGoBack, actions })`. Três motivos de ausência
  (`aba` · `sem-voltar` · `sem-opcoes`), divisão primária/secundária,
  `defaultPrimaryId`, `hasCenterCapsule`, `hasOptionsButton`.
  - *Invariante:* I6 — `defaultPrimaryId` sempre pertence a alguma lista, e
    nenhuma ação declarada some.
  - *Teste:* `packages/navigation/src/__tests__/contextualBar.test.ts` — 14 casos.
  - *Barreira:* o pacote não importa `react` nem `@capacitor/*`
    (`check-boundaries.mjs:98-102`).
- [x] **F1.2** `src/types/navigation.ts` — `HeaderAction` ganha `id`
  (**obrigatório**), `ariaLabel?`, `role?`, `destructive?`.
  - *Refinamento sobre a spec:* D9 previa só `selectedId?`. A derivação pura
    (D1) exige um identificador **na ação** — sem ele a seleção seria um índice
    e não sobreviveria a reordenar a lista. É o requisito que forçou `id`.
  - *Sete ids reais* em `src/lib/headerConfig.ts:142,154,187,315,350-352`.
- [x] **F1.3** `src/lib/contextualBar.ts` — adaptador React-free ⇄ pacote.
  Vive em `src/lib` porque `HeaderAction.Icon` é componente React.
  `contextualBarSignature()` dá chave de memoização estável: `headerConfig` é
  reconstruído a cada render e comparar por referência não memoizaria nada.
- [x] **F1.4** `src/components/ui/ContextualBar.tsx` + montagem em
  `MobileAppShell`. **O `⋯` e o voltar saem do `HeaderNav` neste passo, não na
  F3** como diz a tabela da spec — porque I11 proíbe dois retornos na mesma
  tela, e um estado intermediário com os dois seria pior do que reordenar as
  fatias. O predicado vem do shell e é o mesmo dos dois lados.
- [x] **F1.5** `MobileAppShell.tsx:229` — o piso do `<main>` passou a ouvir
  `isBottomNavVisible || barActive` (D14). Sem isso a barra cobriria o fim do
  conteúdo das telas de detalhe, que é onde ela aparece.
- [x] **F1.6** `src/index.css` — corrigido o comentário **falso** do bloco
  Liquid Glass (`:465` dizia "combinado com SVG filters feDisplacementMap"; não
  há filtro nenhum no repositório) e removidos `@keyframes scaleToggle{2,3}`,
  que tinham zero consumidor.

**Verificação:** `npm run lint` 0 · `npm run test` verde · boundaries 0.

---

## F2 — Menu `⋯`, recognizer e háptico

- [x] **F2.1** `src/lib/useLongPress.ts` — `allowSelf` e `onPressPhase`, sem
  duplicar recognizer (D2). A armadilha queotivou `allowSelf`: o seletor
  interativo inclui `button`, então usar o hook direto no botão de voltar
  **nunca disparava**.
- [x] **F2.2** `src/lib/__tests__/useLongPress.test.tsx` — **24 casos**, e este
  arquivo **não existia**: o hook tinha quatro consumidores e zero testes.
  Fecha três dívidas: engolir o `click` pós-gesto, a guarda de 700 ms, o
  auto-bloqueio em `<button>`.
- [x] **F2.3** `src/lib/haptics.ts` — `hapticSelection()`. Primeiro `Medium` do
  app: `hapticTap` seria indistinguível de executar a ação.
- [x] **F2.4** `src/components/ui/ContextualBarMenu.tsx` — painel derivado de
  `HeaderActionMenu` (fechar em `Escape` e fora) e de `Modal`
  (`role="dialog"`, `aria-labelledby`, guarda/restauração de foco). **Sem** focus
  trap: prender `Tab` numa barra de rodapé com um formulário logo acima deixaria
  a usuária sem caminho de volta ao formulário sem passar por três botões (D10).
- [x] **F2.5** Seções nomeadas ("Ação principal" / "Outras ações"), item
  selecionado com `Check` **e** `aria-pressed`.

**Dois defeitos reais que os testes acharam e que foram corrigidos:**

1. **Vazamento de listener.** O engolidor de `click` só saía quando um clique
   chegava. Se a plataforma não emitisse esse clique — Android em alguns
   aparelhos não emite — ele ficava armado e comia o **próximo** toque. Agora há
   referência ao listener, `dropSwallow()` no unmount e no gesto seguinte, e uma
   **janela de 400 ms**: passado o prazo, o evento passa.
2. **Nomes acessíveis duplicados.** A cápsula e a entrada do painel diziam a
   mesma coisa, e o leitor de tela anunciaria "editar aula" duas vezes. Agora a
   cápsula é `… — ação principal` e o item é `… — escolher ação principal` /
   `… — executar agora` (§10.2).

---

## F3 — Gesto de compactar e a barra no lugar do header

- [x] **F3.1** Compactar/expandir por `useLongPress` na seta, com
  `onPressPhase` alimentando o feedback progressivo do pressionar (§6.5).
- [x] **F3.2** `data-compact` expõe o estado; `⋯` e cápsula saem, a seta fica
  como referência espacial (§8.3).
- [x] **F3.3** **Clique curto no compacto expande e não navega.** Decisão
  `D15`. Se o clique continuasse sendo "voltar", a usuária compactaria para
  enxergar mais conteúdo e o primeiro toque jogaria ela para a tela anterior.
  Expandir é a inversa da compactação e é o caminho de **um ponteiro** que
  WCAG 2.5.7 exige (D12).
- [x] **F3.4** Trocar de contexto fecha o menu; compactar também fecha.

**Verificação:** `npm run lint` 0 · `npm run test` 1646 pass / 143 arquivos ·
boundaries 0 · ratchet `noInlineTokens` **não cresceu**.

---

## F4 — Acessibilidade

- [x] **F4.1** Rótulo da seta diz as duas coisas: `"voltar para a tela anterior ·
  segurar para compactar a barra"` (§10.1). Um rótulo só com "seta para a
  esquerda" não comunica a segunda interação.
- [x] **F4.2** `⋯` com `aria-expanded`; painel com `role="dialog"` +
  `aria-labelledby` e **sem** `aria-modal`; foco entra no painel e volta ao
  botão `⋯`.
- [x] **F4.3** `Escape` fecha; clique no scrim fecha sem executar; trocar de
  tela fecha.
- [x] **F4.4** Movimento reduzido: sem `exit`, o `AnimatePresence` desmonta na
  mesma renderização (§10.3). Não é só mais rápido — é o comportamento pedido.

**Verificação:** 25 casos em `src/components/ui/__tests__/ContextualBar.test.tsx`.

---

## F5 — Pendente

- [ ] **F5.1** `disabled` acessível numa ação indisponível. **Hoje não há ação
  desabilitada em lugar nenhum**, então a spec previa uma fatia que a
  catálogo real não exige. Foi removida do plano em vez de entregar um
  `disabled` sem primeiro exemplo.
- [ ] **F5.2** Inspeção em **aparelho físico** (as seis linhas da §13 da spec):
  polegar em iOS e Android, painel acima do teclado, home indicator,
  `font-scale` 200%, paisagem, e o gesto não virar retorno ao sair do botão.
- [ ] **F5.3** `npm run verify` completo (inclui `build:web` e `build:mobile`).
- [x] **F5.4** ~~Decidir A3~~ — **resolvido em 2026-10-18.** A cápsula central
  existe. `role: 'primary'` marcado em `src/lib/headerConfig.ts:142,154,187,316,350`.
  Geometria conforme `D17` da spec: 56 px expandido, **72 px compacto**, cápsula
  `h-14 flex-1 min-w-[8rem]`, `gap-3` entre controles.
  **Efeito colateral registrado:** nas superfícies do Estágio a ação primária
  aparece no hero **e** na barra. Não há duplicação de execução (mesmo
  `onClick`), mas há duplicação visual. A correção, se incomodar, é tirar do hero.

---

## Dívidas que a implementação registrou (não fazem parte desta spec)

| # | Onde | O quê |
|---|---|---|
| D1 | `src/lib/useLongPress.ts` | Antes o unmount **não** limpava o timer: um componente desmontado no meio do pressionar recebia `onLongPress` depois de morto. Corrigido. |
| D2 | `src/components/HeaderNav.tsx:38` | `aria-label="bottom navigation"` em inglês numa app pt-BR. A barra nova não repete o padrão; a pílula continua com ele. |
| D3 | `src/index.css:292-367` | `.journal-card`, `.press-btn` e `.hover-lift` têm **zero** consumidor. Não foram tocados aqui. |
| D4 | `src/components/ui/FloatingActionMenu` | `duration` **e** `type: "spring"` no mesmo objeto, `key={index}`, sem `Escape`, sem foco. Vive nas telas de aba, onde a barra não aparece (D4). |
| D5 | `src/components/motion/MotionProfileProvider.tsx:58-62` | O provider anuncia a regra CSS `[data-motion="reduced"]`, mas **nenhum CSS a consome**. |