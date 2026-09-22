import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { iOS_SPRING } from '@/lib/motion';

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
        className={cn('h-full w-full rounded-full bg-ceci-brand', barClassName)}
        style={{ originX: 0 }}
        initial={false}
        animate={{ scaleX: clamped / 100 }}
        transition={iOS_SPRING}
      />
    </div>
  );
};
