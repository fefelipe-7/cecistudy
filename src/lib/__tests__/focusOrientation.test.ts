import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isLandscapeViewport,
  releaseFocusOrientation,
  requestFocusLandscape,
} from '../focusOrientation';

const ORIG_INNER_WIDTH = window.innerWidth;
const ORIG_INNER_HEIGHT = window.innerHeight;

function setViewport(w: number, h: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: w });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: h });
}

function mockOrientation(orientation: unknown) {
  Object.defineProperty(window.screen, 'orientation', {
    configurable: true,
    value: orientation,
  });
}

afterEach(() => {
  setViewport(ORIG_INNER_WIDTH, ORIG_INNER_HEIGHT);
  mockOrientation(undefined);
});

describe('focusOrientation (chrome landscape do foco)', () => {
  it('isLandscapeViewport reflete a proporção da janela', () => {
    setViewport(800, 400);
    expect(isLandscapeViewport()).toBe(true);
    setViewport(400, 800);
    expect(isLandscapeViewport()).toBe(false);
  });

  it('requestFocusLandscape faz lock("landscape") em viewport retrato', async () => {
    setViewport(400, 800);
    const lock = vi.fn().mockResolvedValue(undefined);
    mockOrientation({ lock, unlock: vi.fn() });

    const ok = await requestFocusLandscape();
    expect(ok).toBe(true);
    expect(lock).toHaveBeenCalledWith('landscape');
  });

  it('requestFocusLandscape não faz lock em viewport já landscape', async () => {
    setViewport(800, 400);
    const lock = vi.fn();
    mockOrientation({ lock, unlock: vi.fn() });

    const ok = await requestFocusLandscape();
    expect(ok).toBe(false);
    expect(lock).not.toHaveBeenCalled();
  });

  it('requestFocusLandscape degrada sem API de orientação (fallback)', async () => {
    setViewport(400, 800);
    mockOrientation(undefined);
    expect(await requestFocusLandscape()).toBe(false);
  });

  it('requestFocusLandscape degrada quando o lock rejeita', async () => {
    setViewport(400, 800);
    mockOrientation({ lock: vi.fn().mockRejectedValue(new Error('denied')) });
    expect(await requestFocusLandscape()).toBe(false);
  });

  it('releaseFocusOrientation chama unlock', async () => {
    const unlock = vi.fn().mockResolvedValue(undefined);
    mockOrientation({ unlock });
    await releaseFocusOrientation();
    expect(unlock).toHaveBeenCalledTimes(1);
  });

  it('releaseFocusOrientation é no-op seguro sem API', async () => {
    mockOrientation(undefined);
    await expect(releaseFocusOrientation()).resolves.toBeUndefined();
  });
});