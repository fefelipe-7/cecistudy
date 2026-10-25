import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { revealVariants } from './variants';

export interface RevealContextValue {
  /** `false` no perfil reduzido ou sem `IntersectionObserver`: nada se revela. */
  enabled: boolean;
  /** Observa o elemento e avisa a cada mudança. Devolve o cancelamento. */
  observe: (element: Element, onIntersect: (intersecting: boolean) => void) => () => void;
}

export const RevealContext = createContext<RevealContextValue | null>(null);

interface RevealProps {
  /** Posição na lista: o stagger é `min(index, 6)` passos. */
  index?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Item de lista que entra quando aparece na tela (SPEC-M-027 D6).
 *
 * Três estados, e o inicial é **visível de propósito**:
 * - `idle`: visível. É o que está na tela antes de qualquer callback — se o
 *   observer nunca responder, o conteúdo continua lá. Falhar para "invisível"
 *   seria esconder dado da usuária.
 * - `armed`: o primeiro callback disse que o item está fora da tela; ele passa
 *   a esperar.
 * - `shown`: cruzou o viewport e entrou, com o stagger do índice.
 *
 * Item que já estava visível no primeiro paint **nunca arma** (F5.5): animar o
 * que a usuária já está lendo é o espetáculo que a §4.10 do referencial recusa.
 */
export const Reveal: React.FC<RevealProps> = ({ index = 0, className, children }) => {
  const reveal = useContext(RevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!reveal?.enabled) return;
    const element = ref.current;
    if (!element) return;

    let first = true;
    let stop: (() => void) | undefined;
    stop = reveal.observe(element, (intersecting) => {
      if (first) {
        first = false;
        if (intersecting) stop?.(); // já visível: não arma, não anima
        else setArmed(true);
        return;
      }
      if (intersecting) {
        setShown(true);
        stop?.();
      }
    });

    return stop;
  }, [reveal]);

  if (!reveal?.enabled) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      custom={index}
      variants={revealVariants}
      initial={false}
      animate={armed && !shown ? 'initial' : 'animate'}
    >
      {children}
    </motion.div>
  );
};
