import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CourseIcon } from '../../components/ui/CourseIcon';
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
  } = useApp();

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
          className="w-7 h-7 rounded-[10px] bg-white border border-ceci-border-default text-ceci-secondary flex items-center justify-center cursor-pointer hover:bg-surface-muted hover:text-ceci-primary transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <ul className="flex flex-col gap-2" role="listbox" aria-label="disciplinas">
        {sorted.map((course) => {
          const isActive = course.id === focusedCourseId;
          return (
            <li key={course.id}>
              <Panel
                role="option"
                aria-selected={isActive}
                onClick={() => openCourseDetail(course.id)}
                className={`w-full text-left cursor-pointer transition-all hover:border-ceci-border-strong ${
                  isActive ? 'border-ceci-border-brand bg-surface-rose' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-surface-muted">
                    <CourseIcon icon={course.icon} className="w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold truncate leading-tight ${
                        isActive ? 'text-ceci-brand-strong' : 'text-ceci-primary'
                      }`}
                    >
                      {course.name}
                    </span>
                    <span className="block text-xs text-ceci-muted truncate mt-0.5">
                      {course.code || course.professor || '—'}
                    </span>
                  </span>
                  {isActive && <StatusBadge variant="brand">aberta</StatusBadge>}
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
