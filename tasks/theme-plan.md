# Plano de Implementação: TEM-001 — Sistema de Temas (6 temas)

> Spec: `docs/archive/specs/TEM-001-sistema-de-temas.md` (arquivada 2026-09). Gate por fase: `npm run lint` + `npm run test` + `npm run build`.
> Edições em massa SEMPRE via `edit` tool (ou script UTF-8 explícito) + cheque de `�` (U+FFFD) — nunca PowerShell `Set-Content`.

## Task List

### TEM-A — Fundação do mecanismo

- [x] **A.1** Migrar `<body>` dos 2 index.html (hex → tokens)
  - Acceptance: `text-[#40383A]`→`text-ceci-primary`, `selection:bg-[#FFE9EE]`→`selection:bg-surface-rose`, `selection:text-[#B94862]`→`selection:text-ceci-brand-strong` em `index.html:18` e `apps/mobile/index.html:18`
  - Verify: `npm run lint` + grep zero `-[#` nos 2 htmls
  - Files: `index.html`, `apps/mobile/index.html` (o 3º html era `apps/desktop/index.html:19` — removido com o legado desktop)

- [x] **A.2** Criar módulo `src/lib/themes.ts` (tipos + THEMES[6] + applyTheme/removeTheme/isDarkTheme + applyThemeColorChrome)
  - Acceptance: exporta `ThemeId`, `Theme`, `ThemeTokens`, `THEMES`, `DEFAULT_THEME_ID`, `applyTheme`, `removeTheme`, `getThemeById`, `isDarkTheme`; paletas exatas do §3 da spec; `applyTheme` seta todos os tokens + `root.style.colorScheme` + `root.dataset.theme` + meta `theme-color`; `removeTheme` limpa tudo
  - Verify: testes A.3 verdes + `npm run lint`
  - Files: `src/lib/themes.ts` (novo)
  - Nota: amanhecer ajustado pós-spec — `on-brand` voltou a `#FFFFFF` com `brand-strong` `#B84E2E` (≥ 5.0:1; o coral `#D0603F` original não alcançava AA). `shadow-brand-rgb` do amanhecer = `184, 78, 46`.

- [x] **A.3** Criar `src/lib/__tests__/themes.test.ts`
  - Acceptance: ~25 testes (apply cobre todos os tokens; remove limpa; dataset/colorScheme por isDark; 6 temas completos e consistentes; round-trip; rosa-claro regressão p/ valores do index.css; themeColor/chartTheme válidos)
  - Verify: `npm run test -- src/lib/__tests__/themes.test.ts`
  - Files: `src/lib/__tests__/themes.test.ts` (novo)
  - Nota: 19 testes implementados (incl. os de contraste E.1 já embutidos).

- [x] **A.4** Adicionar tokens novos ao `@theme` do `index.css` (defaults = rosa-claro)
  - Acceptace: `--color-ceci-on-primary/brand/academic`, `--color-glass-hairline/pill-start/pill-end/pill-border`, `--color-shadow-brand-rgb` (default `175, 70, 95`); `--shadow-brand`/`--shadow-brand-soft` passam a `rgba(var(--shadow-brand-rgb), …)`; `color-scheme` declarado
  - Verify: `npm run lint` + build; nenhuma cor alterada com o tema default
  - Files: `src/index.css`
  - Nota: implementado com `--color-shadow-rgb` novo + alias de compat `--shadow-rgb: var(--color-shadow-rgb)` (as referências espalhadas em 8 arquivos seguem funcionando e mudam com o tema).

- [x] **A.5** Boot sem flash: `initTheme()` em `src/main.tsx` (antes do `createRoot`)
  - Acceptance: lê `themePref` síncrono (web `storage.getSync`) e aplica (na época, junto do `initPlatformFlags()`, que foi **removido** na limpeza do legado desktop)
  - Verify: dev build web mantém tema escolhido após reload sem salto de cor
  - Files: `src/main.tsx`, `src/lib/themes.ts`

