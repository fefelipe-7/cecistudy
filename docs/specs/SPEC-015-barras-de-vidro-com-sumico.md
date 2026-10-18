# SPEC-015 · Duas barras de vidro com sumiço por rolagem

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: em andamento — implementada em 2026-10-18; falta inspeção em aparelho
> App afetado: mobile
> Origem: [`SPEC-M-019`](../../../docs/specs/mobile/SPEC-M-019-duas-barras-de-vidro-com-sumico.md) (grupo) · que deriva de `spec-referencial-workspace-academico.md` §2
> Decisões de produto: A5, A6, A7, A8 e A9 (2026-10-18)
> Decisões: D1..D12 (numeração da `SPEC-M-019`)
> Supersede: — (não existe cópia local anterior: a `SPEC-M-018` nunca teve cópia no app; a supersedência está registrada na `SPEC-M-019` §14. O número `SPEC-014` **não** foi usado)
> Depende de: `SPEC-002` (motion e espaçamento), `SPEC-007` (transições)
> Execução: [`tasks/todo-barras-vidro.md`](../tasks/todo-barras-vidro.md)

> **Esta é a cópia local da spec de grupo.** O contrato — decisões, invariantes,
> casos de borda e reconciliação — mora na `SPEC-M-019`, em
> `docs/specs/mobile/`. Este arquivo existe para que a regra que o app implementa
> esteja **dentro** do app, apontando para a fonte. Aqui vai só o que é específico
> do código deste repositório: onde está cada peça e como se verifica.

---

## 1. O que a regra diz, em uma linha

Nas telas secundárias (onde a barra contextual existe), o rodapé tem **duas**
barras lado a lado — `[ ← voltar ]` e `[ ⋯ | ação principal ]` — **centralizadas**
no rodapé (A9 da `SPEC-M-019` revogou o ancoramento à direita). Rolagem **para baixo** esconde as duas; rolagem **para cima** traz de
volta com fade; **3 segundos parada** fora do topo esconde de novo. No topo
(`scrollY ≤ 20`), sob movimento reduzido, com o menu `⋯` aberto ou com o foco de
teclado dentro, as barras **nunca** somem.

## 2. Onde cada peça vive

| Peça | Arquivo | Papel |
|---|---|---|
| Máquina de visibilidade | `src/lib/chromeVisibility.ts` | reducer **puro** e total: `(estado, evento) => estado`; constantes `IDLE_HIDE_MS`, `TOP_PX`, `SCROLL_DEAD_ZONE_PX`, `CHROME_FADE_IN`, `CHROME_FADE_OUT`; `precisaDeInert()` |
| Hook | `src/lib/useChromeVisibility.ts` | dono do listener de rolagem e do **único** temporizador; expõe `notificarRolagem/Navegou/Menu/Foco` |
| Renderizador | `src/components/ui/ContextualBars.tsx` | duas barras irmãs, `justify-center` no par, fade só de `opacity`, `inert` quando oculta |
| Menu `⋯` | `src/components/ui/ContextualBarMenu.tsx` | mantido da `SPEC-014`; abrir **prende** as barras |
| Derivação das ações | `packages/navigation/src/contextualBar.ts` + `src/lib/contextualBar.ts` | mantida; o catálogo de 15 telas não mudou |
| Montagem | `src/shells/MobileAppShell.tsx` | lê o estado, avisa as transições de tela, passa `performBack` |

## 3. Invariantes (numeração da `SPEC-M-019` §8)

J1..J14 estão na spec de grupo. As que este app prova por comando:

| # | Comando |
|---|---|
| J2, J6, J7, J8, J12, J13 | `npm run test -- src/components/ui/__tests__/ContextualBarsReal.test.tsx` |
| J3, J4, J6, J7, J14 (totalidade) | `npm run test -- src/lib/__tests__/chromeVisibility.test.ts` |
| J5, J6, J9, J10 | `npm run test -- src/lib/__tests__/useChromeVisibility.test.tsx` |
| J1 | `npm run test -- src/lib/__tests__/navigationRegression.test.tsx` |
| J11 | `npm run test -- src/lib/__tests__/motion/noInlineTokens.test.ts` |
| todos | `npm run verify` |

## 4. Decisões de implementação que **não** estão na spec de grupo

Duas escolhas são deste repositório e ficam registradas aqui:

1. **O foco é observado no contêiner das duas barras**, com `onFocus`/`onBlur`
   do React (que borbulham), e o `blur` só conta como saída quando
   `relatedTarget` está **fora** do contêiner. O `blur` dispara a cada troca de
   filho (`Tab` da cápsula para o `⋯`); sem a checagem, as barras se
   despenderiam no meio do percurso de teclado.
2. **`gap-2` entre as duas barras**, e a barra de voltar é `shrink-0` enquanto a
   de ação é `flex-1 min-w-0`: em tela estreita, quem cede espaço é a ação, e
   "voltar" nunca encolhe.

## 5. Fora de escopo

Igual à `SPEC-M-019` §7 — em especial: **nenhuma ação nova de produto**, nenhuma
dependência nova, nenhum bump de `SCHEMA_VERSION` (a `SPEC-M-019 D10` mantém
`SCHEMA_VERSION` em `packages/data/src/schema.ts`), e o item do repertório
continua **sem** ação de editar enquanto o produto não decidir.

## 6. Rastreabilidade

| Origem | Aqui |
|---|---|
| `SPEC-M-019` §5.1 | §2 desta |
| `SPEC-M-019` §8 (J1..J14) | §3 desta |
| `SPEC-M-019` §10 (critérios) | §3 desta, por comando |
| `SPEC-M-019` §14 (reconciliação com a 018) | **só** na spec de grupo, num lugar único |
| `SPEC-M-019` §15 (pendência de aparelho) | `tasks/todo-barras-vidro.md`, F4 |

---

> Regras de escrita: pt-BR, zero emoji em `#` e `##`, `caminho:linha` para citar
> código, e **escreva com a ferramenta `write`/`edit`**, nunca por PowerShell
> (`AGENTS.md` do grupo e deste app).
