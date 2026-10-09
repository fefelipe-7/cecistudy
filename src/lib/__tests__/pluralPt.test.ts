import { describe, it, expect } from 'vitest';
import { pluralPt, pluralWordPt } from '../pluralPt';

// Regressão U2: o padrão `{palavra}{n !== 1 ? 'ões' : ''}` renderiza "sessãoões",
// porque concatena "ões" na palavra já flexionada.

describe('pluralPt', () => {
  it('acerta o singular e o plural (regressão U2)', () => {
    expect(pluralPt(1, 'sessão', 'sessões')).toBe('1 sessão');
    expect(pluralPt(2, 'sessão', 'sessões')).toBe('2 sessões');
    expect(pluralPt(0, 'sessão', 'sessões')).toBe('0 sessões');
    expect(pluralPt(1, 'reflexão', 'reflexões')).toBe('1 reflexão');
    expect(pluralPt(3, 'reflexão', 'reflexões')).toBe('3 reflexões');
    expect(pluralPt(1, 'supervisão', 'supervisões')).toBe('1 supervisão');
    expect(pluralPt(5, 'supervisão', 'supervisões')).toBe('5 supervisões');
  });

  it('nunca produz "sessãoões"', () => {
    for (const n of [0, 1, 2, 7, 100]) {
      expect(pluralPt(n, 'sessão', 'sessões')).not.toContain('ãoões');
    }
  });

  it('pluralPt sem número devolve só a palavra', () => {
    expect(pluralWordPt(1, 'sessão', 'sessões')).toBe('sessão');
    expect(pluralWordPt(2, 'sessão', 'sessões')).toBe('sessões');
  });
});