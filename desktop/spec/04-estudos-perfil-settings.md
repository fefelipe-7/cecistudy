# Spec: Estudos desktop, Perfil desktop e Settings/Updater

> Módulo: `04-estudos-perfil-settings` · Parte da separação de interface mobile/desktop (Fase 8+).
> Autor: spec escrita a partir do `00-relatorio-varredura.md` (seções 1.10, 1.11, 1.12, 2.4, 2.1).
> Status: proposta (aguarda revisão humana antes de `PLAN`/`TASKS`/`IMPLEMENT`).

Este documento cobre **três features desktop-only** que hoje ainda renderizam a view mobile
inteira (ou dependem de extras injetados na view compartilhada). Para cada uma, seguimos o
fluxo spec-driven: **problema → objetivo → UX desktop proposta → arquivos (criar/mudar) →
estado desktop em `DesktopSessionState` → tokens → critérios de aceite → como remover a parte
mobile compartilhada**.

---

## 0. Assumptions (superfícies de ambiguidade)

Antes de implementar, confirmar com a humana:

1. **A view `EstudosView` continua existindo como base mobile** — o desktop faz um *fork*
   (`EstudosScreen`) e NÃO altera o comportamento mobile do `EstudosView`.
2. **`DesktopSessionState` é o dono do estado visual desktop** (já definido em
   `apps/desktop/src/session/types.ts`). Novos campos entram lá, nunca no `AppContext` universal.
3. **A ponte Tauri (`src/lib/desktop.ts`) deve migrar para `apps/desktop`** (regra
   `ERR_NO_PLATFORM_IN_SHARED` / 2.6 do relatório). Até a migração, ela é importada só
   dinamicamente a partir da casca desktop.
4. **Overlays não brancham por plataforma** (regra `ERR_NO_PLATFORM_IN_SHARED`). A duplicata
   `DesktopOverlays`/`MobileOverlays` é unificada numa fonte compartilhada sem `isDesktop`.
5. **Tokens desktop** vivem em `src/desktop/styles/desktop-tokens.css` (`--ds-*`), importado só
   pelo `apps/desktop/src/app/main.tsx`. UI desktop usa `ceci-*` (compartilhado) + `--ds-*` (desktop).
6. **Boundary gate**: nenhuma mudança aqui pode fazer `node .github/scripts/check-boundaries.mjs`
   falhar. Desktop (`src/desktop`, `apps/desktop`) nunca importa estaticamente mobile
   (`apps/mobile`, `src/shells/MobileAppShell`, `src/shells/ScreenLayers`, `src/components/views/*`);
   shared (`src/components`, `src/shells/ScreenLayers`, `src/overlays`) nunca brancha por
   `isDesktop`/`__TAURI__`.

---

## Capability Map (escopo)

| Módulo id | Responsabilidade | Depende de |
|---|---|---|
| study-desktop | Fork desktop do study corner (sessões + multitarefa + flashcards) | session-state |
| perfil-desktop | Seção "Sessão desktop" + densidade/layout + ajuda/atalhos | session-state |
| settings-updater | Janela de preferências dedicada + controle de auto-update/canal | desktop-bridge |
| overlays-unify | Unificar `DesktopOverlays`/`MobileOverlays` em camada compartilhada | — |

Build order: `session-state` (já existe) → `overlays-unify` → `study-desktop` →
`perfil-desktop` → `settings-updater` (porque settings/updater depende da ponte Tauri migrada).

---

## 1. Study corner desktop (relatório 1.10)

### 1.1 Problema

Hoje o tab `estudos` no desktop renderiza a **view mobile inteira** `EstudosView`
(`ScreenLayers.tsx:280` → `app.isTccScreenOpen ? <TccView/> : <EstudosView/>`), e as telas de
foco (`StudyFocusScreen`, `StudyRevisarScreen`, `StudyLeiturasScreen`, `StudyHistoricoScreen`)
são ramos de `app.focusedStudyScreen` (`ScreenLayers.tsx:197-202`), também compartilhados.
Não há nenhum "study corner" desktop: sem master-detail de sessões, sem biblioteca de
flashcards em painel, sem multitarefa. O desktop tem tela larga desperdiçada.

### 1.2 Objetivo