- [x] **A.6** Persistência + handler no provider
  - Acceptance: `usePersistentState<ThemeId>('themePref', DEFAULT_THEME_ID)` em `DataClientProvider`; efeito aplica em mudança; expõe `currentTheme`/`isDark`/`selectTheme` (via mobileApp context / DataClientProvider); hidratação nativa pós-seed sem sobrescrever
  - Verify: `npm run lint` + persistência entre reloads
  - Files: `src/context/DataClientProvider.tsx`, `src/context/mobileApp.ts` (ou provider do tema)
  - Nota: exposto como `themePref`/`setThemePref` (tipado em `DataClientValue`, `DataClientAppSlice` e `AppContextValue`); o efeito aplica com `applyTheme(getThemeById(themePref))` e transição opt-in a partir do 2º apply (pula boot/hidratação).

- [x] **A.7** Transição opt-in de troca
  - Acceptance: `.theme-transitioning` no `html` durante troca manual (`* { transition: background-color .35s ease, color .25s ease, border-color .3s ease }`) respeitando `prefers-reduced-motion`; sem transição no boot
  - Verify: smoke visual trocando tema
  - Files: `src/index.css`, `src/lib/themes.ts`

- [x] **A.8** Atualizar `.context/themes.md` + `.context/themes/` + `.context/backlog.md` + `.context/design-system.md`
  - Acceptance: docs apontam a spec TEM-001 como fonte; 10 temas da doc antiga marcados como "futuro" (ssó os 6 são v1); design-system ganha tokens `on-fill`/`glass-*`
  - Files: `.context/themes.md`, `.context/themes/README.md`, `.context/backlog.md`, `.context/design-system.md`

### TEM-B — Tokenização dark (migrações mecânicas)

- [x] **B.1** `bg-ceci-primary(+hover/ink)+text-white` → `text-ceci-on-primary` (~56 usos)
  - Acceptance: zero `bg-ceci-primary\S*\s+text-white` e `hover:bg-ceci-(primary-hover|ink)[^\n]*text-white` restantes; visual do rosa-claro **idêntico** (on-primary default = branco)
  - Verify: `npm run lint` + `npm run test` + grep + `rg '�' src/`
  - Files: PillGroup, PillGroupMulti, SegmentedControl, SchedulePicker, TagField, WeekGrid, ExploreSections, WizardScaffoldFooter, LibraryFilterModal, ClassNoteModal, NoteTransformWizard, NoteDetailWizard, ClassNoteDetailWizard, InternshipDiaryView, ReaderModeModal, Toast, EstudosView + demais hits

- [x] **B.2** `bg-ceci-academic*+text-white` → `text-ceci-on-academic`; `bg-ceci-brand(strong)*+text-white` → `text-ceci-on-brand` (FAB/menus/CTAs)
  - Acceptance: migrados só onde o fundo é token de marca (NÃO escala crua); zero resto; rosa-claro idêntico
  - Verify: `npm run lint` + grep + `rg '�'`
  - Files: PillGroup (variant academic), floating-action-menu:47,79, QuickAddModal, wizards, EstudosView

- [x] **B.3** Glass nav/pill/fab → tokens `glass-*`
  - Acceptance: `.liquid-glass-pill` usa `glass-pill-start/end/border`+`glass-hairline`; `.liquid-glass-fab` hairline via `glass-hairline`; `HeaderNav:220` search pill e `:92` bordo do ícone; `bottom-nav-bar:55` hover; ícone do `+`/FAB usa `text-ceci-on-brand`
  - Verify: smoke visual nos 6 temas (pill/FAB legíveis)
  - Files: `src/index.css`, `src/components/HeaderNav.tsx`, `src/components/ui/bottom-nav-bar.tsx`, `src/components/ui/floating-action-menu.tsx`

- [x] **B.4** Translúcidos `bg-white/xx` de input/badge → tokens
  - Acceptance: `ComposeSheet:59,76`, `InternshipDiaryView` (`bg-white/60`) e afins → `surface-default`/`surface-input`/`bg-surface-rose`; mantidos `bg-white/xx` sobre **capas de livro coloridas** (dado)
  - Verify: `npm run lint` + smoke
  - Files: `src/components/views/ComposeSheet.tsx`, `InternshipDiaryView.tsx` (+ hits do grep `bg-white/`)

