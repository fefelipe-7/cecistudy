# Spec: Inbox, Grafo de Conhecimento e Projetos/TCC (Desktop)

> Parte do plano de separação de interface mobile/desktop do cecistudy.
> Documento irmão de `00-relatorio-varredura.md` (seções 1.7, 1.8, 1.9, 2.1, 2.3).
> Estado canônico de sessão desktop: `apps/desktop/src/session/types.ts` (`DesktopSessionState`).

**Status:** especificação (não implementado).
**Audiência:** engenharia desktop (Tauri) + dono do `packages/data` (DataClient).
**Critério-gate de separação (2.1 / 2.3 do relatório):** nenhum estado de visualização
desktop (`openDocuments`, `graphViewport`, `selectedGraphNodeId`, painéis, filtros de inbox,
viewport de grafo) pode entrar no `SyncPackage`; telas desktop NUNCA são resolvidas na camada
compartilhada `src/shells/ScreenLayers.tsx`; `check-boundaries.mjs` deve continuar verde.

---

## 0. Visão geral e premissas

### 0.1 Premissas (confirmar antes de implementar)
1. As telas `InboxScreen`, `KnowledgeGraphScreen`, `ProjectsScreen` JÁ existem em
   `src/desktop/components/*` e hoje são abertas via `app.isInboxOpen` / `app.isKnowledgeGraphOpen`
   / `app.isProjectsOpen` — flags **derivadas do topo da pilha universal** (`currentScreen.kind === 'inbox'|'knowledge-graph'|'projects'`, ver `AppContext.tsx:758-760`).
2. O relatório (2.1) determina que essas telas devem sair da pilha universal e ser resolvidas
   **dentro da shell desktop** (`DesktopScreenLayers`), para que mobile nunca carregue seus chunks.
3. `projects`/`outputs` já existem no `AppContext` com stamp `workspaceId` e invariante de 5
   projetos ativos (`createProjectUseCase`, `AppContext.tsx:635-660`). Eles são **dados
   sincronizados** (fazem parte do `SyncPackage`), ao contrário do estado visual.
4. Tokens desktop-only vivem em `src/desktop/styles/desktop-tokens.css` (`--ds-*`), isolado no
   bundle Tauri; web não o inclui. Reuso de matiz é obrigatório (hardConstraint do
   `cecistudy-desktop-shell.json`).
5. `suggestions` (inbox) vive no `DataClient` com stamp `workspaceId` (`AppContext.tsx:586`);
   é dado sincronizado, não estado de sessão.

### 0.2 Objetivo comum
Destacar Inbox, Grafo e Projetos como **módulos desktop de primeira classe**, com estado visual
próprio persistido em `DesktopSessionState`, resolvidos fora da camada compartilhada, e prontos
para os editores paginados (M4) e citações ABNT (1.15.3 / 1.15.5 do relatório).

### 0.3 Estrutura de arquivos afetada
```
src/desktop/components/        → telas/componentes desktop (existentes, evoluem)
src/desktop/screens/           → DesktopScreenLayers.tsx (resolução desktop-only)
apps/desktop/src/session/types.ts   → DesktopSessionState (extensão)
apps/desktop/src/DesktopAppProvider.tsx → dono do estado de sessão desktop
src/context/AppContext.tsx     → REMOVER flags/kinds desktop da pilha universal
src/lib/routing.ts             → REMOVER kinds 'inbox'/'knowledge-graph'/'projects'
src/shells/ScreenLayers.tsx    → desconhecer telas desktop
desktop/spec/03-inbox-grafo-projetos.md → este documento
```

### 0.4 Comandos (verificação)
```
# typecheck/lint
npm run lint
# testes (vitest, jsdom)
npm run test -- src/desktop/components/__tests__
# boundary gate (obrigatório ao tocar DesktopSessionState / packages)
node .github/scripts/check-boundaries.mjs
# build web (não deve puxar chunks desktop)
npm run build
```

---

## 1. Inbox (triagem de conhecimento)

> Fonte: relatório 1.7. Tela existente: `src/desktop/components/InboxScreen.tsx`.

### 1.1 Problema
A curadoria de sugestões de conhecimento (relações, conceitos, autores, técnicas) hoje é uma
lista simples com aceitar/rejeitar. Falta: (a) filtro por **tipo** (conceito/autor/técnica/leitura)
e por **workspace**; (b) **ação em lote** (aceitar/arquivar várias de uma vez); (c) **vincular a
projeto ou documento** (a sugestão vira nó no Grafo e/ou entrada no TCC); (d) o estado de filtro
e de triagem não persiste entre sessões desktop. Além disso a tela é aberta por flag universal
(`isInboxOpen`), acoplando a camada compartilhada ao desktop.

