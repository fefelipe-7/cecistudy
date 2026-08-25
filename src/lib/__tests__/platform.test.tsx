import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { initPlatformFlags } from '../platform';
import { SplitLayout } from '../../desktop/layouts/SplitLayout';

afterEach(cleanup);

describe('initPlatformFlags', () => {
  it('marca web quando não há ponte Tauri', () => {
    initPlatformFlags();
    expect(document.documentElement.dataset.platform).toBe('web');
  });

  it('marca desktop quando __TAURI_INTERNALS__ existe', async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    try {
      // platform.ts avalia `isDesktop` na importação — reimportamos o módulo
      // para o teste refletir a flag recém-definida.
      vi.resetModules();
      const { initPlatformFlags: fresh } = await import('../platform');
      fresh();
      expect(document.documentElement.dataset.platform).toBe('desktop');
    } finally {
      delete (window as any).__TAURI_INTERNALS__;
      vi.resetModules();
    }
  });

  it('?platform=desktop força a casca desktop sem ponte Tauri (preview localhost)', async () => {
    window.history.replaceState(null, '', '/?platform=desktop');
    try {
      vi.resetModules();
      const { initPlatformFlags: fresh, isDesktop: forcedDesktop } = await import('../platform');
      expect(forcedDesktop).toBe(true);
      fresh();
      expect(document.documentElement.dataset.platform).toBe('desktop');
    } finally {
      window.history.replaceState(null, '', '/');
      vi.resetModules();
    }
  });

  it('?platform=web força a casca mobile mesmo com ponte Tauri presente', async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    window.history.replaceState(null, '', '/?platform=web');
    try {
      vi.resetModules();
      const { isDesktop: forcedWeb } = await import('../platform');
      expect(forcedWeb).toBe(false);
    } finally {
      delete (window as any).__TAURI_INTERNALS__;
      window.history.replaceState(null, '', '/');
      vi.resetModules();
    }
  });
});

describe('SplitLayout', () => {
  it('renderiza mestre e detalhe lado a lado', () => {
    render(
      <SplitLayout
        master={<div>lista</div>}
        detail={<div>detalhe</div>}
        masterWidth={260}
      />
    );
    expect(screen.getByText('lista')).toBeTruthy();
    expect(screen.getByText('detalhe')).toBeTruthy();
  });
});
