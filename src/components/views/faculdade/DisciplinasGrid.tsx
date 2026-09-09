// Faculdade — subtab "disciplinas": grade de matérias (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import type { Course, ClassNote, Exam } from '../../../types';
import { ManageSurface } from '../../ui/ManageSurface';
import { CourseIcon } from '../../ui/CourseIcon';
import { formatCourseSchedule, formatShortDate } from '../../../lib/schedule';

interface DisciplinasGridProps {
  courses: Course[];
  classes: ClassNote[];
  exams: Exam[];
  onNewCourse: () => void;
  onOpenCourse: (courseId: string) => void;
}

const DisciplinasGrid: React.FC<DisciplinasGridProps> = ({
  courses,
  classes,
  exams,
  onNewCourse,
  onOpenCourse,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-1 pt-1 lg:pt-0">
      <h2 className="font-display text-base font-bold text-ceci-primary">grade de disciplinas</h2>
      <button
        onClick={onNewCourse}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand hover:bg-rose-100 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> nova matéria
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {courses.map((c) => {
        const courseClassCount = classes.filter((cl) => cl.courseId === c.id).length;
        const nextExam = exams.find((e) => e.courseId === c.id && !e.completed);

        return (
          <ManageSurface
            key={c.id}
            kind="course"
            id={c.id}
            onTap={() => onOpenCourse(c.id)}
            className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default cursor-pointer hover:border-ceci-border-brand card-lift press-card space-y-3 shadow-sm group"
            style={{ borderLeftWidth: '4px', borderLeftColor: c.color || '#B94862' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.color}1f`, borderColor: `${c.color}40` }}
                >
                  <CourseIcon icon={c.icon} className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-ceci-primary leading-snug group-hover:text-ceci-brand-strong transition-colors line-clamp-2">
                    {c.name}
                  </h3>
                  <p className="text-[11px] text-ceci-secondary mt-0.5 truncate">
                    {c.code || c.professor}
                  </p>
                </div>
              </div>
              {c.category && (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border shrink-0 ${
                    c.category === 'obrigatoria'
                      ? 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand'
                      : 'bg-surface-muted text-ceci-tertiary border-ceci-border-default'
                  }`}
                >
                  {c.category === 'obrigatoria' ? 'obrig.' : 'compl.'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-ceci-secondary line-clamp-1">
                  {formatCourseSchedule(c.schedule) || 'horário a definir'}
                </p>
                <p className="text-[11px] mt-0.5 line-clamp-1 flex items-center gap-1 flex-wrap">
                  {nextExam ? (
                    <span className="font-bold text-ceci-brand-strong">
                      prova {formatShortDate(nextExam.date)}
                    </span>
                  ) : (
                    <span className="text-ceci-muted">sem provas pendentes</span>
                  )}
                  <span className="text-ceci-muted">· {courseClassCount} aulas</span>
                </p>
              </div>
              <span className="text-[11px] font-semibold text-ceci-brand-strong flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                abrir <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </ManageSurface>
        );
      })}
    </div>
  </div>
);

export default DisciplinasGrid;