### 1.2 Metas
- Triagem com aceitar / arquivar / **vincular a projeto ou documento**.
- Filtros por tipo de sugestão e por workspace (já tem `workspaceId`).
- Ações em lote (multi-seleção + barra de ação).
- Persistir `inboxFilter` e `inboxSelection` em `DesktopSessionState`.

### 1.3 UX desktop proposta
- **Master** (`SplitLayout`, `masterWidth≈300`): barra de filtros (tipo: todas/conceito/autor/
  técnica/leitura; status: todas/pendente/aceita/rejeitada) + lista com checkbox de seleção
  múltipla + contador de pendentes.
- **Detail**: payload atual + ações **aceitar**, **arquivar** (`reject` vira "arquivar" no tom
  acolhedor), e novo botão **vincular** que abre um pequeno picker de `projects`/`outputs` ativos
  (invariante de 5) — ao vincular, chama `createOutput` ou anexa referência ao projeto alvo.
- **Barra de ação em lote** (aparece quando ≥1 selecionado): aceitar tudo / arquivar tudo /
  vincular tudo (abre picker único).
- Estado de filtro e seleção sobrevivem a reabertura (em `DesktopSessionState`).

### 1.4 Componentes / arquivos
| Ação | Arquivo | Notas |
|---|---|---|
| **Mudar** | `src/desktop/components/InboxScreen.tsx` | adicionar filtro por tipo, multi-seleção, barra em lote, botão "vincular" |
| **Criar** | `src/desktop/components/InboxLinkPicker.tsx` | picker de projeto/documento destino (modal leve) |
| **Mudar** | `src/desktop/screens/DesktopScreenLayers.tsx` | resolver `<InboxScreen/>` por `session.inboxOpen` (ver 1.6) |
| **Mudar** | `apps/desktop/src/DesktopAppProvider.tsx` | injetar handlers de inbox na sessão desktop |
| **Mudar** | `apps/desktop/src/session/types.ts` | campos `inboxOpen`, `inboxFilter`, `inboxSelection` (ver 1.5) |

### 1.5 Estado desktop-specific em `DesktopSessionState`
```ts
// (adicionar a DesktopSessionState — NÃO sincronizado, não entra no SyncPackage)
inboxOpen: boolean;                 // substitui app.isInboxOpen (pilha universal)
inboxFilter: { type: 'all' | 'concept' | 'author' | 'technique' | 'reading'; status: 'all' | 'pending' | 'accepted' | 'rejected' };
inboxSelection: string[];           // ids selecionados para ação em lote
```
`workspaceId` usado nos filtros vem de `currentWorkspaceId` (já no `AppContext`, stamp de dado).

### 1.6 Tokens
- Superfícies: `--ds-surface-canvas`, `--ds-surface-raised`, `--ds-surface-inspector`.
- Texto: `--ds-text-primary/secondary/muted`.
- Bordas: `--ds-border-subtle/default/strong`, `--ds-border-focus` (seleção).
- Status (reuso de matiz): `--ds-status-success` (aceita), `--ds-status-warning` (pendente),
  `--ds-status-danger` (arquivada), `--ds-accent` (ação primária).
- Raios: `--ds-radius-md` (10px) itens, `--ds-radius-lg` (16px) cards. Teto = 20px (`--ds-radius-xl`).
- Elevação: `--ds-elevation-sm` para a barra em lote flutuante.
- **Proibido** por hardConstraint: rosa como fundo de painel, `shadow-xl`, `backdrop-blur`,
  `paper-texture`, bounce tátil.

### 1.7 Critérios de aceite
- [ ] Abrir inbox via sidebar desktop NÃO altera `navigationStack` do mobile (ver critério 2.1).
- [ ] Filtro por tipo reduz a lista corretamente; contador de pendentes atualiza.
- [ ] Multi-seleção + "aceitar tudo" chama `acceptSuggestion` para cada id e limpa seleção.
- [ ] "Vincular" cria/atualiza `output` num projeto ativo (respeita invariante de 5).
- [ ] `inboxFilter` e `inboxSelection` persistem ao fechar/reabrir o painel desktop.
- [ ] `SyncPackage` não contém `inboxOpen`/`inboxFilter`/`inboxSelection` (`check-boundaries` ok).
- [ ] Web build não importa `InboxScreen` (chunk só no Tauri).

