import 'package:flutter/material.dart';
import '../../theme/ceci_colors.dart';
import '../../theme/ceci_spacing.dart';

/// Estado vazio acolhedor: convite para agir, não tela morta.
class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon,
    this.action,
    this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String? message;
  final IconData? icon;
  final String? actionLabel;
  final VoidCallback? action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: c.surfaceRose,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, size: 26, color: c.brandStrong),
              ),
              const SizedBox(height: CeciSpacing.md),
            ],
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (message != null) ...[
              const SizedBox(height: CeciSpacing.sm),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
            if (action != null && actionLabel != null) ...[
              const SizedBox(height: CeciSpacing.lg),
              FilledButton.icon(
                onPressed: action ?? onAction,
                icon: const Icon(Icons.add, size: 18),
                label: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}