import type { ClassNote, Course } from '../types';

/**
 * Progresso da disciplina: derivado dos dados reais (frequência, provas,
 * aulas anotadas) com opção de ajuste manual via `progressOverride`.
 */

export interface CourseProgressDeps {
  /** Anotações de aula da disciplina. */
  classNotes?: Pick<ClassNote, 'courseId'>[];
  /** Provas da disciplina. */
  exams?: { courseId: string; completed: boolean }[];
}

export interface CourseProgressResult {
  /** Valor final 0–100 para exibição. */
  value: number;
  /** 'manual' quando há `progressOverride`; 'derived' caso contrário. */
  source: 'manual' | 'derived';
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Sinais disponíveis (cada um normalizado 0–1):
 * - frequência registrada (`course.attendance`) — peso 3
 * - provas concluídas / total de provas        — peso 2
 * - aulas anotadas (satura em 8 aulas)         — peso 1
 * Sem nenhum sinal, o progresso é 0.
 */
export function deriveCourseProgress(
  course: Course,
  deps: CourseProgressDeps = {}
): CourseProgressResult {
  if (typeof course.progressOverride === 'number') {
    return { value: clamp(course.progressOverride), source: 'manual' };
  }

  let weightedSum = 0;
  let totalWeight = 0;

  const { attendance } = course;
  if (attendance && attendance.total > 0) {
    weightedSum += (attendance.attended / attendance.total) * 3;
    totalWeight += 3;
  }

  const courseExams = (deps.exams ?? []).filter((e) => e.courseId === course.id);
  if (courseExams.length > 0) {
    const done = courseExams.filter((e) => e.completed).length;
    weightedSum += (done / courseExams.length) * 2;
    totalWeight += 2;
  }

  const noteCount = (deps.classNotes ?? []).filter((cl) => cl.courseId === course.id).length;
  if (noteCount > 0) {
    weightedSum += (Math.min(noteCount, 8) / 8) * 1;
    totalWeight += 1;
  }

  if (totalWeight === 0) return { value: 0, source: 'derived' };
  return { value: clamp((weightedSum / totalWeight) * 100), source: 'derived' };
}