### 1.8 Como remover a parte mobile compartilhada
1. Em `src/lib/routing.ts`: remover os `NavScreen` kinds `'inbox'` (e derivação em
   `routeToStack`/`stackToHash`).
2. Em `src/context/AppContext.tsx`: remover `isInboxOpen` (linha 760) e o branch que empilha
   `{ kind: 'inbox' }` (linha ~1817-1819). A abertura passa a ser `session.inboxOpen`.
3. Em `src/shells/ScreenLayers.tsx:162-165`: remover o ramo `app.isInboxOpen ? <InboxScreen/>`.
4. A resolução vai para `DesktopScreenLayers` (import dinâmico de `InboxScreen`).
5. `app.openInbox`/`closeInbox` (se existirem) são substituídos por setters de `DesktopSessionState`
   expostos via `useDesktopApp()`.

---

## 2. Knowledge Graph (grafo de conhecimento)

> Fonte: relatório 1.8. Tela existente: `src/desktop/components/KnowledgeGraphScreen.tsx`.

### 2.1 Problema
O grafo é interativo mas **sem memória de viewport** (recentraliza a cada abertura), sem
**seleção que sincronize com o `ContextInspector`**, sem **filtros por domínio (12)** nem por
curso, e sem **modo foco** (destacar vizinhança) nem **minimapa**. O viewport e a seleção são
estado puramente visual que hoje não persiste — exatamente o que `DesktopSessionState` deve conter.

### 2.2 Metas
- Viewport persistido (`{x,y,zoom}`) restaurado ao reabrir.
- Seleção de nó → sincroniza com `ContextInspector` (já colapsável em `src/desktop/components/ContextInspector.tsx`).
- Filtros por domínio (12 do templo) e por curso.
- Modo foco (realce de vizinhança) + minimapa.

### 2.3 UX desktop proposta
- **Canvas principal** (SVG/canvas) com pan/zoom; viewport lido de `session.graphViewport` no
  mount e gravado (throttled) no fim do gesto.
- **Seleção:** clique no nó seta `session.selectedGraphNodeId`; `ContextInspector` (já montado na
  shell) lê esse id e mostra o contexto do conceito/autor/técnica + relações.
- **Filtros** (chips na topbar do grafo): 12 domínios + "todos os domínios"; lista de cursos do
  workspace (multi-toggle). Nós fora do filtro ficam esmaecidos (não removidos) para manter a
  topologia.
- **Modo foco:** botão que, com nó selecionado, escurece não-vizinhos e destaca arestas da
  vizinhança de 1º grau.
- **Minimapa:** canto inferior direito, quadro da viewport atual sobre o bounding box do grafo.

### 2.4 Componentes / arquivos
| Ação | Arquivo | Notas |
|---|---|---|
| **Mudar** | `src/desktop/components/KnowledgeGraphScreen.tsx` | viewport persistido, seleção→inspector, filtros, foco, minimapa |
| **Criar** | `src/desktop/components/GraphFilters.tsx` | chips de domínio (12) + cursos |
| **Criar** | `src/desktop/components/GraphMinimap.tsx` | minimapa (SVG leve) |
| **Mudar** | `src/desktop/components/ContextInspector.tsx` | ler `selectedGraphNodeId` da sessão desktop |
| **Mudar** | `src/desktop/screens/DesktopScreenLayers.tsx` | resolver `<KnowledgeGraphScreen/>` por `session.graphOpen` |
| **Mudar** | `apps/desktop/src/session/types.ts` | `graphOpen`, `graphFilters` (ver 2.5) |

### 2.5 Estado desktop-specific em `DesktopSessionState`
```ts
// (adicionar — estado visual, NÃO sincronizado)
graphOpen: boolean;                 // substitui app.isKnowledgeGraphOpen
graphViewport: { x: number; y: number; zoom: number };  // já existe no tipo
selectedGraphNodeId?: string;       // já existe no tipo
graphFilters: {
  domains: string[];                // ids dos 12 domínios do templo; [] = todos
  courseIds: string[];              // filtro por curso; [] = todos
  focusMode: boolean;               // modo foco ativo
};
```

### 2.6 Tokens
- Canvas: `--ds-surface-canvas`; nós por domínio usam `--ds-domain-*` (`conhecimento`,
  `tcc`, `calendario`, `marketing`, `estudos`, `externo`) — matiz reusado, sem novas cores.
