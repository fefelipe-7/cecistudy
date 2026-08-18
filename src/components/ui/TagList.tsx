import React from 'react';
import { cn } from '@/lib/utils';
import { TagChip, type TagChipVariant } from './TagChip';

interface TagListProps {
  tags: string[];
  onRemove?: (tag: string) => void;
  variant?: TagChipVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

/** Renderiza um array de tags como chips (padrão único de exibição de tags do app). */
export const TagList: React.FC<TagListProps> = ({
  tags,
  onRemove,
  variant = 'rose',
  size = 'md',
  icon,
  emptyMessage,
  className,
}) => {
  if (tags.length === 0 && emptyMessage) {
    return <span className="text-[11px] text-ceci-tertiary">{emptyMessage}</span>;
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((t) => (
        <TagChip
          key={t}
          variant={variant}
          size={size}
          icon={icon}
          onRemove={onRemove ? () => onRemove(t) : undefined}
          removeLabel={`remover ${t}`}
        >
          {t}
        </TagChip>
      ))}
    </div>
  );
};