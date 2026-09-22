# Spec: Shell de Navegação & Layout Desktop (cecistudy ♡)

> Módulo de separação de interface — Surface de controle desktop.
> Parte de `desktop/spec/`. Companheiro de `00-relatorio-varredura.md` (seções 1.1, 1.2, 1.13, 1.14, 2.5, 2.6).
> Estado canônico do produto: `packages/*` + `src/context/AppContext.tsx`. Estado desktop de sessão: `DesktopSessionState` (em `apps/desktop/src/DesktopAppProvider.tsx`), **não sincronizado** com mobile/web.

---

## 0. Resumo executivo / Capability Map

Esta spec cobre a **casca de controle desktop** (sidebar, topbar, onboarding desktop-aware, tokens/layout) e a **remoção do resíduo mobile compartilhado** que impede a separação limpa (`src/components/DesktopSidebar.tsx` stub + ponte Tauri em `src/lib/desktop.ts`).

| Módulo id | Responsabilidade | Depende de |
|---|---|---|
| shell-sidebar | Navegação primária, workspaces, badges, atalhos ⌘1–⌘4, colapso | DesktopSessionState |
| shell-topbar | Breadcrumb contextual, tema/claridade, "novo documento" | DesktopSessionState |
| shell-onboarding | Boas-vindas desktop-aware, escolha de workspace, import | AppContext (seed) |
| shell-layout-tokens | Conformidade G1–G14, densidade/contraste, tema Notion-like | desktop-tokens.css |
| cleanup-preview | Deletar stub `DesktopSidebar`, desacoplar `MobileAppShell` | — |
| cleanup-tauri-bridge | Mover ponte Tauri para `apps/desktop`, remover `isDesktop` de UI compartilhada | check-boundaries.mjs |

Build order: `cleanup-preview` + `cleanup-tauri-bridge` (gate de separação) → `shell-layout-tokens` → `shell-sidebar` → `shell-topbar` → `shell-onboarding`.

**Princípio de voz (copy):** pt-BR, minúsculo, acolhedor. A sidebar/topbar são neutras e funcionais; o "calor" (rosa/acolhimento) vive em Home e feedback (empty/onboarding), nunca em painéis de produção (hard constraint do `cecistudy-desktop-shell.json`).

---

## 1. Sidebar & navegação (1.1)

### 1.1 Context / Problem
Hoje a navegação desktop real está em `src/desktop/components/DesktopSidebar.tsx` (285 linhas, usa `useDesktopApp()`), mas o **preview web largo** (`MobileAppShell`, breakpoint `lg`) renderiza um **stub obsoleto** em `src/components/DesktopSidebar.tsx` (103 linhas) — duas implementações divergentes da mesma ideia. Além disso: colapso não é persistido, não há badges de contagem por aba, atalhos ⌘1–⌘4 não estão ligados, e o agrupamento por workspace é estático.

### 1.2 Goals
- Sidebar única e canônica (a de `src/desktop`), sem stub concorrente.
- Colapso animado persistido em `DesktopSessionState`.
- Badges de contagem por aba derivados de projeções do estado (`app.*`), sem duplicar estado.
- Atalhos ⌘1–⌘4 navegando entre as 4 abas primárias.
- Workspace switcher com agrupamento estável.

### 1.3 Proposed desktop UX
- **Sidebar fixa esquerda**, 240px (`width`), colapsável para `w-10` (`40px`) com tooltip nos ícones. Colapso anima `width` via CSS transition (sem bounce tátil — hard constraint).
- **WorkspaceSwitcher** no topo: `useDesktopApp().activeWorkspaceId` + `workspaces`. Troca de workspace apenas reordena/filtra projetos fixos no grupo "workspace" — não altera `navigationStack` do mobile.
- **Navegação primária**: home / faculdade / estudos / biblioteca. Cada item recebe `badge` (opcional):
  - faculdade → `exams` da semana (`app.exams` filtrado por data ≥ hoje e ≤ +7d)
  - estudos → sessões pendentes / flashcards a revisar
  - biblioteca → `savedBookIds.length` (já persistido)
  - home → sem badge
