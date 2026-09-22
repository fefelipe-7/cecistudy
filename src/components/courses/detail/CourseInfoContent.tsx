import React from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  MessageSquare,
  Timer,
  UserCheck,
} from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { ProgressBar } from '../../ui/ProgressBar';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import CecinhoTip from '../../views/home/CecinhoTip';
import { useMobileApp } from '@/context/mobileApp';
import {
  formatCourseSchedule,
  formatShortDate,
  getTodaySchedule,
} from '../../../lib/schedule';
import { Course } from '../../../types';

interface CourseInfoContentProps {
  course: Course;
}

const CARD = 'rounded-2xl paper-card p-4 space-y-3';
const CARD_TITLE =
  'font-display font-bold text-sm text-ceci-primary flex items-center gap-2';
const ROW_LABEL = 'text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider';
const ROW_VALUE = 'font-semibold text-xs text-ceci-primary mt-0.5';

/** Dias até uma data (YYYY-MM-DD), no fuso local. */
function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

const RHYTHM_ICON: Record<'aulas' | 'provas' | 'foco', string> = {
  aulas: 'text-ceci-academic-strong',
  provas: 'text-ceci-brand-strong',
  foco: 'text-status-success-strong',
};

/** Telha de métrica — número grande + rótulo pequeno (padrão de stats do app). */
const MetricTile: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  iconClass: string;
}> = ({ icon, value, label, iconClass }) => (
  <div className="rounded-2xl bg-surface-subtle border border-ceci-border-subtle p-3 space-y-1.5 flex-1 min-w-[96px]">
    <div className={`flex items-center gap-1.5 ${iconClass}`}>
      {icon}
      <AnimatedNumber
        value={value}
        className="font-display text-lg font-bold text-ceci-primary"
      />
    </div>
    <p className="text-[9px] font-bold uppercase tracking-wider text-ceci-tertiary">{label}</p>
  </div>
);

