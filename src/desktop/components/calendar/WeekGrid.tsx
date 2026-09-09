import React from 'react';
import {
  CAL_GRID_START_HOUR,
  CAL_GRID_END_HOUR,
  CAL_HOUR_HEIGHT,
  layoutTimedEntry,
  computeOverlappingEventLayout,
  type TimedEntry,
} from '../../../lib/schedule';
import { EventBlock } from './EventBlock';
import { DraggableTimedEvent, type ReschedulePayload } from './DraggableTimedEvent';

interface WeekGridProps {
  days: Date[];
  timedByDay: Record<number, TimedEntry[]>;
  selectedId?: string;
  onSelect: (entry: TimedEntry) => void;
  /** Índice em `days` que é hoje (ou -1). */
  currentIdx?: number;
  onReschedule?: (payload: ReschedulePayload) => void;
  /** Duplo-clique em área vazia da grade → cria evento naquele horário. */
  onSlotCreate?: (date: string, time: string) => void;
}

const HOURS = Array.from(
  { length: CAL_GRID_END_HOUR - CAL_GRID_START_HOUR + 1 },
  (_, i) => CAL_GRID_START_HOUR + i,
);

/**
 * Grade de horas do calendário (7h–20h). Eventos temporizados são posicionados
 * absolutamente; uma linha marca o horário atual quando o dia está na vista.
 */
export const WeekGrid: React.FC<WeekGridProps> = ({
  days,
  timedByDay,
  selectedId,
  onSelect,
  currentIdx = -1,
  onReschedule,
  onSlotCreate,
}) => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop =
    (nowMin - CAL_GRID_START_HOUR * 60) / 60 * CAL_HOUR_HEIGHT;

  return (
    <div
      className="flex flex-1 overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 16rem)' }}
    >
      {/* eixo de horas */}
      <div className="w-14 shrink-0" aria-hidden>
        {HOURS.map((h) => (
          <div
            key={h}
            className="flex items-start justify-end pr-2"
            style={{ height: CAL_HOUR_HEIGHT }}
          >
            <span className="-mt-1.5 text-xs text-ceci-muted">{h}:00</span>
          </div>
        ))}
      </div>

      {/* colunas dos dias */}
      <div className="flex flex-1">
        {days.map((day, i) => {
          const isToday = i === currentIdx;
          return (
            <div
              key={i}
              data-daycol
              className="relative flex-1 border-l border-ceci-border-default"
              onDoubleClick={(e) => {
                if (!onSlotCreate) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const mins = CAL_GRID_START_HOUR * 60 + (y / CAL_HOUR_HEIGHT) * 60;
                const snapped = Math.round(mins / 30) * 30;
                const h = Math.floor(snapped / 60);
                const m = snapped % 60;
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const d = new Date(days[i]);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                onSlotCreate(key, time);
              }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-t border-ceci-border-default"
                  style={{ height: CAL_HOUR_HEIGHT }}
                />
              ))}

              {isToday && nowTop >= 0 && (
                <div
                  className="absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: nowTop }}
                >
                  <span className="ml-1 h-2 w-2 shrink-0 rounded-full bg-[var(--ds-status-danger)]" />
                  <span className="h-px flex-1 bg-[var(--ds-status-danger)]" />
                </div>
              )}

              {computeOverlappingEventLayout(timedByDay[i] ?? []).map((ev) => (
                <DraggableTimedEvent
                  key={ev.id}
                  entry={ev}
                  dayDate={days[i]}
                  resizable={ev.entryRef !== 'class'}
                  selected={ev.id === selectedId}
                  onSelect={onSelect}
                  onReschedule={(payload) => onReschedule?.(payload)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
