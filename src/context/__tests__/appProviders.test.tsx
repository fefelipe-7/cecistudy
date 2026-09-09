import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MobileAppProvider } from '../../../apps/mobile/src/MobileAppProvider';
import { DesktopAppProvider } from '../../../apps/desktop/src/DesktopAppProvider';
import { useMobileApp } from '@/context/mobileApp';
import { useDesktopApp } from '@/context/desktopApp';
import type { DesktopSessionState } from '../../../apps/desktop/src/session/types';
import { emptyDesktopSession } from '../../../apps/desktop/src/desktopSessionState';

/**
 * Trava o contrato mobile/desktop (spec 06, B6/B7): o `AppContextValue` é
 * compartilhado e idêntico nas duas cascas. A casca desktop injeta, além do
 * `shellExtras`, o `DesktopSessionState` (estado visual de sessão — dono em
 * `apps/desktop`) + os handlers de painéis. A casca mobile NÃO recebe nenhum
 * desses campos desktop, então uma view compartilhada não consegue distinguir
 * a casca nem branchar por plataforma por engano.
 */
describe('contrato mobile/desktop', () => {
  it('mobile tem só o AppContextValue; desktop injeta shellExtras + DesktopSessionState + handlers', () => {
    const mobile = renderHook(() => useMobileApp(), { wrapper: MobileAppProvider }).result.current;
    const desktop = renderHook(() => useDesktopApp(), { wrapper: DesktopAppProvider }).result.current;

    const mobileKeys = new Set(Object.keys(mobile));
    const desktopKeys = new Set(Object.keys(desktop));

    // mobile NÃO tem nenhuma chave de sessão desktop nem shellExtras
    const mobileExtras = [...mobileKeys].filter((k) => !desktopKeys.has(k));
    expect(mobileExtras).toEqual([]);
    expect(mobile.shellExtras).toBeUndefined();

    // desktop é supertype: carrega tudo do AppContextValue + as chaves desktop
    for (const key of mobileKeys) {
      expect(desktopKeys.has(key)).toBe(true);
    }

    // extras do desktop = shellExtras + campos do DesktopSessionState + handlers de painel
    const sessionKeys = Object.keys(emptyDesktopSession());
    const handlerKeys = ['openKnowledgeGraph', 'closeKnowledgeGraph', 'openProjects', 'closeProjects', 'openInbox', 'closeInbox'];
    const expectedExtras = ['shellExtras', ...sessionKeys, ...handlerKeys].sort();
    const extras = [...desktopKeys].filter((k) => !mobileKeys.has(k)).sort();
    expect(extras).toEqual(expectedExtras);

    // shellExtras carrega a seção de atualização do desktop (Tauri)
    expect(desktop.shellExtras?.updateSection).toBeTypeOf('function');
  });

  it('abrir grafo na casca desktop não vaza para o AppContextValue (mobile continua sem isKnowledgeGraphOpen)', () => {
    const mobile = renderHook(() => useMobileApp(), { wrapper: MobileAppProvider }).result.current;
    expect('isKnowledgeGraphOpen' in mobile).toBe(false);
  });
});
