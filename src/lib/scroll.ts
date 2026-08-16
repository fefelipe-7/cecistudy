import { isNativePlatform } from './storage';

/**
 * Rola a janela ao topo. No nativo (Capacitor) usa comportamento instantâneo
 * para não competir com a transição de slide do framer-motion; no web mantém
 * o scroll suave.
 */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: isNativePlatform ? 'auto' : 'smooth' });
}