import { describe, it, expect } from 'vitest';
import { deriveCases } from '../internshipCases';
import type { InternshipLog } from '../../types';

const session = (over: Partial<InternshipLog>): InternshipLog => ({
  id: `ilog-${Math.random().toString(36).slice(2)}`,
  type: 'atendimento_clinico',
  date: '2026-09-02',
  hours: 1,
  activity: 'atendimento clínico',
  reflections: 'reflexão',
  patient: 'AB',
  sessionNumber: 1,
  ...over,
});

describe('deriveCases', () => {
  it('vazio → nenhum caso', () => {
    expect(deriveCases([])).toEqual([]);
  });

  it('um paciente agrupa sessões e totaliza horas', () => {
    const logs = [
      session({ date: '2026-09-02', sessionNumber: 1, hours: 1 }),
      session({ date: '2026-09-09', sessionNumber: 2, hours: 2 }),
    ];
    const cases = deriveCases(logs);
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      patientKey: 'ab',
      patientLabel: 'AB',
      totalHours: 3,
      lastSessionDate: '2026-09-09',
    });
    expect(cases[0].logs).toHaveLength(2);
  });

  it('agrupa pacientes distintos separadamente, mais recente primeiro', () => {
    const logs = [
      session({ patient: 'AB', date: '2026-08-01', id: 'a' }),
      session({ patient: 'CD', date: '2026-09-15', id: 'b' }),
    ];
    const cases = deriveCases(logs);
    expect(cases).toHaveLength(2);
    // CD tem última sessão mais recente → primeiro
    expect(cases[0].patientKey).toBe('cd');
    expect(cases[1].patientKey).toBe('ab');
  });

  it('ignora não-atendimentos e atendimentos sem paciente', () => {
    const logs = [
      session({ patient: 'AB' }),
      { ...session({ id: 'x' }), type: 'supervisao', patient: undefined } as InternshipLog,
      session({ patient: '', id: 'y' }),
    ];
    expect(deriveCases(logs)).toHaveLength(1);
  });

  it('computa pendências de reflexão e supervisão', () => {
    const withSup = session({ reflections: '', supervisionLogId: 'sup-1' });
    const noRefAndNoSup = session({ reflections: '', id: 'b' });
    const ok = session({ id: 'c' });
    const cases = deriveCases([withSup, noRefAndNoSup, ok]);
    expect(cases[0]).toMatchObject({
      pendingReflection: 2, // withSup (sem reflexão) + b (sem reflexão)
      pendingSupervision: 2, // b + c (sem supervisionLogId)
    });
  });
});