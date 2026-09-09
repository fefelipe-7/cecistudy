import React, { useLayoutEffect, useRef } from 'react';
import { motion, usePresence } from 'framer-motion';
import { screenVariants } from '../lib/motion';
import { getFrozenExitScrollY } from '../lib/scroll';

interface SlideScreenProps {
  /** Direção da navegação (push=1, pop=-1, troca de tab=0). */
  direction: number;
  children: React.ReactNode;
}

/**
 * Uma tela da pilha de slide (tabs + auxiliares de 1º nível).
 *
 * Enquanto presente, é um bloco comum do fluxo e mede a própria posição no
 * documento (layout effect). Quando sai (push/pop/tab), vira `fixed` na
 * **posição exata em que estava** (top medido − scroll capturado no handler)
 * com o mesmo molde de coluna do `main`, e o conteúdo translada pelo scroll
 * capturado — assim a tela antiga **congela pixel-a-pixel onde a usuária a
 * via** (o reset de scroll não a arrasta para o topo) e esvanece por baixo
 * da tela nova, sem pulo nem salto vertical.
 */
export const SlideScreen: React.FC<SlideScreenProps> = ({ direction, children }) => {
  const [isPresent, safeToRemove] = usePresence();
  const ref = useRef<HTMLDivElement>(null);
  const docTopRef = useRef(0);

  // Enquanto presente, registra o topo do elemento em coordenadas de documento
  // (rect.top já desconta o scroll atual — somamos de volta).
  useLayoutEffect(() => {
    if (!isPresent || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    docTopRef.current = rect.top + window.scrollY;
  });

  // Topo do wrapper congelado em coordenadas de viewport — normalmente
  // NEGATIVO (páginas roladas), para o conteúdo aparecer exatamente nos
  // pixels em que a usuária o via. overflow-hidden corta o resto.
  const frozenTop = docTopRef.current - getFrozenExitScrollY();

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onAnimationComplete={() => {
        // `usePresence` exige que o componente sinalize quando a animação de
        // saída terminou; sem isso cada tela antiga permanece no DOM invisível.
        if (!isPresent) safeToRemove();
      }}
      className={
        isPresent
          ? 'relative'
          : 'fixed inset-x-0 bottom-0 z-0 overflow-hidden pointer-events-none lg:pl-60'
      }
      style={isPresent ? undefined : { top: frozenTop }}
    >
      <div
        aria-hidden={!isPresent}
        className={
          isPresent
            ? undefined
            : 'w-full max-w-md sm:max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto px-3.5 sm:px-5 lg:px-8'
        }
        style={
          isPresent ? undefined : { transform: `translateY(-${getFrozenExitScrollY()}px)` }
        }
      >
        {children}
      </div>
    </motion.div>
  );
};
