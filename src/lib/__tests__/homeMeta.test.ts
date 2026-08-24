import { describe, expect, it } from 'vitest';
import { getDailyGoalMessage, getGreeting, formatDueLabel } from '../homeMeta';

describe('getGreeting', () => {
  it('respeita o ciclo do dia, incluindo madrugada', () => {
    expect(getGreeting(new Date('2026-01-01T01:30:00'))).toBe('boa madrugada');
    expect(getGreeting(new Date('2026-01-01T09:30:00'))).toBe('bom dia');
    expect(getGreeting(new Date('2026-01-01T13:30:00'))).toBe('boa tarde');
    expect(getGreeting(new Date('2026-01-01T20:30:00'))).toBe('boa noite');
  });
});

describe('getDailyGoalMessage', () => {
  const DAY = new Date('2026-08-15T12:00:00');

  it('sem pendências fala de leveza, valendo para qualquer frase do conjunto', () => {
    for (let day = 1; day <= 31; day++) {
      const d = new Date(`2026-08-${String(day).padStart(2, '0')}T12:00:00`);
      expect(getDailyGoalMessage({ pendingTasks: 0, pendingExams: 0 }, d)).toMatch(
        /leve|tranquilo|descansar|correria|respira/
      );
    }
  });

  it('só provas menciona prova/provas, só tarefas menciona tarefa/tarefas', () => {
    for (let day = 1; day <= 31; day++) {
      const d = new Date(`2026-08-${String(day).padStart(2, '0')}T12:00:00`);
      expect(getDailyGoalMessage({ pendingTasks: 0, pendingExams: 2 }, d)).toMatch(/prova/);
      expect(getDailyGoalMessage({ pendingTasks: 3, pendingExams: 0 }, d)).toMatch(/tarefa/);
    }
  });

  it('cenário misto cita os dois números e os tipos', () => {
    for (let day = 1; day <= 31; day++) {
      const d = new Date(`2026-08-${String(day).padStart(2, '0')}T12:00:00`);
      const msg = getDailyGoalMessage({ pendingTasks: 3, pendingExams: 2 }, d);
      expect(msg).toContain('3');
      expect(msg).toContain('2');
      expect(msg).toMatch(/tarefa|prova/);
    }
  });

  it('é estável no mesmo dia (não varia a cada render)', () => {
    const a = getDailyGoalMessage({ pendingTasks: 3, pendingExams: 2 }, DAY);
    const b = getDailyGoalMessage({ pendingTasks: 3, pendingExams: 2 }, DAY);
    expect(a).toBe(b);
  });
});

describe('formatDueLabel', () => {
  const TODAY = new Date('2026-08-22T15:00:00');

  it('sem prazo é neutro', () => {
    expect(formatDueLabel(undefined, TODAY)).toEqual({ label: 'sem prazo', urgency: 'none' });
  });

  it('hoje e amanhã têm urgência própria', () => {
    expect(formatDueLabel('2026-08-22', TODAY)).toEqual({ label: 'vence hoje!', urgency: 'today' });
    expect(formatDueLabel('2026-08-23', TODAY)).toEqual({ label: 'amanhã', urgency: 'tomorrow' });
  });

  it('futuro próximo vira "em N dias"; longe vira data curta', () => {
    expect(formatDueLabel('2026-08-25', TODAY)).toEqual({ label: 'em 3 dias', urgency: 'soon' });
    expect(formatDueLabel('2026-08-29', TODAY)).toEqual({ label: 'em 7 dias', urgency: 'soon' });
    const far = formatDueLabel('2026-09-20', TODAY);
    expect(far.urgency).toBe('later');
    expect(far.label).toMatch(/20 de sep|20 set|set/);
  });

  it('prazo atrasado sinaliza vermelho', () => {
    expect(formatDueLabel('2026-08-21', TODAY)).toEqual({ label: 'atrasada desde ontem', urgency: 'overdue' });
    expect(formatDueLabel('2026-08-15', TODAY)).toEqual({ label: 'atrasada há 7 dias', urgency: 'overdue' });
  });

  it('data inválida cai no neutro com o valor cru', () => {
    expect(formatDueLabel('não-é-data', TODAY)).toEqual({ label: 'não-é-data', urgency: 'none' });
  });
});
