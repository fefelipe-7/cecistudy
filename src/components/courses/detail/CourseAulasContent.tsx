import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  CalendarX2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Plus,
  X,
} from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { CompletionToggle } from '../../ui/CompletionToggle';
import { ManageSurface } from '../../ui/ManageSurface';
import { ClassNoteListItem } from '../ClassNoteListItem';
import RecordEditSheet from '../RecordEditSheet';
import { useMobileApp } from '@/context/mobileApp';
import { formatShortDate } from '../../../lib/schedule';
import { sortAttendanceRecords } from '../../../lib/attendance';
import type { AttendanceRecord, AttendanceStatus, ClassNote, Course, Exam } from '../../../types';

interface CourseAulasContentProps {
  course: Course;
}

/** Dias até uma data (YYYY-MM-DD), no fuso local. */
function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Rótulo de urgência da prova pendente ("hoje 11/08", "em 3 dias · 12/08"...). */
function examPillLabel(exam: Exam): string {
  const days = daysUntil(exam.date);
  if (days < 0) return formatShortDate(exam.date);
  if (days === 0) return `hoje ${formatShortDate(exam.date)}`;
  if (days === 1) return `amanhã ${formatShortDate(exam.date)}`;
  if (days <= 7) return `${days} dias · ${formatShortDate(exam.date)}`;
  return formatShortDate(exam.date);
}

/** Cor do pill: âmbar quando a prova está em menos de 3 dias. */
function examPillClass(exam: Exam): string {
  const days = daysUntil(exam.date);
  const urgent = days >= 0 && days <= 3;
  return urgent
    ? 'text-status-warning-strong bg-status-warning-surface px-2 py-0.5 rounded-full border border-status-warning-border'
    : 'text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand';
}

/** Chip de status da frequência (spec-frequencia.md §7.3). */
const STATUS_CHIP: Record<
  AttendanceStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  presente: {
    label: 'presente',
    icon: <Check className="w-3 h-3" />,
    className:
      'bg-status-success-surface text-status-success-strong border-status-success-border',
  },
  falta: {
    label: 'falta',
    icon: <X className="w-3 h-3" />,
    className: 'bg-status-danger-surface text-status-danger-strong border-status-danger-border',
  },
  cancelada: {
    label: 'cancelada',
    icon: <CalendarX2 className="w-3 h-3" />,
    className: 'bg-status-warning-surface text-status-warning-strong border-status-warning-border',
  },
};

type HistoryRow =
  | { kind: 'record'; record: AttendanceRecord; note?: ClassNote }
  | { kind: 'note'; note: ClassNote };

/** Linhas unificadas do histórico por data desc (record com nota vira a própria nota). */
function buildHistoryRows(records: AttendanceRecord[], classes: ClassNote[]): HistoryRow[] {
  const notesById = new Map(classes.map((c) => [c.id, c]));
  const rows: HistoryRow[] = [];
  for (const record of records) {
    const note = record.noteId ? notesById.get(record.noteId) : undefined;
    rows.push({ kind: 'record', record, note });
  }
  for (const note of classes) {
    const linked = records.some((r) => r.noteId === note.id);
    if (!linked) rows.push({ kind: 'note', note });
  }
  rows.sort((a, b) =>
    (a.kind === 'record' ? a.record.date : a.note.date).localeCompare(
      b.kind === 'record' ? b.record.date : b.note.date
    )
  );
  return rows;
}

/**
 * Conteúdo da tab "aulas & avaliações": provas (próximas vs. concluídas),
 * diário de aulas em timeline e tarefas sempre visíveis com empty state.
 * Compartilhado entre mobile e desktop.
 */
