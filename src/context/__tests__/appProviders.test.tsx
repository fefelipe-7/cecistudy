import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MobileAppProvider } from '../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '@/context/mobileApp';

/**
 * Contrato da casca mobile (spec 07 §6.6): `useMobileApp()` expõe a superfície
 * `AppContextValue` compartilhada (dados + navegação + ações).
 */
describe('contrato mobile (AppContextValue)', () => {
  it('mobile expõe a superfície compartilhada do app', () => {
    const mobile = renderHook(() => useMobileApp(), { wrapper: MobileAppProvider }).result.current;

    expect(mobile.activeTab).toBe('home');
    expect(mobile.onboarding).toBeDefined();
    expect(mobile.courses).toEqual([]);
    expect(typeof mobile.handleNavigate).toBe('function');
    expect(typeof mobile.updateReminder).toBe('function');
  });

  it('useMobileApp lança fora do MobileAppProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useMobileApp())).toThrow('MobileAppProvider');
    spy.mockRestore();
  });
});