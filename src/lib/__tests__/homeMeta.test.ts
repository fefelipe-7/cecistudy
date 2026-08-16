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
  it('gera frases específicas quando não há tarefas e quando só há provas', () => {
    expect(getDailyGoalMessage({ pendingTasks: 0, pendingExams: 0 })).toContain('hoje está mais leve');
    expect(getDailyGoalMessage({ pendingTasks: 0, pendingExams: 2 })).toContain('prova');
    expect(getDailyGoalMessage({ pendingTasks: 3, pendingExams: 0 })).toContain('tarefas');
    expect(getDailyGoalMessage({ pendingTasks: 3, pendingExams: 2 })).toContain('tudo');
  });
});
