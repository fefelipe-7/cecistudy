# Todo: acabamento da tela de Faculdade (SPEC-014)

> Plano: [`./plan-faculdade-acabamento.md`](./plan-faculdade-acabamento.md)
> Spec: [`../docs/specs/SPEC-014-faculdade-cantinho-academico.md`](../docs/specs/SPEC-014-faculdade-cantinho-academico.md)
> Números são **gerados**, não copiados: rode o comando da fase.

## F0 · Baseline

- [x] `npm run lint` verde
- [x] `node .github/scripts/check-boundaries.mjs` verde
- [x] `git diff --stat contracts/` vazio

## F1 · Contagem do estágio vem do domínio

- [x] `estagio` memoizado com `computeStats`/`computePendencies` (`internshipCases`)
- [x] `localDateKey(now)` como hoje — data civil, nunca `Date` cru (SPEC-009)
- [x] Sem agregador de tela novo

## F2 · Card de estágio

- [x] `<button>` solto "anotar ou agendar um estágio" removido
- [x] Card virou `<section>` com área principal clicável (abre o diário) e o CTA de anotar dentro (HTML válido)
- [x] Nenhuma ação repetida: o card abre o diário, o botão anota
- [x] Horas de campo como número grande (`text-2xl`, `tabular-nums`)
- [x] Registros e pendências abaixo ("N pedindo carinho" / "tudo em dia")
- [x] `pr-16` reservando a área do mascote nos dois lados

## F3 · Voz

- [x] `DICA.faculdadePraticaAcompanha` registrada e consumida no card
- [x] Dezoito chaves órfãs removidas de `src/lib/voice.ts` (D5)
- [x] `npm run test -- src/lib/__tests__/voice.test.ts` verde
- [x] `npm run check:voz` com 0 frases inline

## F4 · Limpeza da proposta anterior

- [x] Nove componentes de `src/components/views/faculdade/` removidos
- [x] Dez testes correspondentes removidos
- [x] `src/lib/facultyViewModel.ts` e seu teste removidos
- [x] `diasAteComSinal` removido de `src/lib/diasAte.ts`
- [x] `SubTabFaculdade`, `SUB_TAB_BY_TAB`, `DEFAULT_SUB_TAB` e o default de `navigationEngine.ts` restaurados
- [x] `git diff --stat packages/navigation src/context/navigationEngine.ts` vazio

## F5 · Docs

- [x] `SPEC-014` reescrita: D1..D6, com a proposta revertida em §8
- [x] `SPEC-M-019` (grupo) corrigida, com a lição de portabilidade
- [x] Índice `docs/specs/README.md` corrigido
- [x] Planos antigos `plan-faculdade-redesign.md` e `todo-faculdade-redesign.md` removidos

## F6 · Gate

- [x] `npm run lint` → 0
- [x] `npm run test` → 0
- [x] `node .github/scripts/check-boundaries.mjs` → 0
- [x] `npm run check:voz` → 0 frases inline
- [x] `git diff --stat contracts/` → vazio
- [x] Sem `U+FFFD` nos arquivos tocados
- [ ] Revisão visual na usuária — **sem navegador no ambiente de agente**; fica manual

## Comandos de verificação

```bash
npm run lint
npm run test
node .github/scripts/check-boundaries.mjs
npm run check:voz
git diff --stat contracts/
git diff --stat packages/navigation src/context/navigationEngine.ts
Get-ChildItem src\components\views\faculdade -File -Filter *.tsx | Measure-Object
```