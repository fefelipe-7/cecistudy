# Capability Map — Reconstrução da Superfície Desktop

> Fase 0 do spec-driven (scope check) para a reconstrução **por cima** da superfície
> desktop do cecistudy. Aprovada antes de escrever qualquer spec de módulo.
>
> **Decisão (usuária):** "apagar o que existe e refazer por cima" — **toda a superfície desktop**,
> seguindo o plano/roadmap e as skills do projeto. Backup confirmado (sem `node_modules`,
> 70,58 MB) em `%TEMP%\opencode\backup-cecistudy-2026-09-01\cecistudy-src-backup.zip`.
>
> **Refinamento (2026-09-01): "vamos focar em reconstruir apenas o visual, sem quebrar o app inteiro
> em si."** → A reconstrução é **somente a camada de apresentação/visual** da superfície desktop.
> Toda a lógica (domínio, use-cases, estado persistente, navegação, calendário de dados, sync) é
> **preservada e reutilizada como está**. As telas são refeitas visualmente consumindo as MESMAS
> APIs (`useDesktopApp()`, `useDesktopSession()`, `useApp()`, `src/lib/schedule.ts`, `src/core/**`)
> — só muda a UI/estilo/composição, nunca o comportamento.

## 1. Contexto real do código (importante antes de apagar)

O relatório de varredura (`explore`) mostrou que **a superfície desktop JÁ está amplamente
implementada e testada** — os docs de `desktop/context-desktop/` e o roadmap estão defasados.
Estado real:

- **Arquitetura limpa:** `packages/domain/src/core/domain` (domínio), `packages/domain/src/core/ports`
  (repositórios/sync/integrações/blobs), `packages/contracts/src/serialization` — fonte da verdade
  canônica. `src/core/*` re-exporta desta (stub barrel, regra do AGENTS.md).
- **Aplicação:** `src/core/application/use-cases/` → `calendar` (`planResponsibility`,
  `scheduleEvent`), `knowledge` (`addRelation`, `acceptSuggestion`, `rejectSuggestion`),
  `marketing` (`createContentBaseUseCase`, `approve/rejectChannelVariant`),
  `projects` (`createProjectUseCase`, limite 5), `workspace` (`createWorkspaceUseCase`).
- **Apresentação desktop (33 arquivos em `src/desktop/`):** shells, screens, layouts, componentes
  — incl. `calendar/` completo (13 arquivos: semana com drag/resize/snap 30min, mês, agenda, dia,
  layers faculdade/tcc/estudos/gcal) + `KnowledgeGraphScreen`, `ProjectsScreen`, `InboxScreen`,
  `WorkspaceSwitcher`, `ContextInspector`, `CommandPalette`, `CourseMasterList`/`CourseDetailPane`,
  `SplitLayout`, `DesktopTopbar`/`DesktopSidebar`.
- **Sessão:** `apps/desktop/src/session/types.ts` (`DesktopSessionState`) + `desktopSessionState.tsx`
  (`usePersistentState('desktopSession', …)`), `DesktopAppProvider`, entrypoint próprio
  (`apps/desktop/src/app/main.tsx`).
- **Testes desktop:** `desktopShell.test.tsx`, `WorkspaceSwitcher.test.tsx`, `InboxScreen.test.tsx`,
  `desktopSession.test.tsx`, `desktop-mobile-isolation.test.ts`. **Gate atual: 500 testes verdes,
  lint limpo.**

> ⚠️ **A reconstrução refaz a CAMADA DE APRESENTAÇÃO** (`src/desktop/`, `src/shells/DesktopAppShell.tsx`,
> `src/shells/MobileAppShell.tsx`, `apps/desktop/src/*`, `src/navigation/*`). **NÃO toca** em
> `packages/*` (domínio/ports/contratos canônicos) nem na camada de aplicação — esses são a fonte
> da verdade e o build desktop depende deles. Apagá-los quebraria o monorepo inteiro.

## 2. Front de limites

> **Regra de ouro (visual-only):** nenhum arquivo de lógica, domínio, estado ou dado é MODIFICADO.
> Cada tela redesenhada consome as mesmas props/hooks/serviços e só troca apresentação (JSX/estilo/
> composição/componentes). Se um slice precisar de mudança em `src/lib/*` ou `packages/*`, pará — é
> fora de escopo.

- **Dentro do escopo (refazer SÓ o visual/presentação):** UI da casca desktop (`src/desktop/**`),
  shell desktop (`src/shells/DesktopAppShell.tsx` — só camada visual/estrutural), tokens visuais
  desktop (`src/desktop/styles/desktop-tokens.css`), sessão desktop **UI apenas** (`apps/desktop/src/session`
  e `app/main.tsx` sem trocar o modelo de dados), overlays compartilhados quando a estética exigir.
  Testes que asserem **visual** podem ser atualizados; testes de lógica ficam intactos.
- **Fora do escopo (preservar — nem ler para alterar):** `packages/domain`, `packages/application`,
  `packages/contracts`, `packages/data`, `packages/sync`, `src/core/*`, `src/data/*`,
  `src/lib/schedule.ts` (dados do calendário), `src/lib/routing.ts`, `src/context/AppContext.tsx`
  (estado), `src/context/{desktopApp,mobileApp,appContexts}.ts`, `.github/`, pipelines de release,
  apps nativos (android/ios), conteúdo/catálogo.

## 3. Mapa de capacidades (módulos)

