// Faculdade — subtab "calendário": mês navegável + dia clicável (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { Course, Exam, Task } from '../../../types';
import type { CalendarEvent } from '../../../lib/schedule';
import {
  eventsForMonth,
  formatShortDate,
  monthName,
  daysInMonth,
  classesForMonth,
} from '../../../lib/schedule';

const WEEKDAY_HEADERS = ['d', 's', 't', 'q', 'q', 's', 's'];

interface CalendarMonthProps {
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  now: Date;
  onOpenCourse: (courseId: string) => void;
  onEventDestination: (ev: CalendarEvent) => (() => void) | null;
}

const CalendarMonth: React.FC<CalendarMonthProps> = ({
  courses,
  exams,
  tasks,
  now,
  onOpenCourse,
  onEventDestination,
}) => {
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Aulas recorrentes projetadas no mês exibido do calendário
  const calClasses = useMemo(
    () => classesForMonth(courses, calYear, calMonth),
    [courses, calYear, calMonth]
  );

  // Calendário real (eventos de provas/tarefas do mês exibido)
  const calEvents = eventsForMonth(exams, tasks, calMonth, calYear);
  const todayDay = now.getDate();
  const totalDays = daysInMonth(calYear, calMonth);
  const firstWeekday = new Date(calYear, calMonth - 1, 1).getDay();
  const isCurrentMonth = calMonth === now.getMonth() + 1 && calYear === now.getFullYear();

  const shiftMonth = (delta: number) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDay(null);
  };

  const selectedEvents = selectedDay != null ? calEvents.get(selectedDay) ?? [] : [];
  const goToday = () => {
    setCalMonth(now.getMonth() + 1);
    setCalYear(now.getFullYear());
    setSelectedDay(null);
  };

  return (
    <div className="space-y-3 px-1 pt-1 lg:pt-0">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="font-display text-base font-bold text-ceci-primary">
          {monthName(calYear, calMonth)} <span className="text-ceci-tertiary font-medium">{calYear}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="mês anterior"
            className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand hover:bg-surface-rose transition-colors cursor-pointer"
            >
              hoje
            </button>
          )}
          <button
            onClick={() => shiftMonth(1)}
            aria-label="próximo mês"
            className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ceci-tertiary py-1 border-b border-ceci-border-default">
        {WEEKDAY_HEADERS.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {/* células vazias até o primeiro dia do mês */}
        {Array.from({ length: firstWeekday }, (_, i) => <div key={`blank-${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const isToday = isCurrentMonth && day === todayDay;
          const hasEvent = (calEvents.get(day)?.length ?? 0) > 0;
          const dayClassCount = calClasses.get(day)?.length ?? 0;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              aria-label={`dia ${day}${hasEvent ? ', tem eventos' : ''}${dayClassCount > 0 ? ', tem aula' : ''}`}
              className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[40px] font-medium transition-colors cursor-pointer ${
                isToday
                  ? 'bg-ceci-brand-strong text-ceci-on-brand shadow-2xs font-bold'
                  : isSelected
                    ? 'bg-surface-blue text-ceci-academic-strong font-bold border border-ceci-border-academic'
                    : hasEvent
                      ? 'bg-surface-rose text-ceci-brand-strong font-bold border border-ceci-border-brand hover:bg-surface-rose'
                      : dayClassCount > 0
                        ? 'bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic hover:bg-surface-subtle'
                        : 'bg-surface-muted text-ceci-primary hover:bg-surface-subtle'
              }`}
            >
              <span>{day}</span>
              {(hasEvent || dayClassCount > 0) && (
                <span className="flex items-center gap-0.5 mt-0.5">
                  {hasEvent && <span className="w-1 h-1 rounded-full bg-current" />}
                  {dayClassCount > 0 && (
                    <span className="w-1 h-1 rounded-full bg-ceci-academic-strong" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Painel do dia selecionado (provas/tarefas + aulas recorrentes) */}
      {selectedDay != null && (() => {
        const dayClassList = calClasses.get(selectedDay) ?? [];
        const hasAnything = selectedEvents.length > 0 || dayClassList.length > 0;
        return (
          <div className="rounded-xl p-4 bg-surface-subtle border border-ceci-border-subtle space-y-2">
            <p className="text-xs font-semibold text-ceci-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ceci-brand-strong" />
              {selectedDay} de {monthName(calYear, calMonth)}
            </p>
            {!hasAnything ? (
              <p className="text-xs text-ceci-secondary">nada anotado neste dia ♡</p>
            ) : (
              <div className="divide-y divide-ceci-border-subtle">
                {/* aulas recorrentes do dia da semana */}
                {dayClassList.map(({ course, slot }) => (
                  <button
                    key={`class-${course.id}-${slot.start}`}
                    onClick={() => onOpenCourse(course.id)}
                    className="w-full py-2 flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-ceci-primary line-clamp-1">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-ceci-secondary mt-0.5">
                        aula{slot.start ? ` · ${slot.start}${slot.end ? `–${slot.end}` : ''}` : ''}
                        {course.room ? ` · ${course.room}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 text-ceci-academic-strong bg-surface-default border-ceci-border-academic">
                      aula
                    </span>
                  </button>
                ))}
                {selectedEvents.map((ev) => {
                  const dest = onEventDestination(ev);
                  const evCourse = ev.courseId ? courses.find((c) => c.id === ev.courseId)?.name : undefined;
                  const inner = (
                    <>
                      <div className="min-w-0">
                        <h3 className={`font-semibold text-xs line-clamp-1 ${ev.completed ? 'line-through text-ceci-muted' : 'text-ceci-primary'}`}>
                          {ev.title}
                        </h3>
                        {evCourse && <p className="text-[11px] text-ceci-secondary mt-0.5">{evCourse}</p>}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                          ev.kind === 'prova'
                            ? 'text-ceci-brand-strong bg-surface-default border-ceci-border-brand'
                            : 'text-ceci-academic-strong bg-surface-default border-ceci-border-academic'
                        }`}
                      >
                        {ev.kind}
                      </span>
                    </>
                  );
                  return dest ? (
                    <button
                      key={ev.id}
                      onClick={dest}
                      className="w-full py-2 flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {inner}
                    </button>
                  ) : (
                    <div key={ev.id} className="py-2 flex items-center justify-between gap-3">
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default CalendarMonth;