import { describe, it, expect } from 'vitest';
import {
  MAX_TERM_ORDINAL,
  clampTermOrdinal,
  termLabel,
  createAcademicTerm,
  closeTerm,
  openTerm,
  reopenTerm,
  enforceSingleActiveTerm,
  assertTermIntegrity,
  resolveActiveTerm,
  resolveLatestClosedTerm,
  termsByRecency,
  shouldOfferRollover,
} from '../index';
import type { AcademicTerm, TermScopedCourse } from '../index';

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

const SUMMARY = {
  closedAt: '2026-06-30',
  courses: 5,
  archivedCourses: 1,
  carriedCourses: 4,
  classNotes: 32,
  tasksCompleted: 18,
  tasksCarriedOver: 3,
  readingsCompleted: 5,
  pagesRead: 412,
  focusMinutes: 1_240,
  loggedHours: 96,
  bestStreak: 21,
  grades: [{ courseId: 'c1', label: 'prova 1', grade: 8.5 }],
  highlights: ['32 aulas anotadas com carinho ♡'],
};

describe('core/domain — term: criação', () => {
  it('createAcademicTerm deriva label do ordinal e o status padrão é ativo', () => {
    const t = createAcademicTerm({ ordinal: 1, startedAt: '2026-02-01' });
    expect(t.label).toBe('1º semestre');
    expect(t.status).toBe('ativo');
    expect(t.id.startsWith('trm-')).toBe(true);
    expect(t.endedAt).toBeUndefined();
    expect(t.summary).toBeUndefined();
  });

  it('createAcademicTerm clampa o ordinal em 1..MAX_TERM_ORDINAL', () => {
    expect(clampTermOrdinal(0)).toBe(1);
    expect(clampTermOrdinal(-3)).toBe(1);
    expect(clampTermOrdinal(99)).toBe(MAX_TERM_ORDINAL);
    expect(clampTermOrdinal(NaN)).toBe(1);
    expect(clampTermOrdinal('4')).toBe(4);
    expect(clampTermOrdinal(3, 2)).toBe(2);
    expect(createAcademicTerm({ ordinal: 99, startedAt: '2026-02-01' }).ordinal).toBe(MAX_TERM_ORDINAL);
  });

  it('termLabel formata o rótulo no tom do app', () => {
    expect(termLabel(1)).toBe('1º semestre');
    expect(termLabel(8)).toBe('8º semestre');
  });
});