- **Aceleradores secundários**: Inbox, Grafo — renderizados como itens do grupo "workspace" (G14 aceita isso como intencional).
- **Atalhos**: `⌘1`→home, `⌘2`→faculdade, `⌘3`→estudos, `⌘4`→biblioteca. Listener global dedup em módulo (ver Vercel re-render 4.1) para não registrar N listeners.

### 1.4 Components / Files
| Ação | Arquivo | Notas |
|---|---|---|
| **Mudar** | `src/desktop/components/DesktopSidebar.tsx` | Tornar canônica; ler `sidebarCollapsed`, `activeWorkspaceId` de `useDesktopApp().session` (DesktopSessionState). Adicionar `badge` por item derivado em render. |
| **Mudar** | `src/desktop/components/WorkspaceSwitcher.tsx` | Já existe; ligar a `session.activeWorkspaceId`. |
| **Mudar** | `apps/desktop/src/DesktopAppProvider.tsx` | Expor `session` (DesktopSessionState) no facade `useDesktopApp`. |
| **Criar** | `src/desktop/lib/useSidebarShortcuts.ts` | Hook de atalhos ⌘1–⌘4 com Map dedup de callbacks (re-render 4.1 / 5.11). |

### 1.5 Desktop-specific state (`DesktopSessionState`, NÃO sincronizado)
```ts
// em apps/desktop/src/DesktopAppProvider.tsx
interface DesktopSessionState {
  // ...outros campos de sessão
  sidebarCollapsed: boolean;          // colapso persistido
  activeWorkspaceId: string;          // workspace ativo (não é navigationStack)
}
```
Estes campos **não** entram no `SyncPackage` nem em `navigationStack`/`isBottomNavVisible` do mobile (critério de aceite de `02-fronteiras-e-contratos.md`).

### 1.6 Tokens (design-system: três camadas, sem hex raw)
- Largura: `--ds-sidebar-width: 240px`, `--ds-sidebar-width-collapsed: 40px` (token primitivo → semântico em `desktop-tokens.css`).
- Fundo do painel: `var(--ds-surface-sidebar)` ≈ 2% mais escuro que o canvas (G13/Notion). **Rosa nunca é fundo de painel.**
- Item: padding `6px 8px`, radius `var(--ds-radius-sm)` (8px). Hover: `var(--ds-surface-hover)` (JS hover, não `active:scale`, para evitar bounce tátil).
- Badge: `bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]` (token semântico, não hex).

### 1.7 Acceptance criteria
- [ ] Abrir o app desktop mostra **somente** a sidebar de `src/desktop/components/DesktopSidebar.tsx`; o stub de `src/components` foi deletado.
- [ ] Colapsar a sidebar e recarregar (ou trocar de tela) preserva o estado (`sidebarCollapsed` em DesktopSessionState).
- [ ] Badge de faculdade mostra o número de provas nos próximos 7 dias; some quando 0 (render explícito `count > 0 ? … : null`, re-render 6.9).
- [ ] `⌘1`–`⌘4` navegam sem re-render global; listener registrado uma única vez.
- [ ] Troca de workspace não altera `app.navigationStack` (verificável: `app.canGoBack` inalterado).

### 1.8 User stories
- **como** usuária no desktop, **quero** uma sidebar colapsável e com badges, **para** enxergar rápido o que precisa de atenção sem abrir cada aba.
- **como** usuária, **quero** abrir faculdade com `⌘2`, **para** navegar só pelo teclado.

### 1.9 Como remover / tirar a parte mobile compartilhada
Ver módulo **5 (cleanup-preview)** — o stub `src/components/DesktopSidebar.tsx` é deletado e o `MobileAppShell` deixa de renderizá-lo; a sidebar real vive só na shell Tauri. Nenhuma lógica de colapso/badge deve permanecer em código compartilhado web.

---

## 2. Topbar (1.2)

### 2.1 Context / Problem
`src/desktop/components/DesktopTopbar.tsx` já existe e lê `useDesktopApp()`, mas viola G2/G3 (altura ~74px vs 44px; `text-[26px] font-bold` vs 22px/600) e tem uma busca própria paralela ao ⌘K (`G13`). Faltam: breadcrumb contextual, toggle de tema/claridade do canvas, e o botão "novo documento" (quando M4 Documents existir — aqui ficará como ação desabilitada/informacional até M4).

