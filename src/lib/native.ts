import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativePlatform } from './storage';

/**
 * Configuração única do shell nativo (Capacitor).
 * No web/PWA tudo aqui é no-op — o app continua 100% web.
 */
export function setupNativeShell(): void {
  if (!isNativePlatform) return;

  // Status bar escura sobre o canvas da marca (bg já vem do capacitor.config)
  void StatusBar.setStyle({ style: Style.Dark });
  void StatusBar.setOverlaysWebView({ overlay: false });

  // Teclado: redimensiona o WebView para não cobrir inputs
  void Keyboard.setResizeMode({ mode: KeyboardResize.Native });

  // Esconde o splash após o primeiro frame (fallback do autoHide da config)
  requestAnimationFrame(() => {
    void SplashScreen.hide();
  });
}
