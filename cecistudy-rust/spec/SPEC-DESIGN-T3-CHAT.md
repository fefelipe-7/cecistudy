# SPEC-DESIGN-T3-CHAT — Design System "T3 Chat" para o Desktop Flutter

> Plano de implementação para substituir o tema atual (claro quente bege/rosa) pelo design
> system **"T3 Chat"** (shadcn/ui): paleta magenta/rosa sobre base roxo-escura, com dark e
> light modes. Data: 2026-09-18.
>
> **Relação com specs anteriores:** este documento **substitui a camada de cor/tema** do
> `SPEC-DESIGN-DESKTOP-UI-UX.md` (§3 mapeamento, §6 estrutura de tema). Layout, spacing,
> radius e as correções de UX daquela spec seguem válidos, exceto onde redefinidos aqui.
> A spec v3 de correções (contraste canvas × card, sombra zero, avatar neutro) continua
> sendo a base — o T3 **preserva** essas regras:
> - separação por **contraste + borda 1px**, sem sombra em card fixo;
> - `kDesktopOverlayShadow` só para overlay/hover/dropdown;
> - avatar neutro (muted + textPrimary).

---

## 1. Objetivo

Adotar no desktop Flutter (`apps/desktop-flutter/`) o design system **"T3 Chat"** definido no
JSON do usuário — identidade magenta/rosa (`#A3004C`, ring `#DB2777`) sobre neutros
roxo-acinzentados, **dark-first** (o T3 Chat é um app dark; a paleta light foi construída
mantendo a mesma identidade). Resultado esperado: cards quase-pretos flutuando sobre um
canvas plum-escuro no dark, magenta aparecendo em poucos pontos de destaque, acabamento
"chat/terminal moderno" com sombra de glow reservada para elementos vivos (logo, foco,
overlay) — nunca para separar card do fundo.

---

## 2. Como o tema atual é usado (análise base)

### 2.1 Arquitetura (fonte da verdade do tema)

| Camada | Arquivo | Papel |
|---|---|---|
| Tokens de cor | `lib/theme/ceci_colors.dart` | `CeciColors extends ThemeExtension` com 23 papéis semânticos; **só paleta `light`** (`static const CeciColors light`), sem dark |
| Tema | `lib/theme/app_theme.dart` | `CeciTheme.light()` (único); constantes `kDesktopCanvasLight`/`kDesktopCardShadow=[]`/`kDesktopOverlayShadow`/`kDesktopFont*` |
| Escalas | `lib/theme/ceci_radius.dart` (`card 16, input 10, button 10, modal 16, pill 999`) · `lib/theme/ceci_spacing.dart` (8pt: `xs4 sm8 md16 lg24 xl32 xxl48`) | fixas, sem dark/light |
| Entrada | `lib/main.dart:17` | `MaterialApp(theme: CeciTheme.light())` — **sem `darkTheme`/`themeMode`** |

### 2.2 Consumo

- **33 ocorrências** de `Theme.of(context).extension<CeciColors>()!` (screens, widgets, shell,
  command palette) — canal único; **zero hex hardcoded** fora de `lib/theme/`.
- **`CeciTheme.light()` é chamado só em `main.dart`**. `Theme.of(context).colorScheme.*` não
  é lido por nenhum widget (só defaults implícitos do Material: ripple, hover, IconButton).
- Scaffold/canvas vem de `kDesktopCanvasLight` (`app_theme.dart`) — **duplica** o valor de
  `CeciColors.canvas` e é coube que pode divergir (divergiu na v3).
- Estados de seleção: `surfaceRose` (master-detail faculdade/biblioteca, command palette,
  avatar do perfil) e `surfaceSubtle` (item ativo da sidebar) + rail/ícone `brandStrong`.
- Scrims de overlay derivados de `textPrimary.withValues(alpha: 0.32)`:
  `desktop_shell.dart:112` e `command_palette.dart:57` — **padrão que quebra em dark**
  (textPrimary claro → scrim claro).
- Tooltip/snackbar **invertidos** (bg `textPrimary`, fg `surfaceCard`) — na verdade isso
  **auto-adapta** em dark (popover claro sobre canvas escuro), sem mudança estrutural.
