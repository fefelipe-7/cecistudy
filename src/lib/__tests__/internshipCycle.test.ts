import { describe, it, expect } from 'vitest';
import { derivedPhase } from '../internshipCycle';
import type { InternshipLog } from '../../types';

const base = (over: Partial<InternshipLog>): InternshipLog => ({
  id: 'ilog-1',
  type: 'estagio',
  date: '2026-09-02',
  hours: 1,
  activity: 'campo',
  reflections: '',
  ...over,
});

describe('derivedPhase', () => {
  it('supervisão e intervisão → supervisionar', () => {
    expect(derivedPhase(base({ type: 'supervisao' }))).toBe('supervisionar');
    expect(derivedPhase(base({ type: 'intervisao' }))).toBe('supervisionar');
  });

  it('preparou o campo → preparar', () => {
    expect(derivedPhase(base({ prepChecklist: ['material pronto'] }))).toBe('preparar');
  });

  it('com reflexão → refletir', () => {
    expect(derivedPhase(base({ reflections: 'percebi vínculo transferencial' }))).toBe('refletir');
  });

  it('sem sinais → registrar', () => {
    expect(derivedPhase(base({}))).toBe('registrar');
  });
});