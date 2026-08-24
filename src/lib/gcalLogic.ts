import type { Exam, Task, Course } from '../types';

/** Evento mínimo para a Google Calendar REST API (v3). */
export interface GcalEventInput {
  /** id determinístico (usado para upsert/delete idempotente). */
  id: string;
  summary: string;
  description?: string;
  start: string; // RFC3339
  end: string; // RFC3339
}

/**
 * Google exige id de evento com até 1024 chars e charset restrito
 * (letras, dígitos, - ou _). Mantemos um prefixo fixo + o id da entidade.
 */
export function eventIdFor(entityId: string): string {
  const safe = entityId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 900);
  return `ceci-${safe}`;
}

function courseNameOf(courses: Course[], courseId?: string): string | undefined {
  if (!courseId) return undefined;
  return courses.find((c) => c.id === courseId)?.name;
}

function toRfc3339(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toISOString();
}

export function buildEventForExam(exam: Exam, courses: Course[]): GcalEventInput {
  const course = courseNameOf(courses, exam.courseId);
  const summary = `prova — ${exam.title}${course ? ` (${course})` : ''}`;
  const start = toRfc3339(exam.date);
  const end = toRfc3339(new Date(new Date(exam.date).getTime() + 60 * 60 * 1000).toISOString());
  const topics = exam.topics?.length ? `\n\nassuntos: ${exam.topics.join(', ')}` : '';
  return {
    id: eventIdFor(`exam-${exam.id}`),
    summary,
    description: `avalição do cecistudy ♡${topics}`,
    start,
    end,
  };
}

export function buildEventForTask(task: Task, courses: Course[]): GcalEventInput {
  const course = courseNameOf(courses, task.disciplineId);
  const summary = `tarefa — ${task.title}${course ? ` (${course})` : ''}`;
  const start = task.dueDate ? toRfc3339(task.dueDate) : toRfc3339(new Date().toISOString());
  const end = toRfc3339(new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString());
  return {
    id: eventIdFor(`task-${task.id}`),
    summary,
    description: `entrega do cecistudy ♡`,
    start,
    end,
  };
}
