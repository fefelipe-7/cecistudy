import { describe, it, expect, vi, afterEach } from 'vitest';
import { REVIEW_INTERVALS, intervalFor, daysSince, isDueToday } from '../review';

afterEach(() => {
  vi.useRealTimers();
});

describe('intervalFor', () => {
  it('retorna os intervalos na ordem por nº de revisões', () => {
    expect(REVIEW_INTERVALS).toEqual([1, 3, 7, 14, 30]);
    expect(intervalFor(0)).toBe(1);
    expect(intervalFor(1)).toBe(3);
    expect(intervalFor(2)).toBe(7);
    expect(intervalFor(3)).toBe(14);
    expect(intervalFor(4)).toBe(30);
  });

  it('satura no último intervalo para valores altos', () => {
    expect(intervalFor(5)).toBe(30);
    expect(intervalFor(99)).toBe(30);
  });

  it('default (sem argumento) trata como nunca revisado', () => {
    expect(intervalFor()).toBe(1);
  });
});

describe('daysSince', () => {
  it('calcula dias inteiros desde a data ISO', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00'));
    expect(daysSince('2026-08-23T00:00:00')).toBe(0);
    expect(daysSince('2026-08-22T00:00:00')).toBe(1);
    expect(daysSince('2026-08-16T00:00:00')).toBe(7);
  });

  it('data futura resulta em negativo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00'));
    expect(daysSince('2026-08-25T00:00:00')).toBe(-2);
  });
});

describe('isDueToday', () => {
  it('cartão nunca revisado está sempre vencido', () => {
    expect(isDueToday({})).toBe(true);
    expect(isDueToday({ timesReviewed: 3 })).toBe(true);
  });

  it('dentro do intervalo não está vencido', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00'));
    // revisado ontem, intervalo de 3 dias → ainda vale
    expect(isDueToday({ lastReviewed: '2026-08-22T10:00:00', timesReviewed: 1 })).toBe(false);
  });

  it('intervalo completado fica vencido', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00'));
    // revisado há 4 dias com intervalo de 3 → vencido
    expect(isDueToday({ lastReviewed: '2026-08-19T10:00:00', timesReviewed: 1 })).toBe(true);
    // revisado há exatamente 1 dia com intervalo de 1 → vencido
    expect(isDueToday({ lastReviewed: '2026-08-22T12:00:00', timesReviewed: 0 })).toBe(true);
  });
});
