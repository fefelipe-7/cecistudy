import React from 'react';
import { cn, NoInfer } from '@/lib/utils';

export interface PillOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

interface PillGroupProps<T extends string> {
  label?: string;
  options: PillOption<NoInfer<T>>[];
  /** Valor selecionado (escolha única). */
  value: T;
  onChange: (value: T) => void;
  /** Estilo do estado selecionado. */
  variant?: 'primary' | 'academic' | 'brand' | 'rose';
  size?: 'sm' | 'md';
  className?: string;
  /** Opções sem contorno (combinar com variants tipo brand, ex.: badges de filtro). */
  outline?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<PillGroupProps<string>['variant']>, string> = {
  primary: 'bg-ceci-primary text-white border-ceci-primary',
  academic: 'bg-ceci-academic text-white border-ceci-academic',
  brand: 'bg-ceci-brand-strong text-white border-ceci-brand-strong',
  rose: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand shadow-2xs',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
} as const;

/**
 * Grupo de pills de escolha única — padrão do cecistudy.
 * Absorve os vários "pill groups" manuais do app com `aria-pressed` consistente.
 */
export const PillGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
  variant = 'brand',
  size = 'md',
  className,
  outline = false,
}: PillGroupProps<T>) => {
  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={sel}
              className={cn(
                'rounded-full font-semibold capitalize whitespace-nowrap tap-interactive cursor-pointer transition-all',
                SIZES[size],
                sel
                  ? VARIANT_CLASSES[variant]
                  : outline
                    ? 'text-ceci-secondary hover:text-ceci-primary hover:bg-surface-rose'
                    : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
              )}
            >
              {o.emoji ? `${o.emoji} ` : ''}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};