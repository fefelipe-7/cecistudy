import { describe, it, expect } from 'vitest';
import {
  formatPairCode,
  generatePairCode,
  isValidPairCode,
  normalizePairCode,
  parseQrPayload,
  qrPayloadFor,
} from '../pairing';

describe('pairing', () => {
  it('gera códigos válidos e formatados', () => {
    for (let i = 0; i < 20; i++) {
      const code = generatePairCode();
      expect(code).toHaveLength(6);
      expect(isValidPairCode(code)).toBe(true);
      expect(formatPairCode(code)).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    }
  });

  it('normaliza entrada com separadores/minúsculas', () => {
    expect(normalizePairCode('abc-def')).toBe('ABCDEF');
    expect(normalizePairCode('8f4k 29a')).toBe('8F4K29A');
  });

  it('rejeita códigos inválidos', () => {
    expect(isValidPairCode('ABC')).toBe(false);
    expect(isValidPairCode('ABCDE0')).toBe(false); // 0 não está no alfabeto
    expect(isValidPairCode('')).toBe(false);
  });

  it('QR payload round-trip', () => {
    const code = 'ABC234';
    const parsed = parseQrPayload(qrPayloadFor(code, 'computador'));
    expect(parsed).toBe('ABC234');
  });

  it('rejeita payloads estranhos', () => {
    expect(parseQrPayload('https://exemplo.com')).toBeNull();
    expect(parseQrPayload('cecistudy://sync?c=curto')).toBeNull();
    expect(parseQrPayload('qualquer texto')).toBeNull();
  });
});
