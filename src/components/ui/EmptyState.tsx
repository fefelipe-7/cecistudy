import React from 'react';
import { Mascote, type MascoteExpression } from './Mascote';

export interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  mascote?: MascoteExpression;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  mascote = 'listening-hello',
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl p-6 text-center space-y-4">
      <Mascote expression={mascote} className="w-16 h-16 mx-auto" decorative />
      {title && <h3 className="font-display font-bold text-base text-ceci-primary">{title}</h3>}
      <p className="text-[13px] text-ceci-secondary leading-relaxed">{description}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          onClick={onAction}
          className="min-h-[44px] px-5 rounded-full text-[13px] font-semibold bg-ceci-primary text-ceci-on-primary cursor-pointer tap-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand"
        >
          {actionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="min-h-[44px] px-5 rounded-full text-[13px] font-semibold bg-surface-default border border-ceci-border-default text-ceci-secondary cursor-pointer tap-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
