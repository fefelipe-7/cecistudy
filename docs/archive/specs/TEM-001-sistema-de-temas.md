# Spec: TEM-001 — Sistema de Temas (6 temas · 3 claros + 3 escuros)

## Objective

Implementar um sistema de **temas intercambiáveis em runtime** no app mobile/web do cecistudy, com **6 temas** — 3 claros + 3 escuros — partindo do tema atual (`rosa-claro`) como default. A troca de tema deve adaptar **todo o app** (superfícies, texto, marca, bordas, sombras, glass nav, charts, chrome nativo) **sem sacrificar legibilidade (WCAG AA nos textos) nem o visual rico** atual.

> Status da ideia no projeto: existe uma documentação antiga em `.context/themes.md` (spec de 10 temas) que **nunca foi implementada em código** (sem `applyTheme`, sem estado, sem key de persistência, sem picker). Esta spec redefine o escopo para **6 temas (3+3)** e é a fonte da verdade da implementação. Os 4 temas restantes da doc antiga (`jardim`, `biblioteca`, `por-do-sol`, `nebulosa`, `cerâmica`) ficam como **expansão futura** — a arquitetura suporta N temas.

## Viabilidade (varredura 2026-09-16)

O mecanismo proposto (CSS variables trocadas no `:root`) é **viável e ~90% do código já está preparado**:

| Achado | Estado | Ação |
|---|---|---|
| Hex em classNames no `src/` | **0 ocorrências** (migração Fase 8-A concluída) | — |
| `--shadow-rgb` (temperatura de sombra) | **já existe** (`src/index.css:183`) — pré-requisito do plano de 2026 | faltam só `--shadow-brand*` |
| `bg-ceci-primary + text-white` | **~56 usos / ~35 arquivos** — o maior bloqueio: no dark, `ceci-primary` inverte p/ claro e o texto branco some | criar token `--color-ceci-on-primary` + migração mecânica |
| `bg-ceci-academic/brand-strong + text-white` | ~24 usos | tokens `ceci-on-academic` / `ceci-on-brand` |
| Escala crua (`rose-500`, `green-700`…) | ~247 usos / 86 arquivos | legíveis nos 2 modos; **manter** (P3 só se quiser dar cor a status) |
| `text-white` **sobre cor de marca fixa** (rose-500, green-400…) | ~95 usos | **manter** — fundo não inverte com tema |
| `bg-white/xx` translúcidos (inputs, glass, badges) | ~35 usos (~10 quebram no dark) | tokenizar via `surface-*` / tokens de glass |
| Glass nav/pill/fab (`color-mix(white…)` + inset branco) | `index.css:406-442` + `HeaderNav:220` + `bottom-nav-bar:55` | tokens de glass por tema |
| `<body>` dos index.html com hex raw | `index.html:18`, `apps/mobile/index.html:18`, `apps/desktop/index.html:19` | migrar p/ tokens |
| Dither charts variante dark | **variantes prontas** em cada chart mas `theme` nunca é passado | wiring `theme={isDark}` em 4 pontos |
| ReaderModeModal tema "noturno" | usa `bg-ceci-primary text-white` (mutável) | tokens fixos próprios do reader |
| `color-scheme` / `data-theme` / `prefers-color-scheme` | **zero** no repo | adicionar |
| Chrome nativo (theme-color, status bar, splash) | `index.html`×3, `manifest.json`, `capacitor.config.ts`, `BootSplash:111`, `native.ts:15`, restore `focusOrientation.ts` | helper dinâmico por tema |
| SCHEMA_VERSION | **13**; `MIGRATIONS` nos índices 2–13 | **NÃO** mexer (tema é preferência de app, como `reminder`) |

**Estimativa:** 3–5 sessões de edição mecanizada + verificação `npm run lint`/`test`/`build` por fase (gate do projeto).

---

## 1. Filosofia

