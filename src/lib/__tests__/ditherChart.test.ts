import { describe, expect, it } from 'vitest';
import {
  smoothstep,
  clamp,
  hash,
  hexToRgba,
  formatCount,
  formatShortDate,
  buildDemoGrowthRanges,
  buildDemoDonutPeriods,
  DEMO_FUNNEL_STAGES,
  DEMO_FUNNEL_VARIANTS,
  DEMO_REVENUE_VARIANTS,
  CHART_PASTELS,
} from '../ditherChart';

describe('smoothstep()', () => {
  it('retorna 0 antes do intervalo e 1 depois', () => {
    expect(smoothstep(0, 1, -2)).toBe(0);
    expect(smoothstep(0, 1, 5)).toBe(1);
  });

  it('é 0.5 no ponto médio (simetria)', () => {
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(10, 20, 15)).toBe(0.5);
  });

  it('é monótona dentro do intervalo', () => {
    const a = smoothstep(0, 1, 0.2);
    const b = smoothstep(0, 1, 0.5);
    const c = smoothstep(0, 1, 0.9);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

describe('clamp()', () => {
  it('limita nos limites inferior e superior', () => {
    expect(clamp(3, 0, 10)).toBe(3);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('hash()', () => {
  it('é determinístico', () => {
    expect(hash(3, 7)).toBe(hash(3, 7));
  });

  it('fica dentro de [0, 1)', () => {
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        const h = hash(x, y);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThan(1);
      }
    }
  });

  it('produz variação entre células próximas', () => {
    const values = new Set([hash(1, 1), hash(1, 2), hash(2, 1), hash(2, 2)]);
    expect(values.size).toBe(4);
  });
});

describe('hexToRgba()', () => {
  it('converte hex 6 dígitos com alpha', () => {
    expect(hexToRgba('#E97891', 0.5)).toBe('rgba(233, 120, 145, 0.5)');
  });
});

describe('formatCount()', () => {
  it('formata com separador pt-BR', () => {
    expect(formatCount(1234)).toBe('1.234');
    expect(formatCount(9)).toBe('9');
  });
});

describe('formatShortDate()', () => {
  it('retorna dia + mês curto em pt-BR para offset 0 (hoje)', () => {
    const today = new Date();
    const expected = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    expect(formatShortDate(0)).toBe(expected);
  });

  it('respeita o offset de dias', () => {
    const ago = new Date();
    ago.setDate(ago.getDate() - 7);
    const expected = ago.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    expect(formatShortDate(7)).toBe(expected);
  });
});

describe('datasets demo', () => {
  it('buildDemoGrowthRanges gera 7/14/30/90 pontos', () => {
    const ranges = buildDemoGrowthRanges();
    expect(ranges.map((r) => r.label)).toEqual(['7d', '14d', '30d', '90d']);
    expect(ranges[0].data).toHaveLength(7);
    expect(ranges[2].data).toHaveLength(30);
    expect(ranges[0].dates).toHaveLength(7);
  });

  it('buildDemoDonutPeriods tem 4 períodos com 5 segmentos', () => {
    const periods = buildDemoDonutPeriods();
    expect(periods.map((p) => p.label)).toEqual(['semana', 'mês', 'trimestre', 'ano']);
    expect(periods[0].data).toHaveLength(5);
  });

  it('funil e revenue têm variantes coerentes', () => {
    expect(DEMO_FUNNEL_STAGES).toHaveLength(4);
    expect(DEMO_FUNNEL_VARIANTS).toHaveLength(2);
    expect(DEMO_REVENUE_VARIANTS).toHaveLength(2);
    expect(DEMO_REVENUE_VARIANTS[0].data).toHaveLength(7);
  });

  it('CHART_PASTELS tem 8 cores hex válidas', () => {
    expect(CHART_PASTELS).toHaveLength(8);
    CHART_PASTELS.forEach((c) => expect(c).toMatch(/^#[0-9A-F]{6}$/i));
  });
});
