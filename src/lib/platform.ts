/**
 * Detecção de plataforma desktop (Tauri) — irmã do `isNativePlatform` (Capacitor).
 *
 * Não importa nada do `@tauri-apps/api`: o shell desktop é configurado com
 * `withGlobalTauri: true`, então a ponte fica em `window.__TAURI__`. Assim o
 * bundle web/mobile continua 100% livre de código Tauri.
 *
 * **Preview no navegador:** a plataforma pode ser FORÇADA pela query string
 * (`?platform=desktop` ou `?platform=web`) — usado para desenvolver/ajustar a
 * UI da casca desktop rodando só o dev server (`npm run dev` →
 * http://localhost:3000/?platform=desktop), sem compilar o Tauri.
 */

type ForcedPlatform = 'desktop' | 'web';

function readForcedPlatform(): ForcedPlatform | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = new URLSearchParams(window.location.search).get('platform');
    return value === 'desktop' || value === 'web' ? value : null;
  } catch {
    return null;
  }
}

const forcedPlatform = readForcedPlatform();

if (forcedPlatform && import.meta.env?.DEV) {
  console.info(`[cecistudy] preview forçado: shell ${forcedPlatform} (?platform=${forcedPlatform})`);
}

export const isDesktop: boolean =
  forcedPlatform === 'desktop' ||
  (forcedPlatform === null &&
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window);

/** Acesso seguro à ponte global do Tauri (`null` fora do desktop). */
export function tauriGlobal(): Record<string, any> | null {
  if (!isDesktop) return null;
  return (window as any).__TAURI__ ?? null;
}

/**
 * Marca a plataforma no elemento raiz (`<html data-platform>`) — deve rodar
 * antes do 1º render. Habilita a variante CSS `desktop:*` no Tailwind
 * (ver `@custom-variant` em `index.css`), permitindo estilizar por plataforma
 * além de por breakpoint.
 */
export function initPlatformFlags(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.platform = isDesktop ? 'desktop' : 'web';
}
