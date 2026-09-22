/**
 * Chrome de orientação do foco imersivo (landscape) — melhor esforço, sempre
 * degrada graciosamente. Em `src/lib` pode referenciar Capacitor (regra de
 * fronteira); o status-bar entra aqui via import estático (a `native.ts` já o
 * puxa no boot — sem ganho em dinâmico).
 */
import { StatusBar, Style } from '@capacitor/status-bar';
import { getActiveTheme } from './themes';

const FOCUS_BG = '#0B0B0C';

interface ScreenWithOrientation {
  orientation?: {
    lock?: (orientation: string) => Promise<void>;
    unlock?: () => Promise<void>;
  };
}

function getScreen(): ScreenWithOrientation | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.screen as unknown as ScreenWithOrientation;
}

/** Viewport está deitado? (pura, usada por testes) */
export function isLandscapeViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/** Tenta travar landscape (web lock); retorna true se conseguiu pedir o lock. */
export async function requestFocusLandscape(): Promise<boolean> {
  if (typeof window === 'undefined' || isLandscapeViewport()) return false;
  const orientation = getScreen()?.orientation;
  try {
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
      return true;
    }
  } catch {
    // aparelho/blink sem suporte ao lock → degrada para retrato usável
  }
  return false;
}

/** Destrava a orientação — no-op seguro (idempotente para uso no boot). */
export async function releaseFocusOrientation(): Promise<void> {
  const orientation = getScreen()?.orientation;
  try {
    if (orientation && typeof orientation.unlock === 'function') {
      await orientation.unlock();
    }
  } catch {
    // no-op
  }
}

function applyThemeColor(color: string): () => void {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  const previous = meta?.content ?? '';
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
  return () => {
    if (meta) meta.content = previous;
  };
}

// Guarda do restore mais recente (módulo, sem global).
let activeChromeRestore: (() => void) | null = null;

/** Aplica o chrome imersivo (theme-color + status bar clara no nativo). */
export function applyFocusChrome(): () => void {
  const restoreTheme = applyThemeColor(FOCUS_BG);
  const restoreStatus = (() => {
    try {
      // Sem getters no plugin (Capacitor 8) → restaura a partir do tema ativo.
      void StatusBar.setStyle({ style: Style.Light });
      void StatusBar.setBackgroundColor({ color: FOCUS_BG });
      return () => {
        const theme = getActiveTheme();
        void StatusBar.setStyle({ style: theme.isDark ? Style.Light : Style.Dark });
        void StatusBar.setBackgroundColor({ color: theme.themeColor });
      };
    } catch {
      // web: não há status bar — só theme-color
      return null;
    }
  })();

  activeChromeRestore = () => {
    restoreTheme();
    restoreStatus?.();
  };
  return activeChromeRestore;
}

/** Restaura o chrome imersivo de vez (no-op seguro se nunca aplicado). */
export function restoreFocusChrome(): void {
  activeChromeRestore?.();
  activeChromeRestore = null;
}

/** Aplica o chrome e registra o restore (simples, sem async). */
export function setupFocusChrome(): void {
  applyFocusChrome();
}