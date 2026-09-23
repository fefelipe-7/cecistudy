import { describe, expect, it } from 'vitest';
import { initCard, schedule, ratingIntervals, shortInterval, RATING_LABELS, daysUntilDue } from '../fsrs';

describe('shortInterval — rótulo curto do próximo vencimento', () => {
  it('mapeia dias para formas amigáveis', () => {
    expect(shortInterval(0)).toBe('<1m');
    expect(shortInterval(1)).toBe('1d');
    expect(shortInterval(3)).toBe('3d');
    expect(shortInterval(6)).toBe('6d');
    expect(shortInterval(7)).toBe('1sem');
    expect(shortInterval(14)).toBe('2sem');
    expect(shortInterval(30)).toBe('1mês');
    expect(shortInterval(90)).toBe('3m');
  });
});

describe('ratingIntervals — preview dos 4 vereditos sem persistir', () => {
  it('devolve as 4 qualidades na ordem canônica', () => {
    const card = initCard({ id: 'c1' });
    const hints = ratingIntervals(card);
    expect(hints.map((h) => h.label)).toEqual(RATING_LABELS);
    expect(hints.map((h) => h.quality)).toEqual([0, 1, 2, 3]);
    expect(hints.every((h) => typeof h.interval === 'string' && h.interval.length > 0)).toBe(true);
  });

  it('cartão novo: todos os vereditos voltam logo (1d)', () => {
    const hints = ratingIntervals(initCard({ id: 'c1' }));
    expect(hints.map((h) => h.interval)).toEqual(['1d', '1d', '1d', '1d']);
  });

  it('forecasts são consistentes com o schedule (>= 1 dia, sem nunca "hoje")', () => {
    const reviewed = schedule(initCard({ id: 'c1' }), 3);
    const hints = ratingIntervals(reviewed).map((h) => ({
      quality: h.quality,
      days: daysUntilDue(schedule(reviewed, h.quality)),
    }));
    for (const { days } of hints) {
      expect(days).toBeGreaterThanOrEqual(1);
    }
    // as previsões seguem a ordem das qualidades no objeto de retorno
    expect(hints.map((h) => h.quality)).toEqual([0, 1, 2, 3]);
  });
});