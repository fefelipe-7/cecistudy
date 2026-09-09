import React, { useRef, useState } from 'react';
import {
  layoutTimedEntry,
  timeToMinutes,
  minutesToTime,
  snapTo30Minutes,
  CAL_HOUR_HEIGHT,
  type TimedLayoutEntry,
} from '../../../lib/schedule';
import { EventBlock } from './EventBlock';

/** Payload devolvido ao soltar um evento temporizado. */
export interface ReschedulePayload {
  entry: TimedLayoutEntry;
  newDate: string; // YYYY-MM-DD
  newStart: string; // HH:MM
  newEnd: string; // HH:MM
}

interface DraggableTimedEventProps {
  entry: TimedLayoutEntry;
  dayDate: Date;
  /** false para aulas (recorrentes não são reagendáveis). */
  resizable: boolean;
  selected?: boolean;
  onSelect: (entry: TimedLayoutEntry) => void;
  onReschedule: (payload: ReschedulePayload) => void;
}

const SNAP = 30;

function keyOf(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

interface DragState {
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  dayWidth: number;
  origStartMin: number;
  origEndMin: number;
  origDate: Date;
  moved: boolean;
  preview?: { date: Date; start: string; end: string };
}

/**
 * Evento temporizado arrastável/redimensionável (estilo Google Calendar).
 * Aulas (`entryRef === 'class'`) são selecionáveis mas não reagendáveis.
 */
export const DraggableTimedEvent: React.FC<DraggableTimedEventProps> = ({
  entry,
  dayDate,
  resizable,
  selected,
  onSelect,
  onReschedule,
}) => {
  const base = layoutTimedEntry(entry.start, entry.end);
  const leftPct = (entry.column / entry.columns) * 100;
  const widthPct = (1 / entry.columns) * 100;
  const [preview, setPreview] = useState<{ top: number; height: number; start: string; end: string } | null>(null);
  const drag = useRef<DragState | null>(null);

  const startDrag = (mode: 'move' | 'resize') => (e: React.PointerEvent) => {
    if (!resizable) return;
    e.preventDefault();
    const dayCol = (e.currentTarget as HTMLElement).closest('[data-daycol]') as HTMLElement | null;
    const dayWidth = dayCol?.getBoundingClientRect().width ?? 1;
    const st: DragState = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      dayWidth,
      origStartMin: timeToMinutes(entry.start),
      origEndMin: timeToMinutes(entry.end),
      origDate: dayDate,
      moved: false,
    };
    drag.current = st;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - st.startX;
      const dy = ev.clientY - st.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) st.moved = true;
      const deltaDays = Math.round(dx / st.dayWidth);
      const deltaMin = (Math.round((dy / CAL_HOUR_HEIGHT) * 60 / SNAP)) * SNAP;
      if (st.mode === 'move') {
        const ns = st.origStartMin + deltaMin;
        const ne = ns + (st.origEndMin - st.origStartMin);
        st.preview = { date: addDays(st.origDate, deltaDays), start: minutesToTime(ns), end: minutesToTime(ne) };
      } else {
        const ne = Math.max(st.origStartMin + SNAP, st.origEndMin + deltaMin);
        st.preview = { date: st.origDate, start: entry.start, end: minutesToTime(ne) };
      }
      setPreview({
        ...layoutTimedEntry(st.preview.start, st.preview.end),
        start: st.preview.start,
        end: st.preview.end,
      });
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (st.moved && st.preview) {
        onReschedule({
          entry,
          newDate: keyOf(st.preview.date),
          newStart: snapTo30Minutes(st.preview.start),
          newEnd: snapTo30Minutes(st.preview.end),
        });
      }
      drag.current = null;
      setPreview(null);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const shownTop = preview ? preview.top : base.top;
  const shownHeight = preview ? preview.height : base.height;
  const shownStart = preview ? preview.start : entry.start;
  const shownEnd = preview ? preview.end : entry.end;

  return (
    <div
      className="absolute z-[2]"
      style={{
        top: shownTop,
        height: shownHeight,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        opacity: preview ? 0.9 : 1,
        cursor: resizable ? 'grab' : 'pointer',
      }}
      onPointerDown={resizable ? startDrag('move') : undefined}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <EventBlock
        entry={{ ...entry, start: shownStart, end: shownEnd }}
        timed
        selected={selected}
        onSelect={() => onSelect(entry)}
        className="h-full w-full"
      />
      {resizable && (
        <div
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize rounded-b-[8px]"
          onPointerDown={(e) => {
            e.stopPropagation();
            startDrag('resize')(e);
          }}
        />
      )}
    </div>
  );
};
