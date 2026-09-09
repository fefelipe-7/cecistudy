# cecistudy ♡ — desktop shell layout spec

> documento de especificação + plano de implementação para a casca desktop
> (React/TypeScript + Vite, preview via `?platform=desktop` ou Tauri 2).
> fonte de verdade do **intuito**: `desktop/cecistudy-desktop-shell.json`.
> fonte de verdade da **implementação atual**: `src/shells/DesktopAppShell.tsx`
> e `src/desktop/**`.
> voz pt-BR, minúscula; valores de token/hex exatos onde citados.

objetivo deste doc: dar à revisora (skill de react best-practices) tudo que ela
precisa para anotar, validar e corrigir a casca sem caçar arquivo. cada seção é
autocontida para anotação.

---

## 0. como a casca é ativada (contexto de routing)

- `src/lib/platform.ts:32` — `isDesktop` é `true` quando `?platform=desktop` OU
  `__TAURI_INTERNALS__` existe na `window`. preview no browser: `npm run dev` →
  `http://localhost:3000/?platform=desktop` (sem compilar Tauri).
- `src/shells/DesktopAppShell.tsx:15` — `desktop-tokens.css` é importado **só**
  quando `isDesktop` (import dinâmico → chunk isolado; o bundle web/mobile não
  inclui esse CSS). regra de isolamento: tokens desktop vivem **apenas** em
  `src/desktop/styles/desktop-tokens.css`; o design system mobile (`index.css`)
  fica intacto. (ver seção 5 — hard constraints.)
- a pilha de navegação (`AppContext`) é a mesma do mobile; a casca desktop só
  muda a *apresentação* (master-detail, sidebar, inspector).
- injeção das telas desktop: `src/desktop/screens/DesktopScreenLayers.tsx`
  passa `desktopHome={<HomeScreen />}` e `desktopFaculdade={buildDesktopFaculdade(app)}`
  para o `SlideContent` compartilhado (`src/shells/ScreenLayers.tsx:270,274`).
  Home desktop é componente dedicado; a faculdade desktop vira master-detail
  (`SplitLayout` + `CourseMasterList` + `CourseDetailPane`) somente na
  sub-tab `disciplinas`.

---

## 1. arquitetura da casca / modelo de 3 zonas

modelo alvo (JSON `shell.*`): barra de título (44px) · sidebar (240px) ·
canvas do workspace (branco puro) · inspector de contexto (320px, colapsável) ·
status bar (28px) · command palette (⌘K, overlay).

