# 05 — Critérios de Aceite

> Quando a separação pode ser considerada concluída.
> Cada critério tem um **teste de aceitação** executável.

## 1. Tabela de aceite (fonte: `split-mobile.md:210`)

| Critério | Teste de aceitação |
|---|---|
| **Alteração desktop não atravessa mobile** | 1) Editar `apps/desktop/src/components/DesktopSidebar.tsx` (cor, rota, fluxo). 2) Rodar `npm run build --workspace=apps/mobile` e `npm run test --workspace=apps/mobile`. 3) Build/test mobile **não** recompila nem importa arquivo desktop; `grep -R "apps/desktop" apps/mobile` vazio. |
| **Alteração mobile não atravessa desktop** | 1) Editar `apps/mobile/src/screens/FaculdadeView.tsx` (ou `navigation/stack.ts`). 2) Rodar `npm run build --workspace=apps/desktop`. 3) Build desktop **não** carrega código mobile; `grep -R "apps/mobile" apps/desktop` vazio. |
| **Dados continuam compatíveis** | 1) Criar um `Document` no desktop (`createDocument` via `DataClient`). 2) Gerar `SyncPackage` e aplicar no mobile (merge). 3) O documento aparece na projeção mobile (consulta compacta) sem conversão manual; `backupDataSchema` valida o payload. |
| **Estado visual permanece independente** | 1) Abrir 2 documentos + `activePanels=['graph','calendar']` + `graphViewport={x:10,y:20,zoom:1.2}` no desktop. 2) Verificar `apps/mobile` — `navigationStack`, `isBottomNavVisible`, `overlayKey` não mudaram; `SyncPackage` não contém `openDocuments`/`graphViewport`. |
| **Core permanece agnóstico** | 1) `cd packages/domain && npx tsc --noEmit`. 2) Compila sem `dom`, `react`, `@capacitor/*`, `__TAURI__`. 3) `grep -R "react\|capacitor\|__TAURI__" packages/domain` vazio. |
| **Sync permanece estável** | 1) Dois clientes com `protocolVersion` diferentes mas compatíveis trocam `SyncPackage` versionado. 2) `checkRevision` (compare-and-swap) rejeita sobrescrita de revisão mais nova; `merge` LWW + tombstones preserva deleção. 3) Pacote corrompido falha em `verifyIntegrity` sem corromper banco local. |
| **Builds são independentes** | 1) `npm run build --workspace=apps/mobile` gera `apps/mobile/dist`. 2) `npm run build --workspace=apps/desktop` gera `apps/desktop/dist`. 3) Nenhum depende do `dist/` do outro; `desktop/src-tauri/tauri.conf.json` aponta para `apps/desktop/dist`. |
| **Migrações são reversíveis** | 1) Exportar backup v12 (`exportAppDatabase`). 2) Importar em app v13 (`importAppDatabase` com `MIGRATIONS[13]`). 3) Re-exportar e comparar — dados compartilhados idênticos; estado visual (`DesktopSessionState`, `navigationStack`) **não** viajou no backup. |

## 2. Testes que precisam existir

| Teste | Onde vive | O que valida |
|---|---|---|
| `routing.test.ts` | `packages/data` ou `apps/mobile` | `parseRoute`/`routeToStack`/`stackToHash` não quebram deep-link após separação |
| `exportImport.test.ts` | `packages/data` | round-trip backup, schema 6→13, payload inválido, coleção malformada, `.passthrough()` |
| `sync/merge.test.ts` | `packages/sync` | LWW, tombstone vs. vivo, revisão remota mais nova, conflito em campos distintos, retry sem duplicar |
| `domain/invariants.test.ts` | `packages/domain` | 5 projetos ativos, `RelationKind` semântica→Inbox, `CapabilityMatrix` |
| `check-boundaries.test.ts` | raiz | falha se `apps/mobile` importar `apps/desktop` e vice-versa |
| `capability.test.ts` | `packages/domain` | `canView/canCreate/canEdit/canDelete/projection` por plataforma/entidade |

Gatilho comum (ver `AGENTS.md`):

```bash
npm run lint
npm run test
npm run build
```

Todos verdes, em cada workspace afetado.

## 3. Critérios de saúde arquitetural (além da tabela)

A separação está saudável quando também for verdade:

- [ ] O desktop tem navegação e densidade próprias (master-detail, painéis, `CommandPalette`) sem `BottomNav`/`FAB`.
- [ ] O mobile continua simples (captura, agenda compacta, consulta) sem editor paginado.
- [ ] O mesmo `Course`/`Document` tem projeções diferentes: mobile compacta, desktop rica.
- [ ] `AppContext` não recebe novas regras complexas (só facade/compat).
- [ ] Workspaces isolados por padrão (`workspaceId` em todas as entidades sincronizáveis).
- [ ] Cada entidade tem dono e proveniência (aula ≠ documento ≠ TCC — relação tipada).
- [ ] Home conecta módulos sem substituir nenhum deles.
- [ ] Graph navegável e explicável (filtros por módulo/projeto/período/profundidade).
- [ ] Calendário separa `Event` / `Responsibility` / `PlanningBlock` / `ExecutionRecord`.
- [ ] TCC suporta DOCX reimportável com comparação (sem sobrescrita silenciosa).
- [ ] Marketing separa `ContentBase` de `ChannelVariant` (aprovação por canal).
- [ ] GitHub substituível por outro `SyncProvider` sem reescrever domínio.
- [ ] Revisão nova nunca sobrescrita silenciosamente (`checkRevision`).
- [ ] Backup/restore fora do provider (formato próprio do cecistudy).
- [ ] IA só com contexto compilado (`.cectx`/`KnowledgePacket`) e autorização.

## 4. Quando considerar "feito" para liberar F5+

A fundação (Document & Blocks, Graph, Calendário, TCC, Marketing) só deve começar
**depois** que os 8 critérios da tabela estiverem verdes. O próximo commit depois
disso já deve criar o primeiro `Document` via `DataClient` + `DesktopAppProvider`,
não via `useApp()` universal.

## 5. Como demonstrar

Para cada critério, grave:

1. comando rodado (`npm run test --workspace=...`)
2. saída (hash do bundle, `grep` vazio, `tsc` sem erros)
3. evidência de que o outro app não foi afetado (cache hit no CI, bundle hash estável)

Sem evidência, o critério não está cumprido.
