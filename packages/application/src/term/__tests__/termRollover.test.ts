import { describe, it, expect } from 'vitest';
import {
  buildTermSummary,
  buildHighlights,
  planTermRollover,
  undoTermRollover,
  gradeCourses,
} from '../rollover';
import type { TermAttendanceInput, TermCourseDecisions, TermSummaryInput } from '../rollover';
import type { AcademicTerm, TermScopedCourse } from '../../../../../src/core/domain';

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

function course(id: string, over: Partial<TermScopedCourse> & { attendance?: TermAttendanceInput } = {}): TermScopedCourse & { attendance?: TermAttendanceInput } {
  return { id, termId: 'trm-1', status: 'ativo', ...over };
}

const INPUT: TermSummaryInput = {
  courses: [
    course('c1', {
      attendance: {
        records: [
          { status: 'presente', hours: 2 },
          { status: 'presente', hours: 2 },
          { status: 'falta' },
        ],
        baseHoursDone: 10,
      },
    }),
    course('c2'),
  ],
  classNotes: [
    { courseId: 'c1' },
    { courseId: 'c1' },
    { courseId: 'c2', rating: 5 },
    { courseId: 'c9' }, // fora do escopo: não conta
  ],
  tasks: [
    { disciplineId: 'c1', completed: true },
    { disciplineId: 'c1', completed: false },
    { disciplineId: 'c2', completed: true },
    { completed: true }, // sem disciplina: não conta
  ],
  exams: [
    { courseId: 'c1', title: 'prova 1', completed: true, grade: 8.5 },
    { courseId: 'c1', title: 'prova 2', completed: false },
    { courseId: 'c2', title: 'trabalho', completed: true },
  ],
  readings: [
    { courseId: 'c1', status: 'concluido', readPages: 200 },
    { courseId: 'c2', status: 'lendo', readPages: 80 },
    { status: 'concluido', readPages: 999 }, // sem curso: fora do escopo
  ],
  sessions: [
    { courseId: 'c1', durationMinutes: 90 },
    { courseId: 'c1', durationMinutes: 30 },
    { courseId: 'c2', durationMinutes: 60 },
    { durationMinutes: 999 },
  ],
  bestStreak: 21,
};

describe('application/term — buildTermSummary', () => {
  it('recorta tudo por herança de courseId (o escopo do período)', () => {
    const s = buildTermSummary(INPUT, '2026-06-30');
    expect(s.courses).toBe(2);
    expect(s.classNotes).toBe(3);
    expect(s.tasksCompleted).toBe(2);
    expect(s.tasksCarriedOver).toBe(1);
    expect(s.readingsCompleted).toBe(1);
    expect(s.pagesRead).toBe(280);
    expect(s.focusMinutes).toBe(180);
  });

  it('soma as horas registradas de verdade (presentes com hours + base)', () => {
    // 2 + 2 (registros presentes) + 10 (base) = 14
    expect(buildTermSummary(INPUT, '2026-06-30').loggedHours).toBe(14);
  });

  it('congela só as avaliações concluídas, com nota quando existe', () => {
    const s = buildTermSummary(INPUT, '2026-06-30');
    expect(s.grades).toEqual([
      { courseId: 'c1', label: 'prova 1', grade: 8.5 },
      { courseId: 'c2', label: 'trabalho' },
    ]);
  });

  it('é pura: mesmas entradas → mesma saída (sem Date.now dentro)', () => {
    const a = buildTermSummary(INPUT, '2026-06-30');
    const b = buildTermSummary(INPUT, '2026-06-30');
    expect(a).toEqual(b);
    expect(a.closedAt).toBe('2026-06-30');
  });

  it('conta as disciplinas que continuaram', () => {
    const s = buildTermSummary({ ...INPUT, carriedCourseIds: ['c1'] }, '2026-06-30');
    expect(s.carriedCourses).toBe(1);
  });

  it('período vazio gera frase de acolhimento em vez de lista vazia', () => {
    const empty: TermSummaryInput = {
      courses: [],
      classNotes: [],
      tasks: [],
      exams: [],
      readings: [],
      sessions: [],
      bestStreak: 0,
    };
    const s = buildTermSummary(empty, '2026-06-30');
    expect(s.highlights).toHaveLength(1);
    expect(s.highlights[0]).toContain('calma');
    expect(s.classNotes).toBe(0);
  });

  it('bestStreak negativo/NaN não vira métrica negativa', () => {
    expect(buildTermSummary({ ...INPUT, bestStreak: -3 }, '2026-06-30').bestStreak).toBe(0);
    expect(buildTermSummary({ ...INPUT, bestStreak: NaN }, '2026-06-30').bestStreak).toBe(0);
  });
});