Oferecer uma área de foco desktop com:
- **Painel de sessões de foco** com histórico em coluna lateral (sessões passadas de
  `StudySession`/`app.sessions`, hoje só acessíveis via `StudyHistoricoScreen` mobile).
- **Multitarefa**: timer de foco + leitura + flashcards em painéis lado a lado (SplitLayout).
- **Editor de baralho de flashcards** com drag/reorder (reordenação do `app.flashcards` do um curso).

### 1.3 UX desktop proposta

Layout (estudos desktop) em 3 zonas, dentro de `SplitLayout`/painéis:

```
┌───────────────────────────────────────────────────────────────────────┐
│ topbar: estudos › sessões de foco                                       │
├───────────────┬───────────────────────────────────┬─────────────────────┤
│ Coluna esquerda│ Painel central (timer/pomodoro)   │ Painel direito       │
│ Histórico de    │  StudyFocusScreen (fork desktop)  │ Flashcards do curso  │
│ sessões         │  + controles de multitarefa       │ (editor drag/reorder)│
│ (lista)         │                                    │  + leitura opcional  │
│                │                                    │                    │
└───────────────┴───────────────────────────────────┴─────────────────────┘
```

- A coluna esquerda (histórico) lista `app.sessions` agrupadas por dia; clicar abre o detalhe
  no painel central (em vez de navegar para `StudyHistoricoScreen` mobile).
- O painel central roda o `StudyFocusScreen` (timer pomodoro). Um seletor de "modo multitarefa"
  permite ancorar leitura (`StudyLeiturasScreen`) e flashcards no painel direito.
- O painel direito é o `FlashcardDeckEditor` (novo): lista de `app.flashcards` de um curso com
  drag/reorder (framer-motion `Reorder`), botão "estudar" abre o `StudyRevisarScreen` em overlay.
- Sub-tabs desktop (`subTabEstudos`) continuam vivendo no contexto (já levantadas na Fase 8-D),
  mas a home do estudos desktop é este workspace de painéis.

### 1.4 Arquivos (criar / mudar)

**Criar**
- `src/desktop/screens/EstudosScreen.tsx` — fork desktop do study corner (substitui o
  `EstudosView` no tab estudos da shell desktop). Usa `useDesktopApp()`.
- `src/desktop/components/StudySessionHistoryColumn.tsx` — coluna lateral de histórico
  (`app.sessions`), lê de `useDesktopApp()`, dispara `app.openStudyHistorico(sessionId)` ou
  seleção local em painel.
- `src/desktop/components/FlashcardDeckEditor.tsx` — editor de baralho com `Reorder.Group`/
  `Reorder.Item` (framer-motion); chama `app.handleReorderFlashcards(courseId, orderedIds)`.
  (Handler novo em `AppContext` — ver 1.6.)
- `src/desktop/components/StudyMultitaskPanel.tsx` — wrapper que posiciona timer + leitura +
  flashcards em `SplitLayout` (2 ou 3 painéis). Reusa `StudyFocusScreen`, `StudyLeiturasScreen`,
  `StudyRevisarScreen` (compartilhados) sem copiá-los.

**Mudar**
- `src/desktop/screens/DesktopScreenLayers.tsx` — em `buildDesktopEstudos`, retornar
  `<EstudosScreen/>` quando `app.subTabEstudos` não for uma sub-tela de foco dedicada; as telas
  `focus`/`revisar`/`leituras`/`historico` permanecem acessíveis via `OverlayContent`/painel, não
  mais como tela cheia mobile.
- `src/shells/ScreenLayers.tsx:280` — quando `shell==='desktop'`, renderizar `desktopEstudos`
  (injetado via prop, como já feito para `desktopHome`/`desktopFaculdade` em `:270-278`),
  NÃO `<EstudosView/>`. A view mobile `EstudosView` segue como base do mobile.
- `src/context/AppContext.tsx` — adicionar `handleReorderFlashcards(courseId, orderedIds)` e
  expor em `AppContextValue` (sem virar estado desktop — é dado do usuário).

