// Home — linhas de tarefa e prova do bloco "sua atenção hoje" (MOD-001 / B.7).
// Extraídas de `HomeView.tsx`.
import React from 'react';
import { motion } from 'framer-motion';
import { getTransition } from '@/lib/motion';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Task } from '../../../types';
import { useDataClientCourses } from '@/context/DataClientProvider';
import { useCoursesActions, useNavValue } from '@/context/shellNavContexts';
import { useLongPress } from '../../../lib/useLongPress';
import { CompletionToggle } from '../../ui/CompletionToggle';
import { formatDueLabel, DUE_STYLES } from '../../../lib/homeMeta';

/** Tarefa do plano de ação: toque alterna, long-press/clique direito abre o menu contextual. */
export const TaskRow: React.FC<{ task: Task }> = ({ task }) => {
  const { courses } = useDataClientCourses();
  const { handleToggleTask } = useCoursesActions();
  const { openManageItem } = useNavValue();
  const handlers = useLongPress({
    onLongPress: () => openManageItem('task', task.id),
    onClick: () => handleToggleTask(task.id),
  });
  const courseName = courses.find((c) => c.id === task.disciplineId)?.name;
  const due = formatDueLabel(task.dueDate);

  return (
    <motion.div
      layout
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={getTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
      whileTap={{ scale: 0.98 }}
      {...handlers}
      className={`p-4 rounded-xl bg-surface-default border shadow-sm tap-interactive cursor-pointer flex items-center justify-between gap-3 ${
        task.completed
          ? 'opacity-60 bg-surface-muted border-ceci-border-subtle'
          : 'border-ceci-border-default hover:border-ceci-border-brand'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CompletionToggle
          checked={task.completed}
          onChange={() => handleToggleTask(task.id)}
          label={task.completed ? `marcar "${task.title}" como pendente` : `marcar "${task.title}" como concluída`}
        />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-ceci-muted' : 'text-ceci-primary'}`}>
            {task.title}
          </p>
          <p className={`text-[11px] mt-1 flex items-center gap-1.5 flex-wrap`}>
            {task.priority === 'alta' && !task.completed && (
              <span className="font-bold text-status-danger-strong">🔥 alta</span>
            )}
            <span className={DUE_STYLES[due.urgency]}>{due.label}</span>
            {courseName && <span className="text-ceci-muted">• {courseName}</span>}
          </p>
        </div>
      </div>

      <div className="w-9 h-9 rounded-xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-sm font-bold text-ceci-brand-strong shrink-0">
        ♡
      </div>
    </motion.div>
  );
};

/** Prova no bloco de atenção: leva à disciplina. Mesmo peso visual da tarefa. */
export const ExamRow: React.FC<{ examId: string }> = ({ examId }) => {
  const { exams, courses } = useDataClientCourses();
  const { handleNavigate } = useNavValue();
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;
  const course = courses.find((c) => c.id === exam.courseId);
  const due = formatDueLabel(exam.date);

  return (
    <motion.button
      layout
      animate={{ opacity: 1, y: 0 }}
      transition={getTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleNavigate('faculdade', undefined, exam.courseId)}
      className="w-full p-4 rounded-xl bg-surface-default border border-ceci-border-default shadow-sm hover:border-ceci-border-academic tap-interactive cursor-pointer flex items-center justify-between gap-3 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-ceci-academic-strong" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ceci-primary truncate">{exam.title}</p>
          <p className="text-[11px] mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-ceci-academic-strong">prova</span>
            <span className={DUE_STYLES[due.urgency]}>· {due.label}</span>
            {course && <span className="text-ceci-muted">• {course.name}</span>}
          </p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-ceci-muted shrink-0" />
    </motion.button>
  );
};