import 'package:flutter/material.dart';
import '../../theme/ceci_colors.dart';
import '../../theme/ceci_radius.dart';

/// Badge/pill de status: fundo com a cor em ~12% de opacidade, texto na cor
/// sólida, raio pill, caption medium. O accent só é usado quando o badge é o
/// único destaque da tela.
class AppBadge extends StatelessWidget {
  const AppBadge({
    super.key,
    required this.label,
    this.color,
    this.icon,
  });

  final String label;

  /// Cor do status/accent. Default = brand.
  final Color? color;

  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final base = color ?? c.brand;
    final bg = base.withValues(alpha: 0.12);
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(CeciRadius.pill),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 12, color: base),
                const SizedBox(width: 4),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: base,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}