import { describe, expect, it } from 'vitest';
import { smoothstep, clamp, hash } from '../ditherChart';

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


