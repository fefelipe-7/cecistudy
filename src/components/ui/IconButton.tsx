import React from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  active,
  className,
  ...props
}) => (
  <button
    aria-label={label}
    title={label}
    className={cn(
      'w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95',
      active
        ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
        : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted',
      className
    )}
    {...props}
  />
);
