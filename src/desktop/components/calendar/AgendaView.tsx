import React from 'react';
import type { CalendarEntry, DayCalendarEntries } from '../../../lib/schedule';
import { WEEKDAY_LABELS } from '../../../data/constants';
import { EventBlock } from './EventBlock';

interface AgendaViewProps {
  days: Date[];
  data: Record<number, DayCalendarEntries>;
  selectedId?: string;
  onSelect: (entry: CalendarEntry) => void;
}

const byStart = (a: { start?: string }, b: { start?: string }) =>
  (a.start ?? '').localeCompare(b.start ?? '');

/** Visão agenda: lista cronológica dos eventos da semana. */
export const AgendaView: React.FC<AgendaViewProps> = ({
  days,
  data,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
      <div className="flex flex-col gap-4">
        {days.map((day, i) => {
          const dayData = data[i] ?? { timed: [], allDay: [] };
          const items = [
            ...dayData.allDay,
            ...[...dayData.timed].sort(byStart),
          ];
          return (
            <section key={i}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ceci-muted">
                {WEEKDAY_LABELS[day.getDay()]} {day.getDate()}
              </p>
              {items.length === 0 ? (
                <p className="text-xs text-ceci-secondary">nada anotado neste dia ♡</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {items.map((entry) => (
                    <EventBlock
                      key={entry.id}
                      entry={entry}
                      selected={entry.id === selectedId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
