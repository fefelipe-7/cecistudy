import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  /**
   * Leitura humana do valor (SPEC-010 D6.4): sem ele o leitor de tela anuncia
   * "45" sem unidade. Ex.: "4 de 7 capítulos prontos".
   */
  valueText?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className,
  barClassName,
  valueText,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn('h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
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
