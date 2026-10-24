# Auditoria de Testes – Fase 1 (atualizada 2026-10-23)

Data: 2026-10-23

## Inventário
- Total arquivos `src/**/*.test.{ts,tsx}`: 146 (de 150)
- Total arquivos `packages/**/*.test.{ts,tsx}`: 14 (de 5)
- Testes passando baseline: 1731 (src) + 367 (packages) = 2098

## Render-only identificados e removidos
1. `src/components/ui/__tests__/PillGroup.test.tsx` – `aceita tamanho pequeno` → removido
2. `src/components/ui/__tests__/ColorSwatchPicker.test.tsx` – `usa as cores padrão...` → removido
3. `src/components/ui/__tests__/dither-charts.test.tsx` – 6 testes render-only → arquivo removido
4. `src/components/ui/__tests__/Modal.test.tsx` – `renderiza o conteúdo quando aberto` → removido
5. `src/components/ui/__tests__/CatalogMultiSelect.test.tsx` – `agrupa...` → removido
6. `src/components/ui/__tests__/Picker.test.tsx` – 3 render-only → removidos
7. `src/components/ui/__tests__/TagList.test.tsx` – 3 render-only → substituídos por 1 comportamental
8. `src/components/ui/__tests__/ToggleRow.test.tsx` – 3 duplicatas de Toggle → substituídos por 2 específicos
9. `src/components/ui/__tests__/ContextualBottomBar.test.tsx` – 2 pass-through de aria-label → removidos
10. `src/components/ui/__tests__/PillGroupMulti.test.tsx` – `aceita label do grupo` → removido
11. `src/components/ui/__tests__/PillGroup.test.tsx` – `renderiza o label e o emoji` → removido

## Parametrização
- `src/components/views/__tests__/PerfilView.test.tsx` – 3 testes de mode → `it.each`
- `src/components/views/perfil/__tests__/JourneyHistory.test.tsx` – 2 estados vazios → `it.each`

## Migração de domínio (move)
- `src/lib/__tests__/dateBR.test.ts` → removido (duplicata de `packages/domain/internship.test.ts`)
- `src/lib/__tests__/internshipCases.test.ts` → removido (duplicata)
- `src/lib/__tests__/canonicalJson.test.ts` → `packages/contracts/src/__tests__/canonicalJson.test.ts`
- `src/lib/__tests__/canonicalHash.test.ts` → `packages/contracts/src/__tests__/canonicalHash.test.ts`
- `src/lib/__tests__/focusTimer.test.ts` → `packages/application/src/focus/timer.test.ts`
- `src/lib/sync/__tests__/stamp.test.ts` → `packages/sync/src/__tests__/stamp.test.ts`
- `src/lib/sync/__tests__/pairing.test.ts` → `packages/sync/src/__tests__/pairing.test.ts`
- `src/lib/sync/__tests__/provider.test.ts` → `packages/sync/src/__tests__/provider.test.ts`
- `src/lib/sync/__tests__/github.test.ts` → `packages/sync/src/__tests__/github.test.ts`
- `src/data/__tests__/schema.test.ts` → `packages/data/src/__tests__/schema.test.ts`
- `src/data/__tests__/migration20.test.ts` → `packages/data/src/__tests__/migration20.test.ts`

## Dedupe
- `src/core/application/__tests__/use-cases.test.ts` – removidos 2 testes duplicados de `packages/domain/invariants.test.ts`

## Ajuste de drift (SPEC-M-024)
- `src/components/views/perfil/__tests__/ProfilePage.test.tsx` – incluído h2 "backup em nuvem" na lista de ordem fixa

## Próximos candidatos
- Mover `collections`, `dataClient`, `exportImport`, `quizPlayState`, `quizStack`, `routing` (bloqueados por imports de `src/`)
- Remover render-only de views: `ProfileHero`, `ProgressPulse`, `JourneyRail`, `TccView` (parcial)
- Mover `canonicalJson`/`canonicalHash` testes de vetores para o package (feito)
- Consolidar testes de FSRS/spaced repetition (`fsrs` ↔ `review` ↔ `reviewMeta`)
- Consolidar calendar aggregation (`calendarAggregator` ↔ `schedule`)
- Consolidar bibliography (`courseRepertorio` ↔ `repertorioOptions`)

## Gates verdes
- `npm run lint` (tsc --noEmit) ✅
- `node .github/scripts/check-boundaries.mjs` ✅
- `npx vitest run src` → 152 files, 1731 tests ✅
- `npx vitest run packages` → 14 files, 367 tests ✅
