import React, { useMemo, useState } from 'react';
import { MessageSquare, Timer, UserCheck } from 'lucide-react';
import { CourseIcon } from '../../components/ui/CourseIcon';
import { UnderlineTabBar } from '../../components/ui/UnderlineTabBar';
import { useDesktopApp } from '@/context/desktopApp';
import { formatCourseSchedule } from '../../lib/schedule';
import { Course } from '../../types';
import { StatusBadge } from './ui/StatusBadge';
import { Panel } from './ui/Panel';
import { CourseCreateMenu } from '../../components/courses/detail/CourseCreateMenu';
import { CourseInfoContent } from '../../components/courses/detail/CourseInfoContent';
import { CourseAulasContent } from '../../components/courses/detail/CourseAulasContent';
import { CourseRepertorioContent } from '../../components/courses/detail/CourseRepertorioContent';

interface CourseDetailPaneProps {
  course: Course;
}

type DetailTab = 'info' | 'aulas' | 'repertorio';

/**
 * Detalhe da disciplina no desktop: coluna esquerda com o resumo da matéria
 * (identidade, frequência, logística) e direita com o conteúdo em abas.
 * Consome as mesmas seções compartilhadas do mobile — sem swipe aqui.
 */
export const CourseDetailPane: React.FC<CourseDetailPaneProps> = ({ course }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const { classes, exams, sessions } = useDesktopApp();

  const courseClasses = useMemo(
    () => classes.filter((c) => c.courseId === course.id),
    [classes, course.id]
  );
  const courseExams = useMemo(
    () => exams.filter((e) => e.courseId === course.id),
    [exams, course.id]
  );
  const attendance =
    course.attendance && course.attendance.total > 0
      ? {
          pct: Math.round((course.attendance.attended / course.attendance.total) * 100),
          absences: course.attendance.total - course.attendance.attended,
        }
      : null;
  const focusMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.courseId === course.id)
        .reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
    [sessions, course.id]
  );

  return (
    <div className="grid grid-cols-[minmax(260px,300px)_1fr] gap-5 items-start">
      {/* Coluna esquerda — resumo */}
      <div className="space-y-3">
        <Panel className="space-y-4">
          <div className="flex items-start gap-3">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-ceci-border-subtle"
              style={{ backgroundColor: `${course.color}20` }}
            >
              <CourseIcon icon={course.icon} className="w-6 h-6" />
            </span>
            <span className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ceci-primary leading-tight">
                {course.name}
              </h2>
              <p className="text-xs text-ceci-secondary flex items-center gap-1 mt-1">
                <UserCheck className="w-3.5 h-3.5 text-[var(--ds-accent-strong)]" />
                <span className="truncate">{course.professor}</span>
              </p>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-ceci-border-subtle pt-3">
            <StatusBadge variant="neutral">
              {course.category === 'complementar' ? 'complementar' : 'obrigatória'}
            </StatusBadge>
            {course.code && <StatusBadge variant="neutral">{course.code}</StatusBadge>}
          </div>

          {/* Logística */}
          <dl className="border-t border-ceci-border-subtle pt-3 space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider shrink-0">
                horário
              </dt>
              <dd className="text-xs font-semibold text-ceci-primary text-right">
                {formatCourseSchedule(course.schedule) || 'a definir'}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider shrink-0">
                sala
              </dt>
              <dd className="text-xs font-semibold text-ceci-primary">
                {course.room || 'não informada'}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider shrink-0">
                frequência
              </dt>
              <dd
                className={`text-xs font-bold ${attendance ? 'text-success-deep' : 'text-ceci-muted'}`}
              >
                {attendance ? `${attendance.pct}% (${attendance.absences} faltas)` : 'não registrada'}
              </dd>
            </div>
            {focusMinutes > 0 && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Timer className="w-3 h-3" /> foco
                </dt>
                <dd className="text-xs font-semibold text-ceci-academic-strong">
                  {focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h` : ''}
                  {focusMinutes % 60 > 0 ? ` ${focusMinutes % 60}min` : ''}
                </dd>
              </div>
            )}
          </dl>

          {/* Atendimento */}
          {course.officeHours && (
            <div className="border-t border-ceci-border-subtle pt-3 space-y-1">
              <h3 className="text-[10px] font-bold text-ceci-academic-strong uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                <span>atendimento</span>
              </h3>
              <p className="text-xs text-ceci-secondary leading-relaxed">{course.officeHours}</p>
            </div>
          )}
        </Panel>
      </div>

      {/* Coluna direita — conteúdo em abas */}
      <div className="min-w-0 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <UnderlineTabBar
            tabs={[
              { id: 'info', label: 'informações' },
              {
                id: 'aulas',
                label: 'aulas',
                badge: courseClasses.length + courseExams.length,
              },
              { id: 'repertorio', label: 'repertório' },
            ]}
            active={activeTab}
            onChange={(v) => setActiveTab(v as DetailTab)}
          />
          <CourseCreateMenu courseId={course.id} variant="inline" />
        </div>

        <div className="bg-surface-default rounded-2xl border border-ceci-border-subtle p-5 min-h-[320px]">
          <div role="tabpanel" aria-label={`aba ${activeTab}`}>
            {activeTab === 'info' && <CourseInfoContent course={course} />}
            {activeTab === 'aulas' && <CourseAulasContent course={course} />}
            {activeTab === 'repertorio' && <CourseRepertorioContent course={course} />}
          </div>
        </div>
      </div>
    </div>
  );
};