> ⚠️ **Boundary**: `EstudosScreen` e os componentes novos vivem em `src/desktop/**` → podem
> importar `StudyFocusScreen` etc. de `src/components/estudos`? NÃO (isso seria
> `src/desktop` → `src/components/views` — permitido? `check-boundaries` proíbe
> `src/desktop/**` → `src/components/views/**mobile`. `StudyFocusScreen` está em
> `src/components/estudos`, não em `views`; confirmar com o gate. Se o gate bloquear, os
> componentes de foco devem ser movidos para `src/components/estudos` (fora de `views`) ou
> importados dinamicamente via `import()`). Recomendado: manter telas de foco em
> `src/components/estudos` e importar dinamicamente a partir de `src/desktop`.

### 1.5 Estado desktop em `DesktopSessionState`

Adicionar a `apps/desktop/src/session/types.ts`:
```ts
/** Módulos/painéis abertos no estudos desktop. */
studyPanels: ('timer' | 'leitura' | 'flashcards')[];
/** Curso cujo baralho está aberto no editor (ou null = todos). */
studyDeckCourseId: string | null;
/** Posição/redimensionamento dos painéis do estudo. */
studyLayout: Record<string, unknown>;
```
Esses campos NÃO entram no `SyncPackage` (não sincronizam) — são visuais de sessão (regra 2.1).

### 1.6 Tokens

- Reuso de `ceci-*` compartilhado (surface, border, text) para cards/inputs.
- `--ds-*`: `--ds-panel-gap` (gap entre painéis, ex. 12px), `--ds-pane-bg`, `--ds-pane-border`,
  `--ds-zone-divider`. Respeitar `hardConstraints` (desktop-tokens.css): rosa nunca é fundo de
  painel, teto radius 20px, sem `backdrop-blur`, sem bounce tátil, sem `paper-texture`.
- Hint de design (frontend-design): o "estudo" é zona de produção → tratamento mais sóbrio
  (Notion-like) que a Home; calor (rosa) só em feedback/celebração (confete de sessão concluída).

### 1.7 Critérios de aceite

- [ ] Abrir o tab estudos na shell Tauri mostra `EstudosScreen` (painéis), NÃO `EstudosView` mobile.
- [ ] Coluna de histórico lista `app.sessions`; clicar numa sessão abre detalhe no painel central.
- [ ] Timer + leitura + flashcards rodam lado a lado sem reload de tela.
- [ ] Drag/reorder de flashcards persiste ordem (`handleReorderFlashcards` grava em `app.flashcards`).
- [ ] `studyPanels`/`studyDeckCourseId`/`studyLayout` em `DesktopSessionState` e NÃO no `SyncPackage`.
- [ ] `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` verdes.

### 1.8 Como remover a parte mobile compartilhada

- O `EstudosView` mobile **continua sendo a base mobile** — não é deletado. A remoção do acoplamento
  é: parar de renderizar `<EstudosView/>` no `shell==='desktop'` (1.4) e passar a injetar
  `desktopEstudos` no `ScreenLayers` (igual a `desktopFaculdade`). O `EstudosView` deixa de ser
  "motor" do estudos no desktop; vira só base mobile.
- Telas de foco (`StudyFocusScreen` etc.) deixam de ser tela cheia mobile no desktop e passam a ser
  painéis do `StudyMultitaskPanel` (reuso, não cópia) — assim o mobile não perde funcionalidade.
- O estado de sessão desktop sai do `AppContext` universal e vai para `DesktopSessionState`.

---

## 2. Perfil desktop (relatório 1.11)

### 2.1 Problema

`PerfilView` (mobile) é renderizada inteira no desktop (`activeTab==='perfil'`). A única
diferença desktop é o `shellExtras.updateSection = DesktopUpdateSection` injetado por
`apps/desktop/src/DesktopAppProvider.tsx` (2.1/1.11) — ou seja, o Perfil é COMPARTILHADO com um
extra. Faltam: seção "Sessão desktop" (workspace ativo, painéis abertos, reset de sessão),
preferências de densidade/layout e atalhos de teclado na tela de ajuda.

### 2.2 Objetivo

Dar ao desktop uma área de perfil própria (sem depender de extra injetado), com:
- **Seção "Sessão desktop"**: workspace ativo (`lastWorkspaceId`), painéis abertos
  (`activePanels`), botão "resetar sessão desktop" (limpa `DesktopSessionState` visual, mantém dados).
- **Preferências de densidade/layout** persistidas em `DesktopSessionState`
  (`density: 'compact' | 'comfortable'`, `sidebarCollapsed`, `showInspector`).
