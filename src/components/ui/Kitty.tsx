import React from 'react';
import { cn } from '../../lib/utils';

import apaixonada from '../../assets/kitty/apaixonada.png';
import curiosa from '../../assets/kitty/curiosa.png';
import decepcionada from '../../assets/kitty/decepcionada.png';
import feliz from '../../assets/kitty/feliz.png';
import nervosa from '../../assets/kitty/nervosa.png';
import pensativa from '../../assets/kitty/pensativa.png';
import rindo from '../../assets/kitty/rindo.png';
import sonolenta from '../../assets/kitty/sonolenta.png';
import surpresa from '../../assets/kitty/surpresa.png';
import triste from '../../assets/kitty/triste.png';
import zangada from '../../assets/kitty/zangada.png';

export const KITTY_EXPRESSIONS = {
  apaixonada,
  curiosa,
  decepcionada,
  feliz,
  nervosa,
  pensativa,
  rindo,
  sonolenta,
  surpresa,
  triste,
  zangada,
} as const;

export type KittyExpression = keyof typeof KITTY_EXPRESSIONS;

interface KittyProps {
  expression: KittyExpression;
  className?: string;
  /** Texto alternativo (acessibilidade). Quando só decoração, use `decorative`. */
  alt?: string;
  decorative?: boolean;
}

/** Bonequinha do cantinho — uma expressão por situação (empty states, modais, saudação). */
export const Kitty: React.FC<KittyProps> = ({
  expression,
  className,
  alt,
  decorative,
}) => (
  <img
    src={KITTY_EXPRESSIONS[expression]}
    alt={decorative ? '' : (alt ?? 'bonequinha do cantinho')}
    aria-hidden={decorative || undefined}
    className={cn('select-none', className)}
    draggable={false}
  />
);