describe('application/term — highlights no tom do app', () => {
  it('gera frases minúsculas com as métricas reais', () => {
    const out = buildHighlights({
      closedAt: '2026-06-30',
      courses: 5,
      archivedCourses: 1,
      carriedCourses: 4,
      classNotes: 32,
      tasksCompleted: 18,
      tasksCarriedOver: 3,
      readingsCompleted: 5,
      pagesRead: 412,
      focusMinutes: 1240,
      loggedHours: 96,
      bestStreak: 21,
      grades: [],
    });
    expect(out).toContain('5 disciplinas com o seu cuidado ♡');
    expect(out).toContain('32 aulas anotadas com carinho');
    expect(out).toContain('412 páginas lidas no seu tempo ♡');
    expect(out).toContain('20h40 de foco dedicado ♡');
    expect(out).toContain('96h de aula registrada');
    expect(out).toContain('melhor sequência: 21 dias 🔥');
    // copy em minúsculas (regra de voz do app)
    expect(out.every((h) => h === h.toLowerCase() || /\d/.test(h))).toBe(true);
  });

  it('singular/plural não ficam esquisitos', () => {
    const out = buildHighlights({
      closedAt: '2026-06-30',
      courses: 1,
      archivedCourses: 0,
      carriedCourses: 1,
      classNotes: 1,
      tasksCompleted: 1,
      tasksCarriedOver: 0,
      readingsCompleted: 0,
      pagesRead: 0,
      focusMinutes: 25,
      loggedHours: 0,
      bestStreak: 0,
      grades: [],
    });
    expect(out).toContain('1 disciplina com o seu cuidado ♡');
    expect(out).toContain('1 aula anotada com carinho');
    expect(out).toContain('1 tarefa cumprida — já conta ♡');
    expect(out).toContain('25 min de foco dedicado ♡');
  });
});

describe('application/term — planTermRollover', () => {
  const courses = [course('c1'), course('c2'), course('c3'), course('c4', { termId: null })];

  it('encerra o período ativo e abre o próximo com o resumo congelado', () => {
    const plan = planTermRollover({
      terms: [term()],
      courses,
      decisions: {},
      summaryInput: { ...INPUT, courses: [course('c1'), course('c2')] },
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
    });

    const closed = plan.terms.find((t) => t.id === 'trm-1');
    expect(closed?.status).toBe('encerrado');
    expect(closed?.endedAt).toBe('2026-06-30');
    expect(closed?.summary).toBeDefined();

    const next = plan.terms.find((t) => t.id === 'trm-2');
    expect(next?.status).toBe('ativo');
    expect(next?.ordinal).toBe(7);
    expect(next?.label).toBe('7º semestre');
    expect(next?.startedAt).toBe('2026-06-30');
  });

  it('não toca em disciplina fora do período (termId null é escape hatch)', () => {
    const plan = planTermRollover({
      terms: [term()],
      courses,
      decisions: {},
      summaryInput: INPUT,
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
    });
    const c4 = plan.courses.find((c) => c.id === 'c4');
    expect(c4?.termId).toBeNull();
    expect(c4?.status).toBe('ativo');
  });

  it('aplica as 3 decisões: continuar muda de período, arquivar sai da grade, depois fica', () => {
    const decisions: TermCourseDecisions = { c2: 'arquivar', c3: 'depois' };
    const plan = planTermRollover({
      terms: [term()],
      courses: [course('c1'), course('c2'), course('c3')],
      decisions,
      summaryInput: INPUT,
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
    });

    const byId = new Map(plan.courses.map((c) => [c.id, c]));
    expect(byId.get('c1')).toEqual({ id: 'c1', termId: 'trm-2', status: 'ativo' });
    expect(byId.get('c2')).toEqual({ id: 'c2', termId: 'trm-1', status: 'arquivado' });
    expect(byId.get('c3')).toEqual({ id: 'c3', termId: 'trm-1', status: 'ativo' });

    expect(plan.diff).toMatchObject({ carry: ['c1'], archive: ['c2'], undecided: ['c3'] });
  });

  it('default é continuar (disciplina sem decisão migra)', () => {
    const plan = planTermRollover({
      terms: [term()],
      courses: [course('c1')],
      decisions: {},
      summaryInput: INPUT,
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
    });
    expect(plan.courses[0].termId).toBe('trm-2');
  });

  it('diff conta as pendências adiadas do passo 3', () => {
    const plan = planTermRollover({
      terms: [term()],
      courses: [course('c1')],
      decisions: {},
      summaryInput: INPUT,
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
      pendingDecisions: {
        tasks: [
          { id: 't1', completed: false, carry: 'adiar' },
          { id: 't2', completed: false, carry: 'adiar' },
          { id: 't3', completed: false, carry: 'deixar' },
        ],
        readings: [{ id: 'r1', status: 'lendo', carry: 'adiar' }],
        cards: [],
      },
    });
    expect(plan.diff).toMatchObject({ carriedTasks: 2, carriedReadings: 1, carriedCards: 0 });
  });

  it('não muta as entradas e é determinístico', () => {
    const terms = [term()];
    const input = { terms, courses, decisions: {}, summaryInput: INPUT, newTermId: 'trm-2', closedAt: '2026-06-30', now: '2026-06-30T12:00:00.000Z' };
    const snapshot = JSON.stringify({ terms, courses });
    const a = planTermRollover(input);
    const b = planTermRollover(input);
    expect(JSON.stringify({ terms, courses })).toBe(snapshot);
    expect(a).toEqual(b);
  });

  it('recusa sem período ativo (a usuária precisa começar um primeiro)', () => {
    expect(() =>
      planTermRollover({
        terms: [],
        courses: [],
        decisions: {},
        summaryInput: INPUT,
        newTermId: 'trm-2',
        closedAt: '2026-06-30',
        now: '2026-06-30T12:00:00.000Z',
      }),
    ).toThrow(/período ativo/);
  });

  it('o próximo ordinal respeita o teto informado (e o clamp de 12)', () => {
    const at = (ordinal: number) =>
      planTermRollover({
        terms: [term({ ordinal })],
        courses: [],
        decisions: {},
        summaryInput: INPUT,
        newTermId: 'trm-2',
        nextOrdinal: ordinal + 1,
        closedAt: '2026-06-30',
        now: '2026-06-30T12:00:00.000Z',
      }).terms.find((t) => t.id === 'trm-2')?.ordinal;
    expect(at(5)).toBe(6);
    expect(at(12)).toBe(12);
  });
});

