import { describe, expect, it } from 'vitest';
import {
  minutesBefore,
  planDailySummaries,
  planExamReminders,
  planInternshipReminders,
  planTaskReminders,
  NOTIFICATION_RANGES,
  type SummarySnapshot,
} from '../notifications';

/** now fixo: o planejador recebe o relógio, nunca lê `Date.now()`. */
const now = new Date(2026, 9, 23, 8, 0); // sexta, 23/10/2026, 08:00 local
const today = '2026-10-23';

describe('faixas de id (D2)', () => {
  it('não se sobrepõem e cobrem as seis famílias', () => {
    const ranges = Object.entries(NOTIFICATION_RANGES).sort((a, b) => a[1].base - b[1].base);
    expect(ranges.map(([family]) => family)).toEqual([
      'daily',
      'class',
      'thesis',
      'exam',
      'internship',
      'task',
    ]);
    for (let i = 1; i < ranges.length; i++) {
      const previous = ranges[i - 1][1];
      expect(ranges[i][1].base).toBeGreaterThanOrEqual(previous.base + previous.range);
    }
  });
});

describe('minutesBefore (D3)', () => {
  it.each([
    ['08:00', 7, 50],
    ['09:10', 9, 0],
    ['00:05', 23, 55],
    ['12:00', 11, 50],
  ])('%s → %i:%i', (start, hour, minute) => {
    expect(minutesBefore(start, 10)).toEqual({ hour, minute });
  });
});

describe('planExamReminders (D4)', () => {
  const prefs = { enabled: true, time: '19:00' };
  const exam = { id: 'ex-1', title: 'neuro', date: '2026-11-10' };

  it('agenda 7, 1 e 0 dias antes, no horário configurado', () => {
    const plan = planExamReminders([exam], prefs, '2026-10-01');
    expect(plan.map((p) => [p.id, p.when.getMonth() + 1, p.when.getDate(), p.when.getHours()])).toEqual([
      [4000, 11, 3, 19],
      [4001, 11, 9, 19],
      [4002, 11, 10, 19],
    ]);
  });

  it('no dia, usa a hora da prova menos 60 min e mantém o dia no alvo', () => {
    const plan = planExamReminders([{ ...exam, time: '08:00' }], prefs, '2026-10-01');
    const day0 = plan.find((p) => p.meta?.dias === 0)!;
    expect(day0.when.getHours()).toBe(7);
    expect(day0.when.getMinutes()).toBe(0);
    expect(day0.target).toEqual({ tab: 'calendario', entityId: 'ex-1', day: '2026-11-10' });
  });

  it('ignora prova concluída, passada ou fora da janela de hoje', () => {
    expect(planExamReminders([{ ...exam, completed: true }], prefs, '2026-10-01')).toEqual([]);
    expect(planExamReminders([exam], prefs, '2026-11-11')).toEqual([]);
    expect(planExamReminders([exam], { ...prefs, enabled: false }, '2026-10-01')).toEqual([]);
  });
});

describe('planInternshipReminders (D5)', () => {
  const prefs = { enabled: true, time: '18:00' };

  it('em dia útil sem registro, agenda um lembrete', () => {
    const plan = planInternshipReminders([], prefs, today, now);
    expect(plan).toHaveLength(1);
    expect(plan[0].id).toBe(5000);
    expect(plan[0].when.getHours()).toBe(18);
    expect(plan[0].target).toEqual({ tab: 'estagio' });
  });

  it('não agenda com registro no dia, fim de semana ou desligado', () => {
    expect(planInternshipReminders([{ date: today }], prefs, today, now)).toEqual([]);
    expect(planInternshipReminders([], prefs, '2026-10-24', now)).toEqual([]);
    expect(planInternshipReminders([], { ...prefs, enabled: false }, today, now)).toEqual([]);
  });
});

describe('planTaskReminders (D10)', () => {
  const prefs = { enabled: true, time: '19:00' };

  it('agenda véspera e dia do prazo, no horário configurado', () => {
    const plan = planTaskReminders(
      [{ id: 't-1', title: 'resenha', dueDate: '2026-10-25' }],
      prefs,
      today,
      now
    );
    expect(plan.map((p) => [p.id, p.when.getDate(), p.meta?.dias])).toEqual([
      [6000, 24, 1],
      [6001, 25, 0],
    ]);
    expect(plan[0].target).toEqual({ tab: 'home', entityId: 't-1' });
  });

  it('não agenda para concluída, sem prazo, prazo passado ou desligado', () => {
    expect(planTaskReminders([{ id: 't', title: 'x', dueDate: '2026-10-25', completed: true }], prefs, today, now)).toEqual([]);
    expect(planTaskReminders([{ id: 't', title: 'x' }], prefs, today, now)).toEqual([]);
    expect(planTaskReminders([{ id: 't', title: 'x', dueDate: '2026-10-22' }], prefs, today, now)).toEqual([]);
    expect(planTaskReminders([{ id: 't', title: 'x', dueDate: '2026-10-25' }], { ...prefs, enabled: false }, today, now)).toEqual([]);
  });

  it('prazo hoje e horário ainda por vir agenda só o dia', () => {
    const plan = planTaskReminders([{ id: 't', title: 'x', dueDate: today }], prefs, today, now);
    expect(plan).toHaveLength(1);
    expect(plan[0].meta?.dias).toBe(0);
  });
});

describe('planDailySummaries (D11)', () => {
  const snapshot: SummarySnapshot = {
    courses: [{ name: 'cálculo', schedule: [{ day: 1, start: '08:00' }] }],
    exams: [{ title: 'neuro', date: '2026-10-26' }],
    tasks: [{ title: 'resenha', dueDate: '2026-10-26' }],
    thesis: {
      chapters: [{ title: 'método', dueDate: '2026-10-26', stage: 'escrita' }],
      tasks: [{ title: 'revisar', dueDate: '2026-10-26', completed: false }],
    },
  };
  const prefs = { enabled: true, time: '19:00' };

  it('materializa 14 dias e limita o corpo a 4 linhas + restantes', () => {
    const plan = planDailySummaries(snapshot, prefs, '2026-10-26', new Date(2026, 9, 26, 8, 0));
    expect(plan).toHaveLength(14);
    expect(plan[0].id).toBe(1000);
    expect(plan[0].meta).toMatchObject({ restantes: 1, turno: 'tarde' });
    expect((plan[0].meta?.itens as unknown[]).length).toBe(4);
  });

  it('dia vazio cai na frase genérica, mas o resumo continua', () => {
    const empty: SummarySnapshot = { courses: [], exams: [], tasks: [], thesis: { chapters: [], tasks: [] } };
    const plan = planDailySummaries(empty, prefs, today, now);
    expect(plan).toHaveLength(14);
    expect(plan[0].meta).toMatchObject({ itens: [], restantes: 0 });
    expect(plan[0].bodyKey).toBe('resumoCorpo');
  });

  it('não agenda o dia cujo horário já passou e respeita o desligado', () => {
    const plan = planDailySummaries(snapshot, prefs, '2026-10-26', new Date(2026, 9, 26, 20, 0));
    expect(plan).toHaveLength(13);
    expect(planDailySummaries(snapshot, { ...prefs, enabled: false }, today, now)).toEqual([]);
  });
});