- **Atalhos de teclado** listados numa tela de ajuda (`?` ou `⌘/`).

### 2.3 UX desktop proposta

- Fork `PerfilScreen` (desktop) herda a métrica reais do `PerfilView` (streak, stickers,
  estágio, TCC) mas adiciona, no topo ou numa aba "desktop", a seção "Sessão desktop".
- A seção "Sessão desktop" mostra: workspace atual (dropdown `WorkspaceSwitcher`), chips de
  `activePanels` (graph/calendar/inbox), e botão "resetar sessão" que zera `studyPanels`/
  `layoutState`/`graphViewport` (mantém `lastWorkspaceId` e dados do usuário).
- Densidade: toggle que aplica classe `data-density="compact|comfortable"` no root desktop →
  ajusta padding/row-height via `--ds-*`.
- Ajuda: `DesktopHelpScreen` (overlay) lista atalhos (`⌘K` busca, `⌘1…⌘4` navegação, `⌘/` ajuda).

### 2.4 Arquivos (criar / mudar)

**Criar**
- `src/desktop/screens/PerfilScreen.tsx` — fork desktop do perfil (baseia-se no `PerfilView`
  mobile, mas adiciona seção desktop). Usa `useDesktopApp()`.
- `src/desktop/components/DesktopSessionSection.tsx` — seção "Sessão desktop" (workspace,
  painéis, reset). Lê/escreve `DesktopSessionState` via `app.setSessionState`.
- `src/desktop/components/DensityToggle.tsx` — toggle compact/comfortable.
- `src/desktop/screens/DesktopHelpScreen.tsx` — overlay de atalhos (gatilho `⌘/`).

**Mudar**
- `src/desktop/screens/DesktopScreenLayers.tsx` — injetar `desktopPerfil` no `SlideContent`
  (prop nova, como `desktopHome`/`desktopFaculdade`).
- `src/shells/ScreenLayers.tsx` — aceitar prop `desktopPerfil` e usá-la quando
  `shell==='desktop' && activeTab==='perfil'` (igual ao padrão já existente de `desktopHome`).
- `apps/desktop/src/DesktopAppProvider.tsx` — REMOVER a injeção de `shellExtras.updateSection`
  (extra mobile). O updater passa a viver na janela de Settings (módulo 3), não no Perfil.
- `apps/desktop/src/session/types.ts` — adicionar `density`, `sidebarCollapsed`, `showInspector`.

### 2.5 Estado desktop em `DesktopSessionState`

```ts
density: 'compact' | 'comfortable';      // preferência de densidade
sidebarCollapsed: boolean;                // sidebar colapsada (persistida)
showInspector: boolean;                   // ContextInspector aberto
```
Reset de sessão zera `studyPanels`, `layoutState`, `graphViewport`, `studyDeckCourseId`,
`activePanels` (mantém `lastWorkspaceId`, `density`, dados do usuário).

### 2.6 Tokens

- `--ds-density-pad` (padding base por densidade), `--ds-row-h` (altura de linha),
  `--ds-zone-bg`. Aplicados via `data-density` no root desktop (css em `desktop-tokens.css`).
- Reuso de `ceci-*` para texto/botões.

### 2.7 Critérios de aceite

- [ ] Perfil desktop mostra seção "Sessão desktop" com workspace/painéis/reset.
- [ ] "Resetar sessão" limpa estado visual desktop e NÃO apaga dados do usuário (`courses`,
  `sessions`, `flashcards`…).
- [ ] Toggle de densidade altera layout via `--ds-*` e persiste em `DesktopSessionState`.
- [ ] `⌘/` abre `DesktopHelpScreen` com atalhos listados.
- [ ] `shellExtras.updateSection` removido do `DesktopAppProvider`; Perfil não brancha plataforma.
- [ ] `npm run lint` + `npm run test` + `check-boundaries.mjs` verdes.

### 2.8 Como remover a parte mobile compartilhada

- `PerfilView` mobile continua como base do mobile. O desktop passa a usar `PerfilScreen`
  (fork) injetado no `ScreenLayers` — igual ao padrão de `desktopHome`/`desktopFaculdade`.
- O acoplamento `shellExtras.updateSection` (a única "ponte" desktop→Perfil) é eliminado; o
  updater sai do Perfil e vai para Settings (módulo 3). Assim `PerfilView` deixa de precisar
  saber de plataforma alguma.

