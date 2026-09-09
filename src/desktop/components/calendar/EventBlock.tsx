import React from 'react';
import type { CalendarEntry } from '../../../lib/schedule';
import { LAYER_META, SUBTYPE_ICON } from './layers';

interface EventBlockProps {
  entry: CalendarEntry;
  selected?: boolean;
  onSelect?: (entry: CalendarEntry) => void;
  /** Quando true, o bloco é posicionado absolutamente pelo pai (grade de horas). */
  timed?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Chip de evento do calendário desktop. Cores vêm da camada (tokens do design
 * system). Acessível por teclado quando clicável.
 */
export const EventBlock: React.FC<EventBlockProps> = ({
  entry,
  selected,
  onSelect,
  timed,
  style,
  className: extraClass,
}) => {
  const meta = LAYER_META[entry.layer];
  const Icon = SUBTYPE_ICON[entry.subtype];
  const clickable = Boolean(onSelect);

  const className = [
    'group flex items-start gap-1 rounded-[8px] border-l-2 px-2 py-1 text-left transition-shadow',
    clickable ? 'cursor-pointer hover:shadow-sm' : '',
    selected ? 'ring-2 ring-ceci-primary/30' : '',
    entry.completed ? 'opacity-60' : '',
    extraClass ?? '',
  ].join(' ');

  const content = (
    <>
      <Icon className="mt-0.5 h-2.5 w-2.5 shrink-0" style={{ color: meta.fg }} />
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold leading-tight truncate ${
            entry.completed ? 'line-through' : ''
          }`}
          style={{ color: meta.fg }}
        >
          {entry.title}
        </p>
        <p className="truncate text-xs opacity-70" style={{ color: meta.fg }}>
          {entry.subtitle}
        </p>
      </div>
    </>
  );

  const innerStyle: React.CSSProperties = {
    background: meta.bg,
    borderColor: meta.border,
    ...style,
  };

  if (!clickable) {
    return (
      <div className={className} style={innerStyle} aria-disabled>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(entry)}
      aria-label={`ver evento: ${entry.title}`}
      aria-pressed={selected}
      className={className}
      style={innerStyle}
    >
      {content}
    </button>
  );
};