- Arestas: `--ds-border-default`; realce de foco usa `--ds-accent-strong`.
- Inspector: `--ds-surface-inspector`.
- Texto: `--ds-text-*`. Raios: `--ds-radius-md` nos chips de filtro.

### 2.7 Critérios de aceite
- [ ] Reabrir o grafo restaura `x/y/zoom` exatos de `session.graphViewport`.
- [ ] Selecionar nó atualiza `ContextInspector` sem recarregar a tela.
- [ ] Filtrar por 2 domínios + 1 curso esmaece os nós fora do conjunto; contagem visível.
- [ ] Modo foco reduz opacidade dos não-vizinhos; minimapa reflete a viewport.
- [ ] `graphViewport`/`selectedGraphNodeId`/`graphFilters` NÃO estão no `SyncPackage`.
- [ ] Web build não importa `KnowledgeGraphScreen`.

### 2.8 Como remover a parte mobile compartilhada
1. `src/lib/routing.ts`: remover kind `'knowledge-graph'`.
2. `src/context/AppContext.tsx`: remover `isKnowledgeGraphOpen` (linha 758) e o push correspondente.
3. `src/shells/ScreenLayers.tsx:154-157`: remover ramo `app.isKnowledgeGraphOpen ? <KnowledgeGraphScreen/>`.
4. Resolução move para `DesktopScreenLayers` (import dinâmico).
5. `openGraph`/`closeGraph` viram setters de `session.graphOpen`.

---

## 3. Projects / TCC (produção acadêmica)

> Fonte: relatório 1.9 + 1.15.3 (Documents M4) + 1.15.5 (ABNT/DOCX). Tela existente:
> `src/desktop/components/ProjectsScreen.tsx`. Dados `projects`/`outputs` no `AppContext`
> (stamp `workspaceId`, invariante 5 ativos).

### 3.1 Problema
Gestão de projetos existe (criar/atualizar projeto, criar/atualizar/deletar `output`), mas falta:
(a) **árvore acadêmica livre** (capítulos/subcapítulos) por projeto; (b) **editor visual paginado**
(M4) acoplado; (c) **citações/referências ABNT** e **versões do documento**. Há ambiguidade sobre
o que é dado sincronizado (`projects`/`outputs`/conteúdo dos documentos) vs estado visual desktop
(painel aberto, documento ativo, modo de editor).

### 3.2 Metas
- Árvore de capítulos/subcapítulos por projeto (modelo em árvore, livre).
- Editor paginado acoplado (M4) — tela futura `DocumentsScreen`; nesta spec definimos o contrato
  de estado e a abertura de documento.
- Citações ABNT + versionamento do documento (contrato de dados; engine em fase posterior).
- Separar claramente: **sincronizado** (conteúdo do projeto/documento) vs **desktop-specific**
  (painel aberto, documento em foco, modo de visualização).

### 3.3 UX desktop proposta
- **ProjectsScreen** (master): lista de projetos ativos (badge "X de 5") + seletor de projeto.
  Ao abrir um projeto, mostra **árvore de capítulos** (master secundário) + painel de saídas
  (`outputs`) e botão "abrir editor" (abre `DocumentsScreen` via `session.openDocuments`).
- **Árvore acadêmica:** componente `ProjectTree` (criar/renomear/mover/indentar nós
  capítulo↔subcapítulo). Persistida em `project.tree` (dado sincronizado).
- **Editor (M4, posterior):** `DocumentsScreen` lê `session.activeDocumentId` e renderiza o
  documento paginado; blocos (parágrafo/título/tabela/citação/código) são dado sincronizado.
- **Citações ABNT:** `output.references[]` (dado sincronizado) + inserção de citação pelo editor;
  geração de bibliografia fica para a engine DOCX (1.15.5).
- **Versões:** `output.versions[]` (snapshot imutável por "salvar versão"); dado sincronizado.

### 3.4 Componentes / arquivos
| Ação | Arquivo | Notas |
|---|---|---|
| **Mudar** | `src/desktop/components/ProjectsScreen.tsx` | árvore + abertura de documento via sessão |
| **Criar** | `src/desktop/components/ProjectTree.tsx` | árvore livre de capítulos/subcapítulos |
| **Criar** (fase M4) | `src/desktop/screens/DocumentsScreen.tsx` | editor paginado; lê `session.activeDocumentId` |
| **Mudar** | `apps/desktop/src/DesktopAppProvider.tsx` | injetar `openDocument`/`closeDocument` |
| **Mudar** | `apps/desktop/src/session/types.ts` | `projectsOpen`, `activeDocumentId` (ver 3.5) |