---

## 3. Settings / Updater (relatório 1.12)

### 3.1 Problema

`DesktopUpdateSection.tsx` (Tauri updater) só existe no desktop e hoje é injetado no Perfil
mobile via `shellExtras`. Configurações gerais vivem dentro de `PerfilView` (compartilhado).
Não há janela de preferências dedicada, e o controle de auto-update/canal (stable/beta) não
existe — `src/lib/desktop.ts` só faz check/install/relaunch.

### 3.2 Objetivo

Janela de preferências desktop dedicada (fora do Perfil mobile) com abas
**geral / aparência / atalhos / sync / updater**, incluindo:
- Controle de **auto-update** (ligado/desligado) e **canal** (stable/beta) via Tauri updater.
- Aparência: densidade (link com 2.5), tema claro/escuro do canvas desktop.
- Atalhos: mesma lista da ajuda (2.3), editável no futuro.
- Sync: status do `SyncPackage` (read-only nesta fase).

### 3.3 UX desktop proposta

- `DesktopPreferencesScreen` (overlay/janela) com `UnderlineTabBar` (ou pill) de abas.
- Aba **updater**: status da versão, botão verificar, toggle auto-update, select de canal
  (stable/beta). Escreve em `DesktopSessionState` (`updateChannel`, `autoUpdateEnabled`) e
  chama a ponte Tauri migrada (`apps/desktop/lib/desktop.ts`).
- Aba **aparência**: toggle densidade (reusa `DensityToggle`), toggle de tema do canvas.
- Aba **atalhos**: tabela de atalhos (read-only nesta fase).
- Aba **sync**: estado do `SyncPackage` (read-only).
- Aba **geral**: workspace padrão, limpar cache de sessão.

Gatilho: `⌘,` (preferências) ou item no menu da `DesktopSidebar`/`DesktopTopbar`.

### 3.4 Arquivos (criar / mudar)

**Criar**
- `apps/desktop/lib/desktop.ts` — MIGRAR a ponte Tauri de `src/lib/desktop.ts` para cá
  (regra 2.6). Exporta `desktopCheckForUpdate`, `desktopDownloadAndInstallUpdate`,
  `desktopRelaunch`, e novas `desktopSetUpdateChannel(channel)`, `desktopSetAutoUpdate(bool)`.
- `src/desktop/screens/DesktopPreferencesScreen.tsx` — janela de preferências (abas).
- `src/desktop/components/preferences/PrefsGeneralTab.tsx`
- `src/desktop/components/preferences/PrefsAppearanceTab.tsx`
- `src/desktop/components/preferences/PrefsShortcutsTab.tsx`
- `src/desktop/components/preferences/PrefsSyncTab.tsx`
- `src/desktop/components/preferences/PrefsUpdaterTab.tsx` (substitui `DesktopUpdateSection`).

**Mudar**
- `apps/desktop/src/DesktopAppProvider.tsx` — remover `DesktopUpdateSection` e `shellExtras`.
- `src/desktop/components/DesktopUpdateSection.tsx` — DELETAR (substituído por `PrefsUpdaterTab`).
- `src/lib/desktop.ts` — DELETAR após migrar para `apps/desktop/lib/desktop.ts` (elimina import
  estático de código compartilhado web — 2.6).
- `src/desktop/components/DesktopSidebar.tsx` / `DesktopTopbar.tsx` — adicionar gatilho
  `⌘,` / botão "preferências" que abre `DesktopPreferencesScreen` via `app.openPreferences()`
  (flag desktop em `DesktopSessionState` ou prop da shell — NÃO no `AppContext` universal).
- `apps/desktop/src/session/types.ts` — adicionar `updateChannel: 'stable'|'beta'`,
  `autoUpdateEnabled: boolean`, `isPreferencesOpen: boolean`.

> ⚠️ **Boundary**: `apps/desktop/lib/desktop.ts` usa `__TAURI__` — mora em `apps/desktop`, então
> OK. Nenhum arquivo em `src/components`, `src/shells`, `src/overlays` pode importá-lo. A abertura
> das preferências é uma flag da shell desktop (`isPreferencesOpen` em `DesktopSessionState`),
> resolvida dentro da shell, não no `ScreenLayers` compartilhado (evita item 2.2).

