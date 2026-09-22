import 'package:flutter/material.dart';

import 'theme/app_theme.dart';
import 'theme/theme_controller.dart';
import 'widgets/shell/desktop_shell.dart';

void main() => runApp(const MyApp());

/// Raiz do app — segura o [ThemeController] (light/dark) e repassa o toggle
/// para a casca. O padrão é dark-first (design system T3 Chat).
class MyApp extends StatefulWidget {
  const MyApp({super.key, this.themeController});

  final ThemeController? themeController;

  @override
  State<MyApp> createState() => MyAppState();
}

class MyAppState extends State<MyApp> {
  late final ThemeController _controller =
      widget.themeController ?? ThemeController();

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: _controller.mode,
      builder: (context, mode, _) => MaterialApp(
        title: 'cecistudy ♡',
        debugShowCheckedModeBanner: false,
        theme: CeciTheme.light(),
        darkTheme: CeciTheme.dark(),
        themeMode: mode,
        home: DesktopShell(onToggleTheme: _controller.toggle),
      ),
    );
  }
}