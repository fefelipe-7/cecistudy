import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, FileText, Plus } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { CompletionToggle } from '../../ui/CompletionToggle';
import { ManageSurface } from '../../ui/ManageSurface';
import { ClassNoteModal } from '../ClassNoteModal';
import { ClassNoteListItem } from '../ClassNoteListItem';
import { useApp } from '../../../context/AppContext';
import { formatShortDate } from '../../../lib/schedule';
import { Course, ClassNote } from '../../../types';

interface CourseAulasContentProps {
  course: Course;
}

/**
 * Conteúdo da tab "aulas & avaliações": provas (próximas vs. concluídas),
 * diário de aulas em timeline e tarefas sempre visíveis com empty state.
 * Compartilhado entre mobile e desktop.
 */
export const CourseAulasContent: React.FC<CourseAulasContentProps> = ({ course }) => {
  const [selectedClassNote, setSelectedClassNote] = useState<ClassNote | null>(null);
  const [showDoneExams, setShowDoneExams] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const { classes, exams, tasks, handleToggleExam, handleToggleTask, openWizard, openCompose } =
    useApp();

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
            className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer"
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
                    <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
                      {formatShortDate(exam.date)}
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
                          <span className="text-[10px] font-bold text-success-deep bg-surface-mint-soft px-2 py-0.5 rounded-full border border-green-200">
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

      {/* Diário de aulas — timeline cronológica (mais recente primeiro) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-ceci-academic-strong" />
            <span>diário de aulas</span>
          </h3>
          <button
            onClick={() => openCompose(course.id)}
            className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>nova aula</span>
          </button>
        </div>

        {courseClasses.length > 0 ? (
          <ol className="relative space-y-0 border-l border-ceci-border-default ml-1.5">
            {courseClasses.map((cl) => (
              <li key={cl.id} className="relative pl-4 pb-1 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-ceci-brand-strong shrink-0"
                />
                <ClassNoteListItem note={cl} onClick={() => setSelectedClassNote(cl)} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="py-6 text-center space-y-2">
            <Mascote expression="empty-invite" className="w-14 h-14 mx-auto" decorative />
            <p className="text-xs font-semibold text-ceci-primary">ainda não tem aula anotada</p>
            <button
              onClick={() => openCompose(course.id)}
              className="px-3.5 py-1.5 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong rounded-full text-xs font-bold cursor-pointer"
            >
              anotar primeira aula
            </button>
          </div>
        )}
      </div>

      {/* Tarefas & entregas (sempre visível) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success-deep" />
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
              className="text-xs font-bold text-ceci-brand-strong hover:underline flex items-center gap-1 cursor-pointer shrink-0"
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
                <p className="py-3 text-xs text-success-deep flex items-center gap-1.5">
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

      <ClassNoteModal note={selectedClassNote} onClose={() => setSelectedClassNote(null)} />
    </div>
  );
};
