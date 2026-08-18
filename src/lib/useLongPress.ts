import React, { useCallback, useRef } from 'react';

/**
 * Long-press (mobile) + clique com botão direito (desktop).
 *
 * - `pointerdown` + 500ms parado (≤10px de movimento) dispara `onLongPress`.
 * - O `click` que vem logo depois de um long-press é engolido (não chama `onClick`).
 * - `contextmenu` (botão direito) dispara `onLongPress` direto no desktop e é
 *   bloqueado (não abre o menu nativo do navegador).
 * - Long-press em elementos interativos (input, textarea, select, `a`, botões)
 *   não é iniciado — não conflita com toggles/links internos.
 */
interface UseLongPressOptions {
  onLongPress: () => void;
  /** Chamado apenas em toque normal (sem long-press). */
  onClick?: () => void;
  thresholdMs?: number;
  moveTolerance?: number;
}

/** Elementos onde o long-press não deve disparar (interação própria). */
const INTERACTIVE_SELECTOR = 'input, textarea, select, a, button, [data-no-manage]';

/** Janela de segurança para não disparar duas vezes (touch → contextmenu móvel). */
const DOUBLE_FIRE_GUARD_MS = 700;

export function useLongPress({
  onLongPress,
  onClick,
  thresholdMs = 500,
  moveTolerance = 10,
}: UseLongPressOptions) {
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const pressElRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastFireRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const fire = useCallback(() => {
    const now = Date.now();
    if (now - lastFireRef.current < DOUBLE_FIRE_GUARD_MS) return;
    lastFireRef.current = now;
    clear();
    const pressedEl = pressElRef.current;
    pressElRef.current = null;
    // Engole o click que a sequência pointerup → click geraria logo depois,
    // apenas se ele nascer dentro do elemento pressionado.
    const swallow = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const hit = pressedEl ? (target && pressedEl.contains(target)) : true;
      window.removeEventListener('click', swallow, true);
      if (!hit) return;
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener('click', swallow, true);
    onLongPress();
  }, [clear, onLongPress]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (e.button !== 0) return;
      if (target.closest?.(INTERACTIVE_SELECTOR)) return;
      clear();
      pressElRef.current = target;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      timerRef.current = window.setTimeout(fire, thresholdMs);
    },
    [clear, fire, thresholdMs]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start || start.id !== e.pointerId) return;
      if (
        Math.abs(e.clientX - start.x) > moveTolerance ||
        Math.abs(e.clientY - start.y) > moveTolerance
      ) {
        clear();
      }
    },
    [clear, moveTolerance]
  );

  const handlePointerEnd = useCallback(() => {
    clear();
  }, [clear]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Long-press já engoliu o click no capture do window; aqui só segue o fluxo normal.
      void e;
      onClick?.();
    },
    [onClick]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      fire();
    },
    [fire]
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerLeave: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };
}