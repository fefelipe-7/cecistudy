import { describe, it, expect } from 'vitest';
import { eventIdFor, buildEventForExam, buildEventForTask } from '../gcalLogic';
import type { Exam, Task } from '../../types';

describe('eventIdFor', () => {
  it('prefixa e saneia caracteres inválidos', () => {
    expect(eventIdFor('e-1')).toBe('ceci-e-1');
    expect(eventIdFor('a@b/c')).toBe('ceci-a_b_c');
  });
});

describe('buildEventForExam', () => {
  const courses = [{ id: 'c1', name: 'psicopatologia' }] as any;
  const exam: Exam = {
    id: 'e1',
    courseId: 'c1',
    title: 'prova 1',
    date: '2026-09-01T14:00:00.000Z',
    topics: ['ansiedade'],
    completed: false,
  } as Exam;
  it('monta resumo com matéria e assuntos', () => {
    const ev = buildEventForExam(exam, courses);
    expect(ev.id).toBe('ceci-exam-e1');
    expect(ev.summary).toContain('psicopatologia');
    expect(ev.description).toContain('ansiedade');
    expect(ev.start).toBe('2026-09-01T14:00:00.000Z');
  });
});

describe('buildEventForTask', () => {
  const task: Task = {
    id: 't1',
    title: 'ler artigo',
    dueDate: '2026-09-02T00:00:00.000Z',
  } as Task;
  it('usa dueDate como início', () => {
    const ev = buildEventForTask(task, []);
    expect(ev.id).toBe('ceci-task-t1');
    expect(ev.summary).toContain('ler artigo');
    expect(ev.start).toBe('2026-09-02T00:00:00.000Z');
  });
});
