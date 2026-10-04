import { describe, it, expect } from 'vitest';
import { migrateSupervisionNotebook } from '../migrations';
import { LATEST_USER_VERSION, USER_SCHEMA_VERSION } from '../db/migrations';
import { USER_SCHEMA_VERSION as VERSAO_DO_CONTRATO } from '../../../packages/data/src/schema';
import type { InternshipLog, SupervisionNotebook } from '../../types';

describe('USER_SCHEMA_VERSION tem uma fonte só (débito C2)', () => {
  it('o valor reexportado é o de packages/data/src/schema.ts', () => {
    // Duas declarações independentes foram o que produziu o débito: uma valia 1
    // e a outra 3, e o envelope de backup carimbava a errada.
    expect(USER_SCHEMA_VERSION).toBe(VERSAO_DO_CONTRATO);
  });

  it('o valor do contrato é o último passo de migração registrado', () => {
    // Se alguém acrescentar um passo em `migrations.ts` e não subir a
    // constante do contrato, o backup passa a declarar menos do que a base tem.
    expect(VERSAO_DO_CONTRATO).toBe(LATEST_USER_VERSION);
  });

  it('a base da usuária está na v3, que é a que cria internship_clinical', () => {
    expect(LATEST_USER_VERSION).toBe(3);
  });
});

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
      type: 'estagio',
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