describe('application/term — undoTermRollover', () => {
  it('reabre o período anterior, remove o novo e devolve as disciplinas', () => {
    const terms = [term()];
    const courses = [course('c1'), course('c2')];
    const decisions: TermCourseDecisions = { c2: 'arquivar' };
    const plan = planTermRollover({
      terms,
      courses,
      decisions,
      summaryInput: INPUT,
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
    });

    const back = undoTermRollover({
      terms: plan.terms,
      courses: plan.courses,
      plan,
      originalTermIds: { c1: 'trm-1', c2: 'trm-1' },
      now: '2026-07-01T00:00:00.000Z',
    });

    expect(back.terms.map((t) => t.id)).toEqual(['trm-1']);
    expect(back.terms[0].status).toBe('ativo');
    expect(back.terms[0].statusTransitionAt).toBe('2026-07-01T00:00:00.000Z');
    // o resumo congelado sobrevive ao undo (é o registro do que foi encerrado)
    expect(back.terms[0].summary).toBeDefined();

    const byId = new Map(back.courses.map((c) => [c.id, c]));
    expect(byId.get('c1')).toEqual({ id: 'c1', termId: 'trm-1', status: 'ativo' });
    expect(byId.get('c2')).toEqual({ id: 'c2', termId: 'trm-1', status: 'ativo' });
  });

  it('virada + desfazer é round-trip do estado das disciplinas', () => {
    const courses = [course('c1'), course('c2'), course('c3')];
    const plan = planTermRollover({
      terms: [term()],
      courses,
      decisions: { c2: 'arquivar', c3: 'depois' },
      summaryInput: INPUT,
      newTermId: 'trm-2',
      closedAt: '2026-06-30',
      now: '2026-06-30T12:00:00.000Z',
    });
    const back = undoTermRollover({
      terms: plan.terms,
      courses: plan.courses,
      plan,
      originalTermIds: { c1: 'trm-1', c2: 'trm-1', c3: 'trm-1' },
      now: '2026-07-01T00:00:00.000Z',
    });
    expect(back.courses).toEqual(courses);
  });
});

describe('application/term — gradeCourses', () => {
  it('só o que está ativo aparece na grade', () => {
    expect(gradeCourses([course('c1'), course('c2', { status: 'arquivado' })]).map((c) => c.id)).toEqual(['c1']);
  });
});
