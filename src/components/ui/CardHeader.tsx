import React from 'react';
import { cn } from '../../lib/utils';

interface CardHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, actions, className }) => {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="font-display font-bold text-lg text-ceci-primary leading-snug truncate">{title}</h3>
        {subtitle && <p className="text-[13px] text-ceci-secondary mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};
