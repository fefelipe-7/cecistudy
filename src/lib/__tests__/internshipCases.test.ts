import { describe, it, expect } from 'vitest';
import type { InternshipLog, DateKey } from '../../types';
import { deriveCases } from '../internshipCases';

// `deriveCases` foi para `packages/domain` (SPEC-009 §7) e a assinatura mudou:
// `today` é parâmetro, o retorno é `{ cases, orphans }`, `lastSessionDate` é a
// **maior data** (não a última por `sessionNumber`, regressão `F23`) e
// `pendingSupervision` vem do índice de vínculos, não de `!log.supervisionLogId`
// (regressão `F3`). Estes testes são o gate dessa troca.

const TODAY: DateKey = '2026-09-10';

const session = (over: Partial<InternshipLog> = {}): InternshipLog => ({
  id: 'ilog-1',
  type: 'atendimento_clinico',
  date: '2026-09-02',
  hours: 1,
  activity: 'atendimento clínico',
  reflections: 'reflexão',
  patient: 'AB',
  sessionNumber: 1,
  ...over,
});

describe('deriveCases (nova assinatura)', () => {
  it('vazio → nenhum caso e nenhum órfão', () => {
    expect(derive([])).toEqual({ cases: [], orphans: [] });
  });

  it('um paciente agrupa sessões e totaliza horas', () => {
    const { cases } = derive([
      session({ id: 'a', date: '2026-09-02', sessionNumber: 1, hours: 1 }),
      session({ id: 'b', date: '2026-09-09', sessionNumber: 2, hours: 2 }),
    ]);
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      patientKey: 'ab',
      patientLabel: 'AB',
      totalHours: 3,
      lastSessionDate: '2026-09-09',
      sessionsDone: 2,
    });
    expect(cases[0].logs).toHaveLength(2);
  });

  it('agrupa pacientes distintos, mais recente primeiro', () => {
    const { cases } = derive([
      session({ id: 'a', patient: 'AB', date: '2026-08-01' }),
      session({ id: 'b', patient: 'CD', date: '2026-09-09' }),
    ]);
    expect(cases.map((c) => c.patientKey)).toEqual(['cd', 'ab']);
  });

  it('NÃO normaliza a chave com trim+lower apenas: "M. S.", "ms" e "M.S" são o mesmo caso (D8)', () => {
    const { cases } = derive([
      session({ id: 'a', patient: 'M. S.' }),
      session({ id: 'b', patient: 'ms', date: '2026-09-09', sessionNumber: 2 }),
      session({ id: 'c', patient: 'M.S', date: '2026-09-16', sessionNumber: 3 }),
    ]);
    expect(cases).toHaveLength(1);
    expect(cases[0].patientKey).toBe('ms');
    expect(cases[0].logs).toHaveLength(3);
  });

  it('ignora não-atendimentos', () => {
    const { cases } = derive([
      session({ id: 'a' }),
      session({ id: 'x', type: 'supervisao', patient: undefined }),
    ]);
    expect(cases).toHaveLength(1);
  });

  it('atendimento SEM iniciais vira órfão, e some das pendências por caso (F9/D9)', () => {
    const { cases, orphans } = derive([
      session({ id: 'a', patient: 'AB' }),
      session({ id: 'b', patient: '', reflections: '' }),
    ]);
    expect(cases).toHaveLength(1);
    expect(orphans.map((l) => l.id)).toEqual(['b']);
  });

  it('lastSessionDate é a MAIOR data, não a última por sessão (regressão F23)', () => {
    // Sessão 1 em setembro, sessão 2 em agosto: a ordem por `sessionNumber` punha a
    // de agosto por último e a tela dizia "última sessão: agosto".
    const { cases } = derive([
      session({ id: 'a', sessionNumber: 1, date: '2026-09-09' }),
      session({ id: 'b', sessionNumber: 2, date: '2026-08-01' }),
    ]);
    expect(cases[0].lastSessionDate).toBe('2026-09-09');
  });

  it('pendingSupervision vem do índice de vínculos, não de supervisionLogId (regressão F3)', () => {
    const logs = [
      session({ id: 'at-1', reflections: '' }),
      // A sessão aponta para uma supervisão que NÃO existe: o modelo antigo
      // contava como supervisionada para sempre.
      session({ id: 'at-2', supervisionLogId: 'sup-fantasma', reflections: '' }),
      { ...session({ id: 'sup-1' }), type: 'supervisao' as const, date: '2026-09-08', discussedLogIds: ['at-1'] },
    ];
    const { cases } = derive(logs);
    expect(cases[0].pendingSupervision).toBe(1); // só at-2
  });

  it('registro agendado não conta como sessão feita nem nas horas', () => {
    const { cases } = derive([
      session({ id: 'a', date: '2026-09-09', hours: 2 }),
      session({ id: 'b', date: '2026-09-20', hours: 5, sessionNumber: 2 }),
    ]);
    expect(cases[0].sessionsDone).toBe(1);
    expect(cases[0].totalHours).toBe(2); // não 7 (D7)
    expect(cases[0].nextScheduledDate).toBe('2026-09-20');
    expect(cases[0].scheduledLogs).toHaveLength(1);
  });

  it('caso só com agendados vai para o topo, com progresso 0', () => {
    const { cases } = derive([
      session({ id: 'a', patient: 'AB', date: '2026-09-09' }),
      session({ id: 'b', patient: 'CD', date: '2026-09-30' }),
    ]);
    expect(cases[0].patientKey).toBe('cd');
    expect(cases[0].progress).toBe(0);
  });

  it('progress = supervisionadas / feitas, 0–100', () => {
    const { cases } = derive([
      session({ id: 'at-1', reflections: '' }),
      session({ id: 'at-2', date: '2026-09-09', sessionNumber: 2, reflections: '' }),
      {
        ...session({ id: 'sup-1' }),
        type: 'supervisao' as const,
        date: '2026-09-09',
        discussedLogIds: ['at-1'],
      },
    ]);
    expect(cases[0].sessionsSupervised).toBe(1);
    expect(cases[0].progress).toBe(50);
  });
});

const derive = (logs: InternshipLog[]) => deriveCases(logs, TODAY);