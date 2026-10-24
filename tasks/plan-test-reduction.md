# Plano de Redução e Organização de Testes

Objetivo: reduzir ~1.5k testes, eliminar render-only/duplicados, mover utilitários de domínio.

## Fases

### Fase 1 – Auditoria
- Listar todos `src/**/*.test.{ts,tsx}`
- Classificar por tipo: render-only, integração, utilitário, snapshot
- Identificar duplicatas por componente genérico (Card, Pill, Hero)
- Identificar testes em `src/lib/__tests__` que testam domínio

Critério de aceite: relatório `tasks/audit-testes.md` com contagem por categoria e lista de candidatos a merge/remoção.

### Fase 2 – Parametrização de componentes genéricos
- Agrupar testes de componentes UI genéricos (Card, PillGroup, HeroCard, etc.) em suites parametrizadas
- Remover testes de render puro sem assert funcional

Critério: redução >=15% testes UI, `npm run test:ui` verde.

### Fase 3 – Migração de utilitários de domínio
- Mover testes de `src/lib/__tests__` que testam lógica pura para `packages/*/__tests__`
- Atualizar imports relativos
- Remover re-export duplicada

Critério: `src/lib/__tests__` só contém testes de integração UI/persistência; domínio 100% em packages.

### Fase 4 – Corte de testes lentos/flaky
- Marcar slow >500ms
- Eliminar snapshots desnecessários
- Consolidar testes de routing/navigation

Critério: `npm run test:domain` <30s, `npm run test:ui` <2min.

## Entregáveis
- `tasks/audit-testes.md`
- `tasks/todo-test-reduction.md` com itens verificáveis
- Gate verde: `npm run lint && npm run test:domain && npm run test:ui`
