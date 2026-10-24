// Home — linha de tarefa pendente do bloco "sua atenção hoje" (MOD-001 / B.7).
// Extraída de `HomeView.tsx`. O que tem data vem do agregador e usa
// `CalendarEntryRow` (SPEC-024 D13); aqui fica só a tarefa sem prazo.
import React from 'react';
import { motion } from 'framer-motion';
import { getTransition } from '@/lib/motion';
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
