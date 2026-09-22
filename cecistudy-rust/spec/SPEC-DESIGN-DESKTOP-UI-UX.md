# SPEC-DESIGN-DESKTOP-UI-UX

> Consolidação das análises paralelas de UI, UX e design system mobile para o desktop Flutter
> Data: 2026-09-17

## 1. Diagnóstico geral

**UI atual**: scaffold mínimo com tema Material3, `CeciColors` primitivas + semânticas, `cardTheme` radius 24, `scaffoldBackgroundColor = canvas`. Desvios da spec leve: raio 24px, branco puro hardcoded, sombras implícitas, espaçamento variado 12/16/20/24, fontes não declaradas no pubspec.

**UX atual**: sidebar + canvas correto, mas ícones genéricos, colapso sem tooltip, master-detail estático, Command Palette sem busca real, estados vazios/loading/erro inexistentes, acessibilidade mínima.

**Mobile tokens**: design system completo em `src/index.css @theme` com `surface.canvas #FFF9F0`, `surface.default #FFFDF8`, `ceci-primary #3B3233`, `ceci-brand #D4617C`, raios 6-32px, sombras baseadas em 122,88,72. Divergência documentada vs design-system.md.

## 2. Princípios de leveza aplicáveis

- Espaçamento em escala 8pt fixa: 4/8/16/24/32/48
- Duas superfícies: canvas ≠ card
- Bordas 1px em vez de sombra estática
- Hierarquia por peso/cor, não tamanho
- Accent limitado a 1-2 elementos por tela

## 3. Mapeamento tokens mobile → desktop

| Papel desktop | Token mobile | Valor | Uso |
|---|---|---|---|
| surface.canvas | --color-canvas | #FFF9F0 | Fundo página |
| surface.card | --color-surface-default | #FFFDF8 | Cards |
| surface.subtle | --color-surface-subtle | #FFF3E7 | Hover/input |
| border.default | --color-ceci-border-default | #E7DACF | Separadores |
| border.subtle | --color-ceci-border-subtle | #F0E6DD | Divisores internos |
| text.primary | --color-ceci-primary | #3B3233 | Títulos |
| text.secondary | --color-ceci-secondary | #6B5F5E | Corpo |
| text.tertiary | --color-ceci-tertiary | #8E7F7B | Metadados |
| accent.primary | --color-ceci-brand | #D4617C | CTA/ativo |
| accent.strong | --color-ceci-brand-strong | #AF465F | Destaque |

## 4. Correções prioritárias UI

1. **Spacing system**
```dart
class AppSpacing { static const xs=4, sm=8, md=16, lg=24, xl=32, xxl=48; }
```
Proibir Padding.all(12/20)

2. **Radius**
- Card: 16px
- Modal: 16px
- Pill: 999px
Remover cardTheme radius 24 global

3. **Cores hardcoded**
- biblioteca_screen: `Color(0xFFFFFCF8)` → `CeciColors.canvas`
- command_palette: `Colors.white` → `CeciColors.surfaceDefault`
- Overlay → token surface com opacity

4. **Sombra zero**
- `CardTheme elevation:0`
- Substituição por `BorderSide` 1px
- Sombras só em overlays/hover

5. **Componentes encapsulados**
- AppCard, AppInput, AppBadge, AppShell, AppSpacing

## 5. Melhorias prioritárias UX

1. Master-detail funcional Faculdade/Biblioteca com seleção real
2. Empty states acolhedores pt-BR minúsculo + CTA
3. Command Palette com filtro fuzzy, atalho ⌘K visível
4. Ícones semânticos na sidebar + tooltip no colapso
5. Breadcrumb/topbar contextual
6. Skeleton loaders e error boundaries
7. Transições AnimatedSwitcher e micro-interações hover

## 6. Estrutura de tema Flutter recomendada

```dart
ThemeData(
  colorScheme: ...,
  scaffoldBackgroundColor: ceci.canvas,
  cardTheme: CardThemeData(
    color: ceci.surfaceCard,
    elevation:0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(color: ceci.borderDefault),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled:true,
    fillColor: ceci.surfaceSubtle,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
    contentPadding: EdgeInsets.symmetric(horizontal:16, vertical:14),
  ),
)
```

ThemeExtension `CeciColors` com papéis acima.

## 7. Checklist de implementação

- [ ] Criar app_spacing.dart, ceci_radius.dart
- [ ] Criar CeciColors ThemeExtension
- [ ] Substituir hardcoded colors/spacings nas 4 screens
- [ ] Criar AppCard, AppInput, AppBadge
- [ ] Implementar master-detail funcional
- [ ] Empty states + skeletons
- [ ] Command Palette funcional
- [ ] Ícones semânticos sidebar
- [ ] Testes visuais nas 5 telas principais

## 8. Próximos passos

1. Resolver divergência canvas/primary entre design-system.md e index.css
2. Definir escala tipográfica e line-height 1.4-1.5
3. Criar guia de uso de accent: máx 2 elementos/tela
4. Validar contraste WCAG AA

Referências: SPEC-WORKSPACE-ACADEMICO-BASE.md, análises paralelas UI/UX/Mobile tokens.
