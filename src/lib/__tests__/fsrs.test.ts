import { describe, it, expect } from 'vitest';
import {
  initCard,
  schedule,
  isDue,
  todayISO,
  isCardDue,
  daysUntilDue,
  nextDueLabel,
  cardCounts,
  legacyIntervalFor,
} from '../fsrs';

describe('fsrs', () => {
  it('initCard cria card novo com estado correto', () => {
    const c = initCard({ question: 'q', answer: 'a' });
    expect(c.question).toBe('q');
    expect(c.state).toBe('new');
    expect(c.due).toBe(todayISO());
  });

  it('schedule com Again reduz estabilidade', () => {
    const c = initCard({ stability: 5, difficulty: 5, due: todayISO() });
    const updated = schedule(c, 0, todayISO());
    expect(updated.lapses).toBe(1);
    expect(updated.stability).toBeLessThan(5);
    expect(updated.state).toBe('relearning');
  });

  it('schedule com Good aumenta estabilidade', () => {
    const c = initCard({ stability: 2, difficulty: 5, due: todayISO() });
    const updated = schedule(c, 2, todayISO());
    expect(updated.stability).toBeGreaterThan(2);
    expect(updated.state).toBe('review');
  });

  it('isDue funciona', () => {
    const c = { due: '2099-01-01' } as any;
    expect(isDue(c, '2026-09-22')).toBe(false);
    const c2 = { due: '2026-09-01' } as any;
    expect(isDue(c2, '2026-09-22')).toBe(true);
  });

  it('schedule define lastReviewed e lastInterval em toda revisão', () => {
    const c = initCard({ question: 'q', answer: 'a', lastReviewed: undefined });
    const updated = schedule(c, 3, '2026-09-22');
    expect(updated.lastReviewed).toBe('2026-09-22');
    expect(updated.reviews).toBe(1);
    expect(updated.lastInterval).toBeGreaterThanOrEqual(1);
    expect(updated.due > '2026-09-22').toBe(true);
  });

  describe('isCardDue', () => {
    it('usa due como fonte única (FSRS-first)', () => {
      expect(isCardDue({ due: '2026-09-22' } as any, '2026-09-22')).toBe(true);
      expect(isCardDue({ due: '2026-09-23' } as any, '2026-09-22')).toBe(false);
    });

    it('fallback legado: card sem due e sem lastReviewed está vencido', () => {
      expect(isCardDue({} as any, '2026-09-22')).toBe(true);
    });

    it('fallback legado: respeita intervalo por timesReviewed', () => {
      const card = { lastReviewed: '2026-09-21', timesReviewed: 1 } as any;
      // intervalo p/ 1 revisão = 3 dias; hoje é dia 1 → não venceu
      expect(isCardDue(card, '2026-09-22')).toBe(false);
      // ultrapassou o intervalo → venceu
      expect(isCardDue({ ...card, lastReviewed: '2026-09-18' }, '2026-09-22')).toBe(true);
    });
  });

  describe('daysUntilDue / nextDueLabel', () => {
    it('0 quando já vencido e rótulo "hoje"', () => {
      expect(daysUntilDue({ due: '2026-09-21' } as any, '2026-09-22')).toBe(0);
      expect(nextDueLabel({ due: '2026-09-21' } as any, '2026-09-22')).toBe('hoje');
    });
    it('1 quando vence amanhã', () => {
      expect(daysUntilDue({ due: '2026-09-23' } as any, '2026-09-22')).toBe(1);
      expect(nextDueLabel({ due: '2026-09-23' } as any, '2026-09-22')).toBe('amanhã');
    });
    it('n dias à frente', () => {
      expect(nextDueLabel({ due: '2026-10-01' } as any, '2026-09-22')).toBe('em 9 dias');
    });
    it('fallback legado sem due', () => {
      expect(daysUntilDue({ lastReviewed: '2026-09-21', timesReviewed: 1 } as any, '2026-09-22')).toBe(2);
    });
  });

  describe('cardCounts', () => {
    it('agrupa por estado FSRS; sem state conta como nova', () => {
      const counts = cardCounts([
        { state: 'new' } as any,
        { state: 'learning' } as any,
        { state: 'review' } as any,
        { state: 'relearning' } as any,
        {} as any,
      ]);
      expect(counts).toEqual({ news: 2, learning: 1, review: 1, relearning: 1 });
    });
  });

  describe('legacyIntervalFor', () => {
    it('clampa no último intervalo', () => {
      expect(legacyIntervalFor(0)).toBe(1);
      expect(legacyIntervalFor(1)).toBe(3);
      expect(legacyIntervalFor(20)).toBe(30);
    });
  });
});
