import { describe, it, expect } from 'vitest';
import { deriveCourseProgress } from '../courseProgress';
import type { Course } from '../../types';

const mkCourse = (extra: Partial<Course> = {}): Course =>
  ({
    id: 'c1',
    name: 'psicopatologia i',
    professor: '',
    semester: '6',
    schedule: [],
    color: '#E97891',
    icon: 'Brain',
    progress: 0,
    ...extra,
  }) as Course;

describe('deriveCourseProgress', () => {
  it('usa o override manual quando presente', () => {
    const course = mkCourse({ progressOverride: 42, attendance: { attended: 10, total: 10 } });
    expect(deriveCourseProgress(course)).toEqual({ value: 42, source: 'manual' });
  });

  it('sem sinais, o progresso derivado é 0', () => {
    expect(deriveCourseProgress(mkCourse())).toEqual({ value: 0, source: 'derived' });
  });

  it('deriva da frequência registrada', () => {
    const course = mkCourse({ attendance: { attended: 8, total: 10 } });
    expect(deriveCourseProgress(course)).toEqual({ value: 80, source: 'derived' });
  });

  it('deriva das provas concluídas', () => {
    const exams = [
      { courseId: 'c1', completed: true },
      { courseId: 'c1', completed: true },
      { courseId: 'c1', completed: false },
      { courseId: 'c2', completed: false },
    ];
    // 2/3 provas → 66,67% → 67
    expect(deriveCourseProgress(mkCourse(), { exams }).value).toBe(67);
  });

  it('satura aulas anotadas em 8', () => {
    const notes = Array.from({ length: 12 }, (_, i) => ({ courseId: 'c1' }));
    expect(deriveCourseProgress(mkCourse(), { classNotes: notes })).toEqual({
      value: 100,
      source: 'derived',
    });
  });

  it('combina sinais com pesos (frequência 3 · provas 2 · aulas 1)', () => {
    const course = mkCourse({ attendance: { attended: 10, total: 20 } }); // 0.5 × 3
    const exams = [{ courseId: 'c1', completed: true }]; // 1 × 2
    const classNotes = [{ courseId: 'c1' }]; // 1/8 × 1
    // (1.5 + 2 + 0.125) / 6 = 60.4… → 60
    expect(deriveCourseProgress(course, { exams, classNotes }).value).toBe(60);
  });

  it('ignora dados de outras disciplinas', () => {
    const result = deriveCourseProgress(mkCourse(), {
      exams: [{ courseId: 'c9', completed: true }],
      classNotes: [{ courseId: 'c9' }],
    });
    expect(result.value).toBe(0);
  });

  it('frequência com total 0 é ignorada', () => {
    expect(deriveCourseProgress(mkCourse({ attendance: { attended: 0, total: 0 } })).value).toBe(0);
  });
});
