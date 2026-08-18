import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn, NoInfer } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Sobrescreve o estilo do estado ativo (ex.: tema papel/sépia/noturno do leitor). */
  activeClassName?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<NoInfer<T>>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'primary' | 'rose';
  className?: string;
  ariaLabel?: string;
}

const VARIANT_CLASSES: Record<NonNullable<SegmentedControlProps<string>['variant']>, string> = {
  primary: 'bg-ceci-primary text-white shadow-2xs',
  rose: 'bg-surface-rose text-ceci-brand-strong shadow-2xs',
};

/**
 * Controle segmentado (trilho + pill animado) para escolha única,
 * no padrão de "segmented control" iOS do cecistudy.
 */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  variant = 'primary',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) => {
  const layoutId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-1 p-1 rounded-full bg-surface-muted border border-ceci-border-default', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap tap-interactive cursor-pointer transition-colors',
              active ? o.activeClassName ?? VARIANT_CLASSES[variant] : 'text-ceci-secondary hover:text-ceci-primary'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className={cn(
                  'absolute inset-0 rounded-full',
                  active ? o.activeClassName ?? VARIANT_CLASSES[variant] : ''
                )}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
};