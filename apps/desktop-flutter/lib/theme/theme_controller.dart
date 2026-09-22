import 'package:flutter/material.dart';

/// Controlador de tema light/dark — compartilhado entre [main.dart] e
/// [DesktopShell] sem dependência circular.
class ThemeController {
  ThemeController({ThemeMode initial = ThemeMode.dark})
      : _mode = ValueNotifier(initial);

  final ValueNotifier<ThemeMode> _mode;
  ValueNotifier<ThemeMode> get mode => _mode;

  ThemeMode get current => _mode.value;

  void toggle() => _mode.value = _mode.value == ThemeMode.dark
      ? ThemeMode.light
      : ThemeMode.dark;
}