/** Conteúdo da tab "informações" — compartilhado entre mobile e desktop. */
export const CourseInfoContent: React.FC<CourseInfoContentProps> = ({ course }) => {
  const { sessions, classes, exams, tasks, courses } = useMobileApp();

  const attendance =
    course.attendance && course.attendance.total > 0
      ? {
          pct: Math.round((course.attendance.attended / course.attendance.total) * 100),
          absences: course.attendance.total - course.attendance.attended,
        }
      : null;

  const courseClasses = classes.filter((c) => c.courseId === course.id);
  const pendingExams = exams
    .filter((e) => e.courseId === course.id && !e.completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pendingTasks = tasks.filter((t) => t.disciplineId === course.id && !t.completed);

  const assessments = useAssessments(course.id).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const courseSessions = sessions.filter((s) => s.courseId === course.id);
  const focusMinutes = courseSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const hasRhythm =
    courseClasses.length > 0 ||
    pendingExams.length > 0 ||
    pendingTasks.length > 0 ||
    courseSessions.length > 0;

  const hasClassToday = getTodaySchedule(courses, new Date()).some(
    (s) => s.course.id === course.id
  );

  /** Dica do cecinho — sempre conversa sobre o momento real da matéria. */
  const cecinhoTip = React.useMemo(() => {
    if (pendingExams.length > 0) {
      const next = pendingExams[0];
      const days = daysUntil(next.date);
      if (days < 0)
        return `aquela prova "${next.title}" já passou — anota como foi, isso te ajuda depois ♡`;
      if (days <= 1)
        return `bora revisar? "${next.title}" chega ${days === 0 ? 'hoje' : 'amanhã'}.`;
      if (days <= 7)
        return `bora revisar? "${next.title}" chega em ${days} dias.`;
      return `tem "${next.title}" marcada para ${formatShortDate(next.date)} — sem pressa, mas sem esquecer ♡`;
    }
    if (attendance && attendance.pct < 75)
      return `sua frequência está em ${attendance.pct}% — respira, mas toma cuidado com as faltas ♡`;
    if (pendingTasks.length > 0)
      return `tem ${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarefa' : 'tarefas'} aberta${pendingTasks.length === 1 ? '' : 's'} por aqui — bora tirar do papel?`;
    if (hasClassToday) return 'hoje tem aula — anota tudo com carinho ♡';
    if (courseSessions.length > 0)
      return `já são ${focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h de foco` : `${focusMinutes}min de foco`} nessa matéria. que orgulho de você ♡`;
    return null;
  }, [
    pendingExams,
    attendance,
    pendingTasks.length,
    hasClassToday,
    courseSessions.length,
    focusMinutes,
  ]);

  const frequencyColor = attendance
    ? attendance.pct >= 75
      ? 'var(--color-status-success-strong)'
      : attendance.pct >= 50
        ? 'var(--color-status-warning-strong)'
        : 'var(--color-status-danger-strong)'
    : undefined;
  const frequencyBar = attendance
    ? attendance.pct >= 75
      ? 'bg-status-success'
      : attendance.pct >= 50
        ? 'bg-status-warning'
        : 'bg-status-danger'
    : '';

  return (
    <div className="space-y-4">
      {/* Dica do cecinho ✨ */}
      {cecinhoTip && <CecinhoTip tip={cecinhoTip} />}

      {/* Ritmo da disciplina — métricas reais (nada de número vazio) */}
      {hasRhythm && (
        <section className="flex flex-wrap gap-2" aria-label="ritmo da disciplina">
          {courseClasses.length > 0 && (
            <MetricTile
              icon={<FileText className="w-4 h-4" />}
              value={courseClasses.length}
              label={courseClasses.length === 1 ? 'aula anotada' : 'aulas anotadas'}
              iconClass={RHYTHM_ICON.aulas}
            />
          )}
          {pendingExams.length > 0 && (
            <MetricTile
              icon={<AlertCircle className="w-4 h-4" />}
              value={pendingExams.length}
              label={pendingExams.length === 1 ? 'prova por vir' : 'provas por vir'}
              iconClass={RHYTHM_ICON.provas}
            />
          )}
          {pendingTasks.length > 0 && (
            <MetricTile
              icon={<CheckCircle2 className="w-4 h-4" />}
              value={pendingTasks.length}
              label={pendingTasks.length === 1 ? 'tarefa aberta' : 'tarefas abertas'}
              iconClass={RHYTHM_ICON.foco}
            />
          )}
          {courseSessions.length > 0 && (
            <MetricTile
              icon={<Timer className="w-4 h-4" />}
              value={focusMinutes}
              label="min de foco"
              iconClass={RHYTHM_ICON.foco}
            />
          )}
        </section>
      )}

      {/* Frequência — barra de progresso com cor semântica */}
      {attendance && (
        <section className={CARD}>
          <div className="flex items-center justify-between gap-3">
            <span className={`${ROW_LABEL} flex items-center gap-1.5`}>
              <UserCheck className="w-3.5 h-3.5 text-ceci-muted" /> frequência
            </span>
            <span className="text-xs font-bold" style={{ color: frequencyColor }}>
              {attendance.pct}% · {attendance.absences}{' '}
              {attendance.absences === 1 ? 'ausência' : 'ausências'}
            </span>
          </div>
          <ProgressBar value={attendance.pct} className="mt-2.5" barClassName={frequencyBar} />
          {attendance.pct < 75 && (
            <p className="text-[11px] text-ceci-secondary mt-2.5 leading-relaxed">
              <Mascote expression="boundaries-care" className="w-5 h-5 inline-block -mt-1 mr-1" decorative />
              sua frequência está em {attendance.pct}% — respira, mas toma cuidado com as faltas.
            </p>
          )}
        </section>
      )}

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
        <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0">
          <span className={ROW_LABEL}>sala</span>
          <span className={ROW_VALUE}>{course.room || 'não informada'}</span>
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
                    <span className="font-bold text-status-success-strong bg-status-success-surface px-2 py-0.5 rounded border border-status-success-border">
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
  const { exams } = useMobileApp();
  return React.useMemo(
    () => exams.filter((e) => e.courseId === courseId && typeof e.weightValue === 'number'),
    [exams, courseId]
  );
}