### 3.5 Estado desktop-specific em `DesktopSessionState`
```ts
// (adicionar — visual, NÃO sincronizado)
projectsOpen: boolean;              // substitui app.isProjectsOpen
activeDocumentId?: string;         // documento em foco no editor M4 (já coberto por openDocuments[])
```
**Sincronizado (fica no `SyncPackage` / DataClient, NÃO em `DesktopSessionState`):**
- `projects: Project[]` (id, title, type, templateId, workspaceId, **tree**, updatedAt)
- `outputs: Output[]` (id, projectId, title, blocks, **references[]** ABNT, **versions[]**,
  workspaceId)
- conteúdo dos blocos/citações/versões.

> Decisão de boundary: `activeDocumentId` é visual (qual aba está aberta); o **conteúdo** do
> documento é dado e viaja no `SyncPackage`. `openDocuments[]` (já no tipo) lista abas abertas.

### 3.6 Tokens
- Sidebar de projetos: `--ds-surface-sidebar`; canvas do editor: `--ds-surface-canvas`.
- Árvore: `--ds-border-subtle` (guias), `--ds-text-secondary` (rótulos).
- Ação primária (abrir editor, nova versão): `--ds-accent` / `--ds-accent-strong`.
- Foco de nó selecionado: `--ds-border-focus`.
- Raios: `--ds-radius-md` (nós da árvore), `--ds-radius-lg` (painel de saídas).

### 3.7 Critérios de aceite
- [ ] Criar projeto respeita invariante de 5 ativos (`createProject` rejeita o 6º).
- [ ] Árvore de capítulos persiste (reabrir projeto mantém estrutura); é dado sincronizado.
- [ ] Abrir documento seta `session.activeDocumentId`/`openDocuments` sem tocar `navigationStack`.
- [ ] `references[]`/`versions[]` persistem como dados (round-trip de backup mantém).
- [ ] `projectsOpen`/`activeDocumentId` NÃO estão no `SyncPackage`.
- [ ] Web build não importa `ProjectsScreen`/`DocumentsScreen`.

### 3.8 Como remover a parte mobile compartilhada
1. `src/lib/routing.ts`: remover kind `'projects'`.
2. `src/context/AppContext.tsx`: remover `isProjectsOpen` (linha 759) e o push correspondente.
3. `src/shells/ScreenLayers.tsx:158-161`: remover ramo `app.isProjectsOpen ? <ProjectsScreen/>`.
4. Resolução vai para `DesktopScreenLayers` (import dinâmico de `ProjectsScreen`).
5. `openProjects` vira setter de `session.projectsOpen`; abertura de documento usa `session.openDocuments`.

---

## 4. Separação transversal (DesktopSessionState + boundary)

### 4.1 Novo shape de `DesktopSessionState` (agregado das 3 features)
```ts
export interface DesktopSessionState {
  lastWorkspaceId: string;
  openDocuments: string[];
  activePanels: string[];
  activeModule: 'conhecimento' | 'marketing' | 'projetos' | 'calendario';
  layoutState: Record<string, unknown>;

  // Grafo (1.8)
  selectedGraphNodeId?: string;
  graphViewport?: { x: number; y: number; zoom: number };
  graphOpen: boolean;
  graphFilters: { domains: string[]; courseIds: string[]; focusMode: boolean };

  // Inbox (1.7)
  inboxOpen: boolean;
  inboxFilter: { type: 'all' | 'concept' | 'author' | 'technique' | 'reading'; status: 'all' | 'pending' | 'accepted' | 'rejected' };
  inboxSelection: string[];

  // Projetos/TCC (1.9)
  projectsOpen: boolean;
  activeDocumentId?: string;
}
```

### 4.2 Dono do estado (DesktopAppProvider)
`apps/desktop/src/DesktopAppProvider.tsx` deixa de só repassar `useMobileApp()` e passa a:
- manter `DesktopSessionState` em `useState`/`usePersistentState` local (não vai para o `DataClient`
  nem para o `SyncPackage`);
- injetar no `useDesktopApp()` os setters: `openInbox/closeInbox`, `openGraph/closeGraph`,
  `openProjects/closeProjects`, `setGraphViewport`, `setSelectedGraphNodeId`, `setGraphFilters`,
  `openDocument/closeDocument`, `setInboxFilter`, `setInboxSelection`.