export const CourseAulasContent: React.FC<CourseAulasContentProps> = ({ course }) => {
  const [showDoneExams, setShowDoneExams] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [editFor, setEditFor] = useState<AttendanceRecord | null>(null);
  const {
    classes,
    exams,
    tasks,
    handleToggleExam,
    handleToggleTask,
    openWizard,
    openCompose,
    openClassNoteDetail,
    markAttendance,
  } = useMobileApp();

  const courseClasses = classes
    .filter((c) => c.courseId === course.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const courseExams = exams.filter((e) => e.courseId === course.id);
  const pendingExams = courseExams
    .filter((e) => !e.completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  const doneExams = courseExams
    .filter((e) => e.completed)
    .sort((a, b) => b.date.localeCompare(a.date));
  const courseTasks = tasks.filter((t) => t.disciplineId === course.id);
  const historyRows = useMemo(
    () => buildHistoryRows(sortAttendanceRecords(course.attendance?.records ?? []), courseClasses),
    [course.attendance?.records, courseClasses]
  );

  return (
    <div className="space-y-6">
      {/* Próximas avaliações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-ceci-brand-strong" />
            <span>próximas avaliações</span>
          </h3>
          <button
            onClick={() => openWizard('exam', course.id)}
            className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer px-2 -mx-2 py-1.5 -my-1.5 rounded-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>nova prova</span>
          </button>
        </div>

        {pendingExams.length > 0 ? (
          <div className="divide-y divide-ceci-border-default/70 border-y border-ceci-border-default">
            {pendingExams.map((exam) => (
              <ManageSurface
                key={exam.id}
                kind="exam"
                id={exam.id}
                data-target={exam.id}
                onTap={() => handleToggleExam(exam.id)}
                className="py-3 flex items-start justify-between cursor-pointer group transition-colors"
              >
                <div className="space-y-1 flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold ${examPillClass(exam)}`}>
                      {examPillLabel(exam)}
                    </span>
                    <span className="text-[10px] font-semibold text-ceci-secondary">{exam.weight}</span>
                  </div>

                  <h4 className="font-display font-bold text-sm text-ceci-primary">{exam.title}</h4>

                  {exam.topics && exam.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {exam.topics.map((tp, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] text-ceci-secondary bg-surface-muted px-2 py-0.2 rounded border border-ceci-border-default"
                        >
                          {tp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <CompletionToggle
                    checked={exam.completed}
                    onChange={() => handleToggleExam(exam.id)}
                    label={`marcar prova "${exam.title}" como concluída`}
                  />
                </div>
              </ManageSurface>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary py-1 flex items-center gap-1.5">
            <Mascote expression="class-ready" className="w-6 h-6 shrink-0" decorative />
            nenhuma prova no radar — quando souber a data, anote aqui ♡
          </p>
        )}

        {/* Concluídas (colapsável) */}
        {doneExams.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setShowDoneExams((s) => !s)}
              aria-expanded={showDoneExams}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-ceci-tertiary hover:text-ceci-primary cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showDoneExams ? '' : '-rotate-90'}`}
              />
              <span>
                {showDoneExams ? 'esconder' : 'ver'} concluídas ({doneExams.length})
              </span>
            </button>
            {showDoneExams && (
              <div className="divide-y divide-ceci-border-default/60 border-y border-ceci-border-default/60">
                {doneExams.map((exam) => (
                  <div key={exam.id} className="py-2.5 flex items-start justify-between">
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-ceci-tertiary bg-surface-muted px-2 py-0.5 rounded-full border border-ceci-border-default">
                          {formatShortDate(exam.date)}
                        </span>
                        {typeof exam.grade === 'number' && (
                          <span className="text-[10px] font-bold text-status-success-strong bg-status-success-surface px-2 py-0.5 rounded-full border border-status-success-border">
                            nota: {exam.grade}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-sm text-ceci-tertiary line-through">
                        {exam.title}
                      </h4>
                    </div>
                    <div className="pt-1">
                      <CompletionToggle
                        checked={exam.completed}
                        onChange={() => handleToggleExam(exam.id)}
                        size="sm"
                        label={`marcar prova "${exam.title}" como pendente`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Histórico de aulas — presenças + anotações por data (spec §7.3) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-ceci-academic-strong" />
            <span>histórico de aulas</span>
          </h3>
          <button
            onClick={() => openCompose(course.id)}
            className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer px-2 -mx-2 py-1.5 -my-1.5 rounded-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>nova aula</span>
          </button>
        </div>

        {historyRows.length > 0 ? (
          <ol className="relative space-y-0 border-l border-ceci-border-default ml-1.5">
            {historyRows.map((row) => {
              const rowDate = row.kind === 'record' ? row.record.date : row.note.date;
              if (row.kind === 'record') {
                const chip = STATUS_CHIP[row.record.status];
                const note = row.note;
                return (
                  <li key={`r-${row.record.id}`} className="relative pl-4 pb-1 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-surface-default border-2 shrink-0"
                      style={{ borderColor: course.color }}
                    />
                    <div className="py-3.5 space-y-1.5 cursor-pointer group hover:bg-surface-muted/50 px-1 rounded-lg transition-colors">
                      <button
                        onClick={() => setEditFor(row.record)}
                        aria-label={`editar registro de ${formatShortDate(rowDate)}`}
                        className="w-full flex items-center justify-between text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-1 rounded"
                      >
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${chip.className}`}
                        >
                          {chip.icon}
                          <span>{chip.label}</span>
                          {row.record.status === 'presente' && row.record.hours ? (
                            <span>· {row.record.hours}h</span>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-ceci-tertiary font-medium">
                          {formatShortDate(rowDate)}
                        </span>
                      </button>
                      {note ? (
                        <button
                          onClick={() => openClassNoteDetail(note.id)}
                          aria-label={`ver anotação: ${note.title}`}
                          className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-1 rounded"
                        >
                          <h4 className="font-display font-bold text-sm text-ceci-primary group-hover:text-ceci-brand-strong transition-colors leading-tight">
                            {note.title}
                          </h4>
                          <p className="text-xs text-ceci-secondary line-clamp-2 leading-relaxed">
                            {note.summary}
                          </p>
                        </button>
                      ) : (
                        <h4 className="font-display font-bold text-sm text-ceci-primary leading-tight">
                          aula do dia {formatShortDate(rowDate)}
                        </h4>
                      )}
                    </div>
                  </li>
                );
              }
              return (
                <li key={`n-${row.note.id}`} className="relative pl-4 pb-1 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-surface-default border-2 shrink-0"
                    style={{ borderColor: course.color }}
                  />
                  <ClassNoteListItem note={row.note} onClick={() => openClassNoteDetail(row.note.id)} />
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="py-6 text-center space-y-2">
            <Mascote expression="empty-invite" className="w-14 h-14 mx-auto" decorative />
            <p className="text-xs font-semibold text-ceci-primary">ainda não tem aula registrada</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => openCompose(course.id)}
                className="px-3.5 py-1.5 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong rounded-full text-xs font-bold cursor-pointer"
              >
                anotar primeira aula
              </button>
              {course.attendance?.total ? (
                <button
                  onClick={() => markAttendance(course.id, 'presente')}
                  className="px-3.5 py-1.5 bg-status-success-surface border border-status-success-border text-status-success-strong rounded-full text-xs font-bold cursor-pointer"
                >
                  registrar presença de hoje
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Tarefas & entregas (sempre visível) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success-strong" />
            <span>tarefas & entregas</span>
          </h3>
          {courseTasks.length > 0 ? (
            courseTasks.some((t) => t.completed) ? (
              <button
                onClick={() => setShowDoneTasks((s) => !s)}
                className="text-[11px] font-semibold text-ceci-brand-strong hover:underline cursor-pointer shrink-0"
              >
                {showDoneTasks ? 'esconder concluídas' : 'mostrar concluídas'}
              </button>
            ) : null
          ) : (
            <button
              onClick={() => openWizard('task', course.id)}
              className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer shrink-0 px-2 -mx-2 py-1.5 -my-1.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>nova tarefa</span>
            </button>
          )}
        </div>

        {courseTasks.length > 0 ? (
          <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default">
            {(showDoneTasks ? courseTasks : courseTasks.filter((t) => !t.completed)).map((t) => (
              <ManageSurface
                key={t.id}
                kind="task"
                id={t.id}
                data-target={t.id}
                onTap={() => handleToggleTask(t.id)}
                className="py-2.5 flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="space-y-0.5 pr-2">
                  <p
                    className={`font-semibold text-ceci-primary ${t.completed ? 'line-through text-ceci-tertiary' : ''}`}
                  >
                    {t.title}
                  </p>
                  {t.dueDate && (
                    <span className="text-[10px] text-ceci-tertiary">
                      prazo: {formatShortDate(t.dueDate)}
                    </span>
                  )}
                </div>
                <CompletionToggle
                  checked={t.completed}
                  onChange={() => handleToggleTask(t.id)}
                  size="sm"
                  label={
                    t.completed
                      ? `marcar tarefa "${t.title}" como pendente`
                      : `marcar tarefa "${t.title}" como concluída`
                  }
                />
              </ManageSurface>
            ))}
            {!showDoneTasks &&
              courseTasks.length > 0 &&
              courseTasks.every((t) => t.completed) && (
                <p className="py-3 text-xs text-status-success-strong flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> todas as tarefas desta disciplina estão
                  concluídas ♡
                </p>
              )}
          </div>
        ) : (
          <p className="text-xs text-ceci-tertiary py-2 flex items-center gap-1.5">
            <Mascote expression="writing-note" className="w-6 h-6 shrink-0" decorative />
            nada pendente por aqui — anote trabalhos e entregas para não esquecer nenhum.
          </p>
        )}
      </div>

      <RecordEditSheet
        open={editFor !== null}
        course={course}
        record={editFor}
        onClose={() => setEditFor(null)}
      />
    </div>
  );
};
