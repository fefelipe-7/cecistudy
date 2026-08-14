import type { Task } from '../types';

/**
 * Decide se devemos celebrar ao alternar uma tarefa.
 * Só celebra quando a tarefa está sendo CONCLUÍDA (não desfeita) e isso faz
 * TODAS as tarefas ficarem concluídas (transição para 100%).
 * `tasks` deve ser o estado já com o toggle aplicado.
 */
export function shouldCelebrateTasks(tasks: Task[], toggledId: string): boolean {
  const toggled = tasks.find((t) => t.id === toggledId);
  if (!toggled || !toggled.completed) return false;
  return tasks.every((t) => t.completed);
}
