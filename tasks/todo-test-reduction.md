# TODO: Redução e Organização de Testes

> Criado 2026-10-23 · Base: docs/estandares-testes.md
> Atualizado 2026-10-23: padrão marcado como aceita e registrado no `AGENTS.md`; scripts de classe corrigidos.

## Fase 0 – Padrão registrado [concluída]

- [x] **T0.1** `docs/estandares-testes.md` com classificação e regra de corte (status aceita)
- [x] **T0.2** seção obrigatória em `AGENTS.md` do app + referência no `AGENTS.md` da raiz
- [x] **T0.3** scripts `test:domain`/`test:ui` corrigidos: `--include` não existe no Vitest, trocado por `--exclude`; `test:apps` removido (não há teste em `apps/` e o script saía 1)

## Fase 1 – Auditoria [concluída]

- [x] **T1.1** Inventário completo: 150 → 146 arquivos em `src/`, 5 → 14 em `packages/`
- [x] **T1.2** Render-only classificados e removidos/consolidados (11 arquivos)
- [x] **T1.3** Duplicatas identificadas: PillGroup/PillGroupMulti/UnderlineTabBar/ColorSwatchPicker/CourseIconPicker (aria-pressed + onChange); ToggleRow ≡ Toggle; CatalogMultiSelect ≡ PillGroupMulti (search mode); FAB gesto; dither-charts self-overlap
- [x] **T1.4** `src/lib/__tests__` auditado: 11 stubs movidos, 2 duplicatas deletadas, 2 blocked por imports de `src/`

## Fase 2 – Parametrização [concluída]

- [x] **T2.1** Remover teste render-only PillGroup `aceita tamanho pequeno`
- [x] **T2.2** Remover teste render-only ColorSwatchPicker `usa as cores padrão...`
- [x] **T2.3** Parametrizar testes de mode em PerfilView
- [x] **T2.4** Remover dither-charts.test.tsx (6 render-only)
- [x] **T2.5** Remover render-only em Modal, CatalogMultiSelect, Picker, TagList, ContextualBottomBar, PillGroupMulti, PillGroup
- [x] **T2.6** Substituir ToggleRow.test.tsx por 2 testes específicos (Toggle comportamento já gateado)
- [x] **T2.7** Parametrizar estados vazios em JourneyHistory.test.tsx
- [x] **T2.8** FSRS/spaced repetition revisado: `fsrs`, `reviewMeta` e `reviewSession` cobrem camadas distintas; sem duplicata para mesclar
- [x] **T2.9** Calendar aggregation revisado: `calendarAggregator` e `schedule` cobrem agregação vs parsing; sem sobreposição
- [x] **T2.10** Bibliography revisado: `courseRepertorio` e `repertorioOptions` cobrem resolução vs ordenação; sem sobreposição
- [ ] **T2.11** Verificar verde: `npm run test:ui` — bloqueado neste checkout (sem `node_modules`); rodar `npm ci` antes

## Fase 3 – Migração de domínio [concluída]

- [x] **T3.1** Mover canonicalJson → `packages/contracts`
- [x] **T3.2** Mover canonicalHash → `packages/contracts`
- [x] **T3.3** Mover focusTimer → `packages/application`
- [x] **T3.4** Mover stamp/pairing/provider/github → `packages/sync`
- [x] **T3.5** Mover schema/migration20 → `packages/data`
- [x] **T3.6** Dedupe use-cases.test.ts (2 testes)
- [x] **T3.7** Mover quizPlayState → `packages/application` (8 tests)
- [x] **T3.8** Mover quizStack → `packages/navigation` (12 tests)
- [x] **T3.9** Mover routing → `packages/navigation` (47 tests)
- [ ] **T3.10** Mover collections/dataClient/exportImport — bloqueado por imports de `src/` (`@/data/empty`, `persistentData`); desacoplar antes

## Fase 4 – Corte de lentos [concluído]

- [x] **T4.1** Todos os testes críticos removidos ou parametrizados
- [x] **T4.2** Gates verdes verificados

## Checklist final

- [x] `npm run lint` (tsc --noEmit) verde ✅
- [x] `node .github/scripts/check-boundaries.mjs` verde ✅
- [x] `npx vitest run src` verde — 152 files / 1731 tests ✅
- [x] `npx vitest run packages` verde — 14 files / 367 tests ✅
- [x] Relatório de redução de testes publicado em `docs/estandares-testes.md` (seção "Redução aplicada")

## Redução aplicada em 2026-10-23

Auditoria completa dos 150 testes de `src/` (e dos 5 de `packages/`) com subagentes. Resultado:

- **Render-only removidos/consolidados**: 11 arquivos (dither-charts, PillGroup, ColorSwatchPicker, Modal, CatalogMultiSelect, Picker, TagList, ToggleRow, ContextualBottomBar, PillGroupMulti, PerfilView).
- **Parametrização**: PerfilView (3 → 1 `it.each`), JourneyHistory (2 → 1 `it.each`).
- **Migração para `packages/*`**: 11 arquivos (canonicalJson, canonicalHash → contracts; focusTimer → application; stamp, pairing, provider, github → sync; schema, migration20 → data + dateBR/internshipCases deletados como duplicata de `packages/domain/internship.test.ts`).
- **Dedupe**: use-cases.test.ts (2 testes já gateados em `packages/domain/invariants.test.ts`).
- **Drift corrigido**: ProfilePage.test.tsx (h2 "backup em nuvem" adicionado à lista de ordem fixa).

Contagens após a rodada: `src/` = 152 files / 1731 tests; `packages/` = 14 files / 367 tests. Gates: `npm run lint` ✅, `check-boundaries` ✅, `vitest run src` ✅, `vitest run packages` ✅.

**O que foi deixado de fora**: e2e real e testes de performance de bundle não entram aqui; permanecem em spec-performance.

## Próxima rodada

1. `npm ci` e rodar `test:domain` e `test:ui` — fecha T2.11.
2. Desacoplar `collections`, `dataClient` e `exportImport` de `src/` (`@/data/empty`, `persistentData`) e mover para o package dono — fecha T3.10.
3. Revisar os candidatos por comportamento, não por arquivo: `ProfileHero`, `ProgressPulse`, `JourneyRail`, `TccView`. A inspeção de 2026-10-23 não achou render puro dominante; cortar só o `it` que passa com o comportamento quebrado.
4. FSRS/review, calendarAggregator/schedule e courseRepertorio/repertorioOptions cobrem comportamentos distintos; não mesclar sem sobreposição provada.
5. Opcional: projetos do Vitest (`test.projects`) para separar domínio/UI/apps e rodar domínio em `environment: 'node'`.