### 3.5 Estado desktop em `DesktopSessionState`

```ts
isPreferencesOpen: boolean;
updateChannel: 'stable' | 'beta';
autoUpdateEnabled: boolean;
```
(Não entram no `SyncPackage`.)

### 3.6 Tokens

- Reuso de `ceci-*` + `--ds-*` (paineis, abas). `UnderlineTabBar` já existe em `src/components/ui`.

### 3.7 Critérios de aceite

- [ ] `⌘,` abre `DesktopPreferencesScreen` com 5 abas.
- [ ] Toggle auto-update e select de canal gravam em `DesktopSessionState` e chamam a ponte Tauri.
- [ ] `DesktopUpdateSection` deletado; `src/lib/desktop.ts` deletado; ponte só em `apps/desktop`.
- [ ] Preferências fora do Perfil mobile (Perfil não tem mais seção de updater).
- [ ] `npm run lint` + `npm run test` + `check-boundaries.mjs` verdes.

### 3.8 Como remover a parte mobile compartilhada

- O updater deixa de ser injetado no `PerfilView` mobile (fim do `shellExtras`). Perfil mobile
  perde a seção de atualização (que era desktop-only mesmo).
- A ponte Tauri sai de `src/lib` (compartilhado web) e vai para `apps/desktop/lib` — web nunca
  mais a importa estaticamente (resolve 2.6).
- `DesktopPreferencesScreen` é desktop-only e referenciada só pela shell desktop.

---

## 4. Unificar overlays (relatório 2.4)

### 4.1 Problema

`src/overlays/DesktopOverlays.tsx` e `src/overlays/MobileOverlays.tsx` são QUASE idênticos
(ambos montam `QuickAddModal`, `GlobalSearchModal`, `EditCourseModal`, `EditTccModal`,
`ManageDataModal`, `DetailPromptModal`, `OtaUpdateModal`, `Toast`). É duplicação, não fork
intencional. O relatório 2.4 pede unificar numa fonte única OU mover para camada compartilhada
sem branch de plataforma.

### 4.2 Objetivo

Ter UMA implementação de overlays globais, sem `isDesktop`/`isMobile`/`__TAURI__` no código
compartilhado (respeita `ERR_NO_PLATFORM_IN_SHARED`).

### 4.3 UX proposta

- `src/overlays/GlobalOverlays.tsx` (novo, compartilhado) monta os modais acima. Usa
  `useApp()` (facade universal) — NÃO `useMobileApp` nem `useDesktopApp`.
- `DesktopOverlays` e `MobileOverlays` viram re-exports finos (ou são deletados e as shells
  passam a importar `GlobalOverlays` direto).
- O `DetailPromptModal` e o atalho `⌘K` ficam no `GlobalOverlays` (comportamento idêntico
  mobile/desktop). A checagem OTA (`initOta`) também (no-op no web).
- Diferenciação futura (ex.: `⌘K` → `CommandPalette` rico no desktop) é feita dentro da shell
  desktop, não no `GlobalOverlays`.

### 4.4 Arquivos (criar / mudar)

**Criar**
- `src/overlays/GlobalOverlays.tsx` — fonte única, usa `useApp()`.

**Mudar**
- `src/overlays/DesktopOverlays.tsx` — tornar re-export de `GlobalOverlays` (ou deletar e
  ajustar import em `apps/desktop`).
- `src/overlays/MobileOverlays.tsx` — tornar re-export de `GlobalOverlays` (ou deletar e
  ajustar import em `apps/mobile`).
- `apps/desktop/src/app/main.tsx` e `apps/mobile/src/app/main.tsx` — importar `GlobalOverlays`.

> ⚠️ **Boundary**: `GlobalOverlays` em `src/overlays` NÃO pode usar `isDesktop`/`__TAURI__`.
> Se precisar de algo desktop-only (ex.: abrir `CommandPalette`), isso é resolvido pela shell
> desktop sobrepondo seu próprio overlay, não dentro do `GlobalOverlays`.

### 4.5 Estado desktop

Nenhum novo estado — overlays consomem o `AppContext` universal.

### 4.6 Tokens

Sem mudança (reusa tokens dos modais existentes).

### 4.7 Critérios de aceite

