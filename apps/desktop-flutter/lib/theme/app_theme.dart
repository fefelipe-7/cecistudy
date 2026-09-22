import 'package:flutter/material.dart';
import 'ceci_colors.dart';
import 'ceci_radius.dart';
import 'ceci_spacing.dart';

/// Cards estáticos não têm sombra — a separação do canvas é por **contraste de
/// cor** + borda de 1px. Mantida como constante vazia para o default de
/// [AppCard] e para composições que queiram explicitamente sem sombra.
const List<BoxShadow> kDesktopCardShadow = [];

/// Reservada para overlay/hover/dropdown — **nunca** em card fixo na tela.
/// Tom T3 Chat: `rgba(20, 8, 18, 0.15)` (pigmento roxo-escuro da marca).
const List<BoxShadow> kDesktopOverlayShadow = [
  BoxShadow(
    color: Color(0x26140812), // rgba(20,8,18,0.15)
    offset: Offset(0, 8),
    blurRadius: 24,
    spreadRadius: -8,
  ),
];

/// Halo/quedra de destaque T3 Chat — magenta `#DB2777` a ~35%. Reservada para
/// destaque de item focado/glow (ex.: botão primário hover, chat em fase
/// futura); **nunca** em card fixo na tela.
const List<BoxShadow> kDesktopGlowShadow = [
  BoxShadow(
    color: Color(0x59DB2777), // rgba(219,39,119,0.35)
    blurRadius: 24,
  ),
];

/// Fonte de display/títulos do desktop — **Inter** (D-01 do design system T3;
/// baixada do Google Fonts `assets/fonts/Inter`). Usada em
/// [TextTheme.displayLarge]/[TextTheme.headlineMedium]/[TextTheme.titleLarge]
/// e [TextTheme.titleMedium].
const String kDesktopFontDisplay = 'Inter';

/// Fonte serifada acadêmica — **DM Serif Display** (a mesma do mobile via
/// `@fontsource/dm-serif-display`). Placeholder disponível para capa de TCC,
/// epígrafes e destaques editoriais (mesmo papel visual da web).
const String kDesktopFontSerif = 'DM Serif Display';

/// Fonte monoespaçada — **JetBrains Mono** (a mesma do mobile via
/// `@fontsource/jetbrains-mono`). Para citações ABNT, blocos de código e
/// tabelas de repertório.
const String kDesktopFontMono = 'JetBrains Mono';

/// Família do corpo — **Inter**, como no mobile/web (`@fontsource/inter`).
const String kDesktopFontBody = 'Inter';

