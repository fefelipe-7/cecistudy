/**
 * useSqliteState × writeQueue — integração em modo web (jsdom, storage REAL).
 *
 * O que este teste garante (spec-performance §7.3):
 * - 50 atualizações rápidas terminam no ÚLTIMO valor persistido;
 * - unmount com pendência debounced NÃO perde a última edição (o cleanup
 *   antigo descartava — bug fechado pela F5.3);
 * - flush explícito drena sem esperar o debounce (gatilho de visibilidade).
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSqliteState } from '../useSqliteState';
import { flushWriteQueue, resetWriteQueueForTests } from '../db/writeQueue';

const KEY = 'tasks';
const PREFIXED = `cecistudy_user_${KEY}`;

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.removeItem(PREFIXED);
  resetWriteQueueForTests();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.removeItem(PREFIXED);
  resetWriteQueueForTests();
});

describe('useSqliteState + writeQueue (web)', () => {
  it('50 atualizações rápidas resultam no último valor persistido', async () => {
    const { result } = renderHook(() => useSqliteState<number[]>(KEY, []));
    act(() => {
      for (let i = 1; i <= 50; i++) {
        result.current[1](i % 2 === 0 ? [i, i] : [i]);
      }
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(JSON.parse(localStorage.getItem(PREFIXED) ?? 'null')).toEqual([50, 50]);
  });

  it('unmount com pendência não perde a última edição (fila é dona da durabilidade)', async () => {
    const { result, unmount } = renderHook(() => useSqliteState<string[]>(KEY, []));
    act(() => {
      result.current[1](['editado-no-ultimo-instante']);
    });
    // Pendência ainda debounced (200 ms) quando o componente vai embora —
    // o cleanup antigo descartava; a fila agora escreve mesmo assim.
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(JSON.parse(localStorage.getItem(PREFIXED) ?? 'null')).toEqual([
      'editado-no-ultimo-instante',
    ]);
  });

  it('flush explícito drena sem esperar o debounce (gatilho de visibilidade)', async () => {
    const { result } = renderHook(() => useSqliteState<number[]>(KEY, []));
    act(() => {
      result.current[1]([7]);
    });
    await act(async () => {
      await flushWriteQueue(KEY);
    });
    expect(JSON.parse(localStorage.getItem(PREFIXED) ?? 'null')).toEqual([7]);
  });
});
