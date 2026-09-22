import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../navigation/app_screen.dart';
import '../../screens/biblioteca_screen.dart';
import '../../screens/estudos_screen.dart';
import '../../screens/faculdade_screen.dart';
import '../../screens/home_screen.dart';
import '../../screens/perfil_screen.dart';
import '../../theme/ceci_colors.dart';
import '../command_palette.dart';
import 'sidebar.dart';
import 'topbar.dart';

/// Casca do desktop: sidebar + topbar + canvas. A navegação de abas é uma
/// pilha simples; [IndexedStack] preserva o estado de cada aba. ⌘K (ou Ctrl+K)
/// abre a busca; Esc fecha a paleta.
class DesktopShell extends StatefulWidget {
  const DesktopShell({super.key, this.onToggleTheme});

  /// Alterna o tema light↔dark (propriedade do [MyApp], dono do ThemeMode).
  final VoidCallback? onToggleTheme;

  @override
  State<DesktopShell> createState() => _DesktopShellState();
}

class _DesktopShellState extends State<DesktopShell> {
  AppScreen _selected = AppScreen.home;
  bool _collapsed = false;
  bool _paletteOpen = false;
  final FocusNode _focusNode = FocusNode();

  void _openPalette() {
    setState(() => _paletteOpen = true);
  }

  void _closePalette() {
    setState(() => _paletteOpen = false);
  }

  void _navigate(AppScreen screen) {
    setState(() {
      _selected = screen;
      _paletteOpen = false;
    });
  }

  KeyEventResult _onKeyEvent(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent &&
        (HardwareKeyboard.instance.isControlPressed || HardwareKeyboard.instance.isMetaPressed) &&
        event.logicalKey == LogicalKeyboardKey.keyK) {
      _openPalette();
      return KeyEventResult.handled;
    }
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.escape && _paletteOpen) {
      _closePalette();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Scaffold(
      body: Focus(
        focusNode: _focusNode,
        autofocus: true,
        onKeyEvent: _onKeyEvent,
        child: Stack(
          children: [
            Row(
              children: [
                Sidebar(
                  selected: _selected,
                  collapsed: _collapsed,
                  onSelect: (screen) => setState(() => _selected = screen),
                  onToggleCollapsed: () => setState(() => _collapsed = !_collapsed),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Topbar(
                        screen: _selected,
                        onOpenSearch: _openPalette,
                        onOpenProfile: () => setState(() => _selected = AppScreen.perfil),
                        onToggleTheme: widget.onToggleTheme,
                      ),
                      Expanded(
                        child: IndexedStack(
                          index: _selected.index,
                          children: const [
                            HomeScreen(),
                            FaculdadeScreen(),
                            EstudosScreen(),
                            BibliotecaScreen(),
                            PerfilScreen(),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (_paletteOpen)
              Positioned.fill(
                child: ColoredBox(
                  color: c.scrim,
                  child: CommandPalette(
                    onClose: _closePalette,
                    onNavigate: _navigate,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}