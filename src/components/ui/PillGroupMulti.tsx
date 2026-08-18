import React from 'react';
import { cn, NoInfer } from '@/lib/utils';
import type { PillOption } from './PillGroup';

interface PillGroupMultiProps<T extends string> {
  label?: string;
  options: PillOption<NoInfer<T>>[];
  /** Valores selecionados (escolha múltipla). */
  value: T[];
  onChange: (value: T[]) => void;
  /** Estilo do estado selecionado. */
  variant?: 'primary' | 'academic' | 'brand' | 'rose';
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<PillGroupMultiProps<string>['variant']>, string> = {
  primary: 'bg-ceci-primary text-white border-ceci-primary',
  academic: 'bg-ceci-academic text-white border-ceci-academic',
  brand: 'bg-ceci-brand-strong text-white border-ceci-brand-strong',
  rose: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand shadow-2xs',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
} as const;

/** Grupo de pills de escolha múltipla — padrão do cecistudy. */
export const PillGroupMulti = <T extends string>({
  label,
  options,
  value,
  onChange,
  variant = 'brand',
  size = 'md',
  className,
}: PillGroupMultiProps<T>) => {
  const toggle = (v: T) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {options.map((o) => {
          const sel = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              aria-pressed={sel}
              className={cn(
                'rounded-full font-semibold capitalize whitespace-nowrap tap-interactive cursor-pointer transition-all',
                SIZES[size],
                sel
                  ? VARIANT_CLASSES[variant]
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