| zona | dimensão alvo (JSON) | status atual | onde vive | desvio resumido |
|---|---|---|---|---|
| titleBar | 44px, fundo `surface.canvas`, sem borda | **partial** | `DesktopTopbar.tsx:51` | altura ~74px (`py-6`); título 26px (spec 22px) |
| sidebar | 240px, `surface.sidebar`, border-right 1px `border.default` | **implemented** | `DesktopSidebar.tsx:117` | itens com padding/radius levemente fora do spec |
| workspaceCanvas | `surface.canvas` (#FFFFFF), padding lateral `space8` (32px) | **partial** | `DesktopAppShell.tsx:82,91` | fundo cream (`bg-canvas`/`bg-surface-muted`), não branco |
| tabsDocumentos | 36px, topo do canvas | **missing** | — | não implementado (sem abas de documento) |
| contextInspector | 320px, `surface.inspector`, border-left 1px, colapsável | **implemented** | `ContextInspector.tsx:39` | ok; conteúdo bom |
| statusBar | 28px, `surface.sidebar`, border-top 1px, dot de status 6px | **implemented** | `DesktopAppShell.tsx:113` | texto 11px (spec caption 12px) |
| commandPalette | ⌘K, overlay `rgba(40,32,34,0.15)` sem blur pesado, painel 560px/radius.lg/shadow.md | **partial** | `CommandPalette.tsx:18` | resultados não agrupados por domínio; só comandos, sem busca real |
| overlay (compose/wizards) | — | **partial (viola constraints)** | `DesktopAppShell.tsx:128-148` | `rounded-[28px]` > teto 20px; `shadow-xl` (floating) proibido; `backdrop-blur-[2px]` |

---

## 2. breakdown por componente

### 2.1 Sidebar — `src/desktop/components/DesktopSidebar.tsx`

- **propósito**: navegação primária e permanente (JSON `_meta`: "sidebar é a
  estrutura primária e permanente"). command palette é acelerador secundário.
- **dimensões**: `w-[240px]` (`:117`) ✓ = 240px. `flex-col`, `px-3 py-4`.
- **cores/tokens usados (reais)**:
  - fundo: `var(--ds-surface-sidebar)` = `#F7F6F4` (`:118`) ✓
  - borda direita: `1px solid var(--ds-border-default)` = `#E4DFD9` ✓
  - marca: bloco `rounded-2xl` (16px) `bg: var(--ds-accent-subtle)` `#FBEEF1`,
    cor `var(--ds-accent-strong)` `#B94862` (`:122-127`)
  - busca: `rounded-[10px]`, borda `var(--ds-border-default)`, texto
    `text-ceci-tertiary` (#918689), kbd `bg-black/[0.04]` (`:132-141`)
  - item ativo: `bg: var(--ds-accent-subtle)` `#FBEEF1`, cor
    `var(--ds-accent-strong)` `#B94862` — **nunca rosa sólido** ✓ (`:200-204`)
  - item hover (inativo): `rgba(0,0,0,0.03)` via JS onMouseEnter (`:205-210`) ✓
  - item inativo: cor `var(--ds-text-secondary)` = `var(--color-ceci-secondary)`
    `#6D6366` (`:203`)
  - perfil ativo: `bg: var(--ds-accent-subtle)`, borda `var(--ds-accent-subtle)`
  - "novo registro": `bg: var(--color-ceci-primary)` `#40383A`, texto branco,
    hover `bg-ceci-primary-hover` (`:257-259`)
  - dica: `Panel dashed`, botão `bg: var(--ds-accent-subtle)` cor
    `var(--ds-accent-strong)` (`:265-281`)
- **reuso de tokens mobile**: `text-ceci-primary/secondary/tertiary/muted`,
  `bg-ceci-primary-hover`, `font-display`. (ok — são semânticos reaproveitados.)
- **tipografia**: label de grupo `text-[11px] font-semibold uppercase tracking-[0.06em]`
  `text-ceci-muted` (`:186`) — coincide com `label` do JSON typography (11px/500/
  uppercase/0.06em) ✓. itens `text-sm` (14px/500) = `subheading`/`body` ✓.
- **raio**: itens `rounded-[10px]` (= radius.md 10px, mas JSON `itemDefault.radius`
  = `radius.sm` 8px) — desvio menor. busca `rounded-[10px]`. marca `rounded-2xl`.
- **estados**: hover (JS, 3% preto), ativo (accent-subtle), foco/aria-current.
- **atalhos**: botão busca dispara evento `ceci:open-command-palette` (⌘K).
- **grupos**: JSON `shell.sidebar.grupos` = `["Home","Base de Conhecimento",
  "Calendário","Projetos/TCC","Estudos","Marketing"]`. implementados em `entries`
  (`:61-108`). **extras fora do spec**: `inbox de conhecimento` e `grafo de
  conhecimento` (`:147-183`) — aceleradores secundários não listados no `grupos`;
  o JSON os trata como aceleradores secundários em `_meta`, mas não os define
  como itens da navegação primária. label de seção "navegação" (`:186`) é extra.
- **gap menor**: `itemDefault.padding` do JSON = `6px 8px`; atual = `px-3 py-2`
  (12px 8px). ver tabela 3.

### 2.2 Topbar — `src/desktop/components/DesktopTopbar.tsx`

- **propósito**: título contextual da tela + busca global + badge de streak.
- **dimensões atuais**: `<header className="flex items-center gap-5 px-8 py-6 shrink-0">`
  (`:51`) → altura real ~74px (padding 24+24 + linha 26px). **spec titleBar = 44px**.
- **cores/tokens**: sem bg próprio → herda o fundo da coluna (que é cream do
  root `bg-canvas`, ver 2.6). `h1` `text-ceci-primary` (#40383A). busca:
  `bg-white border border-ceci-border-default text-ceci-muted shadow-xs`
  (`:62`). badge `StatusBadge variant="brand"` (rosa) (`:80`).
- **tipografia**: `font-display font-bold text-[26px]` (`:52`) — **spec display =
  22px/600**. desvio de tamanho e peso.
- **borda inferior**: spec `none`. atual: nenhuma borda explícita ✓ (mas o fundo
  cream já se diferencia da sidebar por matiz, não por borda — ok).
- **busca**: botão chama `app.openSearch` (modal de busca global mobile),
  **não** o command palette. o JSON define o ⌘K como command palette (sidebar).
  topbar ter busca global separada é aceitável, mas diverge do modelo "⌘K é o
  acelerador" — anotar.
- **gap**: altura e fonte do título. ver tabela 3.

### 2.3 HomeScreen — `src/desktop/screens/HomeScreen.tsx`

- **propósito**: primeira tela do dia, baixa densidade, onde o calor do mobile
  entra (JSON `homeScreen._nota`). reusa dados do `useDesktopApp` (sem estado próprio).
- **header/saudação**: `font-display font-semibold text-[22px] text-ceci-primary`
  (`:94`) ✓ = display 22px/600. subtítulo `text-sm text-ceci-secondary` (`:97`) ✓.
- **quickStats**: grid `grid-cols-2 sm:grid-cols-4` (`:104`) ✓ (3-4 colunas).
  card `rounded-[20px]` (= radius.xl, teto) ✓, `border` `var(--ds-border-subtle)`
  (#EEEAE7) ✓, `boxShadow: var(--ds-elevation-xs)` ✓. ícone tint usa
  `var(--ds-accent)` (rosa) para tarefas, `var(--ds-status-warning)`,
  `var(--ds-domain-estudos)`, `var(--ds-info)` (`:36-41`). rosa como cor de ícone
  = uso de acento, permitido.
- **moduleShortcuts**: grid `sm:grid-cols-2 lg:grid-cols-3` (`:126`),
  `rounded-[20px]`, barra lateral `h-10 w-1 rounded-full` com cor de domínio
  (`:137-141`) ✓ = "barra lateral fina de 3px, nunca fundo do card inteiro".
  domínios: `var(--ds-domain-conhecimento/calendario/tcc/marketing/estudos)`
  (`:54-85`) ✓.
- **dica do cecinho**: `Panel` + botão accent-subtle (`:156-175`) ✓ calor permitido.
- **GAP CRÍTICO**: `recentItems` (JSON `homeScreen.recentItems`) **ausente**.
  não há seção de itens recentes (aulas/leituras/notas). ver tabela 3.
- **tabsDocumentos**: não existe (esperado apenas quando houver documentos).

### 2.4 CommandPalette — `src/desktop/components/CommandPalette.tsx`

- **propósito**: acelerador secundário de navegação (⌘K / Ctrl+K). Não substitui
  a sidebar (JSON `shell.commandPalette.prioridade`).
- **trigger**: `(meta||ctrl)+k` toggle (`:63-67`); também abre via evento
  `ceci:open-command-palette`. ✓
- **overlay**: `background: rgba(40,32,34,0.15)` (`:114`) ✓ = spec. sem blur
  pesado ✓ (apenas `AnimatePresence` fade).
- **painel**: `max-w-[560px]` (`:118`) ✓ = 560px. `rounded-[16px]` = radius.lg ✓.
  `bg-white` (= `surfaceRaised` #FFFFFF) ✓. `boxShadow: var(--ds-elevation-md)` ✓.
  borda `1px solid var(--ds-border-default)` ✓.
- **input**: `border-b` `var(--ds-border-subtle)` (`:127-128`) ✓ = "somente
  border-bottom 1px".
- **resultados**: lista plana `<ul>` (`:139-161`), item ativo com
  `var(--ds-accent-subtle)`/`var(--ds-accent-strong)` ✓. **GAP**: JSON exige
  "agrupados por domínio (Documentos, Eventos, Projetos, Comandos), label caption
  uppercase acima de cada grupo" — atual não agrupa e só tem comandos de navegação
  (`commands` em `:25-54`), sem busca de documentos/eventos. ver tabela 3.
- **atalhos internos**: ArrowUp/Down navegam, Enter executa, Esc fecha (`:92-105`) ✓.

### 2.5 ContextInspector — `src/desktop/components/ContextInspector.tsx`

- **propósito**: painel contextual, sempre secundário (JSON `contextInspector.regra`).
- **dimensões**: aberto `w-80` (320px) (`:66`) ✓; fechado `w-10` com botão
  expandir (`:48-55`) ✓ colapsável.
- **cores**: `bg: var(--ds-surface-inspector)` #FBFAF9 ✓; `borderLeft: 1px solid
  var(--ds-border-default)` ✓. header `borderBottom: var(--ds-border-subtle)`.
- **tipografia**: label "contexto" `text-[11px] font-semibold uppercase tracking-[0.06em]`
  `text-ceci-muted` (`:73`) ✓ = label. título de disciplina `font-display text-[16px]
  font-semibold` (`:92`) = heading 16px/500 ✓. `Row` usa `text-[11px]` label /
  `text-[13px]` valor (`:28-29`).
- **conteúdo**: `focusedCourse` → fatos (professor/sala/horário) + botão "bora
  focar?"; senão "resumo do dia" (próxima prova/tarefas/ofensiva) + dica. sem rosa
  de fundo ✓.
- **gap**: nenhum funcional relevante; conteúdo aderente ao spec.

### 2.6 AppShell (glue de layout) — `src/shells/DesktopAppShell.tsx`

- **estrutura**: root `div.desktop-shell` (`h-screen flex bg-canvas ...` `:82`)
  → `<DesktopSidebar>` + coluna `flex-col flex-1` (topbar + [main + inspector] +
  footer) + overlays + `<CommandPalette>`.
- **root bg**: `bg-canvas` = `var(--color-canvas)` = **#FFFCF8 (cream)**, não
  branco. o `main` usa `bg-surface-muted` = **#FAF8F5 (cream)** (`:91`). ambos
  violam `shell.workspaceCanvas.corFundo = #FFFFFF` e `shell.titleBar.corFundo =
  surface.canvas`. (a sidebar/inspector sobrepõem com seus tokens; o canvas/titlebar
  ficam creme.) **GAP principal de cor.** ver tabela 3.
- **main**: `px-8 pb-8` (= `space8` 32px horizontal ✓; mas spec `paddingLateral`
  = `space8` ✓). `overflow-y-auto`. conteúdo `max-w-6xl mx-auto`. crossfade via
  `AnimatePresence mode="popLayout"` (`:95-105`).
- **overlay (compose/wizards/detalhes)**: `fixed inset-0 z-40 ... bg-black/30
  backdrop-blur-[2px]` (`:136`) + painel `rounded-[28px] border border-ceci-border-default
  shadow-xl bg-white max-w-2xl` (`:144`). **VIOLAÇÕES de hard constraint**:
  - `rounded-[28px]` > teto de 20px (JSON `explicitamenteFora.*` "radius acima de
    20px em qualquer superfície") — GAP.
  - `shadow-xl` = sombra floating do mobile, proibida (JSON `explicitamenteFora.*`:
    "shadow-floating, shadow-brand, shadow-brand-soft") — GAP.
  - `backdrop-blur-[2px]` = backdrop-filter blur, proibido (JSON: "liquid-glass-*
    (backdrop-filter blur/saturate) — fora por enquanto") — GAP em discussão.
- **statusBar**: `h-7` (28px) ✓, `text-[11px]` (spec caption 12px — desvio menor),
  `bg: var(--ds-surface-sidebar)` #F7F6F4 ✓, `borderTop: 1px solid var(--ds-border-default)`
  ✓, dot `h-1.5 w-1.5 rounded-full` `var(--ds-status-success)` (`:118`) ✓.
- **atalhos de casca** (`useDesktopShortcuts` `:20-58`): ⌘1-4 navega tabs
  (home/faculdade/estudos/biblioteca) ✓; ⌘N abre quick add ✓; Esc faz back se
  nenhum modal aberto ✓. command palette ⌘K tratado no próprio componente.
- **isolation**: `desktop-tokens.css` importado via `if (isDesktop) void import(...)`
  (`:15-17`) ✓ — bundle web limpo.

---

## 3. tabela de GAP (atual × spec)

cada linha cita a regra do JSON e o arquivo/linha do desvio.

| # | zona/componente | regra do JSON | atual | arquivo:linha | severidade |
|---|---|---|---|---|---|
| G1 | workspaceCanvas + root | `shell.workspaceCanvas.corFundo = #FFFFFF` (canvas branco puro) | `bg-canvas` (#FFFCF8 cream) no root e `bg-surface-muted` (#FAF8F5 cream) no main | `DesktopAppShell.tsx:82,91` | 🔴 alta |
| G2 | titleBar | `shell.titleBar.altura = 44px` | `py-6` → ~74px | `DesktopTopbar.tsx:51` | 🔴 alta |
| G3 | titleBar | `typography.display = 22px/600` (único Plus Jakarta no desktop) | `text-[26px] font-bold` (26px/700) | `DesktopTopbar.tsx:52` | 🟡 média |
| G4 | HomeScreen | `homeScreen.recentItems` obrigatório | seção ausente por completo | `HomeScreen.tsx` (todo) | 🔴 alta |
| G5 | commandPalette | `shell.commandPalette.resultados` agrupados por domínio (Documentos/Eventos/Projetos/Comandos) com label caption uppercase | lista plana de só comandos de navegação, sem agrupamento nem busca | `CommandPalette.tsx:25-54,139-161` | 🟡 média |
| G6 | overlay (compose) | `explicitamenteForaDoVocabularioDesktop`: radius > 20px proibido | `rounded-[28px]` | `DesktopAppShell.tsx:144` | 🔴 alta |
| G7 | overlay (compose) | `explicitamenteForaDoVocabularioDesktop`: shadow-floating/brand proibidos | `shadow-xl` (floating mobile) | `DesktopAppShell.tsx:144` | 🔴 alta |
| G8 | overlay (compose) | `explicitamenteForaDoVocabularioDesktop`: liquid-glass (backdrop blur) fora | `backdrop-blur-[2px]` | `DesktopAppShell.tsx:136` | 🟡 média |
| G9 | sidebar item | `shell.sidebar.itemDefault.padding = 6px 8px` | `px-3 py-2` (12px 8px) | `DesktopSidebar.tsx:199` | 🟢 baixa |
| G10 | sidebar item | `shell.sidebar.itemDefault.radius = radius.sm (8px)` | `rounded-[10px]` (10px = radius.md) | `DesktopSidebar.tsx:199` | 🟢 baixa |
| G11 | statusBar | `shell.statusBar.conteudo` = texto caption (12px) | `text-[11px]` | `DesktopAppShell.tsx:114` | 🟢 baixa |
| G12 | tabsDocumentos | `shell.workspaceCanvas.tabsDocumentos.altura = 36px` no topo do canvas | não implementado (sem abas de documento) | — | 🟢 baixa (futuro) |
| G13 | topbar busca | modelo "⌘K = command palette" como acelerador | topbar tem busca própria (`openSearch`, modal mobile) paralela | `DesktopTopbar.tsx:59-69` | 🟢 baixa (produto) |
| G14 | sidebar grupos | `shell.sidebar.grupos` lista 6 itens; inbox/grafo são aceleradores secundários | inbox + grafo presentes como itens; label "navegação" extra | `DesktopSidebar.tsx:147-183,186` | 🟢 baixa (intencional) |

---

## 4. modelo de navegação e interação

- **plataforma**: `?platform=desktop` ou Tauri (`__TAURI_INTERNALS__`). sem
  router tradicional — a pilha `AppContext` é fonte da verdade; a casca desktop
  reinterpreta a mesma pilha (master-detail na faculdade, inspector de contexto).
- **sidebar (navegação primária, permanente)**:
  - grupos: Home · Base de Conhecimento (→ `biblioteca`) · Calendário (→ faculdade
    sub-tab `calendario`) · Projetos & TCC (→ `openProjects()`) · Estudos ·
    Marketing (placeholder toast). itens ativos usam `accent-subtle`, nunca rosa
    sólido.
  - aceleradores secundários: inbox de conhecimento, grafo de conhecimento
    (toggle de estado no app, não troca de tab).
  - workspace switcher no topo (`WorkspaceSwitcher`).
- **command palette (⌘K / Ctrl+K)**: acelerador secundário. abre via tecla ou
  evento `ceci:open-command-palette` (sidebar busca). overlay leve, painel 560px.
  hoje só comandos de navegação; spec quer busca agrupada (G5).
- **atalhos de teclado**:
  - `⌘K` / `Ctrl+K` → command palette (toggle)
  - `⌘N` → quick add (novo registro)
  - `⌘1`…`⌘4` → home / faculdade / estudos / biblioteca
  - `Esc` → back de nível (se nenhum modal overlay aberto)
  - setas ↑/↓ + Enter no palette; Esc fecha o palette
  - **inspector collapse**: só via botão (ChevronLeft/Right), sem atalho de tecla.
- **inspector collapse**: estado `inspectorOpen` em `DesktopAppShell.tsx:69`;
  `ContextInspector` recebe `open`/`onToggle`. fechado vira faixa `w-10` com botão
  expandir. spec: "colapsavel: true", "sempre secundário".
- **overlay de escrita**: compose/wizards/detalhes de nota aparecem como janela
  centrada (`fixed inset-0 z-40`), não tela cheia — crossfade concorrente.

---

## 5. hard constraints do JSON (devem ser preservadas)

estas regras são **inegociáveis** em qualquer implementação/refactor:

1. **rosa nunca é fundo de painel/seção** — só acento, seleção, foco, ícones de
   destaque (`colorTokens.desktopSemantic.accent.default.regra` +
   `explicitamenteForaDoVocabularioDesktop`). exceção permitida: `accent-subtle`
   (#FBEEF1) como fundo de item ativo da sidebar / badge rosa (isso é "seleção",
   não seção). ❌ proibido: `bg-ceci-brand` / `bg-[#D85F79]` em painel/section.
2. **teto de radius = 20px** (`radius.xl`). nunca acima em qualquer superfície
   (`explicitamenteForaDoVocabularioDesktop`). atual viola em `rounded-[28px]`
   (G6).
3. **sem paper-texture** de fundo (`explicitamenteForaDoVocabularioDesktop`).
4. **sem liquid-glass** (backdrop-filter blur/saturate) por enquanto
   (`explicitamenteForaDoVocabularioDesktop`). cuidado com `backdrop-blur-*` (G8).
5. **sem bounce/scale tátil** (press-card/press-btn) — linguagem de mouse/teclado.
   cute-badge permitido **sem** animação de bounce (`components.cuteBadge`).
6. **shadow-floating / shadow-brand / shadow-brand-soft proibidos**
   (`explicitamenteForaDoVocabularioDesktop`). usar só `--ds-elevation-*` (borda
   separa zonas; sombra só em flutuante). atual usa `shadow-xl` (G7).
7. **tokens desktop vivem SÓ em `desktop-tokens.css`** — o bundle web/mobile deve
   ficar limpo. o CSS é importado dinamicamente sob `isDesktop`
   (`DesktopAppShell.tsx:15`). não mover tokens desktop para `index.css`.
8. **boundary rule**: código desktop (`src/desktop/**`,
   `src/shells/DesktopAppShell.tsx`) **não pode ser importado estaticamente pelo
   mobile/web**. usar sempre import dinâmico (lazy/`import()`) — já feito em
   `ScreenLayers.tsx:42-44` e `DesktopScreenLayers.tsx:10-19`. manter esse padrão.
9. **reuso de matiz mobile**: primitivos (rose/blue/cream/beige/green/yellow/red)
   e `--color-ceci-*` são reaproveitados sem alterar matiz
   (`colorTokens.primitivesSource`). não criar novos matizes fora dos
   `--ds-*` definidos.
10. **contraste entre zonas moderado (estilo Notion)**: sidebar só ~2% mais escura
    que canvas; inspector quase idêntico ao canvas (`_meta.decisoesResolvidasPorClaude[0]`).
11. **font-display restrito ao título de página** (peso 600), mais nada
    (`_meta.decisoesResolvidasPorClaude[1]`). Home e topbar usam; cards não.
12. **onde o calor entra**: Home (baixa densidade) e feedback (empty/onboarding/
    toast). zonas de produção pesada (editor/grafo/calendário) ficam com
    vocabulário Notion puro (`_meta.decisoesResolvidasPorClaude[4]`).

---

## 6. plano de implementação (checklist, em ordem)

objetivo: levar o código atual ao spec sem quebrar isolamento/constraints.
referencie funções/arquivos exatos. não escrever código aqui — só passos.

### 6.1 cor do canvas (G1) — prioridade 1
- [ ] `DesktopAppShell.tsx:82` — trocar `bg-canvas` do root por
      `bg-[var(--ds-surface-canvas)]` (ou classe utilitária `.ds-surface-canvas`
      já definida em `desktop-tokens.css:77`).
- [ ] `DesktopAppShell.tsx:91` — trocar `bg-surface-muted` do `<main>` por
      `bg-[var(--ds-surface-canvas)]` (branco puro #FFFFFF).
- [ ] confirmar que topbar (sem bg próprio) herda o branco e não o cream.

### 6.2 titleBar (G2, G3) — prioridade 1
- [ ] `DesktopTopbar.tsx:51` — mudar `px-8 py-6` para `h-11 px-8` (44px) com
      `items-center` (já tem) e remover o padding vertical solto.
- [ ] `DesktopTopbar.tsx:52` — mudar `text-[26px] font-bold` para
      `text-[22px] font-semibold` (display 22px/600). manter `font-display`
      `text-ceci-primary` `tracking-tight`.
- [ ] `DesktopTopbar.tsx` — garantir que não haja borda inferior (spec `none`);
      hoje já não há — só conferir.

### 6.3 overlay de escrita (G6, G7, G8) — prioridade 1
- [ ] `DesktopAppShell.tsx:144` — `rounded-[28px]` → `rounded-[20px]`
      (teto radius.xl). se quiser mais contido, `rounded-[16px]` (radius.lg).
- [ ] `DesktopAppShell.tsx:144` — `shadow-xl` → `shadow-[var(--ds-elevation-md)]`
      (sombra flutuante permitida). remover qualquer shadow-floating/brand.
- [ ] `DesktopAppShell.tsx:136` — `backdrop-blur-[2px]` → remover o blur (ficar
      só `bg-black/30`) para respeitar a regra liquid-glass; ou, se mantido,
      documentar exceção com a revisora. reduzir opacidade se necessário.
- [ ] opcional: padronizar o painel overlay com `border var(--ds-border-default)`
      (já está `border-ceci-border-default` — ok).

### 6.4 HomeScreen recentItems (G4) — prioridade 1
- [ ] `HomeScreen.tsx` — adicionar seção `recentItems` após `quickStats`
      (ou antes de `moduleShortcuts`), seguindo `homeScreen.recentItems`:
      lista/grid compacto, `cardRadius = radius.lg (16px)`.
- [ ] ler dados do `app` (ex.: `app.classes`, `app.readings`, `app.notes`
      conforme disponível em `useDesktopApp`) — sem duplicar estado.
- [ ] título de seção usar `label` (11px/500/uppercase/0.06em) `text-ceci-muted`,
      igual a "módulos" (`:123`).
- [ ] manter sem rosa de fundo; ícones/tints via `--ds-*` permitidos.

### 6.5 command palette agrupado (G5) — prioridade 2
- [ ] `CommandPalette.tsx` — separar `commands` em grupos por domínio:
      Documentos / Eventos / Projetos / Comandos (JSON `shell.commandPalette.resultados`).
- [ ] renderizar `label caption uppercase` (12px/500/0.06em `text-ceci-muted`)
      acima de cada grupo (hoje só `<ul>` plano em `:139`).
- [ ] (produto) decidir se o palette vira busca real (indexar documentos/eventos)
      ou permanece só comandos — spec pede agrupamento de resultados de busca.

### 6.6 ajustes menores (G9–G11, G13, G14) — prioridade 3
- [ ] `DesktopSidebar.tsx:199` — item: `px-3 py-2` → `px-2 py-1.5` (6px 8px ≈
      `px-2 py-1.5`); `rounded-[10px]` → `rounded-[8px]` (radius.sm). manter hover
      JS `rgba(0,0,0,0.03)` e ativo `accent-subtle`.
- [ ] `DesktopAppShell.tsx:114` — statusBar `text-[11px]` → `text-xs` (12px caption).
- [ ] `DesktopTopbar.tsx:59-69` — decidir com a revisora se a busca da topbar
      deve abrir o command palette ou permanecer `openSearch` (busca global mobile).
- [ ] `DesktopSidebar.tsx` — inbox/grafo: confirmar com a revisora se viram
      entradas do grupo "navegação" ou permanecem aceleradores soltos; label
      "navegação" está ok mas não está no `grupos` do JSON.

### 6.7 futuro (G12)
- [ ] `tabsDocumentos` (36px, topo do canvas) — implementar só quando houver
      modelo de documentos/abas; hoje fora de escopo da fundação.

### 6.8 verificação final
- [ ] `npm run lint` + `npm run test` ainda verdes.
- [ ] checar no browser `?platform=desktop`: canvas branco, titleBar 44px/22px,
      overlay com radius ≤20px e sombra md, Home com recentItems, palette
      agrupado.
- [ ] confirmar que `dist/` web não inclui `desktop-tokens.css` (isolamento).

---

## Revisão de boas-práticas (vercel-react-best-practices)

> seção acrescentada pela revisora. fonte: skill `vercel-react-best-practices`
> (Vercel Engineering, 62 regras / 8 categorias). o skill é Next.js-oriented; aqui
> foram **ignoradas** as regras de servidor/roteamento/SSR (`server-*`, `async-*`,
> `hydration-*`, `resource-hints`) e mantidas só as regras de **React client-side**
> que se aplicam a Vite (renderização, re-render, memoização, code-splitting /
> dynamic import, performance de JS, transições). cada item abaixo marca a origem da
> restrição: `(regra skill)` vs `(restrição JSON)` quando já vem do
> `cecistudy-desktop-shell.json`.

### 8.1 boas-práticas extraídas (mais relevantes para esta casca)

1. **não definir componentes dentro de componentes** — `rerender-no-inline-components`
   (5.4, regra skill, impacto ALTO). definir um subcomponente dentro de `DesktopAppShell`
   / `HomeScreen` / `CommandPalette` cria um tipo novo a cada render → remount completo,
   perda de foco/estado e efeitos rodando de novo. passar props em vez de fechar sobre
   variáveis do pai. (atenção ao implementar `recentItems` e os grupos do palette.)
2. **extrair trabalho caro para componentes memoizados** — `rerender-memo` (5.6, regra
   skill, impacto MÉDIO). memoizar a lista de navegação da sidebar, a `CourseMasterList`
   e a lista de resultados do command palette para que não recomputem a cada mudança de
   estado do app. (ver também 5.5: hoist de default não-primitivo para preservar memo.)
3. **dynamic import / React.lazy para componentes pesados** — `bundle-dynamic-imports`
   (2.4, regra skill, impacto CRÍTICO). já parcialmente feito (tokens e telas via
   `import()`). manter: lazy-load dos painéis do master-detail da faculdade e do
   `CommandPalette` (e do `ContextInspector` quando colapsado) para mantê-los fora do
   bundle web/mobile.
4. **carregar módulo só quando o recurso é ativado** — `bundle-conditional` (2.2, regra
   skill, impacto ALTO). command palette e inspector só precisam de código quando
   abertos; o `desktop-tokens.css` já é carregado sob `isDesktop` — estender o mesmo
   padrão para providers/pesquisa pesada do palette.
5. **derivar estado durante o render, não em effect** — `rerender-derived-state-no-effect`
   (5.1, regra skill, impacto MÉDIO). `recentItems`, `isMobile`/largura e o agrupamento
   do palette devem ser derivados em render; evitar `useEffect` que só espelha prop/state.
6. **assinar estado derivado (booleano), não valor bruto** — `rerender-derived-state`
   (5.9, regra skill, impacto MÉDIO). `inspectorOpen` e "tem recent items" devem virar
   booleano derivado para reduzir frequência de re-render.
7. **usar CSS/class em vez de ler layout (sem thrash)** — `js-batch-dom-css` (7.1, regra
   skill, impacto MÉDIO). o colapso do inspector (`w-80`→`w-10`) e a troca de canvas
   devem ser só troca de classe/CSS, nunca `getBoundingClientRect`/`offsetWidth`
   intercalados com escrita de estilo.
8. **transições para updates não-urgentes** — `rerender-transitions` (5.12) /
   `rendering-usetransition-loading` (6.11, regra skill, impacto MÉDIO). animar o
   colapso do inspector e a entrada de `recentItems` com `useTransition` + transição CSS
   (não bounce/scale — ver restrição JSON 5). mantém a UI responsiva.
9. **renderização condicional explícita (ternário)** — `rendering-conditional-render`
   (6.9, regra skill, impacto BAIXO). ao renderizar grupos do palette e `recentItems`,
   usar `? :` em vez de `&&` (contagem 0 não deve renderizar "0").
10. **content-visibility para listas longas** — `rendering-content-visibility` (6.2,
    regra skill, impacto ALTO). aplicar `content-visibility:auto` em `CourseMasterList`
    e em `recentItems` quando houver muitos itens (offset de tela).
11. **event listeners globais deduplicados** — `client-event-listeners` (4.1, regra
    skill, impacto BAIXO). `useDesktopShortcuts` (⌘K/⌘N/⌘1-4/Esc) deve usar um único
    listener de `keydown` no `window`, não N instâncias; callbacks estáveis via ref
    (`advanced-event-handler-refs` 8.2).
12. **iterar/ordenar_sem_mutar em listas derivadas** — `js-combine-iterations` (7.6) +
    `js-set-map-lookups` (7.12) + `js-tosorted-immutable` (7.13, regra skill, impacto
    BAIXO-MÉDIO). `recentItems` junta `classes`/`readings`/`notes` → fazer em **um só
    loop** (filter+map+sort num passo), usar `Map`/`Set` para lookup de curso, e
    `toSorted()` (imutável) em vez de `sort()` que muta o array do estado.

### 8.2 mapeamento para o plano de implementação (6.1–6.7)

- **6.1 cor do canvas (G1)** — sem impacto de regra skill direto; é troca de classe
  (`bg-canvas`→`bg-[var(--ds-surface-canvas)]`). apenas confirmar que a troca é por
  classe CSS, não por leitura/escrita de layout (regra 7.1). restrição JSON 1/7
  (tokens só em `desktop-tokens.css`).
- **6.2 titleBar (G2/G3)** — altura/tipo via classe (`h-11`, `text-[22px]`). nenhuma
  regra skill conflitante; manter CSS puro (regra 7.1). `font-display` restrito ao
  título = restrição JSON 11.
- **6.3 overlay de escrita (G6/G7/G8)** — `rounded-[28px]`→`rounded-[20px]` (teto 20px
  = restrição JSON 2) e `shadow-xl`→`shadow-[var(--ds-elevation-md)]` (sombra flutuante
  proibida = restrição JSON 6). o `backdrop-blur-[2px]` deve sair (liquid-glass proibido
  = restrição JSON 4). skill: a animação de crossfade do overlay deve continuar via
  `AnimatePresence`+classe, sem medir layout (regra 7.1); e o painel overlay não deve
  definir subcomponentes inline (regra 5.4).
- **6.4 HomeScreen recentItems (G4)** — **maior superfície de regras skill**: derivar a
  lista em render (5.1); memoizar o card/linha de item (`rerender-memo` 5.6 +
  `rerender-memo-with-default-value` 5.5); `content-visibility:auto` se longa (6.2);
  ternário e não `&&` (6.9); construir em um único loop + `Map`/`Set` + `toSorted()`
  (7.6/7.12/7.13); `useTransition` na transição de entrada (5.12/6.11); **não** definir
  o componente de item dentro do `HomeScreen` (5.4). sem rosa de fundo = restrição JSON 1.
- **6.5 command palette agrupado (G5)** — agrupar resultados por domínio com label
  caption; usar ternário (6.9); memoizar a lista de resultados (`rerender-memo` 5.6);
  **não** definir o componente de grupo/linha dentro do `CommandPalette` (5.4); considerar
  `React.lazy` para o palette (regra 3) e carregá-lo só no ⌘K (regra 4). deduplicar o
  listener de teclado (regra 11).
- **6.6 ajustes menores (G9–G11, G13, G14)** — itens de sidebar: manter hover JS já
  existente; memoizar a lista de navegação (`rerender-memo` 5.6) para não recomputar em
  cada mudança de app state. definir `NOOP` estável se houver `onClick` default em item
  memoizado (5.5). sem regra skill conflitante nas bordas/raio (esses são restrição JSON
  2/9).
- **6.7 futuro tabsDocumentos (G12)** — quando implementar, lazy-load das abas via
  `React.lazy` (regra 3) e `content-visibility` nas abas longas (6.2); não definir o
  conteúdo da aba dentro do shell (5.4).
- **6.8 verificação final** — além de `lint`/`test`/`build`, inspecionar o bundle:
  confirmar que `dist/` web não inclui `desktop-tokens.css` nem os chunks de
  `CommandPalette`/`ContextInspector` (isolamento = restrição JSON 7 + regra skill 3/4).

### 8.3 chamados de atenção (possíveis violações de regra skill no plano atual)

- o plano **não** viola nenhuma regra skill de forma explícita; os riscos são de
  *implementação futura*: (a) ao criar `recentItems` e os grupos do palette, há tendência
  de definir subcomponentes inline (5.4) ou de calcular a lista em `useEffect` (5.1) — ambos
  devem ser evitados conforme 8.1/8.2. (b) o colapso do inspector já usa troca de classe
  (`w-80`/`w-10`), o que está **correto** (regra 7.1); só não deve ganhar leitura de
  `offsetWidth` para "animar manualmente".
- nota: o skill sugere `useTransition` para o colapso, mas a restrição JSON 5 proíbe
  bounce/scale tátil — usar transição CSS de `width`/`opacity` (sem spring nem scale), o
  que é compatível com ambas as fontes.

---

## 7. inventário de tokens reais (para a revisora validar)

extraído de `src/desktop/styles/desktop-tokens.css` (fonte única desktop):

- surface: `--ds-surface-canvas #FFFFFF` · `--ds-surface-sidebar #F7F6F4` ·
  `--ds-surface-raised #FFFFFF` · `--ds-surface-inspector #FBFAF9`
- text: `--ds-text-primary var(--color-ceci-primary) #40383A` ·
  `--ds-text-secondary #6D6366` · `--ds-text-tertiary #918689` ·
  `--ds-text-muted #ADA3A5`
- border: `--ds-border-subtle #EEEAE7` · `--ds-border-default #E4DFD9` ·
  `--ds-border-strong #D6CFC5` · `--ds-border-focus var(--color-ceci-brand) #D85F79`
- accent: `--ds-accent var(--color-ceci-brand) #D85F79` ·
  `--ds-accent-strong var(--color-ceci-brand-strong) #B94862` ·
  `--ds-accent-subtle #FBEEF1`
- info: `--ds-info var(--color-ceci-academic) #4A879F` · `--ds-info-subtle #EEF5F8`
- status: `--ds-status-success #5A9F76` · `--ds-status-warning #BD913C` ·
  `--ds-status-danger #C5665E`
- domain: `--ds-domain-conhecimento var(--color-ceci-academic)` ·
  `--ds-domain-calendario #9A8A78` · `--ds-domain-tcc var(--color-ceci-brand)` ·
  `--ds-domain-marketing #BD913C` · `--ds-domain-estudos #5A9F76` ·
  `--ds-domain-externo var(--color-ceci-tertiary)`
- radius: `xs 6` · `sm 8` · `md 10` · `lg 16` · `xl 20` (teto)
- elevation: `xs 0 1px 2px rgba(40,32,34,.04)` · `sm 0 2px 6px rgba(40,32,34,.06)` ·
  `md 0 8px 24px rgba(40,32,34,.10)`
- spacing: `1 4` · `2 8` · `3 12` · `4 16` · `6 24` · `8 32` · `12 48`

reuso mobile (sem alterar matiz): `text-ceci-primary/secondary/tertiary/muted`,
`bg-ceci-primary-hover`, `font-display`, `bg-ceci-border-default/subtle`,
`bg-surface-muted` (usado em desvio G1), `bg-canvas` (usado em desvio G1).

---

_fim do spec — pronto para revisão anotação por anotação._
