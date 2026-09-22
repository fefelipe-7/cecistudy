import 'package:flutter/material.dart';
import '../../theme/ceci_colors.dart';
import '../../theme/ceci_spacing.dart';
import '../../navigation/app_screen.dart';

/// Topbar: título da aba atual + descrição, atalho de busca (⌘K), troca de
/// tema light/dark e avatar. Fundo `surfaceCard` com borda inferior.
class Topbar extends StatelessWidget {
  const Topbar({
    super.key,
    required this.screen,
    required this.onOpenSearch,
    required this.onOpenProfile,
    this.onToggleTheme,
  });

  final AppScreen screen;
  final VoidCallback onOpenSearch;
  final VoidCallback onOpenProfile;
  final VoidCallback? onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surfaceCard,
        border: Border(bottom: BorderSide(color: c.borderSubtle)),
      ),
      child: SizedBox(
        height: 56,
        child: Row(
          children: [
            const SizedBox(width: CeciSpacing.lg),
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      screen.label,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(width: CeciSpacing.sm),
                  Flexible(
                    child: Text(
                      '· ${screen.description}',
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: CeciSpacing.md),
            _SearchShortcut(onTap: onOpenSearch),
            const SizedBox(width: CeciSpacing.sm),
            if (onToggleTheme != null)
              _ThemeToggle(onTap: onToggleTheme!),
            if (onToggleTheme != null)
              const SizedBox(width: CeciSpacing.sm),
            SizedBox(
              height: 40,
              child: VerticalDivider(width: 1, color: c.borderSubtle),
            ),
            const SizedBox(width: CeciSpacing.sm),
            IconButton(
              onPressed: onOpenProfile,
              tooltip: 'perfil',
              icon: CircleAvatar(
                radius: 16,
                backgroundColor: c.surfaceMuted,
                child: Text(
                  'C',
                  style: TextStyle(color: c.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(width: CeciSpacing.md),
          ],
        ),
      ),
    );
  }
}

class _SearchShortcut extends StatelessWidget {
  const _SearchShortcut({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Material(
      color: c.surfaceSubtle,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: const SizedBox(
          height: 32,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: CeciSpacing.sm),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.search_rounded, size: 15),
                SizedBox(width: 6),
                Text('buscar', style: TextStyle(fontSize: 13, height: 1)),
                SizedBox(width: 8),
                _KeyCap(label: '⌘K'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Botão de troca de tema: sol no dark (vai p/ claro), lua no light (vai p/
/// escuro). Reativo ao `Theme.brightness` — sem estado próprio.
class _ThemeToggle extends StatelessWidget {
  const _ThemeToggle({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return IconButton(
      onPressed: onTap,
      tooltip: isDark ? 'modo claro' : 'modo escuro',
      icon: Icon(
        isDark ? Icons.wb_sunny_outlined : Icons.nights_stay_outlined,
        size: 18,
      ),
    );
  }
}

class _KeyCap extends StatelessWidget {
  const _KeyCap({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surfaceCard,
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: c.borderDefault),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
        child: Text(label, style: TextStyle(fontSize: 10, color: c.textTertiary, height: 1.3)),
      ),
    );
  }
}