### 2.2 Goals
- Topbar com altura 44px, título 22px/600 (Plus Jakarta, único display no desktop).
- Breadcrumb contextual derivado da pilha (`home` / `faculdade › [curso] › aula 3`).
- Toggle de claridade (tema "claro" do canvas) — estado em DesktopSessionState.
- Busca unificada via Command Palette (⌘K); remover o campo de busca paralelo.

### 2.3 Proposed desktop UX
- **Breadcrumb**: `apps/desktop` deriva o rótulo da pilha atual (`app.navigationStack` topo). Separador `›` (chevron, não `/`). Item final é o título da tela; itens anteriores são clicáveis (voltam na pilha via `app.goBack`/pop).
- **Título**: `font-display text-[22px] font-semibold` (token `var(--ds-titlebar-title)`).
- **Ações à direita**: toggles de claridade (sol/lua, `aria-pressed`), e botão "novo documento" (`+ documento`) — desabilitado com tooltip "em breve" até M4; não dispara modal mobile.
- **Busca**: remover `openSearch` paralelo; `⌘K` abre `CommandPalette` (G13). O topbar só tem o ícone de busca como atalho para o palette.

### 2.4 Components / Files
| Ação | Arquivo | Notas |
|---|---|---|
| **Mudar** | `src/desktop/components/DesktopTopbar.tsx` | `h-11` (44px), `text-[22px] font-semibold`; breadcrumb de `session.breadcrumb` ou derivado da pilha; remover busca paralela; toggle claridade + botão documento. |
| **Mudar** | `apps/desktop/src/DesktopAppProvider.tsx` | `session.canvasClarity: 'soft' | 'neutral'` (toggle). |

### 2.5 Desktop-specific state
```ts
interface DesktopSessionState {
  // ...
  canvasClarity: 'soft' | 'neutral';   // tema/claridade do canvas (não afeta mobile)
}
```

### 2.6 Tokens
- Altura: `--ds-titlebar-height: 44px`.
- Título: `--ds-titlebar-title: 22px/600 var(--font-display)`.
- Separador breadcrumb: `text-[var(--ds-text-tertiary)]`.
- Toggle claridade: `aria-pressed` + `bg-[var(--ds-surface-hover)]` no ativo.

### 2.7 Acceptance criteria
- [ ] Topbar mede 44px de altura; título 22px/600 (G2/G3 verdes).
- [ ] Breadcrumb mostra `faculdade › [nome do curso]` ao abrir detalhe; clicar em `faculdade` faz pop na pilha.
- [ ] Toggle de claridade alterna o canvas entre suave/neutro e persiste em DesktopSessionState.
- [ ] Nenhuma busca paralela: `⌘K` é a única entrada de busca (G13).
- [ ] Botão "novo documento" presente, porém desabilitado com tooltip até M4 Documents.

### 2.8 User stories
- **como** usuária, **quero** ver onde estou (breadcrumb) e um botão de tema, **para** me orientar sem poluição visual.

---

## 3. Installer / onboarding desktop-aware (1.13)

### 3.1 Context / Problem
`DesktopAppShell.tsx:71-73` renderiza `OnboardingScreen` **compartilhado com mobile** quando `!onboarding.completed`. Não há installer desktop próprio, nem escolha de workspace inicial, layout padrão ou import de banco. O onboarding mobile fala de "cantinho" mobile (bottom-nav, gestos) — inadequado para desktop.

### 3.2 Goals
- Tela de boas-vindas desktop-aware citando recursos exclusivos (grafo, documentos, calendário, painéis).
- Escolha de workspace inicial + layout padrão (sidebar colapsada? densidade).
- Import de banco existente (`buildBackupPayload`/`importAppDatabase` já existe em `src/lib/exportImport.ts`).

