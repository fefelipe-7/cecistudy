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

/** Fade simples e rápido para overlays de modal. */
export const OVERLAY_FADE: Transition = { duration: 0.18, ease: 'easeOut' };

/** Duração da entrada no push/pop (fade + scale sutil). */
export const PUSH_DURATION = 0.2;

/** Duração da saída no push/pop (concorrente e sobreposta à entrada). */
export const PUSH_EXIT_DURATION = 0.13;

/** Duração da troca de tab (fade puro, sem movimento). */
export const TAB_DURATION = 0.15;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/**
 * Returns a transition object that respects the user's reduced‑motion preference.
 * If reduced motion is requested, returns a fast fade-only transition (duration 0.08).
 * Otherwise, returns the provided transition.
 */
export const getTransition = (normalTransition: Transition): Transition =>
  prefersReducedMotion() ? { duration: 0.08 } : normalTransition;

/**
 * Variants de transição de telas (pilha push/pop + troca de tab).
 * Cada variante resolve pelo `custom` (direction): 1 = push · -1 = pop · 0 = troca de tab.
 *
 * **Fade + scale sutil:** a tela nova entra com fade e um zoom mínimo
 * (0.985 → 1) enquanto a antiga esvanece por baixo, no lugar — sem deslocamento.
 * Leitura leve, rápida e sem "meio-slide".
 *
 * direction=0 (troca de tab) é **fade puro**, sem nenhum movimento.
 *
 * `prefers-reduced-motion` degrada tudo para um fade simples.
 */
export const screenVariants: Variants = {
  initial: (direction: number) => {
    if (prefersReducedMotion() || direction === 0) return { opacity: 0 };
    // push/pop: fade com zoom mínimo de entrada
    return { opacity: 0, scale: 0.985 };
  },
  animate: (direction: number) => ({
    opacity: 1,
    scale: 1,
    transition:
      direction === 0
        ? { duration: TAB_DURATION, ease: 'easeOut' }
        : { duration: PUSH_DURATION, ease: IOS_EASE_OUT },
  }),
  exit: (direction: number) => {
    if (prefersReducedMotion())
      return { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } };
    if (direction === 0) {
      // troca de tab: fade curtíssimo no lugar
      return { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } };
    }
    // sendo coberta/saindo: esvanece no lugar, sem movimento
    return { opacity: 0, transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' } };
  },
};

/** Variants de fade + scale curtos para telas auxiliares (wizard, compose, etc.). */
export const overlayVariants: Variants = {
  initial: () => {
    if (prefersReducedMotion()) return { opacity: 0 };
    return { opacity: 0, scale: 0.985, y: 6 };
  },
  animate: () => {
    if (prefersReducedMotion()) return { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } };
    return { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: IOS_EASE_OUT } };
  },
  exit: () => {
    if (prefersReducedMotion()) return { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } };
    return { opacity: 0, scale: 0.99, y: 4, transition: { duration: 0.14, ease: 'easeIn' } };
  },
};

/** Variants para painéis de modal por posição. */
export const sheetVariants: Record<'center' | 'top' | 'bottom', Variants> = {
  center: {
    initial: () => {
      if (prefersReducedMotion()) return { opacity: 0 };
      return { opacity: 0, scale: 0.96, y: 10 };
    },
    animate: () => {
      if (prefersReducedMotion()) return { opacity: 1, transition: { duration: 0.15, ease: 'easeIn' } };
      return { opacity: 1, scale: 1, y: 0, transition: iOS_SPRING };
    },
    exit: () => {
      if (prefersReducedMotion()) return { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } };
      return { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15, ease: 'easeIn' } };
    },
  },
  top: {
    initial: () => {
      if (prefersReducedMotion()) return { opacity: 0 };
      return { opacity: 0, y: -28 };
    },
    animate: () => {
      if (prefersReducedMotion()) return { opacity: 1, transition: { duration: 0.16, ease: 'easeIn' } };
      return { opacity: 1, y: 0, transition: iOS_SPRING };
    },
    exit: () => {
      if (prefersReducedMotion()) return { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } };
      return { opacity: 0, y: -20, transition: { duration: 0.16, ease: 'easeIn' } };
    },
  },
  bottom: {
    initial: () => {
      if (prefersReducedMotion()) return { y: '100%', opacity: 0 };
      return { y: '100%' };
    },
    animate: () => {
      if (prefersReducedMotion()) return { y: 0, transition: { duration: 0.2, ease: 'easeIn' } };
      return { y: 0, transition: iOS_SPRING };
    },
    exit: () => {
      if (prefersReducedMotion()) return { y: '100%', transition: { duration: 0.2, ease: 'easeIn' } };
      return { y: '100%', transition: { duration: 0.2, ease: 'easeIn' } };
    },
  },
};

/** Fade + slide simples (headers, toasts). */
export const fadeSlide: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

/**
 * Troca concorrente dos modos do header (brand ↔ detail), sincronizada com a
 * transição das telas: **crossfade puro** (sem deslocamento), no mesmo ritmo
 * do `screenVariants`. O `custom` (direction) é aceito e ignorado — mantém a
 * API compatível com os consumidores.
 */
export const headerSwapVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: PUSH_DURATION, ease: IOS_EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' },
  },
};