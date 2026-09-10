import { describe, it, expect } from 'vitest';
import { canonicalize } from '../canonicalJson';

/**
 * Test vectors compartilhados — a MESMA tabela é usada no lado Rust
 * (`cecistudy-rust/tests/golden_parity_test.rs`, Fase 1). Fonte:
 * `cecistudy-rust/docs/canonical-json-v1.md` seção 6.
 */
const VECTORS: Array<[unknown, string]> = [
  [null, 'null'],
  [true, 'true'],
  [42, '42'],
  [1.5, '1.5'],
  ['olá', '"olá"'],
  [[], '[]'],
  [{}, '{}'],
  [{ b: 1, a: 2 }, '{"a":2,"b":1}'],
  [{ nested: { z: null, y: true } }, '{"nested":{"y":true,"z":null}}'],
  [{ list: [3, 1, 2] }, '{"list":[3,1,2]}'],
  ['cafe\u0301', '"café"'],
  [{ a: undefined, b: null }, '{"b":null}'],
  [[undefined, 1], '[null,1]'],
  [{ date: '2026-09-10T15:30:00.000Z' }, '{"date":"2026-09-10T15:30:00.000Z"}'],
  [{ arr: [{ b: 2, a: 1 }] }, '{"arr":[{"a":1,"b":2}]}'],
  [1e21, '1e+21'],
  [0.00000123456789, '0.00000123456789'],
  [1e-7, '1e-7'],
  [123456789.123456789, '123456789.12345679'],
];

describe('canonicalize (canonical JSON v1)', () => {
  it.each(VECTORS)('produz %j → %s', (input, expected) => {
    expect(canonicalize(input)).toBe(expected);
  });

  it('ordena chaves recursivamente em objetos aninhados', () => {
    const input = { c: { f: 1, e: 2 }, a: { d: [3, 1], b: 2 } };
    expect(canonicalize(input)).toBe('{"a":{"b":2,"d":[3,1]},"c":{"e":2,"f":1}}');
  });

  it('normaliza strings NFC em qualquer profundidade', () => {
    const input = { nota: 'caf\u00e9', arr: ['telefone\u0301'] };
    expect(canonicalize(input)).toBe('{"arr":["telefoné"],"nota":"café"}');
  });

  it('preserva a ordem de itens de arrays (intencional)', () => {
    expect(canonicalize({ topics: ['ansiedade', 'medo', 'ansiedade'] })).toBe(
      '{"topics":["ansiedade","medo","ansiedade"]}'
    );
  });

  it('omite chaves undefined mas preserva null', () => {
    expect(canonicalize({ a: undefined, b: null, c: 0 })).toBe('{"b":null,"c":0}');
  });

  it('rejeita NaN/Infinity (invariante de domínio)', () => {
    expect(() => canonicalize({ x: NaN })).toThrow(/não finito/);
    expect(() => canonicalize(Infinity)).toThrow(/não finito/);
  });

  it('não escapa acentos/UTF-8 não-ASCII (como JSON.stringify)', () => {
    expect(canonicalize('á é í ó ú')).toBe('"á é í ó ú"');
    expect(canonicalize('💗')).toBe('"💗"');
  });
});