- Cor de foco: `focusColor: c.brandSoft`.

### 2.3 Riscos específicos para um tema dark (o que mexer)

1. **Não existe dark mode** — precisa `CeciColors.dark` + `CeciTheme.dark()` + `darkTheme`/`themeMode`.
2. **Scrims derivados de `textPrimary`** devem virar token dedicado (`scrim`).
3. **`surfaceRose` = seleção** (faculdade:98, biblioteca:114, palette:140, perfil:25) — em dark
   precisa ser remapeada para o "accent" roxo-violeta, não quase-branco.
4. **Slots `ColorScheme` não setados** (`primaryContainer`, `secondaryContainer`, etc.) são
   derivados do `primary` novo (magenta `#A3004C`) — ripple/hover vão tintar magenta; aceitável,
   mas revisar os slots setados.
5. **`kDesktopCanvasLight` duplicado** — vira fonte única via `CeciColors.*.canvas`.
6. **`ColorScheme.surfaceContainer*`** (usado por defaults M3) precisa seguir o par dark.
7. **Contraste**: magenta `#A3004C` **não** serve como texto sobre dark (≈2.3:1) — só
   accent/ícones/botões com `onBrand` claro. Documentar limites de uso (ver §9).
8. Ícones sem `color` explícita (home sun, busca, avatar) herdam `DefaultTextStyle`
   (`textPrimary`) — sobem de claro para claro no dark, OK.

### 2.4 O que NÃO mudar (fidelidade a testes e identidade)

- **Textos/labels**: `AppScreen.label/description`, "Bom dia", "buscar telas…" etc. — os 3 testes
  de `test/widget_test.dart` buscam por texto; **nenhum assert de cor** existe.
- Estrutura dos widgets (sidebar/topbar/cards/screens) — muda só **valor de token**, não estrutura.
- Lógica de item ativo (sidebar/master-detail) — recalibração vem das cores, não do widget.
- Conteúdo de dados mock (cursos, seções da biblioteca).

---

## 3. Arquitetura de implantação (decisão)

**Manter `CeciColors` como API estável de cores (widgets quase não mudam) e RE-BASEAR os
valores** — não criar uma segunda extensão paralela. O T3 Chat mapeia ~1:1 nos papéis
semânticos existentes; ganhos:

- zero refatoração nos ~33 pontos de `extension<CeciColors>()!`;
- adiciona **dark mode** com o mesmo código;
- grupos novos (chat, sidebar) entram como **campos reservados** (compilam, mas ainda não
  consumidos) para fechar o design system.

**Estrutura alvo:**
```
CeciColors (ThemeExtension)
  ├── 23 papéis atuais (re-baseados)   ← widgets existentes
  ├── novos: scrim, ring, destructive, onDestructive   ← necessários agora
  └── reservados: chat* (5), sidebar* (8)              ← completam o padrão shadcn

CeciTheme
  ├── light()  → CeciColors.light   + ColorScheme.light + fontes Inter
  └── dark()   → CeciColors.dark    + ColorScheme.dark  + fontes Inter

main.dart
  ├── theme: CeciTheme.light()
  ├── darkTheme: CeciTheme.dark()
  └── themeMode: ThemeMode.dark     (D-02)
```

---

## 4. Tokens T3 → papéis do CeciColors (tabelas de mapeamento)

### 4.1 Dark (`CeciColors.dark`) — fiel ao t3.chat