- O tema muda a "atmosfera" do cantinho, mas **nunca** a identidade estrutural.
- **Regras fixas (independentes de tema):** tipografia (font-sans/display/serif/mono), escala de radius, tokens de foco imersivo (`--color-focus-*`), cores de **dados** (`course.color`, `coverColor`, `seg.color`, paletas de capa, `CHART_PASTELS`) via `style={{}}`, stickers/webp do mascote, cores de **escala crua** (rose/blue/green/yellow/red 50–900, beige) usadas como status/acentos pontuais.
- **O que muda por tema:** superfícies (canvas/surface-*), texto (ceci-primary…ink), marca (brand/academic), bordas, sombras (temperatura), glass (nav/pill/fab), glow de fundo, e **texto sobre fundo preenchido** (`ceci-on-primary/on-brand/on-academic`).
- Todo texto do corpo: **WCAG AA (≥ 4.5:1)** sobre canvas e sobre surface-default/surface-subtle/surface-muted. Textos de apoio (tertiary/muted/faded) podem ficar ≥ 3:1.

## 2. Os 6 temas

| # | ID | Nome (label) | Emoji | Tom | Atmosfera | Origem |
|---|---|---|---|---|---|---|
| 1 | `rosa-claro` | cantinho | 🌷 | claro | default atual — cozy academia, abajur | **atual** (index.css) |
| 2 | `oceano` | calmaria azul | 🌊 | claro | calma, erudição fluida, teal-petróleo | spec 10 (3.4) adaptado |
| 3 | `amanhecer` | energia coral | 🌅 | claro | quente, otimismo, coral/terracota | spec 10 (3.3) |
| 4 | `noturno` | cantinho aceso | 🌙 | escuro | dark suave, brand rosa sem drasta | spec 10 (3.2) |
| 5 | `mar-profundo` | profundeza azul | 🐋 | escuro | dark oceânico, calma profunda | **novo** (irmão escuro do oceano) |
| 6 | `neon` | néon vibrante | ⚡ | escuro | urbano, sintético, magenta + ciano | spec 10 (3.10) |

Default de novos perfis: `rosa-claro`. Cada tema carrega `isDark` → usado p/ `color-scheme`, `ChartTheme` dos dither-charts e status bar/style.

### 2.1 Contrato de tokens (`ThemeTokens`)

Todas as chaves abaixo existem como `--color-*` no `@theme` (as novas são adicionadas). `applyTheme` seta cada uma inline no `:root` via `setProperty` (especificidade inline vence o `@theme`) — utilitários Tailwind (`bg-surface-rose`, `text-ceci-primary`, `border-ceci-border-brand`…) resolvem a cor corrente automaticamente.

```
SURFACES      canvas · surface-default · surface-subtle · surface-muted
              surface-rose · surface-blue · surface-input · surface-warm
              canvas-glow-rose · canvas-glow-amber
TEXTO         ceci-primary · ceci-secondary · ceci-tertiary · ceci-muted
              ceci-faded · ceci-ink · ceci-primary-hover · ceci-text-soft
ON-FILL       ceci-on-primary · ceci-on-brand · ceci-on-academic      ← NOVOS
MARCA         ceci-brand · ceci-brand-strong · ceci-brand-soft · ceci-brand-hover
              ceci-academic · ceci-academic-strong
BORDAS        ceci-border-subtle · ceci-border-default · ceci-border-strong
              ceci-border-brand · ceci-border-academic
SOMBRAS       shadow-rgb (rgb triple) · shadow-brand-rgb (rgb triple)
GLASS         glass-hairline · glass-pill-start · glass-pill-end · glass-pill-border
              ← NOVOS (graus das receitas liquid-glass)
CHROME        scheme ('light'|'dark') · themeColor (hex p/ meta/status bar)
              chartTheme ('light'|'dark')
SCROLL        scroll-thumb · scroll-thumb-hover        ← NOVOS (P3)
```

Derivados de marca que o plan de 2026 deixava automático (alphas de `brand`) agora são **valores explícitos por tema** — elimina caixas-pretas e garante contraste intencional por tema (`surface-rose` não é mais sempre `brand@8%`; no `neon` o `surface-rose` é um magenta-tinto escuro, não um rosa-escuro).

### 2.2 Mecanismo de troca

