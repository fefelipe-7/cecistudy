import 'package:flutter/material.dart';
import '../../theme/ceci_colors.dart';
import '../../theme/ceci_spacing.dart';
import '../../navigation/app_screen.dart';

/// Sidebar fixa (colapsável 240 ↔ 72) com itens semânticos, indicador de
/// seleção e tooltip quando colapsada. Fundo `surfaceCard` + borda direita.
class Sidebar extends StatelessWidget {
  const Sidebar({
    super.key,
    required this.selected,
    required this.collapsed,
    required this.onSelect,
    required this.onToggleCollapsed,
  });

  final AppScreen selected;
  final bool collapsed;
  final ValueChanged<AppScreen> onSelect;
  final VoidCallback onToggleCollapsed;

  static const double expandedWidth = 240;
  static const double collapsedWidth = 72;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surfaceCard,
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        width: collapsed ? collapsedWidth : expandedWidth,
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(color: c.borderSubtle),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Brand(collapsed: collapsed),
            if (!collapsed) const _SidebarLabel(text: 'MAIN'),
            Expanded(
              child: ListView(
                padding: EdgeInsets.symmetric(horizontal: collapsed ? 10 : CeciSpacing.sm),
                children: [
                  for (final screen in AppScreen.values)
                    _SidebarItem(
                      screen: screen,
                      selected: screen == selected,
                      collapsed: collapsed,
                      onTap: () => onSelect(screen),
                    ),
                ],
              ),
            ),
            const SizedBox(height: CeciSpacing.sm),
            _CollapseToggle(collapsed: collapsed, onTap: onToggleCollapsed),
            const SizedBox(height: CeciSpacing.sm),
          ],
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand({required this.collapsed});

  final bool collapsed;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: CeciSpacing.lg, horizontal: collapsed ? 0 : CeciSpacing.md),
      child: collapsed
          ? Center(
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: c.brand,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'C',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: c.onBrand,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    height: 40 / 20,
                  ),
                ),
              ),
            )
          : Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: c.brand,
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Text(
                    'C',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: c.onBrand, fontSize: 18, fontWeight: FontWeight.w600, height: 36 / 18),
                  ),
                ),
                const SizedBox(width: CeciSpacing.sm),
                Text(
                  'cecistudy ♡',
                  style: TextStyle(
                    color: c.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.2,
                  ),
                ),
              ],
            ),
    );
  }
}

class _SidebarLabel extends StatelessWidget {
  const _SidebarLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, CeciSpacing.xs, 20, CeciSpacing.sm),
      child: Text(
        text,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.8, color: c.textTertiary),
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  const _SidebarItem({
    required this.screen,
    required this.selected,
    required this.collapsed,
    required this.onTap,
  });

  final AppScreen screen;
  final bool selected;
  final bool collapsed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final iconColor = selected ? c.brandStrong : c.textSecondary;
    final item = Material(
      color: selected ? c.surfaceSubtle : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          height: 40,
          child: Row(
            children: [
              if (selected)
                Container(width: 3, height: 18, decoration: BoxDecoration(color: c.brandStrong, borderRadius: BorderRadius.circular(4))),
              const SizedBox(width: 10),
              Icon(screen.icon, size: 20, color: iconColor),
              if (!collapsed) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    screen.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: selected ? FontWeight.w500 : FontWeight.w400,
                      color: selected ? c.textPrimary : c.textSecondary,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
    if (collapsed) {
      return Tooltip(
        message: screen.label,
        waitDuration: const Duration(milliseconds: 400),
        child: item,
      );
    }
    return item;
  }
}

class _CollapseToggle extends StatelessWidget {
  const _CollapseToggle({required this.collapsed, required this.onTap});

  final bool collapsed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final toggle = IconButton(
      icon: Icon(collapsed ? Icons.chevron_right_rounded : Icons.chevron_left_rounded),
      color: c.textTertiary,
      onPressed: onTap,
      tooltip: collapsed ? 'abrir menu' : 'recolher menu',
    );
    if (collapsed) return Center(child: toggle);
    return Padding(padding: const EdgeInsets.only(left: CeciSpacing.sm), child: toggle);
  }
}