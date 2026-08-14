import { type Transition, type Variants } from 'framer-motion';

/** Transições padrão "iOS-like" do cecistudy. */

/** Spring suave para entradas/saídas de telas e sheets. */
export const iOS_SPRING: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
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
 */
export const screenVariants: Variants = {
  initial: (direction: number) => ({
    x: direction === 0 ? 0 : direction * 56,
    y: direction === 0 ? 6 : 0,
    opacity: 0,
  }),
  animate: (direction: number) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition:
      direction === 0
        ? { duration: 0.22, ease: 'easeOut' }
        : iOS_SPRING,
  }),
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction * -32,
    y: direction === 0 ? -6 : 0,
    opacity: direction === 0 ? 0 : 0.25,
    transition:
      direction === 0
        ? { duration: 0.15, ease: 'easeIn' }
        : { duration: 0.16, ease: 'easeIn' },
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

/** Container de stagger para entrada de listas/cards. */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
  exit: {},
};

/** Item individual de um stagger. */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.14, ease: 'easeIn' } },
};

/** Fade + slide simples (headers, toasts). */
export const fadeSlide: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};