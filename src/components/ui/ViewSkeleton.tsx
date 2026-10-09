import React from 'react';
import { cn } from '../../lib/utils';

interface ViewSkeletonProps {
  rows?: number;
  className?: string;
}

export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({
  rows = 5,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)} aria-busy="true" aria-label="carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-surface-muted animate-pulse" />
      ))}
    </div>
  );
};
