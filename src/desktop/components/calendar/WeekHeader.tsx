import React from 'react';
import { WEEKDAY_LABELS } from '../../../data/constants';

interface WeekHeaderProps {
  days: Date[];
  selectedIdx?: number;
  currentIdx?: number;
  onSelectDay?: (idx: number) => void;
}

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/**
 * Cabeçalho da grade semanal: dia da semana + número. O dia atual usa
 * --ds-accent-subtle (nunca rosa sólido de fundo — regra da casca desktop).
 */
export const WeekHeader: React.FC<WeekHeaderProps> = ({
  days,
  selectedIdx,
  currentIdx,
  onSelectDay,
}) => {
  return (
    <div className="flex border-b border-ceci-border-default bg-[var(--ds-surface-raised)]">
      <div className="w-14 shrink-0" aria-hidden />
      {days.map((day, i) => {
        const isCurrent = i === currentIdx;
        const isSelected = i === selectedIdx;
        const label = WEEKDAY_LABELS[day.getDay()] ?? WEEKDAY_SHORT[day.getDay()];
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelectDay?.(i)}
            aria-label={`${label} ${day.getDate()}`}
            aria-pressed={isSelected}
            className={`flex flex-1 flex-col items-center border-l border-ceci-border-default py-3 transition-colors ${
              isSelected ? 'bg-[var(--ds-accent-subtle)]' : ''
            }`}
          >
            <span className="text-xs uppercase tracking-wide text-ceci-muted">{label}</span>
            <span
              className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold ${
                isCurrent
                  ? 'bg-[var(--ds-accent)] text-white'
                  : 'text-ceci-primary'
              }`}
            >
              {day.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
};