### 3.3 Proposed desktop UX
- **DesktopWelcomeScreen** (`src/desktop/screens/DesktopWelcomeScreen.tsx`, nova): substitui `OnboardingScreen` no desktop quando `!onboarding.completed`.
  - Copy acolhedora pt-BR: "bem-vinda ao cantinho desktop ♡" + lista de recursos exclusivos (grafo de conhecimento, documentos paginados, calendário semanal, painéis lado a lado).
  - Passo 1: escolher workspace inicial (default `meus-estudos`).
  - Passo 2: layout padrão (sidebar expandida / colapsada; densidade confortável/compacta) → grava em DesktopSessionState.
  - Passo 3 (opcional): "importar banco" → usa `importAppDatabase` (já valida Zod). Feedback via toast.
  - CTA final: "começar" → `app.completeOnboarding(profile)`.
- **Web/mobile** continua com `OnboardingScreen` compartilhado (não alterado).

### 3.4 Components / Files
| Ação | Arquivo | Notas |
|---|---|---|
| **Criar** | `src/desktop/screens/DesktopWelcomeScreen.tsx` | Nova tela desktop-only; importa `useDesktopApp()`. |
| **Mudar** | `src/desktop/DesktopAppShell.tsx` | Trocar `!onboarding.completed ? <OnboardingScreen/>` por `<DesktopWelcomeScreen/>`. |
| **Mudar** | `src/lib/exportImport.ts` | Reusar `importAppDatabase` (já existe, validado em `exportImport.test.ts`); expor helper de seleção de arquivo para desktop (File API nativa, não Capacitor). |

### 3.5 Desktop-specific state
```ts
interface DesktopSessionState {
  // ...
  defaultWorkspaceId: string;     // escolhido no welcome
  density: 'comfortable' | 'compact';
  sidebarCollapsed: boolean;      // inicializado pelo welcome
}
```

