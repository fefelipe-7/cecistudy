// Faculdade — "minha semana": grade real seg → dom (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React, { useMemo, useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import type { Course } from '../../../types';
import { WEEKDAY_LABELS, WEEKDAY_FULL_LABELS } from '../../../data/constants';
import { SectionTitle } from '../../ui/SectionTitle';
import { CourseIcon } from '../../ui/CourseIcon';
import { getTodaySchedule, formatShortDate, weekDates } from '../../../lib/schedule';

interface WeekGridProps {
  courses: Course[];
  now: Date;
  onOpenCourse: (courseId: string) => void;
}

const WeekGrid: React.FC<WeekGridProps> = ({ courses, now, onOpenCourse }) => {
  const [selectedWeekday, setSelectedWeekday] = useState(() => now.getDay());

  // Grade semanal (domingo→sábado da semana corrente, exibida seg → dom)
  const weekDays = useMemo(() => {
    const d = weekDates(now);
    return [d[1], d[2], d[3], d[4], d[5], d[6], d[0]];
  }, [now]);
  const selectedWeekDate =
    weekDays.find((d) => d.getDay() === selectedWeekday) ?? now;
  const selectedWeekSchedule = getTodaySchedule(courses, selectedWeekDate);

  return (
    <section className="px-0.5">
      <SectionTitle icon={<Clock className="w-4 h-4 text-ceci-academic-strong" />}>
        minha semana
      </SectionTitle>
      <div className="pt-3 space-y-3">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => {
            const dow = d.getDay();
            const dayClasses = getTodaySchedule(courses, d);
            const isSel = dow === selectedWeekday;
            const isTodayDow = dow === now.getDay();
            return (
              <button
                key={dow}
                onClick={() => setSelectedWeekday(dow)}
                aria-label={`ver aulas de ${WEEKDAY_FULL_LABELS[dow]}`}
                aria-pressed={isSel}
                className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 min-h-[56px] border transition-colors cursor-pointer ${
                  isSel
                    ? 'bg-ceci-primary text-white border-transparent shadow-sm'
                    : isTodayDow
                      ? 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand'
                      : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-subtle'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  {WEEKDAY_LABELS[dow]}
                </span>
                <span className={`text-xs font-bold tabular-nums ${isSel ? 'text-white' : ''}`}>
                  {d.getDate()}
                </span>
                <span className="flex items-center gap-0.5 h-1" aria-hidden="true">
                  {dayClasses.slice(0, 3).map(({ course }) => (
                    <span
                      key={course.id}
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {selectedWeekSchedule.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-ceci-tertiary px-1 flex items-center gap-1.5">
              aulas de {WEEKDAY_FULL_LABELS[selectedWeekday]} ·{' '}
              {formatShortDate(
                `${selectedWeekDate.getFullYear()}-${String(selectedWeekDate.getMonth() + 1).padStart(2, '0')}-${String(selectedWeekDate.getDate()).padStart(2, '0')}`
              )}
              {selectedWeekday === now.getDay() && (
                <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-2 py-0.5 rounded-full">
                  hoje
                </span>
              )}
            </p>
            {selectedWeekSchedule.map(({ course: c, slot }) => (
              <button
                key={`${c.id}-${slot.day}-${slot.start}`}
                onClick={() => onOpenCourse(c.id)}
                className="w-full p-4 rounded-xl bg-white border border-ceci-border-default hover:border-ceci-border-brand shadow-sm tap-interactive cursor-pointer flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic px-2.5 py-1.5 rounded-xl shrink-0 tabular-nums">
                    {slot.start}{slot.end ? `–${slot.end}` : ''}
                  </span>
                  <span
                    className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${c.color}1f`, borderColor: `${c.color}40` }}
                  >
                    <CourseIcon icon={c.icon} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-ceci-primary truncate">{c.name}</h3>
                    {c.room && (
                      <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">{c.room}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ceci-muted shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-subtle border border-dashed border-ceci-border-default text-center">
            <p className="text-xs text-ceci-secondary">
              sem aulas{' '}
              {selectedWeekday === now.getDay()
                ? 'hoje'
                : `de ${WEEKDAY_FULL_LABELS[selectedWeekday]}`}
              {' ♡ '}
              {(() => {
                const next = weekDays.find(
                  (d) => d.getTime() > selectedWeekDate.getTime() && getTodaySchedule(courses, d).length > 0
                );
                return next
                  ? `a próxima é ${WEEKDAY_FULL_LABELS[next.getDay()]} (${formatShortDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`)}).`
                  : 'essa semana está leve.';
              })()}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default WeekGrid;