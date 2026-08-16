import { describe, expect, it } from 'vitest';
import { getDailyGoalMessage, getGreeting } from '../homeMeta';

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
