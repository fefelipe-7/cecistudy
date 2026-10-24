/**
 * Contrato da splash de boot (spec-performance.md §7 Fase 2, §2.3).
 *
 * O que este teste garante (com o runBootPreload REAL, sem mock — os passos
 * são controlados por setStepImplForTests com gates):
 * - a splash NÃO sai antes de `criticalReady`, mesmo passado o tempo mínimo;
 * - a splash sai assim que `criticalReady`, SEM esperar as questões
 *   (grupo oportunistic ainda pendurado na saída);
 * - o teto de segurança registra o motivo (`boot-max-display-escape`) e
 *   libera a UI;
 * - StrictMode não executa o boot duas vezes (dedup de execução).
 */
import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BootSplash } from '../BootSplash';
import { resetBootPreloadForTests, setStepImplForTests } from '../../../lib/bootPreload';
import { readPerfForTests, resetPerfForTests } from '../../../lib/performance/perfMarks';

const MIN_DISPLAY_MS = 1600;
const MAX_DISPLAY_MS = 7000;
const FADE_MS = 450;

const ok = () => Promise.resolve();

let resolveUserDb: (() => void) | undefined;
let resolveQuestions: (() => void) | undefined;

/** Gate: só resolve quando o teste quiser — segura o grupo crítico. */
const gatedUserDb = (): Promise<void> =>
  new Promise((res) => {
    resolveUserDb = res;
  });

/** Gate: segura o grupo oportunistic (questões). */
const gatedQuestions = (): Promise<void> =>
  new Promise((res) => {
    resolveQuestions = res;
  });

beforeEach(() => {
  vi.useFakeTimers();
  resetBootPreloadForTests();
  resetPerfForTests();
  resolveUserDb = undefined;
  resolveQuestions = undefined;
  setStepImplForTests('user-db', gatedUserDb);
  setStepImplForTests('user-state', ok);
  setStepImplForTests('theme', ok);
  setStepImplForTests('route-prefetch', ok);
  setStepImplForTests('catalog-approaches', ok);
  setStepImplForTests('catalog-questions', gatedQuestions);
});

afterEach(() => {
  act(() => {
    resolveUserDb?.();
    resolveQuestions?.();
  });
  vi.useRealTimers();
});

describe('BootSplash — saída por criticalReady (spec §2.3)', () => {
  it('não sai antes do criticalReady, mesmo depois do tempo mínimo', async () => {
    render(<BootSplash />);
    // user-db (gate) pendurado: criticalReady é false.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS + 600);
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('saí por criticalReady sem esperar as questões (opportunistic)', async () => {
    render(<BootSplash />);
    // Flush inicial: deixa o boot chegar ao gate do user-db.
    await act(async () => {});

    await act(async () => {
      resolveUserDb?.();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS + 600);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FADE_MS + 100);
    });

    // Splash saiu com as questões AINDA penduradas.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(resolveQuestions).toBeDefined();
  });

  it('teto de segurança registra o motivo e libera a UI', async () => {
    render(<BootSplash />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MAX_DISPLAY_MS + 800);
    });
    // Splash em fade: o evento foi registrado e AINDA não foi flusheado
    // (o flush acontece na transição fade → done).
    const { events } = readPerfForTests();
    const escape = events.find((e) => e.name === 'boot-max-display-escape');
    expect(escape).toBeDefined();
    expect(escape?.detail).toMatchObject({ criticalReady: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FADE_MS + 100);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('StrictMode não executa o boot duas vezes (dedup de execução)', async () => {
    const spy = vi.fn(gatedUserDb);
    setStepImplForTests('user-db', spy);

    render(
      <StrictMode>
        <BootSplash />
      </StrictMode>,
    );
    // Flush inicial: o boot (único) chega ao gate.
    await act(async () => {});

    await act(async () => {
      resolveUserDb?.();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS + 600);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FADE_MS + 100);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
