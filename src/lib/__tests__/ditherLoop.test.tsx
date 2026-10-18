/**
 * Contrato do loop controlado dos gráficos dithered
 * (spec-performance.md §7 Fase 5, aceites §5.4).
 *
 * O que este teste garante — com um harness que usa o PAR de hooks real
 * (`useCanvasSetup` + `useDitherLoop`), sem canvas 2d (jsdom não tem):
 *
 * - draw que não pede mais nada congela o loop (shimmer estável não é infinito);
 * - documento oculto ANTES do mount: **zero** rAF, zero frames (RNF-03);
 * - ficou oculto com frame pendente: o rAF é **cancelado**, nada mais é agendado;
 * - reativar: exatamente um frame (estático), sem retomar loop sem motivo;
 * - reduced-motion: nunca reagenda, mesmo quando o draw pede (garantia dura);
 * - `FrameStats.frames` acompanha tudo (o contador dev da F1).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { useCanvasSetup, useDitherLoop } from '../useCanvasSetup';
import { resetPerfForTests } from '../performance/perfMarks';

/** Harness: draw controlável via refs; expõe frameStats e scheduleFrame. */
let drawImpl: (now: number) => boolean;
let lastFrameStats: { frames: number; skipped: number } | null = null;
let externalSchedule: (() => void) | null = null;

function Harness() {
  const setup = useCanvasSetup();
  const { scheduleFrame, frameStats } = useDitherLoop((now) => drawImpl(now), setup);
  externalSchedule = scheduleFrame;
  lastFrameStats = frameStats;
  return <canvas ref={setup.canvasRef} data-testid="canvas" />;
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

let rafSpy: ReturnType<typeof vi.fn> | undefined;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  drawImpl = () => false;
  lastFrameStats = null;
  externalSchedule = null;
  resetPerfForTests();
  setVisibility('visible');
  // Conta sem substituir: o rAF falso (fake timers) agenda e o cancel
  // continua consistente (mesma família de timers).
  rafSpy = vi.spyOn(window, 'requestAnimationFrame');
});

afterEach(() => {
  rafSpy?.mockRestore();
  setVisibility('visible');
  vi.useRealTimers();
});

describe('useDitherLoop (spec §5.2)', () => {
  it('draw estável congela o loop: um frame e nada mais', async () => {
    drawImpl = () => false;
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 5);
    });
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(lastFrameStats?.frames).toBe(1);
  });

  it('draw pedindo mais continua o loop até parar de pedir', async () => {
    let frames = 0;
    drawImpl = () => ++frames < 3; // para depois do 3º frame
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 10);
    });
    expect(lastFrameStats?.frames).toBe(3);
    // Congelou depois que o draw parou de pedir.
    const after = rafSpy?.mock.calls.length ?? 0;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 5);
    });
    expect(rafSpy?.mock.calls.length).toBe(after);
  });

  it('documento oculto ANTES do mount: zero rAF, zero frames (RNF-03)', async () => {
    setVisibility('hidden');
    drawImpl = () => true;
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 5);
    });
    expect(rafSpy).not.toHaveBeenCalled();
    expect(lastFrameStats?.frames).toBe(0);
  });

  it('ocultou com frame pendente: rAF cancelado e nada mais é agendado', async () => {
    let frames = 0;
    drawImpl = () => ++frames < 10;
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 2);
    });
    const before = rafSpy?.mock.calls.length ?? 0;
    expect(before).toBeGreaterThan(0);

    await act(async () => {
      setVisibility('hidden'); // dispara o cancelamento do pendente
      await vi.advanceTimersByTimeAsync(16 * 10);
    });
    // Zero NOVOS agendamentos após ocultar.
    expect(rafSpy?.mock.calls.length).toBe(before);
    const framesWhenHidden = lastFrameStats?.frames;
    expect(framesWhenHidden).toBeLessThan(10);
  });

  it('reativou: exatamente um frame estático, sem retomar o loop', async () => {
    drawImpl = () => false;
    setVisibility('hidden');
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 3);
    });
    expect(rafSpy).not.toHaveBeenCalled();

    drawImpl = () => false; // dado estável: um frame e para
    await act(async () => {
      setVisibility('visible');
      await vi.advanceTimersByTimeAsync(16 * 5);
    });
    expect(lastFrameStats?.frames).toBe(1);
  });

  it('reduced-motion nunca reagenda, mesmo com draw pedindo (garantia dura)', async () => {
    // useCanvasSetup lê innerWidth no mount: <768px força reduced-motion.
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    try {
      drawImpl = () => true;
      render(<Harness />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(16 * 10);
      });
      expect(lastFrameStats?.frames).toBe(1); // um frame estático
      expect(rafSpy).toHaveBeenCalledTimes(1); // e NENHUM reagendamento
    } finally {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    }
  });

  it('scheduleFrame externo (mudança de dado/pointer) redesenha sem duplicar', async () => {
    drawImpl = () => false;
    render(<Harness />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16 * 2);
    });
    expect(lastFrameStats?.frames).toBe(1);

    await act(async () => {
      externalSchedule?.();
      externalSchedule?.(); // idempotente: um frame pendente no máximo
      await vi.advanceTimersByTimeAsync(16 * 3);
    });
    expect(lastFrameStats?.frames).toBe(2);
  });
});