- [x] **B.5** ReaderModeModal — tokens fixos do leitor
  - Acceptance: `--color-reader-*` (paper/sepia/noturno) independentes do tema do app; remove `bg-ceci-primary`/`text-white` do noturno; limpa `black/5`, `border-black/10`; default do leitor segue `isDark` do app
  - Verify: `npm run lint` + smoke abrindo leitor nos 6 temas
  - Files: `src/components/widgets/ReaderModeModal.tsx`, `src/index.css`

- [x] **B.6** Dither charts — wiring `theme={isDark}`
  - Acceptance: `theme={isDark ? 'dark' : 'light'}` nos 4 pontos (`PerfilView:322`, `StudyHistoricoScreen:161,183`, `InternshipDiaryView:146`); variantes dark usam tokens (não só `neutral-900`/`white`)
  - Verify: `npm run lint` + smoke gráficos nos temas scuros
  - Files: `src/components/views/PerfilView.tsx`, `src/components/estudos/StudyHistoricoScreen.tsx`, `InternshipDiaryView.tsx`, `src/components/ui/dither-*.tsx`

### TEM-C — Chrome nativo / PWA

- [x] **C.1** `applyThemeColorChrome()` completa (meta theme-color + status bar nativa)
  - Acceptance: tema dark → StatusBar `Style.Light` + `backgroundColor = themeColor` (guard `isNative` + `@capacitor/status-bar`, seguindo padrão de import guardado/assíncrono do repo); web → meta atualizado
  - Verify: smoke no dev (?)platform=web + revisão de código; validação nativa fica p/ CI/device
  - Files: `src/lib/themes.ts`, `src/lib/native.ts`

- [x] **C.2** `focusOrientation.ts` restaura pelo tema ativo
  - Acceptance: ao sair do foco, theme-color/status bar voltam para `THEMES[themePref].themeColor` + estilo correto (não `#FFFCF8` fixo)
  - Verify: `npm run lint` + smoke do fluxo de foco
  - Files: `src/lib/focusOrientation.ts`

- [x] **C.3** Documentar limitação do splash/`capacitor.config.ts`/`manifest.json`
  - Acceptance: nota em `.context/architecture.md` — splash/bg embutidos são estáticos (marca); tema aplica em runtime via status bar/meta sem rebuild
  - Files: `.context/architecture.md`

### TEM-D — UI do seletor

- [x] **D.1** Componente de preview + grade no Perfil
  - Acceptance: novo `ThemePickerCard` (grid 2×3, mini-mock com canvas/surface-default/brand/academic/primary + label + emoji + check no ativo) dentro da `PersonalizationSection`; tocar aplica + `hapticSuccess()` + `.theme-transitioning` + persiste
  - Verify: `npm run lint` + smoke nos 6
  - Files: `src/components/views/perfil/ThemePickerCard.tsx` (novo), `PersonalizationSection.tsx`, `PerfilView.tsx`

- [x] **D.2** Testes do picker
  - Acceptance: renderiza 6 opções; clique chama `selectTheme` com o id; destaque do ativo reflete `currentTheme`
  - Verify: `npm run test`
  - Files: `src/components/views/perfil/__tests__/ThemePickerCard.test.tsx` (novo)

### TEM-E — Polimento, QA e docs

- [x] **E.1** Teste/script de contraste dos 6 temas
  - Acceptance: função pura `contrastRatio(hexA, hexB)` + validação dos pares primary/secondary sobre canvas e surface-default ≥ 4.5:1; roda em vitest
  - Verify: `npm run test`
  - Files: `src/lib/themes.ts` (helper), `src/lib/__tests__/themes.test.ts`

- [x] **E.2** Checklist de smoke visual por tema
  - Acceptance: percorrer home, faculdade (+curso), estudos (+foco, leitor), biblioteca (+templo), perfil (+aparência), wizards, quiz — documentar achados por tema em `docs/qa-temas.md`
  - Files: `docs/qa-temas.md` (novo)

- [x] **E.3** Gate final completo
  - Acceptance: `npm run lint` + `npm run test` (todos) + `npm run build` + `node .github/scripts/check-boundaries.mjs` verdes; `rg '�' src/` limpo; zero `bg-ceci-primary…text-white`/`bg-ceci-academic…text-white`
  - Files: —

## Ordem de execução
A → B → C → D → E. B depende de A (tokens `on-fill` existirem). C.1/C.2 dependem do A.5/A.6 (tema ativo conhecido no runtime). D depende de A completo.