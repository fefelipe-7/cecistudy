import { describe, it, expect } from 'vitest';
import type { Course } from '@/types/entity';
import type { AcademicTerm } from '@/types';
import {
  activeCourseIds,
  activeCourses,
  archivedCourses,
  activeTermOf,
  coursesOfTerm,
  degreeProgress,
  gradeCourses,
  isArchived,
  semestersLeft,
  clampOrdinal,
  sortedTerms,
  MAX_TERM_ORDINAL,
} from '../termScope';

function term(over: Partial<AcademicTerm> = {}): AcademicTerm {
  return {
    id: 'trm-1',
    label: '6º semestre',
    ordinal: 6,
    status: 'ativo',
    startedAt: '2026-02-01',
    statusTransitionAt: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ...over,
  };
}

function course(id: string, over: Partial<Course> = {}): Course {
  return {
    id,
    name: `disciplina ${id}`,
    professor: 'prof',
    semester: '6º Semestre',
    schedule: [],
    color: '#fff',
    icon: 'Brain',
    termId: 'trm-1',
    ...over,
  } as Course;
}

const TERMS = [term({ id: 'trm-old', status: 'encerrado', endedAt: '2025-12-20' }), term()];

describe('lib/termScope — período', () => {
  it('activeTermOf devolve o período ativo', () => {
    expect(activeTermOf(TERMS)?.id).toBe('trm-1');
  });

  it('activeTermOf devolve null sem período ativo (app abre o wizard)', () => {
    expect(activeTermOf([])).toBeNull();
    expect(activeTermOf([term({ status: 'encerrado' })])).toBeNull();
  });

  it('sortedTerms ordena do mais recente ao mais antigo', () => {
    expect(sortedTerms(TERMS).map((t) => t.id)).toEqual(['trm-1', 'trm-old']);
  });
});

describe('lib/termScope — disciplina', () => {
  const COURSES = [
    course('c1'),
    course('c2', { status: 'arquivado' }),
    course('c3', { termId: 'trm-old' }),
    course('c4', { termId: null }),
  ];

  it('coursesOfTerm filtra pelo período', () => {
    expect(coursesOfTerm(COURSES, 'trm-old').map((c) => c.id)).toEqual(['c3']);
    expect(coursesOfTerm(COURSES, null)).toEqual([]);
  });

  it('activeCourses = ativa E do período ativo (a grade do "agora")', () => {
    const { courses, term } = activeCourses(COURSES, TERMS);
    expect(courses.map((c) => c.id)).toEqual(['c1']);
    expect(term?.id).toBe('trm-1');
  });

  it('activeCourses sem período ativo devolve lista vazia (não a grade inteira)', () => {
    expect(activeCourses(COURSES, []).courses).toEqual([]);
  });

  it('gradeCourses = só as ativas, independente do período', () => {
    expect(gradeCourses(COURSES).map((c) => c.id)).toEqual(['c1', 'c3', 'c4']);
  });

  it('archivedCourses pega as arquivadas (continuam pesquisáveis)', () => {
    expect(archivedCourses(COURSES).map((c) => c.id)).toEqual(['c2']);
  });

  it('isArchived: status arquivado OU período que não é o atual', () => {
    expect(isArchived(course('c2', { status: 'arquivado' }), TERMS)).toBe(true);
    expect(isArchived(course('c3', { termId: 'trm-old' }), TERMS)).toBe(true);
    expect(isArchived(course('c1'), TERMS)).toBe(false);
  });

  it('disciplina sem termId não é tratada como arquivada (escape hatch)', () => {
    expect(isArchived(course('c4', { termId: null }), TERMS)).toBe(false);
  });

  it('activeCourseIds monta o set para lookup em lista', () => {
    expect([...activeCourseIds(COURSES, TERMS)]).toEqual(['c1']);
  });
});

describe('lib/termScope — progresso da graduação', () => {
  it('degreeProgress fica em 0..100 (nunca passa de 100%)', () => {
    expect(degreeProgress(4, 8)).toBe(50);
    expect(degreeProgress(8, 8)).toBe(100);
    expect(degreeProgress(12, 8)).toBe(100);
    expect(degreeProgress(0, 8)).toBe(0);
    expect(degreeProgress(-5, 8)).toBe(0);
  });

  it('degreeProgress com total inválido devolve 0 (não NaN/Infinity na UI)', () => {
    expect(degreeProgress(3, 0)).toBe(0);
    expect(degreeProgress(3, NaN)).toBe(0);
  });

  it('semestersLeft nunca fica negativo (8º de 8 = 0, não -1)', () => {
    expect(semestersLeft(4, 8)).toBe(4);
    expect(semestersLeft(8, 8)).toBe(0);
    expect(semestersLeft(12, 8)).toBe(0);
    expect(semestersLeft(1, 0)).toBe(0);
  });

  it('clampOrdinal respeita o teto do curso e o máximo de 12', () => {
    expect(clampOrdinal(7, 8)).toBe(7);
    expect(clampOrdinal(9, 8)).toBe(8);
    expect(clampOrdinal(20, 8)).toBe(8);
    expect(clampOrdinal(0, 8)).toBe(1);
    expect(clampOrdinal(99, 99)).toBe(MAX_TERM_ORDINAL);
    expect(clampOrdinal('6', 8)).toBe(6);
  });
});
