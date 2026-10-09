import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, usePresence } from 'framer-motion';
import { createScreenVariants, type NavIntent } from '../lib/motion';
import { useMotionProfile } from '../components/motion/MotionProfileProvider';
import { getFrozenExitScrollY } from '../lib/scroll';

/** Largura de referência quando não há viewport (SSR/jsdom): o `main` é `max-w-md`. */
const FALLBACK_WIDTH = 390;

interface SlideScreenProps {
  /** Intenção de navegação completa (SPEC-007). Só o `dir` é necessário para
   *  `initial`/`animate`; o `exit` lê o canal de módulo (props congeladas). */
  intent: NavIntent;
  children: React.ReactNode;
}

/**
 * Uma tela da pilha de slide (tabs + auxiliares de 1º nível).
 *
 * **Movimento (SPEC-007).** Toda a física vem de `createScreenVariants`, que
 * decide os alvos a partir de um único `NavIntent`:
 * - `push` entra da direita cheia, a de baixo faz parallax curto e um dim leve;
 * - `pop` sai para a direita cheia, **partindo do ponto onde o dedo soltou** quando
 *   veio do gesto de borda (é o que dá continuidade, sem salto);
 * - `tab`/`replace` são crossfade curto, sem empurrão de tela cheia — inclusive ao
 *   trocar de uma disciplina para outra, que antes caía no mesmo "fade de tab";
 * - `prefers-reduced-motion` vira **fade puro, sem deslocamento** (perfil diferente,
 *   não duração menor).
 *
 * O que este componente **não** faz (e é proposital): a tela-base não é uma camada
 * separada, então a posição de repouso por profundidade (`behind(depth)`) está
 * inerte — `depth` é sempre 0. Separar a base em camada própria é o Slice C.2.
 *
 * **Congelamento de saída.** Quando sai (push/pop/tab), vira `fixed` na **posição
 * exata em que estava** (topo medido − scroll capturado no handler) com o mesmo
 * molde de coluna do `main`, e o conteúdo translada pelo scroll capturado — assim a
 * tela antiga **congela pixel-a-pixel** onde a usuária a via (o reset de scroll não a
 * arrasta para o topo) e esvanece por baixo da nova, sem pulo nem salto vertical.
 */
export const SlideScreen: React.FC<SlideScreenProps> = ({ intent, children }) => {
  const [isPresent, safeToRemove] = usePresence();
  const ref = useRef<HTMLDivElement>(null);
  const docTopRef = useRef(0);
  const profile = useMotionProfile();

  // A largura é fato de layout: medida uma vez no mount e no resize, nunca lida
  // durante o `pointermove` do gesto (o pointermove É o frame de animação).
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useLayoutEffect(() => {
    const read = () => setWidth(window.innerWidth || FALLBACK_WIDTH);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const variants = useMemo(
    () => createScreenVariants(width, profile),
    [width, profile],
  );

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
      custom={intent}
      variants={variants}
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
        inert={!isPresent}
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
