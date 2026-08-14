import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Rótulos por nota (tom acolhedor do cantinho). */
export const RATING_LABELS: Record<number, string> = {
  1: 'precisa melhorar',
  2: 'poderia ser melhor',
  3: 'aula ok',
  4: 'boa aula',
  5: 'aula incrível ♡',
};

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
}

/**
 * Avaliação de 1 a 5 estrelas.
 * Interativo quando `onChange` é fornecido; senão vira exibição (estrelas estáticas).
 */
export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 'md',
  className,
  showLabel = false,
  labelClassName,
}) => {
  const isInteractive = !!onChange;
  const starClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Star
            className={cn(
              starClass,
              n <= value
                ? 'text-yellow-500 fill-yellow-400'
                : 'text-ceci-border-strong'
            )}
          />
        );
        return isInteractive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
            aria-pressed={value === n}
            className="cursor-pointer active:scale-90 transition-transform p-0.5"
          >
            {star}
          </button>
        ) : (
          <span key={n} className="inline-flex" aria-hidden={n > value}>
            {star}
          </span>
        );
      })}
      {showLabel && value > 0 && (
        <span className={cn('text-[11px] font-medium text-ceci-secondary ml-1', labelClassName)}>
          {RATING_LABELS[value]}
        </span>
      )}
    </div>
  );
};