describe('core/domain — term: transições', () => {
  it('closeTerm encerra, data o fim e congela o summary', () => {
    const next = closeTerm([term()], 'trm-1', '2026-06-30', SUMMARY);
    expect(next[0].status).toBe('encerrado');
    expect(next[0].endedAt).toBe('2026-06-30');
    expect(next[0].summary).toEqual(SUMMARY);
  });

  it('closeTerm é idempotente (2ª chamada é no-op, mesma referência)', () => {
    const once = closeTerm([term()], 'trm-1', '2026-06-30', SUMMARY);
    const twice = closeTerm(once, 'trm-1', '2026-07-15', SUMMARY);
    expect(twice).toBe(once);
    expect(twice[0].endedAt).toBe('2026-06-30');
  });

  it('closeTerm não mexe em outro período e devolve o array original se nada mudou', () => {
    const terms = [term({ id: 'trm-1' }), term({ id: 'trm-2', status: 'planejado' })];
    expect(closeTerm(terms, 'trm-9', '2026-06-30')).toBe(terms);
  });

  it('status só avança: planejado → ativo → encerrado, e nunca volta sem reopenTerm', () => {
    const planned = [term({ status: 'planejado' })];
    const opened = openTerm(planned, 'trm-1', '2026-03-01T00:00:00.000Z');
    expect(opened[0].status).toBe('ativo');
    expect(opened[0].statusTransitionAt).toBe('2026-03-01T00:00:00.000Z');

    // encerrado → ativo via openTerm é recusado
    const closed = closeTerm(opened, 'trm-1', '2026-06-30', SUMMARY);
    expect(openTerm(closed, 'trm-1', '2026-07-01T00:00:00.000Z')).toBe(closed);

    // e a única volta é o reopenTerm explícito
    const reopened = reopenTerm(closed, 'trm-1', '2026-07-02T00:00:00.000Z');
    expect(reopened[0].status).toBe('ativo');
    // o resumo congelado é preservado (é o transcript, não se reescreve)
    expect(reopened[0].summary).toEqual(SUMMARY);
  });

  it('openTerm é idempotente', () => {
    const terms = [term()];
    expect(openTerm(terms, 'trm-1', '2026-03-01T00:00:00.000Z')).toBe(terms);
  });

  it('reopenTerm só mexe em encerrado', () => {
    const terms = [term({ status: 'planejado' })];
    expect(reopenTerm(terms, 'trm-1', '2026-07-02T00:00:00.000Z')).toBe(terms);
  });

  it('transições não mutam o array recebido', () => {
    const original = [term()];
    const snapshot = JSON.stringify(original);
    closeTerm(original, 'trm-1', '2026-06-30', SUMMARY);
    enforceSingleActiveTerm(original);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

describe('core/domain — term: invariante de um ativo só', () => {
  it('enforceSingleActiveTerm degrada para encerrado o ativo mais antigo', () => {
    const terms = [
      term({ id: 'trm-1', statusTransitionAt: '2026-01-01T00:00:00.000Z' }),
      term({ id: 'trm-2', statusTransitionAt: '2026-06-01T00:00:00.000Z' }),
    ];
    const next = enforceSingleActiveTerm(terms);
    expect(next.filter((t) => t.status === 'ativo').map((t) => t.id)).toEqual(['trm-2']);
    expect(next[0].status).toBe('encerrado');
    expect(next[0].endedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('enforceSingleActiveTerm é no-op com 0 ou 1 ativo', () => {
    const one = [term()];
    expect(enforceSingleActiveTerm(one)).toBe(one);
    const none = [term({ status: 'encerrado' })];
    expect(enforceSingleActiveTerm(none)).toBe(none);
  });

  it('enforceSingleActiveTerm é idempotente', () => {
    const terms = [
      term({ id: 'trm-1', statusTransitionAt: '2026-01-01T00:00:00.000Z' }),
      term({ id: 'trm-2', statusTransitionAt: '2026-06-01T00:00:00.000Z' }),
    ];
    const once = enforceSingleActiveTerm(terms);
    expect(enforceSingleActiveTerm(once)).toBe(once);
  });
});

describe('core/domain — term: integridade de órfãos', () => {
  const courses: TermScopedCourse[] = [
    { id: 'c1', termId: 'trm-1' },
    { id: 'c2', termId: 'trm-9' },
    { id: 'c3', termId: null },
    { id: 'c4', termId: 'trm-9', status: 'arquivado' },
  ];

  it('acha disciplina ativa fora do período ativo', () => {
    const { orphans, activeTermId } = assertTermIntegrity([term()], courses);
    expect(activeTermId).toBe('trm-1');
    expect(orphans.map((c) => c.id)).toEqual(['c2']);
  });

  it('termId null é escape hatch (disciplina avulsa não é órfã)', () => {
    const { orphans } = assertTermIntegrity([term()], [{ id: 'c3', termId: null }]);
    expect(orphans).toEqual([]);
  });

  it('disciplina arquivada de outro período não é órfã', () => {
    const { orphans } = assertTermIntegrity([term()], [{ id: 'c4', termId: 'trm-9', status: 'arquivado' }]);
    expect(orphans).toEqual([]);
  });

  it('sem período ativo, toda disciplina ativa é órfã', () => {
    const { orphans, activeTermId } = assertTermIntegrity([], [{ id: 'c1' }]);
    expect(activeTermId).toBeNull();
    expect(orphans.map((c) => c.id)).toEqual(['c1']);
  });
});

describe('core/domain — term: derivações', () => {
  it('resolveActiveTerm desempata por statusTransitionAt mais recente', () => {
    const terms = [
      term({ id: 'trm-1', statusTransitionAt: '2026-01-01T00:00:00.000Z' }),
      term({ id: 'trm-2', statusTransitionAt: '2026-06-01T00:00:00.000Z' }),
      term({ id: 'trm-3', status: 'encerrado', statusTransitionAt: '2026-09-01T00:00:00.000Z' }),
    ];
    expect(resolveActiveTerm(terms)?.id).toBe('trm-2');
  });

  it('resolveActiveTerm devolve null sem período ativo (app precisa abrir o wizard)', () => {
    expect(resolveActiveTerm([term({ status: 'encerrado' })])).toBeNull();
    expect(resolveActiveTerm([])).toBeNull();
  });

  it('resolveLatestClosedTerm usa endedAt', () => {
    const terms = [
      term({ id: 'trm-1', status: 'encerrado', endedAt: '2026-06-30' }),
      term({ id: 'trm-2', status: 'encerrado', endedAt: '2025-12-20' }),
    ];
    expect(resolveLatestClosedTerm(terms)?.id).toBe('trm-1');
  });

  it('termsByRecency ordena do mais recente ao mais antigo, sem mutar a entrada', () => {
    const terms = [
      term({ id: 'trm-1', status: 'encerrado', endedAt: '2025-12-20' }),
      term({ id: 'trm-2', status: 'encerrado', endedAt: '2026-06-30' }),
      // o ativo abriu depois do fechamento do anterior
      term({ id: 'trm-3', statusTransitionAt: '2026-07-01T00:00:00.000Z' }),
    ];
    expect(termsByRecency(terms).map((t) => t.id)).toEqual(['trm-3', 'trm-2', 'trm-1']);
    expect(terms.map((t) => t.id)).toEqual(['trm-1', 'trm-2', 'trm-3']);
  });
});

describe('core/domain — term: elegibilidade da virada', () => {
  it('oferece a virada quando o período já terminou', () => {
    const t = term({ status: 'encerrado', endedAt: '2026-06-30' });
    expect(shouldOfferRollover(t, '2026-07-05', 8)).toBe(true);
    expect(shouldOfferRollover(t, '2026-06-01', 8)).toBe(false);
  });

  it('oferece a virada quando o ordinal atingiu o total do curso', () => {
    expect(shouldOfferRollover(term({ ordinal: 8 }), '2026-03-01', 8)).toBe(true);
    expect(shouldOfferRollover(term({ ordinal: 6 }), '2026-03-01', 8)).toBe(false);
  });

  it('sem período ativo, não oferece (a usuária precisa começar um)', () => {
    expect(shouldOfferRollover(null, '2026-07-05', 8)).toBe(false);
  });
});