```ts
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--color-${key}`, value)   // cada token do contrato (exceto chrome)
  }
  root.style.colorScheme = theme.tokens.scheme          // 'light' | 'dark'
  root.dataset.theme = theme.id                         // hook p/ charts + branches CSS
  applyThemeColorChrome(theme)                          // meta[name=theme-color] + status bar nativo
}
export function removeTheme(): void { /* removeProperty de cada token + scheme + dataset */ }
export function isDarkTheme(themeId: ThemeId): boolean  // THEMES[x].isDark
```

- **`root.dataset.theme`** (ex. `data-theme="neon"`): permite branches CSS declarativos se surgirem (ex. scrollbar em neon) e é a fonte p/ charts e helpers.
- **Boot sem flash:** em `src/main.tsx`, antes do `createRoot`, `initTheme()` lê a preferência **síncrona** (web: `storage.getSync('themePref')`) e aplica — espelho do `initPlatformFlags()`. No nativo (Preferences assíncronas) o splash/`themePref` defaultValue é `rosa-claro` e a hidratação assíncrona corrige sem salto perceptível.
- **Transição (opt-in):** classe `.theme-transitioning` no `html` durante `applyTheme` de uma mudança de usuário (`* { transition: background-color .35s ease, color .25s ease, border-color .3s ease }`), respeitando `prefers-reduced-motion`. Não usar no boot.

### 2.3 Persistência

- Chave `themePref` (tipo `ThemeId`) via `usePersistentState` em `DataClientProvider.tsx`, no mesmo bloco de `reminder`/`gcalEnabled` (preferência de **app**, não dado de usuário).
- **Sem bump de `SCHEMA_VERSION`, sem migração, sem mudança no `backupSchema`/export-import** (theme não entra no payload de banco nem no sync do GitHub — decisão consciente: tema é de dispositivo/gosto pessoal).
- Handler `handleThemeChange(themeId)` no provider + exposição `currentTheme`/`isDark` para views e charts.

---

## 3. Paletas dos 6 temas

> Valores legíveis; as "cores de texto" já conferidas contra canvas/surface (WCAG AA nas combinações principais). `on-*` = cor do texto sobre os preenchimentos (`primary`, `brand-strong`, `academic-strong`).

### 3.1 `rosa-claro` — cantinho (default, = atual)

```ts
tokens: {
  // SURFACES (valores exatos do index.css atual)
  canvas:'#FFF9F0', 'surface-default':'#FFFDF8', 'surface-subtle':'#FFF3E7',
  'surface-muted':'#F7F1EA', 'surface-rose':'#FFEFF3', 'surface-blue':'#F1F7FA',
  'surface-input':'#FBF5EF', 'surface-warm':'#FFF6E9',
  'canvas-glow-rose':'#FFE9E6', 'canvas-glow-amber':'#FFE6C4',
  // TEXTO
  'ceci-primary':'#3B3233', 'ceci-secondary':'#6B5F5E', 'ceci-tertiary':'#8E7F7B',
  'ceci-muted':'#A99A94', 'ceci-faded':'#BEB4B6', 'ceci-ink':'#282022',
  'ceci-primary-hover':'#2D2728', 'ceci-text-soft':'#524B4D',
  // ON-FILL
  'ceci-on-primary':'#FFFFFF', 'ceci-on-brand':'#FFFFFF', 'ceci-on-academic':'#FFFFFF',
  // MARCA
  'ceci-brand':'#D4617C', 'ceci-brand-strong':'#AF465F', 'ceci-brand-soft':'#EA718F',
  'ceci-brand-hover':'#A03B52', 'ceci-academic':'#4A879F', 'ceci-academic-strong':'#396D82',
  // BORDAS
  'ceci-border-subtle':'#F0E6DD', 'ceci-border-default':'#E7DACF',
  'ceci-border-strong':'#D8C7BA', 'ceci-border-brand':'#FFD0DB',
  'ceci-border-academic':'#CEE7F0',
  // SOMBRAS (rgb triples)
  'shadow-rgb':'122, 88, 72', 'shadow-brand-rgb':'175, 70, 95',
  // GLASS
  'glass-hairline':'rgba(255,255,255,0.50)',
  'glass-pill-start':'rgba(255,255,255,0.90)', 'glass-pill-end':'rgba(255,255,255,0.50)',
  'glass-pill-border':'rgba(255,255,255,0.70)',
},
scheme:'light', themeColor:'#FFEAF0', chartTheme:'light', isDark:false
```

### 3.2 `oceano` — calmaria azul (claro)

```ts
tokens: {
  canvas:'#F7FAFB', 'surface-default':'#FFFFFF', 'surface-subtle':'#F2F7F9',
  'surface-muted':'#F0F4F6', 'surface-rose':'#EBF4F8', 'surface-blue':'#E3F0F6',
  'surface-input':'#F6FAFB', 'surface-warm':'#EFF5F4',
  'canvas-glow-rose':'#E3F1F7', 'canvas-glow-amber':'#E3F1EE',
  'ceci-primary':'#243440', 'ceci-secondary':'#556A78', 'ceci-tertiary':'#7A8E9B',
  'ceci-muted':'#9BA6AD', 'ceci-faded':'#BCC4C9', 'ceci-ink':'#18242C',
  'ceci-primary-hover':'#1C2830', 'ceci-text-soft':'#4E5B67',
  'ceci-on-primary':'#FFFFFF', 'ceci-on-brand':'#FFFFFF', 'ceci-on-academic':'#FFFFFF',
  'ceci-brand':'#3C8EA0', 'ceci-brand-strong':'#2A7587', 'ceci-brand-soft':'#7DB8C8',
  'ceci-brand-hover':'#236372', 'ceci-academic':'#4A879F', 'ceci-academic-strong':'#396D82',
  'ceci-border-subtle':'#E4ECF0', 'ceci-border-default':'#D5E2E8',
  'ceci-border-strong':'#C2D4DC', 'ceci-border-brand':'rgba(60,142,160,0.22)',
  'ceci-border-academic':'rgba(74,135,159,0.22)',
  'shadow-rgb':'36, 52, 64', 'shadow-brand-rgb':'42, 117, 135',
  'glass-hairline':'rgba(255,255,255,0.50)',
  'glass-pill-start':'rgba(255,255,255,0.90)', 'glass-pill-end':'rgba(255,255,255,0.50)',
  'glass-pill-border':'rgba(255,255,255,0.70)',
},
scheme:'light', themeColor:'#E3F0F6', chartTheme:'light', isDark:false
```

### 3.3 `amanhecer` — energia coral (claro)

```ts
tokens: {
  canvas:'#FFFAF5', 'surface-default':'#FFFFFF', 'surface-subtle':'#FFF7EE',
  'surface-muted':'#FAF5ED', 'surface-rose':'#FFEDE3', 'surface-blue':'#F2F7FB',
  'surface-input':'#FBF5EE', 'surface-warm':'#FFF3E6',
  'canvas-glow-rose':'#FFE0D4', 'canvas-glow-amber':'#FFE6C4',
  'ceci-primary':'#3D2E28', 'ceci-secondary':'#6B5A52', 'ceci-tertiary':'#917F77',
  'ceci-muted':'#ADA094', 'ceci-faded':'#C4B7B0', 'ceci-ink':'#271C18',
  'ceci-primary-hover':'#33231C', 'ceci-text-soft':'#55463E',
  'ceci-on-primary':'#FFFFFF', 'ceci-on-brand':'#FFFFFF', 'ceci-on-academic':'#FFFFFF',
  'ceci-brand':'#E8785A', 'ceci-brand-strong':'#B84E2E', 'ceci-brand-soft':'#F2A48D',
  'ceci-brand-hover':'#9E3E22', 'ceci-academic':'#5A8FA8', 'ceci-academic-strong':'#407090',
  'ceci-border-subtle':'#F2E8DF', 'ceci-border-default':'#E9D8C8',
  'ceci-border-strong':'#DCC8B5', 'ceci-border-brand':'rgba(232,120,90,0.22)',
  'ceci-border-academic':'rgba(90,143,168,0.25)',
  'shadow-rgb':'60, 46, 40', 'shadow-brand-rgb':'184, 78, 46',
  'glass-hairline':'rgba(255,255,255,0.50)',
  'glass-pill-start':'rgba(255,255,255,0.90)', 'glass-pill-end':'rgba(255,255,255,0.50)',
  'glass-pill-border':'rgba(255,255,255,0.70)',
},
scheme:'light', themeColor:'#FFEDE3', chartTheme:'light', isDark:false
```

> `on-brand` do amanhecer é branco sobre um brand-strong aprofundado (`#B84E2E`, ≥ 5.0:1): o coral `#D0603F` original (médio-saturado) não alcançava AA com texto escuro nem branco (~4.0–4.2:1) — o brand-strong é a cor usada em botões com texto, então ele carrega a legibilidade; o coral vívido `#E8785A` segue como acento decorativo.

