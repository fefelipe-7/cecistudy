# 04 — Regras e Guardrails (Automatizados)

> Separação sem guardrails é promessa. Com guardrails, é contrato.

Estas regras implementam `split-mobile.md:194` como verificações no CI/lint/testes.

## 1. As 10 regras (fonte: `split-mobile.md:194`)

| # | Regra | Falha quando |
|---|---|---|
| 1 | `apps/mobile` nunca importa de `apps/desktop`, e vice-versa | `grep -r "from.*apps/desktop" apps/mobile` encontra algo |
| 2 | Nenhum `packages/*` importa React de cliente, UI, Tauri ou Capacitor | `packages/domain` contém `import React` ou `from '@capacitor` ou `__TAURI__` |
| 3 | Desktop não importa `ScreenLayers`, `MobileAppShell`, views mobile ou overlays mobile | `apps/desktop` contém `from.*ScreenLayers` ou `from.*MobileAppShell` ou `from.*BottomNav` |
| 4 | Mobile não importa `DesktopAppShell`, `src/desktop/**` ou estados de workspace visual | `apps/mobile` contém `from.*DesktopAppShell` ou `from.*desktop/` ou `DesktopSessionState` de `src/types.ts` |
| 5 | Cada app tem `package.json`, entrypoint, `vite.config.ts` e comando de build próprios | `apps/mobile/package.json` ou `apps/desktop/package.json` ausente |
| 6 | Alteração em `apps/desktop` roda só testes/build do desktop (exceto `packages/*`) | CI roda `test:mobile` desnecessariamente para diff só em `apps/desktop/` |
| 7 | Alteração em `apps/mobile` roda só testes/build do mobile (exceto `packages/*`) | Idem para diff só em `apps/mobile/` |
| 8 | Alteração em `packages/domain|data|sync` roda testes de contrato dos dois clientes | `packages/*` mudou e só um app foi testado |
| 9 | Tipos de domínio versionados separados de tipos de navegação/componente | Bump em `NavScreen` exige bump em `SCHEMA_VERSION` (errado) |
| 10 | Sync transporta dados, não estado de apresentação | `SyncPackage` contém `navigationStack`, `overlayKey`, `graphViewport` ou `openDocuments` |

## 2. Como implementar (incremental, sem dependência nova obrigatória)

### 2.1 Script simples (funciona hoje, sem lib nova)

```bash
# .github/scripts/check-boundaries.mjs
# Falha o CI se encontrar import proibido. Custo: ~20 linhas, zero deps.
import { execSync } from 'node:fs';
const bad = [];
const check = (dir, pattern, msg) => {
  const out = execSync(`grep -R --include="*.ts" --include="*.tsx" -n "${pattern}" ${dir} || true`, { encoding: 'utf8' });
  if (out.trim()) bad.push(`${msg}:\n${out}`);
};
check('apps/mobile', 'from.*apps/desktop', 'mobile → desktop');
check('apps/desktop', 'from.*apps/mobile', 'desktop → mobile');
check('packages/domain', 'from.*react|from.*@capacitor|__TAURI__', 'domain toca em UI/plataforma');
check('packages/sync', 'from.*react|from.*@capacitor|__TAURI__', 'sync toca em UI/plataforma');
check('apps/desktop', 'ScreenLayers|MobileAppShell', 'desktop → camadas mobile');
check('apps/mobile', 'DesktopAppShell|src/desktop', 'mobile → camadas desktop');
if (bad.length) { console.error(bad.join('\n\n')); process.exit(1); }
```

Adicione ao `release.yml` / `ci.yml`:

```yaml
- run: node .github/scripts/check-boundaries.mjs
```

### 2.2 ESLint (quando houver `eslint` no projeto)

```js
// eslint.config.js (ou .eslintrc) — boundaries por camada
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['**/apps/desktop/**'], message: 'mobile não pode importar desktop' },
        { group: ['**/apps/mobile/**'], message: 'desktop não pode importar mobile' },
      ]
    }]
  },
  overrides: [
    { files: ['packages/domain/**', 'packages/sync/**'], rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['react', '@capacitor/*', '**/src/shells/**'] }] }] } }
  ]
}
```