### 3.6 Tokens
- Reusa tokens de onboarding mobile porém em canvas branco (`--ds-surface-canvas` #FFFFFF, G1) e sem paper-texture.
- Botões primários usam `var(--ds-accent-strong)` (rosa marca permitida em feedback/onboarding — hard constraint libera "feedback").

### 3.7 Acceptance criteria
- [ ] Desktop mostra `DesktopWelcomeScreen` (não `OnboardingScreen` mobile) no primeiro acesso.
- [ ] Escolha de workspace/layout grava em DesktopSessionState e persiste após reload.
- [ ] Import de banco funciona via `importAppDatabase` e valida schema (erro amigável se inválido).
- [ ] Web/mobile continua usando `OnboardingScreen` sem regressão.

### 3.8 User stories
- **como** nova usuária desktop, **quero** ver o que o desktop oferece de exclusivo, **para** começar com o layout que faz sentido para mim.

---

## 4. Layout / tokens (1.14)

### 4.1 Context / Problem
`desktop/LAYOUT-SPEC.md` define `hardConstraints` e GAP table G1–G14. Divergências atuais no código: canvas cream em vez de branco (G1), titleBar 74px (G2), radius 28px > teto 20px (G6), `shadow-xl` flutuante proibido (G7), `backdrop-blur` (G8), faltam `recentItems` (G4) e agrupamento do palette (G5). Tokens desktop só devem viver em `desktop-tokens.css` (já isolado: importado estaticamente só por `apps/desktop/src/app/main.tsx`).

### 4.2 Goals
- Conformar G1–G14 (ver tabela em `LAYOUT-SPEC.md` §GAP table, linhas 214–227).
- Tokens de densidade (compact/comfortable) e de contraste entre zonas.
- Tema "Notion-like" para zonas de produção (editor/grafo/calendário): calor só em Home/feedback.

### 4.3 Proposed desktop UX
- **Canvas branco puro** (`#FFFFFF`) em `workspaceCanvas` e root (G1) — substituir `bg-canvas`/`bg-surface-muted` por `var(--ds-surface-canvas)`.
- **Teto de radius = 20px** (`--ds-radius-xl`); overlay de escrita usa `rounded-[20px]` (G6); nunca acima.
- **Sem shadow-xl / shadow-floating** em desktop: usar `var(--ds-elevation-md)` (sombra só em flutuante, G7).
- **Sem backdrop-blur / liquid-glass** (G8): overlays ficam `bg-black/30` sem blur.
- **Sem paper-texture** em nenhuma superfície desktop.
- **Rosa nunca é fundo de painel** (sidebar/canvas/inspector) — rosa só em ações primárias e feedback.
- **Densidade**: `comfortable` (default) vs `compact` altera padding de listas/itens via token `--ds-density-pad`.
- **Contraste entre zonas**: sidebar ~2% mais escura que o canvas (estilo Notion); inspector pode ser levemente tingido para separar.

### 4.4 Components / Files
| Ação | Arquivo | Notas |
|---|---|---|
| **Mudar** | `src/desktop/styles/desktop-tokens.css` | Adicionar `--ds-surface-canvas:#FFFFFF`, `--ds-elevation-md`, `--ds-radius-xl:20px`, `--ds-density-pad`, tokens de contraste de zona. (Já isolado do web.) |
| **Mudar** | `src/desktop/DesktopAppShell.tsx` | `root`/`main` → `bg-[var(--ds-surface-canvas)]` (G1); overlay `rounded-[20px]` + `shadow-[var(--ds-elevation-md)]` + remover `backdrop-blur-[2px]` (G6/G7/G8, linhas 136/144). |
| **Mudar** | `src/desktop/components/DesktopTopbar.tsx` | `h-11`, `text-[22px] font-semibold` (G2/G3). |
| **Mudar** | `src/desktop/components/DesktopSidebar.tsx` | itens `px-2 py-1.5` + `rounded-[8px]` (G9/G10). |
| **Mudar** | `src/desktop/components/CommandPalette.tsx` | agrupar resultados por domínio com caption uppercase (G5). |
| **Criar/Estender** | `src/desktop/screens/HomeScreen.tsx` | seção `recentItems` (G4) derivada de `app.classes`/`app.readings`/`app.notes` — sem duplicar estado (ver 1.4 do relatório). |

### 4.5 Desktop-specific state
Nenhum estado novo obrigatório para G1–G14 além de `canvasClarity`/`density` (já em DesktopSessionState). A conformidade é puramente de tokens/classes.

### 4.6 Tokens (três camadas)
```
/* Primitive */
--ds-white: #FFFFFF;
--ds-ink-50: #FAF9F8;          /* ~2% abaixo do branco p/ sidebar */
/* Semantic */
--ds-surface-canvas: var(--ds-white);
--ds-surface-sidebar: var(--ds-ink-50);
--ds-elevation-md: 0 1px 3px rgba(40,32,34,0.08), 0 4px 12px rgba(40,32,34,0.06);
--ds-radius-xl: 20px;
--ds-radius-sm: 8px;
--ds-density-pad: 12px;        /* comfortable; compact → 8px */
```
Regra (design-system): **nunca hex raw em className** — usar `var(--ds-*)`. Hex só como valor de dado (course.color, coverColor) via `style={{}}`.

### 4.7 Acceptance criteria
- [ ] Canvas e root renderizam branco puro (#FFFFFF) — G1 verde.
- [ ] Nenhum `rounded-[NNpx]` acima de 20px; nenhum `shadow-xl`/`backdrop-blur` em desktop — G6/G7/G8 verdes.
- [ ] Sidebar/topbar respeitam G2/G3/G9/G10.
- [ ] `recentItems` presente na Home desktop (G4) e derivado do estado (sem cópia).
- [ ] Command Palette agrupa resultados por domínio (G5).
- [ ] `check-boundaries.mjs` continua verde (desktop não importa mobile estaticamente).

### 4.8 User stories
- **como** usuária, **quero** uma interface desktop calma e consistente, **para** focar na produção sem ruído visual.

---

## 5. Remoção do preview obsoleto (2.5)

### 5.1 Context / Problem
`src/shells/MobileAppShell.tsx:13` importa `DesktopSidebar` (stub) de `src/components/DesktopSidebar.tsx` e o renderiza no breakpoint `lg` (linhas 110–118) com props `{activeTab, onChangeTab, onOpenWizard, onOpenTaskExamWizard, onOpenCompose}`. O preview web largo mostra uma sidebar **legada/diferente** da shell Tauri real. Isso é o resíduo a remover.

### 5.2 Goals
- Eliminar o stub `src/components/DesktopSidebar.tsx`.
- `MobileAppShell` deixa de renderizar sidebar desktop; o web largo continua com a shell mobile (BottomNav/FAB).
- A sidebar desktop real vive só na shell Tauri (`apps/desktop` → `DesktopAppShell` → `src/desktop/components/DesktopSidebar.tsx`).

### 5.3 Como remover / tirar a parte mobile compartilhada (passo a passo concreto)

**Arquivos a DELETAR:**
- `src/components/DesktopSidebar.tsx` (stub, 103 linhas).

**Arquivos a EDITAR — `src/shells/MobileAppShell.tsx`:**
1. **Linha 13** — remover `import { DesktopSidebar } from '../components/DesktopSidebar';`
2. **Linha 22** — remover `const DesktopSidebarMemo = memo(DesktopSidebar);`
3. **Linhas 109–118** — remover o bloco:
   ```tsx
   {/* Sidebar desktop-web (≥ lg) — espelha a visibilidade da barra inferior */}
   {app.isBottomNavVisible && (
     <DesktopSidebarMemo
       activeTab={activeTab}
       onChangeTab={handleNavigate}
       onOpenWizard={app.openWizard}
       onOpenTaskExamWizard={app.openTaskExamWizard}
       onOpenCompose={openCompose}
     />
   )}
   ```
4. **Linha 101** — o container tem `lg:pl-60` (padding reservando espaço para a sidebar legada). Remover `lg:pl-60` (web largo volta a ser full-width mobile).
5. **Linha 8 + 105** — `isDesktop` é usado no branch do `EdgeSwipeBack` (`!Capacitor.isNativePlatform() && !isDesktop`). Como `MobileAppShell` é exclusivamente web/mobile (nunca desktop), o `!isDesktop` é redundante e viola o princípio de não-branchar-plataforma em UI compartilhada. Substituir por:
   ```tsx
   {!Capacitor.isNativePlatform() && (
     <EdgeSwipeBack swipeX={swipeX} onBack={app.handleSystemBack} canGoBack={app.canGoBack} />
   )}
   ```
   e **remover** `import { isDesktop } from '../lib/platform';` (linha 8).

**Estado a relocar:** nenhum estado de sessão desktop era gerenciado por este stub (ele só recebia props da pilha mobile). Todo estado de sessão desktop (colapso, workspace) passa a viver exclusivamente em `DesktopSessionState` (`apps/desktop/src/DesktopAppProvider.tsx`), lido pela sidebar real de `src/desktop`.

**Manter `check-boundaries.mjs` verde:** após a deleção, não resta nenhum import `src/components/DesktopSidebar` (estático) de `MobileAppShell`. O script `ERR_NO_NATIVE_DESKTOP` (desktop não importa mobile estaticamente) e `ERR_NO_PLATFORM_IN_SHARED` (UI compartilhada não brancha plataforma) permanecem satisfeitos, pois:
- `MobileAppShell` não importa mais código desktop.
- `MobileAppShell` não usa mais `isDesktop`/`__TAURI__`.

### 5.4 Acceptance criteria
- [ ] `src/components/DesktopSidebar.tsx` não existe mais.
- [ ] `grep -rn "components/DesktopSidebar" src/shells` retorna vazio.
- [ ] Web em tela larga (`lg`) mostra BottomNav/FAB (shell mobile), sem sidebar.
- [ ] `MobileAppShell` não importa `isDesktop` nem `../lib/platform`'s `isDesktop`.
- [ ] `npm run build` (web) e `node .github/scripts/check-boundaries.mjs` verdes.

---

## 6. Ponte Tauri / `isDesktop` (2.6)

### 6.1 Context / Problem
- `src/lib/platform.ts` exporta `isDesktop` (detecta `window.__TAURI_INTERNALS__`) e é usado em UI compartilhada (`MobileAppShell`), violando `ERR_NO_PLATFORM_IN_SHARED`.
- `src/lib/desktop.ts` é a ponte Tauri (notificações, updater, relaunch) usando `window.__TAURI__`. É importado por:
  - `src/desktop/components/DesktopUpdateSection.tsx:9` (desktop-only — ok em princípio)
  - `src/lib/notifications.ts:5-7` (**shared web lib** — puxa a ponte Tauri para o bundle web, indesejado)
- A shell desktop já "sabe" que é desktop por estar em `apps/desktop`; não precisa de `isDesktop` em UI compartilhada.

### 6.2 Goals
- `isDesktop`/`__TAURI__` não aparecem em `src/components`, `src/shells/ScreenLayers.tsx`, `src/overlays/*`.
- A ponte Tauri mora em `apps/desktop` (ou é importada só dinamicamente a partir de `apps/desktop`/`src/desktop`), nunca estaticamente de código compartilhado web.
- `check-boundaries.mjs` continua verde (desktop nunca importa mobile estaticamente; dynamic `import()` permitido).

### 6.3 Como remover / tirar a parte mobile compartilhada (passo a passo concreto)

**A. Mover a ponte Tauri**
- **Criar** `apps/desktop/lib/desktop.ts` — conteúdo idêntico ao atual `src/lib/desktop.ts` (notificações + updater + relaunch), porém importando `tauriGlobal()` de um helper local em `apps/desktop/lib/platform.ts` (ou reexportando de `src/lib/platform` **só o getter** `tauriGlobal`, que é seguro — não brancha UI).
- **Deletar** `src/lib/desktop.ts`.
- **Editar** `src/desktop/components/DesktopUpdateSection.tsx`: importar a ponte via caminho relativo permitido entre código desktop:
  ```ts
  // src/desktop é desktop-only e só é bundlado no app desktop;
  // importar de apps/desktop/lib/desktop respeita ERR_NO_NATIVE_DESKTOP (desktop→desktop).
  import { desktopCheckForUpdate, desktopDownloadAndInstallUpdate, desktopRelaunch }
    from '../../../apps/desktop/lib/desktop';
  ```
  (Alternativa mais limpa: `apps/desktop/lib/desktop.ts` reexporta e `src/desktop` importa de `apps/desktop` via alias de workspace. Definir no `tsconfig` de `apps/desktop` um alias `@desktop-bridge` → `apps/desktop/lib/desktop`.)

**B. Desacoplar `notifications.ts` (shared web lib)**
- **Editar** `src/lib/notifications.ts`: remover `import { desktopEnsureNotificationPermission, desktopNotify } from './desktop';` (linhas 5–7).
- O lembrete no **desktop** deve ser disparado pela shell desktop, não pela lib compartilhada. **Criar** `apps/desktop/src/app/desktopReminder.ts` que:
  - dinamicamente `import('../lib/desktop')` (bridge já em `apps/desktop/lib/desktop.ts`) e agenda o timer usando `desktopNotify`;
  - é iniciado por `DesktopAppProvider` quando `reminderSettings.enabled`.
- Assim o bundle **web** não contém mais a ponte Tauri.

**C. Eliminar `isDesktop` de UI compartilhada**
- `MobileAppShell.tsx`: já tratado na seção 5 (remover import + branch).
- `src/shells/ScreenLayers.tsx`: garantir que não usa `isDesktop` (o relatório indica uso de `useMobileApp`, não `isDesktop`; confirmar com `grep`). Se houver, substituir por resolução via `shell` prop já passada por `DesktopScreenLayers`.
- `src/overlays/*`: garantir ausência de `isDesktop`/`__TAURI__` (já atendido hoje).
- `src/lib/platform.ts` **pode permanecer** em `src/lib` (é lib, não UI compartilhada), mas seu uso em UI compartilhada deve ser eliminado. A shell desktop não precisa dele — sabe que é desktop por estar em `apps/desktop`.

**D. Manter `check-boundaries.mjs` verde**
- `ERR_NO_NATIVE_DESKTOP`: `apps/desktop/**` e `src/desktop/**` não importam `apps/mobile/**`, `src/shells/MobileAppShell.tsx`, `src/shells/ScreenLayers.tsx`, `src/components/views/**`. O novo `apps/desktop/lib/desktop.ts` importa apenas `@tauri/api` (ou `window.__TAURI__`) — não mobile. ✓
- `ERR_NO_PLATFORM_IN_SHARED`: `src/components`, `src/shells/ScreenLayers.tsx`, `src/overlays/*` não brancham `isDesktop`/`isMobile`/`Capacitor.isNativePlatform`/`__TAURI__`. Após remover o uso em `MobileAppShell` e confirmar `ScreenLayers`, ✓.
- **Import dinâmico é permitido**: o `desktopReminder.ts` (apps/desktop) usa `import('../lib/desktop')` dinâmico — não viola a regra de import estático. ✓

### 6.4 Components / Files
| Ação | Arquivo |
|---|---|
| **Mover** | `src/lib/desktop.ts` → `apps/desktop/lib/desktop.ts` |
| **Editar** | `src/desktop/components/DesktopUpdateSection.tsx` |
| **Editar** | `src/lib/notifications.ts` (remover import da ponte) |
| **Criar** | `apps/desktop/src/app/desktopReminder.ts` (timer Tauri via dynamic import) |
| **Editar** | `src/shells/MobileAppShell.tsx` (remover `isDesktop` — ver §5) |
| **Verificar** | `src/shells/ScreenLayers.tsx`, `src/overlays/*` (ausência de `isDesktop`/`__TAURI__`) |

### 6.5 Desktop-specific state
Nenhum estado novo; o timer de lembrete desktop e a ponte Tauri são efeitos da shell, não estado de sessão. `reminderSettings` (já no `AppContext`) continua sendo a fonte; a shell desktop apenas "escuta" para disparar `desktopNotify`.

### 6.6 Acceptance criteria
- [ ] `src/lib/desktop.ts` não existe; a ponte vive em `apps/desktop/lib/desktop.ts`.
- [ ] `src/lib/notifications.ts` não importa a ponte Tauri; bundle web não a inclui.
- [ ] `grep -rn "isDesktop\|__TAURI__" src/components src/shells/ScreenLayers.tsx src/overlays` retorna vazio.
- [ ] `DesktopUpdateSection` continua funcional no desktop (updater Tauri).
- [ ] Lembrete desktop dispara notificação do sistema via `apps/desktop/lib/desktop.ts`.
- [ ] `node .github/scripts/check-boundaries.mjs` verde; `npm run build` (web + desktop) verdes.

### 6.7 User stories
- **como** mantenedora, **quero** que o bundle web não carregue código Tauri, **para** separar de verdade as superfícies mobile e desktop.

---

## 7. Convenções transversais (skills aplicadas)

- **frontend-design**: identidade desktop distinta — neutraleza funcional na sidebar/topbar (estilo Notion), calor (rosa) restrito a Home/feedback; um "signature" discreto = breadcrumb contextual como bússola. Tipografia: display Plus Jakarta 22/600 só no titleBar.
- **web-design-guidelines**: foco de teclado visível em todos os itens da sidebar; `aria-label`/`aria-pressed` em toggles; `prefers-reduced-motion` respeitado nas transições de colapso; empty states da Home desktop são convites à ação.
- **vercel-react-best-practices**: `CommandPalette` e `KnowledgeGraph` continuam em `import()` dinâmico (bundle 2.4); badges/contagens derivados durante o render (re-render 5.1), não em estado; busca do palette usa `useDeferredValue` (re-render 5.14); sem componentes definidos dentro de componentes (re-render 5.4); `useCallback`/functional updates para handlers de atalho (re-render 5.11).
- **design-system**: tokens em três camadas (`desktop-tokens.css`), zero hex raw em classes; hex só como dado via `style={{}}`.
- **spec-driven-development**: cada módulo acima tem objetivo → UX → arquivos → estado desktop → tokens → aceite.
- **context-engineering**: estado de sessão desktop isolado em `DesktopSessionState`; UI compartilhada (`src/components`, `ScreenLayers`, `overlays`) permanece agnóstica à plataforma.

## 8. Open questions
- O alias de workspace `@desktop-bridge` deve ser adicionado ao `tsconfig` de `apps/desktop` ou usamos caminho relativo `../../../apps/desktop/lib/desktop`? (Recomendado: alias para evitar fragilidade de profundidade.)
- O botão "novo documento" da topbar deve aparecer desabilitado já nesta fase, ou ser ocultado até M4? (Recomendado: desabilitado com tooltip "em breve".)