### 3.4 `noturno` — cantinho aceso (escuro)

```ts
tokens: {
  canvas:'#161214', 'surface-default':'#221E20', 'surface-subtle':'#2A2628',
  'surface-muted':'#1E1B1C', 'surface-rose':'#2B2024', 'surface-blue':'#1F262C',
  'surface-input':'#262123', 'surface-warm':'#262021',
  'canvas-glow-rose':'rgba(232,145,156,0.05)', 'canvas-glow-amber':'rgba(255,200,180,0.03)',
  'ceci-primary':'#E8DFDB', 'ceci-secondary':'#B5ADAB', 'ceci-tertiary':'#8A8385',
  'ceci-muted':'#6D6668', 'ceci-faded':'#4E484A', 'ceci-ink':'#F5F0EC',
  'ceci-primary-hover':'#D9D0CC', 'ceci-text-soft':'#C6BFBC',
  'ceci-on-primary':'#161214', 'ceci-on-brand':'#161214', 'ceci-on-academic':'#161214',
  'ceci-brand':'#E8919C', 'ceci-brand-strong':'#D4728A', 'ceci-brand-soft':'#F2B8C4',
  'ceci-brand-hover':'#C25E76', 'ceci-academic':'#8FC5D4', 'ceci-academic-strong':'#6BAABB',
  'ceci-border-subtle':'#2E2A2C', 'ceci-border-default':'#3A3538',
  'ceci-border-strong':'#4A4548', 'ceci-border-brand':'rgba(232,145,156,0.25)',
  'ceci-border-academic':'rgba(143,197,212,0.25)',
  'shadow-rgb':'0, 0, 0', 'shadow-brand-rgb':'212, 114, 138',
  'glass-hairline':'rgba(255,255,255,0.06)',
  'glass-pill-start':'rgba(255,255,255,0.16)', 'glass-pill-end':'rgba(255,255,255,0.05)',
  'glass-pill-border':'rgba(255,255,255,0.12)',
},
scheme:'dark', themeColor:'#161214', chartTheme:'dark', isDark:true
```

