import { type ReactNode, type KeyboardEvent } from 'react';
import { motion, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/motion';
import { useLongPress } from '../../lib/useLongPress';

/** Spring do flip 3D (spec: stiffness 260, damping 26). */
export const FLIP_SPRING: Transition = { type: 'spring', stiffness: 260, damping: 26 };

export interface Card3DProps {
  /** Conteúdo da face da frente (pergunta). */
  front: ReactNode;
  /** Conteúdo da face do verso (resposta). */
  back: ReactNode;
  /** Estado controlado do flip (o pai decide quando revelar). */
  flipped?: boolean;
  /** Disparado no tap/enter — pai atualiza o estado (controle). */
  onFlipChange?: (flipped: boolean) => void;
  /** Toque longo no palco (menu de gestão do cartão na revisão). */
  onLongPress?: () => void;
  /** Acessibilidade: rótulo do palco (ex.: "cartão de estudo"). */
  ariaLabel?: string;
  className?: string;
  /** Classes extras da face da frente (conteúdo + padding da view). */
  frontClassName?: string;
  /** Classes extras da face do verso. */
  backClassName?: string;
  /** Sobrescreve o `prefers-reduced-motion` do sistema (usado nos testes). */
  reduceMotion?: boolean;
}

/**
 * Card reversível 3D (CSS-3D puro, sem three.js).
 *
 * - `perspective` no palco (900px), `preserve-3d` no rotator, faces com
 *   `backface-visibility:hidden` + `translateZ` que evita z-fighting.
 * - Regra crítica: o rotator (`preserve-3d`) NÃO recebe overflow/opacity/filter/
 *   will-change (achata o 3D no Safari); as faces clippam (overflow-hidden).
 * - `prefers-reduced-motion`: o flip vira crossfade de opacity (sem rotação).
 */
export const Card3D: React.FC<Card3DProps> = ({
  front,
  back,
  flipped = false,
  onFlipChange,
  onLongPress,
  ariaLabel,
  className,
  frontClassName,
  backClassName,
  reduceMotion,
}) => {
  const reduce = reduceMotion ?? usePrefersReducedMotion();
  const interactive = !!onFlipChange || !!onLongPress;

  const toggle = () => {
    if (interactive) onFlipChange?.(!flipped);
  };

  const longPressHandlers = useLongPress({
    onLongPress: onLongPress ?? undefined,
    onClick: toggle,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const outerHandlers = onLongPress ? longPressHandlers : { onClick: toggle };

  const backFaceTransform = reduce
    ? ''
    : '[backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(1px)]';

  return (
    <div
      className={cn('relative aspect-[3/4] select-none', reduce ? '' : '[perspective:900px]', className)}
    >
      <motion.div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={ariaLabel}
        aria-pressed={interactive ? flipped : undefined}
        data-testid="card3d"
        data-flipped={flipped ? 'true' : 'false'}
        data-reduced={reduce ? 'true' : undefined}
        {...outerHandlers}
        onKeyDown={handleKeyDown}
        className={cn('relative h-full w-full rounded-2xl', reduce ? '' : '[transform-style:preserve-3d]')}
        animate={reduce ? { opacity: 1 } : { rotateY: flipped ? 180 : 0 }}
        transition={reduce ? { duration: 0.12 } : FLIP_SPRING}
      >
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-2xl bg-surface-default border border-ceci-border-default [transform:translateZ(1px)] transition-opacity duration-150',
            reduce && (flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'),
            frontClassName
          )}
        >
          {front}
        </div>
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-2xl bg-surface-default border border-ceci-border-default transition-opacity duration-150',
            backFaceTransform,
            reduce && (flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'),
            backClassName
          )}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};

export default Card3D;