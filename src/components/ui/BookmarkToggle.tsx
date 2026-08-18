import React from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkToggleProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  /** Frase do estado ativo (aria-label). */
  activeLabel?: string;
  /** Sobrescreve o aria-label por completo (estados ativo/inativo). */
  ariaLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** Botão de favorito/guardar (bookmark) — padrão único de HeaderNav, detalhes de livro e artigo. */
export const BookmarkToggle: React.FC<BookmarkToggleProps> = ({
  active,
  onToggle,
  label,
  activeLabel,
  ariaLabel,
  className,
  size = 'md',
}) => {
  const dims = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 rounded-2xl';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={ariaLabel ?? (active && activeLabel ? activeLabel : label)}
      title={active && activeLabel ? activeLabel : label}
      className={cn(
        'border flex items-center justify-center shrink-0 tap-interactive cursor-pointer transition-all active:scale-95',
        dims,
        active
          ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
          : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted',
        className
      )}
    >
      <Bookmark className={cn('w-4 h-4', active && 'fill-current')} />
    </button>
  );
};