> Hoje `lint` é `tsc --noEmit` (ver `AGENTS.md`). O script `check-boundaries.mjs` é suficiente
> até `eslint` entrar.

### 2.3 Ferramenta de grafo (opcional, futuro)

- `madge`, `dependency-cruiser` ou `eslint-plugin-boundaries` — geram grafo e validam camadas.
- Útil quando `apps/*` e `packages/*` já existirem fisicamente.

## 3. CI por caminho (path-based)

Evita recompilar o mundo a cada PR:

```yaml
# .github/workflows/ci.yml
jobs:
  detect:
    outputs:
      mobile: ${{ steps.filter.outputs.mobile }}
      desktop: ${{ steps.filter.outputs.desktop }}
      packages: ${{ steps.filter.outputs.packages }}
    steps:
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            mobile: ['apps/mobile/**']
            desktop: ['apps/desktop/**', 'desktop/**']
            packages: ['packages/**', 'src/core/**', 'src/data/**', 'src/lib/sync/**']
  test-mobile:
    needs: detect
    if: needs.detect.outputs.mobile == 'true' || needs.detect.outputs.packages == 'true'
    steps: [{ run: npm run test --workspace=apps/mobile }]
  test-desktop:
    needs: detect
    if: needs.detect.outputs.desktop == 'true' || needs.detect.outputs.packages == 'true'
    steps: [{ run: npm run test --workspace=apps/desktop }]
  test-packages:
    needs: detect
    if: needs.detect.outputs.packages == 'true'
    steps: [{ run: npm run test --workspace=packages/domain }, { run: npm run test --workspace=packages/sync }]
```

> Enquanto `apps/*` não existem, o filtro pode mirar `src/shells/*` e `src/desktop/*`
> como proxy para "mudança desktop".

## 4. Versionamento separado

| O que muda | O que versiona | O que NÃO versiona |
|---|---|---|
| Entidade de domínio (`Project`, `Document`, `Block`) | `SCHEMA_VERSION` + `packages/contracts` | `NavScreen`, `DesktopSessionState` |
| `NavScreen` / `DesktopSessionState` | `apps/*` (semver do app) | `SCHEMA_VERSION` |
| `SyncPackage` | `protocolVersion` + `schemaVersion` no manifest | `appVersion` sozinha |

Regra prática: bump de `SCHEMA_VERSION` só quando `packages/domain` ou `packages/data`
mudam formato persistido. Navegação e UI nunca bumpam `SCHEMA_VERSION`.

## 5. Checklist de PR

Antes de mergear qualquer PR que toque em `src/` ou `packages/`:

- [ ] `grep` de boundaries passou?
- [ ] `npm run lint` verde?
- [ ] `npm run test` verde no(s) workspace(s) afetado(s)?
- [ ] `npm run build` verde no(s) workspace(s) afetado(s)?
- [ ] Se mexeu em `packages/domain|data|sync`, testou contrato nos dois apps?
- [ ] Se mexeu em `SyncPackage`, bumpou `protocolVersion` e manteve compat com leitor antigo?

## 6. O que trava quando

| Etapa do plano | Guardrail que entra |
|---|---|
| Etapa 0 | Script `check-boundaries.mjs` + regra "AppContext não recebe nova regra de negócio" |
| Etapa 1 | `workspaces` no `package.json` + CI path-based |
| Etapa 2 | `packages/domain` sem `react`/`capacitor`/`tauri` |
| Etapa 3 | `packages/data` sem UI; `SCHEMA_VERSION` só bumpa aqui |
| Etapa 5/6 | `apps/mobile` / `apps/desktop` com build/test próprios |
| Etapa 8 | `AppContext` facade + `no-restricted-imports` por app |
| Etapa 9 | `isDesktop` removido do entrypoint |
| Etapa 10 | Remoção de `src/shells/ScreenLayers.tsx` + falha se reaparecer |
