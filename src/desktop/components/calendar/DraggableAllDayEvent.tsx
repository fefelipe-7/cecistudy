import React, { useRef, useState } from 'react';
import type { CalendarEntry } from '../../../lib/schedule';
import { EventBlock } from './EventBlock';

/** Reagendamento de um evento "dia inteiro" (só a data muda). */
export interface RescheduleDayPayload {
  entry: CalendarEntry;
  newDate: string; // YYYY-MM-DD
}

interface DraggableAllDayEventProps {
  entry: CalendarEntry;
  dayDate: Date;
  resizable: boolean;
  selected?: boolean;
  onSelect: (entry: CalendarEntry) => void;
  onReschedule: (payload: RescheduleDayPayload) => void;
}

function keyOf(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Evento "dia inteiro" arrastável horizontalmente entre os dias da semana
 * (tarefas com prazo, capítulos de TCC). Reagenda apenas a data.
 */
export const DraggableAllDayEvent: React.FC<DraggableAllDayEventProps> = ({
  entry,
  dayDate,
  resizable,
  selected,
  onSelect,
  onReschedule,
}) => {
  const [ghostDay, setGhostDay] = useState<number | null>(null);
  const drag = useRef<{ startX: number; dayWidth: number; origDate: Date; moved: boolean; lastX: number } | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    if (!resizable) return;
    e.preventDefault();
    const cell = (e.currentTarget as HTMLElement).closest('[data-alldaycol]') as HTMLElement | null;
    const dayWidth = cell?.getBoundingClientRect().width ?? 1;
    const st = { startX: e.clientX, dayWidth, origDate: dayDate, moved: false, lastX: e.clientX };
    drag.current = st;

    const move = (ev: PointerEvent) => {
      st.lastX = ev.clientX;
      const dx = ev.clientX - st.startX;
      if (Math.abs(dx) > 3) st.moved = true;
      setGhostDay(Math.round(dx / st.dayWidth));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (st.moved) {
        const finalDays = Math.round((st.lastX - st.startX) / st.dayWidth);
        onReschedule({ entry, newDate: keyOf(addDays(st.origDate, finalDays)) });
      }
      drag.current = null;
      setGhostDay(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const style: React.CSSProperties = {};
  if (ghostDay != null && ghostDay !== 0) {
    style.transform = `translateX(${ghostDay * 100}%)`;
    style.opacity = 0.85;
    style.zIndex = 5;
  }

  return (
    <div onPointerDown={resizable ? startDrag : undefined} onDoubleClick={(e) => e.stopPropagation()}>
      <EventBlock entry={entry} selected={selected} onSelect={onSelect} className="w-full" />
    </div>
  );
};
