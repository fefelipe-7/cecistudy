import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MobileAppProvider } from '../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '@/context/mobileApp';

/**
 * SPEC-M-026 D9 / I9 — o onboarding não zera a base.
 *
 * Protege o que nenhum outro gate protege: `completeOnboarding` já chamou
 * `applyDatabase(emptyDatabase())`, então numa reinstalação (onboarding depois
 * de restaurar o backup) ele apagava o dado recém-recuperado. O único caminho
 * que apaga tudo é `resetApp`.
 */
describe('completeOnboarding não apaga dado existente (SPEC-M-026 I9)', () => {
  it('preserva as tarefas já gravadas', () => {
    const { result } = renderHook(() => useMobileApp(), { wrapper: MobileAppProvider });

    act(() => {
      result.current.handleAddTask({
        id: 't1',
        title: 'capítulo 2',
        completed: false,
        priority: 'media',
        category: 'outro',
      });
    });
    expect(result.current.tasks).toHaveLength(1);

    act(() => {
      result.current.completeOnboarding({ name: 'Fê' });
    });

    expect(result.current.tasks.map((t) => t.id)).toEqual(['t1']);
    expect(result.current.onboarding.completed).toBe(true);
  });
});
