# Plano: Virada de semestre — entradas, correção de números e navegação (SPEC-008)

> Spec-fonte: [`../docs/specs/SPEC-008-virada-de-semestre-entradas-e-navegacao.md`](../docs/specs/SPEC-008-virada-de-semestre-entradas-e-navegacao.md)
> Tasks: [`./todo-virada-entradas-navegacao.md`](./todo-virada-entradas-navegacao.md)
> **Escopo: só o mobile (React/TS).** Nenhum crate Rust tocado, `SCHEMA_VERSION` continua
> **19**, `contracts/golden/` intocado, nenhum golden regerado.

## Objetivo em uma frase

A virada de semestre está **corretamente implementada e praticamente inalcançável** — o botão
que a inicia existe, mas está atrás de um predicado de domínio com um ramo morto; e a
superfície que corrige os números está ausente ou travada.

## Causa de raiz (1 frase)

`shouldOfferRollover` lê `term.endedAt`, que **só existe** num período `encerrado`
(`closeTerm:239`, `rollover:309`, `enforceSingleActiveTerm:366`) — e o CTA é sobre o período
**ativo**, que nunca o tem. Os dois entry points do wizard dependem dele, logo **a virada só é
alcançável no último semestre da graduação**.

## Ordem das fases e por quê nesta ordem

| fase | o quê | por que aqui | tamanho |
|---|---|---|---|
| **F0** | Blindagem (testes vermelhos) | nenhum código de produção muda; os testes documentam o bug e falham de forma previsível | **S** |
| **F1** | Domínio: `canRollover` + `shouldNudgeRollover` | mata a causa de raiz; 1 arquivo, 2 funções, sem UI. F1 antes de F3 porque F3 depende do predicado | **S** |
| **F2** | Navegação: histórico irmão do wizard | bug independente de F1; só `navigationEngine` + `hash` + `TermHistoryScreen` + teste | **M** |
| **F3** | Superfície dos números | o que a usuária mais sente; churn de UI, isolado numa fase só | **L** |
| **F4** | Wizard + escopo | o wizard é o arquivo mais sensível (grava o semestre); vem depois de F1 (que ele consome) e F3 (que define os controles) | **L** |
| **F5** | Fechamento | testes que exigem F1–F4 prontos + reconciliação de docs | **M** |

**F1 e F2 são independentes** e podem ser feitas em qualquer ordem. **F3 e F4 nunca se
misturam** — F3 é Perfil/Faculdade, F4 é o wizard.

## Decisões que atravessam as fases

| id | decisão | onde nasce |
|---|---|---|
| D1 | `canRollover` (estrutural, sem data) vs `shouldNudgeRollover` (ênfase, meses desde `startedAt`) | F1 |
| D2 | Card do período = 4 partes, no topo do Perfil, botão com **rótulo** ≥44px | F3 |
| D3 | `ordinal` clampeado em `1..MAX_TERM_ORDINAL` (**não** em `..total`) → quebra a trava circular | F3 |
| D4 | Wizard: `ordinal` editável, "abrir o 1º período", clamp anunciado, rascunho, a11y | F4 |
| D5 | Histórico empilha sobre a base atual; `routeToStack` = 2 telas; expansão em estado local | F2 |
| D6 | `stickers`/`profileMeta` recebem o ordinal por argumento | F4 |
| D7 | `scope.grade` → `allActive`; `JourneyTimeline` resolve período por `id` | F4 |

## Verificação (rodar depois de cada fase, não só no fim)

```bash
npm run lint                                # tsc --noEmit
npm run test                                # vitest (gate do mobile)
node .github/scripts/check-boundaries.mjs   # packages/* não toca react/capacitor
npm run build
```

`git diff --stat contracts/` tem que estar **vazio** ao final de cada fase — prova de que
nenhum golden foi tocado.

## Riscos

- **F3 é o churn de UI**: Perfil + Faculdade. Vai por partes, gate verde entre elas.
- **F2 muda comportamento coberto por teste** (`routing.test.ts:521-526` e possivelmente
  `motion/slideKeys` / `motion/intent`). A **intenção de movimento continua sendo push** — o
  que muda é a base da pilha.
- **`shouldNudgeRollover` é heurística nova** (4 meses). O botão sempre visível (D1) garante
  que a heurística errada vire aviso fora de hora, nunca caminho perdido.
- **Passo 1 do wizard editável aumenta superfície de erro** (basta digitar 99): clamp `1..12`
  no input **e** no `planTermRollover` (defesa em duas camadas) + aviso no passo 4.