| Campo | Valor | Token T3 | Origem |
|---|---|---|---|
| `canvas` | `0xFF21141E` | background | direto |
| `surfaceCard` | `0xFF0B080B` | card | direto (card **mais escuro** que o canvas — inversão do light) |
| `surfaceSubtle` | `0xFF362D3D` | secondary | direto (hover/chips/ativo) |
| `surfaceMuted` | `0xFF423A46` | muted | direto |
| `surfaceRose` | `0xFF463755` | accent | direto (seleção item → violeta, não mais quase-branco) |
| `surfaceBlue` | `0xFF2A2633` | — | derivado (tint acadêmico sobre slate) |
| `borderDefault` | `0xFF272430` | border | direto |
| `borderSubtle` | `0xFF241D28` | — | derivado (divisor interno, mais discreto) |
| `borderStrong` | `0xFF3A2F3E` | — | derivado (hover/interativo) |
| `borderBrand` | `0x66A3004C` | — | derivado (primary @ ~40%) |
| `textPrimary` | `0xFFF8F8FB` | foreground | direto |
| `textSecondary` | `0xFFD4C7E1` | secondaryForeground | direto |
| `textTertiary` | `0xFF9C8B96` | — | derivado (mutedForeground escurecido p/ metadados) |
| `textMuted` | `0xFF6E5F69` | — | derivado (disabled) |
| `brand` | `0xFFA3004C` | primary | direto |
| `brandStrong` | `0xFFDB2777` | ring | direto (**o magenta forte**; ícones de item ativo) |
| `brandSoft` | `0xFFC63A7E` | — | derivado (hover/soft do primary) |
| `academic` | `0xFF5E8FC9` | chart1 (#2662D9) | derivado (azul mais claro p/ contraste em dark) |
| `academicStrong` | `0xFF4780B5` | — | derivado |
| `onBrand` | `0xFFFBD0E8` | primaryForeground | direto (**texto rosa-claro sobre magenta** — assinatura T3) |
| `statusSuccess` | `0xFF2EB88A` | chart2 | direto |
| `statusWarning` | `0xFFE88C30` | chart3 | direto |
| `statusDanger` | `0xFFE2366F` | chart5 | direto (texto de erro legível em dark) |
| `scrim` | `0x99000000` | — | derivado (preto 60% — padrão Material) |
| `ring` | `0xFFDB2777` | ring | direto |
| `destructive` | `0xFF9D174D` | destructive | direto (bg de botão destrutivo; fg branco) |
| `onDestructive` | `0xFFFFFFFF` | destructiveForeground | direto |
| `chatBackground` | `0xFF0D0A0F` | chat.background | direto (reservado p/ UI de chat/bate-papo) |
| `chatBorder` | `0xFF391D29` | chat.border | direto (reservado) |
| `chatAccent` | `0x5421191D` | chat.accent = rgba(25,21,29,.33) | direto (reservado) |
| `chatHeading` | `0xFFB4548A` | chat.headingColor | direto (reservado) |
| `chatGradientTop` | `0xFF1A1319` | chat.gradientNoiseTop | direto (reservado — ver §7) |
| `sidebarBackground` | `0xFF131313` | sidebar.background | direto (reservado) |
| `sidebarForeground` | `0xFFF4F4F5` | sidebar.foreground | direto (reservado) |
| `sidebarPrimary` | `0xFF1D4ED8` | sidebar.primary | direto (reservado — **azul**, ver D-05) |
| `sidebarPrimaryForeground` | `0xFFFFFFFF` | sidebar.primaryForeground | direto (reservado) |
| `sidebarAccent` | `0xFF261922` | sidebar.accent | direto (reservado) |
| `sidebarAccentForeground` | `0xFFF4F4F5` | sidebar.accentForeground | direto (reservado) |
| `sidebarBorder` | `0xFF000000` | sidebar.border | direto (reservado) |
| `sidebarRing` | `0xFFDB2777` | sidebar.ring | direto (reservado) |

### 4.2 Light (`CeciColors.light`) — reconstruída com identidade T3

> O T3 light define `background == card == #FFFFFF`. A v3 da spec exige **canvas ≠ card**
> (contraste), então o light adota um **canvas "whisper-plum"** (`#F8F3F7`) — quase branco, mas
> com tintagem roxa sutil que mantém o princípio de separação sem abrir mão do tom da marca.
> Ver D-03.

| Campo | Valor | Token T3 | Origem |
|---|---|---|---|
| `canvas` | `0xFFF8F3F7` | — | **derivado** (whisper-plum p/ contraste com card branco) |
| `surfaceCard` | `0xFFFFFFFF` | card/background | direto |
| `surfaceSubtle` | `0xFFF3E8EF` | secondary | direto |
| `surfaceMuted` | `0xFFF5EEF2` | muted | direto |
| `surfaceRose` | `0xFFF3E1EC` | accent | direto (seleção → lavanda) |
| `surfaceBlue` | `0xFFEDF4FA` | — | derivado (tint acadêmico) |
| `borderDefault` | `0xFFEBDDE6` | border/input | direto |
| `borderSubtle` | `0xFFF0E7EC` | — | derivado (divisor) |
| `borderStrong` | `0xFFD8C5D2` | — | derivado |
| `borderBrand` | `0x66A3004C` | — | derivado (primary @ ~40%) |
| `textPrimary` | `0xFF1C0F17` | foreground | direto |
| `textSecondary` | `0xFF3D2436` | secondaryForeground | direto |
| `textTertiary` | `0xFF7A6672` | mutedForeground | direto |
| `textMuted` | `0xFFA995A3` | — | derivado (disabled) |
| `brand` | `0xFFA3004C` | primary | direto |
| `brandStrong` | `0xFFDB2777` | ring | direto |
| `brandSoft` | `0xFFC63A7E` | — | derivado |
| `academic` | `0xFF2662D9` | chart1 | direto (≈5.1:1 no branco — AA) |
| `academicStrong` | `0xFF1E51B0` | — | derivado |
| `onBrand` | `0xFFFDF2F8` | primaryForeground | direto |
| `statusSuccess` | `0xFF2F7A5C` | chart2 (#2EB88A) | **derivado** (escurecido p/ AA em light) |
| `statusWarning` | `0xFF8A6524` | chart3 (#E88C30) | **derivado** (mantém o amber-text da versão anterior) |
| `statusDanger` | `0xFFC81E52` | chart5 (#E2366F) | **derivado** (escurecido p/ AA) |
| `scrim` | `0x521C0F17` | — | derivado (foreground @ 32%, mesmo padrão atual) |
| `ring` | `0xFFDB2777` | ring | direto |
| `destructive` | `0xFFDC2650` | destructive | direto |
| `onDestructive` | `0xFFFFFFFF` | destructiveForeground | direto |
| `chatBackground` | `0xFFFBF6F9` | chat.background | direto (reservado) |
| `chatBorder` | `0xFFEBDDE6` | chat.border | direto (reservado) |
| `chatAccent` | `0x0FA3004C` | chat.accent = rgba(163,0,76,.06) | direto (reservado) |
| `chatHeading` | `0xFFB4548A` | chat.headingColor | direto (reservado) |
| `chatGradientTop` | `0xFFF7EDF3` | chat.gradientNoiseTop | direto (reservado) |
| `sidebarBackground` | `0xFFFAF5F8` | sidebar.background | direto (reservado) |
| `sidebarForeground` | `0xFF1C0F17` | sidebar.foreground | direto (reservado) |
| `sidebarPrimary` | `0xFF1D4ED8` | sidebar.primary | direto (reservado) |
| `sidebarPrimaryForeground` | `0xFFFFFFFF` | sidebar.primaryForeground | direto (reservado) |
| `sidebarAccent` | `0xFFF3E1EC` | sidebar.accent | direto (reservado) |
| `sidebarAccentForeground` | `0xFF1C0F17` | sidebar.accentForeground | direto (reservado) |
| `sidebarBorder` | `0xFFEBDDE6` | sidebar.border | direto (reservado) |
| `sidebarRing` | `0xFFDB2777` | sidebar.ring | direto (reservado) |

---

## 5. Mudanças por arquivo (checklist de implementação)

### 5.1 `lib/theme/ceci_colors.dart` — a maior mudança

- [ ] Adicionar campos novos + getter de comentário de papel:
  `scrim`, `ring`, `destructive`, `onDestructive`,
  `chatBackground`, `chatBorder`, `chatAccent`, `chatHeading`, `chatGradientTop`,
  `sidebarBackground`, `sidebarForeground`, `sidebarPrimary`, `sidebarPrimaryForeground`,
  `sidebarAccent`, `sidebarAccentForeground`, `sidebarBorder`, `sidebarRing`.
- [ ] Atualizar `copyWith` e `lerp` com todos os campos novos (mecânico).
- [ ] Re-basear `static const CeciColors light` com os valores da §4.2.
- [ ] Adicionar `static const CeciColors dark` com os valores da §4.1.
- [ ] Marcar campos reservados com comentário `// reservado — consumir quando a superfície existir`.

### 5.2 `lib/theme/app_theme.dart`

- [ ] `scaffoldBackgroundColor` e `surfaceContainerLowest` passam a usar
  `CeciColors.<mode>.canvas` (elimina `kDesktopCanvasLight` — a constante é a causa da
  duplicação; atualizar a doc que referencia a v3).
- [ ] Criar `CeciTheme.dark()` espelhando `light()` com `CeciColors.dark`:
  `ColorScheme.dark(primary: c.brand, onPrimary: c.onBrand, secondary: c.academic,
  onSecondary: c.onBrand, surface: c.surfaceCard, onSurface: c.textPrimary,
  error: c.statusDanger, onError: c.onDestructive, outline: c.borderDefault,
  outlineVariant: c.borderSubtle, surfaceContainerLowest: c.canvas,
  surfaceContainerLow: c.surfaceMuted, surfaceContainer: c.surfaceSubtle)`.
- [ ] `ceci_colors.dart` → `extensions: const [CeciColors.dark]` (e manter `[CeciColors.light]`
  no light).
- [ ] `focusColor: c.ring` (era `brandSoft`) — nos dois modes.
- [ ] Inputs: `enabledBorder` → `c.borderDefault` (dá definição ao campo no dark);
  `focusedBorder` → `c.ring` width 1.5 (era `brand` — mesmo valor de família, agora via `ring`).
- [ ] `kDesktopOverlayShadow` passa a usar o tom T3 `rgba(20,8,18,…)` (ex.: camada única
  `Color(0x2E140812), offset(0,12), blur 24, spread -4` — shadow lg do design system).
- [ ] Adicionar `kDesktopGlowShadow` (accent vivo, ver §7):
  ```dart
  /// Glow de accent (ring #DB2777 @ ~35%). Só elementos vivos/foco/logo —
  /// NUNCA para separar card estático (regra da v3).
  const kDesktopGlowShadow = [BoxShadow(color: Color(0x59DB2777), blurRadius: 24)];
  ```
- [ ] **Imagens de botões**: `Elevated/Filled` bg `brand`, fg `onBrand` (magenta + texto
  rosa-claro — assinatura T3); `Outlined` fg `textPrimary`, side `borderDefault`;
  `TextButton` fg `brandStrong`.
- [ ] Tooltip/snackbar: **manter** o mecanismo invertido (bg `textPrimary`, fg `surfaceCard`) —
  auto invertido e contrastado nos dois modes. Documentar.
- [ ] Tipografia (D-01): se IA → setar `kDesktopFontDisplay = 'Inter'` (as variantes 400–700 já
  estão no pubspec) ou apontar os `displayLarge/headlineMedium/titleLarge/titleMedium` para
  `kDesktopFontBody`. Corrigir de passagem `fontFamily: 'Inter'` literal → `kDesktopFontBody`.

### 5.3 `lib/main.dart`

- [ ] Adicionar `darkTheme: CeciTheme.dark()` e `themeMode: ThemeMode.dark` (ver D-02).
- [ ] `import 'package:flutter/material.dart'` já cobre `ThemeMode`.

### 5.4 Scrims (fix obrigatório p/ dark)

- [ ] `desktop_shell.dart:112` e `command_palette.dart:57`:
  `c.textPrimary.withValues(alpha: 0.32)` → **`c.scrim`**.

### 5.5 Sem mais mudanças estruturais

Sidebar/topbar/screens/AppCard/AppInput/AppBadge/etc. **não mudam de estrutura** — recebem os
novos valores por re-base. Revisar apenas o `IconButton` do avatar no topbar (sem `color`) —
opcional dar `color: c.textSecondary` para o ripple não pegar o primary magenta.

### 5.6 Radios e spacing (fine-tune, não-prioritário)

- [ ] Opcional `CeciSpacing.sm2 = 12` e `lg2 = 20` (escala shadcn tem 12/20) — sem quebrar usos
  existentes.
- [ ] Opcional `CeciRadius.button = 12` (T3 `lg`/base 12) — os atuais 16/10/10 já são próximos.

---

## 6. Detalhe de `CeciTheme.dark()` (trecho-alvo)

```dart
static ThemeData dark() {
  const c = CeciColors.dark;
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: c.brand,
      onPrimary: c.onBrand,
      secondary: c.academic,
      onSecondary: c.onBrand,
      surface: c.surfaceCard,
      onSurface: c.textPrimary,
      error: c.statusDanger,
      onError: c.onDestructive,
      outline: c.borderDefault,
      outlineVariant: c.borderSubtle,
      surfaceContainerLowest: c.canvas,
      surfaceContainerLow: c.surfaceMuted,
      surfaceContainer: c.surfaceSubtle,
    ),
    fontFamily: kDesktopFontBody,
    scaffoldBackgroundColor: c.canvas,
    extensions: const [CeciColors.dark],
    focusColor: c.ring,
    // appBarTheme / cardTheme / dividerTheme / inputDecorationTheme / botões /
    // tooltipTheme / snackBarTheme: idênticos ao light(), salvo enabledBorder (borderDefault)
    // e focusedBorder (ring 1.5).
  );
  return base;
}
```

---

## 7. Acabamento "T3 Chat" (fase de polimento, opcional — P2)

- [ ] **Fundo com gradiente de noise/`gradientNoiseTop`**: no `DesktopShell`, uma camada atrás da
  `Row` com `LinearGradient(begin: top, end: bottom, colors: [chatGradientTop, transparent])`
  sobre o canvas (imperceptível no light; dá profundidade no dark). Fonte: `c.chatGradientTop`.
- [ ] **Glow no logo** (`_Brand` da sidebar): `kDesktopGlowShadow` no quadrado `brand` ao passar o
  mouse, com transição de opacity (framer não é necessário — 150–200ms com `AnimatedOpacity`
  ou `Material` + InkWell). Não usar glow estático em card.
- [ ] **Modal da command palette**: manter `kDesktopOverlayShadow` (nova cor T3) + `surfaceCard`,
  raio `modal` 16. O campo de busca usa `_KeyCap`/`TextField` com tokens (zero mudança de lógica).
  - Opcional: `chatHeading` para destacar rótulos de seção da paleta (ex.: grupo "telas").
- [ ] **Ring de foco visível** (WCAG 2.4.7): `focusColor: c.ring` cobre os widgets Material; conferir
  que o `Focus` do shell não desativa o indicador padrão.
- [ ] **Consideração de `prefers-reduced-motion`**: app estático hoje; se glow/hover com transição
  forem adicionados, respeitar `MediaQuery.disableAnimationsOf(context)`.

---

## 8. Testes & gate de verificação

- **Gate obrigatório:** `flutter analyze` (sem issues) + `flutter test` (os 3 testes existentes
  continuam raízes — eles pumpam `MyApp` e exercitam **todos** os `extension<CeciColors>()!`,
  cobrindo Home, as 5 abas e a paleta nos dois modes).
- **Testes novos sugeridos:**
  - `test/ceci_colors_test.dart` — smoke de valores: sentinelas de `light` e `dark`
    (ex.: `CeciColors.dark.canvas == Color(0xFF21141E)`, `CeciColors.dark.onBrand == Color(0xFFFBD0E8)`,
    `CeciColors.light.canvas == Color(0xFFF8F3F7)`); `copyWith`/`lerp` para os campos novos.
  - `test/widget_test.dart` — teste extra: `pumpWidget(MyApp())` em `ThemeMode.dark` renderiza
    sem exceção (o teste atual assume light; o novo cobre o dark).

---

## 9. Anexo — Contraste (WCAG) dos pares-chave

Valores aproximados (luminância linear, estimativa de implementação — validar com ferramenta).

| Par | Modo | Contraste ≈ | Verdict |
|---|---|---|---|
| canvas `#21141E` × textPrimary `#F8F8FB` | dark | 16.7:1 | AAA |
| canvas dark × brandStrong `#DB2777` | dark | 3.9:1 | ≥3:1 (ícones/UI); **não** texto pequeno |
| canvas dark × brand `#A3004C` | dark | 2.3:1 | Só accent/gráfico grande; **nunca** texto |
| brand `#A3004C` × onBrand `#FBD0E8` | dark | ≈6.3:1 | AA |
| branco × textPrimary `#1C0F17` | light | ≈18:1 | AAA |
| branco × brand `#A3004C` | light | ≈7.9:1 | AAA |
| branco × academic `#2662D9` | light | ≈5.4:1 | AA |
| branco × statusSuccess `#2F7A5C` | light | ≈5:1 | AA (derivado) |
| branco × statusDanger `#C81E52` | light | ≈5:1 | AA (derivado) |

**Regra de ouro:** magenta `#A3004C` no dark é **accent**, não texto. Texto de destaque usa
`brandStrong`/`ring` (`#DB2777`) em corpos maiores ou `onBrand` sobre fill magenta. Badges e
textos secundários no dark usam a rampa `textSecondary/Tertiary` clara.

---

## 10. Decisões em aberto (D-xx)

| ID | Decisão | Default recomendado | Impacto |
|---|---|---|---|
| D-01 | Fonte display (títulos) | **Trocar PJS → Inter** (design system define heading = Inter; Inter 400–700 já empacotada). Se a identidade PJS for mantida: só não aplicar o item de tipografia. | 1 linha (`kDesktopFontDisplay`) |
| D-02 | Modo padrão | **`ThemeMode.dark`** (marca T3 é dark-first); `system` fica como alternativa futura. Se `system`, exigir também revisar `surfaceContainer*` para o auto-derivado. | 1 linha no `main.dart` |
| D-03 | Light canvas | **`#F8F3F7` (whisper-plum)** em vez de `#FFFFFF` puro do T3, para preservar o princípio v3 de contraste canvas ≠ card. Se optar por `#FFFFFF`, as bordas (`#EBDDE6`) passam a carregar toda a separação. | valor de 1 token |
| D-04 | Grupos chat/sidebar | **Adicionar todos os campos agora (reservados)**, consumir só `scrim`/`ring` hoje. Alternativa: adicionar sob demanda. | escopo do §5.1 |
| D-05 | `sidebarPrimary` azul `#1D4ED8` | **Não usar por ora** — a sidebar continua reutilizando `surfaceCard` e o item ativo segue `brandStrong` magenta (identidade cecistudy: "2 pontos de rosa"). O token fica reservado para quando a sidebar ganhar fundo próprio (`#131313`) estilo t3.chat. | reservado |
| D-06 | `statusDanger` light | **Derivar `#C81E52`** (AA) em vez de usar `#E2366F` cru (4.2:1). Se preferir o chart5 cru, o uso fica restrito a ícones/large text. | valor de 1 token |

---

## 11. Ordem de implementação (incremental)

1. **Tokens** — `ceci_colors.dart`: campos novos + `copyWith`/`lerp` + `dark` + re-base `light`.
   Gate intermediário: `flutter analyze`.
2. **Tema** — `app_theme.dart`: `CeciTheme.dark()`, scaffold via `CeciColors.*.canvas`, `ring`
   no foco/bordas, `kDesktopOverlayShadow` T3; `main.dart` `darkTheme`/`themeMode`.
3. **Scrim** — `desktop_shell.dart` + `command_palette.dart` → `c.scrim`.
4. **Tipografia/radios/spacing** — itens opcionais D-01 e §5.6.
5. **Polimento chat (P2)** — gradiente `chatGradientTop`, glow no logo, ring de foco.
6. **Testes** — novos testes do §8 antes de fechar; rodar `flutter analyze` + `flutter test`.

> Cada passo deve manter `flutter analyze` limpo e `flutter test` verde — o passo 3 (scrim) é o
> único **obrigatório** para o dark não quebrar overlay; os passos 4–5 são melhorias visuais.

---

## 12. Referências

- Design system fonte: JSON `t3-chat` do usuário (2026-09-18) — paletas dark/light, `chat`,
  `sidebar`, tipografia, radius, spacing, shadows, `meta.brandHue` (magenta ~325–335°).
- `SPEC-DESIGN-DESKTOP-UI-UX.md` — base layout/UX (substituída na camada de cor por este doc).
- `apps/desktop-flutter/lib/theme/{ceci_colors,app_theme,ceci_radius,ceci_spacing}.dart`.
- `apps/desktop-flutter/test/widget_test.dart` — gate de regressão visual (textos).