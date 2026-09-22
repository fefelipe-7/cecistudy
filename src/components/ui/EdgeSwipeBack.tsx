import { useEffect, useRef } from 'react';
import { animate, MotionValue } from 'framer-motion';

import {
  clampDrag,
  EDGE_WIDTH,
  isEngaged,
  shouldCommit,
  shouldIgnoreTarget,
  supportsEdgeSwipe,
} from '@/lib/swipe';
import { setNavMotionContext } from '@/lib/motion';

export type EdgeSwipeBackProps = {
  /** Valor de transform `x` da camada de slide (o gesto anima ele). */
  swipeX: MotionValue<number>;
  /** Volta um nível (mesma cadeia do back do Android). */
  onBack: () => boolean;
  /** Se existe algo para voltar; se não, o gesto fica inerte. */
  canGoBack: boolean;
};

/**
 * Gesto de "voltar pela borda" (edge swipe-back), estilo iOS.
 *
 * Escuta pointer events no `window`: o gesto só inicia quando o toque começa
 * na faixa da borda esquerda (EDGE_WIDTH) e se move para a direita. Durante o
 * arrasto, `swipeX` acompanha o dedo (limitado a uma fração da tela); soltar
 * acima do limiar chama `onBack`, senão volta ao lugar com spring.
 *
 * Interativos (botões, inputs, áreas com scroll horizontal, `[data-no-swipe]`)
 * são ignorados — o gesto nunca rouba o toque de um botão.
 *
 * Sem toque (desktop) o componente é um no-op.
 */
export function EdgeSwipeBack({ swipeX, onBack, canGoBack }: EdgeSwipeBackProps) {
  const stateRef = useRef({ onBack, canGoBack });
  stateRef.current = { onBack, canGoBack };

  useEffect(() => {
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? true;
    if (!coarsePointer) return;

    let active = false;
    let engaged = false;
    let startX = 0;
    let startY = 0;
    let dragX = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      // Só o web/PWA usa este fallback: no nativo o gesto é tratado pelo plugin
      // Swift e o componente nem é renderizado (guard no MobileAppShell).
      if (!stateRef.current.canGoBack) return;
      if (!supportsEdgeSwipe(window.innerWidth)) return;
      if (e.clientX > EDGE_WIDTH) return;
      if (shouldIgnoreTarget(e.target)) return;
      active = true;
      engaged = false;
      dragX = 0;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return;
      if (!engaged) {
        if (!isEngaged(startX, startY, e.clientX, e.clientY)) return;
        engaged = true;
      }
      dragX = e.clientX - startX;
      swipeX.set(clampDrag(dragX, window.innerWidth));
    };

    const onPointerUp = () => {
      if (!active) return;
      active = false;
      if (!engaged) return;
      engaged = false;
      const commit = shouldCommit(dragX);
      if (commit) {
        // Contexto do pop iniciado pelo gesto: a variante de exit parte do ponto
        // em que o dedo soltou (gestureX) e desliza a tela p/ a direita até sair.
        // O transform do wrapper zera no mesmo frame — o exit assume a posição do
        // dedo, sem salto de continuidade.
        setNavMotionContext(-1, dragX);
        swipeX.set(0);
        const handled = stateRef.current.onBack();
        if (!handled) setNavMotionContext(0, 0);
        return;
      }
      // Cancelado: spring devolve a tela ao lugar.
      animate(swipeX, 0, { type: 'spring', stiffness: 500, damping: 42 });
    };

    const onPointerCancel = () => {
      if (!active) return;
      active = false;
      engaged = false;
      animate(swipeX, 0, { type: 'spring', stiffness: 500, damping: 42 });
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [swipeX]);

  return null;
}