- [ ] `GlobalOverlays` é a única implementação; `DesktopOverlays`/`MobileOverlays` são
  re-exports ou deletados.
- [ ] Nenhum `isDesktop`/`isMobile`/`__TAURI__` em `src/overlays/GlobalOverlays.tsx`.
- [ ] Comportamento de QuickAdd/busca/⌘K/OTA idêntico ao atual mobile e desktop.
- [ ] `npm run lint` + `npm run test` + `check-boundaries.mjs` verdes.

### 4.8 Como remover a parte mobile compartilhada

- Não há "parte mobile" a remover — o ponto é justamente ELIMINAR a distinção. O `GlobalOverlays`
  unifica ambas as shells; mobile e desktop passam a usar a mesma fonte. O fork intencional
  (CommandPalette desktop) vive na shell desktop, não nos overlays.

---

## 5. Resumo de mudanças em `DesktopSessionState`

`apps/desktop/src/session/types.ts` recebe:
```ts
// estudos (módulo 1)
studyPanels: ('timer' | 'leitura' | 'flashcards')[];
studyDeckCourseId: string | null;
studyLayout: Record<string, unknown>;
// perfil (módulo 2)
density: 'compact' | 'comfortable';
sidebarCollapsed: boolean;
showInspector: boolean;
// settings (módulo 3)
isPreferencesOpen: boolean;
updateChannel: 'stable' | 'beta';
autoUpdateEnabled: boolean;
```
Todos são estado VISUAL de sessão (não sincronizam, não entram no `SyncPackage`).

---

## 6. Comandos

```bash
# typecheck/lint (gate obrigatório)
npm run lint
# testes
npm run test
# boundary gate (obrigatório ao tocar packages/*, shells, overlays)
node .github/scripts/check-boundaries.mjs
# build web (validar que shared não puxa ponte Tauri)
npm run build
# build desktop (validar apps/desktop isolado)
npm run build --workspace=apps/desktop
```

## 7. Boundaries (regras desta spec)

- **Always**: rodar `lint` + `test` + `check-boundaries.mjs` antes de PR; manter tokens
  `ceci-*`/`--ds-*`; estado visual em `DesktopSessionState`.
- **Ask first**: mover `src/lib/desktop.ts` para `apps/desktop` (remoção de arquivo shared);
  deletar `DesktopUpdateSection`/`MobileOverlays`/`DesktopOverlays`.
- **Never**: import estático `src/desktop`/`apps/desktop` → mobile; `isDesktop`/`__TAURI__` em
  `src/components`, `src/shells/ScreenLayers`, `src/overlays`; entrar estado de sessão no
  `SyncPackage`.

## 8. Success Criteria (gerais)

- [ ] Tab estudos desktop = `EstudosScreen` (painéis), não `EstudosView` mobile.
- [ ] Perfil desktop tem seção "Sessão desktop" + densidade + ajuda `⌘/`, sem `shellExtras`.
- [ ] Preferências desktop dedicadas com auto-update/canal; ponte Tauri só em `apps/desktop`.
- [ ] Overlays unificados em `GlobalOverlays` sem branch de plataforma.
- [ ] `check-boundaries.mjs` passa; `lint` + `test` + `build` verdes.

## 9. Open Questions

1. O `EstudosView` mobile deve continuar como base do mobile ou ser substituído por um wrapper?
   (Esta spec mantém como base mobile — confirmar.)
2. A ponte Tauri migrada para `apps/desktop/lib/desktop.ts` quebra algum import web existente de
   `src/lib/desktop.ts` além de `DesktopUpdateSection`/`notifications.ts`? (Levantar no PLAN.)
3. Densidade "compact/comfortable" deve afetar só desktop ou também o preview web largo?
   (Recomendado: só desktop, via `data-density` no root da shell Tauri.)
4. Atalhos são editáveis nesta fase ou read-only? (Recomendado: read-only; edição é fase futura.)

---

*Spec escrita seguindo spec-driven-development (problem→goals→UX→files→state→tokens→acceptance→
remoção-mobile), frontend-design (zonas de produção sóbrias, calor só em feedback) e
user-stories (critérios de aceite por feature). O skill `user-stories/SKILL.md` não foi
encontrado no repositório; a metodologia de critérios de aceite foi aplicada inline.*
