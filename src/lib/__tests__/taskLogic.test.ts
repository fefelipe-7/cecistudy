import { describe, expect, it } from 'vitest';
import { shouldCelebrateTasks } from '../taskLogic';
import type { Task } from '../../types';

const makeTask = (id: string, completed = false): Task => ({
  id,
  title: 'tarefa ' + id,
  disciplineId: 'c1',
  dueDate: '2026-08-15',
  completed,
  priority: 'media',
  category: 'trabalho',
});

describe('shouldCelebrateTasks', () => {
  it('celebra quando a última tarefa pendente é concluída', () => {
    const tasks = [makeTask('t1', true), makeTask('t2', true), makeTask('t3', true)];
    expect(shouldCelebrateTasks(tasks, 't3')).toBe(true);
  });

  it('não celebra quando ainda há tarefas pendentes', () => {
    const tasks = [makeTask('t1', true), makeTask('t2', true), makeTask('t3', false)];
    expect(shouldCelebrateTasks(tasks, 't2')).toBe(false);
  });

  it('não celebra quando a tarefa é desfeita (completed=false)', () => {
    const tasks = [makeTask('t1', true), makeTask('t2', true), makeTask('t3', false)];
    expect(shouldCelebrateTasks(tasks, 't1')).toBe(false);
  });

  it('não celebra para id inexistente', () => {
    const tasks = [makeTask('t1', true), makeTask('t2', true)];
    expect(shouldCelebrateTasks(tasks, 'nao-existe')).toBe(false);
  });

  it('não celebra em lista vazia', () => {
    expect(shouldCelebrateTasks([], 't1')).toBe(false);
  });
});
