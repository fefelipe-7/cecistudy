import 'package:flutter/material.dart';
import '../../theme/ceci_colors.dart';
import '../../theme/ceci_radius.dart';
import '../../theme/app_theme.dart';

/// Card padrão do cecistudy desktop: superfície `surfaceCard`, borda 1px
/// `borderDefault`, raio [CeciRadius.card]. A separação do canvas vem do
/// **contraste de cor** (card branco puro sobre canvas mais escuro) + borda —
/// cards estáticos **não têm sombra**; [kDesktopOverlayShadow] fica reservada
/// para overlay/hover/dropdown, nunca em card fixo na tela.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
    this.color,
    this.borderColor,
    this.borderRadius,
    this.onTap,
    this.trailing,
    this.shadow = kDesktopCardShadow,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  /// Fundo do card. Default = `surfaceCard`.
  final Color? color;

  /// Cor da borda. Default = `borderDefault`.
  final Color? borderColor;

  /// Raio. Default = [CeciRadius.card].
  final double? borderRadius;

  /// Ação de clique (card interativo — usará InkWell).
  final VoidCallback? onTap;

  /// Sombra/elevação. Default = sem sombra ([kDesktopCardShadow] = vazio);
  /// passe [kDesktopOverlayShadow] para cards de overlay/dropdown/hover.
  final List<BoxShadow>? shadow;

  /// Elemento opcional colocado na área superior direita do card.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final shadow = this.shadow ?? kDesktopCardShadow;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(borderRadius ?? CeciRadius.card),
      side: BorderSide(color: borderColor ?? c.borderDefault),
    );
    if (onTap != null) {
      return Material(
        color: color ?? c.surfaceCard,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: _content(),
        ),
      );
    }
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color ?? c.surfaceCard,
        borderRadius: BorderRadius.circular(borderRadius ?? CeciRadius.card),
        border: Border.all(color: borderColor ?? c.borderDefault),
        boxShadow: shadow,
      ),
      child: _content(),
    );
  }

  Widget _content() {
    if (trailing == null) {
      return Padding(padding: padding, child: child);
    }
    return Padding(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(alignment: Alignment.topRight, child: trailing),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}