import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cecistudy_desktop/main.dart';
import 'package:cecistudy_desktop/navigation/app_screen.dart';
import 'package:cecistudy_desktop/theme/ceci_colors.dart';

void main() {
  testWidgets('dark theme é o padrão e o canvas do scaffold usa CeciColors.dark',
      (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    final context = tester.element(find.byType(Scaffold).first);
    expect(Theme.of(context).brightness, Brightness.dark);
    expect(Theme.of(context).scaffoldBackgroundColor, CeciColors.dark.canvas);
    expect(Theme.of(context).extension<CeciColors>()!.canvas, CeciColors.dark.canvas);
  });

  testWidgets('botão de tema alterna dark↔light', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // dark-first: botão mostra o sol (vai p/ claro).
    await tester.tap(find.byIcon(Icons.wb_sunny_outlined));
    await tester.pumpAndSettle();

    var context = tester.element(find.byType(Scaffold).first);
    expect(Theme.of(context).brightness, Brightness.light);
    expect(Theme.of(context).scaffoldBackgroundColor, CeciColors.light.canvas);

    // light: botão mostra a lua (volta p/ escuro).
    await tester.tap(find.byIcon(Icons.nights_stay_outlined));
    await tester.pumpAndSettle();

    context = tester.element(find.byType(Scaffold).first);
    expect(Theme.of(context).brightness, Brightness.dark);
    expect(Theme.of(context).scaffoldBackgroundColor, CeciColors.dark.canvas);
  });

  testWidgets('shell renderiza a Home por padrão', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('cecistudy ♡'), findsOneWidget);
    expect(find.text('Hoje'), findsWidgets);
    expect(find.text('Bom dia'), findsOneWidget);
    expect(find.text('Atenção do dia'), findsOneWidget);
  });

  testWidgets('navega pelas abas via sidebar', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    await tester.tap(find.text('Faculdade'));
    await tester.pumpAndSettle();
    expect(find.text('Psicologia do Desenvolvimento'), findsWidgets);

    await tester.tap(find.text('Estudos'));
    await tester.pumpAndSettle();
    expect(find.text('study corner'), findsOneWidget);

    await tester.tap(find.text('Biblioteca'));
    await tester.pumpAndSettle();
    expect(find.text('notas avulsas'), findsOneWidget);

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();
    expect(find.text('perfil'), findsOneWidget);
  });

  testWidgets('abre a busca com ⌘K e navega', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    await tester.sendKeyDownEvent(LogicalKeyboardKey.controlLeft);
    await tester.sendKeyEvent(LogicalKeyboardKey.keyK);
    await tester.sendKeyUpEvent(LogicalKeyboardKey.controlLeft);
    await tester.pumpAndSettle();
    expect(find.text('buscar telas…'), findsOneWidget);

    await tester.tap(find.text('Biblioteca').last);
    await tester.pumpAndSettle();
    expect(find.text('notas avulsas'), findsOneWidget);
    expect(AppScreen.biblioteca.label, 'Biblioteca');
  });
}