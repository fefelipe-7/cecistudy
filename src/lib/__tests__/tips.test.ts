import { describe, it, expect } from 'vitest';
import { pickTip, daysUntil } from '../tips';

const TODAY = new Date(2026, 7, 24); // segunda, 24/08/2026
const inDays = (n: number) => {
  const d = new Date(2026, 7, 24 + n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

describe('daysUntil', () => {
  it('conta dias até a data', () => {
    expect(daysUntil(inDays(3), TODAY)).toBe(3);
    expect(daysUntil(inDays(0), TODAY)).toBe(0);
  });

  it('retorna null para data passada ou inválida', () => {
    expect(daysUntil(inDays(-1), TODAY)).toBeNull();
    expect(daysUntil(undefined, TODAY)).toBeNull();
    expect(daysUntil('não-é-data', TODAY)).toBeNull();
  });
});

describe('pickTip', () => {
  it('prioriza prova próxima', () => {
    const tip = pickTip({ nextExamDate: inDays(2), dueCards: 5 }, TODAY);
    expect(tip).toContain('prova');
  });

  it('cita cartões vencidos quando não há prova próxima', () => {
    const tip = pickTip({ dueCards: 5 }, TODAY);
    expect(tip).toContain('5 cartões');
  });

  it('usa singular com 1 cartão', () => {
    expect(pickTip({ dueCards: 1 }, TODAY)).toContain('1 cartão esperando');
  });

  it('menciona streak alta sem foco hoje', () => {
    const tip = pickTip({ streakDays: 6, focusMinutesToday: 0 }, TODAY);
    expect(tip).toContain('6 dias');
  });

  it('contexto vazio devolve dica padrão acolhedora', () => {
    const tip = pickTip({}, TODAY);
    expect(typeof tip).toBe('string');
    expect(tip.length).toBeGreaterThan(10);
  });

  it('é determinística', () => {
    const ctx = { pendingTasks: 4 };
    expect(pickTip(ctx, TODAY)).toBe(pickTip(ctx, TODAY));
    expect(typeof pickTip(ctx, new Date(2026, 7, 25))).toBe('string');
  });

  it('prova distante (mais de 7 dias) não dispara a dica de prova', () => {
    const tip = pickTip({ nextExamDate: inDays(20), dueCards: 3 }, TODAY);
    expect(tip).not.toContain('prova');
  });
});