| id | Responsabilidade | Depende de | Cronologia |
|---|---|---|---|
| `shell` | Casca desktop: sidebar, topbar, statusbar, atalhos, área central, overlays | colunas de layout, styled primitivos | 1 (fundação) |
| `navegacao` | Pilha/slides de tela desktop + navegação por atalhos/command palette | `shell` | 1 (junto do shell) |
| `faculdade` | Master-detail de disciplinas (lista + painel de detalhe), aulas/avaliações/repertório | `shell`, `navegacao` | 2 |
| `calendario` | Calendário desktop (semana/dia/mês/agenda, layers, drag/resize, gcal) | `shell`, `navegacao` | 3 |
| `conhecimento` | Grafo de conhecimento, docs/documentos, blocos | `shell`, `navegacao` | 4 |
| `marketing` | Documentos/conteúdo de divulgção, canais, publicações | `shell`, `navegacao` | 4 |
| `projetos` | Projetos/TCC (project, outputs, referências) | `shell`, `navegacao` | 5 |
| `inbox` | Caixa de entrada (sugestões/relações) | `shell`, `navegacao` | 5 |
| `sessao` | `DesktopSessionState` (íamos, painéis, módulo ativo, densidade, canvasClarity) | — | acontece durante todos |

Dependência direcional (sem ciclos): `shell → navegação → {faculdade, calendario} → {conhecimento,
marketing} → {projetos, inbox}`. `sessao` corre em paralelo a todos.

## 4. Ordem de build (slices verticais)

```
sessao (persistência já existe — validar) ─┐
shell + navegacao (fundação) ──────────────┼→ faculdade → calendario → conhecimento/marketing → projetos/inbox
                                          │
    (ao final de cada módulo: gate verde)
```

1. **shell + navegacao** — refazer cuba desktop (sidebar/topbar/statusbar/atalhos/overlays).
2. **faculdade** — master-detail disciplinas.
3. **calendario** — o módulo mais complexo já implementado; refazer por cima do `src/lib/schedule.ts`.
4. **conhecimento + marketing** — grafo + documentos (módulo B do roadmap).
5. **projetos + inbox** — projetos/TCC + caixa de entrada (módulos D/E/C do roadmap).

> Paralelismo: `faculdade` e `calendario` podem trabalhar após a fundação; `conhecimento/marketing`
> em paralelo; `projetos/inbox` por último. Cada slice termina com `npm run lint` + `npm run test`
> verdes.

## 5. Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Destruir camada canônica (`packages/*`) | `check-boundaries.mjs` + limite explícito acima; nunca editar `packages/*` nesta reconstrução |
| Mudar comportamento ao mexer no visual (ex.: drag/resize) | **Visual-only**: só trocar apresentação; lógica de interação reusada do `src/lib/schedule.ts` e Ctrl/drag **não são alterados** |
| Perda de funcionalidade já testada (calendário com drag/resize) | Reusar a lógica de dados (`src/lib/schedule.ts`) como fonte; backup zip já criado |
| 500 testes quebrados durante rebuild | Gate por slice: só declara slice "feito" com lint+test+build verdes; testes visuais atualizados só se refletirem a nova UI |
| Docs ainda mais defasados | Atualizar `.context/*` e o roadmap ao fechar cada módulo |
| Escopo "toda a superfície" vago | Mapa acima define fronteiras exatas; specs por módulo |

## 6. Gate de cada slice

- [ ] `npm run lint` (tsc --noEmit) limpo
- [ ] `npm run test` verde (mantém os 500+ / novos testes do slice)
- [ ] `npm run build` gera `dist/` sem erro
- [ ] `node .github/scripts/check-boundaries.mjs` sem violação (se tocar `src/shells` ou `src/desktop`)
- [ ] Rodar desktop dev (`?platform=desktop` ou `apps/desktop` build) e conferir visual/funcional

---

**Aprovado por (humano):**
- [x] Mapa revisado e aprovado (módulos, dependências, ordem, limites)
- [x] **Escopo refinado: visual-only** — reconstruir só a apresentação da superfície desktop, preservando toda a lógica
- [x] **Direção visual aprovada: "refino do Notion-like atual"** — manter a estética clean/calorosa-fluída (`cecistudy-desktop-shell.json`), refinar tipografia (escala + pesos), elevação (hierarquia por sombra), densidade/contraste de zonas e consistência de tokens/radius; **sem identidade nova, sem serifa editorial, sem dark**; calor (rosa) restrito a Home/feedback, rosa nunca fundo de painel
- [x] Próximo passo: escrever os specs dos módulos `shell`+`navegacao` (Fase 1), depois os demais

## 7. Status de implementação

| Módulo | Spec | Status |
|---|---|---|
| `shell` | `desktop/spec/SPEC-VISUAL-01-shell.md` | ✅ **implementado** (tokens, sidebar com estados/badges, busca única ⌘K, breadcrumb, popover de preferências, WorkspaceSwitcher/Panel/StatusBadge, statusbar) — gate: lint ✓, test ✓, build ✓, boundary ✓, sem hex em classe ✓ · aguarda revisão manual dev e aprovação da usuária |
| `navegacao` | `desktop/spec/SPEC-VISUAL-01-shell.md` (Task 8) | ✅ **implementado junto do shell** + **transições refinadas**: `src/desktop/lib/screenTransition.ts` (`computeDesktopSlideKey` — focar disciplina não recria a tela inteira; `desktopScreenVariants`/`desktopOverlayVariants` com crossfade + micro subida, curva `[0.22,1,0.36,1]`, `prefers-reduced-motion`) · gates verdes · aguarda aprovação |
| `faculdade` | `desktop/spec/SPEC-VISUAL-02-faculdade.md` | ✅ **implementado** (master-detail: card ativo neutro + accent rosa pontual, metadata compacta, moldura da pane de abas, hover/focus por tokens) — gates verdes · aguarda aprovação |
| `calendario` | — | pendente |
| `conhecimento` | — | pendente |
| `marketing` | — | pendente |
| `projetos` | — | pendente |
| `inbox` | — | pendente |
