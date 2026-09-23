// Home — "hoje na facul": aulas de hoje como cards reais (MOD-001 / B.7).
// Extraído de `HomeView.tsx`. Toque no card abre o menu 2×2 de frequência.
import React, { useState } from 'react';
import { CalendarDays, DoorOpen, ArrowRight, Check } from 'lucide-react';
import { SectionTitle } from '../../ui/SectionTitle';
import { ClassActionsSheet } from './ClassActionsSheet';
import { toDateKey } from '../../../lib/streak';
import { hapticTap } from '../../../lib/haptics';
import { useMobileApp } from '@/context/mobileApp';
import type { ScheduledClass } from '../../../lib/schedule';
import type { AttendanceStatus } from '../../../types';

interface TodayClassesProps {
  todaySchedule: ScheduledClass[];
  onOpenCourse: (courseId: string) => void;
}

const STATUS_TOAST: Record<Exclude<AttendanceStatus, 'presente'>, string> = {
  falta: 'guardado como falta ♡ sem julgamento, só registro',
  cancelada: 'aula cancelada não conta como falta ♡',
};

const TodayClasses: React.FC<TodayClassesProps> = ({ todaySchedule, onOpenCourse }) => {
  const { markAttendance, openCompose, showToast } = useMobileApp();
  const [sheetFor, setSheetFor] = useState<ScheduledClass | null>(null);
  const todayKey = toDateKey(new Date());

  const handleSelect = (status: AttendanceStatus, annotate?: boolean) => {
    const current = sheetFor;
    setSheetFor(null);
    if (!current) return;
    hapticTap();
    markAttendance(current.course.id, status);
    if (status === 'presente') {
      if (annotate) {
        openCompose(current.course.id);
        return;
      }
      showToast('presença registrada ♡ bora estudar?');
      return;
    }
    showToast(STATUS_TOAST[status as Exclude<AttendanceStatus, 'presente'>]);
  };

  return (
    <section className="space-y-3 px-0.5">
      <SectionTitle icon={<CalendarDays className="w-4 h-4 text-ceci-academic-strong" />}>
        hoje na facul
      </SectionTitle>

      {todaySchedule.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {todaySchedule.map(({ course, slot }) => {
            const recordedToday = (course.attendance?.records ?? []).some(
              (r) => r.date === todayKey
            );
            return (
              <button
                key={`${course.id}-${slot.start}`}
                disabled={recordedToday}
                onClick={() => setSheetFor({ course, slot })}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-surface-default border shadow-sm transition text-left ${
                  recordedToday
                    ? 'border-ceci-border-default/60 opacity-60 saturate-50 cursor-default'
                    : 'border-ceci-border-default hover:border-ceci-border-brand tap-interactive active:scale-[0.99] cursor-pointer'
                }`}
                aria-label={
                  recordedToday
                    ? `${course.name} — presença já registrada hoje`
                    : `registrar frequência de ${course.name}`
                }
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
                {recordedToday ? (
                  <span className="shrink-0 flex flex-col items-center gap-1 text-[9px] font-semibold text-status-success-strong">
                    <span className="w-6 h-6 rounded-full bg-status-success-surface border border-status-success-border flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>registrada</span>
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-ceci-muted shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="font-serif-academic text-sm text-ceci-tertiary px-1">
          hoje não tem aula — dia livre para o cantinho ♡
        </p>
      )}

      <ClassActionsSheet
        open={sheetFor !== null}
        courseName={sheetFor?.course.name ?? ''}
        slotStart={sheetFor?.slot.start}
        onClose={() => setSheetFor(null)}
        onSelect={handleSelect}
        onOpenCourse={() => {
          const current = sheetFor;
          setSheetFor(null);
          if (current) onOpenCourse(current.course.id);
        }}
      />
    </section>
  );
};

export default TodayClasses;