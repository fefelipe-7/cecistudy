import 'package:flutter/material.dart';

/// Papéis de cor do desktop — espelham os aliases semânticos de
/// `src/index.css @theme`, agora governados pelo design system T3 Chat
/// (magenta/rosa sobre base roxo-escura, dark-first).
///
/// `CeciColors` é a API estável de cor do app (via `ThemeExtension`);
/// os widgets consomem `Theme.of(context).extension<CeciColors>()!` e nunca
/// hex hardcoded. Paleta light (whisper-plum) e dark (t3.chat).
///
/// Tokens `chat*`/`sidebar*` ficam **reservados** até a superfície
/// correspondente existir (Fase de chat/sidebar dedicada); hoje o app
/// consome os papéis núcleo + `scrim`/`ring`/`destructive`.
@immutable
class CeciColors extends ThemeExtension<CeciColors> {
  const CeciColors({
    required this.canvas,
    required this.surfaceCard,
    required this.surfaceSubtle,
    required this.surfaceMuted,
    required this.surfaceRose,
    required this.surfaceBlue,
    required this.borderDefault,
    required this.borderSubtle,
    required this.borderStrong,
    required this.borderBrand,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textMuted,
    required this.brand,
    required this.brandStrong,
    required this.brandSoft,
    required this.academic,
    required this.academicStrong,
    required this.onBrand,
    required this.statusSuccess,
    required this.statusWarning,
    required this.statusDanger,
    // overlay / foco / status destrutivo
    required this.scrim,
    required this.ring,
    required this.destructive,
    required this.onDestructive,
    // superfícies de chat (reservado)
    required this.chatBackground,
    required this.chatBorder,
    required this.chatAccent,
    required this.chatHeading,
    required this.chatGradientTop,
    // sidebar dedicada (reservado)
    required this.sidebarBackground,
    required this.sidebarForeground,
    required this.sidebarPrimary,
    required this.sidebarPrimaryForeground,
    required this.sidebarAccent,
    required this.sidebarAccentForeground,
    required this.sidebarBorder,
    required this.sidebarRing,
  });

  // Superfícies
  final Color canvas; // fundo da janela / página
  final Color surfaceCard; // cards
  final Color surfaceSubtle; // hover leve / chips inativos
  final Color surfaceMuted; // corroborante ainda mais fraco
  final Color surfaceRose; // destaque "rosado" (seleção de linha ativa)
  final Color surfaceBlue; // destaque acadêmico

  // Bordas
  final Color borderDefault; // 1px separando card do canvas
  final Color borderSubtle; // divisor interno
  final Color borderStrong; // hover / interativo
  final Color borderBrand; // borda do destaque

  // Texto
  final Color textPrimary; // títulos, valores principais
  final Color textSecondary; // corpo, labels
  final Color textTertiary; // timestamps, metadados
  final Color textMuted; // desabilitado

  // Accent
  final Color brand; // accent.primary (CTA, item ativo)
  final Color brandStrong; // accent forte (hover/ring)
  final Color brandSoft; // accent brando (badge, link)
  final Color academic; // accent acadêmico (azul)
  final Color academicStrong; // accent acadêmico forte
  final Color onBrand; // texto/ícone sobre brand

  // Status
  final Color statusSuccess;
  final Color statusWarning;
  final Color statusDanger;

  // Overlay / foco / destrutivo
  final Color scrim; // fundo do overlay (modal / paleta)
  final Color ring; // anel de foco / accent forte (border)
  final Color destructive; // preenchimento destrutivo
  final Color onDestructive; // texto sobre destructive

  // Chat (reservado — usado quando a superfície de chat existir)
  final Color chatBackground;
  final Color chatBorder;
  final Color chatAccent;
  final Color chatHeading;
  final Color chatGradientTop;

  // Sidebar dedicada (reservado — hoje a sidebar usa papel de navegação)
  final Color sidebarBackground;
  final Color sidebarForeground;
  final Color sidebarPrimary;
  final Color sidebarPrimaryForeground;
  final Color sidebarAccent;
  final Color sidebarAccentForeground;
  final Color sidebarBorder;
  final Color sidebarRing;

