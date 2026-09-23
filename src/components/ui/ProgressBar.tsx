import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className,
  barClassName,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn('h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn('h-full rounded-full bg-ceci-brand', barClassName)}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      />
    </div>
  );
};
