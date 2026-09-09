import React from 'react';
import { cn } from '../../../lib/utils';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Interior com borda tracejada (placeholders/empty states). */
  dashed?: boolean;
}

/**
 * Card padrão da shell desktop ("premium SaaS, mesma alma"):
 * fundo branco, border fina — a delimitação vem da borda, não da sombra
 * (sombra fica apenas em elementos flutuantes).
 */
export const Panel: React.FC<PanelProps> = ({ className, dashed, children, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'bg-surface-default rounded-2xl border p-4',
      dashed ? 'border-dashed border-ceci-border-default' : 'border-ceci-border-subtle',
      className
    )}
  >
    {children}
  </div>
);
