# 06 — Riscos e Mitigações

> O que pode quebrar durante a separação e como voltar atrás sem perder dados.

## 1. Matriz de riscos

| Risco | Probabilidade | Impacto | Mitigação | Plano de rollback |
|---|---|---|---|---|
| **Perda/corrupção de dados ao mover schema** | Média | Alto | Backup validado antes de cada bump `SCHEMA_VERSION`; `MIGRATIONS` idempotentes; `backupDataSchema` com `.passthrough()` para campos legados; teste `exportImport.test.ts` cobre round-trip e schema 6→atual | Restaurar backup v12 (arquivo JSON) via `importAppDatabase`; o app recusa `SCHEMA_VERSION` futuro |
| **Divergência de tipos entre apps** | Média | Alto | `packages/domain` como fonte única; `contracts` versionados (Zod); `domain` sem `NavScreen`/`DesktopSessionState` | Re-export temporário (`src/types.ts` re-exporta `packages/domain`) até estabilizar |
| **Sync quebra entre versões** | Média | Alto | `SyncPackage` com `schemaVersion`/`protocolVersion`/`revision`/`parentRevision`; `checkRevision` (compare-and-swap); `verifyIntegrity`; testes de conflito | Fallback para snapshot: exportar `packages/data` como JSON e importar no outro dispositivo (fora do provider) |
| **Tauri build quebra (Windows, WebView2, WiX/NSIS)** | Média | Médio | Manter `desktop/` atual como fallback até `apps/desktop/src-tauri` estabilizar; CI `release.yml` já builda `desktop` separadamente; toolchain `llvm-mingw` documentado em `desktop/README.md` | Voltar `frontendDist` para `../../dist` e buildar pela raiz (bundle único) |
| **Capacitor sync quebrado (SQLite, Preferences, permissões)** | Baixa | Médio | `DataClient` com driver injetável; `storage.ts` dual já testado (`storage.test.ts`); `userDb.ts` isolado | Fallback para `localStorage` no web/PWA; nativo continua com `Preferences` até SQLite migrar |
| **Regressão visual (tokens vs. hex)** | Alta | Baixo | `design-tokens` compartilhado (`src/index.css` `@theme`); proibir `-[#hex]` em classNames via `migrate-tokens.mjs` já usado; `desktop:*` variant por `data-platform` | Reverter commit de token (`git revert`) — sem impacto em dados |
| **Fadiga de migração (mover tudo de uma vez)** | Alta | Médio | Plano em 10 etapas; cada uma sem mudança visual; PRs pequenos (1 view/provider por PR); facade `AppContext` por 1–2 releases | Feature flag: `USE_NEW_PROVIDERS=false` (ou simplesmente não remover `AppContext` até 100% migrado) |
| **Duplicação temporária (`ScreenLayers`/`GlobalOverlays`)** | Certa | Baixo | Duplicação **proposital** nas Etapas 6–7; remover só na Etapa 10 quando ninguém mais importa | Manter `src/shells/ScreenLayers.tsx` até `apps/*` provarem independência |

## 2. Estratégias de mitigação em detalhe

### 2.1 Dados nunca se perdem

- **Antes de qualquer bump:** `npm run build` → exportar backup JSON (`exportAppDatabase`) e guardar fora do repo.
- **Migração idempotente:** `MIGRATIONS[12]` e seguintes devem poder rodar duas vezes sem duplicar `workspaceId` ou `SyncIndex`.
- **Validação Zod:** `backupDataSchema` rejeita payload malformado **antes** de tocar no banco; `importAppDatabase` faz `merge` com `emptyDatabase()` para coleções ausentes.
- **Proveniência:** `legacySourceId` em Document/Block para rastrear `looseNotes`/`ClassNote` migrados.

### 2.2 Sync nunca sobrescreve silenciosamente

```
local conhece remoto = 127
local tenta publicar baseado em 127

se remoto == 127 → publica 128
se remoto == 128 → rejeita, baixa estado novo, faz merge ou pede resolução
```

- Implementado por `checkRevision` + `stamps`/`tombstones` em `SyncIndex`.
- Blobs (PDF, imagem, DOCX) separados de dados estruturados (`BlobProvider`).

### 2.3 Builds nunca se bloqueiam

- Enquanto `apps/*` não existem fisicamente, `npm run build` na raiz continua sendo o build oficial.
- Quando existirem, `package.json` raiz orquestra:

```json
{
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build:mobile": "npm run build --workspace=apps/mobile",
    "build:desktop": "npm run build --workspace=apps/desktop",
    "build": "npm run build:mobile && npm run build:desktop"
  }
}
```

- CI path-based (ver `04-regras`) roda só o workspace afetado.

### 2.4 Tauri e Capacitor coexistindo

- `window.__TAURI_INTERNALS__` (`platform.ts:36`) e `Capacitor.isNativePlatform()` continuam funcionando — cada um só no seu app.
- `tauriGlobal()` (`platform.ts:39`) retorna `null` fora do desktop; `isNativePlatform` retorna `false` no desktop/web.
- Preview `?platform=desktop` continua para iterar UI desktop sem compilar Tauri.

## 3. Ordem que minimiza risco

```
F0 (backup) → F1 (domain puro) → F2 (ports/use-cases) → F3 (workspaceId)
      │
      └─► Separação (Etapas 0–4: fronteiras) ──► Etapas 5–7: entrypoints + overlays
              │
              └─► Etapa 8: quebrar AppContext ──► 9: builds independentes ──► 10: remover pontes
                      │
                      └─► só então F5+ (Documents, Graph, Calendário, TCC, Marketing)
```

> Se o editor paginado, o calendário semanal ou o Marketing Studio entrarem antes da
> Etapa 8, o risco de acoplamento volta a "alto" e a mitigação vira reescrita.

## 4. O que NÃO fazer

- Não criar segunda versão de `AppContext` só para desktop (duplica regras, quebra sync).
- Não colocar token do GitHub no bundle/APK/executável (credenciais revogáveis em storage seguro).
- Não tratar repositório GitHub como banco SQL.
- Não substituir SQLite inteiro sem revisão.
- Não confiar só na regra "um dispositivo edita por vez" (a verificação de `revision` continua obrigatória).
- Não transformar todas as relações em links automáticos.
- Não fazer IA escrever documentos completos sem confirmação.
- Não importar eventos do Google como editáveis no cecistudy.
- Não começar por Graph visual ou editor paginado sem contratos de domínio.

## 5. Sinais de alerta

PARE e reavalie se:

- Um PR altera `src/context/AppContext.tsx` **e** `src/shells/ScreenLayers.tsx` ao mesmo tempo para uma feature nova (deveria estar em `packages/domain` + `apps/*`).
- `grep -R "apps/desktop" apps/mobile` ou vice-versa retorna algo.
- `packages/domain` importa `react`, `@capacitor/*` ou `window`.
- `SCHEMA_VERSION` bumpou porque `NavScreen` mudou (deveria ser bump de app, não de schema).
- `SyncPackage` contém `navigationStack` ou `graphViewport`.
- Um teste de `merge` falhou após mudança em `DataClient`.
