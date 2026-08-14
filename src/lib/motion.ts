import { type Transition, type Variants } from 'framer-motion';

/** Transições padrão "iOS-like" do cecistudy. */

/** Curva de timing do iOS (push/fade de entrada) — suave e sem overshoot. */
export const IOS_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

/** Ease de saída (desaceleração curta, estilo iOS). */
export const IOS_EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Spring suave para entradas/saídas de telas e sheets (cauda curta). */
export const iOS_SPRING: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 36,
  mass: 0.9,
};

/** Spring leve para micro-interações (taps, hover). */
export const TAP_SPRING: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

/** Fade simples e rápido para overlays de modal. */
export const OVERLAY_FADE: Transition = { duration: 0.18, ease: 'easeOut' };

/**
 * Variants direcionais para transição de telas (pilha push/pop).
 * Cada variante resolve pelo `custom` (direction): 1 = push (entra da direita,
 * sai pela esquerda) · -1 = pop (entra da esquerda, sai pela direita) · 0 = fade sutil.
 * Sem spring: usa a curva de timing do iOS (60fps, sem cauda de ~1s).
 */
export const screenVariants: Variants = {
  initial: (direction: number) => ({
    x: direction === 0 ? 0 : direction * 28,
    y: direction === 0 ? 8 : 0,
    opacity: 0,
  }),
  animate: (direction: number) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition:
      direction === 0
        ? { duration: 0.22, ease: IOS_EASE }
        : { duration: 0.26, ease: IOS_EASE },
  }),
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction * -18,
    y: direction === 0 ? -6 : 0,
    opacity: direction === 0 ? 0 : 0.4,
    transition:
      direction === 0
        ? { duration: 0.15, ease: 'easeIn' }
        : { duration: 0.18, ease: 'easeIn' },
  }),
};

/** Variants para painéis de modal por posição. */
export const sheetVariants: Record<'center' | 'top' | 'bottom', Variants> = {
  center: {
    initial: { opacity: 0, scale: 0.96, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: iOS_SPRING },
    exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15, ease: 'easeIn' } },
  },
  top: {
    initial: { opacity: 0, y: -28 },
    animate: { opacity: 1, y: 0, transition: iOS_SPRING },
    exit: { opacity: 0, y: -20, transition: { duration: 0.16, ease: 'easeIn' } },
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0, transition: iOS_SPRING },
    exit: { y: '100%', transition: { duration: 0.2, ease: 'easeIn' } },
  },
};

/** Fade + slide simples (headers, toasts). */
export const fadeSlide: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};