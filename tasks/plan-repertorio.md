# Plano de Implementação: Repertório da disciplina (SPEC-001)

> Plano novo, separado do plano principal de refatoração (`tasks/plan.md`) para não
> sobrescrevê-lo. Fonte da verdade: `docs/specs/SPEC-001-repertorio-disciplina-conceitos-autores-bibliografia.md`.

## Overview

Vincular a aba "repertório" do detalhe de disciplina aos dados existentes do app:
conceitos/autores (banco pessoal + acervo/templo via adoção `con-`/`aut-`) e bibliografia
(leituras `r-`/materiais `m-` + catálogo `cat-`/`inter-`/`art-`). Adicionar vínculos no
`CourseWizard` e nas seções do detalhe / `EditCourseModal`.

## Architecture Decisions

- 3 campos opcionais na `Course`: `conceptIds`/`authorIds`/`bibliographyIds` (default
  `undefined`; persistência tolera ausência).
- Resolução por prefixo (tabela da spec): `con-`, `aut-`, `r-`, `m-`, `cat-`, `inter-`, `art-`.
- Renderização = **união** com o caminho legado (`concept.courseIds`, `reading.courseId`,
  autores transitivos), dedup por id.
- Conceito/autor do templo é **adotado** para o banco pessoal (`useAcervoTheory` +
  `adoptAcervoConcept/Author`) antes de vincular; catálogo vira vínculo estático.
- `SCHEMA_VERSION` 13 → 14 + `MIGRATIONS[14]` (backfill `[]`). Lógica pura em `src/lib`
  (sem tocar `packages/domain` — Open Question 3 da spec).
- Sem nova rota/navegação: passo dentro do wizard `{kind:'wizard'; type:'course'}` existente
  + modais bottom-sheet.

## Task List

### Fase 0 — Fundação

- [x] **TASK-1** Camada de dados: `Course` + 3 campos; `SCHEMA_VERSION` 14 + `MIGRATIONS[14]`; teste de migração.
  - Gate: `npm run lint` + `npm run test` (extender `exportImport.test.ts`) + `npm run build`.

### Fase 1 — Resolver puro + opções

- [x] **TASK-2** `src/lib/courseRepertorio.ts` (prefixos + `resolveCourseRepertorio` união/dedup)
  e `src/lib/repertorioOptions.ts` (merge pessoal + acervo/templo + catálogo; `filterNewNames`).
  - Gate: `npm run lint` + novos testes (`courseRepertorio.test.ts`, `repertorioOptions.test.ts`).

### Fase 2 — UI

- [x] **TASK-3** `src/components/ui/CatalogMultiSelect.tsx` (bottom-sheet, busca, grupos, prefix-aware).
  - Gate: lint + test (+ teste de componente básico).

### Fase 3 — Wizard

- [x] **TASK-4** Passo "repertório" no `CourseWizard` (`useCourseRepertorio` + salvamento).
  - Gate: lint + test + build.

### Fase 4 — Detalhe da disciplina

- [x] **TASK-5** `CourseRepertorioContent` real (resolver + ações adicionar/gerenciar por seção).
  - Gate: lint + test + build.

### Fase 5 — Edição

- [x] **TASK-6** `EditCourseModal` com área repertório + passada manual (wizard → detalhe → editar → persistência/export).
  - Gate: full (lint + test + build + boundary se tocar `packages/*`).

### Checkpoint final

- [x] `npm run lint` + `npm run test` + `npm run build` (+ `node .github/scripts/check-boundaries.mjs`)
  verdes; fluxo end-to-end funciona; spec marcada como implementada.

## Risks and Mitigations

| Risco | Impacto | Mitigação |
|---|---|---|
| Bump de SCHEMA_VERSION quebra import de backups antigos | Alto | `MIGRATIONS[14]` backfill + Zod `.passthrough()` (já existente); teste round-trip |
| Derivação legada diverge do novo resolver | Médio | `resolveCourseRepertorio` faz união com legado; testes por prefixo |
| Wizard quebra chamadas existentes | Médio | Passo novo opcional; `Course` com campos opcionais; `handleAddCourse` genérico (`{...c}`) |
| Catálogo (banco pessoal) muda de id no meio da sessão | Baixo | Sufixo timestamp; adoção idempotente por nome normalizado |

## Open Questions

- (Abertas na spec: 4 e 5) — união de fonte de conceitos e junction nativo ficam como
  follow-ups documentados.