> Contraste: primary `#E8DFDB`/canvas `#161214` ≈ 11.5:1 ✓ · secondary ≈ 7.4 ✓ · tertiary ≈ 4.6 ✓. `on-fill`s = tinta escura porque as cores de marca/relevo clareiam no dark.

### 3.5 `mar-profundo` — profundeza azul (escuro, **novo**)

```ts
tokens: {
  canvas:'#10161B', 'surface-default':'#1A242B', 'surface-subtle':'#212E36',
  'surface-muted':'#161F25', 'surface-rose':'#1C2B31', 'surface-blue':'#1E2A33',
  'surface-input':'#202C33', 'surface-warm':'#212B31',
  'canvas-glow-rose':'rgba(95,179,196,0.05)', 'canvas-glow-amber':'rgba(127,187,208,0.04)',
  'ceci-primary':'#E2EBEF', 'ceci-secondary':'#ACBEC7', 'ceci-tertiary':'#8297A1',
  'ceci-muted':'#647882', 'ceci-faded':'#4A5B64', 'ceci-ink':'#F2F7FA',
  'ceci-primary-hover':'#D3DEE4', 'ceci-text-soft':'#C2D1D9',
  'ceci-on-primary':'#10161B', 'ceci-on-brand':'#10161B', 'ceci-on-academic':'#10161B',
  'ceci-brand':'#5FB3C4', 'ceci-brand-strong':'#4A9CAE', 'ceci-brand-soft':'#8CCDD9',
  'ceci-brand-hover':'#3B8496', 'ceci-academic':'#7FBBD0', 'ceci-academic-strong':'#5FA3BB',
  'ceci-border-subtle':'#232F37', 'ceci-border-default':'#2E3C46',
  'ceci-border-strong':'#3F505B', 'ceci-border-brand':'rgba(95,179,196,0.25)',
  'ceci-border-academic':'rgba(127,187,208,0.25)',
  'shadow-rgb':'0, 0, 0', 'shadow-brand-rgb':'74, 156, 174',
  'glass-hairline':'rgba(255,255,255,0.06)',
  'glass-pill-start':'rgba(255,255,255,0.16)', 'glass-pill-end':'rgba(255,255,255,0.05)',
  'glass-pill-border':'rgba(255,255,255,0.12)',
},
scheme:'dark', themeColor:'#10161B', chartTheme:'dark', isDark:true
```

