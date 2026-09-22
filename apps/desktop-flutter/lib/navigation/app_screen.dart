import 'package:flutter/material.dart';

/// Telas de primeiro nível do shell desktop. A navegação é uma pilha simples
/// (abas de topo); telas auxiliares (detalhe de curso etc.) vivem dentro do
/// conteúdo de cada aba.
enum AppScreen {
  home,
  faculdade,
  estudos,
  biblioteca,
  perfil;

  String get label => switch (this) {
        AppScreen.home => 'Hoje',
        AppScreen.faculdade => 'Faculdade',
        AppScreen.estudos => 'Estudos',
        AppScreen.biblioteca => 'Biblioteca',
        AppScreen.perfil => 'Perfil',
      };

  String get description => switch (this) {
        AppScreen.home => 'seu dia de estudo em um olhar',
        AppScreen.faculdade => 'disciplinas, aulas e avaliações',
        AppScreen.estudos => 'pomodoro, flashcards e leituras',
        AppScreen.biblioteca => 'catálogo, templo e notas',
        AppScreen.perfil => 'jornada, stickers e preferências',
      };

  IconData get icon => switch (this) {
        AppScreen.home => Icons.home_rounded,
        AppScreen.faculdade => Icons.school_rounded,
        AppScreen.estudos => Icons.bolt_rounded,
        AppScreen.biblioteca => Icons.auto_stories_rounded,
        AppScreen.perfil => Icons.person_rounded,
      };
}