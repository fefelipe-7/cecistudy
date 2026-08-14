import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverable,
  padded = true,
  ...props
}) => (
  <div
    className={cn(
      'bg-white border border-ceci-border-default shadow-sm',
      padded && 'p-6',
      hoverable && 'hover:shadow-md transition-shadow',
      className
    )}
    {...props}
  />
);
