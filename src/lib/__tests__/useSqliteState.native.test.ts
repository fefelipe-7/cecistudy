/**
 * useSqliteState — hidratação nativa (spec-performance §7 Fase 7, item F5.4).
 *
 * Cenário fechado aqui: a usuária edita ENQUANTO a hidratação do SQLite ainda
 * não chegou. Antes da F5 o write-through early-returnava (`hydrated=false`)
 * e a edição era perdida para sempre — e a hidratação ainda REVERTIA o estado
 * em memória ao valor do disco. Agora: a edição vence (LWW em memória), não é
 * revertida, e entra na fila assim que `hydrated` sinaliza.
 *
 * Módulos mockados: storage (nativo), userDb e normalize. A FILA é real.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const ctrl = {
    load: (): Promise<unknown> => Promise.resolve(undefined),
    save: (): Promise<void> => Promise.resolve(),
    saveCalls: [] as unknown[],
  };
  return ctrl;
});

vi.mock('../storage', () => ({
  STORAGE_PREFIX: 'cecistudy_',
  isNativePlatform: true,
  storage: {
    getSync: () => null,
    setSync: () => {},
    get: async () => null,
    set: async () => {},
    remove: async () => {},
  },
}));

vi.mock('../db/userDb', () => ({
  getUserDb: async () => ({ query: vi.fn() }),
}));

vi.mock('../db/normalize', () => ({
  isUserCollectionKey: () => true,
  loadCollection: () => h.load(),
  saveCollection: (_db: unknown, _key: string, value: unknown) => {
    h.saveCalls.push(value);
    return h.save();
  },
}));

import { useSqliteState } from '../useSqliteState';
import { resetWriteQueueForTests } from '../db/writeQueue';

beforeEach(() => {
  vi.useFakeTimers();
  resetWriteQueueForTests();
  h.saveCalls.length = 0;
  h.load = () => Promise.resolve(undefined);
  h.save = () => Promise.resolve();
});

afterEach(() => {
  vi.useRealTimers();
  resetWriteQueueForTests();
});

describe('useSqliteState — hidratação nativa (F5.4)', () => {
  it('mudança durante a hidratação não é revertida nem perdida', async () => {
    let resolveLoad!: (value: unknown) => void;
    h.load = () =>
      new Promise((res) => {
        resolveLoad = res;
      });

    const { result } = renderHook(() => useSqliteState<Array<{ id: string }>>('tasks', []));

    // Deixa a hidratação chegar até o load pendurado.
    await act(async () => {});

    // A usuária edita ANTES do disco chegar.
    act(() => {
      result.current[1]([{ id: 'edicao-rapida' }]);
    });

    // O disco chega com o valor antigo.
    act(() => {
      resolveLoad([{ id: 'valor-do-disco' }]);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    // Não revertida em memória...
    expect(result.current[0]).toEqual([{ id: 'edicao-rapida' }]);

    // ...e persistida pela fila quando `hydrated` sinaliza.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(h.saveCalls.length).toBeGreaterThan(0);
    expect(h.saveCalls[h.saveCalls.length - 1]).toEqual([{ id: 'edicao-rapida' }]);
  });

  it('sem edição durante a hidratação, o valor do disco é aplicado normalmente', async () => {
    h.load = () => Promise.resolve([{ id: 'valor-do-disco' }]);

    const { result } = renderHook(() => useSqliteState<Array<{ id: string }>>('tasks', []));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current[0]).toEqual([{ id: 'valor-do-disco' }]);
  });
});
