import React from 'react';
import { BookOpen, CalendarClock, GraduationCap, MessageSquare, Timer } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { useApp } from '../../../context/AppContext';
import { formatCourseSchedule } from '../../../lib/schedule';
import { Course } from '../../../types';

interface CourseInfoContentProps {
  course: Course;
}

const CARD = 'rounded-2xl bg-white border border-ceci-border-default p-4 space-y-3';
const CARD_TITLE =
  'font-display font-bold text-sm text-ceci-primary flex items-center gap-2';
const ROW_LABEL = 'text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider';
const ROW_VALUE = 'font-semibold text-xs text-ceci-primary mt-0.5';

/** Conteúdo da tab "informações" — compartilhado entre mobile e desktop. */
export const CourseInfoContent: React.FC<CourseInfoContentProps> = ({ course }) => {
  const { sessions } = useApp();

  const attendance =
    course.attendance && course.attendance.total > 0
      ? {
          pct: Math.round((course.attendance.attended / course.attendance.total) * 100),
          absences: course.attendance.total - course.attendance.attended,
        }
      : null;

  const assessments = useAssessments(course.id).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const courseSessions = sessions.filter((s) => s.courseId === course.id);
  const focusMinutes = courseSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Ementa / Descrição */}
      <section className={CARD}>
        <h3 className={CARD_TITLE}>
          <BookOpen className="w-4 h-4 text-ceci-brand-strong" />
          <span>o que essa disciplina ensina</span>
        </h3>
        <p className="text-xs text-ceci-text-soft leading-relaxed font-medium">
          {course.description ||
            'esta disciplina ainda não tem ementa anotada. edite os detalhes da matéria para registrar os objetivos.'}
        </p>
      </section>

      {/* Detalhes acadêmicos — linhas respiráveis */}
      <section className={`${CARD} !space-y-0 divide-y divide-ceci-border-subtle`}>
        <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
          <span className={`${ROW_LABEL} flex items-center gap-1.5 shrink-0`}>
            <GraduationCap className="w-3.5 h-3.5 text-ceci-muted" /> docente
          </span>
          <span className={`${ROW_VALUE} text-right`}>{course.professor}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2.5">
          <span className={`${ROW_LABEL} flex items-center gap-1.5 shrink-0`}>
            <CalendarClock className="w-3.5 h-3.5 text-ceci-muted" /> horário
          </span>
          <span className={`${ROW_VALUE} text-right`}>
            {formatCourseSchedule(course.schedule) || 'a definir'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2.5">
          <span className={ROW_LABEL}>sala</span>
          <span className={ROW_VALUE}>{course.room || 'não informada'}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0">
          <span className={ROW_LABEL}>frequência</span>
          <span
            className={`text-xs font-bold mt-0.5 ${attendance ? 'text-success-deep' : 'text-ceci-muted'}`}
          >
            {attendance
              ? `${attendance.pct}% (${attendance.absences} ${attendance.absences === 1 ? 'ausência' : 'ausências'})`
              : 'não registrada'}
          </span>
        </div>
      </section>

      {/* Composição da média */}
      <section className={CARD}>
        <div className="flex items-center justify-between gap-2">
          <h3 className={CARD_TITLE}>
            <GraduationCap className="w-4 h-4 text-ceci-brand-strong" />
            <span>como você é avaliada</span>
          </h3>
          {typeof course.minGrade === 'number' && (
            <span className="text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand shrink-0">
              média mínima: {course.minGrade.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            </span>
          )}
        </div>

        {assessments.length > 0 ? (
          <ul className="divide-y divide-ceci-border-default/70">
            {assessments.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-ceci-brand-strong shrink-0" />
                  <span className="font-semibold text-ceci-primary line-clamp-1">{ex.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {typeof ex.grade === 'number' && (
                    <span className="font-bold text-success-deep bg-surface-mint-soft px-2 py-0.5 rounded border border-green-200">
                      nota {ex.grade}
                    </span>
                  )}
                  <span className="font-bold text-ceci-primary bg-surface-muted px-2 py-0.5 rounded border border-ceci-border-default">
                    peso {ex.weightValue}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ceci-tertiary py-1 flex items-center gap-1.5">
            <Mascote expression="class-ready" className="w-6 h-6 shrink-0" decorative />
            ainda não tem prova com peso anotada — registre as avaliações para ver a composição da média.
          </p>
        )}
      </section>

      {/* Foco acumulado */}
      {courseSessions.length > 0 && (
        <section className={CARD}>
          <h3 className={`${CARD_TITLE} !text-xs text-ceci-brand-strong`}>
            <Timer className="w-3.5 h-3.5" />
            <span>foco nesta disciplina</span>
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            {focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h` : ''}
            {focusMinutes % 60 > 0 ? ` ${focusMinutes % 60}min` : focusMinutes === 0 ? '0min' : ''} de
            foco · {courseSessions.length} {courseSessions.length === 1 ? 'sessão' : 'sessões'}
          </p>
        </section>
      )}

      {/* Atendimento & monitoria */}
      {course.officeHours && (
        <section className={CARD}>
          <h3 className={`${CARD_TITLE} !text-xs text-ceci-academic-strong`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>atendimento & monitoria</span>
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed">{course.officeHours}</p>
        </section>
      )}
    </div>
  );
};

/** Provas com peso anotado desta disciplina (ordenáveis por data). */
function useAssessments(courseId: string) {
  const { exams } = useApp();
  return React.useMemo(
    () => exams.filter((e) => e.courseId === courseId && typeof e.weightValue === 'number'),
    [exams, courseId]
  );
}
