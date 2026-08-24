/**
 * Detecção de plataforma desktop (Tauri) — irmã do `isNativePlatform` (Capacitor).
 *
 * Não importa nada do `@tauri-apps/api`: o shell desktop é configurado com
 * `withGlobalTauri: true`, então a ponte fica em `window.__TAURI__`. Assim o
 * bundle web/mobile continua 100% livre de código Tauri.
 */
export const isDesktop: boolean =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Acesso seguro à ponte global do Tauri (`null` fora do desktop). */
export function tauriGlobal(): Record<string, any> | null {
  if (!isDesktop) return null;
  return (window as any).__TAURI__ ?? null;
}
