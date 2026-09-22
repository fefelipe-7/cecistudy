import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cecistudy_desktop/theme/ceci_colors.dart';

/// Luminância relativa WCAG (padrão sRGB linearizado).
double _luminance(Color c) {
  double lin(double s) {
    return s <= 0.03928 ? s / 12.92 : math.pow((s + 0.055) / 1.055, 2.4).toDouble();
  }

  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/// Razão de contraste de duas cores.
double _contrast(Color a, Color b) {
  final la = _luminance(a);
  final lb = _luminance(b);
  final lighter = math.max(la, lb);
  final darker = math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

void main() {
  group('CeciColors.light', () {
    test('canvas é claro e o card é branco puro', () {
      expect(CeciColors.light.canvas, const Color(0xFFF8F3F7));
      expect(CeciColors.light.surfaceCard, const Color(0xFFFFFFFF));
    });

    test('texto principal e secundário têm contraste AA+ sobre o canvas', () {
      expect(_contrast(CeciColors.light.textPrimary, CeciColors.light.canvas),
          greaterThan(12));
      expect(_contrast(CeciColors.light.textSecondary, CeciColors.light.surfaceCard),
          greaterThan(10));
    });

    test('magenta é accent (não texto): onBrand sobre brand ≥ AA', () {
      expect(_contrast(CeciColors.light.onBrand, CeciColors.light.brand),
          greaterThan(4.5));
    });

    test('statusDanger light tem contraste com o canvas', () {
      expect(_contrast(CeciColors.light.statusDanger, CeciColors.light.canvas),
          greaterThan(4.5));
    });

    test('ring/brand/brandStrong são tons distintos', () {
      expect(CeciColors.light.ring, isNot(CeciColors.light.brand));
      expect(CeciColors.light.brandStrong, isNot(CeciColors.light.brand));
    });
  });

  group('CeciColors.dark', () {
    test('canvas dark-first é mais claro que o card (inversão intencional)', () {
      expect(CeciColors.dark.canvas, const Color(0xFF21141E));
      expect(CeciColors.dark.surfaceCard, const Color(0xFF0B080B));
      expect(_luminance(CeciColors.dark.canvas),
          greaterThan(_luminance(CeciColors.dark.surfaceCard)));
    });

    test('textos claros sobre canvas e card têm contraste AA+', () {
      expect(_contrast(CeciColors.dark.textPrimary, CeciColors.dark.canvas),
          greaterThan(12));
      expect(_contrast(CeciColors.dark.textSecondary, CeciColors.dark.canvas),
          greaterThan(7));
      expect(_contrast(CeciColors.dark.textTertiary, CeciColors.dark.surfaceCard),
          greaterThan(4.5));
    });

    test('onBrand no dark é rosa-claro com AA sobre brand', () {
      expect(CeciColors.dark.onBrand, const Color(0xFFFBD0E8));
      expect(_contrast(CeciColors.dark.onBrand, CeciColors.dark.brand),
          greaterThan(4.5));
    });

    test('textPrimary e textSecondary do dark são distintos do light', () {
      expect(CeciColors.dark.textPrimary, isNot(CeciColors.light.textPrimary));
      expect(CeciColors.dark.textSecondary, isNot(CeciColors.light.textSecondary));
    });
  });

  group('copyWith e lerp', () {
    test('copyWith altera apenas o campo pedido', () {
      final c = CeciColors.light.copyWith(canvas: const Color(0xFF000000));
      expect(c.canvas, const Color(0xFF000000));
      expect(c.surfaceCard, CeciColors.light.surfaceCard);
      expect(c.brand, CeciColors.light.brand);
    });

    test('lerp light→dark nos extremos preserva as paletas', () {
      final at0 = CeciColors.light.lerp(CeciColors.dark, 0.0);
      final at1 = CeciColors.light.lerp(CeciColors.dark, 1.0);
      expect(at0.canvas, CeciColors.light.canvas);
      expect(at1.canvas, CeciColors.dark.canvas);
      expect(at1.onBrand, CeciColors.dark.onBrand);
    });

    test('lerp com outro tipo devolve a instância atual', () {
      expect(CeciColors.light.lerp(null, 0.5), same(CeciColors.light));
    });

    test('lerp no meio interpola as paletas por canal', () {
      final mid = CeciColors.light.lerp(CeciColors.dark, 0.5);
      expect(
        mid.canvas,
        Color.lerp(CeciColors.light.canvas, CeciColors.dark.canvas, 0.5),
      );
      expect(
        mid.ring,
        Color.lerp(CeciColors.light.ring, CeciColors.dark.ring, 0.5),
      );
    });
  });
}