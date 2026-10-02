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
  allActiveCourses,
  isArchived,
  semestersLeft,
  clampOrdinal,
  sortedTerms,
  MAX_TERM_ORDINAL,
} from '../termScope';
import * as termScope from '../termScope';

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

  it('B16 (SPEC-006 D9): allActiveTerms expõe TODOS os ativos, não só um', () => {
    // `resolveActiveTerm` devolve **um** período — o mais recente. Com dois
    // `ativo` no banco (merge de dois dispositivos, import, ou o B2 já
    // aplicados), o histórico e o desfazer mostravam um "6º semestre" enquanto
    // o 7º também estava ativo: a usuária não conseguia enxergar nem corrigir
    // a inconsistência. `allActiveTerms` é a superfície que o card de
    // integridade e a ação de reabertura precisam.
    //
    // O acesso é por namespace + cast de propósito: o símbolo ainda não existe
    // (chega na F1), e assim o `tsc` do gate continua verde enquanto este teste
    // fica vermelho até a implementação.
    const allActiveTerms = (termScope as unknown as {
      allActiveTerms?: (terms: AcademicTerm[]) => AcademicTerm[];
    }).allActiveTerms;

    expect(typeof allActiveTerms).toBe('function');
    const withTwo = [
      term({ id: 'trm-a', ordinal: 6, statusTransitionAt: '2026-02-01T00:00:00.000Z' }),
      term({ id: 'trm-b', ordinal: 7, statusTransitionAt: '2026-07-01T00:00:00.000Z' }),
      term({ id: 'trm-c', ordinal: 8, status: 'encerrado', endedAt: '2026-12-20' }),
    ];
    // espelha o que a UI resolve: o ativo exibido é o mais recente
    expect(allActiveTerms?.(withTwo).map((t) => t.id)).toEqual(['trm-b', 'trm-a']);
    // e o termo com cardinalidade > 1 é o que dispara o aviso de integridade
    expect(allActiveTerms?.(withTwo)).toHaveLength(2);
    expect(allActiveTerms?.(TERMS)).toHaveLength(1);
    expect(allActiveTerms?.([])).toHaveLength(0);
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

  it('allActiveCourses = ativas de algum período ATIVO (c3 está num encerrado, c4 é órfã)', () => {
    // c1 = trm-1 (ativo) · c2 = arquivada · c3 = trm-old (encerrado) · c4 = sem termId
    expect(allActiveCourses(COURSES, TERMS).map((c) => c.id)).toEqual(['c1']);
  });

  it('allActiveCourses sem período ativo devolve vazio (não a grade inteira)', () => {
    expect(allActiveCourses(COURSES, [])).toEqual([]);
    expect(allActiveCourses(COURSES, [term({ status: 'encerrado' })])).toEqual([]);
  });

  it('allActiveCourses com DOIS ativos (conflito SPEC-006 D9) devolve a união', () => {
    const conflicted = [term(), term({ id: 'trm-2', ordinal: 7, status: 'ativo' })];
    expect(allActiveCourses([...COURSES, course('c5', { termId: 'trm-2' })], conflicted).map((c) => c.id))
      .toEqual(['c1', 'c5']);
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

  it('clampOrdinal respeita o teto GLOBAL de 12 (não o total do curso — SPEC-008 D3)', () => {
    // O contrato antigo era `1..min(12, total)`, e o teste afirmava
    // `clampOrdinal(9, 8) === 8`. Isso prendia a usuária que está no 9º de um
    // curso de 8, e o total não tinha editor para destravar.
    expect(clampOrdinal(7)).toBe(7);
    expect(clampOrdinal(9)).toBe(9);
    expect(clampOrdinal(20)).toBe(MAX_TERM_ORDINAL);
    expect(clampOrdinal(0)).toBe(1);
    expect(clampOrdinal(99)).toBe(MAX_TERM_ORDINAL);
    expect(clampOrdinal('6')).toBe(6);
    expect(clampOrdinal(undefined)).toBe(1);
  });
});
