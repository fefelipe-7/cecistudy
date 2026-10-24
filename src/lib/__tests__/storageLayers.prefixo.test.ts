import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from '../usePersistentState';

/**
 * SPEC-M-026 D1 — dois donos, dois prefixos.
 *
 * `cecistudy_user_*` é dado da usuária (sobrevive à reinstalação);
 * `cecistudy_*` é estado do aparelho. Nenhum outro gate cobre o prefixo, e uma
 * chave de usuária gravada no prefixo do aparelho some na reinstalação sem
 * ninguém perceber.
 */
describe('prefixo de armazenamento (SPEC-M-026 D1)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('chave de usuária no prefixo antigo é lida e copiada para o novo', () => {
    localStorage.setItem('cecistudy_onboarding', JSON.stringify({ completed: true }));

    const { result } = renderHook(() =>
      usePersistentState('onboarding', { completed: false }, 'user'),
    );

    expect(result.current[0]).toEqual({ completed: true });
    expect(JSON.parse(localStorage.getItem('cecistudy_user_onboarding') ?? 'null')).toEqual({
      completed: true,
    });
  });

  it('namespace device grava em cecistudy_ e não vaza para o de usuária', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePersistentState('tema', 'campinho'));

    act(() => result.current[1]('rosa'));
    act(() => vi.advanceTimersByTime(300));
    vi.useRealTimers();

    expect(localStorage.getItem('cecistudy_tema')).toBe('"rosa"');
    expect(localStorage.getItem('cecistudy_user_tema')).toBeNull();
  });
});
