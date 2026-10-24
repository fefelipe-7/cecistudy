/**
 * Contrato dos gatilhos de sync de fundo (spec-performance.md §7 Fase 8).
 *
 * O que este teste garante:
 * - sem configuração ativa: nenhum timer/listener;
 * - com configuração: UM intervalo de 30 min + sync inicial de 1,5 s UMA vez
 *   (não após cada mudança de estado do provider — o callback é ref);
 * - trava `inFlight`: abertura/online/timer nunca concorrem localmente;
 * - `online` e `pagehide` disparam; `beforeunload` não é mais usado;
 * - limpar a configuração remove tudo;
 * - mudanças de estado (run de identidade nova a cada render) NÃO reinstalam
 *   o timer — o bug original era o efeito com deps largas.
 */
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SYNC_INTERVAL_MS, useBackgroundSyncTriggers } from '../useBackgroundSyncTriggers';

const INITIAL_DELAY_MS = 1500;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useBackgroundSyncTriggers (spec §7 Fase 8)', () => {
  it('sem configuração ativa: nenhum timer, nenhum sync', async () => {
    const run = vi.fn();
    const { rerender } = renderHook(({ cfg }) => useBackgroundSyncTriggers(cfg, run), {
      initialProps: { cfg: null as unknown },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SYNC_INTERVAL_MS * 2);
    });
    expect(run).not.toHaveBeenCalled();
    rerender({ cfg: null });
    expect(run).not.toHaveBeenCalled();
  });

  it('sync inicial UMA vez + intervalo de 30 min — run de identidade nova não reinstala', async () => {
    let calls = 0;
    const run = () => {
      calls += 1;
    };
    const { rerender } = renderHook(({ cfg, runner }) => useBackgroundSyncTriggers(cfg, runner), {
      initialProps: { cfg: { owner: 'a' }, runner: run as () => void },
    });

    // Provider "muda de estado" o tempo todo: run com identidade NOVA a cada
    // render — o timer não pode ser reinstalado por isso (deps = [config]).
    rerender({
      cfg: { owner: 'a' },
      runner: vi.fn(() => {
        calls += 1;
      }),
    });
    rerender({
      cfg: { owner: 'a' },
      runner: vi.fn(() => {
        calls += 1;
      }),
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INITIAL_DELAY_MS + 10);
    });
    expect(calls).toBe(1); // sync inicial, exatamente uma vez

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SYNC_INTERVAL_MS);
    });
    expect(calls).toBe(2); // +1 do intervalo (não resetou com os re-renders)
  });

  it('trava inFlight: sync em andamento bloqueia novos disparos até terminar', async () => {
    let resolveSync!: () => void;
    const run = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveSync = res;
        }),
    );
    renderHook(({ cfg }) => useBackgroundSyncTriggers(cfg, run), {
      initialProps: { cfg: { owner: 'a' } },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INITIAL_DELAY_MS + 10);
    });
    expect(run).toHaveBeenCalledTimes(1); // em andamento, não resolve

    // online + pagehide + 2 intervalos durante o sync: NADA concorre.
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('pagehide'));
      await vi.advanceTimersByTimeAsync(SYNC_INTERVAL_MS * 2);
    });
    expect(run).toHaveBeenCalledTimes(1);

    resolveSync();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SYNC_INTERVAL_MS);
    });
    expect(run).toHaveBeenCalledTimes(2); // retomou depois de liberar
  });

  it('online e pagehide disparam sync (beforeunload não é mais usado)', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(({ cfg }) => useBackgroundSyncTriggers(cfg, run), {
      initialProps: { cfg: { owner: 'a' } },
    });

    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();

    // Consome o sync inicial antes de disparar os eventos.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(INITIAL_DELAY_MS + 10);
    });
    expect(run).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('limpar a configuração remove timer e listeners', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ cfg }) => useBackgroundSyncTriggers(cfg, run), {
      initialProps: { cfg: { owner: 'a' } as unknown },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INITIAL_DELAY_MS + 10);
    });
    const baseline = run.mock.calls.length;
    expect(baseline).toBe(1);

    rerender({ cfg: null });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SYNC_INTERVAL_MS * 3);
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(run.mock.calls.length).toBe(baseline); // nada mais dispara
  });

  it('StrictMode não duplica gatilhos', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    renderHook(({ cfg }) => useBackgroundSyncTriggers(cfg, run), {
      initialProps: { cfg: { owner: 'a' } },
      wrapper: StrictMode,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(INITIAL_DELAY_MS + 10);
    });
    expect(run).toHaveBeenCalledTimes(1); // um único sync inicial
  });
});