### 3.6 `neon` — néon vibrante (escuro)

```ts
tokens: {
  canvas:'#0F0F12', 'surface-default':'#1A1A20', 'surface-subtle':'#22222B',
  'surface-muted':'#16161C', 'surface-rose':'#241B24', 'surface-blue':'#1C2230',
  'surface-input':'#201F28', 'surface-warm':'#232029',
  'canvas-glow-rose':'rgba(233,59,140,0.06)', 'canvas-glow-amber':'rgba(0,212,170,0.05)',
  'ceci-primary':'#E6E0F0', 'ceci-secondary':'#B0A8C0', 'ceci-tertiary':'#86809A',
  'ceci-muted':'#68627A', 'ceci-faded':'#504A5C', 'ceci-ink':'#F4F0FF',
  'ceci-primary-hover':'#D8D1E8', 'ceci-text-soft':'#C8C2DA',
  'ceci-on-primary':'#0F0F12', 'ceci-on-brand':'#FFFFFF', 'ceci-on-academic':'#0F0F12',
  'ceci-brand':'#E93B8C', 'ceci-brand-strong':'#D42A7C', 'ceci-brand-soft':'#F27AAA',
  'ceci-brand-hover':'#B8206A', 'ceci-academic':'#00D4AA', 'ceci-academic-strong':'#00B894',
  'ceci-border-subtle':'#26252E', 'ceci-border-default':'#33313C',
  'ceci-border-strong':'#44424E', 'ceci-border-brand':'rgba(233,59,140,0.30)',
  'ceci-border-academic':'rgba(0,212,170,0.25)',
  'shadow-rgb':'0, 0, 0', 'shadow-brand-rgb':'212, 42, 124',
  'glass-hairline':'rgba(255,255,255,0.08)',
  'glass-pill-start':'rgba(255,255,255,0.18)', 'glass-pill-end':'rgba(255,255,255,0.05)',
  'glass-pill-border':'rgba(255,255,255,0.14)',
},
scheme:'dark', themeColor:'#0F0F12', chartTheme:'dark', isDark:true
```

> `on-brand` do neon é **branco** (`#D42A7C` é vívido → branco ≈ 4.8:1 ✓), enquanto noturno/mar-profundo usam tinta escura — comprova que `on-*` precisa ser explícito por tema, não derivado.

---

## 4. Integração (pontos que precisam de mudança)

### 4.1 Tokenização dark obrigatória (migrações mecânicas)