  /// Paleta light T3 Chat (whisper-plum) — canvas levemente rosa, cards
  /// brancos, magenta como accent e `onBrand` rosa-claro para contraste.
  static const CeciColors light = CeciColors(
    canvas: Color(0xFFF8F3F7),
    surfaceCard: Color(0xFFFFFFFF),
    surfaceSubtle: Color(0xFFEEE4EC),
    surfaceMuted: Color(0xFFF4EDF1),
    surfaceRose: Color(0xFFFCE9F3),
    surfaceBlue: Color(0xFFEAF2F6),
    borderDefault: Color(0xFFE8DDE3),
    borderSubtle: Color(0xFFF0E9ED),
    borderStrong: Color(0xFFD9C8D2),
    borderBrand: Color(0x66A3004C),
    textPrimary: Color(0xFF1C0E17),
    textSecondary: Color(0xFF3C2436),
    textTertiary: Color(0xFF7A6673),
    textMuted: Color(0xFFA895A0),
    brand: Color(0xFFA3004C),
    brandStrong: Color(0xFFDB2777),
    brandSoft: Color(0xFFC63A7E),
    academic: Color(0xFF2662D9),
    academicStrong: Color(0xFF1E51B0),
    onBrand: Color(0xFFFDF2F8),
    statusSuccess: Color(0xFF2F7A5C),
    statusWarning: Color(0xFF8A6524),
    statusDanger: Color(0xFFC81E52),
    scrim: Color(0x521C0F17),
    ring: Color(0xFFDB2777),
    destructive: Color(0xFFDC2650),
    onDestructive: Color(0xFFFFFFFF),
    chatBackground: Color(0xFFFBF6F9),
    chatBorder: Color(0xFFE8DDE3),
    chatAccent: Color(0x0DA3004C),
    chatHeading: Color(0xFFB4548A),
    chatGradientTop: Color(0xFFF7EDF3),
    sidebarBackground: Color(0xFFFAF5F8),
    sidebarForeground: Color(0xFF1C0E17),
    sidebarPrimary: Color(0xFF1D4ED8),
    sidebarPrimaryForeground: Color(0xFFFFFFFF),
    sidebarAccent: Color(0xFFFCE9F3),
    sidebarAccentForeground: Color(0xFF1C0E17),
    sidebarBorder: Color(0xFFE8DDE3),
    sidebarRing: Color(0xFFDB2777),
  );

  /// Paleta dark T3 Chat (dark-first, assinatura t3.chat) — canvas roxo-
  /// escuro mais claro que os cards, que mergulham em `#0B080B`.
  static const CeciColors dark = CeciColors(
    canvas: Color(0xFF21141E),
    surfaceCard: Color(0xFF0B080B),
    surfaceSubtle: Color(0xFF362D3D),
    surfaceMuted: Color(0xFF423A46),
    surfaceRose: Color(0xFF463755),
    surfaceBlue: Color(0xFF2A2633),
    borderDefault: Color(0xFF272430),
    borderSubtle: Color(0xFF241D28),
    borderStrong: Color(0xFF3A2F3E),
    borderBrand: Color(0x66A3004C),
    textPrimary: Color(0xFFF8F8FB),
    textSecondary: Color(0xFFD4C7E1),
    textTertiary: Color(0xFF9C8B96),
    textMuted: Color(0xFF6E5F69),
    brand: Color(0xFFA3004C),
    brandStrong: Color(0xFFDB2777),
    brandSoft: Color(0xFFC63A7E),
    academic: Color(0xFF5E8FC9),
    academicStrong: Color(0xFF4780B5),
    onBrand: Color(0xFFFBD0E8),
    statusSuccess: Color(0xFF2EB88A),
    statusWarning: Color(0xFFE88C30),
    statusDanger: Color(0xFFE2366F),
    scrim: Color(0x99000000),
    ring: Color(0xFFDB2777),
    destructive: Color(0xFF9D174D),
    onDestructive: Color(0xFFFFFFFF),
    chatBackground: Color(0xFF0D0A0F),
    chatBorder: Color(0xFF3A2F3E),
    chatAccent: Color(0x2121191D),
    chatHeading: Color(0xFFB4548A),
    chatGradientTop: Color(0xFF1C1324),
    sidebarBackground: Color(0xFF131313),
    sidebarForeground: Color(0xFFF4F4F5),
    sidebarPrimary: Color(0xFF1D4ED8),
    sidebarPrimaryForeground: Color(0xFFFFFFFF),
    sidebarAccent: Color(0xFF261922),
    sidebarAccentForeground: Color(0xFFF4F4F5),
    sidebarBorder: Color(0xFF000000),
    sidebarRing: Color(0xFFDB2777),
  );

