/**
 * Chrome nativo do tema (TEM-001 C.1).
 *
 * O `meta[name="theme-color"]` (web/PWA) já é tratado por `applyTheme` em
 * `themes.ts`; aqui fica só a status bar do Capacitor, isolada com import
 * dinâmico (padrão do repo — ver `permissions.ts`) para o módulo continuar
 * puro/seguro em vitest/jsdom.
 */
import { isNativePlatform } from './storage';
import type { Theme } from './themes';

/** Aplica a status bar conforme o tema ativo (no-op no web). */
export function applyThemeColorChrome(theme: Theme): void {
  if (!isNativePlatform) return;
  void (async () => {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: theme.isDark ? Style.Light : Style.Dark });
      await StatusBar.setBackgroundColor({ color: theme.themeColor });
    } catch {
      // no-op — status bar é cosmética; degrada para a config do capacitor
    }
  })();
}