class CeciTheme {
  static ThemeData light() {
    const c = CeciColors.light;
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: c.brand,
        onPrimary: c.onBrand,
        secondary: c.academic,
        onSecondary: c.onBrand,
        surface: c.surfaceCard,
        onSurface: c.textPrimary,
        error: c.statusDanger,
        onError: c.onBrand,
        outline: c.borderDefault,
        outlineVariant: c.borderSubtle,
        surfaceContainerLowest: c.canvas,
        surfaceContainerLow: c.surfaceMuted,
        surfaceContainer: c.surfaceSubtle,
      ),
      fontFamily: kDesktopFontBody,
      scaffoldBackgroundColor: c.canvas,
      extensions: const [CeciColors.light],
      appBarTheme: AppBarTheme(
        backgroundColor: c.surfaceCard,
        foregroundColor: c.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      dividerTheme: DividerThemeData(color: c.borderSubtle, thickness: 1, space: 1),
      cardTheme: CardThemeData(
        color: c.surfaceCard,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CeciRadius.card),
          side: BorderSide(color: c.borderDefault),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 28,
          fontWeight: FontWeight.w500,
          height: 1.2,
          color: c.textPrimary,
        ),
        headlineMedium: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          height: 1.3,
          color: c.textPrimary,
        ),
        titleLarge: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          height: 1.4,
          color: c.textPrimary,
        ),
        titleMedium: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          height: 1.4,
          color: c.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontFamily: kDesktopFontBody,
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.5,
          color: c.textSecondary,
        ),
        bodySmall: TextStyle(
          fontFamily: kDesktopFontBody,
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.4,
          color: c.textTertiary,
        ),
        labelSmall: TextStyle(
          fontFamily: kDesktopFontBody,
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.4,
          height: 1.3,
          color: c.textTertiary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceSubtle,
        hintStyle: TextStyle(color: c.textTertiary, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: CeciSpacing.md, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CeciRadius.input),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CeciRadius.input),
          borderSide: BorderSide(color: c.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CeciRadius.input),
          borderSide: BorderSide(color: c.ring, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: c.brand,
          foregroundColor: c.onBrand,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.brand,
          foregroundColor: c.onBrand,
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.lg, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.textPrimary,
          side: BorderSide(color: c.borderDefault),
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.lg, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.brandStrong,
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.sm, vertical: CeciSpacing.xs),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.textPrimary,
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: TextStyle(color: c.surfaceCard, fontSize: 12, height: 1.3),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.textPrimary,
        contentTextStyle: TextStyle(color: c.surfaceCard, fontSize: 14, height: 1.4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      focusColor: c.ring,
    );
    return base;
  }

  /// Tema dark-first T3 Chat — paleta [CeciColors.dark], mesma estrutura de
  /// slots da light, com scaffold vindo de `c.canvas`. Passado em
  /// `MaterialApp.darkTheme` (default `ThemeMode.dark`).
  static ThemeData dark() {
    const c = CeciColors.dark;
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.dark(
        primary: c.brand,
        onPrimary: c.onBrand,
        secondary: c.academic,
        onSecondary: c.onBrand,
        surface: c.surfaceCard,
        onSurface: c.textPrimary,
        error: c.statusDanger,
        onError: c.onBrand,
        outline: c.borderDefault,
        outlineVariant: c.borderSubtle,
        surfaceContainerLowest: c.canvas,
        surfaceContainerLow: c.surfaceMuted,
        surfaceContainer: c.surfaceSubtle,
      ),
      fontFamily: kDesktopFontBody,
      scaffoldBackgroundColor: c.canvas,
      extensions: const [CeciColors.dark],
      appBarTheme: AppBarTheme(
        backgroundColor: c.surfaceCard,
        foregroundColor: c.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      dividerTheme: DividerThemeData(color: c.borderSubtle, thickness: 1, space: 1),
      cardTheme: CardThemeData(
        color: c.surfaceCard,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CeciRadius.card),
          side: BorderSide(color: c.borderDefault),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 28,
          fontWeight: FontWeight.w500,
          height: 1.2,
          color: c.textPrimary,
        ),
        headlineMedium: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          height: 1.3,
          color: c.textPrimary,
        ),
        titleLarge: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          height: 1.4,
          color: c.textPrimary,
        ),
        titleMedium: TextStyle(
          fontFamily: kDesktopFontDisplay,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          height: 1.4,
          color: c.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontFamily: kDesktopFontBody,
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.5,
          color: c.textSecondary,
        ),
        bodySmall: TextStyle(
          fontFamily: kDesktopFontBody,
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.4,
          color: c.textTertiary,
        ),
        labelSmall: TextStyle(
          fontFamily: kDesktopFontBody,
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.4,
          height: 1.3,
          color: c.textTertiary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceSubtle,
        hintStyle: TextStyle(color: c.textTertiary, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: CeciSpacing.md, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CeciRadius.input),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CeciRadius.input),
          borderSide: BorderSide(color: c.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CeciRadius.input),
          borderSide: BorderSide(color: c.ring, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: c.brand,
          foregroundColor: c.onBrand,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.brand,
          foregroundColor: c.onBrand,
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.lg, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.textPrimary,
          side: BorderSide(color: c.borderDefault),
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.lg, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.brandStrong,
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.sm, vertical: CeciSpacing.xs),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CeciRadius.button),
          ),
        ),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.textPrimary,
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: TextStyle(color: c.surfaceCard, fontSize: 12, height: 1.3),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.textPrimary,
        contentTextStyle: TextStyle(color: c.surfaceCard, fontSize: 14, height: 1.4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      focusColor: c.ring,
    );
    return base;
  }
}