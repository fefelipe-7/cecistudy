import React from 'react';
import { cn } from '../../../lib/utils';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Interior com borda tracejada (placeholders/empty states). */
  dashed?: boolean;
}

/**
 * Card padrão da shell desktop ("premium SaaS, mesma alma"):
 * fundo branco, border fina e sombra quase imperceptível —
 * a delimitação vem da borda, não da sombra.
 */
export const Panel: React.FC<PanelProps> = ({ className, dashed, children, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'bg-white rounded-2xl border shadow-xs p-4',
      dashed ? 'border-dashed border-ceci-border-default' : 'border-ceci-border-subtle',
      className
    )}
  >
    {children}
  </div>
);
