import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createFrameStats, recordFrame, type FrameStats } from './performance/perfMarks';
import { useElementActivity } from './useElementActivity';

export interface CanvasRect {
  width: number;
  height: number;
}

export interface UseCanvasSetupResult {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Tamanho lógico do canvas — atualizado via ResizeObserver, nunca por reflow dentro do rAF. */
  rect: RefObject<CanvasRect>;
  /**
   * Atividade COMBINADA: no viewport (IntersectionObserver) **E** documento
   * visível (`visibilitychange`). As duas fontes escrevem em refs separadas e
   * o combinado só muda quando o combinado de fato muda — antes, o
   * `visibilitychange` reativava sozinho um canvas que tinha saído da viewport
   * enquanto a aba estava oculta (spec-performance §5.1).
   *
   * A regra mora em `useElementActivity` — o mesmo dono que serve o vídeo do
   * hero. Aqui ela é consumida, não reimplementada.
   */
  isVisible: RefObject<boolean>;
  /** Contexto 2D criado UMA vez (spec §5.3 — nunca `getContext` por frame). */
  ctxRef: RefObject<CanvasRenderingContext2D | null>;
  /** true quando prefers-reduced-motion (ou tela < 768px) — lido uma vez no mount. */
  reducedMotion: boolean;
  /** Assina transições de atividade. Retorna unsubscribe. */
  onActivityChange: (cb: (active: boolean) => void) => () => void;
  /** Assina mudanças de tamanho (ResizeObserver). Retorna unsubscribe. */
  onRectChange: (cb: () => void) => () => void;
}

/**
 * Hook compartilhado dos charts dithered (canvas):
 * - cacheia o tamanho lógico via ResizeObserver (sem reflow por frame)
 * - atividade = viewport ∧ documento visível, com notificação de transição
 * - contexto 2D reutilizado (uma chamada de getContext por elemento)
 * - lê prefers-reduced-motion UMA vez no mount (e desliga shimmer em telas < 768px)
 */
export function useCanvasSetup(): UseCanvasSetupResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rect = useRef<CanvasRect>({ width: 0, height: 0 });
  const rectListeners = useRef(new Set<() => void>());

  // A atividade (viewport ∧ documento visível) é uma regra compartilhada —
  // mora em `useElementActivity`, que o vídeo do hero também consome.
  const { isActive: isVisible, onActivityChange } = useElementActivity(canvasRef);

  const [reducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const prefers =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.innerWidth < 768;
    return prefers || narrow;
  });

  const onRectChange = useCallback((cb: () => void) => {
    rectListeners.current.add(cb);
    return () => {
      rectListeners.current.delete(cb);
    };
  }, []);

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
            for (const cb of rectListeners.current) cb();
          })
        : null;
    ro?.observe(canvas);

    // A atividade (viewport ∧ documento visível) é observada pelo
    // `useElementActivity` — este arquivo cuida só do tamanho do canvas.
    return () => {
      ro?.disconnect();
    };
  }, []);

  return {
    canvasRef,
    ctxRef,
    rect,
    isVisible,
    reducedMotion,
    onActivityChange,
    onRectChange,
  };
}

// ---------------------------------------------------------------------------
// Loop controlado (spec-performance §5.2) — a ÚNICA política de animação dos
// quatro componentes dithered, sem cópias divergentes (§5.4).
// ---------------------------------------------------------------------------

export interface UseDitherLoopResult {
  /**
   * Pede um frame: idempotente (um RAF pendente no máximo) e respeita a
   * atividade e o reduced-motion. É o gatilho para mudanças de dado,
   * interação de ponteiro e (re)ativação.
   */
  scheduleFrame: () => void;
  /** Contador de dev (frames desenhados) — null em produção. Aceite da F4. */
  frameStats: FrameStats | null;
}

/**
 * Loop de desenho controlado:
 *
 * - `draw(now)` desenha um frame e devolve **true se ainda precisa animar**
 *   (morph em curso, interação ativa). Devolver false congela o gráfico —
 *   shimmer estável não pede frame infinito (spec §5.2).
 * - Ao ficar inativo (fora da viewport/aba oculta): **cancela** o RAF pendente
 *   e não pede mais nenhum frame — o padrão antigo reagendava para sempre.
 * - Ao (re)ativar: um frame imediato (estático se o draw não pedir mais nada);
 *   morph só retoma se houve mudança de dados enquanto inativo.
 * - `prefers-reduced-motion` **nunca reagenda**, mesmo se o draw pedir
 *   (garantia dura do RNF-03, não convenção dos componentes).
 * - Sem IntersectionObserver/ResizeObserver (jsdom): ativo enquanto montado e
 *   documento visível (fallback da spec §5.1).
 */
export function useDitherLoop(
  draw: (now: number) => boolean,
  setup: UseCanvasSetupResult,
): UseDitherLoopResult {
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const requestRef = useRef<number | undefined>(undefined);
  const scheduleRef = useRef<() => void>(() => {});
  const frameStatsRef = useRef<FrameStats | null>(createFrameStats());

  useEffect(() => {
    const frameStats = frameStatsRef.current;

    const schedule = () => {
      if (requestRef.current != null) return; // já há frame pendente
      if (!setup.isVisible.current) return; // inativo: zero novo frame
      requestRef.current = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      requestRef.current = undefined;
      const needsMore = drawRef.current(now);
      recordFrame(frameStats);
      // Garantias duras do loop (§5.2/RNF-03): reduced-motion nunca continua;
      // inativo nunca pede o próximo frame.
      if (needsMore && !setup.reducedMotion && setup.isVisible.current) {
        schedule();
      }
    };

    scheduleRef.current = schedule;

    const offActivity = setup.onActivityChange((active) => {
      if (active) {
        schedule(); // frame estático imediato; loop segue só se o draw pedir
      } else if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current); // §5.2: cancelar o pendente
        requestRef.current = undefined;
      }
    });
    const offRect = setup.onRectChange(() => schedule()); // frame após resize (§5.3)

    schedule(); // primeiro frame do mount

    return () => {
      offActivity();
      offRect();
      if (requestRef.current != null) cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    };
  }, [setup.isVisible, setup.onActivityChange, setup.onRectChange, setup.reducedMotion]);

  const scheduleFrame = useCallback(() => {
    scheduleRef.current();
  }, []);

  return { scheduleFrame, frameStats: frameStatsRef.current };
}