| # | Padrão atual | Substituição | Volume | Alvos |
|---|---|---|---|---|
| 1 | `bg-ceci-primary|hover:bg-ceci-primary-hover|hover:bg-ceci-ink` + `text-white` | `text-ceci-on-primary` | ~56 | PillGroup, PillGroupMulti, SegmentedControl, SchedulePicker, TagField, WeekGrid:49, ExploreSections:97, WizardScaffoldFooter, LibraryFilterModal, ClassNoteModal, NoteTransformWizard, NoteDetailWizard, ClassNoteDetailWizard, InternshipDiaryView, ReaderModeModal:167, Toast, EstudosView:125… |
| 2 | `bg-ceci-academic*` + `text-white` | `text-ceci-on-academic` | ~12 | PillGroup (academic variant), calendário, badges |
| 3 | `bg-ceci-brand-strong|bg-ceci-brand` + `text-white` (FAB/menus/CTAs) | `text-ceci-on-brand` | ~12 | floating-action-menu:47,79, QuickAddModal, wizards, EstudosView |
| 4 | `text-white` sobre **escala crua** (rose-500, green-400/700, red-400, blue-600) | **manter** | ~95 | quiz feedback, Toggle, CalendarMonth:120, StudyRevisar:162, badges |
| 5 | `<body class="text-[#40383A] selection:bg-[#FFE9EE] selection:text-[#B94862]">` | `text-ceci-primary selection:bg-surface-rose selection:text-ceci-brand-strong` | 3 htmls | `index.html:18`, `apps/mobile/index.html:18`, `apps/desktop/index.html:19` |

### 4.2 CSS (`src/index.css`)

| Ponto | Mudança |
|---|---|
| `--shadow-brand` / `--shadow-brand-soft` (191-192) | `rgba(var(--shadow-brand-rgb), …)` — applyTheme seta `--shadow-brand-rgb` |
| `.liquid-glass-nav` (407-410) | já semântico (`surface-rose 72%`) ✓ — só garante `surface-rose` por tema |
| `.liquid-glass-pill` (419-429) | gradiente/borda/hairline via `glass-pill-start/end/border` + `glass-hairline` |
| `.liquid-glass-fab` (434-442) | `hairline` via `glass-hairline`; ícone/`+` usa `text-ceci-on-brand` (componente) |
| `body::before` glow (204-213) | já usa `canvas-glow-*` ✓ — dark define glows quase transparentes |
| scrollbar (366-375) | P3: `--scroll-thumb`/`--scroll-thumb-hover` por tema |
| `:root` | adicionar `color-scheme: var(--scheme)` (ou setar `root.style.colorScheme`) + novos tokens no `@theme` |
| `HeaderNav`, course icon detail | `border-white/80` (92) / `bg-white/80` → tokens de glass/surface |
| search pill `HeaderNav:220` (`bg-white/60 border-white/70`) | tokens de glass (reusa `glass-pill-*`) |
| `bottom-nav-bar:55` `hover:bg-white/40` | token `glass-hairline` ou `hover:bg-surface-default` |
| `ComposeSheet:59,76` (`bg-white`/`bg-white/80`) | `bg-surface-default`/`bg-surface-input` |
| `InternshipDiaryView` `bg-white/60` ×2 | `bg-surface-rose`/`bg-surface-blue` ou `bg-surface-muted` |

### 4.3 ReaderModeModal (temas internos do leitor)

- O modo `noturno` do reader **não** pode depender de `ceci-primary` (inverte com o tema). Criar tokens próprios fixos `--reader-*` (como `--color-focus-*`): background/texto/acento nas 3 variações (`paper`/`sepia`/`noturno`).
- Limpar `hover:bg-black/5`, `border-black/10` do reader → tokens do reader.
- **Decisão de UX:** o tema interno do leitor é independente do tema do app (conteúdo), mas o **default** deve acompanhar o app (se o app está dark, abre em `noturno`, não em `paper`).

### 4.4 Dither charts

- `<FunnelChart theme={...}>` etc. não recebem `theme` hoje (default `'light'`). Passar `theme={isDark ? 'dark' : 'light'}` via hook de tema em: `PerfilView:322` (funil), `StudyHistoricoScreen:161,183` (growth+donut), `InternshipDiaryView:146` (growth).
- Nas variantes dark dos charts, substituir `bg-neutral-900`, `text-white`, `border-neutral-700`, `bg-white/10` por tokens do tema (canvas/border) onde fizerem sentido; paletas de dado (`CHART_PASTELS`) permanecem.

