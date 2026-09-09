import React from 'react';
import type { CalendarEntry } from '../../../lib/schedule';
import { EventBlock } from './EventBlock';
import { DraggableAllDayEvent, type RescheduleDayPayload } from './DraggableAllDayEvent';

interface AllDayRowProps {
  days: Date[];
  entriesByDay: Record<number, CalendarEntry[]>;
  selectedId?: string;
  onSelect: (entry: CalendarEntry) => void;
  onReschedule?: (payload: RescheduleDayPayload) => void;
  /** Duplo-clique em célula vazia → cria evento naquele dia. */
  onSlotCreate?: (date: string) => void;
}

/** Faixa de eventos sem horário (tarefas com prazo, itens do google calendar). */
export const AllDayRow: React.FC<AllDayRowProps> = ({
  days,
  entriesByDay,
  selectedId,
  onSelect,
  onReschedule,
  onSlotCreate,
}) => {
  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  return (
    <div className="flex border-b border-ceci-border-default bg-[var(--ds-surface-raised)]">
      <div className="flex w-14 shrink-0 items-center justify-end pr-2">
        <span className="text-xs text-ceci-muted">dia</span>
      </div>
      {days.map((day, i) => {
        const items = entriesByDay[i] ?? [];
        return (
          <div
            key={i}
            data-alldaycol
            className="flex min-h-[32px] flex-1 flex-col gap-0.5 border-l border-ceci-border-default px-1 py-1"
            onDoubleClick={() => onSlotCreate?.(keyOf(day))}
          >
            {items.map((entry) => (
              <DraggableAllDayEvent
                key={entry.id}
                entry={entry}
                dayDate={day}
                resizable={entry.entryRef === 'task' || entry.entryRef === 'tccChapter'}
                selected={entry.id === selectedId}
                onSelect={onSelect}
                onReschedule={(payload) => onReschedule?.(payload)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};
