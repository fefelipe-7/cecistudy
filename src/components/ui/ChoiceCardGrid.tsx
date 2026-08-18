import React from 'react';
import { cn, NoInfer } from '@/lib/utils';

export interface ChoiceCardOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
  caption?: string;
}

interface ChoiceCardGridProps<T extends string> {
  label?: string;
  options: ChoiceCardOption<NoInfer<T>>[];
  /** Valor selecionado (escolha única). */
  value: T;
  onChange: (value: T) => void;
  columns?: 1 | 2;
  className?: string;
}

/**
 * Cards de escolha única (ícone + rótulo + legenda opcional) em grid de 1 ou 2 colunas.
 * Selecionado = borda da marca + fundo rosado (padrão dos wizards).
 */
export const ChoiceCardGrid = <T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 2,
  className,
}: ChoiceCardGridProps<T>) => {
  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={cn('grid gap-2.5', columns === 1 ? 'grid-cols-1' : 'grid-cols-2', className)}>
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={sel}
              className={cn(
                'border-2 rounded-[16px] text-left transition-all active:scale-[0.98] cursor-pointer',
                columns === 1 ? 'w-full px-4 py-3.5' : 'px-3.5 py-3.5',
                sel
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong shadow-2xs'
                  : 'bg-white border-ceci-border-subtle text-ceci-primary hover:bg-surface-muted'
              )}
            >
              {o.caption ? (
                <span className="flex flex-col gap-0.5 min-h-[52px] justify-center">
                  <span className="flex items-center gap-2">
                    {o.emoji && <span className="text-lg leading-none shrink-0">{o.emoji}</span>}
                    <span className="text-xs font-semibold leading-snug">{o.label}</span>
                  </span>
                  {o.caption && (
                    <span className="text-[11px] text-ceci-tertiary leading-snug font-normal">{o.caption}</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-2.5 min-h-[52px]">
                  {o.emoji && <span className="text-lg leading-none shrink-0">{o.emoji}</span>}
                  <span className="text-xs font-semibold leading-snug">{o.label}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};