### 4.5 Chrome nativo / PWA

| Origem | Hoje | Ação (não exige rebuild fora do StatusBar) |
|---|---|---|
| `meta[name=theme-color]` | `#FFEAF0` (`index.html`×3) | helper `applyThemeColorChrome()`: seta no runtime conforme `theme.themeColor` (espelho do `focusOrientation`) |
| `manifest.json:50-51` | `#FFFCF8`/`#FFEAF0` | manter como fallback claro (PWA escondido) — o meta dinâmico comanda a barra |
| StatusBar nativo | `native.ts:15` `Style.Dark` | em tema dark: `Style.Light` + `backgroundColor = themeColor` (via `@capacitor/status-bar`, guard `isNative`) |
| Splash/background | `capacitor.config.ts:7-31` `#FFFCF8`/`#fef6eb`, `BootSplash:111` `#fef6eb` | manter (splash estática de marca é OK — é o logo carregando). Documentar limitação |
| restore `focusOrientation.ts:82-83` | restaura `#FFFCF8` + Dark | restaurar a partir do **tema ativo** (`THEMES[themePref].themeColor` + style) |

### 4.6 Hook de tema p/ views/charts

Novo hook leve (no `DataClientProvider` ou `mobileApp` context): `useTheme()` → `{ currentTheme, isDark, selectTheme }`. Views que precisam de `isDark` (charts, glass branches pontuais) consomem do existente; o valor vem do estado persistido.

---

## 5. UI do seletor (Perfil → aparência)

- Card **"aparência ♡ seu cantinho"** dentro da `PersonalizationSection` (ou nova seção do Perfil), acima do formulário de perfil.
- **Grid 2×3** de swatches: cada card = mini-mock do app (círculo/retângulo com `canvas`, `surface-default`, `brand`, `academic`, `primary`) + label + emoji. Tema ativo = borda `border-ceci-brand-strong` + check.
- Ao tocar: `applyTheme` imediato + `hapticSuccess()` + persistir + transição `.theme-transitioning`.
- Copy pt-BR acolhedora ("trocar a pele do cantinho ♡", "guardar escolha").
- (**Futuro, fora do escopo:** opção "seguir o sistema" via `prefers-color-scheme`; tema por workspace.)

---

## 6. Testes e verificação

- **`themes.test.ts`** (vitest/jsdom): `applyTheme` seta todos os tokens do contrato no root; `removeTheme` limpa; `dataset.theme`/`colorScheme` batem com `isDark`; round-trip de persistência; todos os 6 temas têm todas as chaves do `ThemeTokens` e `themeColor`/`chartTheme` válidos; IDs únicos; regressão nos valores do `rosa-claro` (equal ao index.css atual).
- **Wiring de on-fill:** após migração B, `grep` garante zero `bg-ceci-primary…text-white` e zero `bg-ceci-academic…text-white` restantes.
- **Contraste:** script/teste P3 que valida os pares primários (primary/secondary sobre canvas e surface-default) ≥ 4.5:1 dos 6 temas (função de relative-luminance pura, testável).
- **Gate:** `npm run lint` + `npm run test` + `npm run build` verdes a cada fase; `node .github/scripts/check-boundaries.mjs` ao final (não deve ser afetado — tudo em `src/lib`/`src/components`, sem tocar `packages/*`).
- **Check UTF-8:** após edições em massa, `rg '�'` (U+FFFD) em `src/` para não repetir o incidente de 2026-08.

---

## 7. Fora de escopo (v1)

- Os 4+ temas restantes da doc antiga (`jardim`, `biblioteca`, `por-do-sol`, `nebulosa`, `cerâmica`) — arquitetura já suporta adicionar.
- `prefers-color-scheme` automático / "seguir sistema".
- Tokens de status (`success`/`danger`/`warning` semânticos) — escala crua atual é legível nos 2 modos; vira P3 de polimento.
- Desktop Tauri/Flutter (o novo desktop é Flutter+Rust e tem tema próprio — fora deste escopo mobile).