  @override
  CeciColors copyWith({
    Color? canvas,
    Color? surfaceCard,
    Color? surfaceSubtle,
    Color? surfaceMuted,
    Color? surfaceRose,
    Color? surfaceBlue,
    Color? borderDefault,
    Color? borderSubtle,
    Color? borderStrong,
    Color? borderBrand,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? textMuted,
    Color? brand,
    Color? brandStrong,
    Color? brandSoft,
    Color? academic,
    Color? academicStrong,
    Color? onBrand,
    Color? statusSuccess,
    Color? statusWarning,
    Color? statusDanger,
    Color? scrim,
    Color? ring,
    Color? destructive,
    Color? onDestructive,
    Color? chatBackground,
    Color? chatBorder,
    Color? chatAccent,
    Color? chatHeading,
    Color? chatGradientTop,
    Color? sidebarBackground,
    Color? sidebarForeground,
    Color? sidebarPrimary,
    Color? sidebarPrimaryForeground,
    Color? sidebarAccent,
    Color? sidebarAccentForeground,
    Color? sidebarBorder,
    Color? sidebarRing,
  }) {
    return CeciColors(
      canvas: canvas ?? this.canvas,
      surfaceCard: surfaceCard ?? this.surfaceCard,
      surfaceSubtle: surfaceSubtle ?? this.surfaceSubtle,
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      surfaceRose: surfaceRose ?? this.surfaceRose,
      surfaceBlue: surfaceBlue ?? this.surfaceBlue,
      borderDefault: borderDefault ?? this.borderDefault,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      borderStrong: borderStrong ?? this.borderStrong,
      borderBrand: borderBrand ?? this.borderBrand,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      textMuted: textMuted ?? this.textMuted,
      brand: brand ?? this.brand,
      brandStrong: brandStrong ?? this.brandStrong,
      brandSoft: brandSoft ?? this.brandSoft,
      academic: academic ?? this.academic,
      academicStrong: academicStrong ?? this.academicStrong,
      onBrand: onBrand ?? this.onBrand,
      statusSuccess: statusSuccess ?? this.statusSuccess,
      statusWarning: statusWarning ?? this.statusWarning,
      statusDanger: statusDanger ?? this.statusDanger,
      scrim: scrim ?? this.scrim,
      ring: ring ?? this.ring,
      destructive: destructive ?? this.destructive,
      onDestructive: onDestructive ?? this.onDestructive,
      chatBackground: chatBackground ?? this.chatBackground,
      chatBorder: chatBorder ?? this.chatBorder,
      chatAccent: chatAccent ?? this.chatAccent,
      chatHeading: chatHeading ?? this.chatHeading,
      chatGradientTop: chatGradientTop ?? this.chatGradientTop,
      sidebarBackground: sidebarBackground ?? this.sidebarBackground,
      sidebarForeground: sidebarForeground ?? this.sidebarForeground,
      sidebarPrimary: sidebarPrimary ?? this.sidebarPrimary,
      sidebarPrimaryForeground:
          sidebarPrimaryForeground ?? this.sidebarPrimaryForeground,
      sidebarAccent: sidebarAccent ?? this.sidebarAccent,
      sidebarAccentForeground:
          sidebarAccentForeground ?? this.sidebarAccentForeground,
      sidebarBorder: sidebarBorder ?? this.sidebarBorder,
      sidebarRing: sidebarRing ?? this.sidebarRing,
    );
  }

  @override
  CeciColors lerp(ThemeExtension<CeciColors>? other, double t) {
    if (other is! CeciColors) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return CeciColors(
      canvas: c(canvas, other.canvas),
      surfaceCard: c(surfaceCard, other.surfaceCard),
      surfaceSubtle: c(surfaceSubtle, other.surfaceSubtle),
      surfaceMuted: c(surfaceMuted, other.surfaceMuted),
      surfaceRose: c(surfaceRose, other.surfaceRose),
      surfaceBlue: c(surfaceBlue, other.surfaceBlue),
      borderDefault: c(borderDefault, other.borderDefault),
      borderSubtle: c(borderSubtle, other.borderSubtle),
      borderStrong: c(borderStrong, other.borderStrong),
      borderBrand: c(borderBrand, other.borderBrand),
      textPrimary: c(textPrimary, other.textPrimary),
      textSecondary: c(textSecondary, other.textSecondary),
      textTertiary: c(textTertiary, other.textTertiary),
      textMuted: c(textMuted, other.textMuted),
      brand: c(brand, other.brand),
      brandStrong: c(brandStrong, other.brandStrong),
      brandSoft: c(brandSoft, other.brandSoft),
      academic: c(academic, other.academic),
      academicStrong: c(academicStrong, other.academicStrong),
      onBrand: c(onBrand, other.onBrand),
      statusSuccess: c(statusSuccess, other.statusSuccess),
      statusWarning: c(statusWarning, other.statusWarning),
      statusDanger: c(statusDanger, other.statusDanger),
      scrim: c(scrim, other.scrim),
      ring: c(ring, other.ring),
      destructive: c(destructive, other.destructive),
      onDestructive: c(onDestructive, other.onDestructive),
      chatBackground: c(chatBackground, other.chatBackground),
      chatBorder: c(chatBorder, other.chatBorder),
      chatAccent: c(chatAccent, other.chatAccent),
      chatHeading: c(chatHeading, other.chatHeading),
      chatGradientTop: c(chatGradientTop, other.chatGradientTop),
      sidebarBackground: c(sidebarBackground, other.sidebarBackground),
      sidebarForeground: c(sidebarForeground, other.sidebarForeground),
      sidebarPrimary: c(sidebarPrimary, other.sidebarPrimary),
      sidebarPrimaryForeground:
          c(sidebarPrimaryForeground, other.sidebarPrimaryForeground),
      sidebarAccent: c(sidebarAccent, other.sidebarAccent),
      sidebarAccentForeground:
          c(sidebarAccentForeground, other.sidebarAccentForeground),
      sidebarBorder: c(sidebarBorder, other.sidebarBorder),
      sidebarRing: c(sidebarRing, other.sidebarRing),
    );
  }
}