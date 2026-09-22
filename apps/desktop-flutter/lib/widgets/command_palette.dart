import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../navigation/app_screen.dart';
import '../theme/ceci_colors.dart';
import '../theme/ceci_radius.dart';
import '../theme/ceci_spacing.dart';

/// Paleta de busca (⌘K / Ctrl+K): filtra [AppScreen.values] por label e
/// descrição, navega com cliques/Enter/setas e fecha com Esc.
class CommandPalette extends StatefulWidget {
  const CommandPalette({super.key, required this.onClose, required this.onNavigate});

  final VoidCallback onClose;
  final ValueChanged<AppScreen> onNavigate;

  @override
  State<CommandPalette> createState() => _CommandPaletteState();
}

class _CommandPaletteState extends State<CommandPalette> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode()..requestFocus();
  int _highlight = 0;

  List<AppScreen> get _results {
    final q = _controller.text.trim().toLowerCase();
    if (q.isEmpty) return AppScreen.values;
    return AppScreen.values
        .where((s) => s.label.toLowerCase().contains(q) || s.description.toLowerCase().contains(q))
        .toList();
  }

  void _navigateTo(AppScreen screen) {
    widget.onNavigate(screen);
  }

  void _submit() {
    if (_results.isEmpty) return;
    final idx = _highlight.clamp(0, _results.length - 1);
    _navigateTo(_results[idx]);
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final results = _results;
    if (_highlight >= results.length) _highlight = results.isEmpty ? 0 : results.length - 1;

    return Material(
      color: c.scrim,
      child: Center(
        child: KeyboardListener(
          focusNode: _focusNode,
          onKeyEvent: (event) {
            if (event is! KeyDownEvent) return;
            switch (event.logicalKey) {
              case LogicalKeyboardKey.escape:
                widget.onClose();
              case LogicalKeyboardKey.arrowDown:
                setState(() {
                  _highlight = results.isEmpty ? 0 : (_highlight + 1) % results.length;
                });
              case LogicalKeyboardKey.arrowUp:
                setState(() {
                  _highlight = results.isEmpty ? 0 : (_highlight - 1 + results.length) % results.length;
                });
              case LogicalKeyboardKey.enter:
                _submit();
              default:
                break;
            }
          },
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Container(
              padding: const EdgeInsets.all(CeciSpacing.md),
              decoration: BoxDecoration(
                color: c.surfaceCard,
                borderRadius: BorderRadius.circular(CeciRadius.modal),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: _controller,
                    autofocus: true,
                    decoration: const InputDecoration(hintText: 'buscar telas…', prefixIcon: Icon(Icons.search_rounded)),
                    onChanged: (_) => setState(() => _highlight = 0),
                    onSubmitted: (_) => _submit(),
                  ),
                  if (results.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(CeciSpacing.lg),
                      child: Text('nada por aqui, tente outro termo ♡', style: Theme.of(context).textTheme.bodyMedium),
                    )
                  else
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 320),
                      child: ListView(
                        shrinkWrap: true,
                        padding: const EdgeInsets.only(top: CeciSpacing.sm),
                        children: [
                          for (var i = 0; i < results.length; i++)
                            _PaletteItem(
                              screen: results[i],
                              highlighted: i == _highlight,
                              onTap: () => _navigateTo(results[i]),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PaletteItem extends StatelessWidget {
  const _PaletteItem({required this.screen, required this.highlighted, required this.onTap});

  final AppScreen screen;
  final bool highlighted;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Material(
      color: highlighted ? c.surfaceRose : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.md, vertical: 10),
          child: Row(
            children: [
              Icon(screen.icon, size: 18, color: highlighted ? c.brandStrong : c.textSecondary),
              const SizedBox(width: CeciSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(screen.label, style: Theme.of(context).textTheme.titleMedium),
                    Text(screen.description, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              if (highlighted)
                _PaletteShortcut(),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaletteShortcut extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surfaceRose,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: c.borderBrand),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        child: Text('↵', style: TextStyle(fontSize: 11, color: c.brandStrong, height: 1.2)),
      ),
    );
  }
}