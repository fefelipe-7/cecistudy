import React from 'react';
import { cn } from '../../../lib/utils';

export type StatusBadgeVariant = 'success' | 'warning' | 'neutral' | 'brand';

const VARIANTS: Record<StatusBadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-600',
  neutral: 'bg-beige-100 text-ceci-secondary',
  brand: 'bg-surface-rose text-ceci-brand-strong',
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

/** Badge de status discreto (pill pequeno, fonte média — nunca chamativo). */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  children,
  className,
  ...rest
}) => (
  <span
    {...rest}
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
      VARIANTS[variant],
      className
    )}
  >
    {children}
  </span>
);
