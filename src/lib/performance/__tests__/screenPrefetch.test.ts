/**
 * Contrato do prefetch com política (spec-performance.md §6.3 e §7 Fase 3).
 *
 * O que este teste garante:
 * - a política bloqueia prefetch em `saveData`, 2g/slow-2g e documento oculto;
 * - a fila deduplica por chave e respeita o limite de concorrência (1 padrão);
 * - intenção observável FURA a fila (navegação iminente);
 * - timeout é silêncio, não erro, e libera a chave para retry;
 * - mudança de rota cancela a fila pendente.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canPrefetch,
  requestPrefetch,
  prefetchOnIntent,
  cancelQueuedPrefetches,
  getPrefetchStateForTests,
  resetScreenPrefetchForTests,
} from '../screenPrefetch';

/** Instala/lê `navigator.connection` (Network Information API inexistente no jsdom). */
function setConnection(value: { saveData?: boolean; effectiveType?: string } | undefined): void {
  Object.defineProperty(navigator, 'connection', {
    value,
    configurable: true,
    writable: true,
  });
}

function setVisibility(value: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    value,
    configurable: true,
  });
}

beforeEach(() => {
  resetScreenPrefetchForTests();
  setConnection(undefined);
  setVisibility('visible');
});

afterEach(() => {
  setConnection(undefined);
  setVisibility('visible');
});

describe('canPrefetch (política §6.3)', () => {
  it('permite sem Network Information API (iOS) e com o documento visível', () => {
    expect(canPrefetch()).toBe(true);
  });

  it('bloqueia com saveData ativo', () => {
    setConnection({ saveData: true, effectiveType: '4g' });
    expect(canPrefetch()).toBe(false);
  });

  it('bloqueia em 2g e slow-2g; permite em 3g/4g', () => {
    setConnection({ effectiveType: '2g' });
    expect(canPrefetch()).toBe(false);
    setConnection({ effectiveType: 'slow-2g' });
    expect(canPrefetch()).toBe(false);
    setConnection({ effectiveType: '3g' });
    expect(canPrefetch()).toBe(true);
    setConnection({ effectiveType: '4g' });
    expect(canPrefetch()).toBe(true);
  });

  it('bloqueia com o documento oculto', () => {
    setVisibility('hidden');
    expect(canPrefetch()).toBe(false);
  });
});

describe('requestPrefetch (fila de baixa prioridade)', () => {
  it('deduplica por chave — mesma chave não entra duas vezes', async () => {
    const load = vi.fn().mockResolvedValue('ok');
    requestPrefetch('screen:biblioteca', load);
    requestPrefetch('screen:biblioteca', load);
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    expect(getPrefetchStateForTests().queued).toEqual([]);
  });

  it('respeita o limite de 1 simultâneo (sem 4g comprovada)', async () => {
    let resolveA!: () => void;
    const loadA = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveA = res;
        }),
    );
    const loadB = vi.fn().mockResolvedValue(undefined);

    requestPrefetch('screen:a', loadA);
    requestPrefetch('screen:b', loadB);

    await Promise.resolve(); // pump roda
    expect(loadA).toHaveBeenCalledTimes(1);
    expect(loadB).not.toHaveBeenCalled(); // B espera A terminar (limite 1)

    resolveA();
    await vi.waitFor(() => expect(loadB).toHaveBeenCalledTimes(1));
  });

  it('política bloqueia o enqueue: nada entra na fila com saveData', () => {
    setConnection({ saveData: true });
    const load = vi.fn().mockResolvedValue(undefined);
    requestPrefetch('screen:estudos', load);
    expect(getPrefetchStateForTests().queued).toEqual([]);
    expect(load).not.toHaveBeenCalled();
  });

  it('cancelQueuedPrefetches descarta a fila pendente (mudança de rota)', async () => {
    let resolveA!: () => void;
    const loadA = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveA = res;
        }),
    );
    const loadB = vi.fn().mockResolvedValue(undefined);

    requestPrefetch('screen:a', loadA);
    requestPrefetch('screen:b', loadB);
    await Promise.resolve(); // A começa; B fica na fila
    cancelQueuedPrefetches();

    resolveA();
    await vi.waitFor(() => expect(loadA).toHaveBeenCalledTimes(1));
    // A fila foi descartada: B nunca roda.
    expect(loadB).not.toHaveBeenCalled();
    expect(getPrefetchStateForTests().queued).toEqual([]);
  });

  it('timeout é silêncio e libera a chave para retry', async () => {
    vi.useFakeTimers();
    try {
      const never = () => new Promise(() => {});
      requestPrefetch('screen:lenta', never, { timeoutMs: 50 });
      await vi.advanceTimersByTimeAsync(80);
      expect(getPrefetchStateForTests().active).toBe(0);

      // Retry: a chave está livre e agora resolve.
      const ok = vi.fn().mockResolvedValue('x');
      requestPrefetch('screen:lenta', ok);
      await vi.advanceTimersByTimeAsync(10);
      expect(ok).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('prefetchOnIntent (intenção observável)', () => {
  it('fura o limite de concorrência — navegação iminente', async () => {
    let resolveA!: () => void;
    const loadA = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveA = res;
        }),
    );
    const loadB = vi.fn().mockResolvedValue(undefined);

    requestPrefetch('screen:a', loadA);
    await Promise.resolve();
    prefetchOnIntent('screen:b', loadB);

    expect(loadA).toHaveBeenCalledTimes(1);
    expect(loadB).toHaveBeenCalledTimes(1); // B começa SEM esperar A

    resolveA();
    await vi.waitFor(() => expect(getPrefetchStateForTests().active).toBe(0));
  });

  it('a política continua valendo na intenção: saveData bloqueia', () => {
    setConnection({ saveData: true });
    const load = vi.fn().mockResolvedValue(undefined);
    prefetchOnIntent('screen:faculdade', load);
    expect(load).not.toHaveBeenCalled();
  });

  it('sucesso marca a chave como carregada — sem repetição', async () => {
    const load = vi.fn().mockResolvedValue('x');
    prefetchOnIntent('screen:home', load);
    prefetchOnIntent('screen:home', load);
    await vi.waitFor(() => expect(getPrefetchStateForTests().loaded).toContain('screen:home'));
    expect(load).toHaveBeenCalledTimes(1);
  });
});
