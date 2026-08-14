import React, { useCallback, useRef } from 'react';
import {
  motion,
  useAnimation,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import { EDGE_WIDTH, SWIPE_THRESHOLD, SWIPE_VELOCITY, isHorizontalPan } from '../../lib/swipe';
import { iOS_SPRING } from '../../lib/motion';

interface SwipeBackProps {
  /** chamado quando o gesto de voltar completa o limiar */
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Swipe-back estilo iOS: arrastar a partir da borda esquerda translada o
 * conteúdo para a direita e, passado o limiar, chama `onClose`.
 */
export const SwipeBack: React.FC<SwipeBackProps> = ({ onClose, children }) => {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const controls = useAnimation();
  const panRef = useRef({ active: false, startX: 0 });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const snapBack = useCallback(() => {
    if (reducedMotion) {
      controls.set({ x: 0 });
      return;
    }
    void controls.start({ x: 0, transition: iOS_SPRING });
  }, [controls, reducedMotion]);

  const handlePanStart = useCallback(
    (event: PointerEvent, info: PanInfo) => {
      // swipe-back de borda funciona até sobre botões/links (tap continua ok);
      // só ignora faixas com scroll horizontal próprio e campos de texto
      const target = event.target as Element | null;
      const locked =
        target instanceof Element &&
        target.closest('[data-swipe-lock], input, textarea, select, [contenteditable="true"]') !== null;
      if (reducedMotion || locked || info.point.x > EDGE_WIDTH) {
        panRef.current.active = false;
        return;
      }
      panRef.current = { active: true, startX: x.get() };
    },
    [reducedMotion, x],
  );

  const handlePan = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      if (!panRef.current.active) return;
      if (!isHorizontalPan(info.offset)) return;
      // só translada para a direita (fechar); esquerda não faz nada
      x.set(panRef.current.startX + Math.max(0, info.offset.x));
    },
    [x],
  );

  const handlePanEnd = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      if (!panRef.current.active) return;
      panRef.current.active = false;
      const { offset, velocity } = info;
      if (velocity.x > SWIPE_VELOCITY || offset.x > SWIPE_THRESHOLD) {
        onCloseRef.current();
      } else {
        snapBack();
      }
    },
    [snapBack],
  );

  return (
    <motion.div
      style={{ x, touchAction: 'pan-y' }}
      animate={controls}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
    >
      {children}
    </motion.div>
  );
};