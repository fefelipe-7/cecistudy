// Home — "hoje na facul": aulas de hoje como cards reais (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { CalendarDays, DoorOpen, ArrowRight } from 'lucide-react';
import { SectionTitle } from '../../ui/SectionTitle';
import type { ScheduledClass } from '../../../lib/schedule';

interface TodayClassesProps {
  todaySchedule: ScheduledClass[];
  onOpenCourse: (courseId: string) => void;
}

const TodayClasses: React.FC<TodayClassesProps> = ({ todaySchedule, onOpenCourse }) => (
  <section className="space-y-3 px-0.5">
    <SectionTitle icon={<CalendarDays className="w-4 h-4 text-ceci-academic-strong" />}>
      hoje na facul
    </SectionTitle>

    {todaySchedule.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {todaySchedule.map(({ course, slot }) => (
          <button
            key={`${course.id}-${slot.start}`}
            onClick={() => onOpenCourse(course.id)}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand shadow-sm tap-interactive active:scale-[0.99] transition cursor-pointer text-left"
          >
            <div className="text-center shrink-0 w-12">
              <p className="font-display font-bold text-base text-ceci-primary leading-none tabular-nums">
                {slot.start}
              </p>
              {slot.end && (
                <p className="text-[10px] text-ceci-tertiary mt-0.5 tabular-nums">→ {slot.end}</p>
              )}
            </div>
            <div className="w-px self-stretch bg-ceci-border-subtle" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ceci-primary truncate">{course.name}</p>
              <p className="text-[11px] text-ceci-secondary mt-0.5 flex items-center gap-1 truncate">
                <DoorOpen className="w-3 h-3 shrink-0" />
                {course.room || 'sala a confirmar'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-ceci-muted shrink-0" />
          </button>
        ))}
      </div>
    ) : (
      <p className="font-serif-academic text-sm text-ceci-tertiary px-1">
        hoje não tem aula — dia livre para o cantinho ♡
      </p>
    )}
  </section>
);

export default TodayClasses;