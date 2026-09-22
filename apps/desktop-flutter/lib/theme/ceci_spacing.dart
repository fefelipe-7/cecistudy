/// Escala de espaçamento 8pt do cecistudy desktop.
///
/// Fonte única de verdade para padding/margin/gap. Não usar números fora
/// desta escala — se um layout "precisa" de 10 ou 20, ajustar para 8 ou 16.
class CeciSpacing {
  const CeciSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}