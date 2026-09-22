import { describe, expect, it } from 'vitest';
import {
  EXIT_BACK_WINDOW_MS,
  initialBackExitState,
  resolveBackExit,
} from '../exitBack';

describe('resolveBackExit (double back to exit)', () => {
  it('primeiro back na raiz retorna ação toast e grava o timestamp', () => {
    const res = resolveBackExit(initialBackExitState(), 1000);
    expect(res.action).toBe('toast');
    expect(res.state.lastBackAt).toBe(1000);
  });

  it('segundo back dentro da janela retorna ação exit e zera o estado', () => {
    let res = resolveBackExit(initialBackExitState(), 1000);
    res = resolveBackExit(res.state, 1000 + EXIT_BACK_WINDOW_MS);
    expect(res.action).toBe('exit');
    expect(res.state).toEqual(initialBackExitState());
  });

  it('back fora da janela volta a pedir toast (re-arma o timer)', () => {
    let res = resolveBackExit(initialBackExitState(), 1000);
    res = resolveBackExit(res.state, 1000 + EXIT_BACK_WINDOW_MS + 1);
    expect(res.action).toBe('toast');
    expect(res.state.lastBackAt).toBe(1000 + EXIT_BACK_WINDOW_MS + 1);
  });

  it('respeita uma janela custom', () => {
    let res = resolveBackExit(initialBackExitState(), 0, 500);
    res = resolveBackExit(res.state, 501, 500);
    expect(res.action).toBe('toast');
    res = resolveBackExit(res.state, 640, 500);
    expect(res.action).toBe('exit');
  });
});