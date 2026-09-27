import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * `canvas-confetti` (celebrações) não funciona no jsdom: `getContext('2d')`
 * devolve `null` e o loop de `requestAnimationFrame` estoura em
 * `clearRect` DEPOIS do teste terminar — o vitest contabiliza como
 * "unhandled error" e o processo sai com código 1 mesmo com 100% dos testes
 * passando. Nenhum teste afirma comportamento de confete, então deixamos o
 * módulo inerte (`celebrate` continua sendo exercitada, só sem o efeito).
 * O mock cobre o `import()` dinâmico feito em `src/lib/celebrate.ts`.
 */
vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { create: vi.fn(() => vi.fn()) }),
}));

/**
 * Node 26 expõe um global `localStorage` experimental (undefined) que ofusca o do jsdom,
 * e em alguns ambientes o `window.localStorage` do jsdom também não é instanciado.
 * Garante um `localStorage` funcional (web, síncrono) para os testes:
 * reutiliza o do jsdom quando existe; senão instala um polyfill em memória.
 */
class MemoryStorage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

function installWebStorage(): void {
  const real = typeof window !== 'undefined' ? window.localStorage : undefined;
  if (real) {
    Object.defineProperty(globalThis, 'localStorage', { value: real, configurable: true });
    return;
  }

  const store = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
  Object.defineProperty(globalThis, 'Storage', { value: MemoryStorage, configurable: true });

  if (typeof window !== 'undefined') {
    try {
      Object.defineProperty(window, 'localStorage', { value: store, configurable: true });
    } catch {
      /* some jsdom versions forbid redefining window.localStorage */
    }
  }
}

installWebStorage();

afterEach(() => {
  cleanup();
});
