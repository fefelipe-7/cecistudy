import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CompletionToggleProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Botão circular de conclusão (tarefa/prova feita), visual consistente do app. */
export const CompletionToggle: React.FC<CompletionToggleProps> = ({
  checked,
  onChange,
  label,
  size = 'md',
  className,
}) => {
  const dims = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      className={cn(
        'shrink-0 rounded-full border-2 flex items-center justify-center tap-interactive cursor-pointer transition-all active:scale-90',
        dims,
        checked
          ? 'bg-green-500 border-green-500 text-white shadow-sm'
          : 'bg-white border-ceci-border-strong text-transparent hover:border-green-400',
        className
      )}
    >
      <Check className={cn(icon, 'stroke-[3]')} />
    </button>
  );
};