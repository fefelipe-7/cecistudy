import React from 'react';
import { cn } from '../../../lib/utils';

interface TagPillProps {
  children: React.ReactNode;
  className?: string;
}

/** Pill de categoria/tag: cinza claro do plano → surface-muted + texto secundário. */
export const TagPill: React.FC<TagPillProps> = ({ children, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-ceci-secondary whitespace-nowrap',
      className
    )}
  >
    {children}
  </span>
);
