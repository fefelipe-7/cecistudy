/**
 * Shim de compatibilidade — o sistema de movimento vive em `src/lib/motion/`.
 *
 * Ver `docs/specs/SPEC-007-sistema-unificado-de-transicoes-e-montagem-de-telas.md`.
 *
 * - **Novo código** importa de `./motion` (o diretório), nunca deste arquivo.
 * - Os símbolos daqui abaixo que ainda NÃO migraram (`screenVariants`,
 *   `overlayVariants`, `sheetVariants`, `fadeSlide`, `headerSwapVariants`,
 *   `iOS_SPRING`, `IOS_EASE*`, `getTransition`) são **legado**: migram para
 *   `src/lib/motion/` no Slice C (telas) e Slice D (chrome/modais).
 * - `setNavMotionContext`/`consumeNavMotionContext` viram ponteiros para o
 *   contrato `NavIntent` (Slice B remove de vez).
 *
 * Este arquivo não ganha símbolo novo — é só re-export + depreciação.
 */

import { useEffect, useState } from 'react';
import { type Transition, type Variants } from 'framer-motion';
import { EASE } from './motion/tokens';

// Superfície pública única do sistema de movimento (SPEC-007).
export * from './motion/index';

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

/** Duração da entrada no push/pop (fade + slide direcional). */
export const PUSH_DURATION = 0.24;

/** Duração da saída no push/pop (concorrente e sobreposta à entrada). */
export const PUSH_EXIT_DURATION = 0.18;

/** Duração da troca de tab (fade puro, sem movimento). */
export const TAB_DURATION = 0.15;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/**
 * Hook reativo de `prefers-reduced-motion`. Usado pelos componentes de animação
 * 3D (flip/tilt/voo) para degradar para efectos simples quando o usuário pedir.
 * No jsdom (sem `matchMedia`) devolve `false`; componentes podem receber o valor
 * por prop nos testes.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [reduce, setReduce] = useState(() => prefersReducedMotion());
  useEffect(() => {
    const mql =
      typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
    if (!mql || typeof mql.addEventListener !== 'function') return;
    const onChange = () => setReduce(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduce;
};

/**
 * Returns a transition object that respects the user's reduced‑motion preference.
 * If reduced motion is requested, returns a fast fade-only transition (duration 0.08).
 * Otherwise, returns the provided transition.
 */
export const getTransition = (normalTransition: Transition): Transition =>
  prefersReducedMotion() ? { duration: 0.08 } : normalTransition;

/**
 * Contexto de navegação lido pelas variantes no MOMENTO em que rodam.
 *
 * A instância que SAI de um AnimatePresence tem props congeladas do último
 * render — a direção fresca do pop/push e o offset inicial do gesto de borda
 * não chegam por props. O canal de `src/lib/motion/intent.ts` resolve isso
 * carregando o `NavIntent` **inteiro** (o que também matou o bug B2, em que o
 * `gestureX` era zerado por um segundo escritor).
 *
 * ⚠️ **Legado** — `screenVariants` e estes dois helpers só continuam aqui por
 * causa de consumidores que ainda não migraram. O `SlideScreen` já usa
 * `createScreenVariants` (Slice C). Não há mais duas verdades de movimento.
 */
let motionCtx = { direction: 0, gestureX: 0 };

/** @deprecated Use `setMotionIntent`/`gesturePopIntent` (`src/lib/motion/intent.ts`). */
export const setNavMotionContext = (direction: number, gestureX = 0) => {
  motionCtx = { direction, gestureX };
};

/** @deprecated Use `consumeMotionIntent`. */
const consumeNavMotionContext = () => {
  const ctx = motionCtx;
  motionCtx = { direction: 0, gestureX: 0 };
  return ctx;
};

/**
 * @deprecated Use `createScreenVariants(width, profile)` de `src/lib/motion/variants.ts`.
 *
 * Variantes de transição de telas (pilha push/pop + troca de tab), legadas.
 * Substituídas pela física de tela cheia com `NavIntent` (SPEC-007 Slice C).
 */
export const screenVariants: Variants = {
  initial: (direction: number) => {
    if (prefersReducedMotion() || direction === 0) return { opacity: 0 };
    // push: entra da direita · pop: a tela anterior é revelada vinda da esquerda
    return direction === 1
      ? { opacity: 0, x: '18%', scale: 0.99 }
      : { opacity: 0.82, x: '-14%', scale: 1 };
  },
  animate: (direction: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition:
      direction === 0
        ? { duration: TAB_DURATION, ease: 'easeOut' }
        : { duration: PUSH_DURATION, ease: IOS_EASE_OUT },
  }),
  exit: () => {
    const { direction, gestureX } = consumeNavMotionContext();
    if (prefersReducedMotion())
      return { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } };
    if (direction === 0) {
      // troca de tab: fade curtíssimo no lugar
      return { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } };
    }
    if (direction === 1) {
      // sendo coberta por um push: parallax sutil p/ a esquerda + leve dim
      return {
        opacity: 0.9,
        x: '-5%',
        scale: 0.995,
        transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' },
      };
    }
    // pop: a tela do topo desliza p/ a direita — partindo do ponto do gesto de
    // borda (gestureX) quando ele comitou, sem salto de continuidade.
    const endX = Math.max(gestureX + 90, window.innerWidth * 0.26);
    return {
      x: [gestureX, endX],
      opacity: [1, 0],
      transition: { duration: PUSH_EXIT_DURATION, ease: IOS_EASE },
    };
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
 * Troca de modo do header (brand ↔ detail).
 *
 * **Crossfade curto e propositalmente mais rápido que o slide da tela** (SPEC-007
 * anti-padrão 11: header e tela não devem animar a mesma coisa). O slide da tela
 * agora é de tela cheia (0.26s); se o header fizesse um crossfade do mesmo
 * tamanho, os dois sinais se sobrepõem e vira um borrão. Com 0.1s, o header lê
 * como "o conteúdo trocou" e o movimento fica sendo o da tela.
 *
 * O `custom` (direction) é aceito e ignorado — mantém a API compatível.
 */
export const headerSwapVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: EASE.exit } },
};