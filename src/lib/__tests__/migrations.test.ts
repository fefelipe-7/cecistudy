import { describe, it, expect } from 'vitest';
import { migrateSupervisionNotebook } from '../migrations';
import type { InternshipLog, SupervisionNotebook } from '../../types';

describe('migrateSupervisionNotebook', () => {
  const notebook: SupervisionNotebook = {
    id: 'sup-1',
    date: '2026-09-01',
    supervisor: 'Maria',
    questions: ['caso de ansiedade'],
    conceptIds: ['con-1'],
    referenceIds: ['ref-1'],
    nextSteps: ['revisar capítulo'],
    selfAssessment: { confidence: 'boas hipóteses', limits: 'medo de errar' },
    beforeNotes: 'hipóteses iniciais',
    afterNotes: 'decidimos orientação',
  };

  it('concatena cadernos legados como logs de supervisão', () => {
    const base: InternshipLog = {
      id: 'ilog-1',
      type: 'atendimento_clinico',
      date: '2026-09-02',
      hours: 1,
      activity: 'atendimento',
      reflections: '',
    };
    const result = migrateSupervisionNotebook([base], [notebook]);

    expect(result).toHaveLength(2);
    const sup = result[1];
    expect(sup.id).toBe('sup-1');
    expect(sup.type).toBe('supervisao');
    expect(sup.date).toBe('2026-09-01');
    expect(sup.hours).toBe(0);
    expect(sup.supervisor).toBe('Maria');
    expect(sup.topics).toEqual(['caso de ansiedade']);
    expect(sup.nextSteps).toEqual(['revisar capítulo']);
    expect(sup.referenceIds).toEqual(['ref-1']);
    expect(sup.beforeNotes).toBe('hipóteses iniciais');
    expect(sup.afterNotes).toBe('decidimos orientação');
    expect(sup.selfAssessment?.confidence).toBe('boas hipóteses');
  });

  it('preserva os logs existentes quando não há caderno legado', () => {
    const base: InternshipLog = {
      id: 'ilog-1',
      type: 'estagio',
      date: '2026-09-02',
      hours: 2,
      activity: 'campo',
      reflections: '',
    };
    const result = migrateSupervisionNotebook([base], []);
    expect(result).toEqual([base]);
  });
});
