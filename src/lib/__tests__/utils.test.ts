import { describe, expect, it } from 'vitest';
import { cn, copyToClipboard } from '../utils';

describe('cn()', () => {
  it('junta classes simples', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filtra falsy', () => {
    expect(cn('a', false && 'b', undefined, null, 0, 'c')).toBe('a c');
  });

  it('resolve conflitos de tailwind-merge', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('aceita objetos condicionais (clsx)', () => {
    expect(cn('base', { 'is-active': true, hidden: false })).toBe('base is-active');
  });
});

describe('copyToClipboard()', () => {
  it('retorna true quando a Clipboard API funciona', async () => {
    Object.assign(navigator, { clipboard: { writeText: async () => {} } });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    await expect(copyToClipboard('oi')).resolves.toBe(true);
  });

  it('cai no fallback e não lança quando não há clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    const result = await copyToClipboard('oi');
    expect(typeof result).toBe('boolean');
  });
});