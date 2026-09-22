# Tarefas: Repertório da disciplina (SPEC-001)

> Tracking do plano `tasks/plan-repertorio.md` (não sobrescreve o plano principal).
> Fonte da true: `docs/specs/SPEC-001-repertorio-disciplina-conceitos-autores-bibliografia.md`.

## Fase 0 — Fundação

- [x] **TASK-1** Course + `conceptIds`/`authorIds`/`bibliographyIds`; `SCHEMA_VERSION` 14 + `MIGRATIONS[14]`
  - Acceptance: `Course` com 3 campos opcionais; migração backfill `[]`; teste de migração/round-trip
  - Verify: `npm run lint` + `npm run test` (extender `exportImport.test.ts`)
  - Files: `src/types/entity.ts`, `packages/data/src/schema.ts`, `src/lib/__tests__/exportImport.test.ts`

## Fase 1 — Resolver puro + opções

- [x] **TASK-2** `src/lib/courseRepertorio.ts` + `src/lib/repertorioOptions.ts`
  - Acceptance: `resolveCourseRepertorio` união/dedup por prefixo; `repertorioOptions` merge pessoal+acervo/catálogo
  - Verify: `npm run lint` + novos testes (`courseRepertorio.test.ts`, `repertorioOptions.test.ts`)
  - Files: `src/lib/courseRepertorio.ts`, `src/lib/repertorioOptions.ts`, tests

## Fase 2 — UI

- [x] **TASK-3** `src/components/ui/CatalogMultiSelect.tsx`
  - Acceptance: bottom-sheet com busca cross-source e grupos (pessoal/acervo/catálogo)
  - Verify: lint + test (+ teste de componente básico)
  - Files: `src/components/ui/CatalogMultiSelect.tsx`, `src/components/ui/__tests__/CatalogMultiSelect.test.tsx`

## Fase 3 — Wizard

- [x] **TASK-4** Passo "repertório" no `CourseWizard`
  - Acceptance: passo opcional com 3 grupos; salvar persiste os 3 arrays; curso reaberto os mostra
  - Verify: `npm run lint` + `npm run test` + `npm run build`
  - Files: `src/components/wizards/CourseWizard.tsx`, `src/components/wizards/useCourseRepertorio.ts`

## Fase 4 — Detalhe da disciplina

- [x] **TASK-5** `CourseRepertorioContent` real
  - Acceptance: seções usam `resolveCourseRepertorio` (união com legado); ações add/gerenciar persistem
  - Verify: lint + test + build
  - Files: `src/components/courses/detail/CourseRepertorioContent.tsx`

## Fase 5 — Edição

- [x] **TASK-6** `EditCourseModal` com área repertório
  - Acceptance: mesma segunda via de edição com `CatalogMultiSelect`; reflete na seção
  - Verify: full (lint + test + build + boundary se tocar `packages/*`)
  - Files: `src/components/courses/EditCourseModal.tsx`

## Checkpoint final

- [x] Gate full verde; fluxo wizard → detalhe → editar → persistência OK; spec marcada implementada