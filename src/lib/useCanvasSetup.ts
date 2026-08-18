import { useEffect, useRef, useState, RefObject } from 'react';

export interface CanvasRect {
  width: number;
  height: number;
}

export interface UseCanvasSetupResult {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Tamanho lógico do canvas — atualizado via ResizeObserver, nunca por reflow dentro do rAF. */
  rect: RefObject<CanvasRect>;
  /** true quando o canvas está no viewport (IntersectionObserver). */
  isVisible: RefObject<boolean>;
  /** true quando prefers-reduced-motion (ou tela < 768px) — lido uma vez no mount. */
  reducedMotion: boolean;
}

/**
 * Hook compartilhado dos charts dithered (canvas):
 * - cacheia o tamanho lógico via ResizeObserver (sem reflow por frame)
 * - pausa a animação quando fora da tela (IntersectionObserver) ou aba oculta
 * - lê prefers-reduced-motion UMA vez no mount (e desliga shimmer em telas < 768px)
 */
export function useCanvasSetup(): UseCanvasSetupResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rect = useRef<CanvasRect>({ width: 0, height: 0 });
  const isVisible = useRef(true);

  const [reducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const prefers =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.innerWidth < 768;
    return prefers || narrow;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            for (const entry of entries) {
              const { width, height } = entry.contentRect;
              rect.current = { width, height };
              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              canvas.width = Math.round(width * dpr);
              canvas.height = Math.round(height * dpr);
            }
          })
        : null;
    ro?.observe(canvas);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              isVisible.current = entry.isIntersecting;
            },
            { rootMargin: '100px' }
          )
        : null;
    io?.observe(canvas);

    const handleVisibility = () => {
      isVisible.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { canvasRef, rect, isVisible, reducedMotion };
}