### 4.3 Respeito a `check-boundaries.mjs`
- `apps/desktop/**` e `src/desktop/**` NUNCA importam estaticamente `apps/mobile/**`,
  `src/shells/MobileAppShell.tsx`, `src/shells/ScreenLayers.tsx`, `src/components/views/**`.
- Telas desktop são importadas **dinamicamente** (`import()`) só a partir de `DesktopScreenLayers`.
- `packages/*` continua sem `react`/`__TAURI__`/`@capacitor/*`.
- UI compartilhada (`src/components`, `src/shells/ScreenLayers.tsx`, `src/overlays/*`) NÃO brancha
  por plataforma — e, após esta spec, NÃO conhece mais os kinds desktop.
- **Gap a sinalizar (relatório 2.3):** o gate hoje não pega (a) flags desktop na `ScreenLayers`
  nem (b) os 4 contextos com valor idêntico. Esta spec elimina (a) por remoção; (b) fica como
  aceitação manual até o `DataClient` assumir o estado (ver 4.4).

### 4.4 Sincronizado vs desktop-specific (critério de aceite 2.1)
| Campo | Onde vive | No SyncPackage? |
|---|---|---|
| `suggestions[]` | DataClient (dado) | sim |
| `projects[]` / `outputs[]` (conteúdo, tree, references, versions) | DataClient (dado) | sim |
| `currentWorkspaceId` | AppContext (seleção de dado) | sim |
| `inboxOpen` / `inboxFilter` / `inboxSelection` | `DesktopSessionState` | **não** |
| `graphOpen` / `graphViewport` / `selectedGraphNodeId` / `graphFilters` | `DesktopSessionState` | **não** |
| `projectsOpen` / `activeDocumentId` / `openDocuments` | `DesktopSessionState` | **não** |

Abrir 2 documentos + `activePanels=['graph','calendar']` + `graphViewport` no desktop NÃO deve
alterar `navigationStack` / `isBottomNavVisible` / `overlayKey` do mobile, e o `SyncPackage` NÃO
deve conter `openDocuments`/`graphViewport` (relatório 2.1, critério de aceite).

### 4.5 Preload por shell
`preloadScreenChunks()` em `ScreenLayers` hoje pré-carrega KnowledgeGraph/Projects/Inbox para web/
mobile também. Após a migração, o preload desses chunks passa a ser responsabilidade do
`DesktopScreenLayers` (só Tauri), e `ScreenLayers` deixa de pré-carregá-los.

---

## 5. Estratégia de teste
- **Unitário (`src/desktop/components/__tests__`)**: `InboxScreen` (filtro por tipo, ação em
  lote, vincular), `KnowledgeGraphScreen` (restauração de viewport, foco), `ProjectsScreen`
  (invariante de 5, árvore persiste).
- **Sessão (`apps/desktop/src/session/__tests__`)**: `DesktopSessionState` default + reducers de
  `openInbox`/`setGraphViewport`/`openDocument` não poluem o `SyncPackage`.
- **Boundary**: `node .github/scripts/check-boundaries.mjs` verde; `npm run build` web sem chunk
  desktop (verificar com `grep` no `dist/` ou analyzer).
- **Manual**: abrir inbox/grafo/projetos no Tauri; fechar e reabrir; confirmar viewport/filtros/
  seleção/restauração; confirmar mobile (web) sem essas telas.

---

## 6. Riscos e mitigação
- **Risco:** perder `isInboxOpen` etc. quebra atalhos da `CommandPalette`/sidebar. → Mitigação:
  setters de sessão expostos via `useDesktopApp()` antes de remover as flags.
- **Risco:** `projects`/`outputs` migrarem parcialmente para `DesktopSessionState`. → Mitigação:
  seção 4.4 é a fonte da verdade; code review checa `SyncPackage` no backup round-trip.
- **Risco:** regressão de bundle web. → Mitigação: `npm run build` + checagem de chunk desktop
  ausente no `dist/`.

---

## 7. Open questions (precisa de decisão humana)
1. O "vincular" do inbox cria `Output` ou apenas referencia conceito no projeto? (afeta `createOutput`.)
2. O editor M4 (DocumentsScreen) entra nesta entrega ou em spec dedicada? (esta spec define só o contrato de estado.)
3. Citações ABNT: gerar bibliografia agora ou só armazenar `references[]`? (engine DOCX fica para 1.15.5.)
4. `graphViewport` deve persistir por workspace ou globalmente na sessão desktop?
