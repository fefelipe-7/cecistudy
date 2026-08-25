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

/** Pulinho padrão de entrada de tela — fade + sobe 10px, curva easeOut (0.3s). Igual à EstudosView. */
export const VIEW_PULINHO: Transition = { duration: 0.3, ease: 'easeOut' };

/** Duração da entrada no push/pop (crossfade com micro-drift). */
export const PUSH_DURATION = 0.24;

/** Duração da saída no push/pop (concorrente e sobreposta à entrada). */
export const PUSH_EXIT_DURATION = 0.18;

/** Duração da troca de tab (crossfade com pulinho sutil). */
export const TAB_DURATION = 0.22;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/**
 * Variants direcionais para transição de telas (pilha push/pop).
 * Cada variante resolve pelo `custom` (direction): 1 = push · -1 = pop · 0 = troca de tab.
 *
 * **Crossfade com micro-drift:** a tela nova faz fade-in com um deslize mínimo
 * na direção do movimento (±14px) enquanto a antiga esvanece suavemente por baixo
 * com drift contrário (~8px). Entrada e saída são concorrentes e sobrepostas —
 * leitura sutil de profundidade, sem "pulo" nem escurecimento.
 *
 * direction=0 (troca de tab) mantém o "pulinho" (fade + sobe 8px) sem slide horizontal.
 *
 * `prefers-reduced-motion` degrada tudo para um fade simples.
 */
export const screenVariants: Variants = {
  initial: (direction: number) => {
    if (prefersReducedMotion()) return { x: 0, y: 0, opacity: 0 };
    if (direction === 1) {
      // push: fade-in com drift mínimo vindo da direita
      return { x: 14, y: 0, opacity: 0 };
    }
    if (direction === -1) {
      // pop: fade-in com drift mínimo vindo da esquerda
      return { x: -14, y: 0, opacity: 0 };
    }
    // troca de tab: pulinho sutil
    return { x: 0, y: 8, opacity: 0 };
  },
  animate: (direction: number) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition:
      direction === 0
        ? { duration: TAB_DURATION, ease: 'easeOut' }
        : { duration: PUSH_DURATION, ease: IOS_EASE },
  }),
  exit: (direction: number) => {
    if (prefersReducedMotion())
      return { x: 0, y: 0, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } };
    if (direction === 1) {
      // sendo coberta pelo push: esvanece com drift para a esquerda
      return { x: -8, y: 0, opacity: 0, transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' } };
    }
    if (direction === -1) {
      // saindo no pop: esvanece com drift para a direita
      return { x: 8, y: 0, opacity: 0, transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' } };
    }
    // troca de tab: fade curto no lugar
    return {
      x: 0,
      y: 0,
      opacity: 0,
      transition: { duration: 0.12, ease: 'easeIn' },
    };
  },
};

/** Variants de fade + scale curtos para telas auxiliares (wizard, compose, etc.). */
export const overlayVariants: Variants = {
  initial: { opacity: 0, scale: 0.985, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: IOS_EASE_OUT } },
  exit: { opacity: 0, scale: 0.99, y: 4, transition: { duration: 0.14, ease: 'easeIn' } },
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

/**
 * Troca concorrente dos modos do header (brand ↔ detail), sincronizada com o push/pop
 * das telas: crossfade com micro-drift (±10px na entrada, ~6px na saída), no mesmo
 * ritmo do `screenVariants`.
 * Resolve pelo `custom` (direction): 1 = push · -1 = pop · 0 = troca de tab (só fade).
 */
export const headerSwapVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: prefersReducedMotion() ? 0 : direction === 1 ? 10 : direction === -1 ? -10 : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: PUSH_DURATION, ease: IOS_EASE },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: prefersReducedMotion() ? 0 : direction === 1 ? -6 : direction === -1 ? 6 : 0,
    transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' },
  }),
};