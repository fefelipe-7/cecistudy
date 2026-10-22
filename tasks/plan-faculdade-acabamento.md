# Plano: acabamento da tela de Faculdade (SPEC-014)

> Spec-fonte: [`../docs/specs/SPEC-014-faculdade-cantinho-academico.md`](../docs/specs/SPEC-014-faculdade-cantinho-academico.md)
> Cópia de grupo: [`../../docs/specs/mobile/SPEC-M-019-faculdade-cantinho-academico.md`](../../docs/specs/mobile/SPEC-M-019-faculdade-cantinho-academico.md)
> Tasks: [`./todo-faculdade-acabamento.md`](./todo-faculdade-acabamento.md)
> **Escopo: só o mobile (React/TS).** `packages/navigation`, `contracts/` e
> `SCHEMA_VERSION` **intocados** — nada de navegação, nada de persistência.

## Objetivo em uma frase

Deixar a tela de Faculdade **mais bonita** sem trocar o layout: o bloco de estágio
vira o segundo lugar de novo, com as horas de campo como número grande e as duas
ações dentro de um card só.

## O que este plano substitui

A versão anterior deste plano (`plan-faculdade-redesign.md`, 2026-10-14)
reconstruía a tela como narrativa de oito cards. Ela foi implementada, mostrada à
dona do produto e **rejeitada** em 2026-10-15: cartão demais, informação
espalhada e o estágio perdendo o foco que tinha. O histórico completo está em
[`SPEC-014` §8](../docs/specs/SPEC-014-faculdade-cantinho-academico.md).

## Causa de raiz em uma frase

A tela não tinha problema de informação, tinha problema de acabamento: o bloco de
estágio repetia o mesmo assunto em dois elementos (`FaculdadeView.tsx`, botão
solto logo abaixo do card) e as horas de campo apareciam como número pequeno
dentro de uma frase.

## Fases

| Fase | O quê | Entrega |
|---|---|---|
| F0 | Baseline | `lint`, `check-boundaries` e `git diff --stat contracts/` verdes antes de mexer |
| F1 | Contagem do estágio | `useMemo` → `computeStats`/`computePendencies` (`internshipCases`), com `localDateKey(now)` |
| F2 | Card de estágio | um `<section>`; área principal clicável + `abrir o diário` e `anotar ou agendar` dentro; botão solto removido; horas como número grande |
| F3 | Voz | `DICA.faculdadePraticaAcompanha` consumida no card; dezoito chaves órfãs da proposta anterior removidas de `voice.ts` |
| F4 | Limpeza | nove componentes, dez testes, `facultyViewModel.ts` e `diasAteComSinal` removidos; `packages/navigation` e `navigationEngine.ts` restaurados |
| F5 | Docs | `SPEC-014`, `SPEC-M-019` e o índice do grupo corrigidos |
| F6 | Gate | `lint`, `test`, `check-boundaries`, `check:voz`, `contracts/` vazio |

## Fora de escopo

Reordenar blocos, tirar a tab bar, criar visão `overview`, card de presença na
Faculdade, progresso da formação na Faculdade, e qualquer mudança de domínio,
schema, persistência ou navegação.

## Reversão é parte do plano

Se a revisão visual da dona reprovar o acabamento, o caminho é ajustar o card de
estágio — **não** reabrir a discussão de estrutura. D1 da spec: refino é
lapidação; reconstrução é outro produto.