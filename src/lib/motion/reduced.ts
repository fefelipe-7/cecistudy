/**
 * Sinal de Reduzir Movimento (SPEC-007 §D4).
 *
 * Módulo isolado de propósito. `prefersReducedMotion` lia `window`, e antes
 * morava em `src/lib/motion.ts` — que faz `export * from './motion/index'`, e o
 * index exporta `./variants`. Qualquer variante que precisasse do sinal
 * importando de `../motion` fechava o ciclo
 * `variants → motion.ts → index → variants`, com ordem de inicialização de
 * `const` dependente. Separando em `./reduced`, `variants.ts` depende só de
 * `./tokens`, `./intent` e `./profile` — e deste.
 */

import { useEffect, useState } from 'react';
import type { Transition } from 'framer-motion';

/** Lê a preferência do sistema. `false` onde não há `matchMedia` (jsdom/SSR). */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/**
 * Hook reativo de `prefers-reduced-motion`. Usado pelos componentes de animação
 * 3D (flip/tilt/voo) para degradar para efeitos simples quando a pessoa pedir.
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
 * Transition que respeita a preferência: fade curtíssimo quando o movimento está
 * reduzido, senão a transition recebida.
 *
 * Usado por animações locais (3D, canvas, micro-interações) que **não** passam
 * pelo perfil — para elas o perfil não se aplica, mas a preferência ainda vale.
 */
export const getTransition = (normalTransition: Transition): Transition =>
  prefersReducedMotion() ? { duration: 0.08 } : normalTransition;