import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DesktopSessionProvider, useDesktopSession, emptyDesktopSession } from '../desktopSessionState';

/**
 * T10: dono do estado visual de sessão desktop (spec 06). O `DesktopSessionState`
 * vive exclusivamente aqui (apps/desktop) e nunca vaza para o AppContext mobile.
 */
describe('desktopSessionState (dono)', () => {
  it('emptyDesktopSession traz defaults de UI desktop', () => {
    const s = emptyDesktopSession();
    expect(s.sidebarCollapsed).toBe(false);
    expect(s.inspectorOpen).toBe(true);
    expect(s.canvasClarity).toBe('calmo');
    expect(s.density).toBe('conforto');
    expect(s.isKnowledgeGraphOpen).toBe(false);
    expect(s.isProjectsOpen).toBe(false);
    expect(s.isInboxOpen).toBe(false);
  });

  it('patch mescla campos visuais sem perder o resto', () => {
    const { result } = renderHook(() => useDesktopSession(), {
      wrapper: DesktopSessionProvider,
    });
    expect(result.current.session.sidebarCollapsed).toBe(false);

    act(() => result.current.patch({ sidebarCollapsed: true, inspectorOpen: false }));
    expect(result.current.session.sidebarCollapsed).toBe(true);
    expect(result.current.session.inspectorOpen).toBe(false);
    // campos não tocados permanecem
    expect(result.current.session.density).toBe('conforto');
  });

  it('handlers de painel alternam os flags de sessão', () => {
    const { result } = renderHook(() => useDesktopSession(), {
      wrapper: DesktopSessionProvider,
    });
    act(() => result.current.patch({ isKnowledgeGraphOpen: true }));
    expect(result.current.session.isKnowledgeGraphOpen).toBe(true);
    act(() => result.current.patch({ isKnowledgeGraphOpen: false }));
    expect(result.current.session.isKnowledgeGraphOpen).toBe(false);
  });
});
