import React, { useMemo } from 'react';
import type { Course, Exam, Task, StudySession, TccData } from '../../../types';
import {
  eventsForMonth,
  classesForMonth,
  daysInMonth,
  type CalendarLayer,
} from '../../../lib/schedule';
import { LAYER_META } from './layers';

interface MonthViewProps {
  year: number;
  month: number; // 1-based
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  sessions: StudySession[];
  tcc?: TccData;
  onSelectDay: (date: Date) => void;
}

const WEEKDAY_HEADERS = ['d', 's', 't', 'q', 'q', 's', 's'];

interface DayItem {
  title: string;
  layer: CalendarLayer;
}

/** Visão mensal: grade 7 colunas com mini-eventos coloridos por camada. */
export const MonthView: React.FC<MonthViewProps> = ({
  year,
  month,
  courses,
  exams,
  tasks,
  sessions,
  tcc,
  onSelectDay,
}) => {
  const { firstWeekday, totalDays, itemsByDay } = useMemo(() => {
    const first = new Date(year, month - 1, 1).getDay();
    const total = daysInMonth(year, month);
    const calEvents = eventsForMonth(exams, tasks, month, year);
    const calClasses = classesForMonth(courses, year, month);
    const byDay = new Map<number, DayItem[]>();

    calEvents.forEach((list, day) => {
      const arr = byDay.get(day) ?? [];
      list.forEach((ev) =>
        arr.push({
          title: ev.kind === 'prova' ? ev.title : `entrega: ${ev.title}`,
          layer: 'faculdade',
        }),
      );
      byDay.set(day, arr);
    });
    calClasses.forEach((list, day) => {
      const arr = byDay.get(day) ?? [];
      list.forEach((c) => arr.push({ title: c.course.name, layer: 'faculdade' }));
      byDay.set(day, arr);
    });
    sessions.forEach((s) => {
      if (s.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) {
        const day = Number(s.date.slice(8, 10));
        const arr = byDay.get(day) ?? [];
        arr.push({ title: `bloco: ${s.topic}`, layer: 'estudos' });
        byDay.set(day, arr);
      }
    });
    tcc?.chapters.forEach((ch) => {
      if (ch.dueDate?.startsWith(`${year}-${String(month).padStart(2, '0')}`)) {
        const day = Number(ch.dueDate.slice(8, 10));
        const arr = byDay.get(day) ?? [];
        arr.push({ title: ch.title, layer: 'tcc' });
        byDay.set(day, arr);
      }
    });
    return { firstWeekday: first, totalDays: total, itemsByDay: byDay };
  }, [year, month, courses, exams, tasks, sessions, tcc]);

  const today = new Date();
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDay = today.getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
      <div className="grid grid-cols-7 gap-1.5 pb-1 text-center text-xs font-semibold text-ceci-tertiary">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {cells.map((day, i) => {
          if (day == null) return <div key={`b-${i}`} />;
          const isToday = isCurrentMonth && day === todayDay;
          const items = itemsByDay.get(day) ?? [];
          const shown = items.slice(0, 3);
          const extra = items.length - shown.length;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(new Date(year, month - 1, day))}
              aria-label={`dia ${day}`}
              className={`flex min-h-[64px] flex-col items-stretch gap-0.5 rounded-[10px] p-1 text-left transition-colors ${
                isToday
                  ? 'bg-[var(--ds-accent)] text-white'
                  : 'bg-[var(--ds-surface-muted)] text-ceci-primary hover:bg-surface-rose'
              }`}
            >
              <span className="self-start text-xs font-medium">{day}</span>
              {shown.map((it, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 truncate text-[10px] leading-tight"
                  title={it.title}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: isToday ? '#fff' : LAYER_META[it.layer].fg }}
                  />
                  <span className={`truncate ${isToday ? 'text-white' : 'text-ceci-secondary'}`}>
                    {it.title}
                  </span>
                </span>
              ))}
              {extra > 0 && (
                <span className={`text-[10px] ${isToday ? 'text-white/80' : 'text-ceci-muted'}`}>
                  +{extra}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
