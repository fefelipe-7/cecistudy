import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { CourseIcon } from '../../components/ui/CourseIcon';
import { formatCourseSchedule } from '../../lib/schedule';
import { Panel } from './ui/Panel';
import { StatusBadge } from './ui/StatusBadge';

/**
 * Painel mestre da aba faculdade no desktop: cards compactos por disciplina
 * (padrão projectCard — header com ícone/badge, metadados em caption).
 * O detalhe abre na pane à direita, sem empilhar tela.
 */
export const CourseMasterList: React.FC = () => {
  const {
    courses,
    focusedCourseId,
    openCourseDetail,
    openWizard,
  } = useDesktopApp();

  const sorted = useMemo(
    () => [...courses].sort((a, b) => a.name.localeCompare(b.name)),
    [courses]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 pb-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ceci-muted">
          disciplinas
        </h2>
        <button
          onClick={() => openWizard('course')}
          aria-label="nova disciplina"
          className="w-7 h-7 rounded-[10px] bg-white border border-ceci-border-default text-ceci-secondary flex items-center justify-center cursor-pointer hover:bg-[var(--ds-surface-hover)] hover:border-ceci-border-strong hover:text-ceci-primary transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <ul className="flex flex-col gap-2" role="listbox" aria-label="disciplinas">
        {sorted.map((course) => {
          const isActive = course.id === focusedCourseId;
          const schedule = formatCourseSchedule(course.schedule);
          return (
            <li key={course.id}>
              <Panel
                role="option"
                aria-selected={isActive}
                onClick={() => openCourseDetail(course.id)}
                className={`w-full text-left cursor-pointer transition-colors hover:border-ceci-border-strong hover:bg-[var(--ds-surface-hover)] ${
                  isActive ? 'border-ceci-border-strong bg-[var(--ds-surface-active)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-surface-muted">
                    <CourseIcon icon={course.icon} className="w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate leading-tight text-ceci-primary">
                      {course.name}
                    </span>
                    <span className="block text-xs text-ceci-muted truncate mt-0.5">
                      {course.code || course.professor || '—'}
                    </span>
                  </span>
                  {isActive ? (
                    <StatusBadge variant="brand">aberta</StatusBadge>
                  ) : (
                    schedule && (
                      <span className="hidden sm:block font-mono text-[11px] text-ceci-muted shrink-0">
                        {schedule}
                      </span>
                    )
                  )}
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>

      {sorted.length === 0 && (
        <Panel dashed className="p-6 text-center">
          <p className="text-xs text-ceci-secondary">
            nenhuma disciplina ainda — que tal criar a primeira? ♡
          </p>
        </Panel>
      )}
    </div>
  );
};
