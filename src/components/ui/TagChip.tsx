import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TagChipVariant = 'rose' | 'blue' | 'amber' | 'neutral';

const VARIANT_CLASSES: Record<TagChipVariant, string> = {
  rose: 'bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong',
  blue: 'bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong',
  amber: 'bg-amber-bg border border-amber-border text-amber-text',
  neutral: 'bg-surface-muted border border-ceci-border-default text-ceci-secondary',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-[11px]',
} as const;

interface TagChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: TagChipVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  removeLabel?: string;
}

/** Chip de tag padrão do app (exibição ou com ✕ para remover). */
export const TagChip: React.FC<TagChipProps> = ({
  children,
  onRemove,
  variant = 'rose',
  size = 'md',
  icon,
  className,
  removeLabel,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full font-semibold',
      SIZES[size],
      VARIANT_CLASSES[variant],
      className
    )}
  >
    {icon}
    <span className="min-w-0 truncate">{children}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel ?? 'remover'}
        className="cursor-pointer hover:opacity-60 shrink-0 flex items-center"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);