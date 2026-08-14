import { beforeEach, describe, expect, it } from 'vitest';
import { storage, STORAGE_PREFIX } from '../storage';

describe('storage (web / jsdom — caminho síncrono)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('grava e lê com o prefixo cecistudy_', () => {
    storage.setSync('courses', '[1,2,3]');
    expect(localStorage.getItem(STORAGE_PREFIX + 'courses')).toBe('[1,2,3]');
    expect(storage.getSync('courses')).toBe('[1,2,3]');
  });

  it('getSync retorna null para chave ausente', () => {
    expect(storage.getSync('nao-existe')).toBeNull();
  });

  it('set/remove funcionam de forma assíncrona também (wrapper)', async () => {
    await storage.set('profile', '{"name":"ceci"}');
    expect(storage.getSync('profile')).toBe('{"name":"ceci"}');
    await storage.remove('profile');
    expect(storage.getSync('profile')).toBeNull();
  });

  it('não quebra quando localStorage lança erro (sandbox)', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    expect(() => storage.setSync('k', 'v')).not.toThrow();
    expect(storage.getSync('k')).toBeNull();
    Storage.prototype.setItem = original;
  });
});